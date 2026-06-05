/**
 * SISTEMA DE QUINIELA MUNDIAL 2026
 * Backend Corregido: Google Sheets como Fuente de Verdad.
 * Sincronización robusta y manejo de errores.
 */

const CONFIG_BASE = {
  PUNTOS_MARCADOR_EXACTO: 5,
  PUNTOS_ACIERTA_GANADOR: 2,
  PUNTOS_ERROR: -1,
  PUNTOS_BONUS_ELIMINATORIA: 3,
  HORAS_CIERRE_PRONOSTICO: 24,
  ZONA_HORARIA: 'America/Mexico_City',
  TORNEO_NOMBRE: 'Quiniela Mundial 2026',
  ADMIN_EMAIL: ''
};

// --- RUTA DE ENTRADA WEB APP ---

function doGet(e) {
  var params = {};
  if (e && e.parameter) {
    params = e.parameter;
  }

  var page = params.p || 'Index';
  var config = getConfig();
  var userEmail = "";
  try {
    userEmail = Session.getEffectiveUser().getEmail();
  } catch(err) {
    userEmail = "";
  }

  if (page === 'Admin' && userEmail !== config.ADMIN_EMAIL) {
    return HtmlService.createHtmlOutput('<h1>Acceso Denegado</h1><p>Solo el administrador tiene acceso a esta sección.</p>');
  }

  try {
    var template = HtmlService.createTemplateFromFile(page);
    return template.evaluate()
      .setTitle(config.TORNEO_NOMBRE || 'Quiniela 2026')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    if (page !== 'Index') {
      try {
        return HtmlService.createTemplateFromFile('Index').evaluate().setTitle('Quiniela 2026');
      } catch(err2) {}
    }
    return HtmlService.createHtmlOutput('<h1>Error al cargar la página</h1><p>' + err.message + '</p>');
  }
}

function include(filename) {
  try {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  } catch(e) {
    return "<!-- Error including " + filename + " -->";
  }
}

// --- MENÚ ON OPEN ---

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⚽ Quiniela Mundial 2026')
    .addItem('🌐 Abrir Web App', 'abrirWebApp')
    .addSeparator()
    .addItem('🏆 Actualizar Fase Eliminatoria', 'actualizarFaseEliminatoria')
    .addItem('📊 Recalcular Puntos', 'recalcularTodosLosPuntos')
    .addSeparator()
    .addItem('🧪 Inicializar / Resetear Sistema', 'inicializarSistemaCompleto')
    .addItem('🧪 Insertar Datos de Prueba', 'insertarDatosPrueba')
    .addSeparator()
    .addItem('🔍 Probar Lectura de Sheets', 'testLecturaSheet')
    .addToUi();
}

// --- FUNCIONES DE DATA ---

function getConfig() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Configuracion');
    if (!sheet || sheet.getLastRow() < 2) {
      inicializarSistema();
      sheet = ss.getSheetByName('Configuracion');
    }
    var data = sheet.getDataRange().getValues();
    var config = {};
    for (var i = 1; i < data.length; i++) {
      if(data[i][0]) config[String(data[i][0]).trim()] = data[i][1];
    }
    return (config.ADMIN_EMAIL !== undefined) ? config : CONFIG_BASE;
  } catch(e) {
    return CONFIG_BASE;
  }
}

function getHeaderMap(headers) {
  var idx = {};
  headers.forEach(function(h, c) {
    var key = String(h).trim()
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/[ÁÉÍÓÚ]/g, function(m) { return { 'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U' }[m]; });
    idx[key] = c;
  });
  return idx;
}

function obtenerPartidosParaUsuario(email) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaPartidos = ss.getSheetByName("Partidos");
    if (!hojaPartidos || hojaPartidos.getLastRow() < 2) {
      seedPartidos();
      hojaPartidos = ss.getSheetByName("Partidos");
    }

    var dataFull = hojaPartidos.getDataRange().getValues();
    var headers = dataFull.shift();
    var idx = getHeaderMap(headers);

    var cID = idx["ID_PARTIDO"], cFase = idx["FASE"], cGrupo = idx["GRUPO"];
    var cFecha = idx["FECHA"], cHora = idx["HORA_UTC"];
    var cLocal = idx["EQUIPO_LOCAL"], cVisita = idx["EQUIPO_VISITA"];
    var cGolLR = idx["GOL_LOCAL_REAL"], cGolVR = idx["GOL_VISITA_REAL"];
    var cEstado = idx["ESTADO"], cMatchN = idx["MATCH_NUM"];

    var banderasMap = {};
    var hojaBanderas = ss.getSheetByName("Banderas");
    if (hojaBanderas && hojaBanderas.getLastRow() > 1) {
      var dB = hojaBanderas.getDataRange().getValues();
      for (var b = 1; b < dB.length; b++) {
        if(dB[b][0]) banderasMap[String(dB[b][0]).trim().toLowerCase()] = dB[b][2]; // [0] Nombre, [2] URL
      }
    }

    var pronosUsr = {};
    var hojaPronosticos = ss.getSheetByName("Pronosticos");
    if (hojaPronosticos && hojaPronosticos.getLastRow() > 1) {
      var dPr = hojaPronosticos.getDataRange().getValues();
      var mailBusq = String(email || "").toLowerCase();
      for (var r = 1; r < dPr.length; r++) {
        if (String(dPr[r][1]).toLowerCase() === mailBusq) {
          pronosUsr[String(dPr[r][2])] = { golLocal: dPr[r][3], golVisita: dPr[r][4] };
        }
      }
    }

    var ahora = new Date();
    var ms24h = 24 * 60 * 60 * 1000;

    var partidos = dataFull.map(function(row) {
      var id = String(row[cID]);
      if (!id || id === "undefined" || id === "") return null;

      var eqL = String(row[cLocal] || "").trim();
      var eqV = String(row[cVisita] || "").trim();

      var fRaw = row[cFecha];
      var hRaw = row[cHora];
      var fDt = (fRaw instanceof Date) ? new Date(fRaw.getTime()) : (fRaw ? new Date(String(fRaw)) : null);
      if (fDt && hRaw) {
        var p = String(hRaw).split(":");
        if (p.length >= 2) fDt.setHours(parseInt(p[0], 10), parseInt(p[1], 10), 0, 0);
      }

      var fCierre = (fDt && !isNaN(fDt.getTime())) ? new Date(fDt.getTime() - ms24h) : null;
      var estS = String(row[cEstado] || "PENDIENTE").toUpperCase().trim();

      var estP = "ABIERTO", inpH = true;
      if (estS === "JUGADO") { estP = "JUGADO"; inpH = false; }
      else if (fCierre && ahora.getTime() >= fCierre.getTime()) { estP = "CERRADO"; inpH = false; }

      if (eqL.toUpperCase().includes('GRUPO') || eqL.toUpperCase().includes('GANADOR') || eqL.toUpperCase().includes('PERDEDOR')) {
        inpH = false; if (estP === "ABIERTO") estP = "ESPERANDO";
      }

      return {
        idPartido: id,
        fase: String(row[cFase] || ""),
        grupo: String(row[cGrupo] || ""),
        fecha: fDt ? fDt.toISOString().split('T')[0] : String(fRaw),
        hora: String(hRaw || ""),
        equipoLocal: eqL, nombreLocal: eqL,
        urlBanderaLocal: banderasMap[eqL.toLowerCase()] || "https://flagcdn.com/w80/un.png",
        equipoVisita: eqV, nombreVisita: eqV,
        urlBanderaVisita: banderasMap[eqV.toLowerCase()] || "https://flagcdn.com/w80/un.png",
        golLocalReal: (row[cGolLR] !== "" && row[cGolLR] !== undefined) ? Number(row[cGolLR]) : null,
        golVisitaReal: (row[cGolVR] !== "" && row[cGolVR] !== undefined) ? Number(row[cGolVR]) : null,
        estadoPartido: estS,
        estadoPronostico: estP,
        inputsHabilitados: inpH,
        fechaCierre: fCierre ? fCierre.toISOString() : null,
        miPronostico: pronosUsr[id] || null,
        matchNum: String(row[cMatchN] || "")
      };
    }).filter(function(p) { return p !== null; });

    return { success: true, partidos: partidos, ahoraServidor: ahora.toISOString() };
  } catch (e) {
    registrarError("obtenerPartidosParaUsuario", e);
    return { success: false, error: e.toString() };
  }
}

function obtenerPartidos() {
  var res = obtenerPartidosParaUsuario("");
  return res.success ? res.partidos : [];
}

// --- TORNEO ---

