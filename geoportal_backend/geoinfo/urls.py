from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet,
    PuntoViewSet,
    PoligonoViewSet,
    DocumentoAdjuntoViewSet,
    PerfilUsuarioViewSet
)

# El DefaultRouter registra automáticamente las URLs para las acciones estándar de los ViewSets
# (list, create, retrieve, update, partial_update, destroy).
router = DefaultRouter()

# Registrar los ViewSets con el router
# El primer argumento es el prefijo de la URL para este ViewSet (ej. /api/users/)
# El segundo argumento es el ViewSet mismo.
# El tercer argumento 'basename' se usa para nombrar las URLs generadas. Es opcional si el
# ViewSet tiene un atributo 'queryset' definido, pero es buena práctica incluirlo.

router.register(r'users', UserViewSet, basename='user')
router.register(r'puntos', PuntoViewSet, basename='punto')
router.register(r'poligonos', PoligonoViewSet, basename='poligono')
router.register(r'documentos', DocumentoAdjuntoViewSet, basename='documento')
router.register(r'perfiles', PerfilUsuarioViewSet, basename='perfilusuario')

# Las URLs de la API ahora son determinadas automáticamente por el router.
# Por ejemplo:
# /api/puntos/ -> GET (list), POST (create)
# /api/puntos/{id}/ -> GET (retrieve), PUT (update), PATCH (partial_update), DELETE (destroy)

urlpatterns = [
    # Incluye todas las URLs generadas por el router.
    path('', include(router.urls)),
]

# Si tuvieras vistas basadas en funciones o clases APIView que no son ViewSets,
# las añadirías aquí con path() como es usual en Django.
# Ejemplo:
# from .views import mi_vista_api_personalizada
# urlpatterns += [
#     path('mi-endpoint-personalizado/', mi_vista_api_personalizada, name='mi_endpoint'),
# ]

# Este archivo (geoinfo/urls.py) será incluido en el archivo urls.py principal del proyecto
# (geoportal_backend/urls.py) bajo un prefijo como 'api/'.
# Entonces, la URL completa para listar puntos sería, por ejemplo, /api/puntos/.
