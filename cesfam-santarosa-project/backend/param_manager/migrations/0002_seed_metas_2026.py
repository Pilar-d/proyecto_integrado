# Semilla de la estructura de metas 2026 del CESFAM Santa Rosa:
# - 19 indicadores IAAPS 2026 (OT IAAPS v1.0, marzo 2026) con meta nacional,
#   ponderación y fórmula oficial.
# - 8 metas sanitarias comunales (Ley 19.813, planilla local del CESFAM).
# Los componentes de dato (celdas REM de numerador/denominador) quedan para
# configurar desde el módulo de parametrización, que es exactamente su propósito.
from django.db import migrations

PROGRAMAS = [
    'Transversal', 'Cardiovascular', 'Respiratorio (Asma/EPOC)', 'Salud Mental',
    'Odontológico', 'Salud Maternal y Reproductiva', 'Niñez y Adolescencia',
    'Adulto y Persona Mayor', 'Salud Comunitaria',
]

# (codigo, nombre, forma_calculo, ponderacion, meta_nacional_2026, formula_display)
IAAPS = [
    ('IAAPS-1', 'RISS', [
        ('1', 'Centros de salud autoevaluados en modelo MAIS',
         'PORCENTAJE', '4', '100',
         'N° centros autoevaluados con instrumento MAIS vigente / Total establecimientos × 100'),
    ]),
    ('IAAPS-2', 'RISS', [
        ('2.1', 'Continuidad de la atención (horario extendido)',
         'PORCENTAJE', '4', '100',
         'N° establecimientos con horario 8:00-20:00 L-V y sáb 9:00-13:00 / Total visitados × 100'),
        ('2.2', 'Disponibilidad de fármacos trazadores',
         'PORCENTAJE', '4', '100',
         'N° fármacos trazadores disponibles / Total fármacos trazadores × 100'),
    ]),
    ('IAAPS-3', 'PRODUCCION', [
        ('3', 'Tasa de consultas médicas de morbilidad',
         'RAZON', '6', '1.0',
         'N° consultas de morbilidad por médico / Población inscrita validada'),
    ]),
    ('IAAPS-4', 'PRODUCCION', [
        ('4', 'Porcentaje de derivación al nivel secundario',
         'PORCENTAJE', '5', '10',
         'N° SIC de controles y consultas médicas generadas en APS / Total controles y consultas × 100 (meta: < 10%)'),
    ]),
    ('IAAPS-5', 'PRODUCCION', [
        ('5', 'Tasa de visita domiciliaria integral',
         'RAZON', '5', '0.22',
         'N° visitas domiciliarias integrales / N° familias (población inscrita / 3,3)'),
    ]),
    ('IAAPS-6', 'PRODUCCION', [
        ('6.1.A', 'Cobertura EMP en mujeres de 20 a 64 años',
         'PORCENTAJE', '3', '27',
         'N° EMP realizados a mujeres 20-64 años / Total mujeres 20-64 inscritas validadas (excluye embarazadas 20-54) × 100'),
        ('6.1.B', 'Cobertura EMP en hombres de 20 a 64 años',
         'PORCENTAJE', '4', '30',
         'N° EMP realizados a hombres 20-64 años / Total hombres 20-64 inscritos validados × 100'),
        ('6.2', 'Cobertura EMP en personas de 65 años y más',
         'PORCENTAJE', '5', '55',
         'N° EMP realizados a personas 65+ / Total personas 65+ inscritas validadas × 100'),
    ]),
    ('IAAPS-7', 'PRODUCCION', [
        ('7', 'Cobertura de evaluación del desarrollo psicomotor (12-23 meses)',
         'PORCENTAJE', '5', '95',
         'N° niños/as 12-23 meses con evaluación EDPM / Total niños/as 12-23 meses bajo control × 100'),
    ]),
    ('IAAPS-8', 'PRODUCCION', [
        ('8', 'Cobertura de control de salud integral a adolescentes (10-19 años)',
         'PORCENTAJE', '6', '25',
         'N° controles de salud integral a adolescentes 10-19 años / Total adolescentes 10-19 inscritos validados × 100'),
    ]),
    ('IAAPS-9', 'PRODUCCION', [
        ('9.1', 'Cobertura de atención integral en salud mental',
         'PORCENTAJE', '5.5', '20',
         'N° personas con trastornos mentales bajo control 0+ / N° esperados según prevalencia × 100'),
        ('9.2', 'Tasa de controles de atención integral en salud mental',
         'RAZON', '3.3', '6.5',
         'N° controles de salud mental realizados 0+ / Personas bajo control en programa salud mental'),
        ('9.3', 'Personas egresadas por alta clínica en salud mental',
         'PORCENTAJE', '2.2', '14',
         'N° personas egresadas por alta clínica 0+ / Personas bajo control en programa salud mental × 100'),
    ]),
    ('IAAPS-10', 'PRODUCCION', [
        ('10', 'Cumplimiento de garantías GES de ejecución en APS',
         'PORCENTAJE', None, None,
         'N° casos GES cumplidos en APS / N° casos GES vigilados × 100 (excluido del total IAAPS)'),
    ]),
    ('IAAPS-11', 'PRODUCCION', [
        ('11', 'Cobertura de vacunación anti-influenza en población objetivo',
         'PORCENTAJE', '5', '85',
         'N° personas de grupos objetivo vacunadas / Total población grupos objetivo × 100'),
    ]),
    ('IAAPS-12', 'PRODUCCION', [
        ('12', 'Ingreso precoz de mujeres a control de embarazo',
         'PORCENTAJE', '6', '90',
         'N° embarazadas ingresadas antes de 14 semanas / Total embarazadas ingresadas a control × 100'),
    ]),
    ('IAAPS-13', 'PRODUCCION', [
        ('13', 'Cobertura de adolescentes 15-19 años con regulación de fertilidad',
         'PORCENTAJE', '6', '25',
         'N° adolescentes 15-19 inscritas con método de regulación de fertilidad / Total adolescentes 15-19 inscritas × 100'),
    ]),
    ('IAAPS-14', 'PRODUCCION', [
        ('14', 'Cobertura de Diabetes Mellitus tipo 2 (15 años y más)',
         'PORCENTAJE', '6', '63',
         'N° personas 15+ con DM2 bajo control / N° esperadas según prevalencia × 100'),
    ]),
    ('IAAPS-15', 'PRODUCCION', [
        ('15', 'Cobertura de Hipertensión Arterial (15 años y más)',
         'PORCENTAJE', '6', '62',
         'N° personas 15+ con HTA bajo control / N° esperadas según prevalencia × 100'),
    ]),
    ('IAAPS-16', 'PRODUCCION', [
        ('16', 'Utilización de servicios de salud',
         'PORCENTAJE', '6', None,
         'N° personas individualizadas con ≥ 1 prestación / Población inscrita validada × 100'),
    ]),
    ('IAAPS-17', 'IMPACTO', [
        ('17', 'Proporción de niñas y niños menores de 3 años libres de caries',
         'PORCENTAJE', '5', '60',
         'N° niños/as < 3 años con CEOD = 0 / Total niños/as < 3 años inscritos validados × 100'),
    ]),
    ('IAAPS-18', 'IMPACTO', [
        ('18', 'Prevalencia de normalidad nutricional en menores de 2 años',
         'PORCENTAJE', '4', '65',
         'N° niños/as < 2 años con estado nutricional normal / Total niños/as < 2 años bajo control × 100'),
    ]),
    ('IAAPS-19', 'IMPACTO', [
        ('19', 'Tasa de hospitalizaciones evitables por condiciones sensibles a APS',
         'TASA', None, None,
         'N° hospitalizaciones evitables × 10.000 / Total población inscrita validada (meta: línea base)'),
    ]),
]

