/**
 * SISTEMA DE QUINIELA MUNDIAL 2026
 * Desarrollado por Jules
 */

const CONFIG = {
  PUNTOS_MARCADOR_EXACTO: 5,
  PUNTOS_ACIERTA_GANADOR: 2,
  PUNTOS_ERROR: -1,
  PUNTOS_BONUS_ELIMINATORIA: 3,
  HORAS_CIERRE_PRONOSTICO: 24,
  ZONA_HORARIA: 'America/Mexico_City',
  TORNEO_NOMBRE: 'Quiniela Mundial 2026'
};

/**
 * Función inicial para crear las hojas necesarias
 */
function inicializarSistema() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojas = [
    { nombre: 'Configuracion', headers: ['Parametro', 'Valor'] },
    { nombre: 'Equipos', headers: ['ID_Equipo', 'Nombre_Equipo', 'Bandera', 'Grupo'] },
    { nombre: 'Partidos', headers: ['ID_Partido', 'Fase', 'Grupo', 'Fecha', 'Hora_UTC', 'Equipo_Local', 'Bandera_Local', 'Equipo_Visita', 'Bandera_Visita', 'Gol_Local_Real', 'Gol_Visita_Real', 'Estado', 'Fecha_Cierre', 'Llave', 'Match_Num'] },
    { nombre: 'Participantes', headers: ['Email', 'Nombre', 'Alias', 'Puntos_Totales', 'Aciertos_Exactos', 'Aciertos_Ganador', 'Errores', 'Fecha_Registro'] },
    { nombre: 'Pronosticos', headers: ['ID_Pronostico', 'Email_Participante', 'ID_Partido', 'Gol_Local', 'Gol_Visita', 'Fecha_Registro', 'Puntos_Obtenidos', 'Calculado'] },
    { nombre: 'Log_Errores', headers: ['Fecha', 'Funcion', 'Error', 'Detalle'] }
  ];

  hojas.forEach(h => {
    let sheet = ss.getSheetByName(h.nombre);
    if (!sheet) {
      sheet = ss.insertSheet(h.nombre);
      sheet.appendRow(h.headers);
      sheet.getRange(1, 1, 1, h.headers.length).setFontWeight('bold').setBackground('#C9A227').setFontColor('white');
    }
  });

  // Poblar Configuración por defecto
  const configSheet = ss.getSheetByName('Configuracion');
  if (configSheet.getLastRow() === 1) {
    const data = [
      ['PUNTOS_MARCADOR_EXACTO', 5],
      ['PUNTOS_ACIERTA_GANADOR', 2],
      ['PUNTOS_ERROR', -1],
      ['PUNTOS_BONUS_ELIMINATORIA', 3],
      ['HORAS_CIERRE_PRONOSTICO', 24],
      ['ADMIN_EMAIL', Session.getEffectiveUser().getEmail()],
      ['ZONA_HORARIA', 'America/Mexico_City'],
      ['TORNEO_NOMBRE', 'Quiniela Mundial 2026']
    ];
    configSheet.getRange(2, 1, data.length, 2).setValues(data);
  }
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⚽ Quiniela Mundial 2026')
    .addItem('🌐 Abrir Web App', 'abrirWebApp')
    .addItem('🔄 Actualizar Resultados API', 'actualizarResultadosAPI')
    .addItem('🏆 Actualizar Fase Eliminatoria', 'actualizarFaseEliminatoria')
    .addItem('📊 Recalcular Puntos', 'recalcularTodosLosPuntos')
    .addItem('📧 Notificar Resultados', 'enviarNotificaciones')
    .addItem('🧪 Insertar Datos de Prueba', 'seedPartidos')
    .addToUi();
}

function abrirWebApp() {
  const url = ScriptApp.getService().getUrl();
  const html = HtmlService.createHtmlOutput('<html><script>window.open("' + url + '", "_blank");google.script.host.close();</script></html>')
    .setWidth(300)
    .setHeight(100);
  SpreadsheetApp.getUi().showModalDialog(html, 'Abriendo Web App...');
}

