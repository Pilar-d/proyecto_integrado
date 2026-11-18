# param_manager/views.py
"""
Vistas CRUD para la parametrización de metas (RF-04 / RF-11).
Toda creación, actualización o eliminación queda registrada en la bitácora de
auditoría (RF-12) con usuario, fecha, hora y valores antes/después.
"""
import json

from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import Registros
from api.permissions import EsConsultaOGestorOSubdireccion, EsRolConsulta
from .calc import CORTES_EVALUATIVOS, LibrosREM, calcular_indicador
from .models import ComponenteDato, Indicador, Meta, MetaValor, Programa
from .serializers import (
    ComponenteDatoSerializer,
    IndicadorSerializer,
    MetaSerializer,
    MetaValorSerializer,
    ProgramaSerializer,
)


class AuditoriaParametrizacionMixin:
    """Registra en auditoría cada cambio sobre parámetros de metas."""

    def _log(self, accion, instancia, antes=None, despues=None):
        try:
            user = self.request.user if (self.request.user and self.request.user.is_authenticated) else None
            rol_nombre = getattr(getattr(user, 'rol', None), 'nombre_rol', 'Sistema') if user else 'Sistema'
            Registros.objects.create(
                usuario=user,
                accion=accion,
                rol_usuario=rol_nombre,
                tabla_afectada=type(instancia).__name__,
                valor_anterior=antes,
                valor_nuevo=despues,
                ip_origen=self.request.META.get('REMOTE_ADDR', '127.0.0.1')
            )
        except Exception:
            pass

    def perform_create(self, serializer):
        instancia = serializer.save()
        self._log(f'CREAR_{type(instancia).__name__.upper()}', instancia,
                  despues=self.serializer_class(instancia).data)

    def perform_update(self, serializer):
        instancia_previa = self.get_object()
        antes = self.serializer_class(instancia_previa).data
        instancia = serializer.save()
        self._log(f'ACTUALIZAR_{type(instancia).__name__.upper()}', instancia,
                  antes=antes, despues=self.serializer_class(instancia).data)

    def perform_destroy(self, instancia):
        self._log(f'ELIMINAR_{type(instancia).__name__.upper()}', instancia,
                  antes=self.serializer_class(instancia).data)
        instancia.delete()


class ProgramaViewSet(AuditoriaParametrizacionMixin, viewsets.ModelViewSet):
    queryset = Programa.objects.all()
    serializer_class = ProgramaSerializer
    permission_classes = [IsAuthenticated, EsConsultaOGestorOSubdireccion]


class MetaViewSet(AuditoriaParametrizacionMixin, viewsets.ModelViewSet):
    serializer_class = MetaSerializer
    permission_classes = [IsAuthenticated, EsConsultaOGestorOSubdireccion]

    def get_queryset(self):
        queryset = Meta.objects.select_related('programa').prefetch_related('indicadores')
        # Filtros opcionales: ?seccion=PRODUCCION&programa=3&vigente=true&search=EMP
        seccion = self.request.query_params.get('seccion')
        programa = self.request.query_params.get('programa')
        vigente = self.request.query_params.get('vigente')
        search = self.request.query_params.get('search')
        if seccion:
            queryset = queryset.filter(seccion=seccion)
        if programa:
            queryset = queryset.filter(programa_id=programa)
        if vigente in ('true', 'false'):
            queryset = queryset.filter(vigente=(vigente == 'true'))
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(nombre__icontains=search) | Q(codigo__icontains=search)
            )
        return queryset


class IndicadorViewSet(AuditoriaParametrizacionMixin, viewsets.ModelViewSet):
    queryset = Indicador.objects.select_related('meta').prefetch_related(
        'componentes', 'valores'
    )
    serializer_class = IndicadorSerializer
    permission_classes = [IsAuthenticated, EsConsultaOGestorOSubdireccion]


class ComponenteDatoViewSet(AuditoriaParametrizacionMixin, viewsets.ModelViewSet):
    queryset = ComponenteDato.objects.select_related('indicador')
    serializer_class = ComponenteDatoSerializer
    permission_classes = [IsAuthenticated, EsConsultaOGestorOSubdireccion]

    def get_queryset(self):
        queryset = super().get_queryset()
        indicador = self.request.query_params.get('indicador')
        if indicador:
            queryset = queryset.filter(indicador_id=indicador)
        return queryset


