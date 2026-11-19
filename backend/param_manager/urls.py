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

from .views import (
    CalculoIndicadoresView,
    ComparativoHistoricoView,
    EstadoRemView,
    PoblacionParametrizacionView,
    ParametrizarMetasCeldasView,
    EvaluarFormulaView,
)

router = DefaultRouter()
router.register('programas', ProgramaViewSet, basename='programa')
router.register('metas', MetaViewSet, basename='meta')
router.register('indicadores', IndicadorViewSet, basename='indicador')
router.register('componentes', ComponenteDatoViewSet, basename='componente')
router.register('valores', MetaValorViewSet, basename='metavalor')

urlpatterns = [
    path('calc/', CalculoIndicadoresView.as_view(), name='calculo'),
    path('comparativo/', ComparativoHistoricoView.as_view(), name='comparativo-historico'),
    path('historico/', ComparativoHistoricoView.as_view(), name='historico'),
    path('estado-rem/', EstadoRemView.as_view(), name='estado-rem'),
    path('poblacion/', PoblacionParametrizacionView.as_view(), name='poblacion'),
    path('parametrizar-metas-celdas/', ParametrizarMetasCeldasView.as_view(), name='parametrizar-metas-celdas'),
    path('evaluar-formula/', EvaluarFormulaView.as_view(), name='evaluar-formula'),
] + router.urls
