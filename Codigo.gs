/**
 * SISTEMA DE QUINIELA MUNDIAL 2026
 * Backend Completo y Seguro
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

const BANDERAS_URL = {
  "México": "https://flagcdn.com/w80/mx.png",
  "Sudáfrica": "https://flagcdn.com/w80/za.png",
  "Corea del Sur": "https://flagcdn.com/w80/kr.png",
  "República Checa": "https://flagcdn.com/w80/cz.png",
  "Canadá": "https://flagcdn.com/w80/ca.png",
  "Bosnia y Herzegovina": "https://flagcdn.com/w80/ba.png",
  "Qatar": "https://flagcdn.com/w80/qa.png",
  "Suiza": "https://flagcdn.com/w80/ch.png",
  "Brasil": "https://flagcdn.com/w80/br.png",
  "Marruecos": "https://flagcdn.com/w80/ma.png",
  "Haití": "https://flagcdn.com/w80/ht.png",
  "Escocia": "https://flagcdn.com/w80/gb-sct.png",
  "Estados Unidos": "https://flagcdn.com/w80/us.png",
  "Paraguay": "https://flagcdn.com/w80/py.png",
  "Australia": "https://flagcdn.com/w80/au.png",
  "Turquía": "https://flagcdn.com/w80/tr.png",
  "Alemania": "https://flagcdn.com/w80/de.png",
  "Curazao": "https://flagcdn.com/w80/cw.png",
  "Costa de Marfil": "https://flagcdn.com/w80/ci.png",
  "Ecuador": "https://flagcdn.com/w80/ec.png",
  "Países Bajos": "https://flagcdn.com/w80/nl.png",
  "Japón": "https://flagcdn.com/w80/jp.png",
  "Suecia": "https://flagcdn.com/w80/se.png",
  "Túnez": "https://flagcdn.com/w80/tn.png",
  "Bélgica": "https://flagcdn.com/w80/be.png",
  "Egipto": "https://flagcdn.com/w80/eg.png",
  "Irán": "https://flagcdn.com/w80/ir.png",
  "Nueva Zelanda": "https://flagcdn.com/w80/nz.png",
  "España": "https://flagcdn.com/w80/es.png",
  "Cabo Verde": "https://flagcdn.com/w80/cv.png",
  "Arabia Saudita": "https://flagcdn.com/w80/sa.png",
  "Uruguay": "https://flagcdn.com/w80/uy.png",
  "Francia": "https://flagcdn.com/w80/fr.png",
  "Senegal": "https://flagcdn.com/w80/sn.png",
  "Irak": "https://flagcdn.com/w80/iq.png",
  "Noruega": "https://flagcdn.com/w80/no.png",
  "Argentina": "https://flagcdn.com/w80/ar.png",
  "Argelia": "https://flagcdn.com/w80/dz.png",
  "Austria": "https://flagcdn.com/w80/at.png",
  "Jordania": "https://flagcdn.com/w80/jo.png",
  "Portugal": "https://flagcdn.com/w80/pt.png",
  "RD Congo": "https://flagcdn.com/w80/cd.png",
  "Uzbekistán": "https://flagcdn.com/w80/uz.png",
  "Colombia": "https://flagcdn.com/w80/co.png",
  "Inglaterra": "https://flagcdn.com/w80/gb-eng.png",
  "Croacia": "https://flagcdn.com/w80/hr.png",
  "Ghana": "https://flagcdn.com/w80/gh.png",
  "Panamá": "https://flagcdn.com/w80/pa.png"
};

const CALENDARIO_HARDCODED = [
  {ID_Partido: 'M1', Fase: 'Grupos', Grupo: 'A', Fecha: '2026-06-11', Hora_UTC: '20:00:00-06:00', Equipo_Local: 'México', Equipo_Visita: 'Corea del Sur', Match_Num: 1},
  {ID_Partido: 'M2', Fase: 'Grupos', Grupo: 'A', Fecha: '2026-06-12', Hora_UTC: '15:00:00-04:00', Equipo_Local: 'Sudáfrica', Equipo_Visita: 'República Checa', Match_Num: 2},
  {ID_Partido: 'M3', Fase: 'Grupos', Grupo: 'A', Fecha: '2026-06-17', Hora_UTC: '15:00:00-04:00', Equipo_Local: 'República Checa', Equipo_Visita: 'Corea del Sur', Match_Num: 3},
  {ID_Partido: 'M4', Fase: 'Grupos', Grupo: 'A', Fecha: '2026-06-17', Hora_UTC: '20:00:00-06:00', Equipo_Local: 'México', Equipo_Visita: 'Sudáfrica', Match_Num: 4},
  {ID_Partido: 'M5', Fase: 'Grupos', Grupo: 'A', Fecha: '2026-06-23', Hora_UTC: '15:00:00-04:00', Equipo_Local: 'Corea del Sur', Equipo_Visita: 'Sudáfrica', Match_Num: 5},
  {ID_Partido: 'M6', Fase: 'Grupos', Grupo: 'A', Fecha: '2026-06-23', Hora_UTC: '20:00:00-06:00', Equipo_Local: 'República Checa', Equipo_Visita: 'México', Match_Num: 6},
  {ID_Partido: 'M7', Fase: 'Grupos', Grupo: 'B', Fecha: '2026-06-12', Hora_UTC: '15:00:00-04:00', Equipo_Local: 'Canadá', Equipo_Visita: 'Bosnia y Herzegovina', Match_Num: 7},
  {ID_Partido: 'M8', Fase: 'Grupos', Grupo: 'B', Fecha: '2026-06-13', Hora_UTC: '12:00:00-07:00', Equipo_Local: 'Qatar', Equipo_Visita: 'Suiza', Match_Num: 8},
  {ID_Partido: 'M9', Fase: 'Grupos', Grupo: 'B', Fecha: '2026-06-18', Hora_UTC: '12:00:00-07:00', Equipo_Local: 'Suiza', Equipo_Visita: 'Bosnia y Herzegovina', Match_Num: 9},
  {ID_Partido: 'M10', Fase: 'Grupos', Grupo: 'B', Fecha: '2026-06-18', Hora_UTC: '15:00:00-07:00', Equipo_Local: 'Canadá', Equipo_Visita: 'Qatar', Match_Num: 10},
  {ID_Partido: 'M11', Fase: 'Grupos', Grupo: 'B', Fecha: '2026-06-24', Hora_UTC: '12:00:00-07:00', Equipo_Local: 'Bosnia y Herzegovina', Equipo_Visita: 'Qatar', Match_Num: 11},
  {ID_Partido: 'M12', Fase: 'Grupos', Grupo: 'B', Fecha: '2026-06-24', Hora_UTC: '12:00:00-07:00', Equipo_Local: 'Suiza', Equipo_Visita: 'Canadá', Match_Num: 12},
  {ID_Partido: 'M13', Fase: 'Grupos', Grupo: 'C', Fecha: '2026-06-13', Hora_UTC: '18:00:00-04:00', Equipo_Local: 'Brasil', Equipo_Visita: 'Marruecos', Match_Num: 13},
  {ID_Partido: 'M14', Fase: 'Grupos', Grupo: 'C', Fecha: '2026-06-13', Hora_UTC: '21:00:00-04:00', Equipo_Local: 'Haití', Equipo_Visita: 'Escocia', Match_Num: 14},
  {ID_Partido: 'M15', Fase: 'Grupos', Grupo: 'C', Fecha: '2026-06-19', Hora_UTC: '18:00:00-04:00', Equipo_Local: 'Escocia', Equipo_Visita: 'Marruecos', Match_Num: 15},
  {ID_Partido: 'M16', Fase: 'Grupos', Grupo: 'C', Fecha: '2026-06-19', Hora_UTC: '20:30:00-04:00', Equipo_Local: 'Brasil', Equipo_Visita: 'Haití', Match_Num: 16},
  {ID_Partido: 'M17', Fase: 'Grupos', Grupo: 'C', Fecha: '2026-06-24', Hora_UTC: '18:00:00-04:00', Equipo_Local: 'Escocia', Equipo_Visita: 'Brasil', Match_Num: 17},
  {ID_Partido: 'M18', Fase: 'Grupos', Grupo: 'C', Fecha: '2026-06-24', Hora_UTC: '18:00:00-04:00', Equipo_Local: 'Marruecos', Equipo_Visita: 'Haití', Match_Num: 18},
  {ID_Partido: 'M19', Fase: 'Grupos', Grupo: 'D', Fecha: '2026-06-14', Hora_UTC: '16:00:00-07:00', Equipo_Local: 'Estados Unidos', Equipo_Visita: 'Paraguay', Match_Num: 19},
  {ID_Partido: 'M20', Fase: 'Grupos', Grupo: 'D', Fecha: '2026-06-14', Hora_UTC: '19:00:00-07:00', Equipo_Local: 'Australia', Equipo_Visita: 'Turquía', Match_Num: 20},
  {ID_Partido: 'M21', Fase: 'Grupos', Grupo: 'D', Fecha: '2026-06-20', Hora_UTC: '16:00:00-07:00', Equipo_Local: 'Turquía', Equipo_Visita: 'Paraguay', Match_Num: 21},
  {ID_Partido: 'M22', Fase: 'Grupos', Grupo: 'D', Fecha: '2026-06-20', Hora_UTC: '19:00:00-07:00', Equipo_Local: 'Estados Unidos', Equipo_Visita: 'Australia', Match_Num: 22},
  {ID_Partido: 'M23', Fase: 'Grupos', Grupo: 'D', Fecha: '2026-06-25', Hora_UTC: '19:00:00-07:00', Equipo_Local: 'Paraguay', Equipo_Visita: 'Australia', Match_Num: 23},
  {ID_Partido: 'M24', Fase: 'Grupos', Grupo: 'D', Fecha: '2026-06-25', Hora_UTC: '22:00:00-07:00', Equipo_Local: 'Turquía', Equipo_Visita: 'Estados Unidos', Match_Num: 24},
  {ID_Partido: 'M25', Fase: 'Grupos', Grupo: 'E', Fecha: '2026-06-14', Hora_UTC: '16:00:00-04:00', Equipo_Local: 'Alemania', Equipo_Visita: 'Curazao', Match_Num: 25},
  {ID_Partido: 'M26', Fase: 'Grupos', Grupo: 'E', Fecha: '2026-06-14', Hora_UTC: '19:00:00-04:00', Equipo_Local: 'Costa de Marfil', Equipo_Visita: 'Ecuador', Match_Num: 26},
  {ID_Partido: 'M27', Fase: 'Grupos', Grupo: 'E', Fecha: '2026-06-20', Hora_UTC: '16:00:00-04:00', Equipo_Local: 'Ecuador', Equipo_Visita: 'Curazao', Match_Num: 27},
  {ID_Partido: 'M28', Fase: 'Grupos', Grupo: 'E', Fecha: '2026-06-20', Hora_UTC: '19:00:00-04:00', Equipo_Local: 'Alemania', Equipo_Visita: 'Costa de Marfil', Match_Num: 28},
  {ID_Partido: 'M29', Fase: 'Grupos', Grupo: 'E', Fecha: '2026-06-25', Hora_UTC: '16:00:00-04:00', Equipo_Local: 'Curazao', Equipo_Visita: 'Costa de Marfil', Match_Num: 29},
  {ID_Partido: 'M30', Fase: 'Grupos', Grupo: 'E', Fecha: '2026-06-25', Hora_UTC: '16:00:00-04:00', Equipo_Local: 'Ecuador', Equipo_Visita: 'Alemania', Match_Num: 30},
  {ID_Partido: 'M31', Fase: 'Grupos', Grupo: 'F', Fecha: '2026-06-14', Hora_UTC: '15:00:00-05:00', Equipo_Local: 'Países Bajos', Equipo_Visita: 'Japón', Match_Num: 31},
  {ID_Partido: 'M32', Fase: 'Grupos', Grupo: 'F', Fecha: '2026-06-14', Hora_UTC: '20:00:00-06:00', Equipo_Local: 'Suecia', Equipo_Visita: 'Túnez', Match_Num: 32},
  {ID_Partido: 'M33', Fase: 'Grupos', Grupo: 'F', Fecha: '2026-06-20', Hora_UTC: '12:00:00-05:00', Equipo_Local: 'Países Bajos', Equipo_Visita: 'Suecia', Match_Num: 33},
  {ID_Partido: 'M34', Fase: 'Grupos', Grupo: 'F', Fecha: '2026-06-20', Hora_UTC: '22:00:00-06:00', Equipo_Local: 'Túnez', Equipo_Visita: 'Japón', Match_Num: 34},
  {ID_Partido: 'M35', Fase: 'Grupos', Grupo: 'F', Fecha: '2026-06-25', Hora_UTC: '18:00:00-05:00', Equipo_Local: 'Japón', Equipo_Visita: 'Suecia', Match_Num: 35},
  {ID_Partido: 'M36', Fase: 'Grupos', Grupo: 'F', Fecha: '2026-06-25', Hora_UTC: '18:00:00-05:00', Equipo_Local: 'Túnez', Equipo_Visita: 'Países Bajos', Match_Num: 36},
  {ID_Partido: 'M37', Fase: 'Grupos', Grupo: 'G', Fecha: '2026-06-15', Hora_UTC: '19:00:00-07:00', Equipo_Local: 'Bélgica', Equipo_Visita: 'Egipto', Match_Num: 37},
  {ID_Partido: 'M38', Fase: 'Grupos', Grupo: 'G', Fecha: '2026-06-15', Hora_UTC: '22:00:00-07:00', Equipo_Local: 'Irán', Equipo_Visita: 'Nueva Zelanda', Match_Num: 38},
  {ID_Partido: 'M39', Fase: 'Grupos', Grupo: 'G', Fecha: '2026-06-21', Hora_UTC: '16:00:00-07:00', Equipo_Local: 'Nueva Zelanda', Equipo_Visita: 'Egipto', Match_Num: 39},
  {ID_Partido: 'M40', Fase: 'Grupos', Grupo: 'G', Fecha: '2026-06-21', Hora_UTC: '19:00:00-07:00', Equipo_Local: 'Bélgica', Equipo_Visita: 'Irán', Match_Num: 40},
  {ID_Partido: 'M41', Fase: 'Grupos', Grupo: 'G', Fecha: '2026-06-26', Hora_UTC: '19:00:00-07:00', Equipo_Local: 'Egipto', Equipo_Visita: 'Irán', Match_Num: 41},
  {ID_Partido: 'M42', Fase: 'Grupos', Grupo: 'G', Fecha: '2026-06-26', Hora_UTC: '22:00:00-07:00', Equipo_Local: 'Nueva Zelanda', Equipo_Visita: 'Bélgica', Match_Num: 42},
  {ID_Partido: 'M43', Fase: 'Grupos', Grupo: 'H', Fecha: '2026-06-15', Hora_UTC: '14:00:00-06:00', Equipo_Local: 'España', Equipo_Visita: 'Cabo Verde', Match_Num: 43},
  {ID_Partido: 'M44', Fase: 'Grupos', Grupo: 'H', Fecha: '2026-06-15', Hora_UTC: '17:00:00-06:00', Equipo_Local: 'Arabia Saudita', Equipo_Visita: 'Uruguay', Match_Num: 44},
  {ID_Partido: 'M45', Fase: 'Grupos', Grupo: 'H', Fecha: '2026-06-21', Hora_UTC: '14:00:00-06:00', Equipo_Local: 'Uruguay', Equipo_Visita: 'Cabo Verde', Match_Num: 45},
  {ID_Partido: 'M46', Fase: 'Grupos', Grupo: 'H', Fecha: '2026-06-21', Hora_UTC: '17:00:00-06:00', Equipo_Local: 'España', Equipo_Visita: 'Arabia Saudita', Match_Num: 46},
  {ID_Partido: 'M47', Fase: 'Grupos', Grupo: 'H', Fecha: '2026-06-26', Hora_UTC: '20:00:00-06:00', Equipo_Local: 'Cabo Verde', Equipo_Visita: 'Arabia Saudita', Match_Num: 47},
  {ID_Partido: 'M48', Fase: 'Grupos', Grupo: 'H', Fecha: '2026-06-26', Hora_UTC: '20:00:00-06:00', Equipo_Local: 'Uruguay', Equipo_Visita: 'España', Match_Num: 48},
  {ID_Partido: 'M49', Fase: 'Grupos', Grupo: 'I', Fecha: '2026-06-16', Hora_UTC: '15:00:00-04:00', Equipo_Local: 'Francia', Equipo_Visita: 'Senegal', Match_Num: 49},
  {ID_Partido: 'M50', Fase: 'Grupos', Grupo: 'I', Fecha: '2026-06-16', Hora_UTC: '18:00:00-04:00', Equipo_Local: 'Irak', Equipo_Visita: 'Noruega', Match_Num: 50},
  {ID_Partido: 'M51', Fase: 'Grupos', Grupo: 'I', Fecha: '2026-06-22', Hora_UTC: '17:00:00-04:00', Equipo_Local: 'Francia', Equipo_Visita: 'Irak', Match_Num: 51},
  {ID_Partido: 'M52', Fase: 'Grupos', Grupo: 'I', Fecha: '2026-06-22', Hora_UTC: '20:00:00-04:00', Equipo_Local: 'Noruega', Equipo_Visita: 'Senegal', Match_Num: 52},
  {ID_Partido: 'M53', Fase: 'Grupos', Grupo: 'I', Fecha: '2026-06-26', Hora_UTC: '15:00:00-04:00', Equipo_Local: 'Senegal', Equipo_Visita: 'Irak', Match_Num: 53},
  {ID_Partido: 'M54', Fase: 'Grupos', Grupo: 'I', Fecha: '2026-06-26', Hora_UTC: '15:00:00-04:00', Equipo_Local: 'Noruega', Equipo_Visita: 'Francia', Match_Num: 54},
  {ID_Partido: 'M55', Fase: 'Grupos', Grupo: 'J', Fecha: '2026-06-16', Hora_UTC: '20:00:00-05:00', Equipo_Local: 'Argentina', Equipo_Visita: 'Argelia', Match_Num: 55},
  {ID_Partido: 'M56', Fase: 'Grupos', Grupo: 'J', Fecha: '2026-06-16', Hora_UTC: '21:00:00-07:00', Equipo_Local: 'Austria', Equipo_Visita: 'Jordania', Match_Num: 56},
  {ID_Partido: 'M57', Fase: 'Grupos', Grupo: 'J', Fecha: '2026-06-22', Hora_UTC: '12:00:00-05:00', Equipo_Local: 'Argentina', Equipo_Visita: 'Austria', Match_Num: 57},
  {ID_Partido: 'M58', Fase: 'Grupos', Grupo: 'J', Fecha: '2026-06-22', Hora_UTC: '20:00:00-07:00', Equipo_Local: 'Jordania', Equipo_Visita: 'Argelia', Match_Num: 58},
  {ID_Partido: 'M59', Fase: 'Grupos', Grupo: 'J', Fecha: '2026-06-27', Hora_UTC: '21:00:00-05:00', Equipo_Local: 'Argelia', Equipo_Visita: 'Austria', Match_Num: 59},
  {ID_Partido: 'M60', Fase: 'Grupos', Grupo: 'J', Fecha: '2026-06-27', Hora_UTC: '21:00:00-05:00', Equipo_Local: 'Jordania', Equipo_Visita: 'Argentina', Match_Num: 60},
  {ID_Partido: 'M61', Fase: 'Grupos', Grupo: 'K', Fecha: '2026-06-17', Hora_UTC: '12:00:00-05:00', Equipo_Local: 'Portugal', Equipo_Visita: 'RD Congo', Match_Num: 61},
  {ID_Partido: 'M62', Fase: 'Grupos', Grupo: 'K', Fecha: '2026-06-17', Hora_UTC: '20:00:00-06:00', Equipo_Local: 'Uzbekistán', Equipo_Visita: 'Colombia', Match_Num: 62},
  {ID_Partido: 'M63', Fase: 'Grupos', Grupo: 'K', Fecha: '2026-06-23', Hora_UTC: '12:00:00-05:00', Equipo_Local: 'Portugal', Equipo_Visita: 'Uzbekistán', Match_Num: 63},
  {ID_Partido: 'M64', Fase: 'Grupos', Grupo: 'K', Fecha: '2026-06-23', Hora_UTC: '20:00:00-06:00', Equipo_Local: 'Colombia', Equipo_Visita: 'RD Congo', Match_Num: 64},
  {ID_Partido: 'M65', Fase: 'Grupos', Grupo: 'K', Fecha: '2026-06-27', Hora_UTC: '19:30:00-04:00', Equipo_Local: 'Colombia', Equipo_Visita: 'Portugal', Match_Num: 65},
  {ID_Partido: 'M66', Fase: 'Grupos', Grupo: 'K', Fecha: '2026-06-27', Hora_UTC: '19:30:00-04:00', Equipo_Local: 'RD Congo', Equipo_Visita: 'Uzbekistán', Match_Num: 66},
  {ID_Partido: 'M67', Fase: 'Grupos', Grupo: 'L', Fecha: '2026-06-17', Hora_UTC: '14:00:00-04:00', Equipo_Local: 'Inglaterra', Equipo_Visita: 'Croacia', Match_Num: 67},
  {ID_Partido: 'M68', Fase: 'Grupos', Grupo: 'L', Fecha: '2026-06-17', Hora_UTC: '17:00:00-04:00', Equipo_Local: 'Ghana', Equipo_Visita: 'Panamá', Match_Num: 68},
  {ID_Partido: 'M69', Fase: 'Grupos', Grupo: 'L', Fecha: '2026-06-23', Hora_UTC: '14:00:00-04:00', Equipo_Local: 'Croacia', Equipo_Visita: 'Panamá', Match_Num: 69},
  {ID_Partido: 'M70', Fase: 'Grupos', Grupo: 'L', Fecha: '2026-06-23', Hora_UTC: '17:00:00-04:00', Equipo_Local: 'Inglaterra', Equipo_Visita: 'Ghana', Match_Num: 70},
  {ID_Partido: 'M71', Fase: 'Grupos', Grupo: 'L', Fecha: '2026-06-27', Hora_UTC: '17:00:00-04:00', Equipo_Local: 'Panamá', Equipo_Visita: 'Inglaterra', Match_Num: 71},
  {ID_Partido: 'M72', Fase: 'Grupos', Grupo: 'L', Fecha: '2026-06-27', Hora_UTC: '17:00:00-04:00', Equipo_Local: 'Ghana', Equipo_Visita: 'Croacia', Match_Num: 72},
  {ID_Partido: 'M73', Fase: 'Ronda de 32', Fecha: '2026-06-28', Hora_UTC: '12:00:00-07:00', Equipo_Local: '2do Grupo A', Equipo_Visita: '2do Grupo B', Match_Num: 73},
  {ID_Partido: 'M74', Fase: 'Ronda de 32', Fecha: '2026-06-29', Hora_UTC: '12:00:00-05:00', Equipo_Local: '1ro Grupo C', Equipo_Visita: '2do Grupo F', Match_Num: 74},
  {ID_Partido: 'M75', Fase: 'Ronda de 32', Fecha: '2026-06-29', Hora_UTC: '16:30:00-04:00', Equipo_Local: '1ro Grupo E', Equipo_Visita: '3ro Grupos A/B/C/D/F', Match_Num: 75},
  {ID_Partido: 'M76', Fase: 'Ronda de 32', Fecha: '2026-06-29', Hora_UTC: '19:00:00-06:00', Equipo_Local: '1ro Grupo F', Equipo_Visita: '2do Grupo C', Match_Num: 76},
  {ID_Partido: 'M77', Fase: 'Ronda de 32', Fecha: '2026-06-30', Hora_UTC: '12:00:00-05:00', Equipo_Local: '2do Grupo E', Equipo_Visita: '2do Grupo I', Match_Num: 77},
  {ID_Partido: 'M78', Fase: 'Ronda de 32', Fecha: '2026-06-30', Hora_UTC: '17:00:00-04:00', Equipo_Local: '1ro Grupo I', Equipo_Visita: '3ro Grupos C/D/F/G/H', Match_Num: 78},
  {ID_Partido: 'M79', Fase: 'Ronda de 32', Fecha: '2026-06-30', Hora_UTC: '19:00:00-06:00', Equipo_Local: '1ro Grupo A', Equipo_Visita: '3ro Grupos C/E/F/H/I', Match_Num: 79},
  {ID_Partido: 'M80', Fase: 'Ronda de 32', Fecha: '2026-07-01', Hora_UTC: '12:00:00-04:00', Equipo_Local: '1ro Grupo L', Equipo_Visita: '3ro Grupos E/H/I/J/K', Match_Num: 80},
  {ID_Partido: 'M81', Fase: 'Ronda de 32', Fecha: '2026-07-01', Hora_UTC: '13:00:00-07:00', Equipo_Local: '1ro Grupo G', Equipo_Visita: '3ro Grupos A/E/H/I/J', Match_Num: 81},
  {ID_Partido: 'M82', Fase: 'Ronda de 32', Fecha: '2026-07-01', Hora_UTC: '17:00:00-07:00', Equipo_Local: '1ro Grupo D', Equipo_Visita: '3ro Grupos B/E/F/I/J', Match_Num: 82},
  {ID_Partido: 'M83', Fase: 'Ronda de 32', Fecha: '2026-07-02', Hora_UTC: '12:00:00-07:00', Equipo_Local: '1ro Grupo H', Equipo_Visita: '2do Grupo J', Match_Num: 83},
  {ID_Partido: 'M84', Fase: 'Ronda de 32', Fecha: '2026-07-02', Hora_UTC: '19:00:00-04:00', Equipo_Local: '2do Grupo K', Equipo_Visita: '2do Grupo L', Match_Num: 84},
  {ID_Partido: 'M85', Fase: 'Ronda de 32', Fecha: '2026-07-02', Hora_UTC: '20:00:00-07:00', Equipo_Local: '1ro Grupo B', Equipo_Visita: '3ro Grupos E/F/G/I/J', Match_Num: 85},
  {ID_Partido: 'M86', Fase: 'Ronda de 32', Fecha: '2026-07-03', Hora_UTC: '13:00:00-05:00', Equipo_Local: '2do Grupo D', Equipo_Visita: '2do Grupo G', Match_Num: 86},
  {ID_Partido: 'M87', Fase: 'Ronda de 32', Fecha: '2026-07-03', Hora_UTC: '18:00:00-04:00', Equipo_Local: '1ro Grupo J', Equipo_Visita: '2do Grupo H', Match_Num: 87},
  {ID_Partido: 'M88', Fase: 'Ronda de 32', Fecha: '2026-07-03', Hora_UTC: '20:30:00-05:00', Equipo_Local: '1ro Grupo K', Equipo_Visita: '3ro Grupos D/E/I/J/L', Match_Num: 88},
  {ID_Partido: 'M89', Fase: 'Octavos', Fecha: '2026-07-04', Hora_UTC: '13:00:00-05:00', Equipo_Local: 'Ganador M73', Equipo_Visita: 'Ganador M75', Match_Num: 89},
  {ID_Partido: 'M90', Fase: 'Octavos', Fecha: '2026-07-04', Hora_UTC: '17:00:00-04:00', Equipo_Local: 'Ganador M74', Equipo_Visita: 'Ganador M77', Match_Num: 90},
  {ID_Partido: 'M91', Fase: 'Octavos', Fecha: '2026-07-05', Hora_UTC: '16:00:00-04:00', Equipo_Local: 'Ganador M76', Equipo_Visita: 'Ganador M78', Match_Num: 91},
  {ID_Partido: 'M92', Fase: 'Octavos', Fecha: '2026-07-05', Hora_UTC: '20:00:00-06:00', Equipo_Local: 'Ganador M79', Equipo_Visita: 'Ganador M80', Match_Num: 92},
  {ID_Partido: 'M93', Fase: 'Octavos', Fecha: '2026-07-06', Hora_UTC: '15:00:00-05:00', Equipo_Local: 'Ganador M81', Equipo_Visita: 'Ganador M82', Match_Num: 93},
  {ID_Partido: 'M94', Fase: 'Octavos', Fecha: '2026-07-06', Hora_UTC: '20:00:00-07:00', Equipo_Local: 'Ganador M83', Equipo_Visita: 'Ganador M84', Match_Num: 94},
  {ID_Partido: 'M95', Fase: 'Octavos', Fecha: '2026-07-07', Hora_UTC: '12:00:00-04:00', Equipo_Local: 'Ganador M85', Equipo_Visita: 'Ganador M86', Match_Num: 95},
  {ID_Partido: 'M96', Fase: 'Octavos', Fecha: '2026-07-07', Hora_UTC: '16:00:00-07:00', Equipo_Local: 'Ganador M87', Equipo_Visita: 'Ganador M88', Match_Num: 96},
  {ID_Partido: 'M97', Fase: 'Cuartos', Fecha: '2026-07-09', Hora_UTC: '16:00:00-04:00', Equipo_Local: 'Ganador M89', Equipo_Visita: 'Ganador M90', Match_Num: 97},
  {ID_Partido: 'M98', Fase: 'Cuartos', Fecha: '2026-07-10', Hora_UTC: '15:00:00-07:00', Equipo_Local: 'Ganador M93', Equipo_Visita: 'Ganador M94', Match_Num: 98},
  {ID_Partido: 'M99', Fase: 'Cuartos', Fecha: '2026-07-10', Hora_UTC: '20:00:00-04:00', Equipo_Local: 'Ganador M91', Equipo_Visita: 'Ganador M92', Match_Num: 99},
  {ID_Partido: 'M100', Fase: 'Cuartos', Fecha: '2026-07-11', Hora_UTC: '20:00:00-04:00', Equipo_Local: 'Ganador M95', Equipo_Visita: 'Ganador M96', Match_Num: 100},
  {ID_Partido: 'M101', Fase: 'Semifinales', Fecha: '2026-07-14', Hora_UTC: '20:00:00-04:00', Equipo_Local: 'Ganador M97', Equipo_Visita: 'Ganador M98', Match_Num: 101},
  {ID_Partido: 'M102', Fase: 'Semifinales', Fecha: '2026-07-15', Hora_UTC: '20:00:00-04:00', Equipo_Local: 'Ganador M99', Equipo_Visita: 'Ganador M100', Match_Num: 102},
  {ID_Partido: 'M103', Fase: 'Tercer Puesto', Fecha: '2026-07-18', Hora_UTC: '16:00:00-04:00', Equipo_Local: 'Perdedor M101', Equipo_Visita: 'Perdedor M102', Match_Num: 103},
  {ID_Partido: 'M104', Fase: 'Final', Fecha: '2026-07-19', Hora_UTC: '15:00:00-04:00', Equipo_Local: 'Ganador M101', Equipo_Visita: 'Ganador M102', Match_Num: 104}
];

function obtenerUrlBandera(nombrePais) {
  return BANDERAS_URL[nombrePais] || "https://flagcdn.com/w80/un.png";
}

function inicializarSistema() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojas = [
    { nombre: 'Configuracion', headers: ['Parametro', 'Valor'] },
    { nombre: 'Equipos', headers: ['ID_Equipo', 'Nombre_Equipo', 'Grupo'] },
    { nombre: 'Partidos', headers: ['ID_Partido', 'Fase', 'Grupo', 'Fecha', 'Hora_UTC', 'Equipo_Local', 'Equipo_Visita', 'Gol_Local_Real', 'Gol_Visita_Real', 'Estado', 'Fecha_Cierre', 'Match_Num'] },
    { nombre: 'Participantes', headers: ['Email', 'Nombre', 'Alias', 'Puntos_Totales', 'Aciertos_Exactos', 'Aciertos_Ganador', 'Errores', 'Fecha_Registro'] },
    { nombre: 'Pronosticos', headers: ['ID_Pronostico', 'Email_Participante', 'ID_Partido', 'Gol_Local', 'Gol_Visita', 'Fecha_Registro', 'Puntos_Obtenidos', 'Calculado'] },
    { nombre: 'Log_Errores', headers: ['Fecha', 'Funcion', 'Error', 'Detalle'] }
  ];

  hojas.forEach(h => {
    let sheet = ss.getSheetByName(h.nombre);
    if (!sheet) {
      sheet = ss.insertSheet(h.nombre);
      sheet.appendRow(h.headers);
      sheet.getRange(1, 1, 1, h.headers.length).setFontWeight('bold').setBackground('#1E293B').setFontColor('white');
    }
  });

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
    .addSeparator()
    .addItem('🔄 Actualizar Resultados API (Sim)', 'actualizarResultadosAPI')
    .addItem('🏆 Actualizar Fase Eliminatoria', 'actualizarFaseEliminatoria')
    .addItem('📊 Recalcular Puntos', 'recalcularTodosLosPuntos')
    .addSeparator()
    .addItem('📧 Notificar Resultados (Stub)', 'enviarNotificaciones')
    .addItem('💾 Crear Backup', 'crearBackup')
    .addItem('💾 Seed Partidos', 'seedPartidos')
    .addItem('🧪 Insertar Datos Prueba', 'insertarDatosPrueba')
    .addToUi();
}

function abrirWebApp() {
  const url = ScriptApp.getService().getUrl();
  const html = HtmlService.createHtmlOutput('<html><script>window.open("' + url + '", "_blank");google.script.host.close();</script></html>')
    .setWidth(300).setHeight(100);
  SpreadsheetApp.getUi().showModalDialog(html, 'Abriendo Web App...');
}

function doGet(e) {
  const page = e.parameter.p || 'Index';
  const config = getConfig();
  const userEmail = Session.getEffectiveUser().getEmail();

  // SEGURIDAD: Solo el administrador puede acceder a la vista Admin
  if (page === 'Admin' && userEmail !== config.ADMIN_EMAIL) {
    return HtmlService.createHtmlOutput('<h1>Acceso Denegado</h1><p>Solo el administrador tiene acceso a esta sección.</p>');
  }

  try {
    return HtmlService.createTemplateFromFile(page)
      .evaluate()
      .setTitle(config.TORNEO_NOMBRE || 'Quiniela 2026')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch(err) {
    return HtmlService.createHtmlOutput('<h1>Error</h1><p>' + err.message + '</p>');
  }
}

// --- FUNCIONES DE DATOS ---

function getSheetData(sheetName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) { inicializarSistema(); sheet = ss.getSheetByName(sheetName); }
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    const headers = data.shift();
    return data.map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        let val = row[i];
        if (val instanceof Date) val = val.toISOString();
        obj[header] = val;
      });
      return obj;
    });
  } catch (e) {
    logError('getSheetData', e.message, sheetName);
    return [];
  }
}

function getConfig() {
  const data = getSheetData('Configuracion');
  const config = {};
  data.forEach(row => config[row.Parametro] = row.Valor);
  return config;
}

function seedPartidos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const equipoSheet = ss.getSheetByName('Equipos');
  if (equipoSheet.getLastRow() > 1) equipoSheet.getRange(2, 1, equipoSheet.getLastRow() - 1, 3).clearContent();
  const equipos = [
    [1, 'México', 'A'], [2, 'Sudáfrica', 'A'], [3, 'Corea del Sur', 'A'], [4, 'República Checa', 'A'],
    [5, 'Canadá', 'B'], [6, 'Bosnia y Herzegovina', 'B'], [7, 'Qatar', 'B'], [8, 'Suiza', 'B'],
    [9, 'Brasil', 'C'], [10, 'Marruecos', 'C'], [11, 'Haití', 'C'], [12, 'Escocia', 'C'],
    [13, 'Estados Unidos', 'D'], [14, 'Paraguay', 'D'], [15, 'Australia', 'D'], [16, 'Turquía', 'D'],
    [17, 'Alemania', 'E'], [18, 'Curazao', 'E'], [19, 'Costa de Marfil', 'E'], [20, 'Ecuador', 'E'],
    [21, 'Países Bajos', 'F'], [22, 'Japón', 'F'], [23, 'Suecia', 'F'], [24, 'Túnez', 'F'],
    [25, 'Bélgica', 'G'], [26, 'Egipto', 'G'], [27, 'Irán', 'G'], [28, 'Nueva Zelanda', 'G'],
    [29, 'España', 'H'], [30, 'Cabo Verde', 'H'], [31, 'Arabia Saudita', 'H'], [32, 'Uruguay', 'H'],
    [33, 'Francia', 'I'], [34, 'Senegal', 'I'], [35, 'Irak', 'I'], [36, 'Noruega', 'I'],
    [37, 'Argentina', 'J'], [38, 'Argelia', 'J'], [39, 'Austria', 'J'], [40, 'Jordania', 'J'],
    [41, 'Portugal', 'K'], [42, 'RD Congo', 'K'], [43, 'Uzbekistán', 'K'], [44, 'Colombia', 'K'],
    [45, 'Inglaterra', 'L'], [46, 'Croacia', 'L'], [47, 'Ghana', 'L'], [48, 'Panamá', 'L']
  ];
  equipoSheet.getRange(2, 1, equipos.length, 3).setValues(equipos);

  const partidoSheet = ss.getSheetByName('Partidos');
  if (partidoSheet.getLastRow() > 1) partidoSheet.getRange(2, 1, partidoSheet.getLastRow() - 1, 12).clearContent();
  const partidosData = CALENDARIO_HARDCODED.map(m => [
    m.ID_Partido, m.Fase, m.Grupo || '', m.Fecha, m.Hora_UTC, m.Equipo_Local, m.Equipo_Visita, '', '', 'ABIERTO', calcularFechaCierreLocal(m.Fecha, m.Hora_UTC), m.Match_Num
  ]);
  partidoSheet.getRange(2, 1, partidosData.length, 12).setValues(partidosData);
  return { success: true };
}

// --- USUARIOS Y LOGIN ---

function registrarParticipante(email, nombre, alias) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Participantes');
    const data = sheet.getDataRange().getValues();
    if (data.some(row => row[0].toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'Email ya registrado.' };
    }
    if (data.some(row => row[2].toLowerCase() === alias.toLowerCase())) {
      return { success: false, error: 'Alias ya en uso.' };
    }
    sheet.appendRow([email, nombre, alias, 0, 0, 0, 0, new Date()]);
    return { success: true, message: '¡Registro exitoso!' };
  } catch (e) {
    logError('registrarParticipante', e.message, email);
    return { success: false, error: 'Error al registrar.' };
  }
}

function loginParticipante(email) {
  const data = getSheetData('Participantes');
  const p = data.find(row => row.Email.toLowerCase() === email.toLowerCase());
  return p ? { success: true, participante: p } : { success: false, error: 'Email no encontrado.' };
}

function obtenerParticipante(email) {
  const data = getSheetData('Participantes');
  return data.find(p => p.Email.toLowerCase() === email.toLowerCase()) || null;
}

function obtenerRanking() {
  const data = getSheetData('Participantes');
  return data.sort((a, b) => b.Puntos_Totales - a.Puntos_Totales);
}

// --- PRONOSTICOS ---

function estaCerradoPronostico(idPartido) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Partidos');
  const data = sheet.getDataRange().getValues();
  const partido = data.find(row => row[0] === idPartido);
  if (!partido) return true;

  const estado = partido[9];
  const fCierre = new Date(partido[10]);
  const ahora = new Date();

  return (estado === "JUGADO" || ahora >= fCierre);
}

function guardarPronosticos(email, pronosticosArray) {
  try {
    const p = obtenerParticipante(email);
    if (!p) return { success: false, message: 'Usuario no encontrado.' };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Pronosticos');
    const data = sheet.getDataRange().getValues();
    const results = { guardados: [], ignorados: [] };

    pronosticosArray.forEach(pIn => {
      if (estaCerradoPronostico(pIn.idPartido)) {
        results.ignorados.push(pIn.idPartido);
        return;
      }
      const rowIndex = data.findIndex(row => row[1].toLowerCase() === email.toLowerCase() && row[2] === pIn.idPartido);
      if (rowIndex > -1) {
        // UPDATE
        sheet.getRange(rowIndex + 1, 4, 1, 3).setValues([[pIn.golLocal, pIn.golVisita, new Date()]]);
      } else {
        // INSERT
        const newID = 'PRON-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        sheet.appendRow([newID, email, pIn.idPartido, pIn.golLocal, pIn.golVisita, new Date(), 0, false]);
      }
      results.guardados.push(pIn.idPartido);
    });
    return { success: true, results };
  } catch (e) {
    logError('guardarPronosticos', e.message, email);
    return { success: false, message: 'Error al guardar pronósticos.' };
  }
}

function obtenerPronosticos(email) {
  return getSheetData('Pronosticos').filter(p => p.Email_Participante.toLowerCase() === email.toLowerCase());
}

function obtenerPartidos() {
  const partidos = getSheetData('Partidos');
  return partidos.map(p => ({
    ...p,
    urlBanderaLocal: obtenerUrlBandera(p.Equipo_Local),
    urlBanderaVisita: obtenerUrlBandera(p.Equipo_Visita)
  }));
}

// --- CALCULOS Y LOGICA TORNEO ---

function recalcularTodosLosPuntos() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const partidos = getSheetData('Partidos');
    const pronosSheet = ss.getSheetByName('Pronosticos');
    if (pronosSheet.getLastRow() < 2) return { success: true };
    const pData = pronosSheet.getDataRange().getValues();
    const pRows = pData.slice(1);
    const pStats = {};

    pRows.forEach(row => {
      const match = partidos.find(m => m.ID_Partido === row[2]);
      if (match && match.Estado === 'JUGADO') {
        const res = calcularPuntos(Number(match.Gol_Local_Real), Number(match.Gol_Visita_Real), Number(row[3]), Number(row[4]), match.Fase !== 'Grupos');
        row[6] = res.puntos;
        row[7] = true;
        const email = row[1].toLowerCase();
        if (!pStats[email]) pStats[email] = { pts: 0, ex: 0, gan: 0, err: 0 };
        pStats[email].pts += res.puntos;
        if (res.tipo === 'EXACTO') pStats[email].ex++;
        else if (res.tipo === 'GANADOR') pStats[email].gan++;
        else pStats[email].err++;
      }
    });
    pronosSheet.getRange(2, 1, pRows.length, pData[0].length).setValues(pRows);

    const partSheet = ss.getSheetByName('Participantes');
    const partData = partSheet.getDataRange().getValues();
    const partRows = partData.slice(1);
    partRows.forEach(row => {
      const stats = pStats[row[0].toLowerCase()];
      if (stats) {
        row[3] = stats.pts; row[4] = stats.ex; row[5] = stats.gan; row[6] = stats.err;
      }
    });
    partSheet.getRange(2, 1, partRows.length, partData[0].length).setValues(partRows);
    return { success: true };
  } catch (e) {
    logError('recalcularTodosLosPuntos', e.message, '');
    return { success: false, error: e.message };
  }
}

function calcularPuntos(glr, gvr, glp, gvp, esElim) {
  const config = getConfig();
  if (glr === glp && gvr === gvp) {
    return { puntos: Number(config.PUNTOS_MARCADOR_EXACTO) + (esElim ? Number(config.PUNTOS_BONUS_ELIMINATORIA) : 0), tipo: "EXACTO" };
  }
  if ((glr > gvr && glp > gvp) || (glr < gvr && glp < gvp) || (glr === gvr && glp === gvp)) {
    return { puntos: Number(config.PUNTOS_ACIERTA_GANADOR), tipo: "GANADOR" };
  }
  return { puntos: Number(config.PUNTOS_ERROR), tipo: "ERROR" };
}

function calcularTablaGrupo(gName) {
  const matches = getSheetData('Partidos').filter(m => m.Grupo === gName && m.Estado === 'JUGADO');
  const teams = getSheetData('Equipos').filter(t => t.Grupo === gName);
  const table = teams.map(t => ({ nombre: t.Nombre_Equipo, pj: 0, pts: 0, dg: 0, gf: 0 }));
  matches.forEach(m => {
    const l = table.find(t => t.nombre === m.Equipo_Local), v = table.find(t => t.nombre === m.Equipo_Visita);
    if (!l || !v) return;
    const gl = Number(m.Gol_Local_Real), gv = Number(m.Gol_Visita_Real);
    l.pj++; v.pj++; l.gf += gl; v.gf += gv; l.dg += (gl - gv); v.dg += (gv - gl);
    if (gl > gv) l.pts += 3; else if (gl < gv) v.pts += 3; else { l.pts++; v.pts++; }
  });
  return table.sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf);
}

function actualizarFaseEliminatoria() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet(), pSheet = ss.getSheetByName('Partidos'), partidos = getSheetData('Partidos');
    const grupos = ['A','B','C','D','E','F','G','H','I','J','K','L'], clasif = {}, terc = [];
    grupos.forEach(g => { const t = calcularTablaGrupo(g); clasif[g] = {p1: t[0], p2: t[1], p3: t[2]}; terc.push({...t[2], g}); });
    const mejores8 = terc.sort((a,b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf).slice(0, 8);

    partidos.forEach((p, idx) => {
      if (p.Fase === 'Ronda de 32') {
        let nL = p.Equipo_Local, nV = p.Equipo_Visita, changed = false;
        const r1 = /1ro Grupo ([A-L])/, r2 = /2do Grupo ([A-L])/;
        if (r1.test(nL)) {
          const g = nL.match(r1)[1];
          if(clasif[g].p1.pj > 0) { nL = clasif[g].p1.nombre; changed = true; }
        } else if (r2.test(nL)) {
          const g = nL.match(r2)[1];
          if(clasif[g].p2.pj > 0) { nL = clasif[g].p2.nombre; changed = true; }
        }
        if (r1.test(nV)) {
          const g = nV.match(r1)[1];
          if(clasif[g].p1.pj > 0) { nV = clasif[g].p1.nombre; changed = true; }
        } else if (r2.test(nV)) {
          const g = nV.match(r2)[1];
          if(clasif[g].p2.pj > 0) { nV = clasif[g].p2.nombre; changed = true; }
        }
        if (nV.includes('3ro Grupos')) {
          const mIdx = {75:0, 78:1, 79:2, 80:3, 81:4, 82:5, 85:6, 88:7}[p.Match_Num];
          if (mIdx !== undefined && mejores8[mIdx] && mejores8[mIdx].pj > 0) { nV = mejores8[mIdx].nombre; changed = true; }
        }
        if (changed) pSheet.getRange(idx + 2, 6, 1, 2).setValues([[nL, nV]]);
      }
    });
    propagarGanadores();
    return { success: true };
  } catch (e) { logError('actualizarFaseEliminatoria', e.message, ''); return { success: false, error: e.message }; }
}

function propagarGanadores() {
  const ss = SpreadsheetApp.getActiveSpreadsheet(), pSheet = ss.getSheetByName('Partidos'), p = getSheetData('Partidos');
  const win = {};
  p.forEach(m => {
    if (m.Fase !== 'Grupos' && m.Estado === 'JUGADO') {
      win[m.ID_Partido] = Number(m.Gol_Local_Real) >= Number(m.Gol_Visita_Real) ? m.Equipo_Local : m.Equipo_Visita;
    }
  });
  p.forEach((m, idx) => {
    if (m.Equipo_Local.startsWith('Ganador M')) {
      const k = m.Equipo_Local.split(' ')[1]; if (win[k]) pSheet.getRange(idx + 2, 6).setValue(win[k]);
    }
    if (m.Equipo_Visita.startsWith('Ganador M')) {
      const k = m.Equipo_Visita.split(' ')[1]; if (win[k]) pSheet.getRange(idx + 2, 7).setValue(win[k]);
    }
  });
}

// --- ADMIN ---

function actualizarResultadoManual(idPartido, golL, golV) {
  const userEmail = Session.getEffectiveUser().getEmail();
  const config = getConfig();
  if (userEmail !== config.ADMIN_EMAIL) return { success: false, message: 'No autorizado' };

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Partidos');
    const data = sheet.getDataRange().getValues();
    const rowIndex = data.findIndex(row => row[0] === idPartido);

    if (rowIndex > -1) {
      sheet.getRange(rowIndex + 1, 8).setValue(golL);
      sheet.getRange(rowIndex + 1, 9).setValue(golV);
      sheet.getRange(rowIndex + 1, 10).setValue('JUGADO');

      recalcularTodosLosPuntos();
      actualizarFaseEliminatoria();

      return { success: true, message: 'Resultado actualizado y puntos recalculados.' };
    }
    return { success: false, message: 'Partido no encontrado.' };
  } catch (e) {
    logError('actualizarResultadoManual', e.message, idPartido);
    return { success: false, message: e.message };
  }
}

function actualizarResultadosAPI() {
  // Simulación: En un entorno real se usaría UrlFetchApp.
  return { success: true, message: 'Resultados sincronizados vía API (Simulado).' };
}

function enviarNotificaciones() {
  return { success: true, message: 'Notificaciones enviadas a participantes (Simulado).' };
}

function crearBackup() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const folder = DriveApp.getRootFolder();
    const file = DriveApp.getFileById(ss.getId());
    file.makeCopy(ss.getName() + '_Backup_' + new Date().toISOString(), folder);
    return { success: true, message: 'Backup creado en Drive.' };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

function insertarDatosPrueba() {
  registrarParticipante('test1@ejemplo.com', 'Usuario Test 1', 'ElCrack');
  registrarParticipante('test2@ejemplo.com', 'Usuario Test 2', 'LaMagica');

  const pronos = [
    { idPartido: 'M1', golLocal: 2, golVisita: 1 },
    { idPartido: 'M2', golLocal: 1, golVisita: 1 }
  ];
  guardarPronosticos('test1@ejemplo.com', pronos);

  // Simular resultados reales
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Partidos');
  sheet.getRange(2, 8, 2, 3).setValues([
    [2, 1, 'JUGADO'],
    [0, 0, 'JUGADO']
  ]);

  recalcularTodosLosPuntos();
  actualizarFaseEliminatoria();

  return { success: true, message: 'Datos de prueba insertados.' };
}

// --- UTILIDADES ---

function logError(f, e, d) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Log_Errores');
    if(sheet) sheet.appendRow([new Date(), f, e, d]);
  } catch(err) {}
}

function calcularFechaCierreLocal(f, h) {
  try {
    const parts = h.split(':'), hh = parts[0].padStart(2, '0'), mm = parts[1].padStart(2, '0');
    let ss = "00", off = "";
    if (parts[2]) {
      if (parts[2].includes('-')) { const s = parts[2].split('-'); ss = s[0].padStart(2, '0'); off = '-' + s[1]; }
      else if (parts[2].includes('+')) { const s = parts[2].split('+'); ss = s[0].padStart(2, '0'); off = '+' + s[1]; }
      else ss = parts[2].padStart(2, '0');
    }
    const d = new Date(f + 'T' + hh + ':' + mm + ':' + ss + off);
    d.setHours(d.getHours() - 24);
    return d;
  } catch (e) { return new Date(f); }
}
