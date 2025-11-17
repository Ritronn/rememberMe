from rest_framework import serializers

class FamilyMemberSerializer(serializers.Serializer):
    user_id = serializers.UUIDField(required=False, allow_null=True)  # Make optional
    patient_id = serializers.UUIDField()
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    relationship = serializers.CharField(max_length=100)
    profile_photo_url = serializers.URLField(required=False, allow_blank=True)

class VoiceUploadSerializer(serializers.Serializer):
    family_member_id = serializers.UUIDField()
    voice_sample = serializers.FileField()

class MemoryCreateSerializer(serializers.Serializer):
    family_member_id = serializers.UUIDField()
    title = serializers.CharField(max_length=255)
    content = serializers.CharField()
    photos = serializers.ListField(
        child=serializers.ImageField(),
        required=False
    )

class PatientQuerySerializer(serializers.Serializer):
    patient_id = serializers.UUIDField()
    query = serializers.CharField()

class VideoUploadSerializer(serializers.Serializer):
    family_member_id = serializers.UUIDField()
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    video = serializers.FileField()
    thumbnail = serializers.ImageField(required=False)

class VideoListSerializer(serializers.Serializer):
    patient_id = serializers.UUIDField()