function doGet(e) {
  const page = e.parameter.p || 'Index';
  const config = getConfig();

  // Seguridad: Solo el admin puede ver la página de Admin
  if (page === 'Admin' && Session.getEffectiveUser().getEmail() !== config.ADMIN_EMAIL) {
    return HtmlService.createHtmlOutput('<h1>Acceso Denegado</h1>');
  }

  return HtmlService.createTemplateFromFile(page)
    .evaluate()
    .setTitle(CONFIG.TORNEO_NOMBRE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// --- FUNCIONES DE BASE DE DATOS ---

function getSheetData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  return data.map(row => {
    const obj = {};
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  });
}

function getConfig() {
  const data = getSheetData('Configuracion');
  const config = {};
  data.forEach(row => config[row.Parametro] = row.Valor);
  return config;
}

// --- LOGICA DE EQUIPOS Y PARTIDOS ---

function seedPartidos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Limpiar y resetear Equipos
  const equipoSheet = ss.getSheetByName('Equipos');
  equipoSheet.getRange(2, 1, equipoSheet.getLastRow() > 1 ? equipoSheet.getLastRow() : 1, 4).clearContent();

  const equipos = [
    [1, 'México', '🇲🇽', 'A'], [2, 'Sudáfrica', '🇿🇦', 'A'], [3, 'Corea del Sur', '🇰🇷', 'A'], [4, 'República Checa', '🇨🇿', 'A'],
    [5, 'Canadá', '🇨🇦', 'B'], [6, 'Bosnia y Herzegovina', '🇧🇦', 'B'], [7, 'Qatar', '🇶🇦', 'B'], [8, 'Suiza', '🇨🇭', 'B'],
    [9, 'Brasil', '🇧🇷', 'C'], [10, 'Marruecos', '🇲🇦', 'C'], [11, 'Haití', '🇭🇹', 'C'], [12, 'Escocia', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'C'],
    [13, 'Estados Unidos', '🇺🇸', 'D'], [14, 'Paraguay', '🇵🇾', 'D'], [15, 'Australia', '🇦🇺', 'D'], [16, 'Turquía', '🇹🇷', 'D'],
    [17, 'Alemania', '🇩🇪', 'E'], [18, 'Curazao', '🇨🇼', 'E'], [19, 'Costa de Marfil', '🇨🇮', 'E'], [20, 'Ecuador', '🇪🇨', 'E'],
    [21, 'Países Bajos', '🇳🇱', 'F'], [22, 'Japón', '🇯🇵', 'F'], [23, 'Suecia', '🇸🇪', 'F'], [24, 'Túnez', '🇹🇳', 'F'],
    [25, 'Bélgica', '🇧🇪', 'G'], [26, 'Egipto', '🇪🇬', 'G'], [27, 'Irán', '🇮🇷', 'G'], [28, 'Nueva Zelanda', '🇳🇿', 'G'],
    [29, 'España', '🇪🇸', 'H'], [30, 'Cabo Verde', '🇨🇻', 'H'], [31, 'Arabia Saudita', '🇸🇦', 'H'], [32, 'Uruguay', '🇺🇾', 'H'],
    [33, 'Francia', '🇫🇷', 'I'], [34, 'Senegal', '🇸🇳', 'I'], [35, 'Irak', '🇮🇶', 'I'], [36, 'Noruega', '🇳🇴', 'I'],
    [37, 'Argentina', '🇦🇷', 'J'], [38, 'Argelia', '🇩🇿', 'J'], [39, 'Austria', '🇦🇹', 'J'], [40, 'Jordania', '🇯🇴', 'J'],
    [41, 'Portugal', '🇵🇹', 'K'], [42, 'RD Congo', '🇨🇩', 'K'], [43, 'Uzbekistán', '🇺🇿', 'K'], [44, 'Colombia', '🇨🇴', 'K'],
    [45, 'Inglaterra', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'L'], [46, 'Croacia', '🇭🇷', 'L'], [47, 'Ghana', '🇬🇭', 'L'], [48, 'Panamá', '🇵🇦', 'L']
  ];
  equipoSheet.getRange(2, 1, equipos.length, 4).setValues(equipos);

  // Limpiar y resetear Partidos
  const partidoSheet = ss.getSheetByName('Partidos');
  partidoSheet.getRange(2, 1, partidoSheet.getLastRow() > 1 ? partidoSheet.getLastRow() : 1, 15).clearContent();

  const partidosData = [];

  // Función auxiliar para calcular fecha de cierre (24h antes)
  const getFechaCierre = (fecha, hora) => {
    const f = new Date(fecha + 'T' + hora);
    f.setHours(f.getHours() - 24);
    return f;
  };

  // GRUPO A
  partidosData.push(['M1', 'Grupos', 'A', '2026-06-11', '20:00:00-06:00', 'México', '🇲🇽', 'Corea del Sur', '🇰🇷', '', '', 'Abierto', getFechaCierre('2026-06-11', '20:00:00-06:00'), '', 1]);
  partidosData.push(['M2', 'Grupos', 'A', '2026-06-12', '15:00:00-04:00', 'Sudáfrica', '🇿🇦', 'República Checa', '🇨🇿', '', '', 'Abierto', getFechaCierre('2026-06-12', '15:00:00-04:00'), '', 2]);
  partidosData.push(['M3', 'Grupos', 'A', '2026-06-17', '15:00:00-04:00', 'República Checa', '🇨🇿', 'Corea del Sur', '🇰🇷', '', '', 'Abierto', getFechaCierre('2026-06-17', '15:00:00-04:00'), '', 3]);
  partidosData.push(['M4', 'Grupos', 'A', '2026-06-17', '20:00:00-06:00', 'México', '🇲🇽', 'Sudáfrica', '🇿🇦', '', '', 'Abierto', getFechaCierre('2026-06-17', '20:00:00-06:00'), '', 4]);
  partidosData.push(['M5', 'Grupos', 'A', '2026-06-23', '15:00:00-04:00', 'Corea del Sur', '🇰🇷', 'Sudáfrica', '🇿🇦', '', '', 'Abierto', getFechaCierre('2026-06-23', '15:00:00-04:00'), '', 5]);
  partidosData.push(['M6', 'Grupos', 'A', '2026-06-23', '20:00:00-06:00', 'República Checa', '🇨🇿', 'México', '🇲🇽', '', '', 'Abierto', getFechaCierre('2026-06-23', '20:00:00-06:00'), '', 6]);

  // GRUPO B
  partidosData.push(['M7', 'Grupos', 'B', '2026-06-12', '15:00:00-04:00', 'Canadá', '🇨🇦', 'Bosnia y Herzegovina', '🇧🇦', '', '', 'Abierto', getFechaCierre('2026-06-12', '15:00:00-04:00'), '', 7]);
  partidosData.push(['M8', 'Grupos', 'B', '2026-06-13', '12:00:00-07:00', 'Qatar', '🇶🇦', 'Suiza', '🇨🇭', '', '', 'Abierto', getFechaCierre('2026-06-13', '12:00:00-07:00'), '', 8]);
  partidosData.push(['M9', 'Grupos', 'B', '2026-06-18', '12:00:00-07:00', 'Suiza', '🇨🇭', 'Bosnia y Herzegovina', '🇧🇦', '', '', 'Abierto', getFechaCierre('2026-06-18', '12:00:00-07:00'), '', 9]);
  partidosData.push(['M10', 'Grupos', 'B', '2026-06-18', '15:00:00-07:00', 'Canadá', '🇨🇦', 'Qatar', '🇶🇦', '', '', 'Abierto', getFechaCierre('2026-06-18', '15:00:00-07:00'), '', 10]);
  partidosData.push(['M11', 'Grupos', 'B', '2026-06-24', '12:00:00-07:00', 'Bosnia y Herzegovina', '🇧🇦', 'Qatar', '🇶🇦', '', '', 'Abierto', getFechaCierre('2026-06-24', '12:00:00-07:00'), '', 11]);
  partidosData.push(['M12', 'Grupos', 'B', '2026-06-24', '12:00:00-07:00', 'Suiza', '🇨🇭', 'Canadá', '🇨🇦', '', '', 'Abierto', getFechaCierre('2026-06-24', '12:00:00-07:00'), '', 12]);

  // GRUPO C
  partidosData.push(['M13', 'Grupos', 'C', '2026-06-13', '18:00:00-04:00', 'Brasil', '🇧🇷', 'Marruecos', '🇲🇦', '', '', 'Abierto', getFechaCierre('2026-06-13', '18:00:00-04:00'), '', 13]);
  partidosData.push(['M14', 'Grupos', 'C', '2026-06-13', '21:00:00-04:00', 'Haití', '🇭🇹', 'Escocia', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '', '', 'Abierto', getFechaCierre('2026-06-13', '21:00:00-04:00'), '', 14]);
  partidosData.push(['M15', 'Grupos', 'C', '2026-06-19', '18:00:00-04:00', 'Escocia', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Marruecos', '🇲🇦', '', '', 'Abierto', getFechaCierre('2026-06-19', '18:00:00-04:00'), '', 15]);
  partidosData.push(['M16', 'Grupos', 'C', '2026-06-19', '20:30:00-04:00', 'Brasil', '🇧🇷', 'Haití', '🇭🇹', '', '', 'Abierto', getFechaCierre('2026-06-19', '20:30:00-04:00'), '', 16]);
  partidosData.push(['M17', 'Grupos', 'C', '2026-06-24', '18:00:00-04:00', 'Escocia', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Brasil', '🇧🇷', '', '', 'Abierto', getFechaCierre('2026-06-24', '18:00:00-04:00'), '', 17]);
  partidosData.push(['M18', 'Grupos', 'C', '2026-06-24', '18:00:00-04:00', 'Marruecos', '🇲🇦', 'Haití', '🇭🇹', '', '', 'Abierto', getFechaCierre('2026-06-24', '18:00:00-04:00'), '', 18]);

  // GRUPO D
  partidosData.push(['M19', 'Grupos', 'D', '2026-06-14', '16:00:00-07:00', 'Estados Unidos', '🇺🇸', 'Paraguay', '🇵🇾', '', '', 'Abierto', getFechaCierre('2026-06-14', '16:00:00-07:00'), '', 19]);
  partidosData.push(['M20', 'Grupos', 'D', '2026-06-14', '19:00:00-07:00', 'Australia', '🇦🇺', 'Turquía', '🇹🇷', '', '', 'Abierto', getFechaCierre('2026-06-14', '19:00:00-07:00'), '', 20]);
  partidosData.push(['M21', 'Grupos', 'D', '2026-06-20', '16:00:00-07:00', 'Turquía', '🇹🇷', 'Paraguay', '🇵🇾', '', '', 'Abierto', getFechaCierre('2026-06-20', '16:00:00-07:00'), '', 21]);
  partidosData.push(['M22', 'Grupos', 'D', '2026-06-20', '19:00:00-07:00', 'Estados Unidos', '🇺🇸', 'Australia', '🇦🇺', '', '', 'Abierto', getFechaCierre('2026-06-20', '19:00:00-07:00'), '', 22]);
  partidosData.push(['M23', 'Grupos', 'D', '2026-06-25', '19:00:00-07:00', 'Paraguay', '🇵🇾', 'Australia', '🇦🇺', '', '', 'Abierto', getFechaCierre('2026-06-25', '19:00:00-07:00'), '', 23]);
  partidosData.push(['M24', 'Grupos', 'D', '2026-06-25', '22:00:00-07:00', 'Turquía', '🇹🇷', 'Estados Unidos', '🇺🇸', '', '', 'Abierto', getFechaCierre('2026-06-25', '22:00:00-07:00'), '', 24]);

  // GRUPO E
  partidosData.push(['M25', 'Grupos', 'E', '2026-06-14', '16:00:00-04:00', 'Alemania', '🇩🇪', 'Curazao', '🇨🇼', '', '', 'Abierto', getFechaCierre('2026-06-14', '16:00:00-04:00'), '', 25]);
  partidosData.push(['M26', 'Grupos', 'E', '2026-06-14', '19:00:00-04:00', 'Costa de Marfil', '🇨🇮', 'Ecuador', '🇪🇨', '', '', 'Abierto', getFechaCierre('2026-06-14', '19:00:00-04:00'), '', 26]);
  partidosData.push(['M27', 'Grupos', 'E', '2026-06-20', '16:00:00-04:00', 'Ecuador', '🇪🇨', 'Curazao', '🇨🇼', '', '', 'Abierto', getFechaCierre('2026-06-20', '16:00:00-04:00'), '', 27]);
  partidosData.push(['M28', 'Grupos', 'E', '2026-06-20', '19:00:00-04:00', 'Alemania', '🇩🇪', 'Costa de Marfil', '🇨🇮', '', '', 'Abierto', getFechaCierre('2026-06-20', '19:00:00-04:00'), '', 28]);
  partidosData.push(['M29', 'Grupos', 'E', '2026-06-25', '16:00:00-04:00', 'Curazao', '🇨🇼', 'Costa de Marfil', '🇨🇮', '', '', 'Abierto', getFechaCierre('2026-06-25', '16:00:00-04:00'), '', 29]);
  partidosData.push(['M30', 'Grupos', 'E', '2026-06-25', '16:00:00-04:00', 'Ecuador', '🇪🇨', 'Alemania', '🇩🇪', '', '', 'Abierto', getFechaCierre('2026-06-25', '16:00:00-04:00'), '', 30]);

  // GRUPO F
  partidosData.push(['M31', 'Grupos', 'F', '2026-06-14', '15:00:00-05:00', 'Países Bajos', '🇳🇱', 'Japón', '🇯🇵', '', '', 'Abierto', getFechaCierre('2026-06-14', '15:00:00-05:00'), '', 31]);
  partidosData.push(['M32', 'Grupos', 'F', '2026-06-14', '20:00:00-06:00', 'Suecia', '🇸🇪', 'Túnez', '🇹🇳', '', '', 'Abierto', getFechaCierre('2026-06-14', '20:00:00-06:00'), '', 32]);
  partidosData.push(['M33', 'Grupos', 'F', '2026-06-20', '12:00:00-05:00', 'Países Bajos', '🇳🇱', 'Suecia', '🇸🇪', '', '', 'Abierto', getFechaCierre('2026-06-20', '12:00:00-05:00'), '', 33]);
  partidosData.push(['M34', 'Grupos', 'F', '2026-06-20', '22:00:00-06:00', 'Túnez', '🇹🇳', 'Japón', '🇯🇵', '', '', 'Abierto', getFechaCierre('2026-06-20', '22:00:00-06:00'), '', 34]);
  partidosData.push(['M35', 'Grupos', 'F', '2026-06-25', '18:00:00-05:00', 'Japón', '🇯🇵', 'Suecia', '🇸🇪', '', '', 'Abierto', getFechaCierre('2026-06-25', '18:00:00-05:00'), '', 35]);
  partidosData.push(['M36', 'Grupos', 'F', '2026-06-25', '18:00:00-05:00', 'Túnez', '🇹🇳', 'Países Bajos', '🇳🇱', '', '', 'Abierto', getFechaCierre('2026-06-25', '18:00:00-05:00'), '', 36]);

  // GRUPO G
  partidosData.push(['M37', 'Grupos', 'G', '2026-06-15', '19:00:00-07:00', 'Bélgica', '🇧🇪', 'Egipto', '🇪🇬', '', '', 'Abierto', getFechaCierre('2026-06-15', '19:00:00-07:00'), '', 37]);
  partidosData.push(['M38', 'Grupos', 'G', '2026-06-15', '22:00:00-07:00', 'Irán', '🇮🇷', 'Nueva Zelanda', '🇳🇿', '', '', 'Abierto', getFechaCierre('2026-06-15', '22:00:00-07:00'), '', 38]);
  partidosData.push(['M39', 'Grupos', 'G', '2026-06-21', '16:00:00-07:00', 'Nueva Zelanda', '🇳🇿', 'Egipto', '🇪🇬', '', '', 'Abierto', getFechaCierre('2026-06-21', '16:00:00-07:00'), '', 39]);
  partidosData.push(['M40', 'Grupos', 'G', '2026-06-21', '19:00:00-07:00', 'Bélgica', '🇧🇪', 'Irán', '🇮🇷', '', '', 'Abierto', getFechaCierre('2026-06-21', '19:00:00-07:00'), '', 40]);
  partidosData.push(['M41', 'Grupos', 'G', '2026-06-26', '19:00:00-07:00', 'Egipto', '🇪🇬', 'Irán', '🇮🇷', '', '', 'Abierto', getFechaCierre('2026-06-26', '19:00:00-07:00'), '', 41]);
  partidosData.push(['M42', 'Grupos', 'G', '2026-06-26', '22:00:00-07:00', 'Nueva Zelanda', '🇳🇿', 'Bélgica', '🇧🇪', '', '', 'Abierto', getFechaCierre('2026-06-26', '22:00:00-07:00'), '', 42]);

  // GRUPO H
  partidosData.push(['M43', 'Grupos', 'H', '2026-06-15', '14:00:00-06:00', 'España', '🇪🇸', 'Cabo Verde', '🇨🇻', '', '', 'Abierto', getFechaCierre('2026-06-15', '14:00:00-06:00'), '', 43]);
  partidosData.push(['M44', 'Grupos', 'H', '2026-06-15', '17:00:00-06:00', 'Arabia Saudita', '🇸🇦', 'Uruguay', '🇺🇾', '', '', 'Abierto', getFechaCierre('2026-06-15', '17:00:00-06:00'), '', 44]);
  partidosData.push(['M45', 'Grupos', 'H', '2026-06-21', '14:00:00-06:00', 'Uruguay', '🇺🇾', 'Cabo Verde', '🇨🇻', '', '', 'Abierto', getFechaCierre('2026-06-21', '14:00:00-06:00'), '', 45]);
  partidosData.push(['M46', 'Grupos', 'H', '2026-06-21', '17:00:00-06:00', 'España', '🇪🇸', 'Arabia Saudita', '🇸🇦', '', '', 'Abierto', getFechaCierre('2026-06-21', '17:00:00-06:00'), '', 46]);
  partidosData.push(['M47', 'Grupos', 'H', '2026-06-26', '20:00:00-06:00', 'Cabo Verde', '🇨🇻', 'Arabia Saudita', '🇸🇦', '', '', 'Abierto', getFechaCierre('2026-06-26', '20:00:00-06:00'), '', 47]);
  partidosData.push(['M48', 'Grupos', 'H', '2026-06-26', '20:00:00-06:00', 'Uruguay', '🇺🇾', 'España', '🇪🇸', '', '', 'Abierto', getFechaCierre('2026-06-26', '20:00:00-06:00'), '', 48]);

  // GRUPO I
  partidosData.push(['M49', 'Grupos', 'I', '2026-06-16', '15:00:00-04:00', 'Francia', '🇫🇷', 'Senegal', '🇸🇳', '', '', 'Abierto', getFechaCierre('2026-06-16', '15:00:00-04:00'), '', 49]);
  partidosData.push(['M50', 'Grupos', 'I', '2026-06-16', '18:00:00-04:00', 'Irak', '🇮🇶', 'Noruega', '🇳🇴', '', '', 'Abierto', getFechaCierre('2026-06-16', '18:00:00-04:00'), '', 50]);
  partidosData.push(['M51', 'Grupos', 'I', '2026-06-22', '17:00:00-04:00', 'Francia', '🇫🇷', 'Irak', '🇮🇶', '', '', 'Abierto', getFechaCierre('2026-06-22', '17:00:00-04:00'), '', 51]);
  partidosData.push(['M52', 'Grupos', 'I', '2026-06-22', '20:00:00-04:00', 'Noruega', '🇳🇴', 'Senegal', '🇸🇳', '', '', 'Abierto', getFechaCierre('2026-06-22', '20:00:00-04:00'), '', 52]);
  partidosData.push(['M53', 'Grupos', 'I', '2026-06-26', '15:00:00-04:00', 'Senegal', '🇸🇳', 'Irak', '🇮🇶', '', '', 'Abierto', getFechaCierre('2026-06-26', '15:00:00-04:00'), '', 53]);
  partidosData.push(['M54', 'Grupos', 'I', '2026-06-26', '15:00:00-04:00', 'Noruega', '🇳🇴', 'Francia', '🇫🇷', '', '', 'Abierto', getFechaCierre('2026-06-26', '15:00:00-04:00'), '', 54]);

  // GRUPO J
  partidosData.push(['M55', 'Grupos', 'J', '2026-06-16', '20:00:00-05:00', 'Argentina', '🇦🇷', 'Argelia', '🇩🇿', '', '', 'Abierto', getFechaCierre('2026-06-16', '20:00:00-05:00'), '', 55]);
  partidosData.push(['M56', 'Grupos', 'J', '2026-06-16', '21:00:00-07:00', 'Austria', '🇦🇹', 'Jordania', '🇯🇴', '', '', 'Abierto', getFechaCierre('2026-06-16', '21:00:00-07:00'), '', 56]);
  partidosData.push(['M57', 'Grupos', 'J', '2026-06-22', '12:00:00-05:00', 'Argentina', '🇦🇷', 'Austria', '🇦🇹', '', '', 'Abierto', getFechaCierre('2026-06-22', '12:00:00-05:00'), '', 57]);
  partidosData.push(['M58', 'Grupos', 'J', '2026-06-22', '20:00:00-07:00', 'Jordania', '🇯🇴', 'Argelia', '🇩🇿', '', '', 'Abierto', getFechaCierre('2026-06-22', '20:00:00-07:00'), '', 58]);
  partidosData.push(['M59', 'Grupos', 'J', '2026-06-27', '21:00:00-05:00', 'Argelia', '🇩🇿', 'Austria', '🇦🇹', '', '', 'Abierto', getFechaCierre('2026-06-27', '21:00:00-05:00'), '', 59]);
  partidosData.push(['M60', 'Grupos', 'J', '2026-06-27', '21:00:00-05:00', 'Jordania', '🇯🇴', 'Argentina', '🇦🇷', '', '', 'Abierto', getFechaCierre('2026-06-27', '21:00:00-05:00'), '', 60]);

  // GRUPO K
  partidosData.push(['M61', 'Grupos', 'K', '2026-06-17', '12:00:00-05:00', 'Portugal', '🇵🇹', 'RD Congo', '🇨🇩', '', '', 'Abierto', getFechaCierre('2026-06-17', '12:00:00-05:00'), '', 61]);
  partidosData.push(['M62', 'Grupos', 'K', '2026-06-17', '20:00:00-06:00', 'Uzbekistán', '🇺🇿', 'Colombia', '🇨🇴', '', '', 'Abierto', getFechaCierre('2026-06-17', '20:00:00-06:00'), '', 62]);
  partidosData.push(['M63', 'Grupos', 'K', '2026-06-23', '12:00:00-05:00', 'Portugal', '🇵🇹', 'Uzbekistán', '🇺🇿', '', '', 'Abierto', getFechaCierre('2026-06-23', '12:00:00-05:00'), '', 63]);
  partidosData.push(['M64', 'Grupos', 'K', '2026-06-23', '20:00:00-06:00', 'Colombia', '🇨🇴', 'RD Congo', '🇨🇩', '', '', 'Abierto', getFechaCierre('2026-06-23', '20:00:00-06:00'), '', 64]);
  partidosData.push(['M65', 'Grupos', 'K', '2026-06-27', '19:30:00-04:00', 'Colombia', '🇨🇴', 'Portugal', '🇵🇹', '', '', 'Abierto', getFechaCierre('2026-06-27', '19:30:00-04:00'), '', 65]);
  partidosData.push(['M66', 'Grupos', 'K', '2026-06-27', '19:30:00-04:00', 'RD Congo', '🇨🇩', 'Uzbekistán', '🇺🇿', '', '', 'Abierto', getFechaCierre('2026-06-27', '19:30:00-04:00'), '', 66]);

  // GRUPO L
  partidosData.push(['M67', 'Grupos', 'L', '2026-06-17', '14:00:00-04:00', 'Inglaterra', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croacia', '🇭🇷', '', '', 'Abierto', getFechaCierre('2026-06-17', '14:00:00-04:00'), '', 67]);
  partidosData.push(['M68', 'Grupos', 'L', '2026-06-17', '17:00:00-04:00', 'Ghana', '🇬🇭', 'Panamá', '🇵🇦', '', '', 'Abierto', getFechaCierre('2026-06-17', '17:00:00-04:00'), '', 68]);
  partidosData.push(['M69', 'Grupos', 'L', '2026-06-23', '14:00:00-04:00', 'Croacia', '🇭🇷', 'Panamá', '🇵🇦', '', '', 'Abierto', getFechaCierre('2026-06-23', '14:00:00-04:00'), '', 69]);
  partidosData.push(['M70', 'Grupos', 'L', '2026-06-23', '17:00:00-04:00', 'Inglaterra', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Ghana', '🇬🇭', '', '', 'Abierto', getFechaCierre('2026-06-23', '17:00:00-04:00'), '', 70]);
  partidosData.push(['M71', 'Grupos', 'L', '2026-06-27', '17:00:00-04:00', 'Panamá', '🇵🇦', 'Inglaterra', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '', '', 'Abierto', getFechaCierre('2026-06-27', '17:00:00-04:00'), '', 71]);
  partidosData.push(['M72', 'Grupos', 'L', '2026-06-27', '17:00:00-04:00', 'Ghana', '🇬🇭', 'Croacia', '🇭🇷', '', '', 'Abierto', getFechaCierre('2026-06-27', '17:00:00-04:00'), '', 72]);

  // ELIMINATORIA - RONDA DE 32
  partidosData.push(['M73', 'Ronda de 32', '', '2026-06-28', '12:00:00-07:00', '2do Grupo A', '', '2do Grupo B', '', '', '', 'Abierto', getFechaCierre('2026-06-28', '12:00:00-07:00'), '', 73]);
  partidosData.push(['M74', 'Ronda de 32', '', '2026-06-29', '12:00:00-05:00', '1ro Grupo C', '', '2do Grupo F', '', '', '', 'Abierto', getFechaCierre('2026-06-29', '12:00:00-05:00'), '', 74]);
  partidosData.push(['M75', 'Ronda de 32', '', '2026-06-29', '16:30:00-04:00', '1ro Grupo E', '', '3ro Grupos A/B/C/D/F', '', '', '', 'Abierto', getFechaCierre('2026-06-29', '16:30:00-04:00'), '', 75]);
  partidosData.push(['M76', 'Ronda de 32', '', '2026-06-29', '19:00:00-06:00', '1ro Grupo F', '', '2do Grupo C', '', '', '', 'Abierto', getFechaCierre('2026-06-29', '19:00:00-06:00'), '', 76]);
  partidosData.push(['M77', 'Ronda de 32', '', '2026-06-30', '12:00:00-05:00', '2do Grupo E', '', '2do Grupo I', '', '', '', 'Abierto', getFechaCierre('2026-06-30', '12:00:00-05:00'), '', 77]);
  partidosData.push(['M78', 'Ronda de 32', '', '2026-06-30', '17:00:00-04:00', '1ro Grupo I', '', '3ro Grupos C/D/F/G/H', '', '', '', 'Abierto', getFechaCierre('2026-06-30', '17:00:00-04:00'), '', 78]);
  partidosData.push(['M79', 'Ronda de 32', '', '2026-06-30', '19:00:00-06:00', '1ro Grupo A', '', '3ro Grupos C/E/F/H/I', '', '', '', 'Abierto', getFechaCierre('2026-06-30', '19:00:00-06:00'), '', 79]);
  partidosData.push(['M80', 'Ronda de 32', '', '2026-07-01', '12:00:00-04:00', '1ro Grupo L', '', '3ro Grupos E/H/I/J/K', '', '', '', 'Abierto', getFechaCierre('2026-07-01', '12:00:00-04:00'), '', 80]);
  partidosData.push(['M81', 'Ronda de 32', '', '2026-07-01', '13:00:00-07:00', '1ro Grupo G', '', '3ro Grupos A/E/H/I/J', '', '', '', 'Abierto', getFechaCierre('2026-07-01', '13:00:00-07:00'), '', 81]);
  partidosData.push(['M82', 'Ronda de 32', '', '2026-07-01', '17:00:00-07:00', '1ro Grupo D', '', '3ro Grupos B/E/F/I/J', '', '', '', 'Abierto', getFechaCierre('2026-07-01', '17:00:00-07:00'), '', 82]);
  partidosData.push(['M83', 'Ronda de 32', '', '2026-07-02', '12:00:00-07:00', '1ro Grupo H', '', '2do Grupo J', '', '', '', 'Abierto', getFechaCierre('2026-07-02', '12:00:00-07:00'), '', 83]);
  partidosData.push(['M84', 'Ronda de 32', '', '2026-07-02', '19:00:00-04:00', '2do Grupo K', '', '2do Grupo L', '', '', '', 'Abierto', getFechaCierre('2026-07-02', '19:00:00-04:00'), '', 84]);
  partidosData.push(['M85', 'Ronda de 32', '', '2026-07-02', '20:00:00-07:00', '1ro Grupo B', '', '3ro Grupos E/F/G/I/J', '', '', '', 'Abierto', getFechaCierre('2026-07-02', '20:00:00-07:00'), '', 85]);
  partidosData.push(['M86', 'Ronda de 32', '', '2026-07-03', '13:00:00-05:00', '2do Grupo D', '', '2do Grupo G', '', '', '', 'Abierto', getFechaCierre('2026-07-03', '13:00:00-05:00'), '', 86]);
  partidosData.push(['M87', 'Ronda de 32', '', '2026-07-03', '18:00:00-04:00', '1ro Grupo J', '', '2do Grupo H', '', '', '', 'Abierto', getFechaCierre('2026-07-03', '18:00:00-04:00'), '', 87]);
  partidosData.push(['M88', 'Ronda de 32', '', '2026-07-03', '20:30:00-05:00', '1ro Grupo K', '', '3ro Grupos D/E/I/J/L', '', '', '', 'Abierto', getFechaCierre('2026-07-03', '20:30:00-05:00'), '', 88]);

  // OCTAVOS DE FINAL
  partidosData.push(['M89', 'Octavos', '', '2026-07-04', '13:00:00-05:00', 'Ganador M73', '', 'Ganador M75', '', '', '', 'Abierto', getFechaCierre('2026-07-04', '13:00:00-05:00'), '', 89]);
  partidosData.push(['M90', 'Octavos', '', '2026-07-04', '17:00:00-04:00', 'Ganador M74', '', 'Ganador M77', '', '', '', 'Abierto', getFechaCierre('2026-07-04', '17:00:00-04:00'), '', 90]);
  partidosData.push(['M91', 'Octavos', '', '2026-07-05', '16:00:00-04:00', 'Ganador M76', '', 'Ganador M78', '', '', '', 'Abierto', getFechaCierre('2026-07-05', '16:00:00-04:00'), '', 91]);
  partidosData.push(['M92', 'Octavos', '', '2026-07-05', '20:00:00-06:00', 'Ganador M79', '', 'Ganador M80', '', '', '', 'Abierto', getFechaCierre('2026-07-05', '20:00:00-06:00'), '', 92]);
  partidosData.push(['M93', 'Octavos', '', '2026-07-06', '15:00:00-05:00', 'Ganador M81', '', 'Ganador M82', '', '', '', 'Abierto', getFechaCierre('2026-07-06', '15:00:00-05:00'), '', 93]);
  partidosData.push(['M94', 'Octavos', '', '2026-07-06', '20:00:00-07:00', 'Ganador M83', '', 'Ganador M84', '', '', '', 'Abierto', getFechaCierre('2026-07-06', '20:00:00-07:00'), '', 94]);
  partidosData.push(['M95', 'Octavos', '', '2026-07-07', '12:00:00-04:00', 'Ganador M85', '', 'Ganador M86', '', '', '', 'Abierto', getFechaCierre('2026-07-07', '12:00:00-04:00'), '', 95]);
  partidosData.push(['M96', 'Octavos', '', '2026-07-07', '16:00:00-07:00', 'Ganador M87', '', 'Ganador M88', '', '', '', 'Abierto', getFechaCierre('2026-07-07', '16:00:00-07:00'), '', 96]);

  // CUARTOS DE FINAL
  partidosData.push(['M97', 'Cuartos', '', '2026-07-09', '16:00:00-04:00', 'Ganador M89', '', 'Ganador M90', '', '', '', 'Abierto', getFechaCierre('2026-07-09', '16:00:00-04:00'), '', 97]);
  partidosData.push(['M98', 'Cuartos', '', '2026-07-10', '15:00:00-07:00', 'Ganador M93', '', 'Ganador M94', '', '', '', 'Abierto', getFechaCierre('2026-07-10', '15:00:00-07:00'), '', 98]);
  partidosData.push(['M99', 'Cuartos', '', '2026-07-10', '20:00:00-04:00', 'Ganador M91', '', 'Ganador M92', '', '', '', 'Abierto', getFechaCierre('2026-07-10', '20:00:00-04:00'), '', 99]);
  partidosData.push(['M100', 'Cuartos', '', '2026-07-11', '20:00:00-04:00', 'Ganador M95', '', 'Ganador M96', '', '', '', 'Abierto', getFechaCierre('2026-07-11', '20:00:00-04:00'), '', 100]);

  // SEMIFINALES
  partidosData.push(['M101', 'Semifinales', '', '2026-07-14', '20:00:00-04:00', 'Ganador M97', '', 'Ganador M98', '', '', '', 'Abierto', getFechaCierre('2026-07-14', '20:00:00-04:00'), '', 101]);
  partidosData.push(['M102', 'Semifinales', '', '2026-07-15', '20:00:00-04:00', 'Ganador M99', '', 'Ganador M100', '', '', '', 'Abierto', getFechaCierre('2026-07-15', '20:00:00-04:00'), '', 102]);

  // TERCER PUESTO
  partidosData.push(['M103', 'Tercer Puesto', '', '2026-07-18', '16:00:00-04:00', 'Perdedor M101', '', 'Perdedor M102', '', '', '', 'Abierto', getFechaCierre('2026-07-18', '16:00:00-04:00'), '', 103]);

  // FINAL
  partidosData.push(['M104', 'Final', '', '2026-07-19', '15:00:00-04:00', 'Ganador M101', '', 'Ganador M102', '', '', '', 'Abierto', getFechaCierre('2026-07-19', '15:00:00-04:00'), '', 104]);

  partidoSheet.getRange(2, 1, partidosData.length, 15).setValues(partidosData);
}

// --- AUTENTICACIÓN Y PARTICIPANTES ---

function registrarParticipante(email, nombre, alias) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Participantes');
    const data = sheet.getDataRange().getValues();

    // Validar duplicados
    const participante = data.find(row => row[0] === email);
    if (participante) {
      return { success: true, message: '¡Bienvenido de nuevo, ' + participante[2] + '!', isExisting: true };
    }

    const aliasExiste = data.some(row => row[2] === alias);
    if (aliasExiste) return { success: false, message: 'El alias ya está en uso.' };

    sheet.appendRow([email, nombre, alias, 0, 0, 0, 0, new Date()]);
    return { success: true, message: 'Registro exitoso.', isExisting: false };
  } catch (e) {
    logError('registrarParticipante', e.message, email);
    return { success: false, message: 'Error en el servidor.' };
  }
}

function obtenerParticipante(email) {
  const data = getSheetData('Participantes');
  return data.find(p => p.Email === email) || null;
}

function obtenerRanking() {
  const data = getSheetData('Participantes');
  return data.sort((a, b) => b.Puntos_Totales - a.Puntos_Totales);
}

// --- PRONÓSTICOS ---

function guardarPronosticos(email, pronosticosArray) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Pronosticos');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    pronosticosArray.forEach(p => {
      // Validar cierre de 24h
      if (validarCierrePartido(p.idPartido)) return;

      const rowIndex = data.findIndex(row => row[1] === email && row[2] === p.idPartido);

      if (rowIndex > -1) {
        // Actualizar
        sheet.getRange(rowIndex + 1, 4).setValue(p.golLocal);
        sheet.getRange(rowIndex + 1, 5).setValue(p.golVisita);
        sheet.getRange(rowIndex + 1, 6).setValue(new Date());
      } else {
        // Insertar
        const newID = 'PRON-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000);
        sheet.appendRow([newID, email, p.idPartido, p.golLocal, p.golVisita, new Date(), 0, false]);
      }
    });

    return { success: true, message: 'Pronósticos guardados correctamente.' };
  } catch (e) {
    logError('guardarPronosticos', e.message, email);
    return { success: false, message: 'Error al guardar pronósticos.' };
  }
}

function obtenerPronosticos(email) {
  const data = getSheetData('Pronosticos');
  return data.filter(p => p.Email_Participante === email);
}

function validarCierrePartido(idPartido) {
  const partidos = getSheetData('Partidos');
  const partido = partidos.find(p => p.ID_Partido === idPartido);
  if (!partido) return true;

  const ahora = new Date();
  const fechaCierre = new Date(partido.Fecha_Cierre);
  return ahora >= fechaCierre;
}

// --- CÁLCULO Y TABLAS ---

function calcularPuntos(golesLR, golesVR, golesLP, golesVP, esEliminatoria) {
  const config = getConfig();
  let puntos = 0;
  let tipo = "";

  // 1. Marcador exacto
  if (golesLR == golesLP && golesVR == golesVP) {
    puntos = parseInt(config.PUNTOS_MARCADOR_EXACTO);
    tipo = "EXACTO";
    if (esEliminatoria) puntos += parseInt(config.PUNTOS_BONUS_ELIMINATORIA);
  }
  // 2. Acierta ganador o empate (pero no exacto)
  else if (
    (golesLR > golesVR && golesLP > golesVP) ||   // Gana local
    (golesLR < golesVR && golesLP < golesVP) ||   // Gana visita
    (golesLR == golesVR && golesLP == golesVP)    // Empate
  ) {
    puntos = parseInt(config.PUNTOS_ACIERTA_GANADOR);
    tipo = "GANADOR";
  }
  // 3. Error total
  else {
    puntos = parseInt(config.PUNTOS_ERROR);
    tipo = "ERROR";
  }

  return { puntos, tipo };
}

function recalcularTodosLosPuntos() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const partidos = getSheetData('Partidos');
    const pronosticosSheet = ss.getSheetByName('Pronosticos');
    if (pronosticosSheet.getLastRow() < 2) return { success: true, message: 'No hay pronósticos para calcular.' };

    const pronosticosData = pronosticosSheet.getDataRange().getValues();
    const headers = pronosticosData[0];
    const rows = pronosticosData.slice(1);

    const participantesMap = {};

    rows.forEach((row, index) => {
      const email = row[1];
      const idPartido = row[2];
      const golLP = row[3];
      const golVP = row[4];

      const partido = partidos.find(p => p.ID_Partido === idPartido);

      if (partido && (partido.Estado === 'Jugado' || (partido.Gol_Local_Real !== '' && partido.Gol_Local_Real !== null))) {
        const res = calcularPuntos(
          Number(partido.Gol_Local_Real),
          Number(partido.Gol_Visita_Real),
          Number(golLP),
          Number(golVP),
          partido.Fase !== 'Grupos'
        );

        // Actualizar datos en memoria para setValues posterior
        row[6] = res.puntos;
        row[7] = true;

        // Acumular para participantes
        if (!participantesMap[email]) {
          participantesMap[email] = { puntos: 0, exactos: 0, ganadores: 0, errores: 0 };
        }
        participantesMap[email].puntos += res.puntos;
        if (res.tipo === 'EXACTO') participantesMap[email].exactos++;
        else if (res.tipo === 'GANADOR') participantesMap[email].ganadores++;
        else if (res.tipo === 'ERROR') participantesMap[email].errores++;
      }
    });

    // Actualizar hoja Pronosticos en bloque
    pronosticosSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

    // Actualizar hoja Participantes en bloque
    const participantesSheet = ss.getSheetByName('Participantes');
    if (participantesSheet.getLastRow() < 2) return { success: true, message: 'Puntos calculados pero no hay participantes.' };

    const pData = participantesSheet.getDataRange().getValues();
    const pHeaders = pData[0];
    const pRows = pData.slice(1);

    pRows.forEach(row => {
      const email = row[0];
      if (participantesMap[email]) {
        row[3] = participantesMap[email].puntos;
        row[4] = participantesMap[email].exactos;
        row[5] = participantesMap[email].ganadores;
        row[6] = participantesMap[email].errores;
      }
    });

    participantesSheet.getRange(2, 1, pRows.length, pHeaders.length).setValues(pRows);

    return { success: true, message: 'Puntos recalculados exitosamente.' };
  } catch (e) {
    logError('recalcularTodosLosPuntos', e.message, '');
    return { success: false, message: 'Error al recalcular puntos: ' + e.message };
  }
}