function recalcularTodosLosPuntos() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaPartidos = ss.getSheetByName('Partidos');
    var dP = hojaPartidos.getDataRange().getValues();
    var hP = dP.shift();
    var idxP = getHeaderMap(hP);

    var hPronos = ss.getSheetByName('Pronosticos');
    if (!hPronos || hPronos.getLastRow() < 2) return { success: true };

    var dPr = hPronos.getDataRange().getValues();
    var rPr = dPr.slice(1);
    var pStats = {};
    var config = getConfig();

    rPr.forEach(function(row) {
      var email = String(row[1]).toLowerCase();
      var idMatch = String(row[2]);
      var match = dP.find(function(m) { return String(m[idxP["ID_PARTIDO"]]) == idMatch; });

      if (match && String(match[idxP["ESTADO"]]).toUpperCase() === 'JUGADO') {
        var res = calcularPuntosIndividual(Number(match[idxP["GOL_LOCAL_REAL"]]), Number(match[idxP["GOL_VISITA_REAL"]]), Number(row[3]), Number(row[4]), match[idxP["FASE"]] !== 'Fase de Grupos', config);
        row[6] = res.puntos; row[7] = true;
        if (!pStats[email]) pStats[email] = { pts: 0, ex: 0, gan: 0, err: 0 };
        pStats[email].pts += res.puntos;
        if (res.tipo === 'EXACTO') pStats[email].ex++; else if (res.tipo === 'GANADOR') pStats[email].gan++; else pStats[email].err++;
      }
    });

    hPronos.getRange(2, 1, rPr.length, dPr[0].length).setValues(rPr);

    var hPartic = ss.getSheetByName('Participantes');
    if(hPartic && hPartic.getLastRow() > 1) {
      var dPa = hPartic.getDataRange().getValues();
      var rPa = dPa.slice(1);
      rPa.forEach(function(row) {
        var email = String(row[0]).toLowerCase();
        var stats = pStats[email];
        if (stats) {
          row[3] = stats.pts; row[4] = stats.ex; row[5] = stats.gan; row[6] = stats.err;
        }
      });
      hPartic.getRange(2, 1, rPa.length, dPa[0].length).setValues(rPa);
    }
    return { success: true };
  } catch (e) { registrarError("recalcularTodosLosPuntos", e); return { success: false, error: e.toString() }; }
}

function calcularPuntosIndividual(glr, gvr, glp, gvp, esElim, config) {
  if (glr === glp && gvr === gvp) return { puntos: Number(config.PUNTOS_MARCADOR_EXACTO) + (esElim ? Number(config.PUNTOS_BONUS_ELIMINATORIA) : 0), tipo: "EXACTO" };
  var ganadorR = glr > gvr ? 1 : (glr < gvr ? 2 : 0);
  var ganadorP = glp > gvp ? 1 : (glp < gvp ? 2 : 0);
  if (ganadorR === ganadorP) return { puntos: Number(config.PUNTOS_ACIERTA_GANADOR), tipo: "GANADOR" };
  return { puntos: Number(config.PUNTOS_ERROR), tipo: "ERROR" };
}

function actualizarFaseEliminatoria() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaPartidos = ss.getSheetByName('Partidos');
    var dataP = hojaPartidos.getDataRange().getValues();
    var hHead = dataP.shift();
    var idx = getHeaderMap(hHead);

    var grupos = ['A','B','C','D','E','F','G','H','I','J','K','L'];
    var clasificados = {}; var terceros = [];
    grupos.forEach(function(g) {
      var tabla = calcularTablaGrupo(g, ss, idx);
      clasificados[g] = { p1: tabla[0], p2: tabla[1], p3: tabla[2] };
      if (tabla[2]) terceros.push({ nombre: tabla[2].nombre, pts: tabla[2].pts, dg: tabla[2].dg, gf: tabla[2].gf, g: g });
    });

    var mejores8 = terceros.sort(function(a,b) { return b.pts - a.pts || b.dg - a.dg || b.gf - a.gf; }).slice(0, 8);

    dataP.forEach(function(p, i) {
      if (p[idx["FASE"]] === 'Ronda de 32') {
        var nL = p[idx["EQUIPO_LOCAL"]], nV = p[idx["EQUIPO_VISITA"]], c = false;
        var r1 = /1ro Grupo ([A-L])/, r2 = /2do Grupo ([A-L])/;
        if (r1.test(nL)) { var g = nL.match(r1)[1]; if(clasificados[g].p1){ nL = clasificados[g].p1.nombre; c = true; } }
        else if (r2.test(nL)) { var g = nL.match(r2)[1]; if(clasificados[g].p2){ nL = clasificados[g].p2.nombre; c = true; } }
        if (r1.test(nV)) { var g = nV.match(r1)[1]; if(clasificados[g].p1){ nV = clasificados[g].p1.nombre; c = true; } }
        else if (r2.test(nV)) { var g = nV.match(r2)[1]; if(clasificados[g].p2){ nV = clasificados[g].p2.nombre; c = true; } }
        if (nV.includes('3ro Grupos')) {
          var mIdx = {75:0, 78:1, 79:2, 80:3, 81:4, 82:5, 85:6, 88:7}[p[idx["MATCH_NUM"]]];
          if (mIdx !== undefined && mejores8[mIdx]) { nV = mejores8[mIdx].nombre; c = true; }
        }
        if (c) hojaPartidos.getRange(i + 2, idx["EQUIPO_LOCAL"] + 1, 1, 3).setValues([[nL, "", nV]]);
      }
    });
    propagarGanadoresBracket(ss, idx);
    return { success: true };
  } catch (e) { registrarError("actualizarFaseEliminatoria", e); return { success: false, error: e.toString() }; }
}

