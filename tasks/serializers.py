from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Task

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
    
class TaskSerializer(serializers.ModelSerializer):
    is_due_soon = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    class Meta:
        model = Task;
        fields = ['id', 'title', 'description', 'category', 'status', 'dueDate', 'dueTime', 'owner', 'is_due_soon', 'is_overdue']
        read_only_fields = ['owner']
