from django.contrib.auth.models import User
from rest_framework import generics, permissions
from .serializers import UserSerializer

from django.contrib.auth import authenticate # Kullanıcıyı doğrulayan ana fonksiyon
from rest_framework.authtoken.models import Token # Token modeli
from rest_framework.response import Response # API yanıtı döndürmek için
from rest_framework.views import APIView # Normal view yerine APIView 
from rest_framework import status



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
        # 1. Adım: Gelen veriden kullanıcı adı ve parolayı al
        username = request.data.get("username")
        password = request.data.get("password")

        # 2. Adım: Django'nun 'authenticate' fonksiyonu ile kontrol et
        user = authenticate(username=username, password=password)

        if user is not None:
            # 3. Adım: Kullanıcı VARSA, onun token'ını bul veya oluştur
            # Bu, "Token" tablosuna bakar, yoksa yaratır.
            token, created = Token.objects.get_or_create(user=user)
            
            # 4. Adım: Vizedeki "login working" maddesi için
            return Response({
                "token": token.key,
                "user_id": user.pk,
                "email": user.email
            }, status=status.HTTP_200_OK)
        else:
            # 5. Adım: Vizedeki "invalid login" maddesi için
            # Kullanıcı yoksa veya şifre yanlışsa hata döndür
            return Response(
                {"error": "Invalid Credentials"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
