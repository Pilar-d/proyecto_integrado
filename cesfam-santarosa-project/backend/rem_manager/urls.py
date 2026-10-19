from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RemUploadViewSet, 
    ParametrizacionIndicadorViewSet, 
    ReporteIndicadorViewSet, 
    AuditLogViewSet
)

router = DefaultRouter()
router.register(r'rem/upload', RemUploadViewSet, basename='rem-upload')
router.register(r'parametrizacion', ParametrizacionIndicadorViewSet, basename='parametrizacion')
router.register(r'reportes', ReporteIndicadorViewSet, basename='reportes')
router.register(r'auditoria', AuditLogViewSet, basename='auditoria')

urlpatterns = [
    path('api/v1/', include(router.urls)),
]