function calcularTablaGrupo(gName, ss, idxP) {
  var matches = ss.getSheetByName('Partidos').getDataRange().getValues(); matches.shift();
  var equipos = ss.getSheetByName('Equipos').getDataRange().getValues(); equipos.shift();
  var grupoTeams = equipos.filter(function(t) { return t[3] == gName; });
  var tabla = grupoTeams.map(function(t) { return { nombre: t[1], pts: 0, dg: 0, gf: 0, pj: 0 }; });
  matches.forEach(function(m) {
    if (m[idxP["GRUPO"]] == gName && String(m[idxP["ESTADO"]]).toUpperCase() === 'JUGADO') {
      var l = tabla.find(function(t) { return t.nombre == m[idxP["EQUIPO_LOCAL"]]; });
      var v = tabla.find(function(t) { return t.nombre == m[idxP["EQUIPO_VISITA"]]; });
      if (l && v) {
        var gl = Number(m[idxP["GOL_LOCAL_REAL"]]), gv = Number(m[idxP["GOL_VISITA_REAL"]]);
        l.pj++; v.pj++; l.gf += gl; v.gf += gv; l.dg += (gl - gv); v.dg += (gv - gl);
        if (gl > gv) l.pts += 3; else if (gv > gl) v.pts += 3; else { l.pts++; v.pts++; }
      }
    }
  });
  return tabla.sort(function(a, b) { return b.pts - a.pts || b.dg - a.dg || b.gf - a.gf; });
}

function propagarGanadoresBracket(ss, idx) {
  var hoja = ss.getSheetByName('Partidos');
  var d = hoja.getDataRange().getValues(); var h = d.shift(); var win = {};
  d.forEach(function(m) {
    if (m[idx["FASE"]] !== 'Fase de Grupos' && String(m[idx["ESTADO"]]).toUpperCase() === 'JUGADO') {
      win[String(m[idx["ID_PARTIDO"]])] = Number(m[idx["GOL_LOCAL_REAL"]]) >= Number(m[idx["GOL_VISITA_REAL"]]) ? m[idx["EQUIPO_LOCAL"]] : m[idx["EQUIPO_VISITA"]];
    }
  });
  d.forEach(function(m, i) {
    var loc = String(m[idx["EQUIPO_LOCAL"]]), vis = String(m[idx["EQUIPO_VISITA"]]);
    if (loc.startsWith('Ganador M')) { var k = loc.split(' ')[1]; if (win[k]) hoja.getRange(i + 2, idx["EQUIPO_LOCAL"] + 1).setValue(win[k]); }
    if (vis.startsWith('Ganador M')) { var k = vis.split(' ')[1]; if (win[k]) hoja.getRange(i + 2, idx["EQUIPO_VISITA"] + 1).setValue(win[k]); }
  });
}

// --- USUARIOS Y LOGIN ---

function registrarParticipante(e, n, a, g) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Participantes");
    if (!sheet) { inicializarSistema(); sheet = ss.getSheetByName("Participantes"); }
    var data = sheet.getDataRange().getValues();
    var eL = String(e || "").toLowerCase(), aL = String(a || "").toLowerCase();
    if (data.some(function(r) { return String(r[0]).toLowerCase() === eL; })) return { success: false, error: "Email ya registrado" };
    if (data.some(function(r) { return String(r[2]).toLowerCase() === aL; })) return { success: false, error: "Alias ya existe" };
    sheet.appendRow([e, n, a, 0, 0, 0, 0, new Date(), g, "", "Pendiente"]);
    return { success: true };
  } catch(err) { return { success: false, error: err.toString() }; }
}

