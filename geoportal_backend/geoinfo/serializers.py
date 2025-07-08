from rest_framework_gis.serializers import GeoFeatureModelSerializer
from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType # Para el GenericRelatedField

from .models import Punto, Poligono, DocumentoAdjunto, PerfilUsuario

# Serializer para el modelo User de Django (para mostrar info del creador, etc.)
class UserSerializer(serializers.ModelSerializer):
    # Podríamos añadir el nombre completo o campos del perfil si quisiéramos
    # perfil = PerfilUsuarioSerializer(source='perfil_geoportal', read_only=True) # Ejemplo si se quiere anidar
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        # No queremos exponer todos los campos, solo los necesarios y seguros


# Serializer para PerfilUsuario
class PerfilUsuarioSerializer(serializers.ModelSerializer):
    usuario = UserSerializer(read_only=True) # Mostrar detalles del usuario anidado
    # Si quisiéramos permitir la asignación de usuario al crear/actualizar perfil (poco común por OneToOne)
    # usuario_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='usuario', write_only=True)
    rol_display = serializers.CharField(source='get_rol_display', read_only=True)

    class Meta:
        model = PerfilUsuario
        fields = ('id', 'usuario', 'rol', 'rol_display')
        # El campo 'usuario' es manejado por el OneToOneField y el signal.
        # El 'rol' es el campo principal a gestionar aquí.


# Serializer base para Elementos Geográficos (Punto y Poligono)
# Usaremos GeoFeatureModelSerializer para que maneje correctamente los campos geométricos (GeoJSON)
class ElementoGeograficoBaseSerializer(GeoFeatureModelSerializer):
    # creador = UserSerializer(read_only=True) # Muestra el objeto User completo (solo lectura)
    # Para la escritura, es mejor usar un campo que acepte el ID del usuario.
    creador_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='creador', # Mapea este campo al atributo 'creador' del modelo
        write_only=True, # Solo para creación/actualización, no se muestra en la respuesta
        allow_null=True, # Permitir nulo si el modelo lo permite
        required=False   # No es obligatorio al deserializar, se puede setear en la vista
    )
    # Para mostrar el username del creador en la respuesta de forma sencilla:
    creador_username = serializers.CharField(source='creador.username', read_only=True, allow_null=True)
    geometria = serializers.JSONField(required=False) # Definido aquí para poder modificarlo en __init__

    # Incluir documentos adjuntos relacionados (solo lectura, anidado)
    # documentos = DocumentoAdjuntoSerializer(many=True, read_only=True, source='documentos_adjuntos')
    # Nota: 'documentos_adjuntos' sería el related_name desde Punto/Poligono a DocumentoAdjunto.
    # Como DocumentoAdjunto usa GenericForeignKey, la relación inversa es un poco más compleja.
    # Se puede añadir un campo personalizado en el serializador si es necesario,
    # o manejar la subida/listado de documentos en un endpoint separado.
    # Por ahora, no lo incluiremos directamente aquí para mantenerlo simple.

    class Meta:
        # No se define 'model' aquí porque es una clase base.
        # Los campos comunes se listan, y 'geo_field' se define en los hijos.
        fields = ('id', 'nombre', 'descripcion', 'creador_id', 'creador_username', 'fecha_creacion', 'fecha_modificacion')
        read_only_fields = ('fecha_creacion', 'fecha_modificacion', 'creador_username')

    def create(self, validated_data):
        # Si 'creador_id' no se proporciona en la solicitud,
        # se puede asignar automáticamente el usuario de la solicitud en la vista.
        # Ejemplo: if self.context['request'].user.is_authenticated:
        #             validated_data['creador'] = self.context['request'].user
        # Esto es mejor manejarlo en el perform_create de la vista.
        return super().create(validated_data)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            try:
                perfil = request.user.perfil_geoportal
                # Si el usuario es un EDITOR y la instancia ya existe (es una actualización)
                if perfil.rol == PerfilUsuario.ROL_EDITOR and self.instance:
                    # Hacer el campo 'geometria' y 'creador_id' de solo lectura para editores
                    # El campo 'geometria' se define en los serializers hijos (PuntoSerializer, PoligonoSerializer)
                    # pero podemos intentar accederlo. DRF-GIS usa 'geometria' como nombre por defecto para el geo_field.
                    if 'geometria' in self.fields:
                         self.fields['geometria'].read_only = True
                    if 'creador_id' in self.fields: # Aunque ya es write_only, lo reforzamos.
                        self.fields['creador_id'].read_only = True
                    # Permitir que nombre y descripción sigan siendo editables.
            except PerfilUsuario.DoesNotExist:
                # El usuario no tiene perfil, tratar como usuario normal (no editor)
                pass
            except AttributeError:
                # request.user no tiene 'perfil_geoportal', podría ser AnonymousUser o un User sin perfil aún
                pass


