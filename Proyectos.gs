/**
 * GESTIÓN DE PROYECTOS
 */

/**
 * Crea o actualiza un proyecto con control de concurrencia
 */
function saveProjectData(datos) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.HOJAS.PROYECTOS);

    if (!sheet) {
      inicializarHerramienta();
      return saveProjectData(datos);
    }

    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    // Buscar por nombre de proceso para evitar duplicados en creación o identificar edición
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === datos.nombreProceso && data[i][7] !== "Archivado") {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex > 0) {
      return updateProjectData(data[rowIndex-1][0], datos);
    }

    // Continuar con creación
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
    // Estructura: ID, Nombre, Area, Resp_Nom, Resp_Email, Inicio, Mod, Estado, Tipo, Actual_P, Prop_P, Actual_LT, Prop_LT, PCE_A, PCE_P, Ahorro, URL_A, URL_P, Obs
    const nuevaFila = [
      idProyecto,
      datos.nombreProceso,
      datos.areaResponsable,
      datos.responsableNombre,
      datos.responsableEmail,
      timestamp,
      timestamp,
      "Activo",
      "Actual",
      0, 0, 0, 0, 0, 0, 0, // Métricas iniciales
      "", "", // URLs
      datos.observaciones
    ];

    sheet.appendRow(nuevaFila);
    logAudit("Crear Proyecto", `Nuevo proyecto: ${datos.nombreProceso}`, idProyecto);

    // 4. Crear hoja visual y links
    const vsmSheet = formatearHojaVSM(sheetName);
    const gid = vsmSheet.getSheetId();
    const baseUrl = ss.getUrl();
    const urlActual = `${baseUrl}#gid=${gid}`;

    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, CONFIG.COLUMNAS.PROYECTOS.URL_ACTUAL).setValue(urlActual);

    return {
      status: 'success',
      idProyecto: idProyecto,
      message: "Proyecto creado exitosamente."
    };

  } catch (e) {
    return { status: 'error', message: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Actualiza los datos de un proyecto existente
 */
function updateProjectData(idProyecto, datos) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.HOJAS.PROYECTOS);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === idProyecto) {
        const row = i + 1;
        sheet.getRange(row, 2).setValue(datos.nombreProceso);
        sheet.getRange(row, 3).setValue(datos.areaResponsable);
        sheet.getRange(row, 4).setValue(datos.responsableNombre);
        sheet.getRange(row, 5).setValue(datos.responsableEmail);
        sheet.getRange(row, 7).setValue(new Date()); // Fecha Mod
        sheet.getRange(row, 18).setValue(datos.observaciones);

        logAudit("Actualizar Proyecto", `Modificación: ${datos.nombreProceso}`, idProyecto);
        return { status: 'success', message: "Proyecto actualizado correctamente." };
      }
    }
    return { status: 'error', message: "No se encontró el proyecto para actualizar." };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Función legacy para compatibilidad
 */
function crearNuevoProyecto(datos) {
  return saveProjectData(datos);
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
