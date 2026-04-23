/**
 * GESTIÓN DE ESCENARIOS (As-Is -> To-Be)
 */

/**
 * Duplica el escenario Actual a Propuesto para empezar a optimizar
 */
function duplicarMapaComoPropuesto(idProyecto) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.HOJAS.PASOS);
    const data = sheet.getDataRange().getValues();

    // 1. Verificar si ya existe propuesto
    const existePropuesto = data.some(row => row[1] === idProyecto && row[4] === "Propuesto" && row[20] === "Activo");
    if (existePropuesto) {
      throw new Error("Ya existe un escenario Propuesto activo para este proyecto.");
    }

    // 2. Obtener pasos actuales
    const pasosActuales = data.filter(row => row[1] === idProyecto && row[4] === "Actual" && row[20] === "Activo");
    if (pasosActuales.length === 0) {
      throw new Error("No hay pasos en el escenario Actual para duplicar.");
    }

    // 3. Duplicar
    const nuevosPasos = pasosActuales.map(row => {
      let nuevo = [...row];
      nuevo[0] = generarIdPaso(); // Nuevo ID Registro
      nuevo[4] = "Propuesto"; // Nuevo Escenario
      nuevo[18] = new Date(); // Nueva fecha
      nuevo[19] = Session.getActiveUser().getEmail(); // Nuevo autor
      return nuevo;
    });

    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, nuevosPasos.length, nuevosPasos[0].length).setValues(nuevosPasos);

    // 4. Actualizar tipo de mapa en Proyectos
    const proySheet = ss.getSheetByName(CONFIG.HOJAS.PROYECTOS);
    const proyData = proySheet.getDataRange().getValues();
    for (let i = 1; i < proyData.length; i++) {
      if (proyData[i][0] === idProyecto) {
        proySheet.getRange(i + 1, 8).setValue("Ambos");
        break;
      }
    }

    actualizarMetricasProyecto(idProyecto);

    return { success: true, mensaje: `Se duplicaron ${nuevosPasos.length} pasos.` };

  } catch (e) {
    return { success: false, mensaje: e.toString() };
  }
}

/**
 * Genera objeto de comparación para UI
 */
function compararEscenarios(idProyecto) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const proySheet = ss.getSheetByName(CONFIG.HOJAS.PROYECTOS);
  const data = proySheet.getDataRange().getValues();

  const proy = data.find(row => row[0] === idProyecto);
  if (!proy) return null;

  return {
    id: idProyecto,
    nombre: proy[1],
    actual: {
      pasos: proy[8],
      leadTime: proy[10],
      pce: proy[12]
    },
    propuesto: {
      pasos: proy[9],
      leadTime: proy[11],
      pce: proy[13]
    },
    ahorro: proy[14]
  };
}

/**
 * Consolida la propuesta: cambia estado de proyecto y marca pasos
 */
function consolidarPropuesta(idProyecto) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const proySheet = ss.getSheetByName(CONFIG.HOJAS.PROYECTOS);
    const data = proySheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === idProyecto) {
        // Validar que el ahorro sea positivo
        const ahorro = data[i][14];
        if (ahorro < 0) {
          throw new Error("No se puede consolidar una propuesta que no mejora el Lead Time actual.");
        }

        proySheet.getRange(i + 1, 7).setValue("Completado");
        proySheet.getRange(i + 1, 6).setValue(new Date());

        // Opcional: Snapshot a Histórico
        const histSheet = ss.getSheetByName("Historico") || ss.insertSheet("Historico");
        if (histSheet.getLastRow() === 0) {
          histSheet.appendRow(["Fecha", "ID_Proyecto", "Nombre", "LT_Actual", "LT_Propuesto", "Ahorro_Dias"]);
        }
        histSheet.appendRow([new Date(), idProyecto, data[i][1], data[i][10], data[i][11], ahorro]);

        return { success: true, mensaje: "Propuesta consolidada y proyecto completado." };
      }
    }
    return { success: false, mensaje: "Proyecto no encontrado." };
  } catch (e) {
    return { success: false, mensaje: e.toString() };
  }
}
