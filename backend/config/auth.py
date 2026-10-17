"""
Authentication & Authorization for PawConnect using PyMongo and JWT.
Compatible with Django REST Framework request.user and permission classes.
"""
import os
from datetime import datetime, timedelta, timezone
from bson import ObjectId
import jwt
from rest_framework import authentication, permissions
from rest_framework.exceptions import AuthenticationFailed
from config.mongodb import get_db

JWT_SECRET = os.getenv("JWT_SECRET", "pawconnect-jwt-secret-key-secure-2026")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "72"))

class MongoUser:
    """Represents an authenticated MongoDB user within Django REST Framework."""
    def __init__(self, doc):
        self.doc = doc
        self.id = str(doc.get("_id"))
        self.user_id = self.id
        self.email = doc.get("email", "")
        self.name = doc.get("name", "")
        self.role = doc.get("role", "adopter")
        self.phone = doc.get("phone", "")
        self.is_authenticated = True
        self.is_active = True
        self.is_staff = (self.role == "admin")
        self.is_superuser = (self.role == "admin")

    @property
    def is_adopter(self):
        return self.role == "adopter"

    @property
    def is_shelter(self):
        return self.role == "shelter"

    @property
    def is_admin(self):
        return self.role == "admin" or self.is_superuser

    def __str__(self):
        return f"{self.name} ({self.email}) [{self.role}]"

def generate_jwt_token(user_doc):
    """Generate a JWT token containing user identity and role."""
    payload = {
        "user_id": str(user_doc["_id"]),
        "email": user_doc.get("email", ""),
        "role": user_doc.get("role", "adopter"),
        "name": user_doc.get("name", ""),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token):
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed("Session token has expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise AuthenticationFailed("Invalid authentication token.")

class MongoJWTAuthentication(authentication.BaseAuthentication):
    """DRF Authentication provider that validates JWT against MongoDB users."""
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return None
        
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None
        
        token = parts[1]
        payload = decode_jwt_token(token)
        user_id = payload.get("user_id")
        
        if not user_id:
            raise AuthenticationFailed("Token missing user identification.")
        
        try:
            db = get_db()
            user_doc = db.users.find_one({"_id": ObjectId(user_id)})
            if not user_doc:
                raise AuthenticationFailed("User not found or account removed.")
            return (MongoUser(user_doc), token)
        except Exception as e:
            if isinstance(e, AuthenticationFailed):
                raise e
            raise AuthenticationFailed(f"Authentication error: {str(e)}")

class IsAuthenticatedMongoUser(permissions.BasePermission):
    """Allows access only to authenticated MongoDB users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

class IsAdopter(permissions.BasePermission):
    """Allows access only to authenticated adopters."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == "adopter"
        )

class IsShelter(permissions.BasePermission):
    """Allows access only to authenticated shelters."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == "shelter"
        )


class IsAdmin(permissions.BasePermission):
    """Allows access only to authenticated administrators."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == "admin" or getattr(request.user, "is_superuser", False))
        )