class PuntoSerializer(ElementoGeograficoBaseSerializer):
    class Meta(ElementoGeograficoBaseSerializer.Meta):
        model = Punto
        geo_field = "geometria" # Nombre del campo GeoJSON en el modelo Punto
        # Los campos se heredan de ElementoGeograficoBaseSerializer.Meta.fields
        # y 'geometria' se añade automáticamente por GeoFeatureModelSerializer.
        # No es necesario añadirlo explícitamente a la tupla 'fields' si se usa geo_field.
        # Pero para asegurar que 'geometria' esté en self.fields para la lógica de __init__ en la base,
        # es mejor que esté listado o que la lógica de __init__ sea más robusta.
        # GeoFeatureModelSerializer añade el campo con el nombre de geo_field.
        # El 'geometria = serializers.JSONField' en la clase base es un placeholder.
        # El verdadero campo de geometría lo maneja GeoFeatureModelSerializer.

        # Para que la lógica en __init__ funcione bien con el campo de geometría real:
        # Necesitamos asegurar que el campo exista. GeoFeatureModelSerializer lo crea.
        # La definición explícita de 'geometria' en ElementoGeograficoBaseSerializer
        # es más para que el __init__ pueda encontrarlo. El tipo real del campo
        # será manejado por GeoFeatureModelSerializer basado en 'geo_field'.

        # Si no listamos 'geometria' en fields, el __init__ de la base no lo encontrará.
        # Si lo listamos, aseguramos que exista en self.fields.
        fields = ElementoGeograficoBaseSerializer.Meta.fields + ('geometria',)


class PoligonoSerializer(ElementoGeograficoBaseSerializer):
    class Meta(ElementoGeograficoBaseSerializer.Meta):
        model = Poligono
        geo_field = "geometria"
        fields = ElementoGeograficoBaseSerializer.Meta.fields + ('geometria',)


# Serializer para DocumentoAdjunto
# Para manejar la GenericForeignKey 'elemento_geografico'
class GenericRelatedField(serializers.Field):
    """
    Un campo personalizado para manejar GenericForeignKey.
    En la lectura, serializa el objeto relacionado usando su __str__ o un serializador específico.
    En la escritura, espera un diccionario como {'type': 'punto', 'id': 1}.
    """
    def to_representation(self, value):
        # value es la instancia del modelo relacionado (Punto o Poligono)
        if isinstance(value, Punto):
            return f"Punto: {value.nombre} (ID: {value.id})"
        elif isinstance(value, Poligono):
            return f"Polígono: {value.nombre} (ID: {value.id})"
        return str(value)

    def to_internal_value(self, data):
        # data es lo que viene del request, ej: {'type': 'punto', 'id': 1}
        # O podría ser simplemente el ID si el tipo se infiere o se pasa por separado.
        # Para este serializer, asumiremos que el content_type y object_id se manejan por separado.
        # Este campo solo representará el objeto.
        # Por simplicidad, haremos este campo de solo lectura en el DocumentoAdjuntoSerializer.
        # La creación/asociación se manejará con campos 'content_type_id' y 'object_id'.
        raise NotImplementedError("Este campo es de solo lectura para la representación.")


