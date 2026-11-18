from django.urls import path
from .views import register_view, login_view, me_view, google_auth_view

urlpatterns = [
    path('register/', register_view, name='auth-register'),
    path('login/', login_view, name='auth-login'),
    path('me/', me_view, name='auth-me'),
    path('google/', google_auth_view, name='auth-google'),
]
