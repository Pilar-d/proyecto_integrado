from django.db import models
from django.contrib.auth.models import AbstractUser
# Create your models here.

class Rol(models.Model):
    nombre_rol = models.CharField(max_length=100)
    descripcion = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = "rol"
        verbose_name = "Rol"
        verbose_name_plural = "Roles"

    def __str__(self):
        return self.nombre_rol

class Usuario(AbstractUser):
    rut = models.CharField(max_length=12, unique=True)
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    email = models.EmailField(max_length=100, unique=True, db_column="correo")
    estado = models.BooleanField(default=True)
    rol = models.ForeignKey(
        Rol,
        on_delete=models.PROTECT,
        db_column="id_rol",
        related_name="usuarios",
        null=True,
        blank=True
        )
    
    #campos nativos de django en None evitar colisiones
    first_name=None
    last_name=None

    USERNAME_FIELD = "rut"
    REQUIRED_FIELDS = ["username", "email", "nombres", "apellidos"]
    
    class Meta:
        db_table = "usuario"
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return f"{self.nombres} {self.apellidos} ({self.rut})."

class Sector(models.Model):
    nombre_sector = models.CharField(max_length=100)

    class Meta:
        db_table = "sector"
        verbose_name = "Sector"
        verbose_name_plural = "Sectores"

    def __str__(self):
        return self.nombre_sector
    
class Programa(models.Model):
    nombre_programa = models.CharField(max_length=255)
    codigo_programa = models.CharField(max_length=10, unique=True)
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        db_column="id_usuario",
        null=True,
        blank=True,
        related_name="programas_liderados"
    )

    class Meta:
        db_table = "programa"
        verbose_name = "Programa de Salud"
        verbose_name_plural="Programas de Salud"

    def __str__(self):
        return f"{self.codigo_programa} - {self.nombre_programa}."

class MetaSanitaria(models.Model):
    nombre_meta = models.CharField(max_length=100)
    codigo_meta = models.CharField(max_length=20)
    year_vigencia = models.IntegerField()
    descripcion = models.CharField(max_length=255, blank=True, null=True)
    programa = models.ForeignKey(
        Programa,
        on_delete=models.CASCADE,
        db_column="id_programa",
        related_name="metas"
    )

    class Meta:
        db_table="meta_sanitaria"
        verbose_name= "Meta Sanitaria"
        verbose_name_plural = "Metas Sanitarias"

    def __str__(self):
        return f"{self.codigo_meta} - {self.nombre_meta}."

class Indicador(models.Model):
    codigo_indicador=models.CharField(max_length=20)
    nombre_indicador=models.CharField(max_length=100)
    meta_esperada=models.DecimalField(max_digits=5, decimal_places=2)
    umbral_verde=models.DecimalField(max_digits=5, decimal_places=2)
    umbral_amarillo=models.DecimalField(max_digits=5, decimal_places=2)
    unidad_medida=models.CharField(max_length=20)
    meta=models.ForeignKey(
        MetaSanitaria,
        on_delete=models.CASCADE,
        db_column="id_meta",
        related_name="indicadores"
    )

    class Meta:
        db_table="indicador"
        verbose_name="Indicador"
        verbose_name_plural="Indicadores"

    def __str__(self):
        return f"{self.codigo_indicador} - {self.nombre_indicador}."

class PlantillaRemMapeo(models.Model):
    tipo_componente= models.CharField(max_length=15)
    serie_rem=models.CharField(max_length=20)
    nombre_hoja=models.CharField(max_length=50)
    coordenada_celda= models.CharField(max_length=10)
    vigente_desde=models.DateField()
    vigente_hasta= models.DateField(null=True, blank=True)

    #campo JSONB para metdatos cambiantes sin romper la BD
    metadata_adicional = models.JSONField(default=dict, blank=True, null=True)
    indicador=models.ForeignKey(
        Indicador,
        on_delete=models.CASCADE,
        db_column="id_indicador",
        related_name="mapeos"
    )

    class Meta:
        db_table="plantilla_rem_mapeo"
        verbose_name="Mapeo de Plantilla REM"
        verbose_name_plural="Mapeos de Plantillas REM"

    def __str__(self):
        return f"{self.serie_rem} | Hoja: {self.nombre_hoja} | Celda: {self.coordenada_celda} {self.tipo_componente}."

