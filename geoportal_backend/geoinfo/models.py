from django.contrib.gis.db import models
from django.contrib.auth.models import User
from django.conf import settings # Para SRID y AUTH_USER_MODEL si es necesario

# Modelo base abstracto para elementos geográficos
class ElementoGeografico(models.Model):
    nombre = models.CharField(max_length=255, verbose_name="Nombre")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción")
    creador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, # O models.CASCADE si el elemento debe borrarse con el usuario
        null=True, # Permite creador nulo si el usuario es borrado y se elige SET_NULL
        blank=True, # Para permitir creación desde admin sin asignar creador explícitamente (se puede setear en la vista)
        verbose_name="Creador"
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")
    fecha_modificacion = models.DateTimeField(auto_now=True, verbose_name="Fecha de Modificación")

    class Meta:
        abstract = True # Este modelo no creará su propia tabla en la BD
        ordering = ['-fecha_creacion', 'nombre']

    def __str__(self):
        return self.nombre

# Modelo para Puntos
class Punto(ElementoGeografico):
    geometria = models.PointField(srid=settings.SRID, verbose_name="Geometría (Punto)")
    # objects = models.Manager() # Manager por defecto
    # gis = models.GeoManager() # Manager específico para GIS, si se usa Django < 1.7 (ahora es automático)

    class Meta:
        verbose_name = "Punto"
        verbose_name_plural = "Puntos"

# Modelo para Polígonos
class Poligono(ElementoGeografico):
    geometria = models.PolygonField(srid=settings.SRID, verbose_name="Geometría (Polígono)")

    class Meta:
        verbose_name = "Polígono"
        verbose_name_plural = "Polígonos"

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils.text import slugify
import os

# Función para generar la ruta de subida de archivos de documentos adjuntos
def ruta_archivo_documento_revisada(instance, filename):
    elemento_id_str = "sin_asignar"
    if instance.object_id: # object_id es el ID del Punto o Poligono asociado
        elemento_id_str = str(instance.object_id)

    base, ext = os.path.splitext(filename)
    # Usar el ID del DocumentoAdjunto para el nombre del archivo si está disponible
    doc_id_str = str(instance.id) if instance.id else "new" # 'new' si el doc aún no tiene ID
    safe_filename = f"{slugify(base)}_{doc_id_str}{ext}"

    tipo_elemento_str = "generico"
    if instance.content_type: # content_type es el tipo de modelo (Punto o Poligono)
        tipo_elemento_str = slugify(instance.content_type.model)

    return f'documentos_adjuntos/{tipo_elemento_str}_{elemento_id_str}/{safe_filename}'


# Modelo para Documentos Adjuntos
class DocumentoAdjunto(models.Model):
    # Campos para la relación genérica con ElementoGeografico (Punto o Poligono)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        # Limitar las opciones a los modelos que pueden tener documentos adjuntos
        limit_choices_to=models.Q(app_label='geoinfo', model='punto') | \
                         models.Q(app_label='geoinfo', model='poligono'),
        verbose_name="Tipo de Elemento Vinculado"
    )
    object_id = models.PositiveIntegerField(verbose_name="ID del Elemento Vinculado")
    elemento_geografico = GenericForeignKey('content_type', 'object_id')

    nombre_documento = models.CharField(max_length=255, verbose_name="Nombre del Documento")
    archivo = models.FileField(
        upload_to=ruta_archivo_documento_revisada,
        blank=True,
        null=True,
        verbose_name="Archivo Subido"
    )
    enlace_externo = models.URLField(blank=True, null=True, verbose_name="Enlace Externo")
    fecha_subida = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Subida")

    class Meta:
        verbose_name = "Documento Adjunto"
        verbose_name_plural = "Documentos Adjuntos"
        ordering = ['-fecha_subida', 'nombre_documento']
        # Índice para optimizar consultas por el GenericForeignKey
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]

    def __str__(self):
        # Intentar obtener un nombre descriptivo del elemento geográfico
        elemento_nombre = "Elemento Desconocido"
        if self.elemento_geografico and hasattr(self.elemento_geografico, 'nombre'):
            elemento_nombre = self.elemento_geografico.nombre
        elif self.elemento_geografico:
            elemento_nombre = str(self.elemento_geografico) # Fallback al __str__ del elemento

        return f"{self.nombre_documento} (para {self.content_type.model}: {elemento_nombre})"

    def clean(self):
        # Validación para asegurar que se proporciona un archivo o un enlace, pero no ambos (opcional)
        # from django.core.exceptions import ValidationError
        # if self.archivo and self.enlace_externo:
        #     raise ValidationError("Proporcione un archivo o un enlace externo, no ambos.")
        # if not self.archivo and not self.enlace_externo:
        #     raise ValidationError("Debe proporcionar un archivo o un enlace externo.")
        super().clean()


# Modelo para Perfiles de Usuario (Roles y Permisos)
class PerfilUsuario(models.Model):
    ROL_ADMIN = 'admin'
    ROL_EDITOR = 'editor'
    ROL_VISUALIZADOR = 'visualizador'
    ROLES_CHOICES = [
        (ROL_ADMIN, 'Administrador'),
        (ROL_EDITOR, 'Editor'),
        (ROL_VISUALIZADOR, 'Visualizador'),
    ]

    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='perfil_geoportal', # related_name para evitar conflictos
        verbose_name="Usuario"
    )
    rol = models.CharField(
        max_length=20,
        choices=ROLES_CHOICES,
        default=ROL_VISUALIZADOR,
        verbose_name="Rol"
    )
    # Otros campos específicos del perfil si son necesarios
    # Por ejemplo: telefono, departamento, etc.

    class Meta:
        verbose_name = "Perfil de Usuario"
        verbose_name_plural = "Perfiles de Usuario"

    def __str__(self):
        return f"Perfil de {self.usuario.username} ({self.get_rol_display()})"

