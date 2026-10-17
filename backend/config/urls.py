"""
PawConnect root URL configuration.
"""
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('api/auth/', include('apps.accounts.urls')),
    path('api/pets/', include('apps.pets.urls')),
    path('api/adoptions/', include('apps.adoptions.urls')),
    path('api/shelter/', include('apps.shelters.urls')),
    path('api/admin/', include('apps.admin_portal.urls')),
    path('api/', include('apps.common.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