function calcularEstadisticas(email) {
  const participante = obtenerParticipante(email);
  if (!participante) return null;
  return {
    puntos: participante.Puntos_Totales,
    exactos: participante.Aciertos_Exactos,
    ganadores: participante.Aciertos_Ganador,
    errores: participante.Errores
  };
}

function obtenerPartidosPorFase(fase) {
  return getSheetData('Partidos').filter(p => p.Fase === fase);
}

// --- AVANCE AUTOMÁTICO ---

function calcularTablaGrupo(nombreGrupo) {
  const partidos = getSheetData('Partidos').filter(p => p.Grupo === nombreGrupo);
  const equiposGrupo = getSheetData('Equipos').filter(e => e.Grupo === nombreGrupo);

  const tabla = equiposGrupo.map(e => ({
    nombre: e.Nombre_Equipo,
    bandera: e.Bandera,
    pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dg: 0, pts: 0
  }));

  partidos.forEach(p => {
    if (p.Gol_Local_Real !== '' && p.Gol_Local_Real !== null && p.Gol_Visita_Real !== '' && p.Gol_Visita_Real !== null) {
      const local = tabla.find(t => t.nombre === p.Equipo_Local);
      const visita = tabla.find(t => t.nombre === p.Equipo_Visita);

      const gl = Number(p.Gol_Local_Real);
      const gv = Number(p.Gol_Visita_Real);

      if (local && visita) {
        local.pj++; visita.pj++;
        local.gf += gl; local.gc += gv;
        visita.gf += gv; visita.gc += gl;

        if (gl > gv) {
          local.g++; local.pts += 3; visita.p++;
        } else if (gl < gv) {
          visita.g++; visita.pts += 3; local.p++;
        } else {
          local.e++; visita.e++; local.pts += 1; visita.pts += 1;
        }
        local.dg = local.gf - local.gc;
        visita.dg = visita.gf - visita.gc;
      }
    }
  });

  return tabla.sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf);
}

