# param_manager/serializers.py
from rest_framework import serializers

from .models import ComponenteDato, Indicador, Meta, MetaValor, Programa


class ProgramaSerializer(serializers.ModelSerializer):
    # Default explícito: en formularios multipart un booleano ausente llega como False
    activo = serializers.BooleanField(default=True)

    class Meta:
        model = Programa
        fields = ['id', 'nombre', 'descripcion', 'activo']


class ComponenteDatoSerializer(serializers.ModelSerializer):
    activo = serializers.BooleanField(default=True)

    class Meta:
        model = ComponenteDato
        fields = [
            'id', 'indicador', 'tipo', 'descripcion', 'origen',
            'rem_hoja', 'rem_celda', 'valor_fijo', 'activo',
        ]

    def validate(self, attrs):
        origen = attrs.get('origen', getattr(self.instance, 'origen', 'REM'))
        if origen == 'REM':
            if not attrs.get('rem_hoja', getattr(self.instance, 'rem_hoja', '')):
                raise serializers.ValidationError(
                    {'rem_hoja': 'Debe indicar la hoja del REM (ej: A02).'}
                )
            if not attrs.get('rem_celda', getattr(self.instance, 'rem_celda', '')):
                raise serializers.ValidationError(
                    {'rem_celda': 'Debe indicar la celda del REM (ej: D14).'}
                )
        return attrs


class MetaValorSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetaValor
        fields = ['id', 'indicador', 'anio', 'valor', 'comentario']


class IndicadorSerializer(serializers.ModelSerializer):
    componentes = ComponenteDatoSerializer(many=True, read_only=True)
    valores = MetaValorSerializer(many=True, read_only=True)
    vigente = serializers.BooleanField(default=True)

    class Meta:
        model = Indicador
        fields = [
            'id', 'meta', 'codigo', 'nombre', 'descripcion',
            'forma_calculo', 'formula_display', 'ponderacion',
            'vigente', 'componentes', 'valores',
        ]


class IndicadorResumenSerializer(serializers.ModelSerializer):
    """Versión liviana para listas anidadas."""
    class Meta:
        model = Indicador
        fields = [
            'id', 'codigo', 'nombre', 'forma_calculo',
            'formula_display', 'ponderacion', 'vigente',
        ]


class MetaSerializer(serializers.ModelSerializer):
    programa_nombre = serializers.CharField(source='programa.nombre', read_only=True)
    indicadores = IndicadorResumenSerializer(many=True, read_only=True)
    vigente = serializers.BooleanField(default=True)

    class Meta:
        model = Meta
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'seccion',
            'programa', 'programa_nombre', 'vigente', 'indicadores',
            'creado_en', 'actualizado_en',
        ]