function loginParticipante(email) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Participantes");
    if(!sheet) return { success: false, error: "Base de datos vacía" };
    var d = sheet.getDataRange().getValues();
    var mB = String(email || "").toLowerCase();
    var u = d.find(function(r) { return String(r[0]).toLowerCase() === mB; });
    if(u) {
       return { success: true, participante: { email: u[0], nombre: u[1], alias: u[2], puntosTotales: u[3], aciertosExactos: u[4], estatusPago: u[10] || "Pendiente" } };
    }
    return { success: false, error: "Usuario no encontrado" };
  } catch(e) { return { success: false, error: e.toString() }; }
}

function subirComprobante(email, fileObj) {
  try {
    var folderName = "Comprobantes_Quiniela_2026";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

    var contentType = fileObj.contentType;
    var data = Utilities.base64Decode(fileObj.data);
    var blob = Utilities.newBlob(data, contentType, "Pago_" + email + "_" + new Date().getTime());
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Participantes");
    var d = sheet.getDataRange().getValues();
    var mB = String(email).toLowerCase();
    for (var i = 1; i < d.length; i++) {
      if (String(d[i][0]).toLowerCase() === mB) {
        sheet.getRange(i + 1, 10, 1, 2).setValues([[file.getUrl(), "En Revisión"]]);
        break;
      }
    }
    return { success: true, url: file.getUrl() };
  } catch (e) { return { success: false, error: e.toString() }; }
}

function obtenerParticipante(email) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var h = ss.getSheetByName("Participantes");
    if(!h) return null;
    var d = h.getDataRange().getValues();
    var mB = String(email || "").toLowerCase();
    var u = d.find(function(r) { return String(r[0]).toLowerCase() === mB; });
    return u ? { Email: u[0], Nombre: u[1], Alias: u[2], Puntos_Totales: u[3], Aciertos_Exactos: u[4], EstatusPago: u[10] } : null;
  } catch(e) { return null; }
}

function obtenerRanking() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var h = ss.getSheetByName("Participantes");
    if(!h || h.getLastRow() < 2) return [];
    var d = h.getDataRange().getValues(); d.shift();
    return d.map(function(r) { return { Alias: r[2], Nombre: r[1], Puntos_Totales: r[3], Aciertos_Exactos: r[4] }; }).sort(function(a,b) { return b.Puntos_Totales - a.Puntos_Totales; });
  } catch(e) { return []; }
}

function guardarPronosticos(email, pronArr) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hPart = ss.getSheetByName("Partidos");
    var hPronos = ss.getSheetByName("Pronosticos");
    if (!hPronos) { ss.insertSheet("Pronosticos").appendRow(['ID_PRONOSTICO', 'EMAIL_PARTICIPANTE', 'ID_PARTIDO', 'GOL_LOCAL', 'GOL_VISITA', 'FECHA_REGISTRO', 'PUNTOS_OBTENIDOS', 'CALCULADO']); hPronos = ss.getSheetByName("Pronosticos"); }

    var pD = hPart.getDataRange().getValues();
    var hHead = pD.shift();
    var idxP = getHeaderMap(hHead);

    var ahora = new Date();
    var userPronos = hPronos.getDataRange().getValues();
    var userMap = {};
    var mailL = String(email || "").toLowerCase();
    for (var i = 1; i < userPronos.length; i++) { if (String(userPronos[i][1]).toLowerCase() === mailL) userMap[String(userPronos[i][2])] = i + 1; }

    var guardados = 0;
    pronArr.forEach(function(p) {
      var match = pD.find(function(m) { return String(m[idxP["ID_PARTIDO"]]) == String(p.idPartido); });
      if (!match || String(match[idxP["ESTADO"]]).toUpperCase() === 'JUGADO') return;
      var dt = new Date(match[idxP["FECHA"]]);
      if (match[idxP["HORA_UTC"]]) { var ph = String(match[idxP["HORA_UTC"]]).split(":"); dt.setHours(parseInt(ph[0]), parseInt(ph[1]), 0, 0); }
      if (ahora >= new Date(dt.getTime() - 24*60*60*1000)) return;
      var gl = Number(p.golLocal), gv = Number(p.golVisita);
      if (userMap[p.idPartido]) { hPronos.getRange(userMap[p.idPartido], 4, 1, 3).setValues([[gl, gv, new Date()]]); }
      else { hPronos.appendRow(["PR_" + Utilities.getUuid().substring(0,8), email, p.idPartido, gl, gv, new Date(), "", false]); }
      guardados++;
    });
    return { success: true, guardados: guardados };
  } catch (e) { registrarError("guardarPronosticos", e); return { success: false, error: e.toString() }; }
}

