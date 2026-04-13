# Instalación del Sistema BPM en Google Apps Script

Este sistema permite gestionar procesos de negocio directamente desde un Google Sheet.

## Pasos para la Instalación (Script Vinculado - RECOMENDADO)

1.  **Crear un nuevo Google Sheet.**
2.  **Abrir el editor de scripts:**
    - Dentro del Sheet, ve a `Extensiones` > `Apps Script`. Esto vincula el script automáticamente al Sheet.
3.  **Copiar el código del servidor:**
    - Borra el contenido de `Código.gs` y pega el contenido de `appscript/Code.gs`.
4.  **Crear el archivo de interfaz:**
    - Haz clic en el icono `+` (Agregar un archivo) > `HTML`.
    - Nómbralo exactamente `index`.
    - Pega el contenido de `appscript/index.html`.
5.  **Inicializar las hojas:**
    - En el editor de Apps Script, selecciona la función `initSheets` en la barra de herramientas superior y haz clic en `Ejecutar`.
    - Otorga los permisos necesarios cuando se te solicite.
6.  **Abrir la aplicación:**
    - Recarga tu Google Sheet.
    - Verás un nuevo menú llamado `BPM System`.
    - Haz clic en `BPM System` > `Abrir App`.
    - También puedes desplegarlo como "Aplicación Web" desde el botón `Implementar` > `Nueva implementación`.

## Solución de Errores Comunes

### Error: "No se pudo obtener la hoja de cálculo activa"
Este error ocurre si el script es "independiente" (Standalone) y no está dentro de un Google Sheet.

**Solución 1 (Recomendada):**
Crea el script desde adentro de un Google Sheet (`Extensiones > Apps Script`).

**Solución 2 (Para Scripts Independientes):**
1. Copia el ID de tu Google Sheet (está en la URL: `docs.google.com/spreadsheets/d/ID_AQUÍ/edit`).
2. En el editor de Apps Script, selecciona la función `setSpreadsheetId` y dale a `Ejecutar`.
3. Pega el ID cuando se te solicite.

## Funcionalidades Incluidas

- **VSM:** Registro de pasos, cálculo de Lead Time/Efficiency y gráfico de dona.
- **Simplificación:** ROI basado en costo por hora, matriz Impacto/Esfuerzo automática.
- **RACI:** Matriz dinámica con validación visual (R y A requeridos).
- **Persistencia:** Todos los datos se guardan automáticamente en las pestañas del Sheet.
