/**
 * CÁLCULOS LEAN Y KPIs
 */

/**
 * Calcula y actualiza las métricas agregadas en la hoja Proyectos para un ID específico
 */
function actualizarMetricasProyecto(idProyecto) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pasosSheet = ss.getSheetByName(CONFIG.HOJAS.PASOS);
  const data = pasosSheet.getDataRange().getValues();

  // Filtrar pasos activos del proyecto
  const pasosProy = data.filter(row => row[1] === idProyecto && row[20] === "Activo");

  const stats = {
    actual: { pasos: 0, va_time: 0, lead_time: 0 },
    propuesto: { pasos: 0, va_time: 0, lead_time: 0 }
  };

  pasosProy.forEach(row => {
    const esc = row[4].toLowerCase();
    const etiqueta = row[6];
    const tVa = parseFloat(row[9]) || 0;
    const tLt = parseFloat(row[11]) || 0;

    if (stats[esc]) {
      stats[esc].pasos++;
      stats[esc].lead_time += tLt;
      if (etiqueta === "VA") {
        stats[esc].va_time += tVa;
      }
    }
  });

  // Calcular PCEs
  const pceActual = stats.actual.lead_time > 0 ? (stats.actual.va_time / stats.actual.lead_time) : 0;
  const pcePropuesto = stats.propuesto.lead_time > 0 ? (stats.propuesto.va_time / stats.propuesto.lead_time) : 0;

  // Obtener jornada desde config
  const jornada = parseFloat(getParametro("JORNADA_HORAS")) || 8;
  const ahorroDias = ((stats.actual.lead_time - stats.propuesto.lead_time) / 60) / jornada;

  // Actualizar en hoja Proyectos
  const proySheet = ss.getSheetByName(CONFIG.HOJAS.PROYECTOS);
  const proyData = proySheet.getDataRange().getValues();

  for (let i = 1; i < proyData.length; i++) {
    if (proyData[i][0] === idProyecto) {
      const row = i + 1;
      // Columnas I a O: I=9, J=10, K=11, L=12, M=13, N=14, O=15
      sheetRange = proySheet.getRange(row, 9, 1, 7);
      sheetRange.setValues([[
        stats.actual.pasos,
        stats.propuesto.pasos,
        stats.actual.lead_time / 60, // Horas
        stats.propuesto.lead_time / 60,
        pceActual,
        pcePropuesto,
        ahorroDias
      ]]);
      break;
    }
  }
}

/**
 * Función para refrescar el Dashboard global
 */
function actualizarDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dashSheet = ss.getSheetByName(CONFIG.HOJAS.DASHBOARD);

  // Aunque el dashboard usa fórmulas nativas, esta función puede forzar
  // el refresco de datos o actualizar gráficos complejos si fuera necesario.
  SpreadsheetApp.flush();
}
