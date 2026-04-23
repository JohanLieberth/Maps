/**
 * GESTIÓN DE PROYECTOS
 */

/**
 * Crea un nuevo proyecto en la hoja Maestra
 */
function crearNuevoProyecto(datos) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.HOJAS.PROYECTOS);

    // 1. Validar duplicados activos
    const data = sheet.getDataRange().getValues();
    const existe = data.some(row => row[1] === datos.nombreProceso && row[6] === "Activo");

    if (existe) {
      throw new Error("Ya existe un proyecto activo con ese nombre.");
    }

    // 2. Generar ID y preparar fila
    const idProyecto = generarIdProyecto();
    const timestamp = new Date();
    const sheetName = `VSM_${idProyecto}`;

    // 3. Insertar en Proyectos
    // Estructura: ID, Nombre, Area, Resp, Inicio, Mod, Estado, Tipo, Actual_P, Prop_P, Actual_LT, Prop_LT, PCE_A, PCE_P, Ahorro, URL_A, URL_P, Obs
    const nuevaFila = [
      idProyecto,
      datos.nombreProceso,
      datos.areaResponsable,
      datos.responsable,
      timestamp,
      timestamp,
      "Activo",
      "Actual",
      0, 0, 0, 0, 0, 0, 0, // Métricas iniciales
      "", "", // URLs
      datos.observaciones
    ];

    sheet.appendRow(nuevaFila);

    // 4. Crear hoja visual y links
    const vsmSheet = formatearHojaVSM(sheetName);
    const gid = vsmSheet.getSheetId();
    const baseUrl = ss.getUrl();
    const urlActual = `${baseUrl}#gid=${gid}`;

    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, CONFIG.COLUMNAS.PROYECTOS.URL_ACTUAL).setValue(urlActual);

    return {
      success: true,
      idProyecto: idProyecto,
      mensaje: "Proyecto creado exitosamente."
    };

  } catch (e) {
    return { success: false, mensaje: e.toString() };
  }
}

/**
 * Lista proyectos filtrados
 */
function listarProyectos(filtroEstado = "Todos") {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.HOJAS.PROYECTOS);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();

  let filtrados = data;
  if (filtroEstado !== "Todos") {
    filtrados = data.filter(row => row[6] === filtroEstado);
  }

  return filtrados.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

/**
 * Actualiza el estado de un proyecto
 */
function actualizarEstadoProyecto(idProyecto, nuevoEstado) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.HOJAS.PROYECTOS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === idProyecto) {
      const estadoAnterior = data[i][6];
      sheet.getRange(i + 1, 7).setValue(nuevoEstado);
      sheet.getRange(i + 1, 6).setValue(new Date());
      registrarAuditoria(idProyecto, "Proyecto", "Estado", estadoAnterior, nuevoEstado);
      return { success: true };
    }
  }
  return { success: false, mensaje: "Proyecto no encontrado" };
}
