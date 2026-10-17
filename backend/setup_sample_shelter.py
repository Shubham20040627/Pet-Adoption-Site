"""
Script to create/configure a dedicated sample shelter account with full access to ALL pets.
Email: shelter@demo.com
Password: password123
"""
import os
import sys
from datetime import datetime, timezone

# Initialize Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from django.contrib.auth.hashers import make_password
from config.mongodb import get_db

def setup_sample_shelter():
    db = get_db()
    now = datetime.now(timezone.utc)

    shelter_email = "shelter@demo.com"
    shelter_name = "Hope & Paws Animal Sanctuary"
    password_plain = "password123"

    print(f"[*] Setting up sample shelter account: {shelter_email}...")

    # 1. Create or update the shelter user in `users` collection
    existing_user = db.users.find_one({"email": shelter_email})
    hashed_pwd = make_password(password_plain)

    if existing_user:
        user_id = existing_user["_id"]
        db.users.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "name": shelter_name,
                    "password": hashed_pwd,
                    "role": "shelter",
                    "phone": "+1 (555) 789-0123",
                    "address": "104 Meadowlane Way, Portland, OR",
                    "updated_at": now
                }
            }
        )
        print(f"[*] Updated existing shelter user with ID: {user_id}")
    else:
        user_doc = {
            "name": shelter_name,
            "email": shelter_email,
            "password": hashed_pwd,
            "role": "shelter",
            "phone": "+1 (555) 789-0123",
            "address": "104 Meadowlane Way, Portland, OR",
            "created_at": now,
            "updated_at": now
        }
        res = db.users.insert_one(user_doc)
        user_id = res.inserted_id
        print(f"[*] Created new shelter user with ID: {user_id}")

    shelter_id_str = str(user_id)

    # 2. Create or update the shelter document in `shelters` collection
    shelter_profile = {
        "user_id": shelter_id_str,
        "shelter_name": shelter_name,
        "contact_email": shelter_email,
        "phone": "+1 (555) 789-0123",
        "address": "104 Meadowlane Way, Portland, OR",
        "bio": "Primary sample rescue sanctuary equipped with full administrative control to manage pets, applications, visits, and certificates.",
        "website": "https://hopeandpaws.pawconnect.org",
        "updated_at": now
    }

    db.shelters.update_one(
        {"user_id": shelter_id_str},
        {"$set": shelter_profile, "$setOnInsert": {"created_at": now}},
        upsert=True
    )
    print(f"[*] Configured shelter profile in `shelters` collection.")

    # 3. Assign ALL pets in MongoDB to this shelter
    pet_update_res = db.pets.update_many(
        {},
        {
            "$set": {
                "shelter_id": shelter_id_str,
                "shelter_name": shelter_name,
                "location": "Portland, OR"
            }
        }
    )
    print(f"[OK] Successfully assigned {pet_update_res.modified_count} pets to {shelter_name} (ID: {shelter_id_str}).")

    # 4. Assign all applications to this shelter so they appear in the dashboard
    app_update_res = db.applications.update_many(
        {},
        {
            "$set": {
                "shelter_id": shelter_id_str
            }
        }
    )
    print(f"[OK] Assigned {app_update_res.modified_count} applications to this shelter.")

    # 5. Assign all visits to this shelter
    visit_update_res = db.visits.update_many(
        {},
        {
            "$set": {
                "shelter_id": shelter_id_str
            }
        }
    )
    print(f"[OK] Assigned {visit_update_res.modified_count} meet & greet visits to this shelter.")

    # Summary
    total_pets = db.pets.count_documents({"shelter_id": shelter_id_str})
    print("\n" + "="*55)
    print(" SAMPLE SHELTER LOGIN READY")
    print("="*55)
    print(f" Organization: {shelter_name}")
    print(f" Email:        {shelter_email}")
    print(f" Password:     {password_plain}")
    print(f" Total Pets:   {total_pets} pets assigned and fully manageable")
    print("="*55)

if __name__ == '__main__':
    setup_sample_shelter()
