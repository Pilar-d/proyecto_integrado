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

        nombre = file_obj.name.lower()
        # 1. Validación de extensión permitida (RF-03)
        if not (nombre.endswith('.xlsx') or nombre.endswith('.xlsm') or nombre.endswith('.xls')):
            return Response({
                "error": f"Formato no admitido ('{file_obj.name}'). Solo se aceptan planillas oficiales de Excel (.xlsx, .xlsm, .xls)."
            }, status=400)

        # 2. Validación de tamaño máximo (50 MB)
        if file_obj.size > 50 * 1024 * 1024:
            return Response({
                "error": "El archivo excede el tamaño máximo permitido de 50 MB."
            }, status=400)

        # 3. Validación de integridad de estructura Excel y lectura de hojas
        try:
            wb = openpyxl.load_workbook(file_obj, read_only=True, data_only=True)
            sheet_names = wb.sheetnames
            hojas_count = len(sheet_names)
            wb.close()
        except Exception as e:
            return Response({
                "error": f"El archivo Excel está dañado o tiene un formato no válido: {str(e)}"
            }, status=400)

        # 4. Validación de estructura oficial REM Serie A (MINSAL)
        # Comprobar si contiene hojas oficiales de Serie A (ej: NOMBRE, A01, A02, A03, A04, etc.)
        tiene_hojas_serie_a = any(
            s.upper().startswith('A') or s.upper() == 'NOMBRE' or s.upper().startswith('P')
            for s in sheet_names
        )
        if not tiene_hojas_serie_a:
            return Response({
                "error": "La planilla cargada no corresponde a la estructura oficial del REM Serie A (no contiene hojas A01, A02, A03...)."
            }, status=400)

        # 5. Determinación y validación del período (Mes y Año)
        import json
        params_dict = {}
        if request.data.get('parametros'):
            try:
                params_dict = json.loads(request.data.get('parametros'))
            except Exception:
                pass

        periodo_mes = request.data.get('periodo_mes') or params_dict.get('periodo_mes')
        periodo_year = request.data.get('periodo_year') or params_dict.get('periodo_year', 2026)

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

        try:
            periodo_mes = int(periodo_mes)
            periodo_year = int(periodo_year)
            if not (1 <= periodo_mes <= 12):
                periodo_mes = 1
        except (ValueError, TypeError):
            periodo_mes = 1
            periodo_year = 2026

        # 6. Marcar versiones anteriores del mismo período como REEMPLAZADO
        RemArchivo.objects.filter(
            periodo_mes=periodo_mes,
            periodo_year=periodo_year,
            estado=RemArchivo.Estado.VALIDO
        ).update(estado=RemArchivo.Estado.REEMPLAZADO)

        # 7. Crear el registro válido
        rem_archivo = RemArchivo.objects.create(
            usuario=request.user,
            archivo=file_obj,
            archivo_nombre=file_obj.name,
            periodo_mes=periodo_mes,
            periodo_year=periodo_year,
            establecimiento='CESFAM Santa Rosa (210450)',
            hojas_rem=hojas_count,
            estado=RemArchivo.Estado.VALIDO
        )

        # 8. Registrar en auditoría (RF-12)
        try:
            rol = getattr(getattr(request.user, 'rol', None), 'nombre_rol', 'Gestor')
            Registros.objects.create(
                usuario=request.user if request.user.is_authenticated else None,
                accion='CARGA_REM',
                rol_usuario=rol,
                tabla_afectada='RemArchivo',
                valor_nuevo={
                    'archivo': file_obj.name,
                    'mes': periodo_mes,
                    'year': periodo_year,
                    'hojas': hojas_count,
                    'establecimiento': rem_archivo.establecimiento,
                    'estado': 'VALIDO'
                },
                ip_origen=request.META.get('REMOTE_ADDR', '127.0.0.1')
            )
        except Exception:
            pass

        return Response({
            "status": "success",
            "message": f"Planilla REM '{file_obj.name}' validada y procesada exitosamente.",
            "filename": file_obj.name,
            "periodo": f"{periodo_mes:02d}/{periodo_year}",
            "hojas": hojas_count,
            "establecimiento": rem_archivo.establecimiento,
            "estado": "VALIDO"
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