IAAPS_NOMBRES = {
    'IAAPS-1': 'Modelo Asistencial: autoevaluación MAIS',
    'IAAPS-2': 'Ámbito RISS: organización y gestión',
    'IAAPS-3': 'Tasa de consultas médicas de morbilidad',
    'IAAPS-4': 'Porcentaje de derivación al nivel secundario',
    'IAAPS-5': 'Tasa de visita domiciliaria integral',
    'IAAPS-6': 'Cobertura de Examen de Medicina Preventiva (20 años y más)',
    'IAAPS-7': 'Cobertura de evaluación del desarrollo psicomotor (12-23 meses)',
    'IAAPS-8': 'Cobertura de control de salud integral a adolescentes',
    'IAAPS-9': 'Atención integral en salud mental',
    'IAAPS-10': 'Cumplimiento de garantías GES en APS',
    'IAAPS-11': 'Cobertura de vacunación anti-influenza',
    'IAAPS-12': 'Ingreso precoz a control de embarazo',
    'IAAPS-13': 'Adolescentes con regulación de fertilidad',
    'IAAPS-14': 'Cobertura de Diabetes Mellitus tipo 2',
    'IAAPS-15': 'Cobertura de Hipertensión Arterial',
    'IAAPS-16': 'Utilización de servicios de salud',
    'IAAPS-17': 'Niños menores de 3 años libres de caries',
    'IAAPS-18': 'Prevalencia de normalidad en menores de 2 años',
    'IAAPS-19': 'Hospitalizaciones evitables por condiciones sensibles a APS',
}

