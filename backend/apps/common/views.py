from datetime import datetime, timezone
from bson import ObjectId
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from config.mongodb import get_db, serialize_doc, serialize_docs, ping_db
from config.auth import IsAuthenticatedMongoUser

# ================= FAVORITES =================
@api_view(['GET'])
@permission_classes([IsAuthenticatedMongoUser])
def list_favorites(request):
    """List favorite pets for the current logged-in user."""
    db = get_db()
    fav_cursor = db.favorites.find({'user_id': request.user.id}).sort('created_at', -1)
    favs = list(fav_cursor)

    pet_ids = []
    for f in favs:
        try:
            pet_ids.append(ObjectId(f['pet_id']))
        except Exception:
            pass

    pets = []
    if pet_ids:
        pets_cursor = db.pets.find({'_id': {'$in': pet_ids}})
        pets = serialize_docs(pets_cursor)

    return Response({
        'count': len(pets),
        'pets': pets,
        'favorite_ids': [str(f['pet_id']) for f in favs]
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticatedMongoUser])
def toggle_favorite(request):
    """Toggle a pet in/out of current user's favorites in MongoDB."""
    data = request.data
    pet_id = data.get('pet_id')
    if not pet_id:
        return Response({'error': 'pet_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

    db = get_db()
    user_id = request.user.id

    existing = db.favorites.find_one({'user_id': user_id, 'pet_id': pet_id})
    if existing:
        db.favorites.delete_one({'_id': existing['_id']})
        return Response({'is_favorite': False, 'message': 'Removed from favorites.'}, status=status.HTTP_200_OK)
    else:
        db.favorites.insert_one({
            'user_id': user_id,
            'pet_id': pet_id,
            'created_at': datetime.now(timezone.utc)
        })
        return Response({'is_favorite': True, 'message': 'Added to favorites!'}, status=status.HTTP_201_CREATED)


# ================= NOTIFICATIONS =================
@api_view(['GET'])
@permission_classes([IsAuthenticatedMongoUser])
def list_notifications(request):
    """List notifications for current user with unread counter."""
    db = get_db()
    notifs_cursor = db.notifications.find({'user_id': request.user.id}).sort('created_at', -1).limit(30)
    notifs = serialize_docs(notifs_cursor)
    unread_count = db.notifications.count_documents({'user_id': request.user.id, 'read': False})

    return Response({
        'unread_count': unread_count,
        'notifications': notifs
    }, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticatedMongoUser])
def mark_notification_read(request, notif_id):
    """Mark single notification as read."""
    db = get_db()
    try:
        db.notifications.update_one(
            {'_id': ObjectId(notif_id), 'user_id': request.user.id},
            {'$set': {'read': True}}
        )
        return Response({'message': 'Marked as read.'}, status=status.HTTP_200_OK)
    except Exception:
        return Response({'error': 'Invalid notification ID.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticatedMongoUser])
def mark_all_notifications_read(request):
    """Mark all notifications as read for current user."""
    db = get_db()
    db.notifications.update_many(
        {'user_id': request.user.id, 'read': False},
        {'$set': {'read': True}}
    )
    return Response({'message': 'All notifications marked as read.'}, status=status.HTTP_200_OK)


# ================= CONTACT FORM =================
@api_view(['POST'])
@permission_classes([AllowAny])
def contact_message(request):
    """
    Submits a contact inquiry form and saves record into MongoDB contact_messages collection.
    """
    data = request.data
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    subject = data.get('subject', 'General Inquiry').strip()
    message = data.get('message', '').strip()

    if not name or not email or not message:
        return Response(
            {'error': 'Name, email, and message are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    db = get_db()
    now = datetime.now(timezone.utc)
    doc = {
        'name': name,
        'email': email,
        'subject': subject,
        'message': message,
        'created_at': now,
        'status': 'received'
    }
    db.contact_messages.insert_one(doc)

    return Response({
        'message': 'Thank you! Your message has been received. Our team will get back to you soon.'
    }, status=status.HTTP_201_CREATED)


# ================= HEALTH & VIVA DEMO STATS =================
@api_view(['GET'])
@permission_classes([AllowAny])
def health_status(request):
    """
    Returns platform health and live MongoDB stats.
    Great for viva and evaluation verification.
    """
    db = get_db()
    is_connected, msg = ping_db()

    stats = {}
    if is_connected:
        stats = {
            'users_count': db.users.count_documents({}),
            'shelters_count': db.shelters.count_documents({}),
            'pets_count': db.pets.count_documents({}),
            'applications_count': db.applications.count_documents({}),
            'favorites_count': db.favorites.count_documents({}),
            'contact_messages_count': db.contact_messages.count_documents({}),
        }

    return Response({
        'status': 'healthy' if is_connected else 'unhealthy',
        'mongodb_connected': is_connected,
        'mongodb_message': msg,
        'database_stats': stats,
        'version': '1.0.0',
    }, status=status.HTTP_200_OK)


# ================= ADOPTION READINESS CHECKLIST =================
@api_view(['POST'])
@permission_classes([AllowAny])
def assess_readiness(request):
    """
    Feature 2: Evaluates interactive checklist submission.
    Calculates readiness percentage and returns educational recommendations.
    Guidance only, does not alter database approvals directly.
    """
    answers = request.data.get('answers', {})
    
    # 5 Key checklist dimensions
    dimensions = [
        {'key': 'daily_time', 'label': 'Daily Time & Attention (2+ hours/day)'},
        {'key': 'budget', 'label': 'Budget for Food, Medical Care & Supplies'},
        {'key': 'living_space', 'label': 'Pet-Friendly Housing & Safety'},
        {'key': 'household_agreement', 'label': 'Household & Family Consensus'},
        {'key': 'long_term_commitment', 'label': '10-15+ Year Commitment'},
    ]

    checked_count = sum(1 for d in dimensions if bool(answers.get(d['key'])))
    total = len(dimensions)
    score_pct = int((checked_count / total) * 100)

    if score_pct == 100:
        badge = "Fully Ready"
        advice = "You have checked all essential adoption responsibilities! You are well prepared to provide a loving forever home."
    elif score_pct >= 60:
        badge = "Almost Ready"
        advice = "You have a solid foundation! Review any unchecked areas to ensure your home and schedule are completely pet-ready."
    else:
        badge = "Getting Ready"
        advice = "Take your time to prepare your home, family, and financial plan before taking on the rewarding responsibility of a pet."

    return Response({
        'score_percentage': score_pct,
        'completed_items': checked_count,
        'total_items': total,
        'badge': badge,
        'advice': advice,
    }, status=status.HTTP_200_OK)
