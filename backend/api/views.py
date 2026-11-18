from django.shortcuts import render
from rest_framework import viewsets, mixins
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import(
    Rol,
    Usuario,
    Sector,
    Programa,
    MetaSanitaria,
    Indicador,
    PlantillaRemMapeo,
    ArchivosRem,
    ValoresExtraidos,
    CumplimientoMensual,
    Registros
)

from .serializers import (
    RolSerializer,
    UsuarioSerializer,
    SectorSerializer,
    ProgramaSerializer,
    MetaSanitariaSerializer,
    IndicadorSerializer,
    PlantillaRemMapeoSerializer,
    ArchivosRemSerializer,
    ValoresExtraidosSerializer,
    CumplimientoMensualSerializer,
    RegistrosSerializer,
    CustomTokenObtainPairSerializer
)

from rest_framework.permissions import IsAuthenticated
from .permissions import (
    EsGestor,
    EsGestorOSubdireccion,
    EsConsultaOGestorOSubdireccion,
    EsRolConsulta,
)

# Create your views here.

class RolViewSet(viewsets.ModelViewSet):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    permission_classes = [IsAuthenticated, EsGestor]

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all().select_related("rol")
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated, EsGestor]
    
class SectorViewSet(viewsets.ModelViewSet):
    queryset = Sector.objects.all()
    serializer_class = SectorSerializer
    permission_classes = [IsAuthenticated, EsRolConsulta]

class ProgramaViewSet(viewsets.ModelViewSet):
    queryset = Programa.objects.all().select_related("usuario")
    serializer_class = ProgramaSerializer
    permission_classes = [IsAuthenticated, EsConsultaOGestorOSubdireccion]

class MetaSanitariaViewSet(viewsets.ModelViewSet):
    queryset = MetaSanitaria.objects.all().select_related("programa")
    serializer_class = MetaSanitariaSerializer
    permission_classes = [IsAuthenticated, EsConsultaOGestorOSubdireccion]

class IndicadorViewSet(viewsets.ModelViewSet):
    queryset = Indicador.objects.all().select_related("meta")
    serializer_class = IndicadorSerializer
    permission_classes = [IsAuthenticated, EsConsultaOGestorOSubdireccion]

class PlantillaRemMapeoViewSet(viewsets.ModelViewSet):
    queryset = PlantillaRemMapeo.objects.all().select_related("indicador")
    serializer_class = PlantillaRemMapeoSerializer
    permission_classes = [IsAuthenticated, EsGestorOSubdireccion]

class ArchivosRemViewSet(viewsets.ModelViewSet):
    queryset = ArchivosRem.objects.all().select_related("usuario")
    serializer_class = ArchivosRemSerializer
    permission_classes = [IsAuthenticated, EsGestorOSubdireccion]

class ValoresExtraidosViewSet(viewsets.ModelViewSet):
    queryset = ValoresExtraidos.objects.all().select_related("archivo", "mapeo", "sector")
    serializer_class = ValoresExtraidosSerializer
    permission_classes = [IsAuthenticated, EsRolConsulta]

class CumplimientoMensualViewSet(viewsets.ModelViewSet):
    queryset = CumplimientoMensual.objects.all().select_related("indicador", "sector")
    serializer_class = CumplimientoMensualSerializer
    permission_classes = [IsAuthenticated, EsRolConsulta]

class RegistrosViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet
    ):
    queryset = Registros.objects.all().order_by("-fecha_hora").select_related("usuario")
    serializer_class = RegistrosSerializer
    permission_classes = [IsAuthenticated, EsGestor]

#vista para la autenticación JWT del login

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer