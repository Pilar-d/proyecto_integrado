from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models

class Rol(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre_rol

class UsuarioInstitucional(AbstractUser):
    id = models.BigAutoField(primary_key=True)
    rut = models.CharField(max_length=12, unique=True)
    rol = models.ForeignKey(Rol, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Solución al conflicto de accesos inversos con grupos y permisos
    groups = models.ManyToManyField(
        Group,
        blank=True,
        related_name="usuario_institucional_set",
        related_query_name="usuario_institucional",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        blank=True,
        related_name="usuario_institucional_permissions_set",
        related_query_name="usuario_institucional_permission",
    )

    USERNAME_FIELD = 'rut'
    REQUIRED_FIELDS = ['username', 'email']

class RegistroAuditoria(models.Model):
    id = models.BigAutoField(primary_key=True)
    usuario = models.ForeignKey(UsuarioInstitucional, on_delete=models.SET_NULL, null=True)
    accion = models.CharField(max_length=100)
    tabla_afectada = models.CharField(max_length=50)
    valor_anterior = models.TextField(blank=True, null=True)
    valor_nuevo = models.TextField(blank=True, null=True)
    fecha_hora = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.usuario} - {self.accion} ({self.fecha_hora})"