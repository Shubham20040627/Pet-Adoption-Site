from datetime import datetime, timezone
from bson import ObjectId
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.hashers import make_password, check_password

from config.mongodb import get_db, serialize_doc
from config.auth import generate_jwt_token, IsAuthenticatedMongoUser

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Register a new user as either 'adopter' or 'shelter'.
    Stores record directly in MongoDB users and shelters collections.
    """
    data = request.data
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', 'adopter').strip().lower()
    phone = data.get('phone', '').strip()
    address = data.get('address', '').strip()
    
    # Extra fields for shelter
    shelter_name = data.get('shelter_name', '').strip() or name
    shelter_bio = data.get('shelter_bio', '').strip()
    registration_number = data.get('registration_number', '').strip()
    facility_type = data.get('facility_type', '').strip() or 'Registered Non-Profit (NGO)'
    logo_url = data.get('logo_url', '').strip()

    if role == 'shelter' and not registration_number:
        import random
        registration_number = f"AWBI-2026-{random.randint(1000, 9999)}"

    if not name or not email or not password:
        return Response(
            {'error': 'Please provide name, email, and password.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if role not in ['adopter', 'shelter']:
        return Response(
            {'error': "Role must be either 'adopter' or 'shelter'."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(password) < 6:
        return Response(
            {'error': 'Password must be at least 6 characters long.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    db = get_db()
    existing_user = db.users.find_one({'email': email})
    if existing_user:
        return Response(
            {'error': 'An account with this email already exists.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    now = datetime.now(timezone.utc)
    hashed_password = make_password(password)

    user_doc = {
        'name': name,
        'email': email,
        'password': hashed_password,
        'role': role,
        'phone': phone,
        'address': address,
        'registration_number': registration_number if role == 'shelter' else '',
        'facility_type': facility_type if role == 'shelter' else '',
        'logo_url': logo_url if role == 'shelter' else '',
        'created_at': now,
        'updated_at': now,
    }

    insert_result = db.users.insert_one(user_doc)
    user_id = insert_result.inserted_id
    user_doc['_id'] = user_id

    # If role is shelter, initialize shelter record in shelters collection with status pending
    if role == 'shelter':
        user_doc['status'] = 'pending'
        shelter_doc = {
            'user_id': str(user_id),
            'shelter_name': shelter_name,
            'contact_email': email,
            'phone': phone,
            'address': address,
            'bio': shelter_bio,
            'registration_number': registration_number,
            'facility_type': facility_type,
            'logo_url': logo_url,
            'verified': False,
            'status': 'pending',
            'created_at': now,
            'updated_at': now,
        }
        db.shelters.insert_one(shelter_doc)
        db.users.update_one({'_id': user_id}, {'$set': {'status': 'pending'}})

        # Notify Admin that a shelter requires approval
        db.notifications.insert_one({
            'user_id': 'admin',
            'recipient_role': 'admin',
            'title': 'New Shelter Approval Required',
            'message': f'Shelter "{shelter_name}" ({email}) has registered and is awaiting your review.',
            'type': 'shelter_application',
            'shelter_id': str(user_id),
            'read': False,
            'created_at': now,
        })

    # In-app welcome notification for user
    db.notifications.insert_one({
        'user_id': str(user_id),
        'title': 'Welcome to PawConnect!',
        'message': f"Welcome {name}! {'Your shelter application has been submitted to the Admin for approval.' if role == 'shelter' else 'Start exploring pets and making forever friendships.'}",
        'type': 'welcome',
        'read': False,
        'created_at': now,
    })

    token = generate_jwt_token(user_doc)

    user_response = serialize_doc(user_doc)
    user_response.pop('password', None)
    if role == 'shelter':
        user_response['status'] = 'pending'
        user_response['verified'] = False
        if 'shelter_doc' in locals() and shelter_doc:
            user_response['shelter'] = serialize_doc(shelter_doc)

    return Response({
        'message': 'Account created successfully! Dashboard access is available while administrative review is in progress.',
        'token': token,
        'user': user_response
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Authenticate user with email and password from MongoDB.
    Returns JWT token and user profile.
    """
    data = request.data
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return Response(
            {'error': 'Please provide email and password.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    db = get_db()
    user_doc = db.users.find_one({'email': email})

    if not user_doc or not check_password(password, user_doc.get('password', '')):
        return Response(
            {'error': 'Invalid email or password.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    token = generate_jwt_token(user_doc)
    user_response = serialize_doc(user_doc)
    user_response.pop('password', None)

    # Attach shelter info if applicable
    if user_doc.get('role') == 'shelter':
        shelter_doc = db.shelters.find_one({'user_id': str(user_doc['_id'])})
        if shelter_doc:
            user_response['shelter'] = serialize_doc(shelter_doc)
            user_response['status'] = shelter_doc.get('status', user_doc.get('status', 'pending'))
            user_response['verified'] = shelter_doc.get('verified', user_doc.get('verified', False))
        else:
            user_response['status'] = user_doc.get('status', 'pending')
            user_response['verified'] = user_doc.get('verified', False)

    return Response({
        'message': 'Logged in successfully.',
        'token': token,
        'user': user_response
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticatedMongoUser])
def me_view(request):
    """
    Get or update the current authenticated user's profile.
    """
    db = get_db()
    user_id = request.user.id

    if request.method == 'GET':
        user_doc = db.users.find_one({'_id': ObjectId(user_id)})
        if not user_doc:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        user_response = serialize_doc(user_doc)
        user_response.pop('password', None)

        if user_doc.get('role') == 'shelter':
            shelter_doc = db.shelters.find_one({'user_id': user_id})
            if shelter_doc:
                user_response['shelter'] = serialize_doc(shelter_doc)
                user_response['status'] = shelter_doc.get('status', user_doc.get('status', 'pending'))
                user_response['verified'] = shelter_doc.get('verified', user_doc.get('verified', False))
            else:
                user_response['status'] = user_doc.get('status', 'pending')
                user_response['verified'] = user_doc.get('verified', False)

        return Response(user_response, status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        data = request.data
        updates = {
            'name': data.get('name', request.user.name).strip(),
            'phone': data.get('phone', request.user.phone).strip(),
            'address': data.get('address', request.user.doc.get('address', '')).strip(),
            'updated_at': datetime.now(timezone.utc)
        }

        # Optional password update
        new_password = data.get('new_password')
        if new_password and len(new_password) >= 6:
            updates['password'] = make_password(new_password)

        db.users.update_one({'_id': ObjectId(user_id)}, {'$set': updates})

        # Update shelter profile if user is a shelter
        if request.user.role == 'shelter':
            shelter_updates = {
                'shelter_name': data.get('shelter_name', updates['name']),
                'phone': updates['phone'],
                'address': updates['address'],
                'bio': data.get('shelter_bio', '').strip(),
                'updated_at': datetime.now(timezone.utc)
            }
            db.shelters.update_one({'user_id': user_id}, {'$set': shelter_updates})

        updated_user = db.users.find_one({'_id': ObjectId(user_id)})
        resp = serialize_doc(updated_user)
        resp.pop('password', None)
        return Response({'message': 'Profile updated successfully.', 'user': resp})
