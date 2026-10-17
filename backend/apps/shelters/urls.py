from django.urls import path
from .views import (
    shelter_dashboard,
    shelter_my_pets,
    shelter_profile,
)

urlpatterns = [
    path('dashboard/', shelter_dashboard, name='shelter-dashboard'),
    path('pets/', shelter_my_pets, name='shelter-pets'),
    path('profile/', shelter_profile, name='shelter-profile'),
]