class CalculoIndicadoresView(APIView):
    """
    RF-05 / RF-06: cumplimiento de indicadores para un año y período.
    GET /api/param/calc/?anio=2026&corte=2&indicador=7
    - corte: 1 (ene-may), 2 (ene-jul), 3 (ene-sep), 4 (ene-dic);
      sin corte = acumulado del año.
    """
    permission_classes = [IsAuthenticated, EsRolConsulta]

    def get(self, request):
        from django.utils import timezone
        try:
            anio = int(request.query_params.get('anio') or timezone.now().year)
        except ValueError:
            return Response({'error': 'Año inválido.'}, status=400)

        corte = request.query_params.get('corte')
        hasta_mes = None
        if corte:
            try:
                hasta_mes = CORTES_EVALUATIVOS[int(corte)]
            except (KeyError, ValueError):
                return Response(
                    {'error': 'Corte inválido. Use 1 (mayo), 2 (julio), 3 (septiembre) o 4 (diciembre).'},
                    status=400,
                )

        indicadores = Indicador.objects.filter(
            vigente=True, meta__vigente=True,
        ).select_related('meta', 'meta__programa').prefetch_related('componentes', 'valores')

        indicador_id = request.query_params.get('indicador')
        if indicador_id:
            indicadores = indicadores.filter(id=indicador_id)

        libros = LibrosREM(anio, hasta_mes)
        resultados = []
        try:
            for ind in indicadores:
                r = calcular_indicador(ind, anio, libros)
                meta_valor = r['meta_valor']
                resultados.append({
                    'indicador': ind.id,
                    'codigo': ind.codigo,
                    'nombre': ind.nombre,
                    'meta_codigo': ind.meta.codigo,
                    'meta_nombre': ind.meta.nombre,
                    'seccion': ind.meta.seccion,
                    'programa': ind.meta.programa.nombre if ind.meta.programa else None,
                    'forma_calculo': ind.forma_calculo,
                    'orientacion': ind.orientacion,
                    'ponderacion': ind.ponderacion,
                    'meta_valor': str(meta_valor) if meta_valor is not None else None,
                    'numerador': str(r['numerador']),
                    'denominador': str(r['denominador']) if r['denominador'] is not None else None,
                    'resultado': str(round(r['resultado'], 2)) if r['resultado'] is not None else None,
                    'cumplimiento_pct': str(round(r['cumplimiento_pct'], 1)) if r['cumplimiento_pct'] is not None else None,
                    'estado': r['estado'],
                    'meses_con_datos': r['meses_con_datos'],
                    'errores': r['errores'],
                })
        finally:
            libros.cerrar()

        return Response({
            'anio': anio,
            'corte': int(corte) if corte else None,
            'hasta_mes': hasta_mes,
            'resultados': resultados,
        })


class MetaValorViewSet(AuditoriaParametrizacionMixin, viewsets.ModelViewSet):
    queryset = MetaValor.objects.select_related('indicador')
    serializer_class = MetaValorSerializer
    permission_classes = [IsAuthenticated, EsConsultaOGestorOSubdireccion]

    def get_queryset(self):
        queryset = super().get_queryset()
        indicador = self.request.query_params.get('indicador')
        if indicador:
            queryset = queryset.filter(indicador_id=indicador)
        return queryset


