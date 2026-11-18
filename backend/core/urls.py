from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static

def root_home(request):
    return JsonResponse({
        "estado": "online",
        "sistema": "API CESFAM Santa Rosa - Backend Activo",
        "endpoints": {
            "admin": "/admin/",
            "api_root": "/api/",
            "login": "/api/auth/login/",
            "refresh": "/api/auth/refresh/",
            "calculo_indicadores": "/api/param/calc/",
            "estado_rem": "/api/param/estado-rem/",
            "carga_rem": "/api/rem/upload/",
            "historial_rem": "/api/rem/archivos/"
        }
    })

urlpatterns = [
    path('', root_home, name='root-home'),
    path('admin/', admin.site.urls),
    path("api/param/", include("param_manager.urls")),
    path("api/rem/", include("rem_manager.urls")),
    path("api/", include("api.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
