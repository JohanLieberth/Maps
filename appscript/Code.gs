/**
 * Google Apps Script BPM System
 * Logic for managing data in Google Sheets
 */

const SHEETS = {
  PROCESSES: 'Procesos',
  STEPS: 'Pasos',
  RACI: 'RACI'
};

function getSS() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("No se pudo obtener la hoja de cálculo activa. Asegúrate de que el script esté vinculado a un Google Sheet.");
  return ss;
}

function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('BPM System')
      .addItem('Abrir App', 'showApp')
      .addToUi();
}

function showApp() {
  const html = HtmlService.createHtmlOutputFromFile('index')
      .setTitle('Sistema BPM')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  SpreadsheetApp.getUi().showSidebar(html);
}

function doGet() {
  return HtmlService.createTemplateFromFile('index').evaluate()
      .setTitle('BPM System')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function initSheets() {
  const ss = getSS();
  Object.values(SHEETS).forEach(name => {
    if (!ss.getSheetByName(name)) {
      const sheet = ss.insertSheet(name);
      if (name === SHEETS.PROCESSES) {
        sheet.appendRow(['ID', 'Nombre', 'Área', 'Fecha', 'Estado', 'Costo_Por_Hora']);
      } else if (name === SHEETS.STEPS) {
        sheet.appendRow(['ID', 'Proceso_ID', 'Orden', 'Nombre', 'Tiempo_Ciclo', 'Tiempo_Espera', 'Tipo_Valor', 'Calidad', 'Simplificar', 'Tiempo_Nuevo', 'Impacto', 'Esfuerzo', 'Mejora']);
      } else if (name === SHEETS.RACI) {
        sheet.appendRow(['ID', 'Proceso_ID', 'Actividad', 'Persona', 'R', 'A', 'C', 'I']);
      }
    }
  });
}

// Data fetching helpers
function getData(sheetName) {
  const ss = getSS();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  return data.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function getProcesses() {
  return getData(SHEETS.PROCESSES);
}

function getSteps(processId) {
  return getData(SHEETS.STEPS).filter(s => s.Proceso_ID == processId).sort((a,b) => a.Orden - b.Orden);
}

function getRaci(processId) {
  return getData(SHEETS.RACI).filter(r => r.Proceso_ID == processId);
}

// Creation functions
function createProcess(name, area, cost) {
  const ss = getSS();
  const sheet = ss.getSheetByName(SHEETS.PROCESSES);
  const id = new Date().getTime();
  sheet.appendRow([id, name, area, new Date(), 'Activo', cost]);
  return id;
}

function addStep(processId, stepData) {
  const ss = getSS();
  const sheet = ss.getSheetByName(SHEETS.STEPS);
  const id = new Date().getTime();
  sheet.appendRow([
    id, processId, stepData.order, stepData.name, stepData.cycle_time,
    stepData.wait_time, stepData.value_type, stepData.quality, false,
    stepData.cycle_time, 5, 5, ''
  ]);
  return id;
}

function updateStepSimplification(stepId, data) {
  const ss = getSS();
  const sheet = ss.getSheetByName(SHEETS.STEPS);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] == stepId) {
      sheet.getRange(i + 1, 9, 1, 5).setValues([[
        data.simplify, data.new_time, data.impact, data.effort, data.improvement_type
      ]]);
      break;
    }
  }
}

function saveRaciAssignment(processId, activity, persona, roles) {
  const ss = getSS();
  const sheet = ss.getSheetByName(SHEETS.RACI);
  const rows = sheet.getDataRange().getValues();
  let found = false;
  const id = new Date().getTime();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1] == processId && rows[i][2] == activity && rows[i][3] == persona) {
      sheet.getRange(i + 1, 5, 1, 4).setValues([[
        roles.includes('R'), roles.includes('A'), roles.includes('C'), roles.includes('I')
      ]]);
      found = true;
      break;
    }
  }

  if (!found) {
    sheet.appendRow([
      id, processId, activity, persona,
      roles.includes('R'), roles.includes('A'), roles.includes('C'), roles.includes('I')
    ]);
  }
}
