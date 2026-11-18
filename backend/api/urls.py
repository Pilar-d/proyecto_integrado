from rest_framework.routers import DefaultRouter
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from .views import(
    RolViewSet,
    UsuarioViewSet,
    SectorViewSet,
    ProgramaViewSet,
    MetaSanitariaViewSet,
    IndicadorViewSet,
    PlantillaRemMapeoViewSet,
    ArchivosRemViewSet,
    ValoresExtraidosViewSet,
    CumplimientoMensualViewSet,
    RegistrosViewSet,
    CustomTokenObtainPairView
)

#registra las urls y genera la API navegable de drf
router = DefaultRouter()

router.register(r"roles", RolViewSet, basename="rol")
router.register(r"usuarios", UsuarioViewSet, basename="usuario")
router.register(r"sectores", SectorViewSet, basename="sector")
router.register(r"programas", ProgramaViewSet, basename="programa")
router.register(r"metas-sanitarias", MetaSanitariaViewSet, basename="metasanitaria")
router.register(r"indicadores", IndicadorViewSet, basename="indicador")
router.register(r"plantillas-mapeo", PlantillaRemMapeoViewSet, basename="plantillaremmapeo")
router.register(r"archivos-rem", ArchivosRemViewSet, basename="archivosrem")
router.register(r"valores-extraidos", ValoresExtraidosViewSet, basename="valoresextraidos")
router.register(r"cumplimiento-mensual", CumplimientoMensualViewSet, basename="cumplimientomensual")
router.register(r"registros-auditoria", RegistrosViewSet, basename="registros")

urlpatterns = [
    #endpoints de autenticación JWT
    path("auth/login/", CustomTokenObtainPairView.as_view(), name = "token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("", include(router.urls))
]