function actualizarFaseEliminatoria() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const grupos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const clasificados = {};
    const terceros = [];

    grupos.forEach(g => {
      const tabla = calcularTablaGrupo(g);
      clasificados[g] = {
        primero: tabla[0],
        segundo: tabla[1],
        tercero: tabla[2]
      };
      terceros.push({ ...tabla[2], grupo: g });
    });

    // Mejores 8 terceros
    const mejoresTerceros = terceros.sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf).slice(0, 8);
    const gruposTerceros = mejoresTerceros.map(t => t.grupo).sort().join('');

    const partidoSheet = ss.getSheetByName('Partidos');
    const partidos = getSheetData('Partidos');

    partidos.forEach((p, index) => {
      let localActualizado = false;
      let visitaActualizado = false;
      let nuevoLocal = p.Equipo_Local;
      let nuevaBanderaL = p.Bandera_Local;
      let nuevoVisita = p.Equipo_Visita;
      let nuevaBanderaV = p.Bandera_Visita;

      // Lógica de reemplazo de placeholders para Ronda de 32
      if (p.Fase === 'Ronda de 32') {
        // Ejemplo: "1ro Grupo A"
        const regex1ro = /1ro Grupo ([A-L])/;
        const regex2do = /2do Grupo ([A-L])/;

        if (regex1ro.test(p.Equipo_Local)) {
          const g = p.Equipo_Local.match(regex1ro)[1];
          nuevoLocal = clasificados[g].primero.nombre;
          nuevaBanderaL = clasificados[g].primero.bandera;
          localActualizado = true;
        } else if (regex2do.test(p.Equipo_Local)) {
          const g = p.Equipo_Local.match(regex2do)[1];
          nuevoLocal = clasificados[g].segundo.nombre;
          nuevaBanderaL = clasificados[g].segundo.bandera;
          localActualizado = true;
        }

        if (regex1ro.test(p.Equipo_Visita)) {
          const g = p.Equipo_Visita.match(regex1ro)[1];
          nuevoVisita = clasificados[g].primero.nombre;
          nuevaBanderaV = clasificados[g].primero.bandera;
          visitaActualizado = true;
        } else if (regex2do.test(p.Equipo_Visita)) {
          const g = p.Equipo_Visita.match(regex2do)[1];
          nuevoVisita = clasificados[g].segundo.nombre;
          nuevaBanderaV = clasificados[g].segundo.bandera;
          visitaActualizado = true;
        }

        // Lógica simplificada para terceros (Mapeo FIFA real es complejo, aquí asignamos secuencialmente para el ejemplo)
        if (p.Equipo_Visita.includes('3ro Grupos')) {
           // Buscamos un tercero que no haya sido asignado o usamos el mapeo de gruposTerceros
           // Por simplicidad en este MVP, tomamos los mejores terceros en orden
           const idxTercero = parseInt(p.ID_Partido.replace('M', '')) - 75; // Aproximación para M75, M78, M79, M80, M81, M82, M85, M88
           const mappingTerceros = { 75: 0, 78: 1, 79: 2, 80: 3, 81: 4, 82: 5, 85: 6, 88: 7 };
           const mNum = parseInt(p.ID_Partido.replace('M', ''));
           if (mappingTerceros[mNum] !== undefined) {
             const t = mejoresTerceros[mappingTerceros[mNum]];
             if (t) {
               nuevoVisita = t.nombre;
               nuevaBanderaV = t.bandera;
               visitaActualizado = true;
             }
           }
        }
      }

      if (localActualizado) {
        partidoSheet.getRange(index + 2, 6).setValue(nuevoLocal);
        partidoSheet.getRange(index + 2, 7).setValue(nuevaBanderaL);
      }
      if (visitaActualizado) {
        partidoSheet.getRange(index + 2, 8).setValue(nuevoVisita);
        partidoSheet.getRange(index + 2, 9).setValue(nuevaBanderaV);
      }
    });

    propagarGanadoresEliminatoria();
    return { success: true, message: 'Fase eliminatoria actualizada.' };
  } catch (e) {
    logError('actualizarFaseEliminatoria', e.message, '');
    return { success: false, message: 'Error al actualizar eliminatoria.' };
  }
}

