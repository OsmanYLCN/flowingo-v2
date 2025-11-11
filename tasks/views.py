from django.contrib.auth.models import User
from rest_framework import generics, permissions
from .serializers import UserSerializer, TaskSerializer

from django.contrib.auth import authenticate 
from rest_framework.authtoken.models import Token 
from rest_framework.response import Response 
from rest_framework.views import APIView 
from rest_framework import status, viewsets
from .models import Task




class UserCreateView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Kullanıcı adı, e-posta ve parola ile yeni bir kullanıcı oluşturur.  
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

class LoginView(APIView):
    """
    POST /api/auth/login/
    Kullanıcı adı ve parola ile giriş yapar, Token döndürür.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args,  **kwargs):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)

        if user is not None:
            token, created = Token.objects.get_or_create(user=user)
            
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
        
class TaskViewSet(viewsets.ModelViewSet):
    """
    GET    /api/tasks/     -> Görevleri listele
    POST   /api/tasks/     -> Yeni görev yarat
    GET    /api/tasks/:id/ -> Bir görevin detayını gör (Token zorunlu)
    PUT    /api/tasks/:id/ -> Bir görevi güncelle (Token zorunlu)
    DELETE /api/tasks/:id/ -> Bir görevi sil (Token zorunlu)
    """

    serializer_class = TaskSerializer

    def get_queryset(self):
        return Task.objects.filter(owner = self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(owner = self.request.user)
