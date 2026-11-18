from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import(
    Rol,
    Usuario,
    Sector,
    Programa,
    MetaSanitaria,
    Indicador,
    PlantillaRemMapeo,
    ArchivosRem,
    ValoresExtraidos,
    CumplimientoMensual,
    Registros
)

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = "__all__"

class UsuarioSerializer(serializers.ModelSerializer):
    rol_detalle = RolSerializer(source="rol", read_only=True)

    class Meta:
        model = Usuario
        fields = [
            "id",
            "rut",
            "nombres",
            "apellidos",
            "email",
            "estado",
            "rol",
            "rol_detalle",
            "password",
            ]
        extra_kwargs = {
            "password": {"write_only": True, "required": False} # Evita exponer la clave y permite actualizar sin reingresarla
        }

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        validated_data["username"] = validated_data["rut"]
        return Usuario.objects.create_user(password=password, **validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        if "rut" in validated_data:
            instance.username = validated_data["rut"]
        instance.save()
        return instance

class SectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sector
        fields = "__all__"

class ProgramaSerializer(serializers.ModelSerializer):
    jefe_programa = UsuarioSerializer(source="usuario", read_only=True)

    class Meta:
        model = Programa
        fields = [
            "id",
            "nombre_programa",
            "codigo_programa",
            "usuario",
            "jefe_programa"
        ]

class MetaSanitariaSerializer(serializers.ModelSerializer):
    class Meta:
        model=MetaSanitaria
        fields="__all__"

class IndicadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Indicador
        fields = "__all__"

class PlantillaRemMapeoSerializer(serializers.ModelSerializer):
    class Meta:
        model= PlantillaRemMapeo
        fields= "__all__"

class ArchivosRemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArchivosRem
        fields = "__all__"

class ValoresExtraidosSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValoresExtraidos
        fields = "__all__"

class CumplimientoMensualSerializer(serializers.ModelSerializer):
    indicador_detalle = IndicadorSerializer(source="indicador", read_only=True)
    sector_detalle = SectorSerializer(source = "sector", read_only=True)

    class Meta:
        model = CumplimientoMensual
        fields = [
            "id",
            "periodo_mes",
            "periodo_year",
            "numerador",
            "denominador",
            "porcentaje_calculado",
            "estado_umbral",
            "indicador",
            "indicador_detalle",
            "sector",
            "sector_detalle"
        ]

class RegistrosSerializer(serializers.ModelSerializer):
    usuario_detalle = UsuarioSerializer(source="usuario", read_only=True)

    class Meta:
        model = Registros
        fields = [
            "id",
            "accion",
            "rol_usuario",
            "tabla_afectada",
            "valor_anterior",
            "valor_nuevo",
            "fecha_hora",
            "ip_origen",
            "usuario",
            "usuario_detalle"
        ]

#Autenticación JWT para el login del usuario

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "rut" #se utiliza el rut para la autenticación

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        #datos personalizados para el payload de jwt (útil para el frontend)
        token["rut"] = user.rut
        token["nombres"] = user.nombres
        token["apellidos"] = user.apellidos
        token["rol"] = user.rol.nombre_rol if user.rol else None

        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["usuario"] = {
            "id": self.user.id,
            "rut": self.user.rut,
            "nombres": self.user.nombres,
            "apellidos": self.user.apellidos,
            "email": self.user.email,
            "rol": self.user.rol.nombre_rol if self.user.rol else "Gestor",
        }
        return data