function propagarGanadoresEliminatoria() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const partidoSheet = ss.getSheetByName('Partidos');
  const partidos = getSheetData('Partidos');

  const ganadores = {};
  const perdedores = {};

  partidos.forEach(p => {
    if (p.Fase !== 'Grupos' && p.Gol_Local_Real !== '' && p.Gol_Visita_Real !== '') {
      if (p.Gol_Local_Real > p.Gol_Visita_Real) {
        ganadores[p.ID_Partido] = { nombre: p.Equipo_Local, bandera: p.Bandera_Local };
        perdedores[p.ID_Partido] = { nombre: p.Equipo_Visita, bandera: p.Bandera_Visita };
      } else {
        ganadores[p.ID_Partido] = { nombre: p.Equipo_Visita, bandera: p.Bandera_Visita };
        perdedores[p.ID_Partido] = { nombre: p.Equipo_Local, bandera: p.Bandera_Local };
      }
    }
  });

  partidos.forEach((p, index) => {
    if (p.Equipo_Local.startsWith('Ganador M') || p.Equipo_Local.startsWith('Perdedor M')) {
      const matchKey = p.Equipo_Local.split(' ')[1];
      const esGanador = p.Equipo_Local.startsWith('Ganador');
      const data = esGanador ? ganadores[matchKey] : perdedores[matchKey];
      if (data) {
        partidoSheet.getRange(index + 2, 6).setValue(data.nombre);
        partidoSheet.getRange(index + 2, 7).setValue(data.bandera);
      }
    }
    if (p.Equipo_Visita.startsWith('Ganador M') || p.Equipo_Visita.startsWith('Perdedor M')) {
      const matchKey = p.Equipo_Visita.split(' ')[1];
      const esGanador = p.Equipo_Visita.startsWith('Ganador');
      const data = esGanador ? ganadores[matchKey] : perdedores[matchKey];
      if (data) {
        partidoSheet.getRange(index + 2, 8).setValue(data.nombre);
        partidoSheet.getRange(index + 2, 9).setValue(data.bandera);
      }
    }
  });
}

