/**
 * ALIAS DE FUNCIONES PARA COMPLIANCE
 */

function saveProject(datos) {
  return crearNuevoProyecto(datos);
}

function saveActivity(idProyecto, datos) {
  return agregarPaso(idProyecto, datos);
}

/**
 * Retorna todos los proyectos para el listado
 */
function getProjectsData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.HOJAS.PROYECTOS);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data.shift();
  return data.map(row => ({
    id: row[0],
    nombre: row[1],
    area: row[2],
    responsable: row[3],
    estado: row[6],
    tipo: row[7],
    leadTime: row[10],
    pce: row[12]
  }));
}

/**
 * Retorna actividades filtradas por proyecto
 */
function getActivitiesByProject(idProyecto) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.HOJAS.PASOS);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  return data
    .filter(row => row[1] === idProyecto && row[20] === "Activo")
    .map(row => ({
      id: row[0],
      secuencia: row[3],
      escenario: row[4],
      nombre: row[5],
      valor: row[6],
      leadTime: row[11],
      responsable: row[8]
    }));
}
