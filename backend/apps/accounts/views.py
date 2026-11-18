import json
import urllib.request
from datetime import datetime, timezone
from bson import ObjectId
from django.conf import settings
from django.utils.crypto import get_random_string
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.hashers import make_password, check_password

from config.mongodb import get_db, serialize_doc
from config.auth import generate_jwt_token, IsAuthenticatedMongoUser, verify_turnstile_token

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Register a new user as either 'adopter' or 'shelter'.
    Stores record directly in MongoDB users and shelters collections.
    """
    data = request.data

    # Cloudflare Turnstile Verification Check
    turnstile_token = data.get('turnstile_token')
    client_ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))
    if not verify_turnstile_token(turnstile_token, remote_ip=client_ip):
        return Response(
            {'error': 'Security check failed. Please check the "Verify you are human" box.'},
            status=status.HTTP_400_BAD_REQUEST
        )

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

    # Cloudflare Turnstile Verification Check
    turnstile_token = data.get('turnstile_token')
    client_ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))
    if not verify_turnstile_token(turnstile_token, remote_ip=client_ip):
        return Response(
            {'error': 'Security check failed. Please check the "Verify you are human" box.'},
            status=status.HTTP_400_BAD_REQUEST
        )

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

        if 'is_readiness_verified' in data:
            updates['is_readiness_verified'] = bool(data.get('is_readiness_verified'))
        if 'readiness_cert' in data:
            updates['readiness_cert'] = data.get('readiness_cert')

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


@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth_view(request):
    """
    Authenticate or register a user using Google OAuth.
    RESTRICTED EXCLUSIVELY TO ADOPTERS:
      - Shelter and Admin accounts cannot register or sign in via Google.
      - New users registered via Google are strictly created with role 'adopter'.
    """
    data = request.data
    requested_role = (data.get('role') or 'adopter').strip().lower()

    if requested_role != 'adopter':
        return Response(
            {'error': 'Google authentication is strictly available for Adopter accounts only. Shelter and Admin accounts must register and sign in using email and password.'},
            status=status.HTTP_403_FORBIDDEN
        )

    credential = data.get('credential')
    google_data = None

    # Step 1: Verify Google ID token if provided
    if credential:
        try:
            tokeninfo_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}"
            req = urllib.request.Request(tokeninfo_url, headers={'User-Agent': 'PawConnect-Backend'})
            with urllib.request.urlopen(req, timeout=8) as response:
                if response.status == 200:
                    google_data = json.loads(response.read().decode('utf-8'))
        except Exception:
            google_data = None

    # Step 2: In DEBUG mode, allow developer simulation or mock profile if no real credential was parsed
    if not google_data and getattr(settings, 'DEBUG', True):
        email_cand = (data.get('email') or '').strip().lower()
        if email_cand:
            google_data = {
                'email': email_cand,
                'name': data.get('name') or email_cand.split('@')[0].capitalize(),
                'picture': data.get('picture') or f"https://api.dicebear.com/7.x/avataaars/svg?seed={email_cand}",
                'sub': data.get('google_id') or f"google_{int(datetime.now().timestamp())}",
            }

    if not google_data or not google_data.get('email'):
        return Response(
            {'error': 'Google authentication failed. No valid Google account or token provided.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    email = google_data.get('email').strip().lower()
    name = (google_data.get('name') or '').strip() or email.split('@')[0].capitalize()
    picture = google_data.get('picture', '')
    google_id = google_data.get('sub', '')

    db = get_db()
    user_doc = db.users.find_one({'email': email})
    now = datetime.now(timezone.utc)

    # CASE A: Existing User -> Log in (only if role is adopter)
    if user_doc:
        user_role = user_doc.get('role', 'adopter')
        if user_role != 'adopter':
            return Response(
                {
                    'error': f'Google Sign-In is only allowed for Pet Adopter accounts. This email is registered as "{user_role.capitalize()}". Please sign in using your email and password.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        update_fields = {}
        if not user_doc.get('google_id'):
            update_fields['google_id'] = google_id
        if picture and not user_doc.get('avatar_url'):
            update_fields['avatar_url'] = picture
        if update_fields:
            update_fields['updated_at'] = now
            db.users.update_one({'_id': user_doc['_id']}, {'$set': update_fields})
            user_doc.update(update_fields)

        token = generate_jwt_token(user_doc)
        user_response = serialize_doc(user_doc)
        user_response.pop('password', None)

        return Response({
            'message': 'Welcome back! Logged in with Google.',
            'token': token,
            'user': user_response,
            'is_new_user': False,
        }, status=status.HTTP_200_OK)

    # CASE B: Brand New User -> Strictly Sign Up as Adopter
    phone = data.get('phone', '').strip()
    address = data.get('address', '').strip()

    random_pw = get_random_string(32)
    hashed_password = make_password(random_pw)

    new_user_doc = {
        'name': name,
        'email': email,
        'password': hashed_password,
        'role': 'adopter',
        'phone': phone,
        'address': address,
        'auth_provider': 'google',
        'google_id': google_id,
        'avatar_url': picture,
        'registration_number': '',
        'facility_type': '',
        'logo_url': '',
        'created_at': now,
        'updated_at': now,
    }

    insert_result = db.users.insert_one(new_user_doc)
    user_id = insert_result.inserted_id
    new_user_doc['_id'] = user_id

    # In-app welcome notification for adopter
    db.notifications.insert_one({
        'user_id': str(user_id),
        'title': 'Welcome to PawConnect via Google!',
        'message': f'Welcome {name}! Your Adopter account has been created via Google. Start exploring pets and find your forever companion!',
        'type': 'welcome',
        'read': False,
        'created_at': now,
    })

    token = generate_jwt_token(new_user_doc)
    user_response = serialize_doc(new_user_doc)
    user_response.pop('password', None)

    return Response({
        'message': 'Adopter account created successfully with Google!',
        'token': token,
        'user': user_response,
        'is_new_user': True,
    }, status=status.HTTP_201_CREATED)