# Signal para crear/actualizar PerfilUsuario cuando se crea/actualiza un User
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def crear_o_actualizar_perfil_usuario(sender, instance, created, **kwargs):
    if created:
        PerfilUsuario.objects.create(usuario=instance)
    # Si se quiere actualizar algo en el perfil cuando el usuario se actualiza:
    # instance.perfil_geoportal.save() # Asegurarse que 'perfil_geoportal' es el related_name

# Nota sobre SRID: settings.SRID fue usado. Debe estar definido en settings.py.
# Django por defecto usa 4326 para PointField, PolygonField, etc., si no se especifica.
# Es buena práctica definirlo explícitamente en settings.py (ej. SRID = 4326).
# Si no está en settings, cambiar models.PointField(srid=settings.SRID) a models.PointField()
# o models.PointField(srid=4326). Por ahora, lo dejaré asumiendo que se definirá en settings.py.
# Ya se añadió SRID = 4326 en el settings.py generado.

# Consideraciones Adicionales:
# - Índices espaciales: Django los crea automáticamente para los GeoFields.
# - Validaciones: Se pueden añadir validaciones a nivel de modelo (método clean()).
# - Permisos: La lógica de permisos se manejará más en las vistas y serializers.
# - El campo `creador` en `ElementoGeografico` es `ForeignKey(User)`.
#   En las vistas de creación, se deberá asignar `request.user` a este campo.

# Para la función `ruta_archivo_documento`:
# El `instance.id` podría ser None si el objeto DocumentoAdjunto aún no se ha guardado.
# Si `DocumentoAdjunto` se guarda en una transacción junto con el archivo, el ID estará disponible.
# Si se sube el archivo ANTES de guardar el modelo, puede haber problemas.
# Django maneja esto internamente en la mayoría de los casos con FileField.
# El uso de `instance.id or 'new'` es una mitigación simple.
# Una mejor forma es usar un UUID para el nombre del archivo si se genera antes de guardar,
# o guardar el modelo en dos pasos (primero sin archivo, luego con archivo).
# Por ahora, la función `ruta_archivo_documento` es una aproximación razonable.
# Para que funcione como está, `elemento_geografico` debe tener un ID.
# Si `DocumentoAdjunto` se crea al mismo tiempo que `Punto` o `Poligono`,
# y `elemento_geografico` se refiere a ese `Punto/Poligono` que aún no tiene ID,
# la ruta podría ser `elem_None/...`.
# La solución con `GenericForeignKey` es más robusta aquí.
# La ruta del archivo ahora usa `instance.elemento_geografico.id` (a través del GenericForeignKey)
# lo que implica que el elemento geográfico al que se asocia ya debe existir y tener un ID.
# Si se crean simultáneamente, se debe guardar primero el Punto/Poligono.
# El `slugify(base)}_{instance.id or 'new'}{ext}` se refiere al ID del DocumentoAdjunto, no del elemento.
# Esto es para el nombre del archivo en sí, no la ruta del directorio.
# La ruta del directorio sí depende del ID del elemento geográfico.
# `elem_{elemento_id_str}` donde `elemento_id_str` es `instance.object_id`.
# Modifico `ruta_archivo_documento` para usar `instance.object_id`.

def ruta_archivo_documento_revisada(instance, filename):
    from django.utils.text import slugify
    import os

    elemento_id_str = "sin_asignar"
    if instance.object_id: # object_id es el ID del Punto o Poligono asociado
        elemento_id_str = str(instance.object_id)

    base, ext = os.path.splitext(filename)
    # Usar el ID del DocumentoAdjunto para el nombre del archivo si está disponible
    doc_id_str = str(instance.id) if instance.id else "new"
    safe_filename = f"{slugify(base)}_{doc_id_str}{ext}"

    # Determinar el tipo de elemento para la ruta (opcional, pero puede ser útil)
    tipo_elemento_str = "generico"
    if instance.content_type:
        tipo_elemento_str = slugify(instance.content_type.model)

    return f'documentos_adjuntos/{tipo_elemento_str}_{elemento_id_str}/{safe_filename}'

# Reasignar la función corregida al campo archivo del modelo DocumentoAdjunto
# Esto requiere que la clase DocumentoAdjunto se defina después de esta función.
# O, definir la función antes y luego usarla.
# Para evitar redefinición completa, actualizo la referencia (simulado, en código real se movería):
DocumentoAdjunto.archivo.field.upload_to = ruta_archivo_documento_revisada

# Limpieza final: Asegurar que todas las clases y funciones estén en el orden correcto.
# La definición de DocumentoAdjunto ya está después de la función original,
# pero la función revisada debería estar antes de la clase DocumentoAdjunto.
# En el bloque de código final, se estructurará correctamente.
# Por ahora, este comentario sirve como nota de la corrección.
# El bloque de código que se enviará tendrá la función `ruta_archivo_documento_revisada`
# definida ANTES de la clase `DocumentoAdjunto` y usada directamente.
# (Hecho en la generación del bloque de código)