class DocumentoAdjuntoSerializer(serializers.ModelSerializer):
    # Para la representación del elemento geográfico al que está adjunto
    # elemento_geografico = GenericRelatedField(read_only=True) # Muestra una representación string

    # Para la escritura, necesitamos campos que DRF pueda mapear a content_type y object_id.
    # DRF no maneja GenericForeignKey automáticamente para escritura.
    # Una forma es exponer content_type (como ID) y object_id directamente.
    content_type_id = serializers.PrimaryKeyRelatedField(
        queryset=ContentType.objects.filter(
            models.Q(app_label='geoinfo', model='punto') | \
            models.Q(app_label='geoinfo', model='poligono')
        ),
        source='content_type', # Mapea al campo 'content_type' del modelo
        write_only=True
    )
    object_id = serializers.IntegerField(write_only=True) # ID del Punto o Poligono

    # Para la lectura, podemos mostrar información más útil del elemento vinculado:
    elemento_info = serializers.SerializerMethodField(read_only=True)

    # Para el archivo, DRF maneja FileField para subidas.
    # El nombre del archivo se puede obtener en la respuesta si es necesario.
    archivo_url = serializers.FileField(source='archivo', read_only=True, use_url=True)


    class Meta:
        model = DocumentoAdjunto
        fields = (
            'id',
            'content_type_id', # Para escribir la relación
            'object_id',       # Para escribir la relación
            'elemento_info',   # Para leer la relación de forma amigable
            'nombre_documento',
            'archivo',         # Para subir el archivo (write_only si solo se muestra la URL)
            'archivo_url',     # Para mostrar la URL del archivo (read_only)
            'enlace_externo',
            'fecha_subida'
        )
        read_only_fields = ('fecha_subida', 'archivo_url', 'elemento_info')
        # Hacer 'archivo' write_only para que en la respuesta solo se use 'archivo_url'
        extra_kwargs = {
            'archivo': {'write_only': True, 'required': False} # 'required': False si enlace_externo es alternativa
        }

    def get_elemento_info(self, obj):
        if obj.elemento_geografico:
            # obj.elemento_geografico es la instancia de Punto o Poligono
            # obj.content_type es el ContentType (Punto o Poligono)
            return {
                "tipo": obj.content_type.model,
                "id": obj.object_id,
                "nombre": getattr(obj.elemento_geografico, 'nombre', str(obj.elemento_geografico))
            }
        return None

    def validate(self, data):
        # Validar que se proporciona archivo o enlace, pero no ambos (o uno es obligatorio)
        archivo = data.get('archivo')
        enlace_externo = data.get('enlace_externo')

        if not archivo and not enlace_externo:
            raise serializers.ValidationError("Debe proporcionar un archivo para subir o un enlace externo.")
        if archivo and enlace_externo:
            raise serializers.ValidationError("Proporcione un archivo o un enlace externo, no ambos.")

        # Validar que el object_id corresponde a un objeto del tipo content_type_id
        content_type = data.get('content_type') # Viene de source='content_type' en content_type_id
        object_id = data.get('object_id')
        if content_type and object_id:
            ModelClass = content_type.model_class() # Obtiene la clase del modelo (Punto o Poligono)
            if not ModelClass.objects.filter(pk=object_id).exists():
                raise serializers.ValidationError(
                    f"No se encontró un objeto de tipo '{content_type.model}' con ID '{object_id}'."
                )
        return data

# Serializadores listos para ser usados en las Vistas (ViewSets).
# Siguientes pasos:
# 1. Crear los ViewSets en geoinfo/views.py.
# 2. Configurar las URLs en geoinfo/urls.py y geoportal_backend/urls.py.
# 3. Implementar la lógica de permisos en los ViewSets.
# 4. Asignar automáticamente el 'creador' en las vistas de creación de Puntos/Poligonos.
# 5. Manejar la subida de archivos para DocumentoAdjunto.
serializers.py
