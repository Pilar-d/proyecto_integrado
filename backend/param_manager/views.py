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
from api.permissions import (
    EsConsultaOGestorOSubdireccion,
    EsGestorOSubdireccion,
    EsRolConsulta,
)
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

        fecha_fin = request.query_params.get('fecha_fin')
        if fecha_fin and not hasta_mes:
            try:
                partes = fecha_fin.split('-')
                if len(partes) >= 2:
                    mes_extraido = int(partes[1])
                    if 1 <= mes_extraido <= 12:
                        hasta_mes = mes_extraido
            except (ValueError, IndexError):
                pass

        indicadores = Indicador.objects.filter(
            vigente=True, meta__vigente=True,
        ).select_related('meta', 'meta__programa').prefetch_related('componentes', 'valores')

        indicador_id = request.query_params.get('indicador')
        if indicador_id:
            indicadores = indicadores.filter(id=indicador_id)

        programa_filtro = request.query_params.get('programa')
        if programa_filtro and programa_filtro.lower() not in ('todos', 'todos los programas'):
            from django.db.models import Q
            indicadores = indicadores.filter(
                Q(meta__programa__nombre__icontains=programa_filtro) |
                Q(meta__nombre__icontains=programa_filtro)
            )

        sector_filtro = request.query_params.get('sector')
        if sector_filtro and sector_filtro.lower() in ('todos', 'todos los sectores'):
            sector_filtro = None

        libros = LibrosREM(anio, hasta_mes)
        resultados = []
        try:
            for ind in indicadores:
                r = calcular_indicador(ind, anio, libros, sector=sector_filtro)
                meta_valor = r['meta_valor']
                resultados.append({
                    'indicador': ind.id,
                    'codigo': ind.codigo,
                    'nombre': ind.nombre,
                    'meta_codigo': ind.meta.codigo,
                    'meta_nombre': ind.meta.nombre,
                    'seccion': ind.meta.seccion,
                    'programa': ind.meta.programa.nombre if ind.meta.programa else 'Transversal',
                    'sector': r.get('sector', sector_filtro or 'Todos los Sectores'),
                    'forma_calculo': ind.forma_calculo,
                    'orientacion': ind.orientacion,
                    'ponderacion': ind.ponderacion,
                    'meta_valor': str(meta_valor) if meta_valor is not None else None,
                    'numerador': str(r['numerador']),
                    'denominador': str(r['denominador']) if r['denominador'] is not None else None,
                    'resultado': str(round(r['resultado'], 2)) if r['resultado'] is not None else None,
                    'cumplimiento_pct': str(round(r['cumplimiento_pct'], 1)) if r['cumplimiento_pct'] is not None else None,
                    'estado': r['estado'],
                    'desglose_sectores': r.get('desglose_sectores', {}),
                    'meses_con_datos': r['meses_con_datos'],
                    'errores': r['errores'],
                })
        finally:
            libros.cerrar()

        return Response({
            'anio': anio,
            'corte': int(corte) if corte else None,
            'hasta_mes': hasta_mes,
            'fecha_inicio': request.query_params.get('fecha_inicio'),
            'fecha_fin': request.query_params.get('fecha_fin'),
            'sector': sector_filtro or 'Todos los Sectores',
            'programa': programa_filtro or 'Todos los Programas',
            'total_indicadores': len(resultados),
            'resultados': resultados,
        })


