from django.contrib.auth.models import User
from rest_framework import generics, permissions, parsers
from .serializers import UserSerializer, TaskSerializer, AttachmentSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import authenticate, login, logout # Login ve Logout eklendi
from rest_framework.authtoken.models import Token 
from rest_framework.response import Response 
from rest_framework.views import APIView 
from rest_framework import status, viewsets
from .models import Task, Attachment
from django.shortcuts import redirect

class UserCreateView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

class LoginView(APIView):
    """
    POST /api/auth/login/
    Hem Token döndürür hem de Django Session açar.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args,  **kwargs):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)

        if user is not None:
            token, created = Token.objects.get_or_create(user=user)
            login(request, user)
            
            return Response({
                "token": token.key,
                "user_id": user.pk,
                "email": user.email
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {"error": "Invalid Credentials"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

class LogoutView(APIView):
    """
    Hem Token'ı siler hem de Session'ı kapatır.
    """
    def post(self, request):
        # 1. Token'ı Sil (Varsa)
        if request.user.is_authenticated:
            try:
                request.user.auth_token.delete()
            except (AttributeError, Token.DoesNotExist):
                pass
            
            # 2. Django Session Oturumunu Kapat
            logout(request)
            
        return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_anonymous:
            return Task.objects.none()
        
        if self.request.user.is_staff:
            return Task.objects.all().prefetch_related('attachments').order_by('-created_at')
        
        return Task.objects.filter(owner__id=self.request.user.id).prefetch_related('attachments').order_by('-created_at')
    
    def perform_create(self, serializer):
        if self.request.user.is_staff and 'owner_id' in self.request.data:
            from django.contrib.auth.models import User
            try:
                target_user = User.objects.get(id = self.request.data('owner_id'))
                serializer.save(owner=target_user)
                return
            except User.DoesNotExist:
                pass

        serializer.save(owner=self.request.user)

class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (parsers.MultiPartParser, parsers.FormParser)

    def get_queryset(self):
        return Attachment.objects.filter(task__owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
        