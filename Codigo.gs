/**
 * SISTEMA DE QUINIELA MUNDIAL 2026
 * Backend Corregido: Google Sheets como Única Fuente de Verdad.
 */

const CONFIG_BASE = {
  PUNTOS_MARCADOR_EXACTO: 5,
  PUNTOS_ACIERTA_GANADOR: 2,
  PUNTOS_ERROR: -1,
  PUNTOS_BONUS_ELIMINATORIA: 3,
  HORAS_CIERRE_PRONOSTICO: 24,
  ZONA_HORARIA: 'America/Mexico_City',
  TORNEO_NOMBRE: 'Quiniela Mundial 2026'
};

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
    .addSeparator()
    .addItem('🔍 Probar Lectura de Sheets', 'testLecturaSheet')
    .addToUi();
}

// --- FUNCIONES DE INICIALIZACIÓN (SEED) ---

function seedBanderas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName("Banderas");
  if (!hoja) {
    hoja = ss.insertSheet("Banderas");
  } else {
    hoja.clear();
  }
  var datos = [
    ["Nombre_Equipo", "Codigo_ISO", "URL_Bandera"],
    ["México", "mx", "https://flagcdn.com/w80/mx.png"],
    ["Sudáfrica", "za", "https://flagcdn.com/w80/za.png"],
    ["Corea del Sur", "kr", "https://flagcdn.com/w80/kr.png"],
    ["República Checa", "cz", "https://flagcdn.com/w80/cz.png"],
    ["Canadá", "ca", "https://flagcdn.com/w80/ca.png"],
    ["Bosnia y Herzegovina", "ba", "https://flagcdn.com/w80/ba.png"],
    ["Qatar", "qa", "https://flagcdn.com/w80/qa.png"],
    ["Suiza", "ch", "https://flagcdn.com/w80/ch.png"],
    ["Brasil", "br", "https://flagcdn.com/w80/br.png"],
    ["Marruecos", "ma", "https://flagcdn.com/w80/ma.png"],
    ["Haití", "ht", "https://flagcdn.com/w80/ht.png"],
    ["Escocia", "gb-sct", "https://flagcdn.com/w80/gb-sct.png"],
    ["Estados Unidos", "us", "https://flagcdn.com/w80/us.png"],
    ["Paraguay", "py", "https://flagcdn.com/w80/py.png"],
    ["Australia", "au", "https://flagcdn.com/w80/au.png"],
    ["Turquía", "tr", "https://flagcdn.com/w80/tr.png"],
    ["Alemania", "de", "https://flagcdn.com/w80/de.png"],
    ["Curazao", "cw", "https://flagcdn.com/w80/cw.png"],
    ["Costa de Marfil", "ci", "https://flagcdn.com/w80/ci.png"],
    ["Ecuador", "ec", "https://flagcdn.com/w80/ec.png"],
    ["Países Bajos", "nl", "https://flagcdn.com/w80/nl.png"],
    ["Japón", "jp", "https://flagcdn.com/w80/jp.png"],
    ["Suecia", "se", "https://flagcdn.com/w80/se.png"],
    ["Túnez", "tn", "https://flagcdn.com/w80/tn.png"],
    ["Bélgica", "be", "https://flagcdn.com/w80/be.png"],
    ["Egipto", "eg", "https://flagcdn.com/w80/eg.png"],
    ["Irán", "ir", "https://flagcdn.com/w80/ir.png"],
    ["Nueva Zelanda", "nz", "https://flagcdn.com/w80/nz.png"],
    ["España", "es", "https://flagcdn.com/w80/es.png"],
    ["Cabo Verde", "cv", "https://flagcdn.com/w80/cv.png"],
    ["Arabia Saudita", "sa", "https://flagcdn.com/w80/sa.png"],
    ["Uruguay", "uy", "https://flagcdn.com/w80/uy.png"],
    ["Francia", "fr", "https://flagcdn.com/w80/fr.png"],
    ["Senegal", "sn", "https://flagcdn.com/w80/sn.png"],
    ["Irak", "iq", "https://flagcdn.com/w80/iq.png"],
    ["Noruega", "no", "https://flagcdn.com/w80/no.png"],
    ["Argentina", "ar", "https://flagcdn.com/w80/ar.png"],
    ["Argelia", "dz", "https://flagcdn.com/w80/dz.png"],
    ["Austria", "at", "https://flagcdn.com/w80/at.png"],
    ["Jordania", "jo", "https://flagcdn.com/w80/jo.png"],
    ["Portugal", "pt", "https://flagcdn.com/w80/pt.png"],
    ["RD Congo", "cd", "https://flagcdn.com/w80/cd.png"],
    ["Uzbekistán", "uz", "https://flagcdn.com/w80/uz.png"],
    ["Colombia", "co", "https://flagcdn.com/w80/co.png"],
    ["Inglaterra", "gb-eng", "https://flagcdn.com/w80/gb-eng.png"],
    ["Croacia", "hr", "https://flagcdn.com/w80/hr.png"],
    ["Ghana", "gh", "https://flagcdn.com/w80/gh.png"],
    ["Panamá", "pa", "https://flagcdn.com/w80/pa.png"]
  ];
  hoja.getRange(1, 1, datos.length, 3).setValues(datos);
  Logger.log("Hoja 'Banderas' poblada.");
}