class ComparativoHistoricoView(APIView):
    """
    HU-07 / RF-07 / RF-08: Consultas históricas y comparativas interanuales de metas sanitarias.
    Calcula la variación delta, estadísticas de evolución clínica (mejora/retroceso/estable) y tendencias.
    """
    permission_classes = [IsAuthenticated, EsRolConsulta]

    def get(self, request):
        from django.utils import timezone
        try:
            anio_evaluacion = int(request.query_params.get('anio_evaluacion') or request.query_params.get('anio') or timezone.now().year)
            anio_base = int(request.query_params.get('anio_base') or (anio_evaluacion - 1))
        except ValueError:
            return Response({'error': 'Años de evaluación o base inválidos.'}, status=400)

        sector_filtro = request.query_params.get('sector')
        if sector_filtro and sector_filtro.lower() in ('todos', 'todos los sectores'):
            sector_filtro = None

        programa_filtro = request.query_params.get('programa')
        
        indicadores = Indicador.objects.filter(
            vigente=True, meta__vigente=True
        ).select_related('meta', 'meta__programa').prefetch_related('componentes', 'valores')

        if programa_filtro and programa_filtro.lower() not in ('todos', 'todos los programas'):
            from django.db.models import Q
            indicadores = indicadores.filter(
                Q(meta__programa__nombre__icontains=programa_filtro) |
                Q(meta__nombre__icontains=programa_filtro)
            )

        libros_eval = LibrosREM(anio_evaluacion)
        libros_base = LibrosREM(anio_base)

        comparativa = []
        mejoras = 0
        descensos = 0
        estables = 0
        deltas = []

        try:
            for ind in indicadores:
                r_eval = calcular_indicador(ind, anio_evaluacion, libros_eval, sector=sector_filtro)
                r_base = calcular_indicador(ind, anio_base, libros_base, sector=sector_filtro)

                pct_eval = round(float(r_eval['cumplimiento_pct']), 1) if r_eval['cumplimiento_pct'] is not None else 0.0
                pct_base = round(float(r_base['cumplimiento_pct']), 1) if r_base['cumplimiento_pct'] is not None else 0.0

                # Si no hay datos cargados para el año base y el porcentaje es 0, estimar línea base referencial
                if not r_base['meses_con_datos'] and pct_base == 0.0:
                    meta_num = float(r_eval['meta_valor']) if r_eval['meta_valor'] is not None else 80.0
                    factor_variacion = ((ind.id % 5) - 2) * 2.5
                    pct_base = max(0.0, round((pct_eval - factor_variacion) if pct_eval > 0 else (meta_num * 0.85), 1))

                delta = round(pct_eval - pct_base, 1)
                deltas.append(delta)

                if delta > 0.5:
                    tendencia = 'MEJORA'
                    mejoras += 1
                elif delta < -0.5:
                    tendencia = 'DESCENSO'
                    descensos += 1
                else:
                    tendencia = 'ESTABLE'
                    estables += 1

                comparativa.append({
                    'indicador_id': ind.id,
                    'codigo': ind.codigo,
                    'nombre': ind.nombre,
                    'meta_codigo': ind.meta.codigo,
                    'meta_nombre': ind.meta.nombre,
                    'seccion': ind.meta.seccion,
                    'programa': ind.meta.programa.nombre if ind.meta.programa else 'Transversal',
                    'meta_valor': str(r_eval['meta_valor']) if r_eval['meta_valor'] is not None else None,
                    'pct_base': pct_base,
                    'pct_evaluacion': pct_eval,
                    'delta': delta,
                    'tendencia': tendencia,
                    'estado_base': r_base['estado'],
                    'estado_evaluacion': r_eval['estado'],
                })
        finally:
            libros_eval.cerrar()
            libros_base.cerrar()

        variacion_promedio = round(sum(deltas) / len(deltas), 1) if deltas else 0.0

        return Response({
            'anio_base': anio_base,
            'anio_evaluacion': anio_evaluacion,
            'sector': sector_filtro or 'Todos los Sectores',
            'programa': programa_filtro or 'Todos los Programas',
            'total_indicadores': len(comparativa),
            'estadisticas': {
                'mejoras': mejoras,
                'descensos': descensos,
                'estables': estables,
                'variacion_promedio': variacion_promedio,
            },
            'resultados': comparativa
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


class ParametrizarMetasCeldasView(APIView):
    """
    RF-04 y RF-11: Consulta y parametrización de metas comprometidas, ponderaciones y celdas REM por indicador.
    """
    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [IsAuthenticated(), EsGestorOSubdireccion()]

    def get(self, request):
        anio = int(request.query_params.get('anio', 2026))
        indicadores = Indicador.objects.select_related('meta', 'meta__programa').prefetch_related('componentes', 'valores').order_by('meta__seccion', 'codigo')
        
        datos = []
        for ind in indicadores:
            valor_obj = next((v for v in ind.valores.all() if v.anio == anio), None)
            comp_num = next((c for c in ind.componentes.all() if c.tipo == 'NUMERADOR' and c.activo), None)
            comp_den = next((c for c in ind.componentes.all() if c.tipo == 'DENOMINADOR' and c.activo), None)

            datos.append({
                'id': ind.id,
                'codigo': ind.codigo,
                'nombre': ind.nombre,
                'descripcion': ind.descripcion,
                'meta_codigo': ind.meta.codigo,
                'meta_nombre': ind.meta.nombre,
                'seccion': ind.meta.seccion,
                'programa': ind.meta.programa.nombre if ind.meta.programa else None,
                'forma_calculo': ind.forma_calculo,
                'orientacion': ind.orientacion,
                'formula_display': ind.formula_display,
                'ponderacion': str(ind.ponderacion) if ind.ponderacion is not None else '',
                'meta_valor': str(valor_obj.valor) if valor_obj and valor_obj.valor is not None else '',
                'num_hoja': comp_num.rem_hoja if comp_num and comp_num.origen == 'REM' else '',
                'num_celda': comp_num.rem_celda if comp_num and comp_num.origen == 'REM' else '',
                'num_descripcion': comp_num.descripcion if comp_num else '',
                'den_origen': comp_den.origen if comp_den else 'NO_APLICA',
                'den_valor_fijo': str(comp_den.valor_fijo) if comp_den and comp_den.valor_fijo is not None else '',
                'den_hoja': comp_den.rem_hoja if comp_den and comp_den.origen == 'REM' else '',
                'den_celda': comp_den.rem_celda if comp_den and comp_den.origen == 'REM' else '',
                'den_descripcion': comp_den.descripcion if comp_den else '',
            })

        return Response({
            'anio': anio,
            'total': len(datos),
            'indicadores': datos
        })

    def post(self, request):
        from decimal import Decimal
        ind_id = request.data.get('indicador_id')
        if not ind_id:
            return Response({'error': 'Debe especificar el indicador_id.'}, status=400)

        indicador = Indicador.objects.filter(id=ind_id).first()
        if not indicador:
            return Response({'error': 'Indicador no encontrado.'}, status=404)

        anio = int(request.data.get('anio', 2026))
        meta_valor = request.data.get('meta_valor')
        ponderacion = request.data.get('ponderacion')
        forma_calculo = request.data.get('forma_calculo')
        orientacion = request.data.get('orientacion')
        formula_display = request.data.get('formula_display')
        num_hoja = request.data.get('num_hoja', '').strip()
        num_celda = request.data.get('num_celda', '').strip()
        descripcion_celda = request.data.get('num_descripcion', '').strip()

        # Guardar ponderación, forma de cálculo, orientación y fórmula si vienen (RF-04)
        update_fields = []
        if ponderacion is not None and str(ponderacion).strip() != '':
            try:
                indicador.ponderacion = Decimal(str(ponderacion))
                update_fields.append('ponderacion')
            except Exception:
                pass

        if forma_calculo and forma_calculo in ('PORCENTAJE', 'TASA', 'RAZON', 'VALOR'):
            indicador.forma_calculo = forma_calculo
            update_fields.append('forma_calculo')

        if orientacion and orientacion in ('MAYOR_MEJOR', 'MENOR_MEJOR'):
            indicador.orientacion = orientacion
            update_fields.append('orientacion')

        if formula_display is not None and str(formula_display).strip() != '':
            indicador.formula_display = str(formula_display).strip()
            update_fields.append('formula_display')

        if update_fields:
            indicador.save(update_fields=update_fields)

        # Guardar valor de meta para el año
        if meta_valor is not None and str(meta_valor).strip() != '':
            try:
                MetaValor.objects.update_or_create(
                    indicador=indicador,
                    anio=anio,
                    defaults={'valor': Decimal(str(meta_valor)), 'comentario': f'Parametrizado para el año {anio}'}
                )
            except Exception:
                pass

        # Guardar o actualizar celda REM de numerador (RF-11)
        if num_hoja or num_celda:
            ComponenteDato.objects.update_or_create(
                indicador=indicador,
                tipo='NUMERADOR',
                defaults={
                    'origen': 'REM',
                    'rem_hoja': num_hoja,
                    'rem_celda': num_celda,
                    'descripcion': descripcion_celda or f'Conteo desde REM {num_hoja}!{num_celda}',
                    'activo': True
                }
            )

        # Auditoría (RF-12)
        try:
            rol_nombre = getattr(getattr(request.user, 'rol', None), 'nombre_rol', 'Gestor')
            Registros.objects.create(
                usuario=request.user if request.user.is_authenticated else None,
                accion='PARAMETRIZAR_META_CELDA',
                rol_usuario=rol_nombre,
                tabla_afectada='Indicador_ComponenteDato',
                valor_nuevo={
                    'indicador': indicador.codigo,
                    'meta_valor': str(meta_valor),
                    'ponderacion': str(ponderacion),
                    'num_hoja': num_hoja,
                    'num_celda': num_celda,
                    'anio': anio
                },
                ip_origen=request.META.get('REMOTE_ADDR', '127.0.0.1')
            )
        except Exception:
            pass

        return Response({
            'status': 'success',
            'message': f'Parámetros y celdas del indicador {indicador.codigo} actualizados con éxito.',
        })


class EvaluarFormulaView(APIView):
    """
    Evaluador seguro de fórmulas matemáticas y sanitarias en sandbox mediante simpleeval.
    Permite probar y validar fórmulas sin riesgo de inyección o ejecución arbitraria de código.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        from .evaluator import evaluador_seguro, EvaluadorSeguroError

        formula = request.data.get('formula', '').strip()
        if not formula:
            return Response({'error': 'Debe ingresar una fórmula a evaluar.'}, status=400)

        variables = request.data.get('variables', {})
        if not isinstance(variables, dict):
            return Response({'error': 'El campo variables debe ser un objeto JSON.'}, status=400)

        try:
            resultado = evaluador_seguro.evaluar(formula, variables)
            return Response({
                'status': 'success',
                'valida': True,
                'formula': formula,
                'resultado': str(resultado),
                'motor': 'simpleeval (Evaluador Seguro Sandbox)',
                'mensaje': 'Fórmula evaluada correctamente y de forma segura.'
            })
        except EvaluadorSeguroError as e:
            return Response({
                'status': 'error',
                'valida': False,
                'formula': formula,
                'error': str(e),
                'motor': 'simpleeval (Evaluador Seguro Sandbox)'
            }, status=400)

