# rem_manager/views.py
import openpyxl
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from .models import RemArchivo
from api.permissions import EsGestorOSubdireccion, EsRolConsulta
from api.models import Registros


class RemUploadView(APIView):
    """
    Carga manual de planillas REM (RF-03).
    Acepta archivos .xlsm / .xlsx oficiales MINSAL.
    """
    permission_classes = [IsAuthenticated, EsGestorOSubdireccion]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = request.FILES.get('file') or request.FILES.get('archivo')
        if not file_obj:
            return Response({"error": "No se ha seleccionado ningún archivo REM."}, status=400)

        periodo_mes = request.data.get('periodo_mes')
        periodo_year = request.data.get('periodo_year', 2026)

        nombre = file_obj.name.lower()
        if not periodo_mes:
            if 'enero' in nombre or ' 1 ' in nombre or 'serie a enero' in nombre:
                periodo_mes = 1
            elif 'febrero' in nombre or ' 2 ' in nombre or 'serie a febrero' in nombre:
                periodo_mes = 2
            elif 'marzo' in nombre or ' 3 ' in nombre or 'serie a marzo' in nombre:
                periodo_mes = 3
            elif 'abril' in nombre or ' 4 ' in nombre or 'serie a abril' in nombre:
                periodo_mes = 4
            elif 'mayo' in nombre or ' 5 ' in nombre or 'serie a mayo' in nombre:
                periodo_mes = 5
            elif 'junio' in nombre or ' 6 ' in nombre or 'serie a junio' in nombre:
                periodo_mes = 6
            elif 'julio' in nombre or ' 7 ' in nombre:
                periodo_mes = 7
            elif 'agosto' in nombre or ' 8 ' in nombre:
                periodo_mes = 8
            elif 'septiembre' in nombre or 'sept' in nombre or ' 9 ' in nombre:
                periodo_mes = 9
            elif 'octubre' in nombre or ' 10 ' in nombre:
                periodo_mes = 10
            elif 'noviembre' in nombre or ' 11 ' in nombre:
                periodo_mes = 11
            elif 'diciembre' in nombre or ' 12 ' in nombre:
                periodo_mes = 12
            else:
                periodo_mes = 1

        periodo_mes = int(periodo_mes)
        periodo_year = int(periodo_year)

        # Marcar anteriores como reemplazados
        RemArchivo.objects.filter(
            periodo_mes=periodo_mes,
            periodo_year=periodo_year,
            estado=RemArchivo.Estado.VALIDO
        ).update(estado=RemArchivo.Estado.REEMPLAZADO)

        rem_archivo = RemArchivo.objects.create(
            usuario=request.user,
            archivo=file_obj,
            archivo_nombre=file_obj.name,
            periodo_mes=periodo_mes,
            periodo_year=periodo_year,
            establecimiento='CESFAM Santa Rosa (210450)',
            estado=RemArchivo.Estado.VALIDO
        )

        try:
            wb = openpyxl.load_workbook(rem_archivo.archivo.path, read_only=True)
            rem_archivo.hojas_rem = len(wb.sheetnames)
            rem_archivo.save()
            wb.close()
        except Exception:
            pass

        # Registrar en auditoría (RF-12)
        try:
            rol = getattr(getattr(request.user, 'rol', None), 'nombre_rol', 'Gestor')
            Registros.objects.create(
                usuario=request.user,
                accion='CARGA_REM',
                rol_usuario=rol,
                tabla_afectada='RemArchivo',
                valor_nuevo={
                    'archivo': file_obj.name,
                    'mes': periodo_mes,
                    'year': periodo_year,
                    'hojas': rem_archivo.hojas_rem
                },
                ip_origen=request.META.get('REMOTE_ADDR', '127.0.0.1')
            )
        except Exception:
            pass

        return Response({
            "status": "success",
            "message": f"Planilla REM '{file_obj.name}' procesada exitosamente.",
            "filename": file_obj.name,
            "periodo": f"{periodo_mes}/{periodo_year}",
            "hojas": rem_archivo.hojas_rem,
            "establecimiento": rem_archivo.establecimiento,
        })


class RemArchivoListView(APIView):
    """
    Lista el historial de planillas REM cargadas (RF-03).
    """
    permission_classes = [IsAuthenticated, EsRolConsulta]

    def get(self, request):
        archivos = RemArchivo.objects.all().order_by('-periodo_year', '-periodo_mes')
        data = [{
            'id': a.id,
            'archivo_nombre': a.archivo_nombre,
            'periodo_mes': a.periodo_mes,
            'periodo_year': a.periodo_year,
            'establecimiento': a.establecimiento,
            'hojas_rem': a.hojas_rem,
            'estado': a.estado,
            'fecha_carga': a.fecha_carga.strftime('%Y-%m-%d %H:%M') if a.fecha_carga else '',
            'usuario': a.usuario.nombres if a.usuario else 'Sistema',
        } for a in archivos]
        return Response(data)
