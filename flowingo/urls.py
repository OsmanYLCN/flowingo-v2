from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from tasks import views as tasks_views
from rest_framework.routers import DefaultRouter

from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()
router.register(r'tasks', tasks_views.TaskViewSet, basename='task')
router.register(r'attachments', tasks_views.AttachmentViewSet, basename='attachment')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', TemplateView.as_view(template_name='home.html'), name='home'),
    path("auth/", TemplateView.as_view(template_name = 'auth/login_register.html'), name="auth"),
    path('dashboard/', TemplateView.as_view(template_name='dashboard.html'), name='dashboard'),
    path('statistics/', TemplateView.as_view(template_name='statistics.html'), name='statistics'),
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
    
    path (
        'api/',
        include(router.urls)
    ),

    path(
        'api/auth/logout/',
        tasks_views.LogoutView.as_view(),
        name='user-logout' # İsmi user-logout yaptık
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root = settings.MEDIA_ROOT)
