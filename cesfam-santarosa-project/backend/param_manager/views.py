# param_manager/views.py
"""
Vistas CRUD para la parametrización de metas (RF-04 / RF-11).
Toda creación, actualización o eliminación queda registrada en la bitácora de
auditoría (RF-12) con usuario, fecha, hora y valores antes/después.
"""
import json

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.models import RegistroAuditoria
from authentication.permissions import EsConsultaOGestorOSubdireccion, EsRolConsulta
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
        RegistroAuditoria.objects.create(
            usuario=self.request.user if self.request.user.is_authenticated else None,
            accion=accion,
            tabla_afectada=type(instancia).__name__,
            valor_anterior=json.dumps(antes, ensure_ascii=False, default=str) if antes else None,
            valor_nuevo=json.dumps(despues, ensure_ascii=False, default=str) if despues else None,
        )

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
