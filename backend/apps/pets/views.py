import os
from datetime import datetime, timezone
from bson import ObjectId
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.core.files.storage import default_storage

from config.mongodb import get_db, serialize_doc, serialize_docs
from config.auth import IsShelter, IsAuthenticatedMongoUser
from apps.pets.matching import match_pet

@api_view(['GET'])
@permission_classes([AllowAny])
def list_pets(request):
    """
    Public and filtered listing of pets.
    Supports search query, species, breed, age, gender, size, location, and status.
    """
    db = get_db()
    query = {}

    # Status filter - default to available unless specified
    req_status = request.GET.get('status', 'available')
    if req_status and req_status != 'all':
        query['status'] = req_status

    # Search keyword in name or breed
    search = request.GET.get('search', '').strip()
    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'breed': {'$regex': search, '$options': 'i'}},
            {'location': {'$regex': search, '$options': 'i'}},
        ]

    # Species filter
    species = request.GET.get('species', '').strip()
    if species and species.lower() != 'all':
        query['species'] = {'$regex': f"^{species}$", '$options': 'i'}

    # Gender filter
    gender = request.GET.get('gender', '').strip()
    if gender and gender.lower() != 'all':
        query['gender'] = {'$regex': f"^{gender}$", '$options': 'i'}

    # Size filter
    size = request.GET.get('size', '').strip()
    if size and size.lower() != 'all':
        query['size'] = {'$regex': f"^{size}$", '$options': 'i'}

    # Location filter
    location = request.GET.get('location', '').strip()
    if location:
        query['location'] = {'$regex': location, '$options': 'i'}

    # Shelter filter
    shelter_id = request.GET.get('shelter_id', '').strip()
    if shelter_id:
        query['shelter_id'] = shelter_id

    # Filter by specific IDs (e.g. for comparison)
    ids_param = request.GET.get('ids', '').strip()
    if ids_param:
        try:
            id_list = [ObjectId(x.strip()) for x in ids_param.split(',') if x.strip()]
            if id_list:
                query['_id'] = {'$in': id_list}
        except Exception:
            pass

    # Fetch pets sorted by newest first
    pets_cursor = db.pets.find(query).sort('created_at', -1)
    pets = serialize_docs(pets_cursor)

    # Attach shelter name if available
    shelter_ids = list({p.get('shelter_id') for p in pets if p.get('shelter_id')})
    if shelter_ids:
        shelters_by_uid = {}
        for s in db.shelters.find({'user_id': {'$in': shelter_ids}}):
            shelters_by_uid[s.get('user_id')] = s.get('shelter_name')
        for p in pets:
            sid = p.get('shelter_id')
            if not p.get('shelter_name') and sid in shelters_by_uid:
                p['shelter_name'] = shelters_by_uid[sid]

    return Response({
        'count': len(pets),
        'pets': pets
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def pet_detail(request, pet_id):
    """Get single pet details by ID along with shelter contact details."""
    db = get_db()
    try:
        pet = db.pets.find_one({'_id': ObjectId(pet_id)})
    except Exception:
        return Response({'error': 'Invalid pet ID.'}, status=status.HTTP_400_BAD_REQUEST)

    if not pet:
        return Response({'error': 'Pet not found.'}, status=status.HTTP_404_NOT_FOUND)

    pet_data = serialize_doc(pet)

    # Fetch shelter details
    shelter_user_id = pet.get('shelter_id')
    if shelter_user_id:
        shelter_doc = db.shelters.find_one({'user_id': shelter_user_id})
        if not shelter_doc:
            # Fallback to user doc
            try:
                user_doc = db.users.find_one({'_id': ObjectId(shelter_user_id)})
                if user_doc:
                    shelter_doc = {
                        'shelter_name': user_doc.get('name', 'PawConnect Shelter'),
                        'contact_email': user_doc.get('email', ''),
                        'phone': user_doc.get('phone', ''),
                        'address': user_doc.get('address', ''),
                    }
            except Exception:
                pass
        pet_data['shelter'] = serialize_doc(shelter_doc) if shelter_doc else None

    return Response(pet_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsShelter])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def create_pet(request):
    """
    Shelter adds a new pet for adoption.
    Supports file uploads or direct image URLs.
    """
    db = get_db()

    # Verify shelter approval status
    shelter_doc = db.shelters.find_one({'user_id': request.user.user_id})
    shelter_status = (shelter_doc.get('status') if shelter_doc else None) or request.user.doc.get('status', 'pending')
    is_approved = (shelter_status == 'approved' or (shelter_doc and shelter_doc.get('verified', False)))

    if shelter_status == 'rejected':
        return Response(
            {'error': 'Your shelter registration was not approved by the administrator. Contact support for assistance.'},
            status=status.HTTP_403_FORBIDDEN
        )

    data = request.data

    name = data.get('name', '').strip()
    species = data.get('species', 'Dog').strip()
    breed = data.get('breed', '').strip()
    gender = data.get('gender', 'Male').strip()
    
    try:
        age = float(data.get('age', 1))
    except (ValueError, TypeError):
        age = 1.0

    if not name or not breed:
        return Response(
            {'error': 'Pet name and breed are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Handle image upload
    image_url = data.get('image_url', '').strip()
    image_file = request.FILES.get('image')

    if image_file:
        os.makedirs(os.path.join(settings.MEDIA_ROOT, 'pets'), exist_ok=True)
        filename = f"pet_{int(datetime.now().timestamp())}_{image_file.name.replace(' ', '_')}"
        save_path = os.path.join('pets', filename)
        full_path = default_storage.save(save_path, image_file)
        image_url = f"{settings.MEDIA_URL}{full_path}"

    if not image_url:
        # Default friendly placeholder photo depending on species
        if species.lower() == 'cat':
            image_url = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop"
        else:
            image_url = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop"

    def parse_bool(val):
        if isinstance(val, bool):
            return val
        return str(val).lower() in ['true', '1', 'yes']

    now = datetime.now(timezone.utc)
    pet_status = data.get('status', 'available') if is_approved else 'draft'

    pet_doc = {
        'shelter_id': request.user.id,
        'name': name,
        'species': species,
        'breed': breed,
        'age': age,
        'age_unit': data.get('age_unit', 'years'),
        'gender': gender,
        'size': data.get('size', 'Medium').strip(),
        'activity_level': data.get('activity_level', 'Moderate').strip(),
        'location': data.get('location', request.user.doc.get('address', 'Downtown Shelter')).strip(),
        'description': data.get('description', '').strip(),
        'health_status': data.get('health_status', 'Healthy and vaccinated').strip(),
        'vaccination_status': data.get('vaccination_status', 'Fully Vaccinated (Core + Rabies)').strip(),
        'deworming_status': data.get('deworming_status', 'Completed - Up to Date').strip(),
        'last_deworming_date': data.get('last_deworming_date', '2026-08-15').strip(),
        'medical_conditions': data.get('medical_conditions', 'None - Clinically healthy').strip(),
        'special_care_requirements': data.get('special_care_requirements', 'Standard balanced nutrition and daily walks').strip(),
        'last_health_check_date': data.get('last_health_check_date', '2026-09-10').strip(),
        'next_vaccination_date': data.get('next_vaccination_date', '2027-03-15').strip(),
        'microchip_number': data.get('microchip_number', '').strip() or f"985141{abs(hash(name)) % 1000000000:09d}",
        'spayed_neutered': parse_bool(data.get('spayed_neutered', True)),
        'vaccinated': parse_bool(data.get('vaccinated', True)),
        'good_with_kids': parse_bool(data.get('good_with_kids', True)),
        'good_with_pets': parse_bool(data.get('good_with_pets', True)),
        'status': pet_status,
        'is_draft': (not is_approved),
        'featured': parse_bool(data.get('featured', False)),
        'image_url': image_url,
        'created_at': now,
        'updated_at': now,
    }

    insert_result = db.pets.insert_one(pet_doc)
    pet_doc['_id'] = insert_result.inserted_id

    message_text = (
        f"Pet '{name}' saved as draft. It will automatically go live once your shelter account is approved by admin!"
        if not is_approved else
        f"Pet '{name}' listed successfully!"
    )

    return Response({
        'message': message_text,
        'pet': serialize_doc(pet_doc),
        'is_draft': (not is_approved)
    }, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsShelter])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def update_pet(request, pet_id):
    """
    Shelter updates their own pet listing.
    Ensures shelter ownership before updating.
    """
    db = get_db()
    try:
        pet = db.pets.find_one({'_id': ObjectId(pet_id)})
    except Exception:
        return Response({'error': 'Invalid pet ID.'}, status=status.HTTP_400_BAD_REQUEST)

    if not pet:
        return Response({'error': 'Pet not found.'}, status=status.HTTP_404_NOT_FOUND)

    if str(pet.get('shelter_id')) != str(request.user.id):
        return Response(
            {'error': 'You do not have permission to edit this pet.'},
            status=status.HTTP_403_FORBIDDEN
        )

    data = request.data
    updates = {'updated_at': datetime.now(timezone.utc)}

    for field in ['name', 'species', 'breed', 'gender', 'size', 'activity_level',
                  'location', 'description', 'health_status', 'status', 'age_unit',
                  'vaccination_status', 'deworming_status', 'last_deworming_date',
                  'medical_conditions', 'special_care_requirements', 'last_health_check_date',
                  'next_vaccination_date', 'microchip_number']:
        if field in data:
            updates[field] = str(data[field]).strip()

    if 'age' in data:
        try:
            updates['age'] = float(data['age'])
        except (ValueError, TypeError):
            pass

    def parse_bool(val):
        if isinstance(val, bool):
            return val
        return str(val).lower() in ['true', '1', 'yes']

    for bfield in ['spayed_neutered', 'vaccinated', 'good_with_kids', 'good_with_pets', 'featured']:
        if bfield in data:
            updates[bfield] = parse_bool(data[bfield])

    # Handle image update
    image_file = request.FILES.get('image')
    if image_file:
        os.makedirs(os.path.join(settings.MEDIA_ROOT, 'pets'), exist_ok=True)
        filename = f"pet_{int(datetime.now().timestamp())}_{image_file.name.replace(' ', '_')}"
        save_path = os.path.join('pets', filename)
        full_path = default_storage.save(save_path, image_file)
        updates['image_url'] = f"{settings.MEDIA_URL}{full_path}"
    elif 'image_url' in data and data['image_url']:
        updates['image_url'] = str(data['image_url']).strip()

    db.pets.update_one({'_id': ObjectId(pet_id)}, {'$set': updates})
    updated_pet = db.pets.find_one({'_id': ObjectId(pet_id)})

    return Response({
        'message': 'Pet details updated successfully.',
        'pet': serialize_doc(updated_pet)
    }, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsShelter])
def delete_pet(request, pet_id):
    """
    Shelter removes or archives a pet listing.
    """
    db = get_db()
    try:
        pet = db.pets.find_one({'_id': ObjectId(pet_id)})
    except Exception:
        return Response({'error': 'Invalid pet ID.'}, status=status.HTTP_400_BAD_REQUEST)

    if not pet:
        return Response({'error': 'Pet not found.'}, status=status.HTTP_404_NOT_FOUND)

    if str(pet.get('shelter_id')) != str(request.user.id):
        return Response(
            {'error': 'You do not have permission to delete this pet.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Soft delete / archive to preserve history
    db.pets.update_one({'_id': ObjectId(pet_id)}, {'$set': {
        'status': 'archived',
        'updated_at': datetime.now(timezone.utc)
    }})

    return Response({
        'message': f"Pet '{pet.get('name')}' has been archived successfully."
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def pawmatch_recommendations(request):
    """
    PawMatch: Rule-based matching engine.
    Matches adopters with available pets based on lifestyle and preferences.
    """
    preferences = request.data
    db = get_db()

    available_pets = list(db.pets.find({'status': 'available'}))
    if not available_pets:
        return Response({'recommendations': []}, status=status.HTTP_200_OK)

    results = []
    for pet in available_pets:
        eval_result = match_pet(pet, preferences)
        serialized_pet = serialize_doc(pet)
        serialized_pet['match_score'] = eval_result['score']
        serialized_pet['match_reasons'] = eval_result['reasons']
        serialized_pet['match_percentage'] = eval_result['match_percentage']
        results.append(serialized_pet)

    # Sort descending by match score
    results.sort(key=lambda x: x['match_score'], reverse=True)

    return Response({
        'count': len(results),
        'preferences': preferences,
        'recommendations': results[:12] # Top 12 matches
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def home_featured(request):
    """
    Returns featured pets, recently listed pets, and quick species statistics.
    """
    db = get_db()

    featured_cursor = db.pets.find({'status': 'available', 'featured': True}).limit(4)
    featured = serialize_docs(featured_cursor)
    if len(featured) < 4:
        # Fill with any available pets
        more = list(db.pets.find({'status': 'available'}).limit(4))
        featured = serialize_docs(more)

    recent_cursor = db.pets.find({'status': 'available'}).sort('created_at', -1).limit(6)
    recent = serialize_docs(recent_cursor)

    # Aggregated species counts
    species_counts = {
        'dogs': db.pets.count_documents({'species': {'$regex': '^dog', '$options': 'i'}, 'status': 'available'}),
        'cats': db.pets.count_documents({'species': {'$regex': '^cat', '$options': 'i'}, 'status': 'available'}),
        'rabbits': db.pets.count_documents({'species': {'$regex': '^rabbit', '$options': 'i'}, 'status': 'available'}),
        'birds': db.pets.count_documents({'species': {'$regex': '^bird', '$options': 'i'}, 'status': 'available'}),
    }

    return Response({
        'featured': featured,
        'recent': recent,
        'species_counts': species_counts
    }, status=status.HTTP_200_OK)
