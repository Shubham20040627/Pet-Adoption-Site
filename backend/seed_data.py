"""
PawConnect Database Seeding Script.
Populates MongoDB with realistic initial demo data:
- Shelters and Adopter accounts
- Diverse pet listings with photos
- Initial sample adoption applications
- Notifications and initial setup
"""
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from django.contrib.auth.hashers import make_password

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from config.mongodb import get_db, init_db_indexes

def seed_pawconnect_data():
    db = get_db()
    print("[PawConnect Seed] Initializing MongoDB database indexes...")
    init_db_indexes()

    print("[PawConnect Seed] Cleaning existing demo collections...")
    db.users.delete_many({})
    db.shelters.delete_many({})
    db.pets.delete_many({})
    db.applications.delete_many({})
    db.favorites.delete_many({})
    db.notifications.delete_many({})
    db.contact_messages.delete_many({})

    now = datetime.now(timezone.utc)
    hashed_pwd = make_password("password123")

    # 1. Create Shelters
    shelter1_user = {
        'name': 'Green Haven Animal Sanctuary',
        'email': 'shelter@pawconnect.org',
        'password': hashed_pwd,
        'role': 'shelter',
        'phone': '+1 (555) 234-5678',
        'address': '104 Meadowlane Way, Portland, OR',
        'created_at': now - timedelta(days=30),
        'updated_at': now,
    }
    s1_res = db.users.insert_one(shelter1_user)
    shelter1_id = str(s1_res.inserted_id)

    db.shelters.insert_one({
        'user_id': shelter1_id,
        'shelter_name': 'Green Haven Animal Sanctuary',
        'contact_email': 'shelter@pawconnect.org',
        'phone': '+1 (555) 234-5678',
        'address': '104 Meadowlane Way, Portland, OR',
        'bio': 'A non-profit rescue sanctuary dedicated to rehabilitating and rehoming dogs, cats, and rescue animals with loving families since 2018.',
        'website': 'https://greenhavenpets.example.org',
        'verified': True,
        'created_at': now - timedelta(days=30),
        'updated_at': now,
    })

    shelter2_user = {
        'name': 'Sunny Paws Community Rescue',
        'email': 'sunnypaws@pawconnect.org',
        'password': hashed_pwd,
        'role': 'shelter',
        'phone': '+1 (555) 876-5432',
        'address': '742 Sunshine Blvd, Austin, TX',
        'created_at': now - timedelta(days=20),
        'updated_at': now,
    }
    s2_res = db.users.insert_one(shelter2_user)
    shelter2_id = str(s2_res.inserted_id)

    db.shelters.insert_one({
        'user_id': shelter2_id,
        'shelter_name': 'Sunny Paws Community Rescue',
        'contact_email': 'sunnypaws@pawconnect.org',
        'phone': '+1 (555) 876-5432',
        'address': '742 Sunshine Blvd, Austin, TX',
        'bio': 'Community foster network providing medical care, love, and forever-home placement for rescued animals.',
        'website': 'https://sunnypaws.example.org',
        'verified': True,
        'created_at': now - timedelta(days=20),
        'updated_at': now,
    })

    # 2. Create Adopter Users
    adopter1_user = {
        'name': 'Alex Morgan',
        'email': 'adopter@pawconnect.org',
        'password': hashed_pwd,
        'role': 'adopter',
        'phone': '+1 (555) 345-6789',
        'address': '45 Elm Street, Portland, OR',
        'created_at': now - timedelta(days=15),
        'updated_at': now,
    }
    a1_res = db.users.insert_one(adopter1_user)
    adopter1_id = str(a1_res.inserted_id)

    adopter2_user = {
        'name': 'Sarah Jenkins',
        'email': 'sarah@pawconnect.org',
        'password': hashed_pwd,
        'role': 'adopter',
        'phone': '+1 (555) 987-6543',
        'address': '88 Maple Ave, Austin, TX',
        'created_at': now - timedelta(days=10),
        'updated_at': now,
    }
    a2_res = db.users.insert_one(adopter2_user)
    adopter2_id = str(a2_res.inserted_id)

    # 3. Create Diverse Pets
    pets_data = [
        {
            'shelter_id': shelter1_id,
            'name': 'Bella',
            'species': 'Dog',
            'breed': 'Golden Retriever',
            'age': 2.0,
            'age_unit': 'years',
            'gender': 'Female',
            'size': 'Large',
            'activity_level': 'Moderate',
            'location': 'Portland, OR',
            'description': 'Bella is an affectionate, gentle Golden Retriever who loves long outdoor strolls, playing fetch in the park, and snuggling on the rug.',
            'health_status': 'Fully vaccinated, microchipped, spayed, heartworm tested negative.',
            'spayed_neutered': True,
            'vaccinated': True,
            'good_with_kids': True,
            'good_with_pets': True,
            'status': 'available',
            'featured': True,
            'image_url': 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&auto=format&fit=crop',
            'created_at': now - timedelta(days=12),
            'updated_at': now - timedelta(days=12),
        },
        {
            'shelter_id': shelter1_id,
            'name': 'Milo',
            'species': 'Cat',
            'breed': 'Tabby Domestic Shorthair',
            'age': 1.5,
            'age_unit': 'years',
            'gender': 'Male',
            'size': 'Small',
            'activity_level': 'Low',
            'location': 'Portland, OR',
            'description': 'Milo is a calm, purring companion who loves sunbathing on window sills and chasing feather toys in the evening.',
            'health_status': 'Neutered, vaccinated, dewormed, healthy FIV/FeLV negative.',
            'spayed_neutered': True,
            'vaccinated': True,
            'good_with_kids': True,
            'good_with_pets': True,
            'status': 'available',
            'featured': True,
            'image_url': 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop',
            'created_at': now - timedelta(days=10),
            'updated_at': now - timedelta(days=10),
        },
        {
            'shelter_id': shelter2_id,
            'name': 'Luna',
            'species': 'Dog',
            'breed': 'Border Collie Mix',
            'age': 3.0,
            'age_unit': 'years',
            'gender': 'Female',
            'size': 'Medium',
            'activity_level': 'High',
            'location': 'Austin, TX',
            'description': 'Luna is highly intelligent and agile! She thrives with active humans who enjoy hiking, agility games, and outdoor adventures.',
            'health_status': 'Up to date on all shots, spayed, very energetic and healthy.',
            'spayed_neutered': True,
            'vaccinated': True,
            'good_with_kids': True,
            'good_with_pets': True,
            'status': 'available',
            'featured': True,
            'image_url': 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&auto=format&fit=crop',
            'created_at': now - timedelta(days=9),
            'updated_at': now - timedelta(days=9),
        },
        {
            'shelter_id': shelter1_id,
            'name': 'Oliver',
            'species': 'Cat',
            'breed': 'Russian Blue Mix',
            'age': 0.8,
            'age_unit': 'years',
            'gender': 'Male',
            'size': 'Small',
            'activity_level': 'Moderate',
            'location': 'Portland, OR',
            'description': 'Oliver is a velvety grey youngster who loves warm laps and curiosity-fueled explorations.',
            'health_status': 'Vaccinated, microchipped, neutered.',
            'spayed_neutered': True,
            'vaccinated': True,
            'good_with_kids': True,
            'good_with_pets': False,
            'status': 'available',
            'featured': False,
            'image_url': 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800&auto=format&fit=crop',
            'created_at': now - timedelta(days=8),
            'updated_at': now - timedelta(days=8),
        },
        {
            'shelter_id': shelter2_id,
            'name': 'Charlie',
            'species': 'Dog',
            'breed': 'Beagle',
            'age': 4.0,
            'age_unit': 'years',
            'gender': 'Male',
            'size': 'Medium',
            'activity_level': 'Moderate',
            'location': 'Austin, TX',
            'description': 'Charlie has those classic soulful Beagle eyes and a sweet personality. Great family dog who gets along with everyone.',
            'health_status': 'Vaccinated, neutered, treated for seasonal allergies.',
            'spayed_neutered': True,
            'vaccinated': True,
            'good_with_kids': True,
            'good_with_pets': True,
            'status': 'available',
            'featured': True,
            'image_url': 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=800&auto=format&fit=crop',
            'created_at': now - timedelta(days=7),
            'updated_at': now - timedelta(days=7),
        },
        {
            'shelter_id': shelter1_id,
            'name': 'Thumper',
            'species': 'Rabbit',
            'breed': 'Holland Lop',
            'age': 1.0,
            'age_unit': 'years',
            'gender': 'Male',
            'size': 'Small',
            'activity_level': 'Low',
            'location': 'Portland, OR',
            'description': 'Thumper is a friendly, litter-trained indoor rabbit who enjoys munching timothy hay and gentle head scratches.',
            'health_status': 'Neutered, veterinary health certificate provided.',
            'spayed_neutered': True,
            'vaccinated': True,
            'good_with_kids': True,
            'good_with_pets': False,
            'status': 'available',
            'featured': False,
            'image_url': 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=800&auto=format&fit=crop',
            'created_at': now - timedelta(days=6),
            'updated_at': now - timedelta(days=6),
        },
        {
            'shelter_id': shelter2_id,
            'name': 'Daisy',
            'species': 'Dog',
            'breed': 'Corgi Mix',
            'age': 1.2,
            'age_unit': 'years',
            'gender': 'Female',
            'size': 'Small',
            'activity_level': 'Moderate',
            'location': 'Austin, TX',
            'description': 'Daisy is a joyful bundle of energy with sweet short legs and giant ears. Loves learning tricks and meeting new people.',
            'health_status': 'Spayed, up to date on vaccinations.',
            'spayed_neutered': True,
            'vaccinated': True,
            'good_with_kids': True,
            'good_with_pets': True,
            'status': 'available',
            'featured': False,
            'image_url': 'https://images.unsplash.com/photo-1612536057832-2ff7ead7f363?w=800&auto=format&fit=crop',
            'created_at': now - timedelta(days=5),
            'updated_at': now - timedelta(days=5),
        },
        {
            'shelter_id': shelter2_id,
            'name': 'Pip & Sunny',
            'species': 'Bird',
            'breed': 'Cockatiel',
            'age': 2.0,
            'age_unit': 'years',
            'gender': 'Male',
            'size': 'Small',
            'activity_level': 'Low',
            'location': 'Austin, TX',
            'description': 'Sunny is a whistling cockatiel who enjoys mimicking tunes and sitting quietly on your shoulder while you work.',
            'health_status': 'Avian vet checked, clean bill of health.',
            'spayed_neutered': False,
            'vaccinated': True,
            'good_with_kids': True,
            'good_with_pets': False,
            'status': 'available',
            'featured': False,
            'image_url': 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop',
            'created_at': now - timedelta(days=4),
            'updated_at': now - timedelta(days=4),
        },
    ]

    inserted_pet_ids = []
    for pet in pets_data:
        res = db.pets.insert_one(pet)
        inserted_pet_ids.append(str(res.inserted_id))

    # 4. Create Initial Adoption Application (for Alex Morgan -> Bella)
    bella_id = inserted_pet_ids[0]
    app_doc = {
        'pet_id': bella_id,
        'adopter_id': adopter1_id,
        'shelter_id': shelter1_id,
        'adopter_name': 'Alex Morgan',
        'adopter_email': 'adopter@pawconnect.org',
        'adopter_phone': '+1 (555) 345-6789',
        'living_type': 'House with fenced yard',
        'has_yard': True,
        'household_members': '2 adults, no children',
        'has_other_pets': False,
        'other_pets_details': '',
        'previous_experience': 'Grew up with Golden Retrievers and labradors; experienced with training.',
        'reason_for_adoption': 'Looking for an energetic, loving companion for hiking and family life.',
        'time_alone_hours': '1-2 hours (work from home)',
        'readiness_acknowledged': True,
        'status': 'under_review',  # Shows the status tracker in action!
        'rejection_reason': '',
        'status_history': [
            {
                'status': 'submitted',
                'timestamp': (now - timedelta(days=3)).isoformat(),
                'note': 'Application submitted by Alex Morgan.'
            },
            {
                'status': 'under_review',
                'timestamp': (now - timedelta(days=1)).isoformat(),
                'note': 'Application is currently being reviewed by shelter staff.'
            }
        ],
        'created_at': now - timedelta(days=3),
        'updated_at': now - timedelta(days=1),
    }
    app_res = db.applications.insert_one(app_doc)

    # 5. Create Initial Favorites
    db.favorites.insert_one({
        'user_id': adopter1_id,
        'pet_id': bella_id,
        'created_at': now - timedelta(days=4)
    })
    db.favorites.insert_one({
        'user_id': adopter1_id,
        'pet_id': inserted_pet_ids[1], # Milo
        'created_at': now - timedelta(days=3)
    })

    # 6. Create Initial Notifications
    db.notifications.insert_one({
        'user_id': adopter1_id,
        'title': 'Application Status Updated',
        'message': 'Your application for Bella is now Under Review by Green Haven Animal Sanctuary.',
        'type': 'status_change',
        'related_id': str(app_res.inserted_id),
        'read': False,
        'created_at': now - timedelta(days=1),
    })
    db.notifications.insert_one({
        'user_id': shelter1_id,
        'title': 'New Adoption Application for Bella',
        'message': 'Alex Morgan submitted an application for Bella.',
        'type': 'new_application',
        'related_id': str(app_res.inserted_id),
        'read': False,
        'created_at': now - timedelta(days=3),
    })

    # 7. Create Sample Meet & Greet Visits
    tomorrow_str = (now + timedelta(days=2)).strftime('%Y-%m-%d')
    next_week_str = (now + timedelta(days=5)).strftime('%Y-%m-%d')

    db.visits.delete_many({})
    db.visits.insert_one({
        'adopter_id': adopter1_id,
        'adopter_name': 'Alex Morgan',
        'adopter_email': 'adopter@pawconnect.org',
        'adopter_phone': '+1 (555) 019-2834',
        'pet_id': bella_id,
        'pet_name': 'Bella',
        'pet_species': 'Dog',
        'pet_breed': 'Golden Retriever Mix',
        'pet_image': 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&auto=format&fit=crop',
        'shelter_id': shelter1_id,
        'shelter_name': 'Green Haven Animal Sanctuary',
        'visit_date': tomorrow_str,
        'time_slot': '10:00 AM - 11:00 AM',
        'notes': 'Excited to meet Bella! Bringing our family to check mutual compatibility.',
        'status': 'confirmed',
        'shelter_note': 'Confirmed! Staff member Sarah will meet you at the main greeting pavilion.',
        'created_at': now - timedelta(days=2),
        'updated_at': now - timedelta(days=1),
    })

    db.visits.insert_one({
        'adopter_id': adopter1_id,
        'adopter_name': 'Alex Morgan',
        'adopter_email': 'adopter@pawconnect.org',
        'adopter_phone': '+1 (555) 019-2834',
        'pet_id': inserted_pet_ids[1], # Milo
        'pet_name': 'Milo',
        'pet_species': 'Cat',
        'pet_breed': 'Domestic Short Hair (Tabby)',
        'pet_image': 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop',
        'shelter_id': shelter1_id,
        'shelter_name': 'Green Haven Animal Sanctuary',
        'visit_date': next_week_str,
        'time_slot': '02:00 PM - 03:00 PM',
        'notes': 'Looking forward to meeting Milo and spending time in the cat cuddle playroom.',
        'status': 'pending',
        'shelter_note': '',
        'created_at': now - timedelta(hours=5),
        'updated_at': now - timedelta(hours=5),
    })

    print(f"[PawConnect Seed] Successfully created:")
    print(f"  - 2 Shelter accounts (shelter@pawconnect.org, sunnypaws@pawconnect.org)")
    print(f"  - 2 Adopter accounts (adopter@pawconnect.org, sarah@pawconnect.org)")
    print(f"  - {len(pets_data)} Diverse Pets with high-res photos across Dogs, Cats, Rabbits, and Birds")
    print(f"  - 1 Active Multi-stage Adoption Application demonstrating the Status Tracker")
    print(f"  - 2 Realistic Meet & Greet Scheduled Visits in MongoDB (1 Confirmed, 1 Pending)")
    print(f"  - Sample favorites and notifications in MongoDB!")

if __name__ == '__main__':
    seed_pawconnect_data()
