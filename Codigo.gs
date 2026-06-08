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
  var config = getConfig();
  try {
    var template = HtmlService.createTemplateFromFile('Index');
    return template.evaluate()
      .setTitle(config.TORNEO_NOMBRE || 'Quiniela 2026')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return HtmlService.createHtmlOutput('<h1>Error al cargar la aplicación</h1><p>' + err.message + '</p>');
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
    var cBanderaL = idx["BANDERA_LOCAL"], cBanderaV = idx["BANDERA_VISITA"];

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
    var ms1h = 60 * 60 * 1000;

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
      var difCierre = fCierre ? fCierre.getTime() - ahora.getTime() : null;

      if (estS === "JUGADO") {
        estP = "JUGADO"; inpH = false;
      } else if (fCierre && difCierre <= 0) {
        estP = "CERRADO"; inpH = false;
      } else if (fCierre && difCierre > 0 && difCierre < 48 * ms1h) {
        var hrs = Math.floor(difCierre / ms1h);
        estP = "CIERRA EN " + hrs + "H";
      }

      if (eqL.toUpperCase().includes('GRUPO') || eqL.toUpperCase().includes('GANADOR') || eqL.toUpperCase().includes('PERDEDOR')) {
        inpH = false;
        if (estP === "ABIERTO" || estP.indexOf("CIERRA") !== -1) estP = "ESPERANDO";
      }

      var fechaIso = "";
      try {
        if (fDt && !isNaN(fDt.getTime())) {
          fechaIso = fDt.toISOString().split('T')[0];
        } else {
          fechaIso = String(fRaw || "");
        }
      } catch(e) { fechaIso = String(fRaw || ""); }

      var cierreIso = null;
      try {
        if (fCierre && !isNaN(fCierre.getTime())) {
          cierreIso = fCierre.toISOString();
        }
      } catch(e) { cierreIso = null; }

      return {
        idPartido: id,
        fase: String(row[cFase] || ""),
        grupo: String(row[cGrupo] || ""),
        fecha: fechaIso,
        hora: String(hRaw || ""),
        equipoLocal: eqL, nombreLocal: eqL,
        emojiLocal: String(row[cBanderaL] || ""),
        urlBanderaLocal: banderasMap[eqL.toLowerCase()] || "https://flagcdn.com/w80/un.png",
        equipoVisita: eqV, nombreVisita: eqV,
        emojiVisita: String(row[cBanderaV] || ""),
        urlBanderaVisita: banderasMap[eqV.toLowerCase()] || "https://flagcdn.com/w80/un.png",
        golLocalReal: (row[cGolLR] !== "" && row[cGolLR] !== undefined) ? Number(row[cGolLR]) : null,
        golVisitaReal: (row[cGolVR] !== "" && row[cGolVR] !== undefined) ? Number(row[cGolVR]) : null,
        estadoPartido: estS,
        estadoPronostico: estP,
        inputsHabilitados: inpH,
        fechaCierre: cierreIso,
        miPronostico: pronosUsr[id] || null,
        matchNum: String(row[cMatchN] || "")
      };
    }).filter(function(p) { return p !== null; });

    // Ordenar por Fase y luego por Grupo, usando matchNum como desempate
    partidos.sort(function(a, b) {
      var fases = {
        "FASE DE GRUPOS": 1,
        "PRIMERA FASE": 1,
        "DIECISEISAVOS DE FINAL": 2,
        "RONDA DE 32": 2,
        "OCTAVOS DE FINAL": 3,
        "CUARTOS DE FINAL": 4,
        "SEMIFINAL": 5,
        "TERCER PUESTO": 6,
        "FINAL": 7
      };
      var fa = fases[String(a.fase).toUpperCase().trim()] || 99;
      var fb = fases[String(b.fase).toUpperCase().trim()] || 99;
      if (fa !== fb) return fa - fb;

      var ga = String(a.grupo || "").toUpperCase().trim();
      var gb = String(b.grupo || "").toUpperCase().trim();
      if (ga !== gb) return ga.localeCompare(gb);

      return Number(a.matchNum || 0) - Number(b.matchNum || 0);
    });

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

