/**
 * UTILIDADES GENERALES
 */

/**
 * Genera un ID de Proyecto correlativo
 */
function generarIdProyecto() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.HOJAS.PROYECTOS);
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
function registrarAuditoria(idReferencia, entidad, campo, valorAnterior, valorNuevo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.HOJAS.AUDITORIA);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.HOJAS.AUDITORIA);
    sheet.appendRow(["Timestamp", "Usuario", "ID_Referencia", "Entidad", "Campo", "Valor Anterior", "Valor Nuevo"]);
    sheet.hideSheet();
  }

  sheet.appendRow([
    new Date(),
    Session.getActiveUser().getEmail(),
    idReferencia,
    entidad,
    campo,
    valorAnterior,
    valorNuevo
  ]);
}

/**
 * Obtiene la siguiente secuencia para un paso dentro de un proyecto/escenario
 */
function getSiguienteSecuencia(idProyecto, escenario) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.HOJAS.PASOS);
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
  sheet.getRange("A1").setValue("MAPA DE FLUJO DE VALOR: " + sheetName).setFontSize(16).setFontWeight("bold");

  // Aquí se podrían añadir más detalles de diseño
  return sheet;
}
