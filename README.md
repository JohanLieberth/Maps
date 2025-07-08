# Geoportal Backend Interactivo

Este proyecto implementa el backend para una aplicación web de geoportal interactivo. Permite a los usuarios crear, visualizar y gestionar datos geográficos (puntos y polígonos), asociar información detallada y vincular documentos externos.

## Características Principales (Backend)

*   **Gestión de Elementos Geográficos:** Creación, lectura, actualización y eliminación (CRUD) de puntos y polígonos.
*   **Datos Asociados:** Posibilidad de añadir descripciones textuales a cada elemento geográfico.
*   **Documentos Adjuntos:** Vinculación de archivos (PDFs, imágenes, etc.) o enlaces externos a los elementos.
*   **API RESTful:** Interfaz basada en Django REST Framework para la comunicación con el frontend.
*   **Autenticación y Permisos:** Sistema de usuarios con roles (Administrador, Editor, Visualizador) para controlar el acceso y la modificación de datos.
    *   Administradores y creadores de objetos tienen control total.
    *   Usuarios con rol 'Editor' pueden modificar nombre y descripción de puntos/polígonos.
*   **Base de Datos Espacial:** Utiliza PostgreSQL con la extensión PostGIS para el almacenamiento y consulta eficiente de datos geoespaciales.

## Tecnologías Utilizadas (Backend)

*   **Python 3.8+**
*   **Django:** Framework web principal.
*   **GeoDjango:** Extensión de Django para funcionalidades GIS.
*   **Django REST Framework:** Para la creación de APIs REST.
*   **django-cors-headers:** Para manejar Cross-Origin Resource Sharing (CORS).
*   **PostgreSQL:** Base de datos relacional.
*   **PostGIS:** Extensión espacial para PostgreSQL.
*   **Librerías Python Geoespaciales (dependencias indirectas o directas):**
    *   GDAL (requerida por GeoDjango a nivel de sistema)
    *   Shapely
    *   Fiona

## Requisitos del Sistema (Backend)

Antes de comenzar, asegúrate de tener instalados los siguientes componentes en tu sistema:

1.  **Python:** Versión 3.8 o superior.
2.  **Pip:** Gestor de paquetes de Python.
3.  **PostgreSQL:** Versión 12 o superior.
4.  **PostGIS:** Extensión para PostgreSQL (habilitada en la base de datos del proyecto).
5.  **GDAL (Librería Nativa):** Incluyendo archivos de desarrollo (`libgdal-dev`).
6.  **Entorno Virtual (Recomendado):** (e.g., `venv`).

## Configuración del Proyecto Backend

1.  **Clonar el Repositorio (si aplica).**

2.  **Navegar al Directorio del Proyecto Django:**
    El proyecto Django se encuentra en la carpeta `geoportal_backend/`. Los comandos `manage.py` se ejecutan desde ahí.

3.  **Crear y Activar un Entorno Virtual:**
    (Se recomienda crearlo fuera o al mismo nivel que `geoportal_backend/`)
    ```bash
    python -m venv venv
    source venv/bin/activate  # Linux/macOS
    # venv\Scripts\activate    # Windows
    ```

4.  **Instalar Dependencias de Python:**
    El archivo `requirements.txt` está en la raíz del repositorio.
    ```bash
    pip install -r requirements.txt
    ```

5.  **Configurar la Base de Datos:**
    *   Crea una base de datos en PostgreSQL (e.g., `geoportal_db`).
    *   Habilita la extensión PostGIS: `CREATE EXTENSION postgis;`
    *   Actualiza `geoportal_backend/geoportal_backend/settings.py` con tus credenciales de BD.

6.  **Configurar Clave Secreta:**
    Cambia `SECRET_KEY` en `geoportal_backend/geoportal_backend/settings.py`.

7.  **Aplicar Migraciones:**
    Desde `geoportal_backend/`:
    ```bash
    python manage.py makemigrations geoinfo
    python manage.py migrate
    ```

