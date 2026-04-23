/**
 * Obtiene el último ID de proyecto creado para facilitar la carga en formularios
 */
function ultimoIdProyecto() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.HOJAS.PROYECTOS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return "";
  return sheet.getRange(lastRow, 1).getValue();
}