PROGRAMA_MS = {
    'MS-1': 'Niñez y Adolescencia', 'MS-2': 'Salud Maternal y Reproductiva',
    'MS-3a': 'Odontológico', 'MS-3b': 'Odontológico',
    'MS-4a': 'Cardiovascular', 'MS-4b': 'Cardiovascular',
    'MS-5': 'Cardiovascular', 'MS-6': 'Niñez y Adolescencia',
    'MS-7': 'Respiratorio (Asma/EPOC)', 'MS-8': 'Salud Comunitaria',
}

# (codigo, nombre, meta_comunal_2026)
METAS_COMUNALES = [
    ('MS-1', 'Recuperación del desarrollo psicomotor en niños y niñas', '90'),
    ('MS-2', 'Reducir brecha de cobertura de Papanicolaou', None),
    ('MS-3a', 'Control con enfoque de riesgo odontológico', None),
    ('MS-3b', 'Niños y niñas de 6 años libres de caries', None),
    ('MS-4a', 'Aumentar compensación efectiva de personas con diabetes', None),
    ('MS-4b', 'Evaluación de pie diabético', '90'),
    ('MS-5', 'Aumentar la compensación de personas hipertensas', None),
    ('MS-6', 'Lactancia materna exclusiva al sexto mes de vida', None),
    ('MS-7', 'Cobertura efectiva de tratamiento en asma y EPOC', None),
    ('MS-8', 'Plan de trabajo en salud comunitaria', None),
]


def sembrar(apps, schema_editor):
    Programa = apps.get_model('param_manager', 'Programa')
    Meta = apps.get_model('param_manager', 'Meta')
    Indicador = apps.get_model('param_manager', 'Indicador')
    MetaValor = apps.get_model('param_manager', 'MetaValor')
    from decimal import Decimal

    programas = {}
    for nombre in PROGRAMAS:
        obj, _ = Programa.objects.get_or_create(
            nombre=nombre, defaults={'descripcion': f'Programa {nombre}'}
        )
        programas[nombre] = obj

    # --- IAAPS 2026 ---
    for meta_codigo, seccion, indicadores in IAAPS:
        meta, _ = Meta.objects.get_or_create(
            codigo=meta_codigo,
            defaults={
                'nombre': IAAPS_NOMBRES[meta_codigo],
                'seccion': seccion,
                'descripcion': 'Indicador IAAPS 2026 según Orientaciones Técnicas '
                               'Índice de Actividad de la APS (MINSAL, marzo 2026).',
            },
        )
        for cod, nombre, forma, ponderacion, meta_valor, formula in indicadores:
            indicador, _ = Indicador.objects.get_or_create(
                meta=meta, codigo=cod,
                defaults={
                    'nombre': nombre,
                    'forma_calculo': forma,
                    'formula_display': formula,
                    'ponderacion': Decimal(ponderacion) if ponderacion else None,
                },
            )
            if meta_valor is not None:
                MetaValor.objects.get_or_create(
                    indicador=indicador, anio=2026,
                    defaults={
                        'valor': Decimal(meta_valor),
                        'comentario': 'Meta nacional IAAPS 2026',
                    },
                )

    # --- Metas sanitarias comunales (Ley 19.813) ---
    for codigo, nombre, meta_comunal in METAS_COMUNALES:
        meta, _ = Meta.objects.get_or_create(
            codigo=codigo,
            defaults={
                'nombre': nombre,
                'seccion': 'COMUNAL',
                'programa_id': programas[PROGRAMA_MS[codigo]].id,
                'descripcion': 'Meta sanitaria comunal 2026 (Ley 19.813, '
                               'Resolución Exenta N°650/2025).',
            },
        )
        indicador, _ = Indicador.objects.get_or_create(
            meta=meta, codigo=codigo,
            defaults={
                'nombre': nombre,
                'forma_calculo': 'PORCENTAJE',
            },
        )
        if meta_comunal is not None:
            MetaValor.objects.get_or_create(
                indicador=indicador, anio=2026,
                defaults={
                    'valor': Decimal(meta_comunal),
                    'comentario': 'Meta comunal 2026',
                },
            )


def deshacer(apps, schema_editor):
    Meta = apps.get_model('param_manager', 'Meta')
    Meta.objects.filter(codigo__startswith='IAAPS-').delete()
    Meta.objects.filter(codigo__startswith='MS-').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('param_manager', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(sembrar, deshacer),
    ]