class EstadoRemView(APIView):
    """
    Retorna la matriz de meses cargados para cada serie REM (para EstadoDatos.tsx).
    """
    permission_classes = [IsAuthenticated, EsRolConsulta]

    def get(self, request):
        from django.utils import timezone
        from rem_manager.models import RemArchivo
        anio = int(request.query_params.get('anio') or timezone.now().year)
        archivos = RemArchivo.objects.filter(periodo_year=anio, estado=RemArchivo.Estado.VALIDO)
        meses_cargados = set(archivos.values_list('periodo_mes', flat=True))

        rems_definidos = [
            ('A01', 'Atención Médica en APS'),
            ('A02', 'Control de Salud Integral'),
            ('A03', 'Salud de la Mujer y Perinatal'),
            ('A04', 'Salud Infantil y Nutricional'),
            ('A05', 'Salud del Adolescente'),
            ('A06', 'Salud del Adulto y Adulto Mayor'),
            ('A07', 'Salud Cardiovascular (PSCV)'),
            ('A08', 'Salud Respiratoria (IRA - ERA)'),
            ('A09', 'Salud Mental y Psiquiatría'),
            ('A24', 'Procedimientos y Exámenes'),
            ('A27', 'Consultas Médicas de Especialidad'),
            ('A28', 'Vacunación e Inmunizaciones'),
            ('P01', 'Población Inscrita FONASA'),
        ]

        matriz = []
        for codigo, nombre in rems_definidos:
            meses_map = {m: (m in meses_cargados) for m in range(1, 13)}
            matriz.append({
                'rem': f'REM {codigo}',
                'nombre': nombre,
                'meses': meses_map
            })

        return Response({
            'anio': anio,
            'matriz': matriz,
            'meses_cargados': sorted(list(meses_cargados))
        })


def sincronizar_denominadores(poblacion):
    """
    Sincroniza los denominadores en ComponenteDato con los valores ingresados de población FONASA.
    """
    from decimal import Decimal
    from .models import Indicador, ComponenteDato

    mapeo = {
        '6.1.A': (poblacion.mujeres_20_64, 'Población femenina 20-64 inscrita validada FONASA'),
        '6.1.B': (poblacion.hombres_20_64, 'Población masculina 20-64 inscrita validada FONASA'),
        '6.2':   (poblacion.adultos_mayores_65, 'Población 65+ inscrita validada FONASA'),
        '3':     (poblacion.poblacion_total, 'Población total inscrita validada FONASA'),
        '5':     (round(Decimal(str(poblacion.poblacion_total)) / Decimal('3.3'), 2), 'Familias estimadas (Población total / 3.3)'),
        '7':     (poblacion.ninos_12_23_meses, 'Población infantil 12-23 meses bajo control'),
        '8':     (poblacion.adolescentes_10_19, 'Población adolescentes 10-19 inscritos validados'),
        '13':    (poblacion.adolescentes_10_19, 'Población adolescentes 15-19 inscritos'),
        '14':    (poblacion.prevalencia_dm2, 'Población esperada por prevalencia DM2 (15+)'),
        '15':    (poblacion.prevalencia_hta, 'Población esperada por prevalencia HTA (15+)'),
        '16':    (poblacion.poblacion_total, 'Población total inscrita validada FONASA'),
        '17':    (poblacion.ninos_menores_3_caries, 'Población < 3 años inscrita validada'),
        'MS-2':  (poblacion.mujeres_25_64_pap, 'Población mujeres 25 a 64 años inscrita validada'),
        'MS-4a': (poblacion.prevalencia_dm2, 'Población diabética estimada por prevalencia'),
        'MS-5':  (poblacion.prevalencia_hta, 'Población hipertensa estimada por prevalencia'),
    }

    for cod, (valor, desc) in mapeo.items():
        indicador = Indicador.objects.filter(codigo=cod).first()
        if indicador:
            ComponenteDato.objects.update_or_create(
                indicador=indicador,
                tipo='DENOMINADOR',
                defaults={
                    'descripcion': desc,
                    'origen': 'VALOR_FIJO',
                    'valor_fijo': valor,
                    'activo': True
                }
            )


def _get_resumen_denominadores():
    denominadores = []
    comps = ComponenteDato.objects.filter(tipo='DENOMINADOR').select_related('indicador', 'indicador__meta').order_by('indicador__codigo')
    for c in comps:
        denominadores.append({
            'id': c.id,
            'indicador_id': c.indicador.id,
            'codigo': c.indicador.codigo,
            'meta_codigo': c.indicador.meta.codigo,
            'nombre': c.indicador.nombre,
            'descripcion': c.descripcion,
            'origen': c.origen,
            'valor': str(c.valor_fijo) if c.valor_fijo is not None else '',
            'rem_celda': f"{c.rem_hoja}!{c.rem_celda}" if c.origen == 'REM' and c.rem_hoja else '',
        })
    return denominadores


