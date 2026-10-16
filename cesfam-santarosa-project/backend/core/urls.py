# backend/core/urls.py
from django.contrib import admin
from django.urls import include, path
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenRefreshView
from authentication.views import CustomTokenObtainPairView

def api_home(request):
    return JsonResponse({
        "status": "online",
        "system": "Sistema de Monitoreo de Metas Sanitarias - CESFAM Santa Rosa",
        "endpoints": {
            "admin": "/admin/",
            "login_token": "/api/token/",
            "refresh_token": "/api/token/refresh/",
            "carga_rem": "/api/rem/upload/",
            "historial_rem": "/api/rem/archivos/"
        }
    })

urlpatterns = [
    path('', api_home, name='api-home'),
    path('admin/', admin.site.urls),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/rem/', include('rem_manager.urls')),
]
