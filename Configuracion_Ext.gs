/**
 * Obtiene la lista de áreas desde la hoja de Configuración
 */
function getListaAreas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.HOJAS.CONFIGURACION);
  const data = sheet.getDataRange().getValues();

  return data
    .filter(row => row[0] === "Áreas")
    .map(row => row[2]);
}
