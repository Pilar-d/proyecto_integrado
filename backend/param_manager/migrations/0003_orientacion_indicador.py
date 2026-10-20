# Agrega la orientación del indicador (mayor-mejor / menor-mejor) y marca
# los indicadores IAAPS donde "menos es mejor": derivación al nivel
# secundario (<10%) y hospitalizaciones evitables.
from django.db import migrations, models


def marcar_menor_mejor(apps, schema_editor):
    Indicador = apps.get_model('param_manager', 'Indicador')
    Indicador.objects.filter(meta__codigo__in=['IAAPS-4', 'IAAPS-19']).update(
        orientacion='MENOR_MEJOR'
    )


class Migration(migrations.Migration):

    dependencies = [
        ('param_manager', '0002_seed_metas_2026'),
    ]

    operations = [
        migrations.AddField(
            model_name='indicador',
            name='orientacion',
            field=models.CharField(
                choices=[
                    ('MAYOR_MEJOR', 'Mayor es mejor (cobertura: cumplir o superar la meta)'),
                    ('MENOR_MEJOR', 'Menor es mejor (ej: derivaciones, hospitalizaciones evitables)'),
                ],
                default='MAYOR_MEJOR',
                max_length=15,
            ),
        ),
        migrations.RunPython(marcar_menor_mejor, migrations.RunPython.noop),
    ]
