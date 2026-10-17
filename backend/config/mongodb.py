"""
Centralized MongoDB connection and helper module for PawConnect.
Uses PyMongo directly as requested by the user.
"""
import os
from datetime import datetime
from bson import ObjectId
import pymongo
from pymongo import MongoClient

_client = None
_db = None

def get_client():
    global _client
    if _client is None:
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
        _client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    return _client

def get_db():
    global _db
    if _db is None:
        client = get_client()
        db_name = os.getenv("MONGO_DB_NAME", "pawconnect_db")
        _db = client[db_name]
    return _db

def serialize_doc(doc):
    """
    Convert MongoDB document into JSON-serializable dictionary:
    - Replaces `_id` with `id` (as string)
    - Converts nested ObjectIds to strings
    - Converts datetime to ISO-8601 strings
    """
    if doc is None:
        return None
    
    serialized = {}
    for key, value in doc.items():
        if key == "_id":
            serialized["id"] = str(value)
        elif isinstance(value, ObjectId):
            serialized[key] = str(value)
        elif isinstance(value, datetime):
            serialized[key] = value.isoformat()
        elif isinstance(value, list):
            serialized[key] = [
                serialize_doc(item) if isinstance(item, dict)
                else str(item) if isinstance(item, ObjectId)
                else item.isoformat() if isinstance(item, datetime)
                else item
                for item in value
            ]
        elif isinstance(value, dict):
            serialized[key] = serialize_doc(value)
        else:
            serialized[key] = value
    return serialized

def serialize_docs(cursor):
    """Convert cursor or list of documents to list of serialized dicts."""
    return [serialize_doc(doc) for doc in cursor]

def init_db_indexes():
    """Ensure essential indexes exist for performance and integrity."""
    db = get_db()
    try:
        # Users collection: unique email
        db.users.create_index([("email", pymongo.ASCENDING)], unique=True)
        # Shelters collection
        db.shelters.create_index([("user_id", pymongo.ASCENDING)])
        # Pets collection: search and filtering
        db.pets.create_index([("species", pymongo.ASCENDING)])
        db.pets.create_index([("status", pymongo.ASCENDING)])
        db.pets.create_index([("shelter_id", pymongo.ASCENDING)])
        # Applications collection
        db.applications.create_index([("adopter_id", pymongo.ASCENDING)])
        db.applications.create_index([("shelter_id", pymongo.ASCENDING)])
        db.applications.create_index([("pet_id", pymongo.ASCENDING)])
        # Favorites collection: unique pair user_id + pet_id
        db.favorites.create_index([("user_id", pymongo.ASCENDING), ("pet_id", pymongo.ASCENDING)], unique=True)
        # Notifications collection
        db.notifications.create_index([("user_id", pymongo.ASCENDING)])
        print("[MongoDB] Indexes initialized successfully.")
    except Exception as e:
        print(f"[MongoDB] Warning: Index creation encountered: {e}")

def ping_db():
    """Verify MongoDB connectivity."""
    try:
        client = get_client()
        client.admin.command('ping')
        return True, "Connected to MongoDB successfully."
    except Exception as e:
        return False, str(e)
