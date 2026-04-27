/**
 * GESTIÓN DE PROYECTOS - EXTENDIDO
 */

/**
 * Función para actualizar el estado del proyecto desde el menú
 */
function mostrarDialogoEstadoProyecto() {
  const ui = SpreadsheetApp.getUi();
  const resId = ui.prompt('Actualizar Estado', 'ID del Proyecto:', ui.ButtonSet.OK_CANCEL);

  if (resId.getSelectedButton() == ui.Button.OK) {
    const id = resId.getResponseText();
    const resEst = ui.prompt('Nuevo Estado', 'Opciones: Activo, En Pausa, Completado, Archivado', ui.ButtonSet.OK_CANCEL);

    if (resEst.getSelectedButton() == ui.Button.OK) {
      const result = actualizarEstadoProyecto(id, resEst.getResponseText());
      ui.alert(result.success ? "Estado actualizado." : "Error: " + result.mensaje);
    }
  }
}

/**
 * Recalcula métricas para todos los proyectos activos
 */
function recalcularTodo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.HOJAS.PROYECTOS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][6] === "Activo") {
      actualizarMetricasProyecto(data[i][0]);
    }
  }
}
