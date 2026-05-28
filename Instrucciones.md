# Instrucciones de Instalación - Quiniela Mundial 2026

## 1. Preparación del Google Sheet
1. Crea una nueva Hoja de Cálculo de Google.
2. Ve a **Extensiones** > **Apps Script**.
3. Borra el código existente y pega el contenido de `Codigo.gs`.
4. Crea dos archivos HTML nuevos llamados `Index.html` y `Admin.html` y pega sus respectivos contenidos.

## 2. Inicialización
1. En el editor de Apps Script, selecciona la función `inicializarSistema` y haz clic en **Ejecutar**.
2. Otorga los permisos necesarios cuando se te solicite. Esto creará las pestañas (hojas) y la configuración inicial.

## 3. Poblado de Datos Iniciales
1. En el menú superior del Google Sheet aparecerá una nueva opción: **⚽ Quiniela Mundial 2026**.
2. Haz clic en **🧪 Insertar Datos de Prueba**. Esto insertará los 104 partidos del calendario y algunos datos de ejemplo.

## 4. Despliegue de la Web App
1. En el editor de Apps Script, haz clic en **Desplegar** > **Nueva implementación**.
2. Tipo: **Aplicación web**.
3. Ejecutar como: **Yo** (tu email).
4. Quién tiene acceso: **Cualquiera** (esto permite que los participantes se registren).
5. Copia la URL de la aplicación web y compártela.

## 5. Automatización (Triggers)
Para que el sistema sea autónomo:
1. En Apps Script, ve a **Activadores** (icono de reloj a la izquierda).
2. Añade un activador para `recalcularTodosLosPuntos`.
   - Evento: **Basado en el tiempo**.
   - Tipo: **Temporizador de minutos** (cada 30 minutos).
3. Añade otro activador para `actualizarFaseEliminatoria` (opcional, cada 1 hora).

---

## Sistema de Puntos
- **Marcador Exacto:** 5 puntos (+3 extra en fase eliminatoria).
- **Acierta Ganador/Empate:** 2 puntos.
- **Error:** -1 punto.

## Avance Automático
El sistema calcula las posiciones de los 12 grupos. Al terminar un grupo, los dos mejores y los 8 mejores terceros avanzan a la Ronda de 32. Los ganadores de los partidos de eliminatoria avanzan automáticamente al siguiente bracket.
