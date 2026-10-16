# authentication/permissions.py
"""Permisos basados en el rol institucional del CESFAM Santa Rosa.

Roles oficiales (según Requerimientos 2026):
- Directora: solo consulta de reportes y dashboards.
- Subdireccion: consulta + carga REM + parametrización.
- Gestor: administración completa del sistema.
- JefePrograma: solo reportes de su programa y transversales.
"""
from rest_framework.permissions import BasePermission

ROL_GESTOR = 'Gestor'
ROL_SUBDIRECCION = 'Subdireccion'
ROL_DIRECTORA = 'Directora'
ROL_JEFE_PROGRAMA = 'JefePrograma'


def nombre_rol(user):
    """Devuelve el nombre del rol del usuario (o None si no tiene rol asignado)."""
    rol = getattr(user, 'rol', None)
    return rol.nombre_rol if rol else None


class EsGestor(BasePermission):
    """Acceso exclusivo del Gestor de Información (administrador del sistema)."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and
                    (user.is_superuser or nombre_rol(user) == ROL_GESTOR))


class EsGestorOSubdireccion(BasePermission):
    """Permite cargar REM y modificar datos: Gestor y Subdirección."""

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser or nombre_rol(user) in (ROL_GESTOR, ROL_SUBDIRECCION):
            return True
        return False


class EsRolConsulta(BasePermission):
    """Permite consultar reportes: todos los roles institucionales."""

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return bool(
            user.is_superuser
            or nombre_rol(user) in (
                ROL_GESTOR,
                ROL_SUBDIRECCION,
                ROL_DIRECTORA,
                ROL_JEFE_PROGRAMA,
            )
        )
