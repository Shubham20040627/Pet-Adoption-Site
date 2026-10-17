"""
Create or update the platform Administrator account.
Credentials:
  Email:    admin@pawconnect.org
  Password: admin123
  Role:     admin
"""
import os
from datetime import datetime, timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from django.contrib.auth.hashers import make_password
from config.mongodb import get_db

def setup_admin():
    db = get_db()
    now = datetime.now(timezone.utc)

    admin_email = "admin@pawconnect.org"
    admin_password = "admin123"
    admin_name = "Central Administrator"

    print(f"[*] Setting up Admin account: {admin_email}...")

    hashed_pwd = make_password(admin_password)

    db.users.update_one(
        {"email": admin_email},
        {
            "$set": {
                "name": admin_name,
                "email": admin_email,
                "password": hashed_pwd,
                "role": "admin",
                "phone": "+1 (555) 000-0001",
                "address": "PawConnect HQ, Central Administration",
                "updated_at": now
            },
            "$setOnInsert": {
                "created_at": now
            }
        },
        upsert=True
    )
    print(f"[OK] Admin user ready in MongoDB: {admin_email} / {admin_password}")

    # Set statuses for existing shelters:
    # 1. Hope & Paws Sanctuary -> approved (our primary sample)
    db.shelters.update_one(
        {"contact_email": "shelter@demo.com"},
        {"$set": {"status": "approved", "verified": True}}
    )
    # 2. Green Haven -> approved
    db.shelters.update_one(
        {"contact_email": "shelter@pawconnect.org"},
        {"$set": {"status": "approved", "verified": True}}
    )
    # 3. xyz / abc@gmail.com -> pending (for admin demo approval!)
    db.shelters.update_one(
        {"contact_email": "abc@gmail.com"},
        {"$set": {"status": "pending", "verified": False}}
    )

    # 4. Also add a new realistic pending shelter demo request:
    db.shelters.update_one(
        {"contact_email": "whiskerhaven@rescue.org"},
        {
            "$set": {
                "shelter_name": "Whisker Haven Rescue NGO",
                "contact_email": "whiskerhaven@rescue.org",
                "phone": "+1 (555) 432-8899",
                "address": "402 Pinecreek Blvd, Seattle, WA",
                "bio": "Dedicated non-profit feline and small animal sanctuary specializing in senior pet rescue and rehabilitation.",
                "license_code": "WA-NGO-2026-9041",
                "status": "pending",
                "verified": False,
                "updated_at": now
            },
            "$setOnInsert": {
                "created_at": now
            }
        },
        upsert=True
    )

    print("[OK] Shelters status configuration complete.")
    print("="*50)
    print(" ADMIN CREDENTIALS:")
    print(f" Email:    {admin_email}")
    print(f" Password: {admin_password}")
    print("="*50)

if __name__ == '__main__':
    setup_admin()
