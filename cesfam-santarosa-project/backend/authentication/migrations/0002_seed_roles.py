# Semilla de los roles institucionales definidos en el documento de
# requerimientos 2026 del CESFAM Santa Rosa.
from django.db import migrations

ROLES = [
    ('Directora', 'Consulta global de reportes y dashboards para toma de decisiones. '
                  'No modifica parámetros ni carga REM.'),
    ('Subdireccion', 'Subdirección Clínica y Administrativa: visualiza reportes, carga REM, '
                     'modifica información y accede a parametrización.'),
    ('Gestor', 'Gestor de Información (administrador del sistema): administración completa, '
               'carga REM, parametrización, reportes y gestión de usuarios.'),
    ('JefePrograma', 'Jefe de Programa: visualiza reportes de su programa y transversales. '
                     'No modifica información ni accede a parametrización.'),
]


def crear_roles(apps, schema_editor):
    Rol = apps.get_model('authentication', 'Rol')
    for nombre, descripcion in ROLES:
        Rol.objects.get_or_create(nombre_rol=nombre, defaults={'descripcion': descripcion})


def eliminar_roles(apps, schema_editor):
    Rol = apps.get_model('authentication', 'Rol')
    Rol.objects.filter(nombre_rol__in=[r[0] for r in ROLES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(crear_roles, eliminar_roles),
    ]
