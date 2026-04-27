/**
 * ARCHIVO PRINCIPAL DE ENTRADA
 * Proyecto: Gestor de VSM Lean para Administraciones Públicas
 */

/**
 * Servir la interfaz web (Web App)
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('VSM Lean - Panel de Gestión')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Función para incluir fragmentos HTML
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('VSM Lean')
    .addSubMenu(ui.createMenu('Proyectos')
      .addItem('Nuevo Proyecto', 'mostrarDialogoNuevoProyecto')
      .addItem('Actualizar Estado', 'mostrarDialogoEstadoProyecto'))
    .addSubMenu(ui.createMenu('Pasos')
      .addItem('Agregar Paso', 'mostrarDialogoAgregarPaso'))
    .addSubMenu(ui.createMenu('Escenarios')
      .addItem('Duplicar como Propuesto', 'ejecutarDuplicacion')
      .addItem('Comparar Metricas', 'mostrarComparativa')
      .addItem('Consolidar Propuesta', 'ejecutarConsolidacion'))
    .addSeparator()
    .addItem('Actualizar Dashboard', 'actualizarDashboard')
    .addItem('Generar Reporte PDF', 'ejecutarReportePDF')
    .addToUi();
}

/**
 * Función de inicialización para crear hojas si no existen
 */
function inicializarHerramienta() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojasNecesarias = [
    CONFIG.HOJAS.PROYECTOS,
    CONFIG.HOJAS.PASOS,
    CONFIG.HOJAS.CONFIGURACION,
    CONFIG.HOJAS.DASHBOARD,
    CONFIG.HOJAS.AUDITORIA
  ];

  hojasNecesarias.forEach(nombre => {
    if (!ss.getSheetByName(nombre)) {
      ss.insertSheet(nombre);
    }
  });

  // Configuración inicial por defecto
  const confSheet = ss.getSheetByName(CONFIG.HOJAS.CONFIGURACION);
  if (confSheet.getLastRow() < 2) {
    confSheet.appendRow(["Sección", "Parámetro", "Valor"]);
    confSheet.appendRow(["Constantes", "JORNADA_HORAS", 8]);
    confSheet.appendRow(["Constantes", "DIAS_LABORALES_SEMANA", 5]);
    confSheet.appendRow(["Áreas", "AREA_1", "Administración"]);
    confSheet.appendRow(["Áreas", "AREA_2", "Jurídico"]);
    confSheet.appendRow(["Áreas", "AREA_3", "Intervención"]);
    confSheet.appendRow(["Áreas", "AREA_4", "RRHH"]);
  }

  // Inicializar Proyectos
  const proySheet = ss.getSheetByName(CONFIG.HOJAS.PROYECTOS);
  if (proySheet.getLastRow() === 0) {
    proySheet.appendRow([
      "ID_Proyecto", "Nombre_Proceso", "Area_Responsable", "Responsable_Nombre", "Responsable_Email",
      "Fecha_Inicio", "Fecha_Ultima_Mod", "Estado_Proyecto", "Tipo_Mapa",
      "Total_Pasos_Actual", "Total_Pasos_Propuesto", "Lead_Time_Actual_Hrs",
      "Lead_Time_Propuesto_Hrs", "PCE_Actual_%", "PCE_Propuesto_%",
      "Dias_Hombre_Ahorrados", "URL_Mapa_Actual", "URL_Mapa_Propuesto", "Observaciones_Generales"
    ]);
  }

  // Inicializar Pasos
  const pasosSheet = ss.getSheetByName(CONFIG.HOJAS.PASOS);
  if (pasosSheet.getLastRow() === 0) {
    pasosSheet.appendRow([
      "ID_Registro", "ID_Proyecto_FK", "ID_Paso_Proyecto", "Orden_Secuencia",
      "Escenario", "Nombre_Actividad", "Etiqueta_Valor", "Area_Ejecutora",
      "Responsable_Paso", "Tiempo_Actividad_Min", "Tiempo_Espera_Min",
      "Lead_Time_Paso_Min", "Tipo_Desperdicio", "Causa_Raiz", "Cuello_Botella",
      "Severidad_Cuello", "Accion_Mejora", "Impacto_Estimado", "Fecha_Registro",
      "Autor_Registro", "Estado_Paso"
    ]);
  }
}
