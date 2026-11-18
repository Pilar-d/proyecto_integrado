# rem_manager/models.py
from django.conf import settings
from django.db import models


class RemArchivo(models.Model):
    """Planilla REM (Serie A) cargada al sistema para un período determinado."""

    class Estado(models.TextChoices):
        VALIDO = 'VALIDO', 'Válido'
        RECHAZADO = 'RECHAZADO', 'Rechazado'
        REEMPLAZADO = 'REEMPLAZADO', 'Reemplazado'

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='rem_archivos',
    )
    archivo = models.FileField(upload_to='rem/%Y/', null=True, blank=True)
    archivo_nombre = models.CharField(max_length=255)
    periodo_mes = models.PositiveSmallIntegerField()
    periodo_year = models.PositiveSmallIntegerField()
    establecimiento = models.CharField(max_length=200, blank=True, default='')
    hojas_rem = models.PositiveSmallIntegerField(default=0)
    estado = models.CharField(
        max_length=20, choices=Estado.choices, default=Estado.VALIDO
    )
    observaciones = models.TextField(blank=True, default='')
    fecha_carga = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_carga']
        verbose_name = 'Archivo REM'
        verbose_name_plural = 'Archivos REM'

    def __str__(self):
        return f'REM {self.periodo_mes:02d}-{self.periodo_year} ({self.archivo_nombre})'
