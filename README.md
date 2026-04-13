# Sistema de Gestión de Procesos de Negocio (BPM)

Este sistema web completo permite la gestión de procesos utilizando herramientas de Lean Six Sigma como Value Stream Mapping (VSM), Análisis de Simplificación y Matriz RACI.

## Funcionalidades Principales

### 1. Mapa de Valor (Value Stream Mapping)
- Registro detallado de pasos del proceso.
- Cálculo automático de Lead Time, Cycle Time y Eficiencia.
- Visualización de la distribución de valor (VA, NVA, NNVA).
- Diagrama de flujo visual.

### 2. Análisis de Simplificación
- Identificación de actividades que no agregan valor.
- Estimación de ahorros post-simplificación.
- Dashboard de ROI y matriz de impacto/esfuerzo.

### 3. Matriz RACI
- Definición de roles por actividad (Responsible, Accountable, Consulted, Informed).
- Validación automática de reglas (un solo Accountable, al menos un Responsible).
- Vista matricial clara.

## Requisitos Técnicos
- Python 3.x
- Flask
- SQLAlchemy (SQLite)
- Pandas & OpenPyXL (para exportación Excel)
- Bootstrap 5 & Chart.js (Frontend)

## Instrucciones de Instalación

1.  **Clonar el repositorio o descargar los archivos.**
2.  **Crear un entorno virtual (opcional pero recomendado):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # En Windows: venv\Scripts\activate
    ```
3.  **Instalar dependencias:**
    ```bash
    pip install flask flask-sqlalchemy flask-migrate pandas openpyxl reportlab
    ```
4.  **Ejecutar la aplicación:**
    ```bash
    python app.py
    ```
5.  **Acceder en el navegador:**
    Abre `http://127.0.0.1:5000`

## Estructura del Proyecto
- `app.py`: Lógica principal y rutas de Flask.
- `models.py`: Definición de la base de datos con SQLAlchemy.
- `templates/`: Archivos HTML con Jinja2.
- `static/`: Archivos CSS y JS (opcional).
