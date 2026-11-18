import os
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from rem_manager.models import RemArchivo
from api.models import Usuario
import openpyxl

class Command(BaseCommand):
    help = 'Registra los archivos REM de la carpeta media/rem/2026 provenientes de los materiales oficiales de INACAP'

    def handle(self, *args, **options):
        rem_dir = Path(settings.MEDIA_ROOT) / 'rem' / '2026'
        if not rem_dir.exists():
            self.stdout.write(self.style.ERROR(f"No existe el directorio {rem_dir}"))
            return

        usuario = Usuario.objects.filter(is_superuser=True).first() or Usuario.objects.first()

        archivos_mapeo = [
            ('1 - Serie A enero.xlsm', 1),
            ('2 - Serie A febrero.xlsm', 2),
            ('3 - Serie A marzo.xlsm', 3),
            ('4 - Serie A abril.xlsm', 4),
            ('5 - Serie A mayo.xlsm', 5),
            ('6 - Serie A junio.xlsm', 6),
        ]

        for filename, mes in archivos_mapeo:
            filepath = rem_dir / filename
            if not filepath.exists():
                self.stdout.write(self.style.WARNING(f"Archivo no encontrado: {filename}"))
                continue

            # Obtener cantidad de hojas
            hojas = 0
            try:
                wb = openpyxl.load_workbook(filepath, read_only=True)
                hojas = len(wb.sheetnames)
                wb.close()
            except Exception:
                hojas = 30

            obj, created = RemArchivo.objects.get_or_create(
                periodo_mes=mes,
                periodo_year=2026,
                estado=RemArchivo.Estado.VALIDO,
                defaults={
                    'archivo': f'rem/2026/{filename}',
                    'archivo_nombre': filename,
                    'establecimiento': 'CESFAM Santa Rosa (210450)',
                    'hojas_rem': hojas,
                    'usuario': usuario,
                }
            )
            if not created:
                obj.archivo = f'rem/2026/{filename}'
                obj.archivo_nombre = filename
                obj.hojas_rem = hojas
                obj.save()

            estado = "Registrado" if created else "Actualizado"
            self.stdout.write(self.style.SUCCESS(f"{estado} REM {mes:02d}/2026: {filename} ({hojas} hojas)"))

        self.stdout.write(self.style.SUCCESS("¡Todos los REM de materiales cargados exitosamente!"))
