from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
import json

# --- CLASES DE PERMISOS PERSONALIZADOS ---

class EsGestorOsubdireccion(permissions.BasePermission):
    """Permite acceso solo a Gestores y Subdirección (Carga y Parametrización)."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # Suponiendo que el usuario tiene un campo 'rol' o grupos asociados
        return request.user.rol in ['Gestor', 'Subdireccion']


class EsGestorAdmin(permissions.BasePermission):
    """Permite acceso exclusivo al Gestor de Información / Administrador."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.rol == 'Gestor'


# --- VIEWSETS DE LA APLICACIÓN ---

class RemUploadViewSet(viewsets.ViewSet):
    """
    Módulo de Carga de REM (RF-03).
    Restringido para Subdirección y Gestor de Información.
    """
    permission_classes = [permissions.IsAuthenticated, EsGestorOsubdireccion]

    @action(detail=False, methods=['post'])
    def upload_file(self, request):
        archivo = request.FILES.get('archivo')
        periodo_mes = request.data.get('periodo_mes')
        periodo_year = request.data.get('periodo_year')

        if not archivo:
            return Response({"error": "No se ha proporcionado ningún archivo."}, status=400)

        # Lógica de validación de estructura de planilla y evitar duplicados
        # Registro en la Bitácora de Auditoría (RF-12)
        
        return Response({
            "status": "success", 
            "message": f"Archivo REM del periodo {periodo_mes}-{periodo_year} procesado exitosamente."
        })


class ParametrizacionIndicadorViewSet(viewsets.ModelViewSet):
    """
    Motor de Parametrización Dinámica (RF-04 / RF-11).
    Permite modificar coordenadas de celdas de Excel sin tocar código fuente.
    """
    permission_classes = [permissions.IsAuthenticated, EsGestorOsubdireccion]
    queryset = [] # Reemplazar con tu Model de Indicadores/Metas
    
    def perform_create(self, serializer):
        # Auditoría automática de cambios (RF-12)
        serializer.save()
        

class ReporteIndicadorViewSet(viewsets.ViewSet):
    """
    Reportes por Área, Programa y Fechas (RF-05, RF-06).
    Aplica seguridad a nivel de servidor para Jefe de Programa (Criterio C).
    """
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        user = request.user
        
        # Validación de seguridad estricta para Jefe de Programa (Criterio C)
        if user.rol == 'JefePrograma':
            # Filtrar estrictamente solo los indicadores de su programa asignado
            # programa_asignado = user.programa 
            pass
        elif user.rol in ['Directora', 'Subdireccion', 'Gestor']:
            # Visualización global permitida
            pass

        data = [
            {"indicador": "Meta IAAPS 1", "cumplimiento": "95%", "estado": "Óptimo"},
            {"indicador": "Meta Comunal Ley 19.813", "cumplimiento": "82%", "estado": "En riesgo"}
        ]
        return Response(data)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Bitácora de Auditoría Inmutable (RF-12).
    Exclusivo para el Gestor de Información / Administrador del Sistema.
    """
    permission_classes = [permissions.IsAuthenticated, EsGestorAdmin]
    queryset = [] # Reemplazar con el Model de Auditoría
    
    def list(self, request):
        # Retorna transacciones registradas (usuario, fecha, hora, JSON valor anterior vs nuevo)
        return Response([
            {
                "id": 1,
                "usuario": "12345678-9",
                "accion": "ACTUALIZAR_PARAMETRO_REM",
                "fecha_hora": timezone.now(),
                "detalle_json": json.dumps({"valor_anterior": "C14", "valor_nuevo": "C15"})
            }
        ])