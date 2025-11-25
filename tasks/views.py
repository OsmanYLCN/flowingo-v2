from django.contrib.auth.models import User
from rest_framework import generics, permissions
from .serializers import UserSerializer, TaskSerializer

from django.contrib.auth import authenticate, login, logout # Login ve Logout eklendi
from rest_framework.authtoken.models import Token 
from rest_framework.response import Response 
from rest_framework.views import APIView 
from rest_framework import status, viewsets
from .models import Task
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
            # 1. Token Oluştur/Getir
            token, created = Token.objects.get_or_create(user=user)
            
            # 2. KRİTİK HAMLE: Django Session Oturumunu Başlat
            # Bu sayede {% if user.is_authenticated %} çalışacak.
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

    def get_queryset(self):
        # Eğer kullanıcı giriş yapmamışsa boş liste döndür (Hata almamak için)
        if self.request.user.is_anonymous:
            return Task.objects.none()
        return Task.objects.filter(owner = self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(owner = self.request.user)