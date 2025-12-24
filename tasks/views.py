from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import redirect
from .models import Task, Attachment
from .serializers import UserSerializer, TaskSerializer, AttachmentSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.authtoken.models import Token 
from rest_framework.response import Response 
from rest_framework.views import APIView 
from rest_framework import status, viewsets
from rest_framework import generics, permissions, parsers
from rest_framework.parsers import MultiPartParser, FormParser

# --- AUTH VIEWLARI ---

class UserCreateView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)

        if user is not None:
            token, created = Token.objects.get_or_create(user=user)
            login(request, user) # Session aç
            
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
    def post(self, request):
        if request.user.is_authenticated:
            try:
                request.user.auth_token.delete()
            except (AttributeError, Token.DoesNotExist):
                pass
            logout(request) # Session kapat
            
        return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)

# --- TASK VIEWLARI ---

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_anonymous:
            return Task.objects.none()
        
        # Admin ise hepsini görsün
        if self.request.user.is_staff:
            return Task.objects.all().prefetch_related('attachments').order_by('-created_at')
        
        # Normal kullanıcı sadece kendi görevlerini görsün
        return Task.objects.filter(owner__id=self.request.user.id).prefetch_related('attachments').order_by('-created_at')
    
    def perform_create(self, serializer):
        # --- DÜZELTİLEN KISIM BURASI ---
        # Admin başkasına görev atıyorsa:
        if self.request.user.is_staff and 'owner_id' in self.request.data:
            try:
                # Hatayı düzelttim: .data('owner_id') -> .data.get('owner_id')
                target_user_id = self.request.data.get('owner_id')
                if target_user_id:
                    target_user = User.objects.get(id=target_user_id)
                    serializer.save(owner=target_user)
                    return
            except User.DoesNotExist:
                pass # Kullanıcı bulunamazsa kendine ata

        # Admin değilse veya ID yoksa görevi kendine ata
        serializer.save(owner=self.request.user)

class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (parsers.MultiPartParser, parsers.FormParser)

    def get_queryset(self):
        # Sadece kendi görevlerine ait dosyaları gör
        return Attachment.objects.filter(task__owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

# --- EKSTRA VIEWLAR (USERS, PROFILE) ---

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_user_list(request):
    users = User.objects.values('id', 'username')
    return Response(list(users))

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    user = request.user
    
    if request.method == 'GET':
        return Response({
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'date_joined': user.date_joined.strftime('%Y-%m-%d'),
        })
    
    elif request.method == 'PUT':
        user.first_name = request.data.get('first_name', user.first_name)
        user.last_name = request.data.get('last_name', user.last_name)
        user.email = request.data.get('email', user.email)
        user.save()
        return Response({'message': 'Profil güncellendi!', 'username': user.username})