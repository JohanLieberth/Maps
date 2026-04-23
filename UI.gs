/**
 * INTERFAZ DE USUARIO Y MENÚS
 */

/**
 * Lanza el diálogo para nuevo proyecto
 */
function mostrarDialogoNuevoProyecto() {
  const html = HtmlService.createHtmlOutputFromFile('Form_NuevoProyecto')
    .setWidth(450)
    .setHeight(500)
    .setTitle('Nuevo Proyecto VSM');
  SpreadsheetApp.getUi().showModalDialog(html, 'Configuración de Proyecto');
}

/**
 * Lanza el diálogo para agregar paso
 */
function mostrarDialogoAgregarPaso() {
  const html = HtmlService.createHtmlOutputFromFile('Form_NuevoPaso')
    .setWidth(500)
    .setHeight(600)
    .setTitle('Agregar Actividad al Mapa');
  SpreadsheetApp.getUi().showModalDialog(html, 'Registro de Paso');
}

/**
 * Wrapper para duplicación desde menú (pide ID)
 */
function ejecutarDuplicacion() {
  const ui = SpreadsheetApp.getUi();
  const respuesta = ui.prompt('Duplicar Escenario', 'Ingrese el ID del Proyecto (ej: VSM-2026-0001):', ui.ButtonSet.OK_CANCEL);

  if (respuesta.getSelectedButton() == ui.Button.OK) {
    const res = duplicarMapaComoPropuesto(respuesta.getResponseText());
    ui.alert(res.mensaje);
  }
}

/**
 * Muestra comparativa rápida
 */
function mostrarComparativa() {
  const ui = SpreadsheetApp.getUi();
  const respuesta = ui.prompt('Comparar Escenarios', 'ID del Proyecto:', ui.ButtonSet.OK_CANCEL);

  if (respuesta.getSelectedButton() == ui.Button.OK) {
    const comp = compararEscenarios(respuesta.getResponseText());
    if (comp) {
      const msg = `Proyecto: ${comp.nombre}\n\n` +
                  `ACTUAL -> Lead Time: ${comp.actual.leadTime.toFixed(2)}h | PCE: ${(comp.actual.pce * 100).toFixed(1)}%\n` +
                  `PROPUESTO -> Lead Time: ${comp.propuesto.leadTime.toFixed(2)}h | PCE: ${(comp.propuesto.pce * 100).toFixed(1)}%\n\n` +
                  `AHORRO ESTIMADO: ${comp.ahorro.toFixed(2)} días-hombre.`;
      ui.alert('Resumen Comparativo', msg, ui.ButtonSet.OK);
    } else {
      ui.alert('Proyecto no encontrado.');
    }
  }
}

/**
 * Wrapper para consolidación
 */
function ejecutarConsolidacion() {
  const ui = SpreadsheetApp.getUi();
  const respuesta = ui.prompt('Consolidar Proyecto', 'ID del Proyecto:', ui.ButtonSet.OK_CANCEL);

  if (respuesta.getSelectedButton() == ui.Button.OK) {
    const res = consolidarPropuesta(respuesta.getResponseText());
    ui.alert(res.mensaje);
  }
}

/**
 * Genera PDF de la hoja VSM correspondiente
 */
function ejecutarReportePDF() {
  const ui = SpreadsheetApp.getUi();
  const respuesta = ui.prompt('Generar Reporte', 'ID del Proyecto:', ui.ButtonSet.OK_CANCEL);

  if (respuesta.getSelectedButton() == ui.Button.OK) {
    const id = respuesta.getResponseText();
    const sheetName = `VSM_${id}`;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      ui.alert("No se encontró el mapa visual para este proyecto.");
      return;
    }

    ui.alert("Generando PDF...", "El reporte PDF se guardará en su Google Drive.", ui.ButtonSet.OK);

    try {
      const folder = DriveApp.getRootFolder();
      const pdf = DriveApp.getFileById(ss.getId()).getAs('application/pdf').setName(`Reporte_VSM_${id}.pdf`);
      folder.createFile(pdf);
      ui.alert("Éxito", "Archivo guardado en la raíz de su Drive.", ui.ButtonSet.OK);
    } catch (e) {
      ui.alert("Error al generar PDF: " + e.toString());
    }
  }
}