8.  **Crear un Superusuario:**
    Desde `geoportal_backend/`:
    ```bash
    python manage.py createsuperuser
    ```

9.  **Ejecutar el Servidor de Desarrollo del Backend:**
    Desde `geoportal_backend/`:
    ```bash
    python manage.py runserver
    ```
    La API estará disponible en `http://127.0.0.1:8000/api/v1/`.
    El admin en `http://127.0.0.1:8000/admin/`.

## Frontend Simple

Se incluye un frontend básico en la carpeta `frontend/` (HTML, CSS, Vanilla JS) para interactuar con la API.

### Para Ejecutar el Frontend Simple:

1.  Asegúrate de que el servidor backend Django esté corriendo.
2.  Abre `frontend/index.html` en tu navegador web.
    *   Puedes usar una extensión como "Live Server" en VSCode para servirlo desde un puerto local (ej. `http://127.0.0.1:5500`).
    *   La configuración CORS del backend (`CORS_ALLOW_ALL_ORIGINS = True`) permite estas conexiones en desarrollo.

### Funcionalidades del Frontend Simple:

*   Muestra un mapa interactivo (Leaflet) centrado en Bogotá.
*   Botón "Cargar Puntos Existentes": Obtiene y muestra los puntos de la API.
*   Clic en el mapa: Permite crear un nuevo punto (pide nombre y descripción opcional) y lo envía a la API. Los nuevos puntos se añaden al mapa.
*   Popups en los marcadores con nombre, descripción y creador del punto.

**Nota sobre autenticación en el frontend simple:** Este frontend no implementa un flujo de login. Si estás logueado en el admin de Django (`/admin/`) en el mismo navegador, tu sesión podría ser usada para las peticiones de la API, y los puntos creados se asociarán a tu usuario. De lo contrario, se crearán como anónimos (si los permisos de la API lo permiten, lo cual es el caso actual para la creación de puntos).

## Estructura del Proyecto

Aquí tienes la estructura del proyecto tal como está actualmente en el repositorio:

.
├── README.md
├── frontend/
│   ├── app.js
│   ├── index.html
│   └── style.css
├── geoportal_backend/
│   ├── geoinfo/
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── migrations/
│   │   │   └── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── tests.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── geoportal_backend/
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── manage.py
└── requirements.txt


Descripción de los componentes principales:

README.md: (Debería contener la documentación del proyecto que te proporcioné).
frontend/: Carpeta con el frontend simple (HTML, CSS, JavaScript).
app.js: Lógica JavaScript para el mapa y la interacción con la API.
index.html: Estructura principal de la página del frontend.
style.css: Estilos para el frontend.
geoportal_backend/: Directorio raíz del proyecto Django.
geoinfo/: Aplicación Django principal que contiene la lógica del geoportal.
models.py: Definiciones de los modelos de datos (Punto, Poligono, DocumentoAdjunto, PerfilUsuario).
serializers.py: Serializers de Django REST Framework para convertir modelos a/desde JSON.
views.py: ViewSets de la API que manejan las solicitudes HTTP.
urls.py: URLs específicas de la aplicación geoinfo.
admin.py: Configuración para el panel de administración de Django.
migrations/: Archivos de migración de la base de datos generados por Django.
geoportal_backend/: Directorio de configuración del proyecto Django.
settings.py: Configuración general del proyecto Django (base de datos, apps instaladas, middleware, etc.).
urls.py: Archivo principal de URLs del proyecto Django.
manage.py: Utilidad de línea de comandos de Django.
requirements.txt: Lista de las dependencias de Python para el proyecto.
La carpeta geoportal_backend/media/ no aparece en el listado porque se crea dinámicamente cuando se sube el primer archivo a través del modelo DocumentoAdjunto (si la configuración MEDIA_ROOT y MEDIA_URL es correcta y se realizan subidas).
