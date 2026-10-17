from datetime import datetime, timezone
from bson import ObjectId
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from config.mongodb import get_db, serialize_doc, serialize_docs
from config.auth import IsAdopter, IsShelter, IsAuthenticatedMongoUser
from rest_framework.permissions import AllowAny

@api_view(['POST'])
@permission_classes([IsAdopter])
def submit_application(request):
    """
    Adopter applies to adopt a pet.
    Validates pet availability and prevents duplicate active applications.
    """
    db = get_db()
    data = request.data
    pet_id = data.get('pet_id') or data.get('pet')

    if not pet_id:
        return Response({'error': 'pet_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        pet = db.pets.find_one({'_id': ObjectId(pet_id)})
    except Exception:
        return Response({'error': 'Invalid pet ID.'}, status=status.HTTP_400_BAD_REQUEST)

    if not pet:
        return Response({'error': 'Pet not found.'}, status=status.HTTP_404_NOT_FOUND)

    if pet.get('status') != 'available':
        return Response(
            {'error': f"This pet is currently '{pet.get('status')}' and not open for adoption applications."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check for active duplicate applications by this adopter for this pet
    existing_app = db.applications.find_one({
        'pet_id': str(pet_id),
        'adopter_id': request.user.id,
        'status': {'$in': ['submitted', 'under_review', 'approved']}
    })

    if existing_app:
        return Response(
            {'error': 'You already have an active application in progress for this pet.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    now = datetime.now(timezone.utc)
    app_doc = {
        'pet_id': str(pet_id),
        'adopter_id': request.user.id,
        'shelter_id': pet.get('shelter_id'),
        'adopter_name': (data.get('adopter_name') or data.get('applicant_name') or getattr(request.user, 'name', '') or '').strip(),
        'adopter_email': (data.get('adopter_email') or data.get('applicant_email') or getattr(request.user, 'email', '') or '').strip(),
        'adopter_phone': (data.get('adopter_phone') or data.get('applicant_phone') or getattr(request.user, 'phone', '') or '').strip(),
        'living_type': (data.get('living_type') or data.get('living_situation') or 'Apartment').strip(),
        'has_yard': bool(data.get('has_yard', False) or 'yard' in str(data.get('living_situation', '') or data.get('living_type', '')).lower()),
        'household_members': (data.get('household_members') or '1-2 adults').strip(),
        'has_other_pets': bool(data.get('has_other_pets', False) or (data.get('other_pets') and str(data.get('other_pets')).lower() not in ['none', 'no', 'false', ''])),
        'other_pets_details': (data.get('other_pets_details') or data.get('other_pets') or '').strip(),
        'previous_experience': (data.get('previous_experience') or data.get('pet_experience') or '').strip(),
        'reason_for_adoption': (data.get('reason_for_adoption') or data.get('reason') or '').strip(),
        'time_alone_hours': str(data.get('time_alone_hours') or data.get('hours_pet_alone') or '2-4 hours'),
        'readiness_acknowledged': bool(data.get('readiness_acknowledged', True)),
        'status': 'submitted',  # submitted -> under_review -> approved / rejected -> completed
        'rejection_reason': '',
        'status_history': [
            {
                'status': 'submitted',
                'timestamp': now.isoformat(),
                'note': 'Application successfully submitted by adopter.'
            }
        ],
        'created_at': now,
        'updated_at': now,
    }

    insert_result = db.applications.insert_one(app_doc)
    app_doc['_id'] = insert_result.inserted_id

    # Create in-app notification for the shelter
    shelter_id = pet.get('shelter_id')
    if shelter_id:
        db.notifications.insert_one({
            'user_id': shelter_id,
            'title': f"New Adoption Application for {pet.get('name')}",
            'message': f"{request.user.name} submitted an adoption request for {pet.get('name')}.",
            'type': 'new_application',
            'related_id': str(app_doc['_id']),
            'read': False,
            'created_at': now,
        })

    # Confirmation notification for adopter
    db.notifications.insert_one({
        'user_id': request.user.id,
        'title': f"Application Submitted: {pet.get('name')}",
        'message': f"Your application for {pet.get('name')} was sent to the shelter. You can track progress in your dashboard.",
        'type': 'application_update',
        'related_id': str(app_doc['_id']),
        'read': False,
        'created_at': now,
    })

    return Response({
        'message': 'Adoption application submitted successfully!',
        'application': serialize_doc(app_doc)
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAdopter])
def my_applications(request):
    """
    Adopter views their own submitted applications with pet details.
    """
    db = get_db()
    apps_cursor = db.applications.find({'adopter_id': request.user.id}).sort('created_at', -1)
    apps_list = serialize_docs(apps_cursor)

    # Attach pet details and linked visit to each application
    for app in apps_list:
        try:
            pet = db.pets.find_one({'_id': ObjectId(app['pet_id'])})
            app['pet'] = serialize_doc(pet) if pet else None
        except Exception:
            app['pet'] = None

        try:
            app_id_str = str(app.get('id') or app.get('_id') or '')
            visit = db.visits.find_one({
                '$or': [
                    {'application_id': app_id_str},
                    {'pet_id': str(app.get('pet_id', '')), 'adopter_id': request.user.id}
                ]
            })
            if visit:
                v_ser = serialize_doc(visit)
                v_ser['visit_time'] = v_ser.get('time_slot') or v_ser.get('visit_time') or ''
                app['visit'] = v_ser
            else:
                app['visit'] = None
        except Exception:
            app['visit'] = None

    return Response({
        'count': len(apps_list),
        'applications': apps_list
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsShelter])
def shelter_applications(request):
    """
    Shelter views all applications received for their listed pets.
    Strictly isolated to the logged-in shelter only.
    """
    db = get_db()
    shelter_id_str = str(request.user.id)
    shelter_filter = {
        '$in': [shelter_id_str, ObjectId(shelter_id_str)] if ObjectId.is_valid(shelter_id_str) else [shelter_id_str]
    }
    query = {'shelter_id': shelter_filter}

    status_filter = request.GET.get('status', '').strip()
    if status_filter and status_filter != 'all':
        query['status'] = status_filter

    pet_filter = request.GET.get('pet_id', '').strip()
    if pet_filter:
        query['pet_id'] = pet_filter

    apps_cursor = db.applications.find(query).sort('created_at', -1)
    apps_list = serialize_docs(apps_cursor)

    # Attach pet details and linked visit to each application
    for app in apps_list:
        try:
            pet = db.pets.find_one({'_id': ObjectId(app['pet_id'])})
            app['pet'] = serialize_doc(pet) if pet else None
        except Exception:
            app['pet'] = None

        try:
            app_id_str = str(app.get('id') or app.get('_id') or '')
            visit = db.visits.find_one({
                '$or': [
                    {'application_id': app_id_str},
                    {'pet_id': str(app.get('pet_id', '')), 'adopter_id': app.get('adopter_id')}
                ]
            })
            if visit:
                v_ser = serialize_doc(visit)
                v_ser['visit_time'] = v_ser.get('time_slot') or v_ser.get('visit_time') or ''
                app['visit'] = v_ser
            else:
                app['visit'] = None
        except Exception:
            app['visit'] = None

    return Response({
        'count': len(apps_list),
        'applications': apps_list
    }, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsShelter])
def update_application_status(request, app_id):
    """
    Shelter updates application status:
    - submitted -> under_review -> approved / rejected -> completed
    - persists state change and reason in MongoDB
    - updates pet status if approved/completed
    - sends in-app notification to the adopter
    """
    db = get_db()
    try:
        app_doc = db.applications.find_one({'_id': ObjectId(app_id)})
    except Exception:
        return Response({'error': 'Invalid application ID.'}, status=status.HTTP_400_BAD_REQUEST)

    if not app_doc:
        return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

    if app_doc.get('shelter_id') != request.user.id:
        return Response({'error': 'You do not have permission to manage this application.'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data
    new_status = data.get('status', '').strip().lower()
    note = data.get('note', '').strip()
    rejection_reason = data.get('rejection_reason', '').strip()

    valid_statuses = ['under_review', 'approved', 'rejected', 'completed']
    if new_status not in valid_statuses:
        return Response(
            {'error': f"Invalid status. Must be one of: {', '.join(valid_statuses)}"},
            status=status.HTTP_400_BAD_REQUEST
        )

    now = datetime.now(timezone.utc)
    status_entry = {
        'status': new_status,
        'timestamp': now.isoformat(),
        'note': note or f"Status updated to {new_status.replace('_', ' ').title()} by shelter."
    }

    updates = {
        'status': new_status,
        'updated_at': now
    }
    if rejection_reason:
        updates['rejection_reason'] = rejection_reason

    db.applications.update_one(
        {'_id': ObjectId(app_id)},
        {
            '$set': updates,
            '$push': {'status_history': status_entry}
        }
    )

    # Fetch pet details for messages
    pet = None
    try:
        pet = db.pets.find_one({'_id': ObjectId(app_doc['pet_id'])})
    except Exception:
        pass
    pet_name = pet.get('name', 'your pet') if pet else 'your pet'

    # Update pet availability if approved or completed
    if pet and new_status == 'completed':
        db.pets.update_one({'_id': ObjectId(app_doc['pet_id'])}, {'$set': {'status': 'adopted'}})
    elif pet and new_status == 'approved':
        db.pets.update_one({'_id': ObjectId(app_doc['pet_id'])}, {'$set': {'status': 'pending'}})

    status_display = new_status.replace('_', ' ').title()

    # Notify the adopter (optional, can be disabled if shelter does not want to notify)
    notify_adopter = data.get('notify', True)
    if isinstance(notify_adopter, str):
        notify_adopter = notify_adopter.lower() not in ('false', '0', 'no')

    if notify_adopter:
        adopter_id = app_doc.get('adopter_id')
        msg = f"Your adoption application for {pet_name} is now: {status_display}."
        if rejection_reason and new_status == 'rejected':
            msg += f" Note from shelter: {rejection_reason}"

        db.notifications.insert_one({
            'user_id': adopter_id,
            'title': f"Application Update: {pet_name}",
            'message': msg,
            'type': 'status_change',
            'related_id': app_id,
            'read': False,
            'created_at': now,
        })

    updated_app = db.applications.find_one({'_id': ObjectId(app_id)})
    return Response({
        'message': f"Application updated to '{status_display}'.",
        'application': serialize_doc(updated_app)
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdopter])
def withdraw_application(request, app_id):
    """
    Adopter withdraws application while it is still pending ('submitted' or 'under_review').
    """
    db = get_db()
    try:
        app_doc = db.applications.find_one({'_id': ObjectId(app_id)})
    except Exception:
        return Response({'error': 'Invalid application ID.'}, status=status.HTTP_400_BAD_REQUEST)

    if not app_doc:
        return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

    if app_doc.get('adopter_id') != request.user.id:
        return Response({'error': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)

    if app_doc.get('status') not in ['submitted', 'under_review']:
        return Response(
            {'error': f"Cannot withdraw an application that is already '{app_doc.get('status')}'."},
            status=status.HTTP_400_BAD_REQUEST
        )

    now = datetime.now(timezone.utc)
    status_entry = {
        'status': 'withdrawn',
        'timestamp': now.isoformat(),
        'note': 'Application withdrawn by applicant.'
    }

    db.applications.update_one(
        {'_id': ObjectId(app_id)},
        {
            '$set': {'status': 'withdrawn', 'updated_at': now},
            '$push': {'status_history': status_entry}
        }
    )

    # Notify shelter
    shelter_id = app_doc.get('shelter_id')
    if shelter_id:
        db.notifications.insert_one({
            'user_id': shelter_id,
            'title': 'Application Withdrawn',
            'message': f"{request.user.name} withdrew their application for pet.",
            'type': 'withdrawal',
            'related_id': app_id,
            'read': False,
            'created_at': now,
        })

    return Response({'message': 'Application successfully withdrawn.'}, status=status.HTTP_200_OK)


# ==============================================================================
# MEET AND GREET VISIT SCHEDULER APIS
# ==============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticatedMongoUser])
def book_visit(request):
    """
    Schedule a Meet & Greet appointment with a rescue pet and shelter.
    Supported for both Adopters (status: pending) and Shelters (status: confirmed).
    """
    db = get_db()
    data = request.data

    pet_id = (data.get('pet_id') or data.get('pet') or '').strip()
    visit_date = data.get('visit_date', '').strip()
    time_slot = (data.get('time_slot') or data.get('visit_time') or '').strip()
    visit_type = (data.get('visit_type') or 'in_person').strip()  # 'in_person' or 'virtual'
    notes = data.get('notes', '').strip()
    application_id = (data.get('application_id') or '').strip()

    if not pet_id or not visit_date or not time_slot:
        return Response(
            {'error': 'Pet ID, visit date, and time slot are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        pet = db.pets.find_one({'_id': ObjectId(pet_id)})
    except Exception:
        return Response({'error': 'Invalid Pet ID.'}, status=status.HTTP_400_BAD_REQUEST)

    if not pet:
        return Response({'error': 'Pet not found.'}, status=status.HTTP_404_NOT_FOUND)

    shelter_id = pet.get('shelter_id')
    shelter_name = pet.get('shelter_name', 'Rescue Shelter')

    if shelter_id:
        shelter_doc = db.shelters.find_one({'$or': [{'user_id': shelter_id}, {'user_id': str(shelter_id)}]})
        if shelter_doc:
            shelter_name = shelter_doc.get('shelter_name', shelter_name)

    now = datetime.now(timezone.utc)
    is_shelter = getattr(request.user, 'role', '') == 'shelter'

    # Determine adopter details
    if is_shelter:
        adopter_id = data.get('adopter_id')
        app_doc = None
        if application_id:
            try:
                app_doc = db.applications.find_one({'_id': ObjectId(application_id)})
                if app_doc and not adopter_id:
                    adopter_id = app_doc.get('adopter_id')
            except Exception:
                pass

        if not adopter_id:
            return Response({'error': 'Adopter ID or valid Application ID is required for shelter scheduling.'}, status=status.HTTP_400_BAD_REQUEST)

        adopter_user = None
        try:
            adopter_user = db.users.find_one({'_id': ObjectId(adopter_id)})
        except Exception:
            pass

        adopter_name = (adopter_user.get('name') if adopter_user else None) or (app_doc.get('adopter_name') if app_doc else 'Prospective Adopter')
        adopter_email = (adopter_user.get('email') if adopter_user else None) or (app_doc.get('adopter_email') if app_doc else '')
        adopter_phone = (adopter_user.get('phone') if adopter_user else None) or (app_doc.get('adopter_phone') if app_doc else '')
        init_status = 'confirmed'
    else:
        adopter_id = request.user.id
        adopter_name = request.user.name
        adopter_email = request.user.email
        adopter_phone = getattr(request.user, 'phone', '') or request.user.doc.get('phone', '')
        init_status = 'pending'

    visit_doc = {
        'adopter_id': str(adopter_id),
        'adopter_name': adopter_name,
        'adopter_email': adopter_email,
        'adopter_phone': adopter_phone,
        'pet_id': str(pet['_id']),
        'pet_name': pet.get('name'),
        'pet_species': pet.get('species'),
        'pet_breed': pet.get('breed'),
        'pet_image': pet.get('image_url') or pet.get('photo_url') or '',
        'shelter_id': str(shelter_id),
        'shelter_name': shelter_name,
        'visit_date': visit_date,
        'time_slot': time_slot,
        'visit_type': visit_type,
        'notes': notes,
        'application_id': application_id if application_id else None,
        'status': init_status,  # 'pending', 'confirmed', 'completed', 'cancelled'
        'shelter_note': '' if not is_shelter else notes,
        'created_at': now,
        'updated_at': now,
    }

    insert_result = db.visits.insert_one(visit_doc)
    visit_doc['_id'] = insert_result.inserted_id

    # If linked to application, append to application status_history
    if application_id:
        try:
            action_by = 'Shelter' if is_shelter else 'Adopter'
            db.applications.update_one(
                {'_id': ObjectId(application_id)},
                {
                    '$push': {
                        'status_history': {
                            'status': 'meet_and_greet_scheduled' if is_shelter else 'meet_and_greet_requested',
                            'timestamp': now.isoformat(),
                            'note': f"Meet & Greet set for {visit_date} ({time_slot}) by {action_by}."
                        }
                    }
                }
            )
        except Exception:
            pass

    # Send notifications
    if is_shelter:
        db.notifications.insert_one({
            'user_id': str(adopter_id),
            'title': f"📅 Meet & Greet Scheduled: {pet.get('name')}",
            'message': f"{shelter_name} scheduled a Meet & Greet with you on {visit_date} ({time_slot}).",
            'type': 'visit_update',
            'related_id': str(visit_doc['_id']),
            'read': False,
            'created_at': now,
        })
    else:
        if shelter_id:
            db.notifications.insert_one({
                'user_id': str(shelter_id),
                'title': f"📅 New Meet & Greet Request: {pet.get('name')}",
                'message': f"{request.user.name} requested to meet {pet.get('name')} on {visit_date} ({time_slot}).",
                'type': 'new_visit',
                'related_id': str(visit_doc['_id']),
                'read': False,
                'created_at': now,
            })
        db.notifications.insert_one({
            'user_id': request.user.id,
            'title': f"📅 Visit Requested for {pet.get('name')}",
            'message': f"Your Meet & Greet request on {visit_date} ({time_slot}) was submitted to {shelter_name}.",
            'type': 'visit_update',
            'related_id': str(visit_doc['_id']),
            'read': False,
            'created_at': now,
        })

    serialized = serialize_doc(visit_doc)
    serialized['visit_time'] = time_slot
    serialized['pet'] = {
        'id': str(pet['_id']),
        'name': pet.get('name'),
        'breed': pet.get('breed'),
        'species': pet.get('species'),
        'photo_url': pet.get('image_url') or pet.get('photo_url') or '',
        'shelter': {'shelter_name': shelter_name}
    }

    return Response({
        'message': 'Meet & Greet scheduled successfully!' if is_shelter else 'Meet & Greet requested successfully! The shelter will confirm your slot.',
        'visit': serialized
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAdopter])
def my_visits(request):
    """
    Adopter views all of their scheduled Meet & Greet appointments.
    """
    db = get_db()
    adopter_id_str = str(request.user.id)
    adopter_filter = {
        '$in': [adopter_id_str, ObjectId(adopter_id_str)] if ObjectId.is_valid(adopter_id_str) else [adopter_id_str]
    }
    visits_cursor = db.visits.find({'adopter_id': adopter_filter}).sort('created_at', -1)
    visits_list = serialize_docs(visits_cursor)
    for v in visits_list:
        v['visit_time'] = v.get('time_slot') or v.get('visit_time') or ''
        v['time_slot'] = v['visit_time']
        if not v.get('pet') or not isinstance(v.get('pet'), dict):
            v['pet'] = {
                'id': v.get('pet_id'),
                'name': v.get('pet_name') or 'Rescue Pet',
                'breed': v.get('pet_breed') or 'Rescue Mix',
                'species': v.get('pet_species') or 'Pet',
                'photo_url': v.get('pet_image') or '',
                'image_url': v.get('pet_image') or '',
                'shelter': {'shelter_name': v.get('shelter_name') or 'Rescue Shelter'}
            }

    return Response({
        'count': len(visits_list),
        'visits': visits_list
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsShelter])
def shelter_visits(request):
    """
    Shelter views all Meet & Greet visits requested by adopters for their pets.
    """
    db = get_db()
    shelter_id_str = str(request.user.id)
    shelter_filter = {
        '$in': [shelter_id_str, ObjectId(shelter_id_str)] if ObjectId.is_valid(shelter_id_str) else [shelter_id_str]
    }
    visits_cursor = db.visits.find({'shelter_id': shelter_filter}).sort('created_at', -1)
    visits_list = serialize_docs(visits_cursor)
    for v in visits_list:
        v['visit_time'] = v.get('time_slot') or v.get('visit_time') or ''
        v['time_slot'] = v['visit_time']
        if not v.get('pet') or not isinstance(v.get('pet'), dict):
            v['pet'] = {
                'id': v.get('pet_id'),
                'name': v.get('pet_name') or 'Rescue Pet',
                'breed': v.get('pet_breed') or 'Rescue Mix',
                'species': v.get('pet_species') or 'Pet',
                'photo_url': v.get('pet_image') or '',
                'image_url': v.get('pet_image') or '',
                'shelter': {'shelter_name': v.get('shelter_name') or 'Rescue Shelter'}
            }
        if not v.get('adopter') or not isinstance(v.get('adopter'), dict):
            v['adopter'] = {
                'id': v.get('adopter_id'),
                'name': v.get('adopter_name') or 'Prospective Adopter',
                'email': v.get('adopter_email') or '',
                'phone': v.get('adopter_phone') or ''
            }

    return Response({
        'count': len(visits_list),
        'visits': visits_list
    }, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticatedMongoUser])
def update_visit_status(request, visit_id):
    """
    Update Meet & Greet status:
    - Shelters can confirm, complete, or cancel.
    - Adopters can cancel their visit.
    """
    db = get_db()
    try:
        visit_doc = db.visits.find_one({'_id': ObjectId(visit_id)})
    except Exception:
        return Response({'error': 'Invalid visit ID.'}, status=status.HTTP_400_BAD_REQUEST)

    if not visit_doc:
        return Response({'error': 'Visit appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

    user_id = str(request.user.id)
    is_shelter = user_id == str(visit_doc.get('shelter_id'))
    is_adopter = user_id == str(visit_doc.get('adopter_id'))

    if not is_shelter and not is_adopter:
        return Response({'error': 'Unauthorized to modify this visit.'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data
    new_status = data.get('status', '').strip().lower()
    shelter_note = data.get('shelter_note', '').strip()

    valid_statuses = ['confirmed', 'completed', 'cancelled']
    if new_status not in valid_statuses:
        return Response(
            {'error': f"Invalid status. Choose from: {', '.join(valid_statuses)}"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Adopters can only cancel
    if is_adopter and not is_shelter and new_status != 'cancelled':
        return Response({'error': 'Adopters can only cancel a scheduled visit.'}, status=status.HTTP_403_FORBIDDEN)

    now = datetime.now(timezone.utc)
    updates = {
        'status': new_status,
        'updated_at': now
    }
    if shelter_note:
        updates['shelter_note'] = shelter_note

    db.visits.update_one({'_id': ObjectId(visit_id)}, {'$set': updates})

    # If linked to application and completed, record in application
    app_id = visit_doc.get('application_id')
    if app_id:
        try:
            db.applications.update_one(
                {'_id': ObjectId(app_id)},
                {
                    '$push': {
                        'status_history': {
                            'status': f"meet_and_greet_{new_status}",
                            'timestamp': now.isoformat(),
                            'note': f"Meet & Greet visit was marked as {new_status.upper()}."
                        }
                    }
                }
            )
        except Exception:
            pass

    # Notify counterparty
    if is_shelter:
        status_msg = {
            'confirmed': 'has been CONFIRMED! Please arrive on time at the shelter.',
            'completed': 'has been marked as COMPLETED. Thank you for visiting!',
            'cancelled': 'could not be accommodated and was CANCELLED. Feel free to request another slot.'
        }.get(new_status, 'was updated.')

        db.notifications.insert_one({
            'user_id': str(visit_doc.get('adopter_id')),
            'title': f"📅 Meet & Greet {new_status.capitalize()}: {visit_doc.get('pet_name')}",
            'message': f"Your visit on {visit_doc.get('visit_date')} ({visit_doc.get('time_slot')}) {status_msg}",
            'type': 'visit_update',
            'related_id': visit_id,
            'read': False,
            'created_at': now,
        })
    else:
        # Adopter cancelled, notify shelter
        if visit_doc.get('shelter_id'):
            db.notifications.insert_one({
                'user_id': str(visit_doc.get('shelter_id')),
                'title': f"📅 Visit Cancelled: {visit_doc.get('pet_name')}",
                'message': f"{request.user.name} cancelled their Meet & Greet visit on {visit_doc.get('visit_date')} ({visit_doc.get('time_slot')}).",
                'type': 'visit_update',
                'related_id': visit_id,
                'read': False,
                'created_at': now,
            })

    updated = db.visits.find_one({'_id': ObjectId(visit_id)})
    ser_updated = serialize_doc(updated)
    ser_updated['visit_time'] = ser_updated.get('time_slot') or ser_updated.get('visit_time') or ''
    return Response({
        'message': f"Visit status updated to '{new_status}'.",
        'visit': ser_updated
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticatedMongoUser])
def get_adoption_certificate(request, app_id):
    """
    Returns verified adoption certificate details for an approved or completed adoption.
    Accessible by the adopter who applied or the shelter who issued it.
    """
    import hashlib
    db = get_db()
    try:
        app_doc = db.applications.find_one({'_id': ObjectId(app_id)})
    except Exception:
        return Response({'error': 'Invalid application ID.'}, status=status.HTTP_400_BAD_REQUEST)

    if not app_doc:
        return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Status check
    current_status = app_doc.get('status', '').lower()
    if current_status not in ['approved', 'completed']:
        return Response(
            {'error': 'Adoption Certificate is only issued once an application is Approved or Completed.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Permission check: Adopter or Shelter of this application, or Platform Admin
    user_id = str(request.user.id)
    is_admin = getattr(request.user, 'role', '') == 'admin' or getattr(request.user, 'is_staff', False)
    if user_id != str(app_doc.get('adopter_id')) and user_id != str(app_doc.get('shelter_id')) and not is_admin:
        return Response({'error': 'You do not have permission to view this certificate.'}, status=status.HTTP_403_FORBIDDEN)

    # Certificate Number & Security Hash
    cert_number = app_doc.get('certificate_number')
    if not cert_number:
        short_id = str(app_doc['_id'])[-6:].upper()
        now_dt = datetime.now(timezone.utc)
        cert_number = f"PAW-CERT-{short_id}-{now_dt.strftime('%Y%m')}"
        
        # Tamper-proof security hash stub
        hash_input = f"{app_doc['_id']}:{app_doc.get('pet_id')}:{app_doc.get('adopter_id')}:{cert_number}"
        sec_hash = hashlib.sha256(hash_input.encode('utf-8')).hexdigest()[:24].upper()
        
        db.applications.update_one(
            {'_id': app_doc['_id']},
            {
                '$set': {
                    'certificate_number': cert_number,
                    'certificate_issued_at': now_dt,
                    'certificate_hash': sec_hash
                }
            }
        )
        app_doc['certificate_number'] = cert_number
        app_doc['certificate_issued_at'] = now_dt
        app_doc['certificate_hash'] = sec_hash

    issued_at = app_doc.get('certificate_issued_at') or app_doc.get('updated_at') or app_doc.get('created_at')

    # Fetch Pet
    pet = None
    try:
        pet = db.pets.find_one({'_id': ObjectId(app_doc['pet_id'])})
    except Exception:
        pass
    pet_name = pet.get('name', 'Beloved Pet') if pet else 'Beloved Pet'
    microchip = (pet.get('microchip_id') or f"98514100{str(pet.get('_id', '9999'))[-4:].upper()}") if pet else "985141008921"

    # Fetch Shelter
    shelter_doc = None
    try:
        shelter_id_val = app_doc.get('shelter_id')
        shelter_doc = db.shelters.find_one({'$or': [{'user_id': shelter_id_val}, {'user_id': str(shelter_id_val)}]})
    except Exception:
        pass

    shelter_name = (shelter_doc.get('shelter_name') if shelter_doc else None) or (pet.get('shelter_name') if pet else None) or 'PawConnect Partner Shelter'
    shelter_email = (shelter_doc.get('contact_email') if shelter_doc else None) or 'shelter@pawconnect.org'
    shelter_phone = (shelter_doc.get('phone') if shelter_doc else None) or '+1 (555) 234-5678'
    shelter_address = (shelter_doc.get('address') if shelter_doc else None) or (pet.get('location') if pet else None) or 'Portland, OR'

    # Fetch Adopter User
    adopter_user = None
    try:
        adopter_user = db.users.find_one({'_id': ObjectId(app_doc['adopter_id'])})
    except Exception:
        pass

    adopter_name = app_doc.get('adopter_name') or (adopter_user.get('name') if adopter_user else 'Adoptive Parent')
    adopter_email = app_doc.get('adopter_email') or (adopter_user.get('email') if adopter_user else '')
    adopter_phone = app_doc.get('adopter_phone') or (adopter_user.get('phone') if adopter_user else '')
    adopter_city = (adopter_user.get('address') if adopter_user else None) or app_doc.get('living_type') or 'Registered Residence'

    payload = {
        'certificate_number': cert_number,
        'security_hash': app_doc.get('certificate_hash', 'PAW-SEC-VERIFIED'),
        'issued_at': issued_at.isoformat() if isinstance(issued_at, datetime) else str(issued_at),
        'status': current_status,
        'application_id': str(app_doc['_id']),
        'pet': {
            'id': str(pet['_id']) if pet else str(app_doc.get('pet_id')),
            'name': pet_name,
            'species': pet.get('species', 'Canine') if pet else 'Companion Animal',
            'breed': pet.get('breed', 'Rescue Mix') if pet else 'Rescue Mix',
            'age': pet.get('age', 1) if pet else 1,
            'age_unit': pet.get('age_unit', 'years') if pet else 'years',
            'gender': pet.get('gender', 'Unknown') if pet else 'Unknown',
            'size': pet.get('size', 'Medium') if pet else 'Medium',
            'weight_display': pet.get('weight_display') or 'Normal / Healthy',
            'photo_url': pet.get('image_url') or pet.get('photo_url') if pet else '',
            'microchip_id': microchip,
            'vaccinated': pet.get('vaccinated', True) if pet else True,
            'spayed_neutered': pet.get('spayed_neutered', True) if pet else True,
            'health_status': pet.get('health_status', 'Healthy & Vet Cleared') if pet else 'Healthy',
            'special_needs': pet.get('special_needs', 'None') if pet else 'None',
        },
        'adopter': {
            'id': str(app_doc.get('adopter_id')),
            'name': adopter_name,
            'email': adopter_email,
            'phone': adopter_phone,
            'city': adopter_city
        },
        'shelter': {
            'id': str(app_doc.get('shelter_id')),
            'name': shelter_name,
            'email': shelter_email,
            'phone': shelter_phone,
            'address': shelter_address,
            'registry_code': f"SHL-REG-{str(app_doc.get('shelter_id'))[-4:].upper()}"
        },
        'verification_url': f"/verify-certificate/{cert_number}",
    }

    return Response(payload, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_adoption_certificate(request, cert_number):
    """
    Public verification endpoint for scanned QR codes and authenticity checks.
    """
    db = get_db()
    cert_clean = cert_number.strip().upper()
    
    # Try finding by certificate_number or by application ID
    query = {'$or': [
        {'certificate_number': cert_clean},
        {'_id': ObjectId(cert_clean)} if ObjectId.is_valid(cert_clean) else {'certificate_number': cert_clean}
    ]}
    
    app_doc = db.applications.find_one(query)
    if not app_doc or app_doc.get('status', '').lower() not in ['approved', 'completed']:
        return Response({
            'valid': False,
            'message': 'Certificate record not found or not currently recognized as verified.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Fetch Pet
    pet = None
    try:
        pet = db.pets.find_one({'_id': ObjectId(app_doc['pet_id'])})
    except Exception:
        pass

    # Fetch Shelter
    shelter_doc = None
    try:
        shelter_doc = db.shelters.find_one({'user_id': app_doc.get('shelter_id')})
    except Exception:
        pass

    shelter_name = (shelter_doc.get('shelter_name') if shelter_doc else None) or (pet.get('shelter_name') if pet else None) or 'PawConnect Partner Shelter'
    issued_at = app_doc.get('certificate_issued_at') or app_doc.get('updated_at') or app_doc.get('created_at')
    microchip = (pet.get('microchip_id') or f"98514100{str(pet.get('_id', '9999'))[-4:].upper()}") if pet else "985141008921"
    shelter_registry_code = f"SHL-REG-{str(app_doc.get('shelter_id'))[-4:].upper()}"

    return Response({
        'valid': True,
        'certificate_number': app_doc.get('certificate_number', cert_clean),
        'security_hash': app_doc.get('certificate_hash', 'PAW-SEC-VERIFIED'),
        'status': app_doc.get('status'),
        'application_id': str(app_doc['_id']),
        'pet_name': pet.get('name') if pet else 'Beloved Pet',
        'species': pet.get('species') if pet else 'Companion Animal',
        'breed': pet.get('breed') if pet else 'Rescue Mix',
        'age': pet.get('age', 1) if pet else 1,
        'age_unit': pet.get('age_unit', 'years') if pet else 'years',
        'gender': pet.get('gender', 'Unknown') if pet else 'Unknown',
        'microchip_id': microchip,
        'adopter_name': app_doc.get('adopter_name', 'Verified Adopter'),
        'shelter_name': shelter_name,
        'shelter_registry_code': shelter_registry_code,
        'issued_at': issued_at.isoformat() if isinstance(issued_at, datetime) else str(issued_at),
        'vaccinated': pet.get('vaccinated', True) if pet else True,
        'spayed_neutered': pet.get('spayed_neutered', True) if pet else True,
        'photo_url': pet.get('image_url') or pet.get('photo_url') if pet else '',
    }, status=status.HTTP_200_OK)


# ==============================================================================
# DIGITAL ADOPTION AGREEMENT & E-SIGNATURE CONTRACT APIS
# ==============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticatedMongoUser])
def get_adoption_contract(request, app_id):
    """
    Returns legal adoption agreement deed details, covenants, and signature status.
    Accessible by the applicant adopter, issuing shelter, or platform admin.
    """
    db = get_db()
    try:
        app_doc = db.applications.find_one({'_id': ObjectId(app_id)})
    except Exception:
        return Response({'error': 'Invalid application ID.'}, status=status.HTTP_400_BAD_REQUEST)

    if not app_doc:
        return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Permission check
    user_id = str(request.user.id)
    is_admin = getattr(request.user, 'role', '') == 'admin' or getattr(request.user, 'is_staff', False)
    if user_id != str(app_doc.get('adopter_id')) and user_id != str(app_doc.get('shelter_id')) and not is_admin:
        return Response({'error': 'Unauthorized to view this contract.'}, status=status.HTTP_403_FORBIDDEN)

    # Fetch Pet
    pet = None
    try:
        pet = db.pets.find_one({'_id': ObjectId(app_doc['pet_id'])})
    except Exception:
        pass

    # Fetch Shelter
    shelter_doc = None
    try:
        shelter_id_val = app_doc.get('shelter_id')
        shelter_doc = db.shelters.find_one({'$or': [{'user_id': shelter_id_val}, {'user_id': str(shelter_id_val)}]})
    except Exception:
        pass

    # Fetch Adopter
    adopter_user = None
    try:
        adopter_user = db.users.find_one({'_id': ObjectId(app_doc['adopter_id'])})
    except Exception:
        pass

    shelter_name = (shelter_doc.get('shelter_name') if shelter_doc else None) or (pet.get('shelter_name') if pet else None) or 'PawConnect Partner Shelter'
    shelter_address = (shelter_doc.get('address') if shelter_doc else None) or (pet.get('location') if pet else None) or 'Portland, OR'
    shelter_license = f"SHL-REG-{str(app_doc.get('shelter_id'))[-4:].upper()}"
    director_name = (shelter_doc.get('contact_person') if shelter_doc else None) or 'Dr. Eleanor Vance'

    adopter_name = app_doc.get('adopter_name') or (adopter_user.get('name') if adopter_user else 'Adoptive Guardian')
    adopter_email = app_doc.get('adopter_email') or (adopter_user.get('email') if adopter_user else '')
    adopter_phone = app_doc.get('adopter_phone') or (adopter_user.get('phone') if adopter_user else '')
    adopter_address = (adopter_user.get('address') if adopter_user else None) or app_doc.get('living_type') or 'Registered Residence'

    microchip = (pet.get('microchip_id') or f"98514100{str(pet.get('_id', '9999'))[-4:].upper()}") if pet else "985141008921"
    contract_number = app_doc.get('contract_number')
    if not contract_number:
        short_id = str(app_doc['_id'])[-6:].upper()
        now_dt = datetime.now(timezone.utc)
        contract_number = f"PAW-AGR-{short_id}-{now_dt.strftime('%Y%m')}"

    signed_at = app_doc.get('contract_signed_at')
    signed_at_formatted = signed_at.isoformat() if isinstance(signed_at, datetime) else str(signed_at) if signed_at else None

    # Official Covenants
    covenants = [
        {
            'id': 'cov_1',
            'title': 'Lifelong Humane Care & Guardianship',
            'text': 'The Adopter pledges to provide humane care, nutritious food, fresh water, adequate shelter, regular exercise, and loving companionship for the natural life of the animal (estimated 10-15+ years).'
        },
        {
            'id': 'cov_2',
            'title': 'Veterinary Protocol & Preventive Medicine',
            'text': 'The Adopter agrees to maintain all required immunizations, rabies boosters, annual health examinations, parasite preventives, and prompt professional medical treatment upon signs of illness or injury.'
        },
        {
            'id': 'cov_3',
            'title': 'Indoor Living & Anti-Cruelty Pledge',
            'text': 'The animal will reside indoors as a family companion. The Adopter covenants that the pet will never be left tied or chained outdoors unattended, and will never be subjected to cruel cosmetic mutilations (e.g., ear cropping, tail docking, declawing).'
        },
        {
            'id': 'cov_4',
            'title': 'Strict Anti-Abandonment & Shelter Return Covenant',
            'text': 'If at any point in the future the Adopter is unable to retain custody or provide adequate care, the Adopter legally covenants to return the animal to the issuing Shelter. The animal shall NEVER be abandoned, sold, surrendered to research facilities, or re-homed without shelter notice.'
        },
        {
            'id': 'cov_5',
            'title': 'Microchip Registry & Identification',
            'text': 'The Adopter pledges to keep microchip registry contact information current and to affix a collar with visible identification tags whenever the animal is in public spaces.'
        }
    ]

    payload = {
        'contract_number': contract_number,
        'application_id': str(app_doc['_id']),
        'status': app_doc.get('status'),
        'contract_signed': bool(app_doc.get('contract_signed', False)),
        'contract_signed_at': signed_at_formatted,
        'adopter_signature': app_doc.get('adopter_signature', None),
        'witness_name': app_doc.get('contract_witness_name', ''),
        'security_hash': app_doc.get('contract_hash', 'PAW-AGR-VERIFIED'),
        'pet': {
            'id': str(pet['_id']) if pet else str(app_doc.get('pet_id')),
            'name': pet.get('name', 'Beloved Pet') if pet else 'Beloved Pet',
            'species': pet.get('species', 'Companion Animal') if pet else 'Companion Animal',
            'breed': pet.get('breed', 'Rescue Mix') if pet else 'Rescue Mix',
            'age': pet.get('age', 1) if pet else 1,
            'age_unit': pet.get('age_unit', 'years') if pet else 'years',
            'gender': pet.get('gender', 'Unknown') if pet else 'Unknown',
            'microchip_id': microchip,
            'vaccinated': pet.get('vaccinated', True) if pet else True,
            'spayed_neutered': pet.get('spayed_neutered', True) if pet else True,
            'photo_url': pet.get('image_url') or pet.get('photo_url') if pet else '',
        },
        'adopter': {
            'id': str(app_doc.get('adopter_id')),
            'name': adopter_name,
            'email': adopter_email,
            'phone': adopter_phone,
            'address': adopter_address,
        },
        'shelter': {
            'id': str(app_doc.get('shelter_id')),
            'name': shelter_name,
            'director_name': director_name,
            'license_code': shelter_license,
            'address': shelter_address,
        },
        'covenants': covenants,
        'legal_notice': 'This document constitutes a legally binding ethical deed of custody transfer executed under the PawConnect Central Animal Welfare Network governance rules.'
    }

    return Response(payload, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticatedMongoUser])
def sign_adoption_contract(request, app_id):
    """
    Adopter electronically signs and executes the adoption agreement.
    Captures digital signature image, agreed covenants, and timestamp.
    """
    import hashlib
    db = get_db()
    try:
        app_doc = db.applications.find_one({'_id': ObjectId(app_id)})
    except Exception:
        return Response({'error': 'Invalid application ID.'}, status=status.HTTP_400_BAD_REQUEST)

    if not app_doc:
        return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Permission check: Adopter of this application only
    if str(request.user.id) != str(app_doc.get('adopter_id')):
        return Response({'error': 'Only the applicant adopter can sign this adoption agreement.'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data
    adopter_signature = data.get('signature') or data.get('adopter_signature')
    witness_name = data.get('witness_name', '').strip()

    if not adopter_signature:
        return Response({'error': 'Adopter digital signature is required to execute the agreement.'}, status=status.HTTP_400_BAD_REQUEST)

    now = datetime.now(timezone.utc)
    short_id = str(app_doc['_id'])[-6:].upper()
    contract_number = app_doc.get('contract_number') or f"PAW-AGR-{short_id}-{now.strftime('%Y%m')}"

    # Tamper-proof cryptographic contract hash
    hash_payload = f"{app_doc['_id']}:{app_doc.get('pet_id')}:{request.user.id}:{contract_number}:{now.isoformat()}"
    contract_hash = hashlib.sha256(hash_payload.encode('utf-8')).hexdigest()[:24].upper()

    updates = {
        'contract_signed': True,
        'contract_signed_at': now,
        'contract_number': contract_number,
        'contract_hash': contract_hash,
        'adopter_signature': adopter_signature,
        'contract_witness_name': witness_name,
        'updated_at': now,
    }

    db.applications.update_one(
        {'_id': app_doc['_id']},
        {
            '$set': updates,
            '$push': {
                'status_history': {
                    'status': 'contract_signed',
                    'timestamp': now.isoformat(),
                    'note': f"Digital Adoption Agreement electronically executed and signed by {request.user.name}."
                }
            }
        }
    )

    # In-app notification to shelter
    shelter_id = app_doc.get('shelter_id')
    if shelter_id:
        db.notifications.insert_one({
            'user_id': str(shelter_id),
            'title': f"📝 Adoption Agreement Signed!",
            'message': f"{request.user.name} has electronically signed the official Adoption Agreement for application #{short_id}.",
            'type': 'contract_signed',
            'related_id': str(app_doc['_id']),
            'read': False,
            'created_at': now,
        })

    # Confirmation notification to adopter
    db.notifications.insert_one({
        'user_id': request.user.id,
        'title': f"📝 Agreement Executed Successfully",
        'message': f"Your digital adoption contract {contract_number} has been signed and officially recorded.",
        'type': 'contract_signed',
        'related_id': str(app_doc['_id']),
        'read': False,
        'created_at': now,
    })

    return Response({
        'message': 'Adoption Agreement electronically executed successfully!',
        'contract_number': contract_number,
        'contract_hash': contract_hash,
        'signed_at': now.isoformat()
    }, status=status.HTTP_200_OK)


# ==============================================================================
# REAL-TIME CONTEXTUAL LIVE MESSAGING & CHAT SYSTEM
# ==============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticatedMongoUser])
def list_conversations(request):
    """
    Lists contextual conversation threads for the authenticated user (Adopter or Shelter),
    grouped by pet and application. Includes pet info, other party info, last message snippet,
    and unread counter.
    """
    db = get_db()
    user_id = str(request.user.id)
    is_adopter = (getattr(request.user, 'role', '') == 'adopter')

    conversations = []
    seen_keys = set()

    # 1. Look for existing message threads
    msgs_cursor = db.messages.find({
        '$or': [
            {'adopter_id': user_id},
            {'shelter_id': user_id},
            {'sender_id': user_id},
            {'recipient_id': user_id}
        ]
    }).sort('created_at', -1)
    
    msgs_list = list(msgs_cursor)

    for msg in msgs_list:
        pet_id = str(msg.get('pet_id', ''))
        adopter_id = str(msg.get('adopter_id', ''))
        shelter_id = str(msg.get('shelter_id', ''))
        thread_key = f"{pet_id}_{adopter_id}_{shelter_id}"

        if thread_key in seen_keys:
            continue
        seen_keys.add(thread_key)

        other_user_id = shelter_id if is_adopter else adopter_id

        # Fetch Pet info
        pet_doc = None
        try:
            pet_doc = db.pets.find_one({'_id': ObjectId(pet_id)})
        except Exception:
            pass

        # Fetch other user info
        other_user_doc = None
        try:
            other_user_doc = db.users.find_one({'_id': ObjectId(other_user_id)})
        except Exception:
            pass

        # Fetch application if any
        app_doc = None
        try:
            app_id = msg.get('application_id')
            if app_id:
                app_doc = db.applications.find_one({'_id': ObjectId(app_id)})
            if not app_doc:
                app_doc = db.applications.find_one({'pet_id': pet_id, 'adopter_id': adopter_id})
        except Exception:
            pass

        # Count unread messages for this thread where current user is recipient
        unread_count = db.messages.count_documents({
            'pet_id': pet_id,
            'recipient_id': user_id,
            'read': False
        })

        conversations.append({
            'thread_id': thread_key,
            'pet_id': pet_id,
            'adopter_id': adopter_id,
            'shelter_id': shelter_id,
            'pet': serialize_doc(pet_doc) if pet_doc else {'id': pet_id, 'name': 'Pet'},
            'other_party': {
                'id': other_user_id,
                'name': (other_user_doc.get('shelter_name') or other_user_doc.get('name')) if other_user_doc else ('Shelter' if is_adopter else 'Adopter'),
                'email': other_user_doc.get('email') if other_user_doc else '',
                'role': other_user_doc.get('role') if other_user_doc else ('shelter' if is_adopter else 'adopter'),
            },
            'application': serialize_doc(app_doc) if app_doc else None,
            'last_message': {
                'text': msg.get('message', ''),
                'created_at': msg.get('created_at').isoformat() if hasattr(msg.get('created_at'), 'isoformat') else str(msg.get('created_at', '')),
                'sender_id': msg.get('sender_id'),
                'sender_name': msg.get('sender_name'),
                'sender_role': msg.get('sender_role'),
            },
            'unread_count': unread_count,
        })

    # 2. Also ensure applications of the user have an initialized conversation thread ready to chat!
    app_query = {'adopter_id': user_id} if is_adopter else {'shelter_id': user_id}
    apps_cursor = db.applications.find(app_query).sort('created_at', -1)
    for app in apps_cursor:
        pet_id = str(app.get('pet_id', ''))
        adopter_id = str(app.get('adopter_id', ''))
        shelter_id = str(app.get('shelter_id', ''))
        thread_key = f"{pet_id}_{adopter_id}_{shelter_id}"

        if thread_key in seen_keys:
            continue
        seen_keys.add(thread_key)

        other_user_id = shelter_id if is_adopter else adopter_id

        pet_doc = None
        try:
            pet_doc = db.pets.find_one({'_id': ObjectId(pet_id)})
        except Exception:
            pass

        other_user_doc = None
        try:
            other_user_doc = db.users.find_one({'_id': ObjectId(other_user_id)})
        except Exception:
            pass

        pet_name = pet_doc.get('name', 'Pet') if pet_doc else 'Pet'
        app_status = (app.get('status') or 'submitted').replace('_', ' ').capitalize()

        conversations.append({
            'thread_id': thread_key,
            'pet_id': pet_id,
            'adopter_id': adopter_id,
            'shelter_id': shelter_id,
            'pet': serialize_doc(pet_doc) if pet_doc else {'id': pet_id, 'name': 'Pet'},
            'other_party': {
                'id': other_user_id,
                'name': (other_user_doc.get('shelter_name') or other_user_doc.get('name')) if other_user_doc else ('Hope & Paws Sanctuary' if is_adopter else 'Adopter'),
                'email': other_user_doc.get('email') if other_user_doc else '',
                'role': other_user_doc.get('role') if other_user_doc else ('shelter' if is_adopter else 'adopter'),
            },
            'application': serialize_doc(app),
            'last_message': {
                'text': f"Adoption application on file for {pet_name} • Status: {app_status}",
                'created_at': app.get('created_at').isoformat() if hasattr(app.get('created_at'), 'isoformat') else str(app.get('created_at', '')),
                'sender_id': 'system',
                'sender_name': 'PawConnect System',
                'sender_role': 'system',
            },
            'unread_count': 0,
        })

    return Response({'conversations': conversations}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticatedMongoUser])
def get_thread_messages(request):
    """
    Returns messages for a specific conversation thread.
    Automatically marks incoming messages as read.
    """
    db = get_db()
    user_id = str(request.user.id)
    pet_id = request.query_params.get('pet_id')
    other_user_id = request.query_params.get('other_user_id')

    if not pet_id:
        return Response({'error': 'pet_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    query = {
        'pet_id': pet_id,
        '$or': [
            {'adopter_id': user_id},
            {'shelter_id': user_id},
            {'sender_id': user_id},
            {'recipient_id': user_id}
        ]
    }
    if other_user_id:
        query['$and'] = [
            {
                '$or': [
                    {'adopter_id': other_user_id},
                    {'shelter_id': other_user_id},
                    {'sender_id': other_user_id},
                    {'recipient_id': other_user_id}
                ]
            }
        ]

    msgs_cursor = db.messages.find(query).sort('created_at', 1)
    msgs = serialize_docs(msgs_cursor)

    # Mark incoming messages as read
    db.messages.update_many(
        {
            'pet_id': pet_id,
            'recipient_id': user_id,
            'read': False
        },
        {'$set': {'read': True}}
    )

    pet_doc = None
    try:
        pet_doc = db.pets.find_one({'_id': ObjectId(pet_id)})
    except Exception:
        pass

    return Response({
        'messages': msgs,
        'pet': serialize_doc(pet_doc) if pet_doc else None
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticatedMongoUser])
def send_thread_message(request):
    """
    Sends a new message in a thread.
    Generates in-app notifications and timestamps.
    """
    db = get_db()
    user_id = str(request.user.id)
    data = request.data

    pet_id = data.get('pet_id')
    recipient_id = data.get('recipient_id')
    application_id = data.get('application_id')
    text = (data.get('message') or '').strip()

    if not pet_id or not text:
        return Response({'error': 'pet_id and message are required.'}, status=status.HTTP_400_BAD_REQUEST)

    now = datetime.now(timezone.utc)

    pet_doc = None
    try:
        pet_doc = db.pets.find_one({'_id': ObjectId(pet_id)})
    except Exception:
        pass

    is_adopter = (getattr(request.user, 'role', '') == 'adopter')
    if is_adopter:
        adopter_id = user_id
        shelter_id = recipient_id or (str(pet_doc.get('shelter_id')) if pet_doc else None)
    else:
        shelter_id = user_id
        adopter_id = recipient_id

    final_recipient = shelter_id if is_adopter else adopter_id

    sender_display_name = getattr(request.user, 'name', '') or getattr(request.user, 'shelter_name', '') or 'User'

    doc = {
        'pet_id': str(pet_id),
        'application_id': str(application_id) if application_id else None,
        'adopter_id': str(adopter_id) if adopter_id else user_id,
        'shelter_id': str(shelter_id) if shelter_id else user_id,
        'sender_id': user_id,
        'recipient_id': str(final_recipient) if final_recipient else '',
        'sender_name': sender_display_name,
        'sender_role': getattr(request.user, 'role', 'adopter'),
        'message': text,
        'read': False,
        'created_at': now,
    }

    res = db.messages.insert_one(doc)
    doc['_id'] = res.inserted_id

    # Create in-app notification for recipient
    if final_recipient and final_recipient != user_id:
        pet_name = pet_doc.get('name', 'Pet') if pet_doc else 'Pet'
        db.notifications.insert_one({
            'user_id': str(final_recipient),
            'title': f"💬 New message from {sender_display_name}",
            'message': f"Regarding {pet_name}: \"{text[:75]}{'...' if len(text) > 75 else ''}\"",
            'type': 'chat_message',
            'related_id': str(pet_id),
            'read': False,
            'created_at': now,
        })

    return Response({
        'message': 'Message sent successfully!',
        'data': serialize_doc(doc)
    }, status=status.HTTP_201_CREATED)