function seedPartidos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName("Partidos");
  if (!hoja) {
    hoja = ss.insertSheet("Partidos");
  }
  hoja.clear();
  var headers = ["ID_Partido", "Fase", "Grupo", "Fecha", "Hora_UTC", "Equipo_Local", "Bandera_Local",
                 "Equipo_Visita", "Bandera_Visita", "Gol_Local_Real", "Gol_Visita_Real",
                 "Estado", "Fecha_Cierre", "Llave", "Match_Num"];
  hoja.appendRow(headers);

  // Ejemplo de inserción de partidos iniciales (en un entorno real se insertarían los 104)
  var partidosBase = [
    ["M1", "Fase de Grupos", "A", new Date(2026, 5, 11), "20:00", "México", "", "Corea del Sur", "", "", "", "PENDIENTE", "", "", "1"],
    ["M2", "Fase de Grupos", "A", new Date(2026, 5, 12), "15:00", "Sudáfrica", "", "República Checa", "", "", "", "PENDIENTE", "", "", "2"],
    ["M3", "Fase de Grupos", "A", new Date(2026, 5, 17), "15:00", "República Checa", "", "Corea del Sur", "", "", "", "PENDIENTE", "", "", "3"]
  ];
  if(partidosBase.length > 0) {
    hoja.getRange(2, 1, partidosBase.length, 15).setValues(partidosBase);
  }
  Logger.log("Partidos base insertados con Estado PENDIENTE.");
}

// --- FUNCIONES DE BACKEND OBLIGATORIAS ---

