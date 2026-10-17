from django.urls import path
from .views import (
    list_pets,
    pet_detail,
    create_pet,
    update_pet,
    delete_pet,
    pawmatch_recommendations,
    home_featured
)

urlpatterns = [
    path('', list_pets, name='pets-list'),
    path('featured/', home_featured, name='pets-featured'),
    path('match/', pawmatch_recommendations, name='pets-pawmatch'),
    path('create/', create_pet, name='pets-create'),
    path('<str:pet_id>/', pet_detail, name='pets-detail'),
    path('<str:pet_id>/update/', update_pet, name='pets-update'),
    path('<str:pet_id>/delete/', delete_pet, name='pets-delete'),
]
