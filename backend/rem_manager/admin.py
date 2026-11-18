from django.contrib import admin
from .models import RemArchivo

@admin.register(RemArchivo)
class RemArchivoAdmin(admin.ModelAdmin):
    list_display = ('periodo_mes', 'periodo_year', 'archivo_nombre', 'hojas_rem', 'estado', 'establecimiento', 'fecha_carga', 'usuario')
    list_filter = ('periodo_year', 'periodo_mes', 'estado')
    search_fields = ('archivo_nombre', 'establecimiento')
    readonly_fields = ('fecha_carga',)
