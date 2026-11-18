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

# Create your views here.

class RolViewSet(viewsets.ModelViewSet):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all().select_related("rol")
    serializer_class = UsuarioSerializer
    
class SectorViewSet(viewsets.ModelViewSet):
    queryset = Sector.objects.all()
    serializer_class = SectorSerializer

class ProgramaViewSet(viewsets.ModelViewSet):
    queryset = Programa.objects.all().select_related("usuario")
    serializer_class = ProgramaSerializer

class MetaSanitariaViewSet(viewsets.ModelViewSet):
    queryset = MetaSanitaria.objects.all().select_related("programa")
    serializer_class = MetaSanitariaSerializer

class IndicadorViewSet(viewsets.ModelViewSet):
    queryset = Indicador.objects.all().select_related("meta")
    serializer_class = IndicadorSerializer

class PlantillaRemMapeoViewSet(viewsets.ModelViewSet):
    queryset = PlantillaRemMapeo.objects.all().select_related("indicador")
    serializer_class = PlantillaRemMapeoSerializer

class ArchivosRemViewSet(viewsets.ModelViewSet):
    queryset = ArchivosRem.objects.all().select_related("usuario")
    serializer_class = ArchivosRemSerializer

class ValoresExtraidosViewSet(viewsets.ModelViewSet):
    queryset = ValoresExtraidos.objects.all().select_related("archivo", "mapeo", "sector")
    serializer_class = ValoresExtraidosSerializer

class CumplimientoMensualViewSet(viewsets.ModelViewSet):
    queryset = CumplimientoMensual.objects.all().select_related("indicador", "sector")
    serializer_class = CumplimientoMensualSerializer

class RegistrosViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet
    ):
    queryset = Registros.objects.all().order_by("-fecha_hora").select_related("usuario")
    serializer_class = RegistrosSerializer

#vista para la autenticación JWT del login

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer