/**
 * SISTEMA DE QUINIELA MUNDIAL 2026
 * Backend Completo y Robusto: Google Sheets como Fuente de Verdad.
 * Optimizaciones para evitar bloqueos y mejorar el tiempo de respuesta.
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
  var page = e.parameter.p || 'Index';
  var config = getConfig();
  var userEmail = Session.getEffectiveUser().getEmail();

  // Seguridad: Solo el administrador puede ver la página de Admin
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
    return HtmlService.createHtmlOutput('<h1>Error al cargar la página: ' + page + '</h1><p>' + err.message + '</p>');
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
    .addItem('🧪 Insertar Partidos (seed)', 'seedPartidos')
    .addItem('🏳️ Insertar Banderas (seed)', 'seedBanderas')
    .addItem('🧪 Insertar Datos de Prueba', 'insertarDatosPrueba')
    .addToUi();
}

// --- FUNCIONES DE DATA ---

function getConfig() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Configuracion');
    if (!sheet || sheet.getLastRow() < 2) {
      inicializarSistema();
      return CONFIG_BASE;
    }
    var data = sheet.getDataRange().getValues();
    var config = {};
    for (var i = 1; i < data.length; i++) {
      if(data[i][0]) config[String(data[i][0])] = data[i][1];
    }
    return config.ADMIN_EMAIL !== undefined ? config : CONFIG_BASE;
  } catch(e) {
    return CONFIG_BASE;
  }
}

function obtenerPartidosParaUsuario(email) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaPartidos = ss.getSheetByName("Partidos");
    if (!hojaPartidos || hojaPartidos.getLastRow() < 2) {
      seedPartidos();
      hojaPartidos = ss.getSheetByName("Partidos");
    }

    var datosPartidos = hojaPartidos.getDataRange().getValues();
    var headers = datosPartidos.shift();
    var idx = {}; headers.forEach(function(h, c) { idx[String(h).trim()] = c; });

    // Banderas en un solo paso
    var banderasMap = {};
    var hojaBanderas = ss.getSheetByName("Banderas");
    if (hojaBanderas && hojaBanderas.getLastRow() > 1) {
      var datosBanderas = hojaBanderas.getDataRange().getValues();
      for (var b = 1; b < datosBanderas.length; b++) {
        banderasMap[String(datosBanderas[b][0]).trim().toLowerCase()] = datosBanderas[b][2];
      }
    }

    // Pronósticos en un solo paso
    var pronosticosUsuario = {};
    var hojaPronosticos = ss.getSheetByName("Pronosticos");
    if (hojaPronosticos && hojaPronosticos.getLastRow() > 1) {
      var datosPronosticos = hojaPronosticos.getDataRange().getValues();
      var mailBusq = String(email || "").toLowerCase();
      for (var r = 1; r < datosPronosticos.length; r++) {
        if (String(datosPronosticos[r][1]).toLowerCase() === mailBusq) {
          pronosticosUsuario[String(datosPronosticos[r][2])] = {
            golLocal: datosPronosticos[r][3],
            golVisita: datosPronosticos[r][4]
          };
        }
      }
    }

    var ahora = new Date();
    var ms24h = 24 * 60 * 60 * 1000;

    var partidos = datosPartidos.map(function(row) {
      var idPart = String(row[idx["ID_Partido"]]);
      if (!idPart) return null;

      var eqL = row[idx["Equipo_Local"]] || "";
      var eqV = row[idx["Equipo_Visita"]] || "";
      var fRaw = row[idx["Fecha"]];
      var hRaw = row[idx["Hora_UTC"]];

      var fDt = (fRaw instanceof Date) ? new Date(fRaw.getTime()) : (fRaw ? new Date(String(fRaw)) : null);
      if (fDt && hRaw) {
        var p = String(hRaw).split(":");
        if (p.length >= 2) fDt.setHours(parseInt(p[0], 10), parseInt(p[1], 10), 0, 0);
      }

      var fCierre = (fDt && !isNaN(fDt.getTime())) ? new Date(fDt.getTime() - ms24h) : null;
      var estS = String(row[idx["Estado"]] || "PENDIENTE").toUpperCase().trim();

      var estP = "ABIERTO";
      var inpH = true;

      if (estS === "JUGADO") { estP = "JUGADO"; inpH = false; }
      else if (fCierre && ahora.getTime() >= fCierre.getTime()) { estP = "CERRADO"; inpH = false; }

      if (eqL.includes('Grupo') || eqL.includes('Ganador') || eqL.includes('Perdedor')) {
        inpH = false; if (estP === "ABIERTO") estP = "ESPERANDO";
      }

      return {
        idPartido: idPart,
        fase: String(row[idx["Fase"]] || ""),
        grupo: String(row[idx["Grupo"]] || ""),
        fecha: fDt ? fDt.toISOString().split('T')[0] : String(fRaw),
        hora: String(hRaw || ""),
        equipoLocal: eqL,
        urlBanderaLocal: banderasMap[eqL.toLowerCase()] || "https://flagcdn.com/w80/un.png",
        equipoVisita: eqV,
        urlBanderaVisita: banderasMap[eqV.toLowerCase()] || "https://flagcdn.com/w80/un.png",
        golLocalReal: row[idx["Gol_Local_Real"]] !== "" ? Number(row[idx["Gol_Local_Real"]]) : null,
        golVisitaReal: row[idx["Gol_Visita_Real"]] !== "" ? Number(row[idx["Gol_Visita_Real"]]) : null,
        estadoPartido: estS,
        estadoPronostico: estP,
        inputsHabilitados: inpH,
        fechaCierre: fCierre ? fCierre.toISOString() : null,
        miPronostico: pronosticosUsuario[idPart] || null,
        matchNum: String(row[idx["Match_Num"]] || "")
      };
    }).filter(function(p) { return p !== null; });

    return { success: true, partidos: partidos };
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
    var partidosRaw = hojaPartidos.getDataRange().getValues();
    var headersP = partidosRaw.shift();
    var idxP = {}; headersP.forEach(function(h, c) { idxP[String(h).trim()] = c; });

    var pronosSheet = ss.getSheetByName('Pronosticos');
    if (!pronosSheet || pronosSheet.getLastRow() < 2) return { success: true };

    var pData = pronosSheet.getDataRange().getValues();
    var pRows = pData.slice(1);
    var pStats = {};
    var config = getConfig();

    pRows.forEach(function(row) {
      var email = String(row[1]).toLowerCase();
      var match = partidosRaw.find(function(m) { return m[idxP["ID_Partido"]] == row[2]; });
      if (match && String(match[idxP["Estado"]]).toUpperCase() === 'JUGADO') {
        var res = calcularPuntosIndividual(Number(match[idxP["Gol_Local_Real"]]), Number(match[idxP["Gol_Visita_Real"]]), Number(row[3]), Number(row[4]), match[idxP["Fase"]] !== 'Fase de Grupos', config);
        row[6] = res.puntos; row[7] = true;
        if (!pStats[email]) pStats[email] = { pts: 0, ex: 0, gan: 0, err: 0 };
        pStats[email].pts += res.puntos;
        if (res.tipo === 'EXACTO') pStats[email].ex++; else if (res.tipo === 'GANADOR') pStats[email].gan++; else pStats[email].err++;
      }
    });

    pronosSheet.getRange(2, 1, pRows.length, pData[0].length).setValues(pRows);

    var partSheet = ss.getSheetByName('Participantes');
    if(partSheet && partSheet.getLastRow() > 1) {
      var partData = partSheet.getDataRange().getValues();
      var partRows = partData.slice(1);
      partRows.forEach(function(row) {
        var stats = pStats[String(row[0]).toLowerCase()];
        if (stats) { row[3] = stats.pts; row[4] = stats.ex; row[5] = stats.gan; row[6] = stats.err; }
      });
      partSheet.getRange(2, 1, partRows.length, partData[0].length).setValues(partRows);
    }
    return { success: true };
  } catch (e) { registrarError("recalcularTodosLosPuntos", e); return { success: false, error: e.toString() }; }
}

function calcularPuntosIndividual(glr, gvr, glp, gvp, esElim, config) {
  if (glr === glp && gvr === gvp) return { puntos: Number(config.PUNTOS_MARCADOR_EXACTO) + (esElim ? Number(config.PUNTOS_BONUS_ELIMINATORIA) : 0), tipo: "EXACTO" };
  var gR = glr > gvr ? 1 : (glr < gvr ? 2 : 0);
  var gP = glp > gvp ? 1 : (glp < gvp ? 2 : 0);
  if (gR === gP) return { puntos: Number(config.PUNTOS_ACIERTA_GANADOR), tipo: "GANADOR" };
  return { puntos: Number(config.PUNTOS_ERROR), tipo: "ERROR" };
}

function actualizarFaseEliminatoria() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaPartidos = ss.getSheetByName('Partidos');
    var dataP = hojaPartidos.getDataRange().getValues();
    var headers = dataP.shift();
    var idx = {}; headers.forEach(function(h, c) { idx[String(h).trim()] = c; });

    var grupos = ['A','B','C','D','E','F','G','H','I','J','K','L'];
    var clasificados = {}; var terceros = [];
    grupos.forEach(function(g) {
      var tabla = calcularTablaGrupo(g, ss, idx);
      clasificados[g] = { p1: tabla[0], p2: tabla[1], p3: tabla[2] };
      if (tabla[2]) terceros.push({ nombre: tabla[2].nombre, pts: tabla[2].pts, dg: tabla[2].dg, gf: tabla[2].gf, g: g });
    });

    var mejores8 = terceros.sort(function(a,b) { return b.pts - a.pts || b.dg - a.dg || b.gf - a.gf; }).slice(0, 8);

    dataP.forEach(function(p, i) {
      if (p[idx["Fase"]] === 'Ronda de 32') {
        var nL = p[idx["Equipo_Local"]], nV = p[idx["Equipo_Visita"]], c = false;
        var r1 = /1ro Grupo ([A-L])/, r2 = /2do Grupo ([A-L])/;
        if (r1.test(nL)) { var g = nL.match(r1)[1]; if(clasificados[g].p1){ nL = clasificados[g].p1.nombre; c = true; } }
        else if (r2.test(nL)) { var g = nL.match(r2)[1]; if(clasificados[g].p2){ nL = clasificados[g].p2.nombre; c = true; } }
        if (r1.test(nV)) { var g = nV.match(r1)[1]; if(clasificados[g].p1){ nV = clasificados[g].p1.nombre; c = true; } }
        else if (r2.test(nV)) { var g = nV.match(r2)[1]; if(clasificados[g].p2){ nV = clasificados[g].p2.nombre; c = true; } }
        if (nV.includes('3ro Grupos')) {
          var mIdx = {75:0, 78:1, 79:2, 80:3, 81:4, 82:5, 85:6, 88:7}[p[idx["Match_Num"]]];
          if (mIdx !== undefined && mejores8[mIdx]) { nV = mejores8[mIdx].nombre; c = true; }
        }
        if (c) hojaPartidos.getRange(i + 2, idx["Equipo_Local"] + 1, 1, 3).setValues([[nL, "", nV]]);
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
    if (m[idxP["Grupo"]] == gName && String(m[idxP["Estado"]]).toUpperCase() === 'JUGADO') {
      var l = tabla.find(function(t) { return t.nombre == m[idxP["Equipo_Local"]]; });
      var v = tabla.find(function(t) { return t.nombre == m[idxP["Equipo_Visita"]]; });
      if (l && v) {
        var gl = Number(m[idxP["Gol_Local_Real"]]), gv = Number(m[idxP["Gol_Visita_Real"]]);
        l.pj++; v.pj++; l.gf += gl; v.gf += gv; l.dg += (gl - gv); v.dg += (gv - gl);
        if (gl > gv) l.pts += 3; else if (gv > gl) v.pts += 3; else { l.pts++; v.pts++; }
      }
    }
  });
  return tabla.sort(function(a, b) { return b.pts - a.pts || b.dg - a.dg || b.gf - a.gf; });
}

function propagarGanadoresBracket(ss, idx) {
  var hoja = ss.getSheetByName('Partidos');
  var d = hoja.getDataRange().getValues(); var win = {}; d.shift();
  d.forEach(function(m) {
    if (m[idx["Fase"]] !== 'Fase de Grupos' && String(m[idx["Estado"]]).toUpperCase() === 'JUGADO') {
      win[m[idx["ID_Partido"]]] = Number(m[idx["Gol_Local_Real"]]) >= Number(m[idx["Gol_Visita_Real"]]) ? m[idx["Equipo_Local"]] : m[idx["Equipo_Visita"]];
    }
  });
  d.forEach(function(m, i) {
    var loc = String(m[idx["Equipo_Local"]]), vis = String(m[idx["Equipo_Visita"]]);
    if (loc.startsWith('Ganador M')) { var k = loc.split(' ')[1]; if (win[k]) hoja.getRange(i + 2, idx["Equipo_Local"] + 1).setValue(win[k]); }
    if (vis.startsWith('Ganador M')) { var k = vis.split(' ')[1]; if (win[k]) hoja.getRange(i + 2, idx["Equipo_Visita"] + 1).setValue(win[k]); }
  });
}

// --- USUARIOS ---

function registrarParticipante(e, n, a) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Participantes");
    if (!sheet) { inicializarSistema(); sheet = ss.getSheetByName("Participantes"); }
    var data = sheet.getDataRange().getValues();
    if (data.some(function(r) { return String(r[0]).toLowerCase() == String(e).toLowerCase(); })) return { success: false, error: "Email ya existe" };
    if (data.some(function(r) { return String(r[2]).toLowerCase() == String(a).toLowerCase(); })) return { success: false, error: "Alias ya existe" };
    sheet.appendRow([e, n, a, 0, 0, 0, 0, new Date()]);
    return { success: true };
  } catch(err) { return { success: false, error: err.toString() }; }
}

function loginParticipante(email) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Participantes");
    if(!sheet) return { success: false, error: "Base de datos vacía" };
    var data = sheet.getDataRange().getValues();
    var mailBusq = String(email || "").toLowerCase();
    var u = data.find(function(r) { return String(r[0]).toLowerCase() === mailBusq; });
    return u ? { success: true, participante: { Email: u[0], Nombre: u[1], Alias: u[2] } } : { success: false, error: "Usuario no encontrado" };
  } catch(e) { return { success: false, error: e.toString() }; }
}

function obtenerParticipante(email) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Participantes");
    if(!sheet) return null;
    var data = sheet.getDataRange().getValues();
    var mailBusq = String(email || "").toLowerCase();
    var u = data.find(function(r) { return String(r[0]).toLowerCase() === mailBusq; });
    return u ? { Email: u[0], Nombre: u[1], Alias: u[2], Puntos_Totales: u[3], Aciertos_Exactos: u[4] } : null;
  } catch(e) { return null; }
}

function obtenerRanking() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Participantes");
    if(!sheet || sheet.getLastRow() < 2) return [];
    var d = sheet.getDataRange().getValues(); d.shift();
    return d.map(function(r) { return { Alias: r[2], Nombre: r[1], Puntos_Totales: r[3], Aciertos_Exactos: r[4] }; }).sort(function(a,b) { return b.Puntos_Totales - a.Puntos_Totales; });
  } catch(e) { return []; }
}

function guardarPronosticos(email, pronosticosArray) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaPartidos = ss.getSheetByName("Partidos");
    var hojaPronosticos = ss.getSheetByName("Pronosticos");
    if (!hojaPronosticos) { ss.insertSheet("Pronosticos").appendRow(['ID_Pronostico', 'Email_Participante', 'ID_Partido', 'Gol_Local', 'Gol_Visita', 'Fecha_Registro', 'Puntos_Obtenidos', 'Calculado']); hojaPronosticos = ss.getSheetByName("Pronosticos"); }

    var pData = hojaPartidos.getDataRange().getValues();
    var pHeaders = pData.shift();
    var idxP = {}; pHeaders.forEach(function(h, c) { idxP[String(h).trim()] = c; });

    var ahora = new Date();
    var userPronos = hojaPronosticos.getDataRange().getValues();
    var userMap = {};
    for (var i = 1; i < userPronos.length; i++) { if (String(userPronos[i][1]).toLowerCase() == String(email).toLowerCase()) userMap[String(userPronos[i][2])] = i + 1; }

    var guardados = 0;
    pronosticosArray.forEach(function(p) {
      var match = pData.find(function(m) { return m[idxP["ID_Partido"]] == p.idPartido; });
      if (!match || String(match[idxP["Estado"]]).toUpperCase() === 'JUGADO') return;
      var dt = new Date(match[idxP["Fecha"]]);
      if (match[idxP["Hora_UTC"]]) { var ph = String(match[idxP["Hora_UTC"]]).split(":"); dt.setHours(parseInt(ph[0]), parseInt(ph[1]), 0, 0); }
      if (ahora >= new Date(dt.getTime() - 24*60*60*1000)) return;
      var gl = Number(p.golLocal), gv = Number(p.golVisita);
      if (userMap[p.idPartido]) { hojaPronosticos.getRange(userMap[p.idPartido], 4, 1, 3).setValues([[gl, gv, new Date()]]); }
      else { hojaPronosticos.appendRow(["PR_" + Utilities.getUuid().substring(0,8), email, p.idPartido, gl, gv, new Date(), "", false]); }
      guardados++;
    });
    return { success: true, guardados: guardados };
  } catch (e) { registrarError("guardarPronosticos", e); return { success: false, error: e.toString() }; }
}

// --- ADMIN Y SEEDS ---

function actualizarResultadoManual(id, gl, gv) {
  var config = getConfig();
  if (Session.getEffectiveUser().getEmail() !== config.ADMIN_EMAIL) return { success: false, error: "No autorizado" };
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hoja = ss.getSheetByName('Partidos');
    var data = hoja.getDataRange().getValues();
    var idx = {}; data[0].forEach(function(h, c) { idx[String(h).trim()] = c; });
    var r = data.findIndex(function(row) { return row[0] == id; });
    if (r > -1) {
      hoja.getRange(r + 1, idx["Gol_Local_Real"] + 1, 1, 3).setValues([[gl, gv, "JUGADO"]]);
      recalcularTodosLosPuntos();
      actualizarFaseEliminatoria();
      return { success: true, message: "OK" };
    }
    return { success: false, error: "No encontrado" };
  } catch(e) { return { success: false, error: e.toString() }; }
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
  var p = [["M1", "Fase de Grupos", "A", new Date(2026, 5, 11), "20:00", "México", "", "Corea del Sur", "", "", "", "PENDIENTE", "", "", "1"], ["M2", "Fase de Grupos", "A", new Date(2026, 5, 12), "15:00", "Sudáfrica", "", "República Checa", "", "", "", "PENDIENTE", "", "", "2"], ["M73", "Ronda de 32", "", new Date(2026, 5, 28), "12:00", "2do Grupo A", "", "2do Grupo B", "", "", "", "PENDIENTE", "", "", "73"]];
  hoja.getRange(2, 1, p.length, 15).setValues(p);
  var eqS = ss.getSheetByName("Equipos"); if(!eqS) eqS = ss.insertSheet("Equipos");
  eqS.clear().appendRow(["ID_Equipo", "Nombre_Equipo", "Bandera", "Grupo"]);
  var teamsArr = [[1, "México", "", "A"], [2, "Sudáfrica", "", "A"], [3, "Corea del Sur", "", "A"], [4, "República Checa", "", "A"], [5, "Canadá", "", "B"], [6, "Bosnia y Herzegovina", "", "B"]];
  eqS.getRange(2, 1, teamsArr.length, 4).setValues(teamsArr);
}

function registrarError(f, e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet(); var hoja = ss.getSheetByName("Log_Errores");
    if (hoja) hoja.appendRow([new Date(), f, e.toString(), e.stack || ""]);
  } catch (err) {}
}

function inicializarSistema() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var h = [{ n: 'Configuracion', col: ['Parametro', 'Valor'] }, { n: 'Banderas', col: ['Nombre_Equipo', 'Codigo_ISO', 'URL_Bandera'] }, { n: 'Partidos', col: ["ID_Partido", "Fase", "Grupo", "Fecha", "Hora_UTC", "Equipo_Local", "Bandera_Local", "Equipo_Visita", "Bandera_Visita", "Gol_Local_Real", "Gol_Visita_Real", "Estado", "Fecha_Cierre", "Llave", "Match_Num"] }, { n: 'Participantes', col: ['Email', 'Nombre', 'Alias', 'Puntos_Totales', 'Aciertos_Exactos', 'Aciertos_Ganador', 'Errores', 'Fecha_Registro'] }, { n: 'Pronosticos', col: ['ID_Pronostico', 'Email_Participante', 'ID_Partido', 'Gol_Local', 'Gol_Visita', 'Fecha_Registro', 'Puntos_Obtenidos', 'Calculado'] }, { n: 'Log_Errores', col: ['Fecha', 'Funcion', 'Error', 'Detalle'] }];
  h.forEach(function(x) { if(!ss.getSheetByName(x.n)){ var s = ss.insertSheet(x.n); s.appendRow(x.col); } });

  var configSheet = ss.getSheetByName('Configuracion');
  if (configSheet.getLastRow() === 1) {
    var data = [['PUNTOS_MARCADOR_EXACTO', 5],['PUNTOS_ACIERTA_GANADOR', 2],['PUNTOS_ERROR', -1],['PUNTOS_BONUS_ELIMINATORIA', 3],['HORAS_CIERRE_PRONOSTICO', 24],['ADMIN_EMAIL', Session.getEffectiveUser().getEmail()],['ZONA_HORARIA', 'America/Mexico_City'],['TORNEO_NOMBRE', 'Quiniela Mundial 2026']];
    configSheet.getRange(2, 1, data.length, 2).setValues(data);
  }
}

function insertarDatosPrueba() { seedBanderas(); seedPartidos(); registrarParticipante("admin@demo.com", "Admin", "Admin"); return { success: true, message: "Listo" }; }

function abrirWebApp() {
  var url = ScriptApp.getService().getUrl();
  var html = HtmlService.createHtmlOutput('<html><script>window.open("' + url + '", "_blank");google.script.host.close();</script></html>').setWidth(300).setHeight(100);
  SpreadsheetApp.getUi().showModalDialog(html, 'Abriendo...');
}
