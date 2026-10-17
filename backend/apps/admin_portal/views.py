from datetime import datetime, timezone
from bson import ObjectId
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from config.mongodb import get_db, serialize_doc, serialize_docs
from config.auth import IsAdmin

@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_overview(request):
    """
    Returns platform-wide administrative metrics:
    - Shelter verification counts (Pending, Approved, Rejected)
    - Total pets, applications, adoptions, adopters
    - Recent activity notifications
    """
    db = get_db()

    total_shelters = db.shelters.count_documents({})
    pending_shelters = db.shelters.count_documents({'status': {'$in': ['pending', None, '']}})
    approved_shelters = db.shelters.count_documents({'status': 'approved'})
    rejected_shelters = db.shelters.count_documents({'status': 'rejected'})

    total_pets = db.pets.count_documents({'status': {'$ne': 'archived'}})
    available_pets = db.pets.count_documents({'status': 'available'})
    adopted_pets = db.pets.count_documents({'status': 'adopted'})

    total_apps = db.applications.count_documents({})
    approved_apps = db.applications.count_documents({'status': {'$in': ['approved', 'completed']}})
    total_adopters = db.users.count_documents({'role': 'adopter'})

    # Recent pending shelters queue
    pending_cursor = db.shelters.find({'status': {'$in': ['pending', None, '']}}).sort('created_at', -1).limit(5)
    pending_list = serialize_docs(pending_cursor)

    return Response({
        'stats': {
            'total_shelters': total_shelters,
            'pending_shelters': pending_shelters,
            'approved_shelters': approved_shelters,
            'rejected_shelters': rejected_shelters,
            'total_pets': total_pets,
            'available_pets': available_pets,
            'adopted_pets': adopted_pets,
            'total_applications': total_apps,
            'approved_applications': approved_apps,
            'total_adopters': total_adopters,
        },
        'pending_queue': pending_list,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_shelters_list(request):
    """
    Returns all shelters in the system with their status and associated stats.
    Supports filter by status (pending, approved, rejected, all) and search.
    """
    db = get_db()
    status_filter = request.GET.get('status', 'all').strip().lower()
    search = request.GET.get('search', '').strip().lower()

    query = {}
    if status_filter == 'pending':
        query['status'] = {'$in': ['pending', None, '']}
    elif status_filter in ['approved', 'rejected']:
        query['status'] = status_filter

    if search:
        query['$or'] = [
            {'shelter_name': {'$regex': search, '$options': 'i'}},
            {'contact_email': {'$regex': search, '$options': 'i'}},
            {'address': {'$regex': search, '$options': 'i'}}
        ]

    shelters_cursor = db.shelters.find(query).sort('created_at', -1)
    shelters = serialize_docs(shelters_cursor)

    # Enrich each shelter with user info, pet count, and application count
    for s in shelters:
        user_id_str = str(s.get('user_id', ''))
        
        # User details
        try:
            user_doc = db.users.find_one({'_id': ObjectId(user_id_str)})
            s['user_name'] = user_doc.get('name', '') if user_doc else ''
            s['user_phone'] = user_doc.get('phone', '') if user_doc else ''
        except Exception:
            s['user_name'] = ''
            s['user_phone'] = ''

        # Pet and Application count
        s['pets_count'] = db.pets.count_documents({'shelter_id': user_id_str})
        s['apps_count'] = db.applications.count_documents({'shelter_id': user_id_str})
        
        # Normalize status
        if not s.get('status'):
            s['status'] = 'approved' if s.get('verified') else 'pending'

    return Response({
        'count': len(shelters),
        'shelters': shelters
    }, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAdmin])
def admin_update_shelter_status(request, user_id):
    """
    Admin action: Approve or Disapprove (Reject) a shelter.
    user_id can be the shelter user's ID or shelter document ID.
    """
    db = get_db()
    data = request.data
    new_status = data.get('status', '').strip().lower()
    note = data.get('note', '').strip()

    if new_status not in ['approved', 'rejected', 'pending']:
        return Response(
            {'error': "Invalid status. Must be 'approved', 'rejected', or 'pending'."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Find shelter by user_id or _id
    shelter_query = {
        '$or': [
            {'user_id': user_id},
            {'_id': ObjectId(user_id)} if ObjectId.is_valid(user_id) else {'user_id': user_id}
        ]
    }
    shelter = db.shelters.find_one(shelter_query)
    if not shelter:
        return Response({'error': 'Shelter not found.'}, status=status.HTTP_404_NOT_FOUND)

    now = datetime.now(timezone.utc)
    is_verified = (new_status == 'approved')

    update_fields = {
        'status': new_status,
        'verified': is_verified,
        'reviewed_at': now,
        'admin_note': note,
        'updated_at': now
    }

    db.shelters.update_one({'_id': shelter['_id']}, {'$set': update_fields})

    # Update corresponding user document status
    target_user_id = shelter.get('user_id')
    if target_user_id:
        try:
            db.users.update_one(
                {'_id': ObjectId(target_user_id)},
                {'$set': {'status': new_status, 'verified': is_verified, 'updated_at': now}}
            )
            # If approved, publish any prepared draft pets
            if new_status == 'approved':
                db.pets.update_many(
                    {'shelter_id': target_user_id, 'status': 'draft'},
                    {'$set': {'status': 'available', 'updated_at': now}}
                )
        except Exception:
            pass

        # Send in-app notification to the shelter
        title = "🎉 Shelter Account Approved!" if new_status == 'approved' else "⚠️ Shelter Registration Update"
        msg = (
            f"Your shelter '{shelter.get('shelter_name')}' has been verified and APPROVED by PawConnect Administration. You now have full access to publish pets and review applications."
            if new_status == 'approved' else
            f"Your shelter application was {new_status}. Note from Admin: {note or 'Please review your registration details or contact admin@pawconnect.org.'}"
        )

        db.notifications.insert_one({
            'user_id': target_user_id,
            'title': title,
            'message': msg,
            'type': 'shelter_status_update',
            'related_id': str(shelter['_id']),
            'read': False,
            'created_at': now,
        })

    updated_doc = db.shelters.find_one({'_id': shelter['_id']})
    return Response({
        'message': f"Shelter has been successfully {new_status}.",
        'shelter': serialize_doc(updated_doc)
    }, status=status.HTTP_200_OK)
