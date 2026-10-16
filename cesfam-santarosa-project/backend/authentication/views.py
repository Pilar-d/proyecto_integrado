# backend/authentication/views.py
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

class CustomTokenSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        rut = attrs.get('username')
        password = attrs.get('password')

        if not rut or not password:
            raise serializers.ValidationError('Debe proporcionar el RUT y la contraseña.')

        # Autenticamos contra el modelo utilizando el campo rut
        user = authenticate(username=rut, password=password)

        if user is None:
            raise serializers.ValidationError('Credenciales inválidas. Verifique su RUT y contraseña.')

        if not user.is_active:
            raise serializers.ValidationError('Esta cuenta se encuentra desactivada.')

        # Generamos los tokens JWT de forma manual y segura
        refresh = RefreshToken.for_user(user)

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

class CustomTokenObtainPairView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request, *args, **kwargs):
        serializer = CustomTokenSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)