function recalcularTodosLosPuntos(adminEmail) {
  try {
    if (adminEmail) checkAdmin(adminEmail);
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

function actualizarFaseEliminatoria(adminEmail) {
  try {
    if (adminEmail) checkAdmin(adminEmail);
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
      var faseN = String(p[idx["FASE"]]).toUpperCase().trim();
      if (faseN === 'RONDA DE 32' || faseN === 'DIECISEISAVOS DE FINAL') {
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
    var faseN = String(m[idx["FASE"]]).toUpperCase().trim();
    if (faseN !== 'FASE DE GRUPOS' && faseN !== 'PRIMERA FASE' && String(m[idx["ESTADO"]]).toUpperCase() === 'JUGADO') {
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
    sheet.appendRow([e, n, a, 0, 0, 0, 0, new Date(), g, "", "Pendiente", ""]);
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

    var config = getConfig();
    var isAdmin = (mB === String(config.ADMIN_EMAIL).toLowerCase());

    if(u) {
       return { success: true, participante: {
         email: u[0], nombre: u[1], alias: u[2], puntosTotales: u[3], aciertosExactos: u[4],
         estatusPago: u[10] || "Pendiente", comentarioPago: u[11] || "",
         isAdmin: isAdmin
       } };
    } else if (isAdmin) {
       // Si es el admin pero no está en la hoja de participantes, permitirle entrar como admin
       return { success: true, participante: {
         email: email, nombre: "Administrador", alias: "Admin", puntosTotales: 0, aciertosExactos: 0,
         estatusPago: "N/A", comentarioPago: "",
         isAdmin: true
       } };
    }
    return { success: false, error: "Usuario no encontrado" };
  } catch(e) { return { success: false, error: e.toString() }; }
}

function subirComprobante(email, fileObj) {
  try {
    var folderName = "Comprobantes_Quiniela_2026";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    var blob = Utilities.newBlob(Utilities.base64Decode(fileObj.data), fileObj.contentType, "Pago_" + email + "_" + new Date().getTime());
    var file = folder.createFile(blob);
    // Cambiado a acceso privado (solo dueño y quienes tengan permiso explícito)
    file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Participantes");
    var d = sheet.getDataRange().getValues();
    var mB = String(email).toLowerCase();
    for (var i = 1; i < d.length; i++) {
      if (String(d[i][0]).toLowerCase() === mB) {
        sheet.getRange(i + 1, 10, 1, 2).setValues([["En revisión", ""]]); // Limpiar comentario al resubir
        // Corrección: El ID de la columna 10 es Comprobante_Pago_URL (Índice 9 en 0-based, J en Sheets)
        // Columna 10: Comprobante_Pago_URL (J)
        // Columna 11: Estatus_Pago (K)
        // Columna 12: Comentarios_Pago (L)
        sheet.getRange(i + 1, 10, 1, 3).setValues([[file.getUrl(), "En revisión", ""]]);
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
    return u ? { Email: u[0], Nombre: u[1], Alias: u[2], Puntos_Totales: u[3], Aciertos_Exactos: u[4], EstatusPago: u[10], ComentarioPago: u[11] } : null;
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
    var hPronos = ss.getSheetByName("Pronosticos");
    if (!hPronos) {
       ss.insertSheet("Pronosticos").appendRow(['ID_PRONOSTICO', 'EMAIL_PARTICIPANTE', 'ID_PARTIDO', 'GOL_LOCAL', 'GOL_VISITA', 'FECHA_REGISTRO', 'PUNTOS_OBTENIDOS', 'CALCULADO']);
       hPronos = ss.getSheetByName("Pronosticos");
    }
    var userPronos = hPronos.getDataRange().getValues();
    var userMap = {};
    var mailL = String(email || "").toLowerCase();
    for (var i = 1; i < userPronos.length; i++) { if (String(userPronos[i][1]).toLowerCase() === mailL) userMap[String(userPronos[i][2])] = i + 1; }

    pronArr.forEach(function(p) {
      if (userMap[p.idPartido]) hPronos.getRange(userMap[p.idPartido], 4, 1, 2).setValues([[Number(p.golLocal), Number(p.golVisita)]]);
      else hPronos.appendRow(["PR_" + Utilities.getUuid().substring(0,8), email, p.idPartido, Number(p.golLocal), Number(p.golVisita), new Date(), "", false]);
    });
    return { success: true, guardados: pronArr.length };
  } catch (e) { return { success: false, error: e.toString() }; }
}

// --- ADMIN Y INICIALIZACION ---

function checkAdmin(providedEmail) {
  var config = getConfig();
  var adminEmail = String(config.ADMIN_EMAIL || "").toLowerCase();
  var activeUserEmail = "";
  try {
    activeUserEmail = Session.getActiveUser().getEmail();
  } catch(e) {}

  // En aplicaciones públicas de Apps Script, getActiveUser() suele ser nulo.
  // Usamos el providedEmail como respaldo, pero idealmente se validaría contra la sesión.
  var targetEmail = (activeUserEmail || providedEmail || "").toLowerCase();

  if (targetEmail !== adminEmail || adminEmail === "") {
    throw new Error("Acceso denegado: Se requiere perfil de administrador.");
  }
  return true;
}

function inicializarSistemaCompleto(adminEmail) {
  checkAdmin(adminEmail);
  inicializarSistema();
  seedEquipos(adminEmail);
  seedBanderas(adminEmail);
  seedPartidos(adminEmail);
  return { success: true, message: "Sistema inicializado correctamente." };
}

function registrarError(f, e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet(); var hoja = ss.getSheetByName("Log_Errores");
    if (hoja) hoja.appendRow([new Date(), f, e.toString(), e.stack || ""]);
  } catch (err) {}
}

function inicializarSistema() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var h = [
    { n: 'Configuracion', col: ['Parametro', 'Valor'] },
    { n: 'Banderas', col: ['Nombre_Equipo', 'Codigo_ISO', 'URL_Bandera'] },
    { n: 'Equipos', col: ["ID_Equipo", "Nombre_Equipo", "Bandera", "Grupo"] },
    { n: 'Partidos', col: ["ID_Partido", "Fase", "Grupo", "Fecha", "Hora_UTC", "Equipo_Local", "Bandera_Local", "Equipo_Visita", "Bandera_Visita", "Gol_Local_Real", "Gol_Visita_Real", "Estado", "Fecha_Cierre", "Llave", "Match_Num"] },
    { n: 'Participantes', col: ['Email', 'Nombre', 'Alias', 'Puntos_Totales', 'Aciertos_Exactos', 'Aciertos_Ganador', 'Errores', 'Fecha_Registro', 'Goles_Torneo_Pronostico', 'Comprobante_Pago_URL', 'Estatus_Pago', 'Comentarios_Pago'] },
    { n: 'Pronosticos', col: ['ID_Pronostico', 'Email_Participante', 'ID_Partido', 'Gol_Local', 'Gol_Visita', 'Fecha_Registro', 'Puntos_Obtenidos', 'Calculado'] },
    { n: 'Log_Errores', col: ['Fecha', 'Funcion', 'Error', 'Detalle'] }
  ];
  h.forEach(function(x) { if(!ss.getSheetByName(x.n)){ var s = ss.insertSheet(x.n); s.appendRow(x.col); } });
  var cS = ss.getSheetByName('Configuracion');
  if (cS && cS.getLastRow() === 1) {
    var d = [['PUNTOS_MARCADOR_EXACTO', 5],['PUNTOS_ACIERTA_GANADOR', 2],['PUNTOS_ERROR', -1],['PUNTOS_BONUS_ELIMINATORIA', 3],['HORAS_CIERRE_PRONOSTICO', 24],['ADMIN_EMAIL', Session.getEffectiveUser().getEmail()],['ZONA_HORARIA', 'America/Mexico_City'],['TORNEO_NOMBRE', 'Quiniela Mundial 2026']];
    cS.getRange(2, 1, d.length, 2).setValues(d);
  }
}

function seedEquipos(adminEmail) {
  checkAdmin(adminEmail);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName("Equipos"); if (!hoja) hoja = ss.insertSheet("Equipos");
  hoja.clear();
  var d = [["ID_Equipo", "Nombre_Equipo", "Bandera", "Grupo"]];
  var teams = [[1, "México", "🇲🇽", "A"], [2, "Sudáfrica", "🇿🇦", "A"], [3, "Corea del Sur", "🇰🇷", "A"], [4, "República Checa", "🇨🇿", "A"], [5, "Canadá", "🇨🇦", "B"], [6, "Bosnia y Herzegovina", "🇧🇦", "B"], [7, "Qatar", "🇶🇦", "B"], [8, "Suiza", "🇨🇭", "B"], [9, "Brasil", "🇧🇷", "C"], [10, "Marruecos", "🇲🇦", "C"], [11, "Haití", "🇭🇹", "C"], [12, "Escocia", "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "C"], [13, "Estados Unidos", "🇺🇸", "D"], [14, "Paraguay", "🇵🇾", "D"], [15, "Australia", "🇦🇺", "D"], [16, "Turquía", "🇹🇷", "D"], [17, "Alemania", "🇩🇪", "E"], [18, "Curazao", "🇨🇼", "E"], [19, "Costa de Marfil", "🇨🇮", "E"], [20, "Ecuador", "🇪🇨", "E"], [21, "Países Bajos", "🇳🇱", "F"], [22, "Japón", "🇯🇵", "F"], [23, "Suecia", "🇸🇪", "F"], [24, "Túnez", "🇹🇳", "F"], [25, "Bélgica", "🇧🇪", "G"], [26, "Egipto", "🇪🇬", "G"], [27, "Irán", "🇮🇷", "G"], [28, "Nueva Zelanda", "🇳🇿", "G"], [29, "España", "🇪🇸", "H"], [30, "Cabo Verde", "🇨🇻", "H"], [31, "Arabia Saudita", "🇸🇦", "H"], [32, "Uruguay", "🇺🇾", "H"], [33, "Francia", "🇫🇷", "I"], [34, "Senegal", "🇸🇳", "I"], [35, "Irak", "🇮🇶", "I"], [36, "Noruega", "🇳🇴", "I"], [37, "Argentina", "🇦🇷", "J"], [38, "Argelia", "🇩🇿", "J"], [39, "Austria", "🇦🇹", "J"], [40, "Jordania", "🇯🇴", "J"], [41, "Portugal", "🇵🇹", "K"], [42, "RD Congo", "🇨🇩", "K"], [43, "Uzbekistán", "🇺🇿", "K"], [44, "Colombia", "🇨🇴", "K"], [45, "Inglaterra", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "L"], [46, "Croacia", "🇭🇷", "L"], [47, "Ghana", "🇬🇭", "L"], [48, "Panamá", "🇵🇦", "L"]];
  teams.forEach(function(t) { d.push(t); });
  hoja.getRange(1, 1, d.length, 4).setValues(d);
}

function seedBanderas(adminEmail) {
  checkAdmin(adminEmail);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName("Banderas"); if (!hoja) hoja = ss.insertSheet("Banderas");
  hoja.clear();
  var d = [["Nombre_Equipo", "Codigo_ISO", "URL_Bandera"]];
  var teams = [["México", "mx"], ["Sudáfrica", "za"], ["Corea del Sur", "kr"], ["República Checa", "cz"], ["Canadá", "ca"], ["Bosnia y Herzegovina", "ba"], ["Qatar", "qa"], ["Suiza", "ch"], ["Brasil", "br"], ["Marruecos", "ma"], ["Haití", "ht"], ["Escocia", "gb-sct"], ["Estados Unidos", "us"], ["Paraguay", "py"], ["Australia", "au"], ["Turquía", "tr"], ["Alemania", "de"], ["Curazao", "cw"], ["Costa de Marfil", "ci"], ["Ecuador", "ec"], ["Países Bajos", "nl"], ["Japón", "jp"], ["Suecia", "se"], ["Túnez", "tn"], ["Bélgica", "be"], ["Egipto", "eg"], ["Irán", "ir"], ["Nueva Zelanda", "nz"], ["España", "es"], ["Cabo Verde", "cv"], ["Arabia Saudita", "sa"], ["Uruguay", "uy"], ["Francia", "fr"], ["Senegal", "sn"], ["Irak", "iq"], ["Noruega", "no"], ["Argentina", "ar"], ["Argelia", "dz"], ["Austria", "at"], ["Jordania", "jo"], ["Portugal", "pt"], ["RD Congo", "cd"], ["Uzbekistán", "uz"], ["Colombia", "co"], ["Inglaterra", "gb-eng"], ["Croacia", "hr"], ["Ghana", "gh"], ["Panamá", "pa"]];
  teams.forEach(function(t) { d.push([t[0], t[1], "https://flagcdn.com/w80/"+t[1]+".png"]); });
  hoja.getRange(1, 1, d.length, 3).setValues(d);
}

function seedPartidos(adminEmail) {
  checkAdmin(adminEmail);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName("Partidos"); if (!hoja) hoja = ss.insertSheet("Partidos");
  hoja.clear();
  var h = ["ID_Partido", "Fase", "Grupo", "Fecha", "Hora_UTC", "Equipo_Local", "Bandera_Local", "Equipo_Visita", "Bandera_Visita", "Gol_Local_Real", "Gol_Visita_Real", "Estado", "Fecha_Cierre", "Llave", "Match_Num"];
  hoja.getRange(1, 1, 1, h.length).setValues([h]);

  var p = [
    // GRUPO A
    ["M1", "Fase de Grupos", "A", new Date(2026, 5, 11), "20:00", "México", "🇲🇽", "Corea del Sur", "🇰🇷", "", "", "PENDIENTE", "", "", "1"],
    ["M2", "Fase de Grupos", "A", new Date(2026, 5, 12), "15:00", "Sudáfrica", "🇿🇦", "República Checa", "🇨🇿", "", "", "PENDIENTE", "", "", "2"],
    ["M3", "Fase de Grupos", "A", new Date(2026, 5, 17), "15:00", "República Checa", "🇨🇿", "Corea del Sur", "🇰🇷", "", "", "PENDIENTE", "", "", "3"],
    ["M4", "Fase de Grupos", "A", new Date(2026, 5, 17), "20:00", "México", "🇲🇽", "Sudáfrica", "🇿🇦", "", "", "PENDIENTE", "", "", "4"],
    ["M5", "Fase de Grupos", "A", new Date(2026, 5, 23), "15:00", "Corea del Sur", "🇰🇷", "Sudáfrica", "🇿🇦", "", "", "PENDIENTE", "", "", "5"],
    ["M6", "Fase de Grupos", "A", new Date(2026, 5, 23), "20:00", "República Checa", "🇨🇿", "México", "🇲🇽", "", "", "PENDIENTE", "", "", "6"],
    // GRUPO B
    ["M7", "Fase de Grupos", "B", new Date(2026, 5, 12), "15:00", "Canadá", "🇨🇦", "Bosnia y Herzegovina", "🇧🇦", "", "", "PENDIENTE", "", "", "7"],
    ["M8", "Fase de Grupos", "B", new Date(2026, 5, 13), "12:00", "Qatar", "🇶🇦", "Suiza", "🇨🇭", "", "", "PENDIENTE", "", "", "8"],
    ["M9", "Fase de Grupos", "B", new Date(2026, 5, 18), "12:00", "Suiza", "🇨🇭", "Bosnia y Herzegovina", "🇧🇦", "", "", "PENDIENTE", "", "", "9"],
    ["M10", "Fase de Grupos", "B", new Date(2026, 5, 18), "15:00", "Canadá", "🇨🇦", "Qatar", "🇶🇦", "", "", "PENDIENTE", "", "", "10"],
    ["M11", "Fase de Grupos", "B", new Date(2026, 5, 24), "12:00", "Bosnia y Herzegovina", "🇧🇦", "Qatar", "🇶🇦", "", "", "PENDIENTE", "", "", "11"],
    ["M12", "Fase de Grupos", "B", new Date(2026, 5, 24), "12:00", "Suiza", "🇨🇭", "Canadá", "🇨🇦", "", "", "PENDIENTE", "", "", "12"],
    // GRUPO C
    ["M13", "Fase de Grupos", "C", new Date(2026, 5, 13), "18:00", "Brasil", "🇧🇷", "Marruecos", "🇲🇦", "", "", "PENDIENTE", "", "", "13"],
    ["M14", "Fase de Grupos", "C", new Date(2026, 5, 13), "21:00", "Haití", "🇭🇹", "Escocia", "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "", "", "PENDIENTE", "", "", "14"],
    ["M15", "Fase de Grupos", "C", new Date(2026, 5, 19), "18:00", "Escocia", "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Marruecos", "🇲🇦", "", "", "PENDIENTE", "", "", "15"],
    ["M16", "Fase de Grupos", "C", new Date(2026, 5, 19), "20:30", "Brasil", "🇧🇷", "Haití", "🇭🇹", "", "", "PENDIENTE", "", "", "16"],
    ["M17", "Fase de Grupos", "C", new Date(2026, 5, 24), "18:00", "Escocia", "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Brasil", "🇧🇷", "", "", "PENDIENTE", "", "", "17"],
    ["M18", "Fase de Grupos", "C", new Date(2026, 5, 24), "18:00", "Marruecos", "🇲🇦", "Haití", "🇭🇹", "", "", "PENDIENTE", "", "", "18"],
    // GRUPO D
    ["M19", "Fase de Grupos", "D", new Date(2026, 5, 14), "16:00", "Estados Unidos", "🇺🇸", "Paraguay", "🇵🇾", "", "", "PENDIENTE", "", "", "19"],
    ["M20", "Fase de Grupos", "D", new Date(2026, 5, 14), "19:00", "Australia", "🇦🇺", "Turquía", "🇹🇷", "", "", "PENDIENTE", "", "", "20"],
    ["M21", "Fase de Grupos", "D", new Date(2026, 5, 20), "16:00", "Turquía", "🇹🇷", "Paraguay", "🇵🇾", "", "", "PENDIENTE", "", "", "21"],
    ["M22", "Fase de Grupos", "D", new Date(2026, 5, 20), "19:00", "Estados Unidos", "🇺🇸", "Australia", "🇦🇺", "", "", "PENDIENTE", "", "", "22"],
    ["M23", "Fase de Grupos", "D", new Date(2026, 5, 25), "19:00", "Paraguay", "🇵🇾", "Australia", "🇦🇺", "", "", "PENDIENTE", "", "", "23"],
    ["M24", "Fase de Grupos", "D", new Date(2026, 5, 25), "22:00", "Turquía", "🇹🇷", "Estados Unidos", "🇺🇸", "", "", "PENDIENTE", "", "", "24"],
    // GRUPO E
    ["M25", "Fase de Grupos", "E", new Date(2026, 5, 14), "16:00", "Alemania", "🇩🇪", "Curazao", "🇨🇼", "", "", "PENDIENTE", "", "", "25"],
    ["M26", "Fase de Grupos", "E", new Date(2026, 5, 14), "19:00", "Costa de Marfil", "🇨🇮", "Ecuador", "🇪🇨", "", "", "PENDIENTE", "", "", "26"],
    ["M27", "Fase de Grupos", "E", new Date(2026, 5, 20), "16:00", "Ecuador", "🇪🇨", "Curazao", "🇨🇼", "", "", "PENDIENTE", "", "", "27"],
    ["M28", "Fase de Grupos", "E", new Date(2026, 5, 20), "19:00", "Alemania", "🇩🇪", "Costa de Marfil", "🇨🇮", "", "", "PENDIENTE", "", "", "28"],
    ["M29", "Fase de Grupos", "E", new Date(2026, 5, 25), "16:00", "Curazao", "🇨🇼", "Costa de Marfil", "🇨🇮", "", "", "PENDIENTE", "", "", "29"],
    ["M30", "Fase de Grupos", "E", new Date(2026, 5, 25), "16:00", "Ecuador", "🇪🇨", "Alemania", "🇩🇪", "", "", "PENDIENTE", "", "", "30"],
    // GRUPO F
    ["M31", "Fase de Grupos", "F", new Date(2026, 5, 14), "15:00", "Países Bajos", "🇳🇱", "Japón", "🇯🇵", "", "", "PENDIENTE", "", "", "31"],
    ["M32", "Fase de Grupos", "F", new Date(2026, 5, 14), "20:00", "Suecia", "🇸🇪", "Túnez", "🇹🇳", "", "", "PENDIENTE", "", "", "32"],
    ["M33", "Fase de Grupos", "F", new Date(2026, 5, 20), "12:00", "Países Bajos", "🇳🇱", "Suecia", "🇸🇪", "", "", "PENDIENTE", "", "", "33"],
    ["M34", "Fase de Grupos", "F", new Date(2026, 5, 20), "22:00", "Túnez", "🇹🇳", "Japón", "🇯🇵", "", "", "PENDIENTE", "", "", "34"],
    ["M35", "Fase de Grupos", "F", new Date(2026, 5, 25), "18:00", "Japón", "🇯🇵", "Suecia", "🇸🇪", "", "", "PENDIENTE", "", "", "35"],
    ["M36", "Fase de Grupos", "F", new Date(2026, 5, 25), "18:00", "Túnez", "🇹🇳", "Países Bajos", "🇳🇱", "", "", "PENDIENTE", "", "", "36"],
    // GRUPO G
    ["M37", "Fase de Grupos", "G", new Date(2026, 5, 15), "19:00", "Bélgica", "🇧🇪", "Egipto", "🇪🇬", "", "", "PENDIENTE", "", "", "37"],
    ["M38", "Fase de Grupos", "G", new Date(2026, 5, 15), "22:00", "Irán", "🇮🇷", "Nueva Zelanda", "🇳🇿", "", "", "PENDIENTE", "", "", "38"],
    ["M39", "Fase de Grupos", "G", new Date(2026, 5, 21), "16:00", "Nueva Zelanda", "🇳🇿", "Egipto", "🇪🇬", "", "", "PENDIENTE", "", "", "39"],
    ["M40", "Fase de Grupos", "G", new Date(2026, 5, 21), "19:00", "Bélgica", "🇧🇪", "Irán", "🇮🇷", "", "", "PENDIENTE", "", "", "40"],
    ["M41", "Fase de Grupos", "G", new Date(2026, 5, 26), "19:00", "Egipto", "🇪🇬", "Irán", "🇮🇷", "", "", "PENDIENTE", "", "", "41"],
    ["M42", "Fase de Grupos", "G", new Date(2026, 5, 26), "22:00", "Nueva Zelanda", "🇳🇿", "Bélgica", "🇧🇪", "", "", "PENDIENTE", "", "", "42"],
    // GRUPO H
    ["M43", "Fase de Grupos", "H", new Date(2026, 5, 15), "14:00", "España", "🇪🇸", "Cabo Verde", "🇨🇻", "", "", "PENDIENTE", "", "", "43"],
    ["M44", "Fase de Grupos", "H", new Date(2026, 5, 15), "17:00", "Arabia Saudita", "🇸🇦", "Uruguay", "🇺🇾", "", "", "PENDIENTE", "", "", "44"],
    ["M45", "Fase de Grupos", "H", new Date(2026, 5, 21), "14:00", "Uruguay", "🇺🇾", "Cabo Verde", "🇨🇻", "", "", "PENDIENTE", "", "", "45"],
    ["M46", "Fase de Grupos", "H", new Date(2026, 5, 21), "17:00", "España", "🇪🇸", "Arabia Saudita", "🇸🇦", "", "", "PENDIENTE", "", "", "46"],
    ["M47", "Fase de Grupos", "H", new Date(2026, 5, 26), "20:00", "Cabo Verde", "🇨🇻", "Arabia Saudita", "🇸🇦", "", "", "PENDIENTE", "", "", "47"],
    ["M48", "Fase de Grupos", "H", new Date(2026, 5, 26), "20:00", "Uruguay", "🇺🇾", "España", "🇪🇸", "", "", "PENDIENTE", "", "", "48"],
    // GRUPO I
    ["M49", "Fase de Grupos", "I", new Date(2026, 5, 16), "15:00", "Francia", "🇫🇷", "Senegal", "🇸🇳", "", "", "PENDIENTE", "", "", "49"],
    ["M50", "Fase de Grupos", "I", new Date(2026, 5, 16), "18:00", "Irak", "🇮🇶", "Noruega", "🇳🇴", "", "", "PENDIENTE", "", "", "50"],
    ["M51", "Fase de Grupos", "I", new Date(2026, 5, 22), "17:00", "Francia", "🇫🇷", "Irak", "🇮🇶", "", "", "PENDIENTE", "", "", "51"],
    ["M52", "Fase de Grupos", "I", new Date(2026, 5, 22), "20:00", "Noruega", "🇳🇴", "Senegal", "🇸🇳", "", "", "PENDIENTE", "", "", "52"],
    ["M53", "Fase de Grupos", "I", new Date(2026, 5, 26), "15:00", "Senegal", "🇸🇳", "Irak", "🇮🇶", "", "", "PENDIENTE", "", "", "53"],
    ["M54", "Fase de Grupos", "I", new Date(2026, 5, 26), "15:00", "Noruega", "🇳🇴", "Francia", "🇫🇷", "", "", "PENDIENTE", "", "", "54"],
    // GRUPO J
    ["M55", "Fase de Grupos", "J", new Date(2026, 5, 16), "20:00", "Argentina", "🇦🇷", "Argelia", "🇩🇿", "", "", "PENDIENTE", "", "", "55"],
    ["M56", "Fase de Grupos", "J", new Date(2026, 5, 16), "21:00", "Austria", "🇦🇹", "Jordania", "🇯🇴", "", "", "PENDIENTE", "", "", "56"],
    ["M57", "Fase de Grupos", "J", new Date(2026, 5, 22), "12:00", "Argentina", "🇦🇷", "Austria", "🇦🇹", "", "", "PENDIENTE", "", "", "57"],
    ["M58", "Fase de Grupos", "J", new Date(2026, 5, 22), "20:00", "Jordania", "🇯🇴", "Argelia", "🇩🇿", "", "", "PENDIENTE", "", "", "58"],
    ["M59", "Fase de Grupos", "J", new Date(2026, 5, 27), "21:00", "Argelia", "🇩🇿", "Austria", "🇦🇹", "", "", "PENDIENTE", "", "", "59"],
    ["M60", "Fase de Grupos", "J", new Date(2026, 5, 27), "21:00", "Jordania", "🇯🇴", "Argentina", "🇦🇷", "", "", "PENDIENTE", "", "", "60"],
    // GRUPO K
    ["M61", "Fase de Grupos", "K", new Date(2026, 5, 17), "12:00", "Portugal", "🇵🇹", "RD Congo", "🇨🇩", "", "", "PENDIENTE", "", "", "61"],
    ["M62", "Fase de Grupos", "K", new Date(2026, 5, 17), "20:00", "Uzbekistán", "🇺🇿", "Colombia", "🇨🇴", "", "", "PENDIENTE", "", "", "62"],
    ["M63", "Fase de Grupos", "K", new Date(2026, 5, 23), "12:00", "Portugal", "🇵🇹", "Uzbekistán", "🇺🇿", "", "", "PENDIENTE", "", "", "63"],
    ["M64", "Fase de Grupos", "K", new Date(2026, 5, 23), "20:00", "Colombia", "🇨🇴", "RD Congo", "🇨🇩", "", "", "PENDIENTE", "", "", "64"],
    ["M65", "Fase de Grupos", "K", new Date(2026, 5, 27), "19:30", "Colombia", "🇨🇴", "Portugal", "🇵🇹", "", "", "PENDIENTE", "", "", "65"],
    ["M66", "Fase de Grupos", "K", new Date(2026, 5, 27), "19:30", "RD Congo", "🇨🇩", "Uzbekistán", "🇺🇿", "", "", "PENDIENTE", "", "", "66"],
    // GRUPO L
    ["M67", "Fase de Grupos", "L", new Date(2026, 5, 17), "14:00", "Inglaterra", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Croacia", "🇭🇷", "", "", "PENDIENTE", "", "", "67"],
    ["M68", "Fase de Grupos", "L", new Date(2026, 5, 17), "17:00", "Ghana", "🇬🇭", "Panamá", "🇵🇦", "", "", "PENDIENTE", "", "", "68"],
    ["M69", "Fase de Grupos", "L", new Date(2026, 5, 23), "14:00", "Croacia", "🇭🇷", "Panamá", "🇵🇦", "", "", "PENDIENTE", "", "", "69"],
    ["M70", "Fase de Grupos", "L", new Date(2026, 5, 23), "17:00", "Inglaterra", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Ghana", "🇬🇭", "", "", "PENDIENTE", "", "", "70"],
    ["M71", "Fase de Grupos", "L", new Date(2026, 5, 27), "17:00", "Panamá", "🇵🇦", "Inglaterra", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "", "", "PENDIENTE", "", "", "71"],
    ["M72", "Fase de Grupos", "L", new Date(2026, 5, 27), "17:00", "Ghana", "🇬🇭", "Croacia", "🇭🇷", "", "", "PENDIENTE", "", "", "72"],
    // RONDA DE 32
    ["M73", "RONDA DE 32", "", new Date(2026, 5, 28), "12:00", "2do Grupo A", "", "2do Grupo B", "", "", "", "PENDIENTE", "", "", "73"],
    ["M74", "RONDA DE 32", "", new Date(2026, 5, 29), "12:00", "1ro Grupo C", "", "2do Grupo F", "", "", "", "PENDIENTE", "", "", "74"],
    ["M75", "RONDA DE 32", "", new Date(2026, 5, 29), "16:30", "1ro Grupo E", "", "3ro Grupos A/B/C/D/F", "", "", "", "PENDIENTE", "", "", "75"],
    ["M76", "RONDA DE 32", "", new Date(2026, 5, 29), "19:00", "1ro Grupo F", "", "2do Grupo C", "", "", "", "PENDIENTE", "", "", "76"],
    ["M77", "RONDA DE 32", "", new Date(2026, 5, 30), "12:00", "2do Grupo E", "", "2do Grupo I", "", "", "", "PENDIENTE", "", "", "77"],
    ["M78", "RONDA DE 32", "", new Date(2026, 5, 30), "17:00", "1ro Grupo I", "", "3ro Grupos C/D/F/G/H", "", "", "", "PENDIENTE", "", "", "78"],
    ["M79", "RONDA DE 32", "", new Date(2026, 5, 30), "19:00", "1ro Grupo A", "", "3ro Grupos C/E/F/H/I", "", "", "", "PENDIENTE", "", "", "79"],
    ["M80", "RONDA DE 32", "", new Date(2026, 6, 1), "12:00", "1ro Grupo L", "", "3ro Grupos E/H/I/J/K", "", "", "", "PENDIENTE", "", "", "80"],
    ["M81", "RONDA DE 32", "", new Date(2026, 6, 1), "13:00", "1ro Grupo G", "", "3ro Grupos A/E/H/I/J", "", "", "", "PENDIENTE", "", "", "81"],
    ["M82", "RONDA DE 32", "", new Date(2026, 6, 1), "17:00", "1ro Grupo D", "", "3ro Grupos B/E/F/I/J", "", "", "", "PENDIENTE", "", "", "82"],
    ["M83", "RONDA DE 32", "", new Date(2026, 6, 2), "12:00", "1ro Grupo H", "", "2do Grupo J", "", "", "", "PENDIENTE", "", "", "83"],
    ["M84", "RONDA DE 32", "", new Date(2026, 6, 2), "19:00", "2do Grupo K", "", "2do Grupo L", "", "", "", "PENDIENTE", "", "", "84"],
    ["M85", "RONDA DE 32", "", new Date(2026, 6, 2), "20:00", "1ro Grupo B", "", "3ro Grupos E/F/G/I/J", "", "", "", "PENDIENTE", "", "", "85"],
    ["M86", "RONDA DE 32", "", new Date(2026, 6, 3), "13:00", "2do Grupo D", "", "2do Grupo G", "", "", "", "PENDIENTE", "", "", "86"],
    ["M87", "RONDA DE 32", "", new Date(2026, 6, 3), "18:00", "1ro Grupo J", "", "2do Grupo H", "", "", "", "PENDIENTE", "", "", "87"],
    ["M88", "RONDA DE 32", "", new Date(2026, 6, 3), "20:30", "1ro Grupo K", "", "3ro Grupos D/E/I/J/L", "", "", "", "PENDIENTE", "", "", "88"],
    // OCTAVOS DE FINAL
    ["M89", "OCTAVOS DE FINAL", "", new Date(2026, 6, 4), "13:00", "Ganador M73", "", "Ganador M75", "", "", "", "PENDIENTE", "", "", "89"],
    ["M90", "OCTAVOS DE FINAL", "", new Date(2026, 6, 4), "17:00", "Ganador M74", "", "Ganador M77", "", "", "", "PENDIENTE", "", "", "90"],
    ["M91", "OCTAVOS DE FINAL", "", new Date(2026, 6, 5), "16:00", "Ganador M76", "", "Ganador M78", "", "", "", "PENDIENTE", "", "", "91"],
    ["M92", "OCTAVOS DE FINAL", "", new Date(2026, 6, 5), "20:00", "Ganador M79", "", "Ganador M80", "", "", "", "PENDIENTE", "", "", "92"],
    ["M93", "OCTAVOS DE FINAL", "", new Date(2026, 6, 6), "15:00", "Ganador M81", "", "Ganador M82", "", "", "", "PENDIENTE", "", "", "93"],
    ["M94", "OCTAVOS DE FINAL", "", new Date(2026, 6, 6), "20:00", "Ganador M83", "", "Ganador M84", "", "", "", "PENDIENTE", "", "", "94"],
    ["M95", "OCTAVOS DE FINAL", "", new Date(2026, 6, 7), "12:00", "Ganador M85", "", "Ganador M86", "", "", "", "PENDIENTE", "", "", "95"],
    ["M96", "OCTAVOS DE FINAL", "", new Date(2026, 6, 7), "16:00", "Ganador M87", "", "Ganador M88", "", "", "", "PENDIENTE", "", "", "96"],
    // CUARTOS DE FINAL
    ["M97", "CUARTOS DE FINAL", "", new Date(2026, 6, 9), "16:00", "Ganador M89", "", "Ganador M90", "", "", "", "PENDIENTE", "", "", "97"],
    ["M98", "CUARTOS DE FINAL", "", new Date(2026, 6, 10), "15:00", "Ganador M93", "", "Ganador M94", "", "", "", "PENDIENTE", "", "", "98"],
    ["M99", "CUARTOS DE FINAL", "", new Date(2026, 6, 10), "20:00", "Ganador M91", "", "Ganador M92", "", "", "", "PENDIENTE", "", "", "99"],
    ["M100", "CUARTOS DE FINAL", "", new Date(2026, 6, 11), "20:00", "Ganador M95", "", "Ganador M96", "", "", "", "PENDIENTE", "", "", "100"],
    // SEMIFINAL
    ["M101", "SEMIFINAL", "", new Date(2026, 6, 14), "20:00", "Ganador M97", "", "Ganador M98", "", "", "", "PENDIENTE", "", "", "101"],
    ["M102", "SEMIFINAL", "", new Date(2026, 6, 15), "20:00", "Ganador M99", "", "Ganador M100", "", "", "", "PENDIENTE", "", "", "102"],
    // TERCER PUESTO
    ["M103", "TERCER PUESTO", "", new Date(2026, 6, 18), "16:00", "Perdedor M101", "", "Perdedor M102", "", "", "", "PENDIENTE", "", "", "103"],
    // FINAL
    ["M104", "FINAL", "", new Date(2026, 6, 19), "15:00", "Ganador M101", "", "Ganador M102", "", "", "", "PENDIENTE", "", "", "104"]
  ];

  hoja.getRange(2, 1, p.length, 15).setValues(p);
}

function abrirWebApp() {
  var url = ScriptApp.getService().getUrl();
  var html = HtmlService.createHtmlOutput('<html><script>window.open("' + url + '", "_blank");google.script.host.close();</script></html>').setWidth(300).setHeight(100);
  SpreadsheetApp.getUi().showModalDialog(html, 'Abriendo...');
}

/**
 * ADMIN: Actualizar resultado de forma manual.
 */
function actualizarResultadoManual(adminEmail, idPartido, golLocal, golVisita) {
  try {
    checkAdmin(adminEmail);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hoja = ss.getSheetByName("Partidos");
    var data = hoja.getDataRange().getValues();
    var headers = data.shift();
    var idx = getHeaderMap(headers);

    var found = false;
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][idx["ID_PARTIDO"]]) === String(idPartido)) {
        var row = i + 2;
        hoja.getRange(row, idx["GOL_LOCAL_REAL"] + 1, 1, 3).setValues([[golLocal, golVisita, "JUGADO"]]);
        found = true;
        break;
      }
    }

    if (found) {
      recalcularTodosLosPuntos(adminEmail);
      actualizarFaseEliminatoria(adminEmail);
      return { success: true, message: "Resultado actualizado y puntos recalculados." };
    }
    return { success: false, error: "Partido no encontrado." };
  } catch (e) {
    registrarError("actualizarResultadoManual", e);
    return { success: false, error: e.toString() };
  }
}

/**
 * ADMIN: Placeholder para actualización vía API.
 */
function actualizarResultadosAPI() {
  var config = getConfig();
  if (!config.API_FOOTBALL_KEY) return "API Key no configurada.";
  // Implementación de fetch a API-Football (opcional según prompt)
  return "Funcionalidad de API lista para implementación con Key.";
}

/**
 * ADMIN: Notificar a los usuarios.
 */
function enviarNotificaciones(adminEmail) {
  checkAdmin(adminEmail);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var h = ss.getSheetByName("Participantes");
  var d = h.getDataRange().getValues(); d.shift();
  d.forEach(function(r) {
    if (r[0]) {
      try {
        MailApp.sendEmail(r[0], "Actualización de Quiniela", "Se han actualizado resultados. ¡Revisa tu posición en el ranking!");
      } catch(e) {}
    }
  });
  return "Notificaciones enviadas.";
}

/**
 * ADMIN: Crear backup de la hoja.
 */
function crearBackup(adminEmail) {
  checkAdmin(adminEmail);
  var ss = SpreadsheetApp.getActive();
  var folder = DriveApp.getRootFolder();
  var file = DriveApp.getFileById(ss.getId());
  file.makeCopy("Backup_Quiniela_" + Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd_HHmm"), folder);
  return "Backup creado en Drive.";
}

/**
 * ADMIN: Insertar datos de prueba para validación.
 */
function insertarDatosPrueba(adminEmail) {
  try {
    checkAdmin(adminEmail);
    registrarParticipante("juan@email.com", "Juan Perez", "ElCrack", 170);
    registrarParticipante("maria@email.com", "Maria Lopez", "LaMagica", 165);

    // Simular algunos resultados
    actualizarResultadoManual(adminEmail, "M1", 2, 1); // México gana
    actualizarResultadoManual(adminEmail, "M2", 0, 0); // Empate

    // Guardar algunos pronósticos
    guardarPronosticos("juan@email.com", [
      {idPartido: "M1", golLocal: 2, golVisita: 1},
      {idPartido: "M2", golLocal: 1, golVisita: 0}
    ]);

    recalcularTodosLosPuntos(adminEmail);
    return { success: true, message: "Datos de prueba (Juan, Maria) insertados correctamente." };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}
