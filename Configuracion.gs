/**
 * CONFIGURACIÓN Y CONSTANTES
 *
 * Contiene las definiciones globales y nombres de rangos/hojas.
 */

const CONFIG = {
  HOJAS: {
    PROYECTOS: "Proyectos",
    PASOS: "Pasos",
    CONFIGURACION: "Configuracion",
    DASHBOARD: "Dashboard_KPIs",
    AUDITORIA: "Auditoria"
  },
  COLUMNAS: {
    PROYECTOS: {
      ID: 1, // A
      NOMBRE: 2, // B
      AREA: 3,
      RESP_NOMBRE: 4,
      RESP_EMAIL: 5,
      FECHA_INICIO: 6,
      FECHA_MOD: 7,
      ESTADO: 8,
      TIPO_MAPA: 8,
      URL_ACTUAL: 17, // Q
      URL_PROPUESTO: 18 // R
    },
    PASOS: {
      ID_REGISTRO: 1,
      ID_PROYECTO_FK: 2,
      ID_PASO_PROY: 3,
      ORDEN: 4,
      ESCENARIO: 5,
      NOMBRE: 6,
      ETIQUETA_VALOR: 7,
      TIEMPO_TRABAJO: 10, // J
      TIEMPO_ESPERA: 11, // K
      LEAD_TIME: 12, // L
      DESPERDICIO: 13,
      ESTADO: 21 // U
    }
  },
  ESTADOS_PROYECTO: ["Activo", "En Pausa", "Completado", "Archivado"],
  TIPOS_VALOR: ["VA", "VNA-N", "VNA"],
  ESCENARIOS: ["Actual", "Propuesto"],
  ID_PREFIJO_PROY: "VSM-",
  ID_PREFIJO_PASO: "PASO-"
};

/**
 * Obtiene parámetros de la hoja de Configuración
 */
function getParametro(paramName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.HOJAS.CONFIGURACION);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();

  for (let i = 0; i < data.length; i++) {
    if (data[i][1] === paramName) {
      return data[i][2];
    }
  }
  return null;
}