// --- ADMIN Y UTILIDADES ---

function actualizarResultadosAPI() {
  // Implementación simulada de API
  // En un entorno real, aquí se haría el UrlFetchApp a la API de Football
  // Por ahora, refrescamos los puntos.
  return recalcularTodosLosPuntos();
}

function actualizarResultadoManual(idPartido, golL, golV) {
  const email = Session.getEffectiveUser().getEmail();
  const config = getConfig();
  if (email !== config.ADMIN_EMAIL) return { success: false, message: 'No autorizado' };

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Partidos');
    const data = sheet.getDataRange().getValues();
    const rowIndex = data.findIndex(row => row[0] === idPartido);

    if (rowIndex > -1) {
      sheet.getRange(rowIndex + 1, 10).setValue(golL);
      sheet.getRange(rowIndex + 1, 11).setValue(golV);
      sheet.getRange(rowIndex + 1, 12).setValue('Jugado');

      recalcularTodosLosPuntos();

      // Si era de grupos, intentar actualizar eliminatoria
      if (data[rowIndex][1] === 'Grupos') {
        actualizarFaseEliminatoria();
      } else {
        propagarGanadoresEliminatoria();
      }

      return { success: true, message: 'Resultado actualizado.' };
    }
    return { success: false, message: 'Partido no encontrado.' };
  } catch (e) {
    logError('actualizarResultadoManual', e.message, idPartido);
    return { success: false, message: 'Error al actualizar.' };
  }
}

