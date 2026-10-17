from django.urls import path
from .views import (
    list_favorites,
    toggle_favorite,
    list_notifications,
    mark_notification_read,
    mark_all_notifications_read,
    contact_message,
    health_status,
    assess_readiness,
)

urlpatterns = [
    path('favorites/', list_favorites, name='common-favorites'),
    path('favorites/toggle/', toggle_favorite, name='common-favorites-toggle'),
    path('notifications/', list_notifications, name='common-notifications'),
    path('notifications/<str:notif_id>/read/', mark_notification_read, name='common-notifications-read'),
    path('notifications/read-all/', mark_all_notifications_read, name='common-notifications-read-all'),
    path('contact/', contact_message, name='common-contact'),
    path('health/', health_status, name='common-health'),
    path('readiness/assess/', assess_readiness, name='common-readiness-assess'),
]