// --- ADMIN Y INICIALIZACION ---

function inicializarSistemaCompleto() {
  inicializarSistema();
  seedEquipos();
  seedPartidos();
  return "Sistema inicializado correctamente.";
}

function seedEquipos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName("Equipos"); if (!hoja) hoja = ss.insertSheet("Equipos");
  hoja.clear();
  var d = [["ID_Equipo", "Nombre_Equipo", "Bandera", "Grupo"]];
  var teams = [
    [1, "México", "🇲🇽", "A"], [2, "Sudáfrica", "🇿🇦", "A"], [3, "Corea del Sur", "🇰🇷", "A"], [4, "República Checa", "🇨🇿", "A"],
    [5, "Canadá", "🇨🇦", "B"], [6, "Bosnia y Herzegovina", "🇧🇦", "B"], [7, "Qatar", "🇶🇦", "B"], [8, "Suiza", "🇨🇭", "B"],
    [9, "Brasil", "🇧🇷", "C"], [10, "Marruecos", "🇲🇦", "C"], [11, "Haití", "🇭🇹", "C"], [12, "Escocia", "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "C"],
    [13, "Estados Unidos", "🇺🇸", "D"], [14, "Paraguay", "🇵🇾", "D"], [15, "Australia", "🇦🇺", "D"], [16, "Turquía", "🇹🇷", "D"],
    [17, "Alemania", "🇩🇪", "E"], [18, "Curazao", "🇨🇼", "E"], [19, "Costa de Marfil", "🇨🇮", "E"], [20, "Ecuador", "🇪🇨", "E"],
    [21, "Países Bajos", "🇳🇱", "F"], [22, "Japón", "🇯🇵", "F"], [23, "Suecia", "🇸🇪", "F"], [24, "Túnez", "🇹🇳", "F"],
    [25, "Bélgica", "🇧🇪", "G"], [26, "Egipto", "🇪🇬", "G"], [27, "Irán", "🇮🇷", "G"], [28, "Nueva Zelanda", "🇳🇿", "G"],
    [29, "España", "🇪🇸", "H"], [30, "Cabo Verde", "🇨🇻", "H"], [31, "Arabia Saudita", "🇸🇦", "H"], [32, "Uruguay", "🇺🇾", "H"],
    [33, "Francia", "🇫🇷", "I"], [34, "Senegal", "🇸🇳", "I"], [35, "Irak", "🇮🇶", "I"], [36, "Noruega", "🇳🇴", "I"],
    [37, "Argentina", "🇦🇷", "J"], [38, "Argelia", "🇩🇿", "J"], [39, "Austria", "🇦🇹", "J"], [40, "Jordania", "🇯🇴", "J"],
    [41, "Portugal", "🇵🇹", "K"], [42, "RD Congo", "🇨🇩", "K"], [43, "Uzbekistán", "🇺🇿", "K"], [44, "Colombia", "🇨🇴", "K"],
    [45, "Inglaterra", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "L"], [46, "Croacia", "🇭🇷", "L"], [47, "Ghana", "🇬🇭", "L"], [48, "Panamá", "🇵🇦", "L"]
  ];
  teams.forEach(function(t) { d.push(t); });
  hoja.getRange(1, 1, d.length, 4).setValues(d);
}

function registrarError(f, e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet(); var hoja = ss.getSheetByName("Log_Errores");
    if (hoja) hoja.appendRow([new Date(), f, e.toString(), e.stack || ""]);
  } catch (err) {}
}

