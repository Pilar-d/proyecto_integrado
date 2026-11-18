from django.contrib import admin
from .models import Programa, Meta, Indicador, ComponenteDato, MetaValor, PoblacionAnual

@admin.register(Programa)
class ProgramaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'activo')
    search_fields = ('nombre',)

@admin.register(Meta)
class MetaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'seccion', 'programa', 'vigente')
    list_filter = ('seccion', 'vigente', 'programa')
    search_fields = ('codigo', 'nombre')

@admin.register(Indicador)
class IndicadorAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'meta', 'forma_calculo', 'orientacion', 'ponderacion', 'vigente')
    list_filter = ('forma_calculo', 'orientacion', 'vigente', 'meta__seccion')
    search_fields = ('codigo', 'nombre')

@admin.register(ComponenteDato)
class ComponenteDatoAdmin(admin.ModelAdmin):
    list_display = ('indicador', 'tipo', 'origen', 'rem_hoja', 'rem_celda', 'valor_fijo', 'activo')
    list_filter = ('tipo', 'origen', 'activo')
    search_fields = ('indicador__codigo', 'rem_hoja', 'rem_celda')

@admin.register(MetaValor)
class MetaValorAdmin(admin.ModelAdmin):
    list_display = ('indicador', 'anio', 'valor', 'comentario')
    list_filter = ('anio',)

@admin.register(PoblacionAnual)
class PoblacionAnualAdmin(admin.ModelAdmin):
    list_display = ('anio', 'poblacion_total', 'mujeres_20_64', 'hombres_20_64', 'adultos_mayores_65', 'actualizado_en')

