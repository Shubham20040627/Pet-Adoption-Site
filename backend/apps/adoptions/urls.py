from django.urls import path
from .views import (
    submit_application,
    my_applications,
    shelter_applications,
    update_application_status,
    withdraw_application,
    book_visit,
    my_visits,
    shelter_visits,
    update_visit_status,
    get_adoption_certificate,
    verify_adoption_certificate,
    get_adoption_contract,
    sign_adoption_contract,
    list_conversations,
    get_thread_messages,
    send_thread_message,
)

urlpatterns = [
    path('apply/', submit_application, name='adoptions-apply'),
    path('my/', my_applications, name='adoptions-my'),
    path('shelter/', shelter_applications, name='adoptions-shelter'),
    path('verify-certificate/<str:cert_number>/', verify_adoption_certificate, name='adoptions-verify-certificate'),
    path('<str:app_id>/certificate/', get_adoption_certificate, name='adoptions-get-certificate'),
    path('<str:app_id>/contract/', get_adoption_contract, name='adoptions-get-contract'),
    path('<str:app_id>/contract/sign/', sign_adoption_contract, name='adoptions-sign-contract'),
    path('<str:app_id>/status/', update_application_status, name='adoptions-update-status'),
    path('<str:app_id>/withdraw/', withdraw_application, name='adoptions-withdraw'),

    # Meet & Greet Visit Scheduler
    path('visits/book/', book_visit, name='visits-book'),
    path('visits/my/', my_visits, name='visits-my'),
    path('visits/shelter/', shelter_visits, name='visits-shelter'),
    path('visits/<str:visit_id>/status/', update_visit_status, name='visits-update-status'),

    # Real-Time Contextual Live Messaging & Chat
    path('messages/conversations/', list_conversations, name='chat-conversations'),
    path('messages/thread/', get_thread_messages, name='chat-thread'),
    path('messages/send/', send_thread_message, name='chat-send'),
]