function insertarDatosPrueba() {
  registrarParticipante('juan@email.com', 'Juan', 'ElCrack');
  registrarParticipante('maria@email.com', 'Maria', 'LaMagica');
  registrarParticipante('pedro@email.com', 'Pedro', 'DonGol');

  const pronosticos = [
    { idPartido: 'M1', golLocal: 2, golVisita: 1 },
    { idPartido: 'M2', golLocal: 1, golVisita: 1 },
    { idPartido: 'M3', golLocal: 0, golVisita: 2 }
  ];

  guardarPronosticos('juan@email.com', pronosticos);

  // Simular resultados reales
  actualizarResultadoManual('M1', 2, 1); // Exacto para Juan
  actualizarResultadoManual('M2', 0, 0); // Ganador (Empate) para Juan

  recalcularTodosLosPuntos();
}

function logError(funcion, error, detalle) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Log_Errores');
  sheet.appendRow([new Date(), funcion, error, detalle]);
}

function obtenerPartidos() {
  return getSheetData('Partidos');
}

function enviarNotificaciones() {
  // Opcional: Enviar correos a participantes
}

function crearBackup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const folder = DriveApp.getRootFolder();
  const file = DriveApp.getFileById(ss.getId());
  file.makeCopy(ss.getName() + '_Backup_' + new Date().toISOString(), folder);
}
