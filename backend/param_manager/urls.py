# param_manager/urls.py
from rest_framework.routers import DefaultRouter

from .views import (
    ComponenteDatoViewSet,
    IndicadorViewSet,
    MetaViewSet,
    MetaValorViewSet,
    ProgramaViewSet,
)

from django.urls import path

from .views import CalculoIndicadoresView

router = DefaultRouter()
router.register('programas', ProgramaViewSet, basename='programa')
router.register('metas', MetaViewSet, basename='meta')
router.register('indicadores', IndicadorViewSet, basename='indicador')
router.register('componentes', ComponenteDatoViewSet, basename='componente')
router.register('valores', MetaValorViewSet, basename='metavalor')

urlpatterns = [
    path('calc/', CalculoIndicadoresView.as_view(), name='calculo'),
] + router.urls