class PoblacionParametrizacionView(APIView):
    """
    RF-04 / RF-11: Permite consultar e ingresar la población inscrita FONASA y denominadores de metas.
    """
    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [IsAuthenticated(), EsConsultaOGestorOSubdireccion()]

    def get(self, request):
        from .models import PoblacionAnual
        anio = int(request.query_params.get('anio', 2026))
        pob, _ = PoblacionAnual.objects.get_or_create(
            anio=anio,
            defaults={
                'poblacion_total': 28500,
                'mujeres_20_64': 5226,
                'hombres_20_64': 4800,
                'adultos_mayores_65': 3200,
                'mujeres_25_64_pap': 5393,
                'ninos_12_23_meses': 350,
                'adolescentes_10_19': 2100,
                'prevalencia_dm2': 2280,
                'prevalencia_hta': 4200,
                'ninos_menores_3_caries': 480,
            }
        )
        # Sincronizar por si acaso
        sincronizar_denominadores(pob)

        return Response({
            'anio': pob.anio,
            'poblacion': {
                'poblacion_total': str(pob.poblacion_total),
                'mujeres_20_64': str(pob.mujeres_20_64),
                'hombres_20_64': str(pob.hombres_20_64),
                'adultos_mayores_65': str(pob.adultos_mayores_65),
                'mujeres_25_64_pap': str(pob.mujeres_25_64_pap),
                'ninos_12_23_meses': str(pob.ninos_12_23_meses),
                'adolescentes_10_19': str(pob.adolescentes_10_19),
                'prevalencia_dm2': str(pob.prevalencia_dm2),
                'prevalencia_hta': str(pob.prevalencia_hta),
                'ninos_menores_3_caries': str(pob.ninos_menores_3_caries),
                'actualizado_en': pob.actualizado_en.strftime('%Y-%m-%d %H:%M') if pob.actualizado_en else ''
            },
            'denominadores': _get_resumen_denominadores()
        })

    def post(self, request):
        from decimal import Decimal
        from .models import PoblacionAnual
        anio = int(request.data.get('anio', 2026))
        pob, _ = PoblacionAnual.objects.get_or_create(anio=anio)

        campos = [
            'poblacion_total', 'mujeres_20_64', 'hombres_20_64', 'adultos_mayores_65',
            'mujeres_25_64_pap', 'ninos_12_23_meses', 'adolescentes_10_19',
            'prevalencia_dm2', 'prevalencia_hta', 'ninos_menores_3_caries'
        ]

        antes = {c: str(getattr(pob, c)) for c in campos}

        # Extraer campos si vienen anidados en 'poblacion' o planos en request.data
        data_source = request.data.get('poblacion') if isinstance(request.data.get('poblacion'), dict) else request.data

        for c in campos:
            val = data_source.get(c)
            if val is not None and str(val).strip() != '':
                try:
                    setattr(pob, c, Decimal(str(val)))
                except Exception:
                    pass

        pob.save()
        sincronizar_denominadores(pob)

        # Ajuste individual opcional de denominadores específicos
        denominadores_ajustes = request.data.get('denominadores_ajustes')
        if isinstance(denominadores_ajustes, list):
            for d in denominadores_ajustes:
                ind_id = d.get('indicador_id')
                val = d.get('valor')
                if ind_id and val is not None and str(val).strip() != '':
                    try:
                        ComponenteDato.objects.filter(indicador_id=ind_id, tipo='DENOMINADOR').update(
                            valor_fijo=Decimal(str(val)),
                            origen='VALOR_FIJO'
                        )
                    except Exception:
                        pass

        # Auditoría (RF-12)
        try:
            rol_nombre = getattr(getattr(request.user, 'rol', None), 'nombre_rol', 'Gestor')
            Registros.objects.create(
                usuario=request.user if request.user.is_authenticated else None,
                accion='ACTUALIZAR_POBLACION_DENOMINADORES',
                rol_usuario=rol_nombre,
                tabla_afectada='PoblacionAnual',
                valor_anterior=antes,
                valor_nuevo={c: str(getattr(pob, c)) for c in campos},
                ip_origen=request.META.get('REMOTE_ADDR', '127.0.0.1')
            )
        except Exception:
            pass

        return Response({
            'status': 'success',
            'message': f'Población y denominadores para el año {anio} actualizados correctamente.',
            'poblacion': {c: str(getattr(pob, c)) for c in campos},
            'denominadores': _get_resumen_denominadores()
        })
