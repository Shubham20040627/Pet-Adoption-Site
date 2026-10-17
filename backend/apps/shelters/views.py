from datetime import datetime, timezone
from bson import ObjectId
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from config.mongodb import get_db, serialize_doc, serialize_docs
from config.auth import IsShelter

@api_view(['GET'])
@permission_classes([IsShelter])
def shelter_dashboard(request):
    """
    Returns real-time MongoDB statistics and overview for the logged-in shelter:
    - total_pets
    - available_pets
    - pending_applications
    - approved_applications
    - completed_adoptions
    - recent_applications
    - pets_list
    """
    db = get_db()
    shelter_id = request.user.id
    shelter_id_str = str(shelter_id)
    shelter_id_filter = {
        '$in': [shelter_id_str, ObjectId(shelter_id_str)] if ObjectId.is_valid(shelter_id_str) else [shelter_id_str]
    }

    # Pets counts
    total_pets = db.pets.count_documents({'shelter_id': shelter_id_filter, 'status': {'$ne': 'archived'}})
    available_pets = db.pets.count_documents({'shelter_id': shelter_id_filter, 'status': 'available'})
    adopted_pets = db.pets.count_documents({'shelter_id': shelter_id_filter, 'status': 'adopted'})
    pending_pets = db.pets.count_documents({'shelter_id': shelter_id_filter, 'status': 'pending'})

    # Applications counts
    pending_apps = db.applications.count_documents({
        'shelter_id': shelter_id_filter,
        'status': {'$in': ['submitted', 'under_review']}
    })
    approved_apps = db.applications.count_documents({
        'shelter_id': shelter_id_filter,
        'status': 'approved'
    })
    completed_apps = db.applications.count_documents({
        'shelter_id': shelter_id_filter,
        'status': 'completed'
    })

    # Visits counts
    total_visits = db.visits.count_documents({'shelter_id': shelter_id_filter})
    upcoming_visits = db.visits.count_documents({
        'shelter_id': shelter_id_filter,
        'status': {'$in': ['pending', 'confirmed']}
    })

    # Recent applications
    recent_apps_cursor = db.applications.find({'shelter_id': shelter_id_filter}).sort('created_at', -1).limit(5)
    recent_apps = serialize_docs(recent_apps_cursor)
    for app in recent_apps:
        try:
            pet = db.pets.find_one({'_id': ObjectId(app['pet_id'])})
            app['pet_name'] = pet.get('name') if pet else 'Unknown Pet'
            app['pet_image'] = pet.get('image_url') if pet else ''
        except Exception:
            pass

    # Recent pets
    recent_pets_cursor = db.pets.find({'shelter_id': shelter_id_filter}).sort('created_at', -1).limit(6)
    recent_pets = serialize_docs(recent_pets_cursor)

    # Recent visits
    recent_visits_cursor = db.visits.find({'shelter_id': shelter_id_filter}).sort('created_at', -1).limit(5)
    recent_visits = serialize_docs(recent_visits_cursor)
    for v in recent_visits:
        v['visit_time'] = v.get('time_slot') or v.get('visit_time') or ''
        v['time_slot'] = v['visit_time']
        if (not v.get('pet_name') or not v.get('pet_image')) and v.get('pet_id'):
            try:
                p = db.pets.find_one({'_id': ObjectId(v['pet_id'])})
                if p:
                    if not v.get('pet_name'):
                        v['pet_name'] = p.get('name')
                    if not v.get('pet_image'):
                        v['pet_image'] = p.get('image_url') or p.get('photo_url') or ''
                    if not v.get('pet_breed'):
                        v['pet_breed'] = p.get('breed') or p.get('species')
            except Exception:
                pass

    # Shelter status and verification
    shelter_doc = db.shelters.find_one({'user_id': shelter_id_str})
    shelter_status = 'pending'
    is_verified = False
    admin_note = ''
    if shelter_doc:
        shelter_status = shelter_doc.get('status', 'pending')
        is_verified = shelter_doc.get('verified', False)
        admin_note = shelter_doc.get('admin_note', '')
    else:
        shelter_status = request.user.doc.get('status', 'pending')
        is_verified = request.user.doc.get('verified', False)

    return Response({
        'shelter_status': shelter_status,
        'verified': is_verified,
        'admin_note': admin_note,
        'stats': {
            'total_listings': total_pets,
            'available_pets': available_pets,
            'pending_pets': pending_pets,
            'adopted_pets': adopted_pets,
            'pending_applications': pending_apps,
            'approved_applications': approved_apps,
            'completed_adoptions': completed_apps,
            'total_visits': total_visits,
            'upcoming_visits': upcoming_visits,
        },
        'recent_applications': recent_apps,
        'recent_pets': recent_pets,
        'recent_visits': recent_visits
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsShelter])
def shelter_my_pets(request):
    """
    Get all pets created by this shelter, including available, pending, and adopted.
    Strictly isolated to the logged-in shelter only.
    """
    db = get_db()
    shelter_id_str = str(request.user.id)
    shelter_id_filter = {
        '$in': [shelter_id_str, ObjectId(shelter_id_str)] if ObjectId.is_valid(shelter_id_str) else [shelter_id_str]
    }
    pets_cursor = db.pets.find({'shelter_id': shelter_id_filter, 'status': {'$ne': 'archived'}}).sort('created_at', -1)
    pets = serialize_docs(pets_cursor)

    return Response({
        'count': len(pets),
        'pets': pets
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'PUT'])
@permission_classes([IsShelter])
def shelter_profile(request):
    """
    View or update shelter profile in MongoDB.
    """
    db = get_db()
    shelter_id = request.user.id

    if request.method == 'GET':
        shelter_doc = db.shelters.find_one({'user_id': shelter_id})
        if not shelter_doc:
            user_reg = request.user.doc.get('registration_number', '') or 'AWBI-2026-8941'
            user_type = request.user.doc.get('facility_type', '') or 'Registered Non-Profit (NGO)'
            user_logo = request.user.doc.get('logo_url', '')
            # Create a default profile if not present
            shelter_doc = {
                'user_id': shelter_id,
                'shelter_name': request.user.name,
                'contact_email': request.user.email,
                'phone': request.user.phone,
                'address': request.user.doc.get('address', ''),
                'bio': 'Dedicated to finding loving homes for wonderful pets.',
                'registration_number': user_reg,
                'facility_type': user_type,
                'logo_url': user_logo,
                'verified': request.user.doc.get('verified', False),
                'created_at': datetime.now(timezone.utc),
            }
            db.shelters.insert_one(shelter_doc)
        else:
            if not shelter_doc.get('status'):
                shelter_doc['status'] = request.user.doc.get('status', 'pending')
            if not shelter_doc.get('registration_number'):
                shelter_doc['registration_number'] = request.user.doc.get('registration_number') or 'AWBI-2026-8941'
            if not shelter_doc.get('facility_type'):
                shelter_doc['facility_type'] = request.user.doc.get('facility_type') or 'Registered Non-Profit (NGO)'
            if not shelter_doc.get('logo_url'):
                shelter_doc['logo_url'] = request.user.doc.get('logo_url', '')

        return Response(serialize_doc(shelter_doc), status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        data = request.data
        updates = {
            'shelter_name': data.get('shelter_name', request.user.name).strip(),
            'phone': data.get('phone', request.user.phone).strip(),
            'address': data.get('address', '').strip(),
            'bio': data.get('bio', '').strip(),
            'registration_number': data.get('registration_number', '').strip(),
            'facility_type': data.get('facility_type', 'Registered Non-Profit (NGO)').strip(),
            'logo_url': data.get('logo_url', '').strip(),
            'website': data.get('website', '').strip(),
            'operating_hours': data.get('operating_hours', '9:00 AM - 5:00 PM').strip(),
            'updated_at': datetime.now(timezone.utc)
        }
        db.shelters.update_one({'user_id': shelter_id}, {'$set': updates}, upsert=True)
        updated = db.shelters.find_one({'user_id': shelter_id})
        return Response({'message': 'Shelter profile updated successfully.', 'profile': serialize_doc(updated)})