function inicializarSistema() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var h = [{ n: 'Configuracion', col: ['Parametro', 'Valor'] }, { n: 'Banderas', col: ['Nombre_Equipo', 'Codigo_ISO', 'URL_Bandera'] }, { n: 'Partidos', col: ["ID_Partido", "Fase", "Grupo", "Fecha", "Hora_UTC", "Equipo_Local", "Bandera_Local", "Equipo_Visita", "Bandera_Visita", "Gol_Local_Real", "Gol_Visita_Real", "Estado", "Fecha_Cierre", "Llave", "Match_Num"] }, { n: 'Participantes', col: ['Email', 'Nombre', 'Alias', 'Puntos_Totales', 'Aciertos_Exactos', 'Aciertos_Ganador', 'Errores', 'Fecha_Registro', 'Goles_Torneo_Pronostico', 'Comprobante_Pago_URL', 'Estatus_Pago'] }, { n: 'Pronosticos', col: ['ID_Pronostico', 'Email_Participante', 'ID_Partido', 'Gol_Local', 'Gol_Visita', 'Fecha_Registro', 'Puntos_Obtenidos', 'Calculado'] }, { n: 'Log_Errores', col: ['Fecha', 'Funcion', 'Error', 'Detalle'] }];
  h.forEach(function(x) { if(!ss.getSheetByName(x.n)){ var s = ss.insertSheet(x.n); s.appendRow(x.col); } });
  var cS = ss.getSheetByName('Configuracion');
  if (cS.getLastRow() === 1) {
    var d = [['PUNTOS_MARCADOR_EXACTO', 5],['PUNTOS_ACIERTA_GANADOR', 2],['PUNTOS_ERROR', -1],['PUNTOS_BONUS_ELIMINATORIA', 3],['HORAS_CIERRE_PRONOSTICO', 24],['ADMIN_EMAIL', Session.getEffectiveUser().getEmail()],['ZONA_HORARIA', 'America/Mexico_City'],['TORNEO_NOMBRE', 'Quiniela Mundial 2026']];
    cS.getRange(2, 1, d.length, 2).setValues(d);
  }
}

function seedBanderas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName("Banderas"); if (!hoja) hoja = ss.insertSheet("Banderas");
  hoja.clear();
  var d = [["Nombre_Equipo", "Codigo_ISO", "URL_Bandera"]];
  var teams = [["México", "mx"], ["Sudáfrica", "za"], ["Corea del Sur", "kr"], ["República Checa", "cz"], ["Canadá", "ca"], ["Bosnia y Herzegovina", "ba"], ["Qatar", "qa"], ["Suiza", "ch"], ["Brasil", "br"], ["Marruecos", "ma"], ["Haití", "ht"], ["Escocia", "gb-sct"], ["Estados Unidos", "us"], ["Paraguay", "py"], ["Australia", "au"], ["Turquía", "tr"], ["Alemania", "de"], ["Curazao", "cw"], ["Costa de Marfil", "ci"], ["Ecuador", "ec"], ["Países Bajos", "nl"], ["Japón", "jp"], ["Suecia", "se"], ["Túnez", "tn"], ["Bélgica", "be"], ["Egipto", "eg"], ["Irán", "ir"], ["Nueva Zelanda", "nz"], ["España", "es"], ["Cabo Verde", "cv"], ["Arabia Saudita", "sa"], ["Uruguay", "uy"], ["Francia", "fr"], ["Senegal", "sn"], ["Irak", "iq"], ["Noruega", "no"], ["Argentina", "ar"], ["Argelia", "dz"], ["Austria", "at"], ["Jordania", "jo"], ["Portugal", "pt"], ["RD Congo", "cd"], ["Uzbekistán", "uz"], ["Colombia", "co"], ["Inglaterra", "gb-eng"], ["Croacia", "hr"], ["Ghana", "gh"], ["Panamá", "pa"]];
  teams.forEach(function(t) { d.push([t[0], t[1], "https://flagcdn.com/w80/"+t[1]+".png"]); });
  hoja.getRange(1, 1, d.length, 3).setValues(d);
}

