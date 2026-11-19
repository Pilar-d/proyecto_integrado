from django.shortcuts import render
from rest_framework import viewsets, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
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
    EsDirectoraOGestorOSubdireccion,
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

    @action(detail=False, methods=['get', 'put', 'patch'], permission_classes=[IsAuthenticated])
    def mi_perfil(self, request):
        usuario = request.user
        if request.method == 'GET':
            data = self.get_serializer(usuario).data
            data['rol_nombre'] = getattr(getattr(usuario, 'rol', None), 'nombre_rol', 'Directora')
            return Response(data)

        nombres = request.data.get('nombres')
        apellidos = request.data.get('apellidos')
        password_actual = request.data.get('password_actual')
        password_nueva = request.data.get('password_nueva')

        if nombres:
            usuario.nombres = nombres.strip()
        if apellidos is not None:
            usuario.apellidos = apellidos.strip()

        password_cambiada = False
        if password_nueva:
            if not password_actual or not usuario.check_password(password_actual):
                return Response({'error': 'La contraseña actual ingresada es incorrecta.'}, status=400)
            if len(password_nueva) < 6:
                return Response({'error': 'La nueva contraseña debe tener al menos 6 caracteres.'}, status=400)
            usuario.set_password(password_nueva)
            password_cambiada = True

        usuario.save()

        # Registro en Bitácora de Auditoría (RF-12)
        try:
            Registros.objects.create(
                usuario=usuario,
                accion='ACTUALIZAR_MI_PERFIL',
                rol_usuario=getattr(getattr(usuario, 'rol', None), 'nombre_rol', 'Funcionario'),
                tabla_afectada='Usuario',
                valor_nuevo={
                    'nombres': usuario.nombres,
                    'apellidos': usuario.apellidos,
                    'password_actualizada': password_cambiada
                },
                ip_origen=request.META.get('REMOTE_ADDR', '127.0.0.1')
            )
        except Exception:
            pass

        data = self.get_serializer(usuario).data
        data['rol_nombre'] = getattr(getattr(usuario, 'rol', None), 'nombre_rol', 'Directora')

        return Response({
            'status': 'success',
            'mensaje': 'Perfil y credenciales actualizados exitosamente.',
            'usuario': data
        })
    
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
    serializer_class = RegistrosSerializer
    permission_classes = [IsAuthenticated, EsDirectoraOGestorOSubdireccion]

    def get_queryset(self):
        queryset = Registros.objects.all().order_by("-fecha_hora").select_related("usuario")
        accion = self.request.query_params.get("accion")
        rol = self.request.query_params.get("rol")
        tabla = self.request.query_params.get("tabla")
        fecha_inicio = self.request.query_params.get("fecha_inicio")
        fecha_fin = self.request.query_params.get("fecha_fin")
        search = self.request.query_params.get("search")

        if accion and accion.lower() != "todas":
            queryset = queryset.filter(accion__icontains=accion)
        if rol and rol.lower() not in ("todos", "todos los roles"):
            queryset = queryset.filter(rol_usuario__icontains=rol)
        if tabla:
            queryset = queryset.filter(tabla_afectada__icontains=tabla)
        if fecha_inicio:
            queryset = queryset.filter(fecha_hora__date__gte=fecha_inicio)
        if fecha_fin:
            queryset = queryset.filter(fecha_hora__date__lte=fecha_fin)
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(accion__icontains=search) |
                Q(tabla_afectada__icontains=search) |
                Q(rol_usuario__icontains=search) |
                Q(ip_origen__icontains=search) |
                Q(usuario__rut__icontains=search) |
                Q(usuario__nombres__icontains=search) |
                Q(usuario__apellidos__icontains=search)
            )
        return queryset

#vista para la autenticación JWT del login

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer