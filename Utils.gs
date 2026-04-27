/**
 * UTILIDADES GENERALES
 */

/**
 * Genera un ID de Proyecto correlativo
 */
function generarIdProyecto() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.HOJAS.PROYECTOS);

  if (!sheet) {
    throw new Error("La hoja 'Proyectos' no existe. Por favor, ejecute la inicialización.");
  }

  const year = new Date().getFullYear();
  const prefix = `${CONFIG.ID_PREFIJO_PROY}${year}-`;

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return `${prefix}0001`;

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const relevantIds = ids.filter(id => id.toString().startsWith(prefix));

  if (relevantIds.length === 0) return `${prefix}0001`;

  const nums = relevantIds.map(id => parseInt(id.toString().split('-')[2]));
  const nextNum = Math.max(...nums) + 1;

  return `${prefix}${nextNum.toString().padStart(4, '0')}`;
}

/**
 * Genera un ID único para Pasos
 */
function generarIdPaso() {
  return `${CONFIG.ID_PREFIJO_PASO}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

/**
 * Registra un cambio en la hoja de auditoría
 */
function logAudit(accion, detalles, idReferencia) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.HOJAS.AUDITORIA);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.HOJAS.AUDITORIA);
    sheet.appendRow(["Timestamp", "Usuario", "Acción Realizada", "Detalles", "ID Registro Afectado"]);
    sheet.hideSheet();
  }

  sheet.appendRow([
    new Date(),
    Session.getActiveUser().getEmail(),
    accion,
    detalles,
    idReferencia
  ]);
}

/**
 * Función legacy para compatibilidad
 */
function registrarAuditoria(idReferencia, entidad, campo, valorAnterior, valorNuevo) {
  logAudit(`Cambio en ${entidad}: ${campo}`, `De ${valorAnterior} a ${valorNuevo}`, idReferencia);
}

/**
 * Obtiene la siguiente secuencia para un paso dentro de un proyecto/escenario
 */
function getSiguienteSecuencia(idProyecto, escenario) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.HOJAS.PASOS);

  if (!sheet) {
    throw new Error("La hoja 'Pasos' no existe.");
  }

  const data = sheet.getDataRange().getValues();

  let maxSec = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === idProyecto && data[i][4] === escenario) {
      const sec = parseInt(data[i][3]);
      if (sec > maxSec) maxSec = sec;
    }
  }
  return maxSec + 1;
}

/**
 * Helper para formatear hojas nuevas de VSM
 */
function formatearHojaVSM(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // Diseño básico de la visualización VSM
  sheet.getRange("A1:Z100").clear();
  sheet.getRange("A1:G1").merge().setValue("MAPA DE FLUJO DE VALOR: " + sheetName)
    .setFontSize(16).setFontWeight("bold").setBackground("#1a73e8").setFontColor("white").setHorizontalAlignment("center");

  sheet.getRange("A3:G3").setValues([["Orden", "Actividad", "Escenario", "Valor", "T. Trabajo", "T. Espera", "Lead Time"]])
    .setBackground("#f1f3f4").setFontWeight("bold");

  // Aquí se podrían añadir más detalles de diseño
  return sheet;
}
