from django.core.management.base import BaseCommand
from api.models import Rol, Usuario, Sector, Programa

class Command(BaseCommand):
    help = 'Siembra roles institucionales, sectores, programas y usuarios de desarrollo'

    def handle(self, *args, **kwargs):
        self.stdout.write("Sembrando datos iniciales para CESFAM Santa Rosa...")

        # 1. Roles institucionales
        roles_data = [
            ('Directora', 'Consulta global de reportes y dashboards para toma de decisiones.'),
            ('Subdireccion', 'Subdirección Clínica y Administrativa: reportes, carga REM y parametrización.'),
            ('Gestor', 'Gestor de Información: administración completa, usuarios, REM y auditoría.'),
            ('JefePrograma', 'Jefe de Programa: visualiza reportes de su programa y transversales.'),
        ]

        roles_dict = {}
        for nombre, desc in roles_data:
            rol, created = Rol.objects.get_or_create(
                nombre_rol=nombre,
                defaults={'descripcion': desc}
            )
            roles_dict[nombre] = rol
            estado = "Creado" if created else "Ya existía"
            self.stdout.write(f"  - Rol '{nombre}': {estado}")

        # 2. Sectores
        sectores_nombres = ['Sector Norte (Azul)', 'Sector Sur (Verde)', 'Sector Oriente (Rojo)', 'Transversal']
        for s_nombre in sectores_nombres:
            Sector.objects.get_or_create(nombre_sector=s_nombre)

        # 3. Usuarios de prueba oficiales (password por defecto: cesfam2026)
        usuarios_data = [
            {
                'rut': '11111111-1',
                'username': '11111111-1',
                'nombres': 'Carmen',
                'apellidos': 'Valdés',
                'email': 'carmen.valdes@salud.cl',
                'rol': roles_dict['Directora'],
                'is_staff': True,
                'is_superuser': False,
            },
            {
                'rut': '22222222-2',
                'username': '22222222-2',
                'nombres': 'Roberto',
                'apellidos': 'Soto',
                'email': 'roberto.soto@salud.cl',
                'rol': roles_dict['Subdireccion'],
                'is_staff': True,
                'is_superuser': False,
            },
            {
                'rut': '33333333-3',
                'username': '33333333-3',
                'nombres': 'María',
                'apellidos': 'Pérez',
                'email': 'maria.perez@salud.cl',
                'rol': roles_dict['Gestor'],
                'is_staff': True,
                'is_superuser': True,  # Administrador total
            },
            {
                'rut': '44444444-4',
                'username': '44444444-4',
                'nombres': 'Marcela',
                'apellidos': 'Riquelme',
                'email': 'marcela.riquelme@salud.cl',
                'rol': roles_dict['JefePrograma'],
                'is_staff': False,
                'is_superuser': False,
            },
        ]

        password_comun = 'cesfam2026'

        for u_data in usuarios_data:
            rut = u_data['rut']
            user, created = Usuario.objects.get_or_create(
                rut=rut,
                defaults={
                    'username': u_data['username'],
                    'nombres': u_data['nombres'],
                    'apellidos': u_data['apellidos'],
                    'email': u_data['email'],
                    'rol': u_data['rol'],
                    'is_staff': u_data['is_staff'],
                    'is_superuser': u_data['is_superuser'],
                    'estado': True
                }
            )
            # Asegurar contraseña cifrada
            user.set_password(password_comun)
            user.save()
            estado = "Creado" if created else "Actualizado"
            self.stdout.write(f"  - Usuario RUT {rut} ({u_data['rol'].nombre_rol}): {estado} (clave: {password_comun})")

        self.stdout.write(self.style.SUCCESS("¡Siembra de datos completada exitosamente!"))
