from datetime import datetime, timezone
import os
import sys

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from config.mongodb import get_db

db = get_db()
s1 = db.shelters.find_one()
s1_id = s1.get('user_id') if s1 else ''
now = datetime.now(timezone.utc)

pets = [
    {
        'name': 'Buddy',
        'species': 'Dog',
        'breed': 'Golden Retriever',
        'age': 2.0,
        'age_unit': 'years',
        'gender': 'Male',
        'size': 'Large',
        'weight_display': 'Large (25–32 kg)',
        'activity_level': 'High',
        'energy_level': 'High',
        'location': 'Portland, OR',
        'shelter_name': 'LPU Shelter',
        'description': 'Buddy is an affectionate, gentle Golden Retriever who loves long outdoor strolls and playing fetch.',
        'health_status': 'Healthy',
        'spayed_neutered': True,
        'vaccinated': True,
        'good_with_kids': True,
        'good_with_pets': True,
        'special_needs': 'No',
        'temperament': 'Friendly, Playful, Loyal',
        'status': 'available',
        'featured': True,
        'image_url': 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&auto=format&fit=crop',
        'shelter_id': s1_id,
        'created_at': now,
        'updated_at': now
    },
    {
        'name': 'Luna',
        'species': 'Cat',
        'breed': 'Domestic Shorthair',
        'age': 1.0,
        'age_unit': 'year',
        'gender': 'Female',
        'size': 'Small',
        'weight_display': 'Small (3–5 kg)',
        'activity_level': 'Moderate',
        'energy_level': 'Medium',
        'location': 'Portland, OR',
        'shelter_name': 'City Shelter',
        'description': 'Luna is a calm, independent domestic shorthair who loves window sunbathing.',
        'health_status': 'Healthy',
        'spayed_neutered': True,
        'vaccinated': True,
        'good_with_kids': True,
        'good_with_pets': 'Depends',
        'special_needs': 'No',
        'temperament': 'Calm, Independent, Affectionate',
        'status': 'available',
        'featured': True,
        'image_url': 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop',
        'shelter_id': s1_id,
        'created_at': now,
        'updated_at': now
    },
    {
        'name': 'Max',
        'species': 'Dog',
        'breed': 'Indie Mix',
        'age': 3.0,
        'age_unit': 'years',
        'gender': 'Male',
        'size': 'Medium',
        'weight_display': 'Medium (15–22 kg)',
        'activity_level': 'Moderate',
        'energy_level': 'Medium',
        'location': 'Portland, OR',
        'shelter_name': 'Happy Paws NGO',
        'description': 'Max is an intelligent, alert companion who thrives with active humans.',
        'health_status': 'Healthy',
        'spayed_neutered': True,
        'vaccinated': True,
        'good_with_kids': True,
        'good_with_pets': True,
        'special_needs': 'No',
        'temperament': 'Friendly, Alert, Intelligent',
        'status': 'available',
        'featured': True,
        'image_url': 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop',
        'shelter_id': s1_id,
        'created_at': now,
        'updated_at': now
    }
]

for p in pets:
    db.pets.update_one({'name': p['name'], 'species': p['species']}, {'$set': p}, upsert=True)

print('Pets seeded successfully:', [p['name'] for p in pets])
