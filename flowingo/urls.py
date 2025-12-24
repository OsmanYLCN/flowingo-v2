from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from django.conf import settings
from django.conf.urls.static import static

# Tek bir yerden import edelim, kafa karışmasın:
from tasks import views

router = DefaultRouter()
router.register(r'tasks', views.TaskViewSet, basename='task')
router.register(r'attachments', views.AttachmentViewSet, basename='attachment')

urlpatterns = [
    # Sayfa Yönlendirmeleri (Frontend)
    path('admin/', admin.site.urls),
    path('', TemplateView.as_view(template_name='home.html'), name='home'),
    path("auth/", TemplateView.as_view(template_name='auth/login_register.html'), name="auth"),
    path('dashboard/', TemplateView.as_view(template_name='dashboard.html'), name='dashboard'),
    path('statistics/', TemplateView.as_view(template_name='statistics.html'), name='statistics'),

    # API Endpointleri (Backend)
    path('api/users/', views.get_user_list),
    path('api/profile/', views.user_profile), # <-- Profil burada
    
    path('api/auth/register/', views.UserCreateView.as_view(), name='user-register'),
    path('api/auth/login/', views.LoginView.as_view(), name='user-login'),
    path('api/auth/logout/', views.LogoutView.as_view(), name='user-logout'),
    
    # Router (Tasks & Attachments)
    path('api/', include(router.urls)),

    # Standart Token Auth
    path('auth/login/', obtain_auth_token),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)