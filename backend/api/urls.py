from django.urls import path
from . import views

urlpatterns = [
    # Family member registration
    path('register/', views.register_family_member, name='register'),
    path('upload-voice/', views.upload_voice, name='upload_voice'),
    
    # Memory creation
    path('create-memory/', views.create_memory, name='create_memory'),
    
    # Patient query
    path('query/', views.patient_query, name='patient_query'),
    
    # Get data
    path('family-members/<uuid:patient_id>/', views.get_family_members, name='get_family_members'),
    path('memories/<uuid:family_member_id>/', views.get_memories, name='get_memories'),
]