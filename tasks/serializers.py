from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Task, Attachment
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user
    
class AttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Attachment
        fields = ('id', 'task', 'file', 'file_name', 'file_size', 'uploaded_at', 'file_url')
        read_only_fields = ('file_name', 'file_size', 'uploaded_at')

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

class TaskSerializer(serializers.ModelSerializer):
    is_due_soon = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()

    attachments = AttachmentSerializer(many=True, read_only=True)
    class Meta:
        model = Task;
        fields = ['id', 'title', 'description', 'category', 'status', 'dueDate', 'dueTime', 'owner', 'is_due_soon', 'is_overdue', 'attachments']
        read_only_fields = ['owner']

