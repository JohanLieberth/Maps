/**
 * GESTIÓN DE PASOS (ACTIVIDADES)
 */

/**
 * Agrega un nuevo paso al inventario
 */
function agregarPaso(idProyecto, datos) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.HOJAS.PASOS);

    if (!sheet) {
      inicializarHerramienta();
      return agregarPaso(idProyecto, datos);
    }

    // 1. Validar que el proyecto esté activo (opcional pero recomendado)

    // 2. Preparar datos
    const secuencia = getSiguienteSecuencia(idProyecto, datos.escenario);
    const idRegistro = generarIdPaso();
    const idPasoProy = `${idProyecto}-${secuencia}`;
    const leadTime = (parseFloat(datos.tiempoActividad) || 0) + (parseFloat(datos.tiempoEspera) || 0);

    // Lógica de negocio
    let desperdicio = datos.tipoDesperdicio;
    if (datos.etiquetaValor === "VA") {
      desperdicio = "N/A";
    }

    let severidad = datos.severidad;
    if (datos.cuelloBotella === "No") {
      severidad = "N/A";
    }

    const nuevaFila = [
      idRegistro,
      idProyecto,
      idPasoProy,
      secuencia,
      datos.escenario,
      datos.nombreActividad,
      datos.etiquetaValor,
      datos.areaEjecutora,
      datos.responsablePaso,
      datos.tiempoActividad,
      datos.tiempoEspera,
      leadTime,
      desperdicio,
      datos.causaRaiz,
      datos.cuelloBotella,
      severidad,
      datos.accionMejora,
      datos.impactoEstimado,
      new Date(),
      Session.getActiveUser().getEmail(),
      "Activo"
    ];

    sheet.appendRow(nuevaFila);
    logAudit("Crear Paso", `Actividad: ${datos.nombreActividad}`, idRegistro);

    // 3. Recalcular métricas del proyecto
    actualizarMetricasProyecto(idProyecto);

    return { status: 'success', id: idRegistro };

  } catch (e) {
    return { status: 'error', message: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Edita un paso existente
 */
function editarPaso(idRegistro, datosActualizados) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.HOJAS.PASOS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === idRegistro) {
      const row = i + 1;
      const idProyecto = data[i][1];

      // Actualizar campos (se podría hacer en bloque para eficiencia)
      // Ejemplo simplificado para un campo, se puede expandir a todos los permitidos
      if (datosActualizados.nombreActividad) sheet.getRange(row, 6).setValue(datosActualizados.nombreActividad);
      if (datosActualizados.tiempoActividad !== undefined) sheet.getRange(row, 10).setValue(datosActualizados.tiempoActividad);
      if (datosActualizados.tiempoEspera !== undefined) sheet.getRange(row, 11).setValue(datosActualizados.tiempoEspera);

      // Recalcular Lead Time si cambiaron tiempos
      const tAct = sheet.getRange(row, 10).getValue();
      const tEsp = sheet.getRange(row, 11).getValue();
      sheet.getRange(row, 12).setValue(tAct + tEsp);

      actualizarMetricasProyecto(idProyecto);
      return { success: true };
    }
  }
  return { success: false };
}

/**
 * Obtiene los datos de un solo paso por su ID de registro
 */
function getPaso(idRegistro) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.HOJAS.PASOS);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();

  const row = data.find(r => r[0] === idRegistro);
  if (!row) return null;

  let obj = {};
  headers.forEach((h, i) => obj[h] = row[i]);
  return obj;
}

/**
 * Borrado lógico de un paso
 */
function eliminarPaso(idRegistro) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.HOJAS.PASOS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === idRegistro) {
      const idProyecto = data[i][1];
      sheet.getRange(i + 1, CONFIG.COLUMNAS.PASOS.ESTADO).setValue("Eliminado");
      actualizarMetricasProyecto(idProyecto);
      return { success: true };
    }
  }
  return { success: false };
}
