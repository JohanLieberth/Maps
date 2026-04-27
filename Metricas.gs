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

  // Actualizar hoja visual VSM
  const sheetName = `VSM_${idProyecto}`;
  const vsmSheet = ss.getSheetByName(sheetName);
  if (vsmSheet) {
    // Limpiar datos anteriores (desde fila 4)
    if (vsmSheet.getLastRow() >= 4) {
      vsmSheet.getRange(4, 1, vsmSheet.getLastRow() - 3, 7).clear();
    }

    // Preparar nuevos datos ordenados
    const visualData = pasosProy.sort((a, b) => a[3] - b[3]).map(r => [
      r[3], // Orden
      r[5], // Actividad
      r[4], // Escenario
      r[6], // Valor
      r[9], // T. Trabajo
      r[10], // T. Espera
      r[11]  // LT
    ]);

    if (visualData.length > 0) {
      vsmSheet.getRange(4, 1, visualData.length, 7).setValues(visualData);
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

/**
 * Retorna estadísticas consolidadas para el Dashboard de la Web App
 */
function getDashboardStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const proySheet = ss.getSheetByName(CONFIG.HOJAS.PROYECTOS);
  if (!proySheet) return {};

  const data = proySheet.getDataRange().getValues();
  data.shift(); // Headers

  const stats = {
    total: data.length,
    estados: {
      "Activo": 0,
      "En Pausa": 0,
      "Completado": 0,
      "Archivado": 0
    },
    ahorroTotal: 0
  };

  data.forEach(row => {
    const est = row[6];
    if (stats.estados[est] !== undefined) stats.estados[est]++;
    stats.ahorroTotal += (parseFloat(row[14]) || 0);
  });

  return stats;
}

/**
 * Calcula la comparativa de eficiencia entre estados Actual y Propuesto
 */
function calculateEfficiency(idProyecto) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const proySheet = ss.getSheetByName(CONFIG.HOJAS.PROYECTOS);
  const data = proySheet.getDataRange().getValues();

  const proy = data.find(r => r[0] === idProyecto);
  if (!proy) return { status: 'error', message: 'Proyecto no encontrado' };

  const ltActual = parseFloat(proy[10]) || 0;
  const ltPropuesto = parseFloat(proy[11]) || 0;

  const gananciaHrs = ltActual - ltPropuesto;
  const optimizacionPct = ltActual > 0 ? (gananciaHrs / ltActual) * 100 : 0;

  let indicador = "Neutral";
  let color = "#7f8c8d";

  if (optimizacionPct > 20) {
    indicador = "Alta Mejora";
    color = "#27ae60";
  } else if (optimizacionPct > 5) {
    indicador = "Mejora Incremental";
    color = "#2980b9";
  } else if (optimizacionPct < 0) {
    indicador = "Regresión de Tiempo";
    color = "#c0392b";
  }

  return {
    status: 'success',
    data: {
      ltActual: ltActual.toFixed(2),
      ltPropuesto: ltPropuesto.toFixed(2),
      ganancia: gananciaHrs.toFixed(2),
      optimizacion: optimizacionPct.toFixed(1) + "%",
      indicador: indicador,
      color: color
    }
  };
}
