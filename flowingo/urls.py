from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from tasks import views as tasks_views

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Ana sayfaya (127.0.0.1:8000) gelen isteği direkt 'templates/index.html' dosyasına yönlendir
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    
    path(
        'api/auth/register/',
        tasks_views.UserCreateView.as_view(),
        name = 'user-register'
    ),

    path(
        'api/auth/login/',
        tasks_views.LoginView.as_view(),
        name='user-login'
    ),
    
]