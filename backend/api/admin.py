from django.contrib import admin
from .models import (
    Rol, Usuario, Sector, Programa, MetaSanitaria, Indicador,
    PlantillaRemMapeo, ArchivosRem, ValoresExtraidos, CumplimientoMensual, Registros
)

@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre_rol', 'descripcion')
    search_fields = ('nombre_rol',)

@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('rut', 'nombres', 'apellidos', 'email', 'rol', 'is_staff', 'estado')
    search_fields = ('rut', 'nombres', 'apellidos', 'email')
    list_filter = ('rol', 'estado', 'is_staff')

@admin.register(Sector)
class SectorAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre_sector')

@admin.register(Programa)
class ProgramaAdmin(admin.ModelAdmin):
    list_display = ('codigo_programa', 'nombre_programa', 'usuario')
    search_fields = ('codigo_programa', 'nombre_programa')

@admin.register(MetaSanitaria)
class MetaSanitariaAdmin(admin.ModelAdmin):
    list_display = ('codigo_meta', 'nombre_meta', 'year_vigencia', 'programa')
    list_filter = ('year_vigencia', 'programa')

@admin.register(Indicador)
class IndicadorAdmin(admin.ModelAdmin):
    list_display = ('codigo_indicador', 'nombre_indicador', 'meta_esperada', 'unidad_medida', 'meta')
    search_fields = ('codigo_indicador', 'nombre_indicador')

@admin.register(PlantillaRemMapeo)
class PlantillaRemMapeoAdmin(admin.ModelAdmin):
    list_display = ('indicador', 'serie_rem', 'nombre_hoja', 'coordenada_celda', 'tipo_componente', 'vigente_desde')
    list_filter = ('serie_rem', 'tipo_componente')

@admin.register(ArchivosRem)
class ArchivosRemAdmin(admin.ModelAdmin):
    list_display = ('nombre_archivo', 'periodo_mes', 'periodo_year', 'fecha_carga', 'usuario')
    list_filter = ('periodo_year', 'periodo_mes')

@admin.register(ValoresExtraidos)
class ValoresExtraidosAdmin(admin.ModelAdmin):
    list_display = ('archivo', 'mapeo', 'sector', 'valor_obtenido')

@admin.register(CumplimientoMensual)
class CumplimientoMensualAdmin(admin.ModelAdmin):
    list_display = ('indicador', 'periodo_mes', 'periodo_year', 'porcentaje_calculado', 'estado_umbral', 'sector')
    list_filter = ('periodo_year', 'periodo_mes', 'estado_umbral')

@admin.register(Registros)
class RegistrosAdmin(admin.ModelAdmin):
    list_display = ('fecha_hora', 'accion', 'usuario', 'rol_usuario', 'tabla_afectada', 'ip_origen')
    list_filter = ('accion', 'tabla_afectada', 'rol_usuario')
    search_fields = ('usuario__rut', 'accion', 'tabla_afectada')
    readonly_fields = ('fecha_hora',)