class ArchivosRem(models.Model):
    nombre_archivo=models.CharField(max_length=255)
    periodo_mes=models.IntegerField() #1-12
    periodo_year=models.IntegerField()
    fecha_carga=models.DateField(auto_now_add=True)
    ruta_archivo=models.CharField(max_length=255)
    usuario=models.ForeignKey(
        Usuario,
        on_delete=models.PROTECT,
        db_column="id_usuario",
        related_name="archivos_cargados"
    )

    class Meta:
        db_table="archivos_rem"
        verbose_name="Archivo REM"
        verbose_name_plural="Archivos REM"

    def __str__(self):
        return f"{self.nombre_archivo} ({self.periodo_mes}/{self.periodo_year})"

class ValoresExtraidos(models.Model):
    valor_obtenido=models.DecimalField(max_digits=12, decimal_places=2)
    archivo=models.ForeignKey(
        ArchivosRem,
        on_delete=models.CASCADE,
        db_column="id_archivo",
        related_name="valores_extraidos"
    )
    mapeo=models.ForeignKey(
        PlantillaRemMapeo,
        on_delete=models.CASCADE,
        db_column="id_mapeo",
        related_name="valores_extraidos"
    )
    sector=models.ForeignKey(
        Sector,
        on_delete=models.PROTECT,
        db_column="id_sector",
        related_name="valores_extraidos"
    )

    class Meta:
        db_table="valores_extraidos"
        verbose_name="Valor Extraído"
        verbose_name_plural="Valores Extraídos"

    def __str__(self):
        return f"Valor extraido: {self.valor_obtenido} (Mapeo id: {self.id_mapeo_id})"

class CumplimientoMensual(models.Model):
    periodo_mes = models.IntegerField()
    periodo_year = models.IntegerField()
    numerador = models.DecimalField(max_digits=12, decimal_places=2)
    denominador = models.DecimalField(max_digits=12, decimal_places=2)
    porcentaje_calculado = models.DecimalField(max_digits=5, decimal_places=2)
    estado_umbral = models.CharField(max_length=20)

    indicador=models.ForeignKey(
        Indicador,
        on_delete=models.CASCADE,
        db_column="id_indicador",
        related_name="cumplimientos"
    )

    sector = models.ForeignKey(
        Sector,
        on_delete=models.PROTECT,
        db_column="id_sector",
        related_name="cumplimientos"
    )

    class Meta:
        db_table = "cumplimiento_mensual"
        verbose_name="cumplimiento Mensual"
        verbose_name_plural="Cumplimientos Mensuales"

    def __str__(self):
        return f"Indicador: {self.id_indicador_id} | {self.periodo_mes}/{self.periodo_year} -> {self.porcentaje_calculado}% {self.estado_umbral}" 

class Registros(models.Model):
    accion=models.CharField(max_length=100)
    rol_usuario = models.CharField(max_length=100)
    tabla_afectada = models.CharField(max_length=50)

    #campos JSONB para auditoría
    valor_anterior=models.JSONField(blank=True, null=True)
    valor_nuevo=models.JSONField(blank=True, null=True)

    fecha_hora= models.DateTimeField(auto_now_add=True)
    ip_origen = models.CharField(max_length=45)

    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.PROTECT,
        db_column="id_usuario",
        related_name="registros_auditoria"
    )

    class Meta:
        db_table="registros"
        verbose_name="Registro de Auditoría"
        verbose_name_plural="Registros de Auditoría"

    def __str__(self):
        return f"[{self.fecha_hora}] {self.accion} en {self.tabla_afectada} por {self.rol_usuario}"