function seedPartidos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName("Partidos"); if (!hoja) hoja = ss.insertSheet("Partidos");
  hoja.clear();
  var h = ["ID_Partido", "Fase", "Grupo", "Fecha", "Hora_UTC", "Equipo_Local", "Bandera_Local", "Equipo_Visita", "Bandera_Visita", "Gol_Local_Real", "Gol_Visita_Real", "Estado", "Fecha_Cierre", "Llave", "Match_Num"];
  hoja.getRange(1, 1, 1, h.length).setValues([h]);

  var p = [
    ["M1", "Fase de Grupos", "A", new Date(2026, 5, 11), "20:00", "México", "", "Corea del Sur", "", "", "", "PENDIENTE", "", "", "1"],
    ["M2", "Fase de Grupos", "A", new Date(2026, 5, 12), "15:00", "Sudáfrica", "", "República Checa", "", "", "", "PENDIENTE", "", "", "2"],
    ["M3", "Fase de Grupos", "A", new Date(2026, 5, 17), "15:00", "República Checa", "", "Corea del Sur", "", "", "", "PENDIENTE", "", "", "3"],
    ["M4", "Fase de Grupos", "A", new Date(2026, 5, 17), "20:00", "México", "", "Sudáfrica", "", "", "", "PENDIENTE", "", "", "4"],
    ["M5", "Fase de Grupos", "A", new Date(2026, 5, 23), "15:00", "Corea del Sur", "", "Sudáfrica", "", "", "", "PENDIENTE", "", "", "5"],
    ["M6", "Fase de Grupos", "A", new Date(2026, 5, 23), "20:00", "República Checa", "", "México", "", "", "", "PENDIENTE", "", "", "6"],
    ["M7", "Fase de Grupos", "B", new Date(2026, 5, 12), "15:00", "Canadá", "", "Bosnia y Herzegovina", "", "", "", "PENDIENTE", "", "", "7"],
    ["M8", "Fase de Grupos", "B", new Date(2026, 5, 13), "12:00", "Qatar", "", "Suiza", "", "", "", "PENDIENTE", "", "", "8"],
    ["M13", "Fase de Grupos", "C", new Date(2026, 5, 13), "18:00", "Brasil", "", "Marruecos", "", "", "", "PENDIENTE", "", "", "13"],
    ["M19", "Fase de Grupos", "D", new Date(2026, 5, 14), "16:00", "Estados Unidos", "", "Paraguay", "", "", "", "PENDIENTE", "", "", "19"],
    ["M73", "Ronda de 32", "", new Date(2026, 5, 28), "12:00", "2do Grupo A", "", "2do Grupo B", "", "", "", "PENDIENTE", "", "", "73"],
    ["M75", "Ronda de 32", "", new Date(2026, 5, 29), "16:30", "1ro Grupo E", "", "3ro Grupos A/B/C/D/F", "", "", "", "PENDIENTE", "", "", "75"],
    ["M89", "Octavos de Final", "", new Date(2026, 6, 4), "13:00", "Ganador M73", "", "Ganador M75", "", "", "", "PENDIENTE", "", "", "89"],
    ["M97", "Cuartos de Final", "", new Date(2026, 6, 9), "16:00", "Ganador M89", "", "Ganador M90", "", "", "", "PENDIENTE", "", "", "97"],
    ["M101", "Semifinal", "", new Date(2026, 6, 14), "20:00", "Ganador M97", "", "Ganador M98", "", "", "", "PENDIENTE", "", "", "101"],
    ["M104", "Final", "", new Date(2026, 6, 19), "15:00", "Ganador M101", "", "Ganador M102", "", "", "", "PENDIENTE", "", "", "104"]
  ];
  hoja.getRange(2, 1, p.length, 15).setValues(p);
}

function actualizarResultadosAPI() {
  var config = getConfig();
  if (!config.API_FOOTBALL_KEY) return { success: false, error: "Falta API Key" };
  // Lógica de fetch aquí...
  return { success: true, message: "Funcionalidad preparada para implementación de API" };
}

function insertarDatosPrueba() { seedBanderas(); seedPartidos(); registrarParticipante("admin@demo.com", "Admin", "Admin"); return { success: true, message: "OK" }; }

function abrirWebApp() {
  var url = ScriptApp.getService().getUrl();
  var html = HtmlService.createHtmlOutput('<html><script>window.open("' + url + '", "_blank");google.script.host.close();</script></html>').setWidth(300).setHeight(100);
  SpreadsheetApp.getUi().showModalDialog(html, 'Abriendo...');
}


function testLecturaSheet() {
  var ui = SpreadsheetApp.getUi();
  try {
    var part = obtenerPartidosParaUsuario(Session.getEffectiveUser().getEmail());

    var msg = "Prueba de Lectura:\n";
    msg += "- Partidos leídos: " + (part.partidos ? part.partidos.length : 0) + "\n";
    if(part.partidos && part.partidos.length > 0) {
      msg += "- Equipo 1: " + part.partidos[0].equipoLocal + " vs " + part.partidos[0].equipoVisita + "\n";
      msg += "- Estado M1: " + part.partidos[0].estadoPronostico + "\n";
    }

    ui.alert(msg);
  } catch(e) {
    ui.alert("Error en test: " + e.toString());
  }
}
