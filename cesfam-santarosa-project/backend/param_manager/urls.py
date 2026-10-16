# param_manager/urls.py
from rest_framework.routers import DefaultRouter

from .views import (
    ComponenteDatoViewSet,
    IndicadorViewSet,
    MetaViewSet,
    MetaValorViewSet,
    ProgramaViewSet,
)

router = DefaultRouter()
router.register('programas', ProgramaViewSet, basename='programa')
router.register('metas', MetaViewSet, basename='meta')
router.register('indicadores', IndicadorViewSet, basename='indicador')
router.register('componentes', ComponenteDatoViewSet, basename='componente')
router.register('valores', MetaValorViewSet, basename='metavalor')

urlpatterns = router.urls
