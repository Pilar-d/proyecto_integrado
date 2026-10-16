# param_manager/views.py
"""
Vistas CRUD para la parametrización de metas (RF-04 / RF-11).
Toda creación, actualización o eliminación queda registrada en la bitácora de
auditoría (RF-12) con usuario, fecha, hora y valores antes/después.
"""
import json

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from authentication.models import RegistroAuditoria
from authentication.permissions import EsConsultaOGestorOSubdireccion
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
