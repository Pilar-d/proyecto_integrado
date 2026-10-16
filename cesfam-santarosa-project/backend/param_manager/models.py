# param_manager/models.py
"""
RF-04 / RF-11: Administración de Metas.
Permite definir y actualizar metas, indicadores, fórmulas, valores anuales y la
ubicación de los datos de insumo (hoja + celda del REM Serie A) SIN cambios de
programación, porque las definiciones ministeriales cambian mes a mes.
"""
from django.db import models


class Programa(models.Model):
    """Programa o área del consultorio (ej: Cardiovascular, Salud Mental...)."""
    nombre = models.CharField(max_length=150, unique=True)
    descripcion = models.TextField(blank=True, default='')
    activo = models.BooleanField(default=True)

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Meta(models.Model):
    """Una meta sanitaria (ej: IAAPS Meta 6, Meta Sanitaria Comunal II...)."""

    class Seccion(models.TextChoices):
        RISS = 'RISS', 'Estrategia RISS'
        PRODUCCION = 'PRODUCCION', 'Producción'
        IMPACTO = 'IMPACTO', 'Impacto'
        COMUNAL = 'COMUNAL', 'Metas Sanitarias Comunales'

    codigo = models.CharField(max_length=20, unique=True, help_text='Ej: IAAPS-6, MS-2')
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True, default='')
    seccion = models.CharField(max_length=15, choices=Seccion.choices, blank=True, default='')
    programa = models.ForeignKey(
        Programa, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='metas', help_text='Vacío = meta transversal',
    )
    vigente = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['codigo']
        verbose_name = 'Meta'
        verbose_name_plural = 'Metas'

    def __str__(self):
        return f'{self.codigo} - {self.nombre[:60]}'


class Indicador(models.Model):
    """Indicador de una meta (ej: 6.1.A EMP mujeres 20-64)."""

    class FormaCalculo(models.TextChoices):
        PORCENTAJE = 'PORCENTAJE', 'Porcentaje (numerador / denominador × 100)'
        TASA = 'TASA', 'Tasa por 10.000 (numerador / denominador × 10.000)'
        RAZON = 'RAZON', 'Razón (numerador / denominador)'
        VALOR = 'VALOR', 'Valor directo (solo numerador)'

    class Orientacion(models.TextChoices):
        MAYOR_MEJOR = 'MAYOR_MEJOR', 'Mayor es mejor (cobertura: cumplir o superar la meta)'
        MENOR_MEJOR = 'MENOR_MEJOR', 'Menor es mejor (ej: derivaciones, hospitalizaciones evitables)'

    meta = models.ForeignKey(Meta, on_delete=models.CASCADE, related_name='indicadores')
    codigo = models.CharField(max_length=20, help_text='Ej: 6.1.A, 9.2')
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True, default='')
    forma_calculo = models.CharField(
        max_length=15, choices=FormaCalculo.choices, default=FormaCalculo.PORCENTAJE
    )
    # Texto de la fórmula oficial, tal como aparece en la OT (informativo)
    formula_display = models.TextField(blank=True, default='')
    # Importancia relativa (%) para el cálculo del IAAPS; vacío = no pondera
    ponderacion = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    # Cómo se interpreta la comparación con la meta
    orientacion = models.CharField(
        max_length=15, choices=Orientacion.choices, default=Orientacion.MAYOR_MEJOR
    )
    vigente = models.BooleanField(default=True)

    class Meta:
        ordering = ['meta', 'codigo']
        unique_together = ('meta', 'codigo')

    def __str__(self):
        return f'{self.codigo} - {self.nombre[:60]}'


class ComponenteDato(models.Model):
    """
    De dónde se obtiene cada dato del cálculo (RF-11: el REM puede tener la
    información en diferentes celdas de un mes a otro).
    """
    indicador = models.ForeignKey(Indicador, on_delete=models.CASCADE, related_name='componentes')
    tipo = models.CharField(max_length=15, choices=[
        ('NUMERADOR', 'Numerador'),
        ('DENOMINADOR', 'Denominador'),
    ])
    descripcion = models.CharField(
        max_length=255, help_text='Ej: EMP realizados a mujeres de 20 a 64 años'
    )
    origen = models.CharField(max_length=15, choices=[
        ('REM', 'Celda del REM Serie A'),
        ('VALOR_FIJO', 'Valor fijo / parametrizado'),
    ], default='REM')
    # Ubicación de la data dentro del REM (parametrizable mes a mes)
    rem_hoja = models.CharField(
        max_length=10, blank=True, default='', help_text='Ej: A02'
    )
    rem_celda = models.CharField(
        max_length=10, blank=True, default='', help_text='Ej: D14'
    )
    # Alternativa: valor fijo (población inscrita, prevalencias, etc.)
    valor_fijo = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True
    )
    activo = models.BooleanField(default=True)

    class Meta:
        ordering = ['indicador', 'tipo']
        verbose_name = 'Componente de dato'
        verbose_name_plural = 'Componentes de dato'

    def __str__(self):
        if self.origen == 'REM':
            return f'{self.tipo} {self.indicador.codigo}: REM {self.rem_hoja}!{self.rem_celda}'
        return f'{self.tipo} {self.indicador.codigo}: valor fijo {self.valor_fijo}'


class MetaValor(models.Model):
    """Valor esperado de un indicador para un año (meta nacional o comunal)."""
    indicador = models.ForeignKey(Indicador, on_delete=models.CASCADE, related_name='valores')
    anio = models.PositiveSmallIntegerField()
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    comentario = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        ordering = ['-anio']
        unique_together = ('indicador', 'anio')

    def __str__(self):
        return f'{self.indicador.codigo} {self.anio}: {self.valor}'
