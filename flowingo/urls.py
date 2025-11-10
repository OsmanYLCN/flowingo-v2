from django.contrib import admin
from django.urls import path
# TemplateView'i import et (HTML göstermenin en kolay yolu)
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Ana sayfaya (127.0.0.1:8000) gelen isteği
    # direkt 'templates/index.html' dosyasına yönlendir
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    
    # Not: API adreslerini de buraya ekleyeceğiz (örn: path('api/', ...))
]