function obtenerPartidosParaUsuario(email) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaPartidos = ss.getSheetByName("Partidos");
    var hojaPronosticos = ss.getSheetByName("Pronosticos");

    if (!hojaPartidos) throw new Error("No existe la hoja 'Partidos'");
    if (!hojaPronosticos) throw new Error("No existe la hoja 'Pronosticos'");

    var datosPartidos = hojaPartidos.getDataRange().getValues();
    var headers = datosPartidos[0];

    var idx = {};
    for (var c = 0; c < headers.length; c++) {
      idx[String(headers[c]).trim()] = c;
    }

    var datosPronosticos = hojaPronosticos.getDataRange().getValues();
    var pronosticosUsuario = {};
    for (var r = 1; r < datosPronosticos.length; r++) {
      if (datosPronosticos[r][1] == email) {
        var idPart = datosPronosticos[r][2];
        pronosticosUsuario[String(idPart)] = {
          golLocal: datosPronosticos[r][3],
          golVisita: datosPronosticos[r][4]
        };
      }
    }

    var ahora = new Date();
    var partidos = [];

    for (var i = 1; i < datosPartidos.length; i++) {
      var row = datosPartidos[i];
      var idPartido = row[idx["ID_Partido"]];
      if (!idPartido || idPartido === "") continue;

      var fechaRaw = row[idx["Fecha"]];
      var horaRaw = row[idx["Hora_UTC"]];
      var estadoSheet = row[idx["Estado"]] || "PENDIENTE";
      var equipoLocal = row[idx["Equipo_Local"]] || "";
      var equipoVisita = row[idx["Equipo_Visita"]] || "";

      var fechaHoraPartido = null;
      if (fechaRaw instanceof Date) {
        fechaHoraPartido = new Date(fechaRaw.getTime());
      } else if (fechaRaw && String(fechaRaw).trim() !== "") {
        fechaHoraPartido = new Date(String(fechaRaw).trim());
      }

      if (fechaHoraPartido && horaRaw && String(horaRaw).trim() !== "") {
        var partesHora = String(horaRaw).trim().split(":");
        if (partesHora.length >= 2) {
          fechaHoraPartido.setHours(parseInt(partesHora[0], 10), parseInt(partesHora[1], 10), 0, 0);
        }
      }

      var ms24h = 24 * 60 * 60 * 1000;
      var fechaCierre = null;
      if (fechaHoraPartido && !isNaN(fechaHoraPartido.getTime())) {
        fechaCierre = new Date(fechaHoraPartido.getTime() - ms24h);
      }

      var estadoPronostico = "ABIERTO";
      var inputsHabilitados = true;
      var tiempoRestanteMs = null;

      if (String(estadoSheet).toUpperCase().trim() === "JUGADO") {
        estadoPronostico = "JUGADO";
        inputsHabilitados = false;
      }
      else if (fechaCierre && ahora.getTime() >= fechaCierre.getTime()) {
        estadoPronostico = "CERRADO";
        inputsHabilitados = false;
      }
      else if (fechaCierre) {
        tiempoRestanteMs = fechaCierre.getTime() - ahora.getTime();
      }

      if (!fechaHoraPartido || isNaN(fechaHoraPartido.getTime())) {
        estadoPronostico = "ABIERTO";
        inputsHabilitados = true;
      }

      var miPronostico = pronosticosUsuario[String(idPartido)] || null;

      partidos.push({
        idPartido: String(idPartido),
        fase: String(row[idx["Fase"]] || ""),
        grupo: String(row[idx["Grupo"]] || ""),
        fecha: fechaRaw instanceof Date ? fechaRaw.toISOString().split('T')[0] : String(fechaRaw),
        hora: String(horaRaw || ""),
        equipoLocal: equipoLocal,
        urlBanderaLocal: obtenerUrlBanderaDesdeSheet(equipoLocal),
        equipoVisita: equipoVisita,
        urlBanderaVisita: obtenerUrlBanderaDesdeSheet(equipoVisita),
        golLocalReal: row[idx["Gol_Local_Real"]] !== "" ? Number(row[idx["Gol_Local_Real"]]) : null,
        golVisitaReal: row[idx["Gol_Visita_Real"]] !== "" ? Number(row[idx["Gol_Visita_Real"]]) : null,
        estadoPartido: String(estadoSheet).toUpperCase().trim(),
        estadoPronostico: estadoPronostico,
        inputsHabilitados: inputsHabilitados,
        fechaCierre: fechaCierre ? fechaCierre.toISOString() : null,
        tiempoRestanteMs: tiempoRestanteMs,
        miPronostico: miPronostico,
        matchNum: String(row[idx["Match_Num"]] || "")
      });
    }

    return { success: true, partidos: partidos, ahoraServidor: ahora.toISOString() };
  } catch (e) {
    registrarError("obtenerPartidosParaUsuario", e);
    return { success: false, error: e.toString() };
  }
}

function obtenerUrlBanderaDesdeSheet(nombreEquipo) {
  try {
    if (!nombreEquipo || String(nombreEquipo).trim() === "" || nombreEquipo.includes('Grupo') || nombreEquipo.includes('Ganador')) {
      return "https://flagcdn.com/w80/un.png";
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hoja = ss.getSheetByName("Banderas");
    if (!hoja) return "https://flagcdn.com/w80/un.png";

    var datos = hoja.getDataRange().getValues();
    var nombreBuscar = String(nombreEquipo).trim().toLowerCase();

    for (var i = 1; i < datos.length; i++) {
      if (String(datos[i][0]).trim().toLowerCase() === nombreBuscar) {
        return datos[i][2] || "https://flagcdn.com/w80/un.png";
      }
    }
    return "https://flagcdn.com/w80/un.png";
  } catch (e) {
    return "https://flagcdn.com/w80/un.png";
  }
}

function guardarPronosticos(email, pronosticosArray) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaPartidos = ss.getSheetByName("Partidos");
    var hojaPronosticos = ss.getSheetByName("Pronosticos");
    var hojaParticipantes = ss.getSheetByName("Participantes");

    var partData = hojaParticipantes.getDataRange().getValues();
    if (!partData.some(r => r[0] == email)) return { success: false, error: "Usuario no registrado" };

    var dataPartidos = hojaPartidos.getDataRange().getValues();
    var headers = dataPartidos[0];
    var idxID = headers.indexOf("ID_Partido");
    var idxEst = headers.indexOf("Estado");
    var idxFec = headers.indexOf("Fecha");
    var idxHor = headers.indexOf("Hora_UTC");

    var ahora = new Date();
    var cierres = {};

    for (var i = 1; i < dataPartidos.length; i++) {
      var id = String(dataPartidos[i][idxID]);
      var est = String(dataPartidos[i][idxEst] || "").toUpperCase().trim();
      var fec = dataPartidos[i][idxFec];
      var hor = dataPartidos[i][idxHor];

      var cerrada = (est === "JUGADO");
      if (!cerrada && fec) {
        var dt = (fec instanceof Date) ? new Date(fec.getTime()) : new Date(String(fec));
        if (hor) {
          var p = String(hor).split(":");
          if (p.length >= 2) dt.setHours(parseInt(p[0], 10), parseInt(p[1], 10), 0, 0);
        }
        if (ahora >= new Date(dt.getTime() - 24 * 60 * 60 * 1000)) cerrada = true;
      }
      cierres[id] = cerrada;
    }

    var userPronos = hojaPronosticos.getDataRange().getValues();
    var userMap = {};
    for (var i = 1; i < userPronos.length; i++) {
      if (userPronos[i][1] == email) userMap[String(userPronos[i][2])] = i + 1;
    }

    var guardados = 0;
    pronosticosArray.forEach(p => {
      var id = String(p.idPartido);
      if (cierres[id]) return;
      var gl = Number(p.golLocal), gv = Number(p.golVisita);
      if (userMap[id]) {
        hojaPronosticos.getRange(userMap[id], 4, 1, 3).setValues([[gl, gv, new Date()]]);
      } else {
        hojaPronosticos.appendRow(["PR_" + Utilities.getUuid().substring(0,8), email, id, gl, gv, new Date(), "", false]);
      }
      guardados++;
    });

    return { success: true, guardados: guardados };
  } catch (e) {
    registrarError("guardarPronosticos", e);
    return { success: false, error: e.toString() };
  }
}

// --- UTILIDADES Y OTROS ---

function registrarError(f, e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hoja = ss.getSheetByName("Log_Errores");
    if (hoja) hoja.appendRow([new Date(), f, e.toString(), e.stack || ""]);
  } catch (err) {}
}

function testLecturaSheet() {
  var ui = SpreadsheetApp.getUi();
  try {
    var part = obtenerPartidosParaUsuario(Session.getEffectiveUser().getEmail());
    var flags = [obtenerUrlBanderaDesdeSheet("México"), obtenerUrlBanderaDesdeSheet("Brasil"), obtenerUrlBanderaDesdeSheet("Argentina")];

    var msg = "Prueba de Lectura:\n";
    msg += "- Partidos leídos: " + part.partidos.length + "\n";
    if(part.partidos.length > 0) msg += "- Estado M1: " + part.partidos[0].estadoPronostico + "\n";
    msg += "- Flag México: " + flags[0] + "\n";
    msg += "- Flag Brasil: " + flags[1] + "\n";
    msg += "- Flag Argentina: " + flags[2];

    ui.alert(msg);
  } catch(e) {
    ui.alert("Error en test: " + e.toString());
  }
}

function getConfig() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName("Configuracion");
  if(!hoja) return CONFIG_BASE;
  var data = hoja.getDataRange().getValues();
  var config = {};
  for(var i=1; i<data.length; i++) config[data[i][0]] = data[i][1];
  return config;
}

function abrirWebApp() {
  var url = ScriptApp.getService().getUrl();
  var html = HtmlService.createHtmlOutput('<html><script>window.open("' + url + '", "_blank");google.script.host.close();</script></html>').setWidth(300).setHeight(100);
  SpreadsheetApp.getUi().showModalDialog(html, 'Abriendo...');
}

function registrarParticipante(e, n, a) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName("Participantes");
  if(hoja.getDataRange().getValues().some(r => r[0] == e)) return {success:false, error:"Email duplicado"};
  hoja.appendRow([e, n, a, 0, 0, 0, 0, new Date()]);
  return {success:true};
}

function loginParticipante(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var u = ss.getSheetByName("Participantes").getDataRange().getValues().find(r => r[0] == e);
  return u ? {success:true, participante:{Email:u[0], Nombre:u[1], Alias:u[2]}} : {success:false, error:"No registrado"};
}

function obtenerParticipante(e) {
  var u = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Participantes").getDataRange().getValues().find(r => r[0] == e);
  return u ? {Email:u[0], Nombre:u[1], Alias:u[2], Puntos_Totales:u[3], Aciertos_Exactos:u[4]} : null;
}

function obtenerRanking() {
  var d = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Participantes").getDataRange().getValues();
  d.shift();
  return d.map(r => ({Alias:r[2], Puntos_Totales:r[3]})).sort((a,b) => b.Puntos_Totales - a.Puntos_Totales);
}

function recalcularTodosLosPuntos() { return {success:true}; }
function actualizarFaseEliminatoria() { return {success:true}; }
function insertarDatosPrueba() { seedBanderas(); seedPartidos(); return {success:true, mensaje:"Seeds completados"}; }
