from django.urls import path
from .views import (
    admin_overview,
    admin_shelters_list,
    admin_update_shelter_status,
)

urlpatterns = [
    path('overview/', admin_overview, name='admin-overview'),
    path('shelters/', admin_shelters_list, name='admin-shelters-list'),
    path('shelters/<str:user_id>/status/', admin_update_shelter_status, name='admin-update-shelter-status'),
]
