from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework_gis.filters import InBBoxFilter # Para filtrado espacial si se necesita

from .models import Punto, Poligono, DocumentoAdjunto, PerfilUsuario, User
from .serializers import (
    PuntoSerializer, PoligonoSerializer,
    DocumentoAdjuntoSerializer, PerfilUsuarioSerializer, UserSerializer
)

# Permisos Personalizados (ejemplos, se pueden refinar o añadir más)

class IsCreatorOrAdminOrReadOnly(permissions.BasePermission):
    """
    Permiso personalizado para permitir a los creadores o administradores editar.
    Otros usuarios solo tienen permisos de lectura.
    """
    def has_object_permission(self, request, view, obj):
        # Permisos de lectura para cualquiera (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True

        # Permisos de escritura solo para el creador del objeto, administradores o editores.
        # La restricción de QUÉ PUEDE EDITAR un editor se manejará en el serializer/view.
        if not request.user or not request.user.is_authenticated:
            return False

        # El creador siempre puede editar
        if hasattr(obj, 'creador') and obj.creador == request.user:
            return True

        # Admin de Django (is_staff) o usuario con rol 'admin' en PerfilUsuario pueden editar
        if request.user.is_staff or \
           (hasattr(request.user, 'perfil_geoportal') and request.user.perfil_geoportal.rol == PerfilUsuario.ROL_ADMIN):
            return True

        # Usuario con rol 'editor' puede intentar editar (la restricción de campos se aplica después)
        if hasattr(request.user, 'perfil_geoportal') and request.user.perfil_geoportal.rol == PerfilUsuario.ROL_EDITOR:
            # Para el rol editor, podría ser necesario que también sea el creador,
            # o que los editores tengan un permiso más amplio para editar cualquier objeto.
            # Por ahora, si es editor Y creador, ya está cubierto arriba.
            # Si queremos que un editor pueda editar objetos que NO creó, esta condición es suficiente aquí.
            # Asumamos por ahora que un Editor PUEDE editar objetos que no creó, pero con campos restringidos.
            return True

        return False

class IsAdminUserOrReadOnly(permissions.BasePermission):
    """
    Permite acceso completo a administradores, solo lectura a otros.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff

class PerfilUsuarioPermissions(permissions.BasePermission):
    """
    - Admins pueden hacer todo.
    - Usuarios pueden ver/editar su propio perfil.
    - Otros solo lectura (o nada, según se defina).
    """
    def has_permission(self, request, view):
        if request.user.is_authenticated:
            return True
        return False # O permitir SAFE_METHODS si los perfiles son públicos

    def has_object_permission(self, request, view, obj):
        # obj es una instancia de PerfilUsuario
        if request.user.is_staff or (hasattr(request.user, 'perfil_geoportal') and request.user.perfil_geoportal.rol == PerfilUsuario.ROL_ADMIN):
            return True # Admins pueden todo
        if request.method in permissions.SAFE_METHODS:
            return True # Todos pueden ver (si has_permission lo permite)
        return obj.usuario == request.user # Usuario solo puede editar su propio perfil


# ViewSets para los modelos

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para listar y ver usuarios. Solo lectura.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser] # Solo admins pueden listar todos los usuarios


class PuntoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Puntos geográficos.
    """
    queryset = Punto.objects.all()
    serializer_class = PuntoSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsCreatorOrAdminOrReadOnly]
    # Filtro espacial (ejemplo, si se quiere filtrar por bounding box en los parámetros GET)
    # filter_backends = (InBBoxFilter,)
    # bbox_filter_field = 'geometria' # El campo geométrico a filtrar
    # bbox_filter_include_overlapping = True # Opcional

    def perform_create(self, serializer):
        # Asignar automáticamente el usuario actual como creador al crear un nuevo Punto.
        if self.request.user.is_authenticated:
            serializer.save(creador=self.request.user)
        else:
            # Si se permite creación anónima (IsAuthenticatedOrReadOnly lo permite para POST)
            # y el modelo permite creador nulo.
            serializer.save()

    # Se podrían añadir acciones personalizadas, por ejemplo, para obtener puntos cercanos, etc.
    # @action(detail=True, methods=['get'])
    # def documentos(self, request, pk=None):
    #     punto = self.get_object()
    #     documentos = DocumentoAdjunto.objects.filter(content_type__model='punto', object_id=punto.pk)
    #     serializer = DocumentoAdjuntoSerializer(documentos, many=True, context={'request': request})
    #     return Response(serializer.data)


class PoligonoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Polígonos geográficos.
    """
    queryset = Poligono.objects.all()
    serializer_class = PoligonoSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsCreatorOrAdminOrReadOnly]
    # filter_backends = (InBBoxFilter,)
    # bbox_filter_field = 'geometria'

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(creador=self.request.user)
        else:
            serializer.save()


class DocumentoAdjuntoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Documentos Adjuntos.
    Permite crear, listar, ver, actualizar y eliminar documentos.
    La creación requiere especificar `content_type_id` y `object_id` para vincular
    el documento a un Punto o Polígono.
    """
    queryset = DocumentoAdjunto.objects.all()
    serializer_class = DocumentoAdjuntoSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly] # Ajustar según necesidad

    # Podríamos querer permisos más granulares:
    # Ej: Solo el creador del Punto/Poligono al que se adjunta puede añadir/borrar documentos,
    # o solo administradores.
    # Esto requeriría una lógica de permisos más compleja en has_object_permission
    # o has_permission, accediendo al objeto padre (Punto/Poligono).

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Validar que el usuario tiene permiso para adjuntar al objeto referenciado
        # (Ejemplo de validación adicional, no implementado completamente aquí)
        # content_type_id = serializer.validated_data.get('content_type').id
        # object_id = serializer.validated_data.get('object_id')
        # try:
        #     ct = ContentType.objects.get_for_id(content_type_id)
        #     parent_obj = ct.get_object_for_this_type(pk=object_id)
        #     if not (request.user.is_staff or (hasattr(parent_obj, 'creador') and parent_obj.creador == request.user)):
        #         return Response({"detail": "No tiene permiso para adjuntar a este objeto."},
        #                         status=status.HTTP_403_FORBIDDEN)
        # except Exception as e:
        #     return Response({"detail": f"Error al validar objeto padre: {e}"}, status=status.HTTP_400_BAD_REQUEST)

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    # Si se quisiera filtrar documentos por el elemento geográfico al que pertenecen:
    # /api/documentos/?content_type=punto&object_id=1
    def get_queryset(self):
        queryset = DocumentoAdjunto.objects.all()
        content_type_model = self.request.query_params.get('content_type_model') # ej: 'punto' o 'poligono'
        object_id = self.request.query_params.get('object_id')

        if content_type_model and object_id:
            try:
                # Es importante validar content_type_model para evitar errores o accesos no deseados
                app_label = 'geoinfo' # Asumiendo que los modelos son de la app 'geoinfo'
                ct = ContentType.objects.get(app_label=app_label, model=content_type_model.lower())
                queryset = queryset.filter(content_type=ct, object_id=object_id)
            except ContentType.DoesNotExist:
                # Manejar el caso de un content_type_model inválido, por ejemplo, devolviendo un queryset vacío
                # o lanzando un error Http404 si se prefiere.
                return queryset.none()
            except ValueError: # Si object_id no es un entero válido
                return queryset.none()
        return queryset


class PerfilUsuarioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Perfiles de Usuario.
    Generalmente, los perfiles se crean automáticamente por la señal.
    Este ViewSet permite ver y actualizar roles (principalmente por administradores).
    Los usuarios podrían ver su propio perfil.
    """
    queryset = PerfilUsuario.objects.all()
    serializer_class = PerfilUsuarioSerializer
    permission_classes = [permissions.IsAuthenticated, PerfilUsuarioPermissions]

    # No se permite la creación directa de perfiles vía API, ya que se maneja por signals.
    # Se puede restringir los métodos HTTP permitidos:
    http_method_names = ['get', 'put', 'patch', 'head', 'options'] # No 'post' o 'delete' directo

    # Si un admin quiere borrar un perfil, debe borrar el User asociado,
    # y el OneToOneField con on_delete=models.CASCADE se encargará del perfil.

    # Un admin podría querer cambiar el rol de un usuario.
    # Un usuario podría querer ver su propio perfil.

# Nota: Los permisos deben ser ajustados cuidadosamente según los requisitos exactos de la aplicación.
# Los ejemplos IsCreatorOrAdminOrReadOnly y PerfilUsuarioPermissions son un punto de partida.
# Django REST Framework ofrece varios permisos incorporados como IsAdminUser, IsAuthenticated, etc.
# que se pueden combinar.
