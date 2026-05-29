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

const BANDERAS = {
  "México": "🇲🇽", "Sudáfrica": "🇿🇦", "Corea del Sur": "🇰🇷", "República Checa": "🇨🇿",
  "Canadá": "🇨🇦", "Bosnia y Herzegovina": "🇧🇦", "Qatar": "🇶🇦", "Suiza": "🇨🇭",
  "Brasil": "🇧🇷", "Marruecos": "🇲🇦", "Haití": "🇭🇹", "Escocia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Estados Unidos": "🇺🇸", "Paraguay": "🇵🇾", "Australia": "🇦🇺", "Turquía": "🇹🇷",
  "Alemania": "🇩🇪", "Curazao": "🇨🇼", "Costa de Marfil": "🇨🇮", "Ecuador": "🇪🇨",
  "Países Bajos": "🇳🇱", "Japón": "🇯🇵", "Suecia": "🇸🇪", "Túnez": "🇹🇳",
  "Bélgica": "🇧🇪", "Egipto": "🇪🇬", "Irán": "🇮🇷", "Nueva Zelanda": "🇳🇿",
  "España": "🇪🇸", "Cabo Verde": "🇨🇻", "Arabia Saudita": "🇸🇦", "Uruguay": "🇺🇾",
  "Francia": "🇫🇷", "Senegal": "🇸🇳", "Irak": "🇮🇶", "Noruega": "🇳🇴",
  "Argentina": "🇦🇷", "Argelia": "🇩🇿", "Austria": "🇦🇹", "Jordania": "🇯🇴",
  "Portugal": "🇵🇹", "RD Congo": "🇨🇩", "Uzbekistán": "🇺🇿", "Colombia": "🇨🇴",
  "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Croacia": "🇭🇷", "Ghana": "🇬🇭", "Panamá": "🇵🇦"
};

const CALENDARIO_HARDCODED = [
  {ID_Partido: 'M1', Fase: 'Grupos', Grupo: 'A', Fecha: '2026-06-11', Hora_UTC: '20:00:00-06:00', Equipo_Local: 'México', Bandera_Local: '🇲🇽', Equipo_Visita: 'Corea del Sur', Bandera_Visita: '🇰🇷', Match_Num: 1},
  {ID_Partido: 'M2', Fase: 'Grupos', Grupo: 'A', Fecha: '2026-06-12', Hora_UTC: '15:00:00-04:00', Equipo_Local: 'Sudáfrica', Bandera_Local: '🇿🇦', Equipo_Visita: 'República Checa', Bandera_Visita: '🇨🇿', Match_Num: 2},
  {ID_Partido: 'M3', Fase: 'Grupos', Grupo: 'A', Fecha: '2026-06-17', Hora_UTC: '15:00:00-04:00', Equipo_Local: 'República Checa', Bandera_Local: '🇨🇿', Equipo_Visita: 'Corea del Sur', Bandera_Visita: '🇰🇷', Match_Num: 3},
  {ID_Partido: 'M4', Fase: 'Grupos', Grupo: 'A', Fecha: '2026-06-17', Hora_UTC: '20:00:00-06:00', Equipo_Local: 'México', Bandera_Local: '🇲🇽', Equipo_Visita: 'Sudáfrica', Bandera_Visita: '🇿🇦', Match_Num: 4},
  {ID_Partido: 'M5', Fase: 'Grupos', Grupo: 'A', Fecha: '2026-06-23', Hora_UTC: '15:00:00-04:00', Equipo_Local: 'Corea del Sur', Bandera_Local: '🇰🇷', Equipo_Visita: 'Sudáfrica', Bandera_Visita: '🇿🇦', Match_Num: 5},
  {ID_Partido: 'M6', Fase: 'Grupos', Grupo: 'A', Fecha: '2026-06-23', Hora_UTC: '20:00:00-06:00', Equipo_Local: 'República Checa', Bandera_Local: '🇨🇿', Equipo_Visita: 'México', Bandera_Visita: '🇲🇽', Match_Num: 6},
  {ID_Partido: 'M7', Fase: 'Grupos', Grupo: 'B', Fecha: '2026-06-12', Hora_UTC: '15:00:00-04:00', Equipo_Local: 'Canadá', Bandera_Local: '🇨🇦', Equipo_Visita: 'Bosnia y Herzegovina', Bandera_Visita: '🇧🇦', Match_Num: 7},
  {ID_Partido: 'M8', Fase: 'Grupos', Grupo: 'B', Fecha: '2026-06-13', Hora_UTC: '12:00:00-07:00', Equipo_Local: 'Qatar', Bandera_Local: '🇶🇦', Equipo_Visita: 'Suiza', Bandera_Visita: '🇨🇭', Match_Num: 8},
  {ID_Partido: 'M9', Fase: 'Grupos', Grupo: 'B', Fecha: '2026-06-18', Hora_UTC: '12:00:00-07:00', Equipo_Local: 'Suiza', Bandera_Local: '🇨🇭', Equipo_Visita: 'Bosnia y Herzegovina', Bandera_Visita: '🇧🇦', Match_Num: 9},
  {ID_Partido: 'M10', Fase: 'Grupos', Grupo: 'B', Fecha: '2026-06-18', Hora_UTC: '15:00:00-07:00', Equipo_Local: 'Canadá', Bandera_Local: '🇨🇦', Equipo_Visita: 'Qatar', Bandera_Visita: '🇶🇦', Match_Num: 10},
  {ID_Partido: 'M11', Fase: 'Grupos', Grupo: 'B', Fecha: '2026-06-24', Hora_UTC: '12:00:00-07:00', Equipo_Local: 'Bosnia y Herzegovina', Bandera_Local: '🇧🇦', Equipo_Visita: 'Qatar', Bandera_Visita: '🇶🇦', Match_Num: 11},
  {ID_Partido: 'M12', Fase: 'Grupos', Grupo: 'B', Fecha: '2026-06-24', Hora_UTC: '12:00:00-07:00', Equipo_Local: 'Suiza', Bandera_Local: '🇨🇭', Equipo_Visita: 'Canadá', Bandera_Visita: '🇨🇦', Match_Num: 12},
  {ID_Partido: 'M13', Fase: 'Grupos', Grupo: 'C', Fecha: '2026-06-13', Hora_UTC: '18:00:00-04:00', Equipo_Local: 'Brasil', Bandera_Local: '🇧🇷', Equipo_Visita: 'Marruecos', Bandera_Visita: '🇲🇦', Match_Num: 13},
  {ID_Partido: 'M14', Fase: 'Grupos', Grupo: 'C', Fecha: '2026-06-13', Hora_UTC: '21:00:00-04:00', Equipo_Local: 'Haití', Bandera_Local: '🇭🇹', Equipo_Visita: 'Escocia', Bandera_Visita: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', Match_Num: 14},
  {ID_Partido: 'M15', Fase: 'Grupos', Grupo: 'C', Fecha: '2026-06-19', Hora_UTC: '18:00:00-04:00', Equipo_Local: 'Escocia', Bandera_Local: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', Equipo_Visita: 'Marruecos', Bandera_Visita: '🇲🇦', Match_Num: 15},
  {ID_Partido: 'M16', Fase: 'Grupos', Grupo: 'C', Fecha: '2026-06-19', Hora_UTC: '20:30:00-04:00', Equipo_Local: 'Brasil', Bandera_Local: '🇧🇷', Equipo_Visita: 'Haití', Bandera_Visita: '🇭🇹', Match_Num: 16},
  {ID_Partido: 'M17', Fase: 'Grupos', Grupo: 'C', Fecha: '2026-06-24', Hora_UTC: '18:00:00-04:00', Equipo_Local: 'Escocia', Bandera_Local: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', Equipo_Visita: 'Brasil', Bandera_Visita: '🇧🇷', Match_Num: 17},
  {ID_Partido: 'M18', Fase: 'Grupos', Grupo: 'C', Fecha: '2026-06-24', Hora_UTC: '18:00:00-04:00', Equipo_Local: 'Marruecos', Bandera_Local: '🇲🇦', Equipo_Visita: 'Haití', Bandera_Visita: '🇭🇹', Match_Num: 18},
  {ID_Partido: 'M19', Fase: 'Grupos', Grupo: 'D', Fecha: '2026-06-14', Hora_UTC: '16:00:00-07:00', Equipo_Local: 'Estados Unidos', Bandera_Local: '🇺🇸', Equipo_Visita: 'Paraguay', Bandera_Visita: '🇵🇾', Match_Num: 19},
  {ID_Partido: 'M20', Fase: 'Grupos', Grupo: 'D', Fecha: '2026-06-14', Hora_UTC: '19:00:00-07:00', Equipo_Local: 'Australia', Bandera_Local: '🇦🇺', Equipo_Visita: 'Turquía', Bandera_Visita: '🇹🇷', Match_Num: 20},
  {ID_Partido: 'M21', Fase: 'Grupos', Grupo: 'D', Fecha: '2026-06-20', Hora_UTC: '16:00:00-07:00', Equipo_Local: 'Turquía', Bandera_Local: '🇹🇷', Equipo_Visita: 'Paraguay', Bandera_Visita: '🇵🇾', Match_Num: 21},
  {ID_Partido: 'M22', Fase: 'Grupos', Grupo: 'D', Fecha: '2026-06-20', Hora_UTC: '19:00:00-07:00', Equipo_Local: 'Estados Unidos', Bandera_Local: '🇺🇸', Equipo_Visita: 'Australia', Bandera_Visita: '🇦🇺', Match_Num: 22},
  {ID_Partido: 'M23', Fase: 'Grupos', Grupo: 'D', Fecha: '2026-06-25', Hora_UTC: '19:00:00-07:00', Equipo_Local: 'Paraguay', Bandera_Local: '🇵🇾', Equipo_Visita: 'Australia', Bandera_Visita: '🇦🇺', Match_Num: 23},
  {ID_Partido: 'M24', Fase: 'Grupos', Grupo: 'D', Fecha: '2026-06-25', Hora_UTC: '22:00:00-07:00', Equipo_Local: 'Turquía', Bandera_Local: '🇹🇷', Equipo_Visita: 'Estados Unidos', Bandera_Visita: '🇺🇸', Match_Num: 24},
  {ID_Partido: 'M25', Fase: 'Grupos', Grupo: 'E', Fecha: '2026-06-14', Hora_UTC: '16:00:00-04:00', Equipo_Local: 'Alemania', Bandera_Local: '🇩🇪', Equipo_Visita: 'Curazao', Bandera_Visita: '🇨🇼', Match_Num: 25},
  {ID_Partido: 'M26', Fase: 'Grupos', Grupo: 'E', Fecha: '2026-06-14', Hora_UTC: '19:00:00-04:00', Equipo_Local: 'Costa de Marfil', Bandera_Local: '🇨🇮', Equipo_Visita: 'Ecuador', Bandera_Visita: '🇪🇨', Match_Num: 26},
  {ID_Partido: 'M27', Fase: 'Grupos', Grupo: 'E', Fecha: '2026-06-20', Hora_UTC: '16:00:00-04:00', Equipo_Local: 'Ecuador', Bandera_Local: '🇪🇨', Equipo_Visita: 'Curazao', Bandera_Visita: '🇨🇼', Match_Num: 27},
  {ID_Partido: 'M28', Fase: 'Grupos', Grupo: 'E', Fecha: '2026-06-20', Hora_UTC: '19:00:00-04:00', Equipo_Local: 'Alemania', Bandera_Local: '🇩🇪', Equipo_Visita: 'Costa de Marfil', Bandera_Visita: '🇨🇮', Match_Num: 28},
  {ID_Partido: 'M29', Fase: 'Grupos', Grupo: 'E', Fecha: '2026-06-25', Hora_UTC: '16:00:00-04:00', Equipo_Local: 'Curazao', Bandera_Local: '🇨🇼', Equipo_Visita: 'Costa de Marfil', Bandera_Visita: '🇨🇮', Match_Num: 29},
  {ID_Partido: 'M30', Fase: 'Grupos', Grupo: 'E', Fecha: '2026-06-25', Hora_UTC: '16:00:00-04:00', Equipo_Local: 'Ecuador', Bandera_Local: '🇪🇨', Equipo_Visita: 'Alemania', Bandera_Visita: '🇩🇪', Match_Num: 30},
  {ID_Partido: 'M31', Fase: 'Grupos', Grupo: 'F', Fecha: '2026-06-14', Hora_UTC: '15:00:00-05:00', Equipo_Local: 'Países Bajos', Bandera_Local: '🇳🇱', Equipo_Visita: 'Japón', Bandera_Visita: '🇯🇵', Match_Num: 31},
  {ID_Partido: 'M32', Fase: 'Grupos', Grupo: 'F', Fecha: '2026-06-14', Hora_UTC: '20:00:00-06:00', Equipo_Local: 'Suecia', Bandera_Local: '🇸🇪', Equipo_Visita: 'Túnez', Bandera_Visita: '🇹🇳', Match_Num: 32},
  {ID_Partido: 'M33', Fase: 'Grupos', Grupo: 'F', Fecha: '2026-06-20', Hora_UTC: '12:00:00-05:00', Equipo_Local: 'Países Bajos', Bandera_Local: '🇳🇱', Equipo_Visita: 'Suecia', Bandera_Visita: '🇸🇪', Match_Num: 33},
  {ID_Partido: 'M34', Fase: 'Grupos', Grupo: 'F', Fecha: '2026-06-20', Hora_UTC: '22:00:00-06:00', Equipo_Local: 'Túnez', Bandera_Local: '🇹🇳', Equipo_Visita: 'Japón', Bandera_Visita: '🇯🇵', Match_Num: 34},
  {ID_Partido: 'M35', Fase: 'Grupos', Grupo: 'F', Fecha: '2026-06-25', Hora_UTC: '18:00:00-05:00', Equipo_Local: 'Japón', Bandera_Local: '🇯🇵', Equipo_Visita: 'Suecia', Bandera_Visita: '🇸🇪', Match_Num: 35},
  {ID_Partido: 'M36', Fase: 'Grupos', Grupo: 'F', Fecha: '2026-06-25', Hora_UTC: '18:00:00-05:00', Equipo_Local: 'Túnez', Bandera_Local: '🇹🇳', Equipo_Visita: 'Países Bajos', Bandera_Visita: '🇳🇱', Match_Num: 36},
  {ID_Partido: 'M37', Fase: 'Grupos', Grupo: 'G', Fecha: '2026-06-15', Hora_UTC: '19:00:00-07:00', Equipo_Local: 'Bélgica', Bandera_Local: '🇧🇪', Equipo_Visita: 'Egipto', Bandera_Visita: '🇪🇬', Match_Num: 37},
  {ID_Partido: 'M38', Fase: 'Grupos', Grupo: 'G', Fecha: '2026-06-15', Hora_UTC: '22:00:00-07:00', Equipo_Local: 'Irán', Bandera_Local: '🇮🇷', Equipo_Visita: 'Nueva Zelanda', Bandera_Visita: '🇳🇿', Match_Num: 38},
  {ID_Partido: 'M39', Fase: 'Grupos', Grupo: 'G', Fecha: '2026-06-21', Hora_UTC: '16:00:00-07:00', Equipo_Local: 'Nueva Zelanda', Bandera_Local: '🇳🇿', Equipo_Visita: 'Egipto', Bandera_Visita: '🇪🇬', Match_Num: 39},
  {ID_Partido: 'M40', Fase: 'Grupos', Grupo: 'G', Fecha: '2026-06-21', Hora_UTC: '19:00:00-07:00', Equipo_Local: 'Bélgica', Bandera_Local: '🇧🇪', Equipo_Visita: 'Irán', Bandera_Visita: '🇮🇷', Match_Num: 40},
  {ID_Partido: 'M41', Fase: 'Grupos', Grupo: 'G', Fecha: '2026-06-26', Hora_UTC: '19:00:00-07:00', Equipo_Local: 'Egipto', Bandera_Local: '🇪🇬', Equipo_Visita: 'Irán', Bandera_Visita: '🇮🇷', Match_Num: 41},
  {ID_Partido: 'M42', Fase: 'Grupos', Grupo: 'G', Fecha: '2026-06-26', Hora_UTC: '22:00:00-07:00', Equipo_Local: 'Nueva Zelanda', Bandera_Local: '🇳🇿', Equipo_Visita: 'Bélgica', Bandera_Visita: '🇧🇪', Match_Num: 42},
  {ID_Partido: 'M43', Fase: 'Grupos', Grupo: 'H', Fecha: '2026-06-15', Hora_UTC: '14:00:00-06:00', Equipo_Local: 'España', Bandera_Local: '🇪🇸', Equipo_Visita: 'Cabo Verde', Bandera_Visita: '🇨🇻', Match_Num: 43},
  {ID_Partido: 'M44', Fase: 'Grupos', Grupo: 'H', Fecha: '2026-06-15', Hora_UTC: '17:00:00-06:00', Equipo_Local: 'Arabia Saudita', Bandera_Local: '🇸🇦', Equipo_Visita: 'Uruguay', Bandera_Visita: '🇺🇾', Match_Num: 44},
  {ID_Partido: 'M45', Fase: 'Grupos', Grupo: 'H', Fecha: '2026-06-21', Hora_UTC: '14:00:00-06:00', Equipo_Local: 'Uruguay', Bandera_Local: '🇺🇾', Equipo_Visita: 'Cabo Verde', Bandera_Visita: '🇨🇻', Match_Num: 45},
  {ID_Partido: 'M46', Fase: 'Grupos', Grupo: 'H', Fecha: '2026-06-21', Hora_UTC: '17:00:00-06:00', Equipo_Local: 'España', Bandera_Local: '🇪🇸', Equipo_Visita: 'Arabia Saudita', Bandera_Visita: '🇸🇦', Match_Num: 46},
  {ID_Partido: 'M47', Fase: 'Grupos', Grupo: 'H', Fecha: '2026-06-26', Hora_UTC: '20:00:00-06:00', Equipo_Local: 'Cabo Verde', Bandera_Local: '🇨🇻', Equipo_Visita: 'Arabia Saudita', Bandera_Visita: '🇸🇦', Match_Num: 47},
  {ID_Partido: 'M48', Fase: 'Grupos', Grupo: 'H', Fecha: '2026-06-26', Hora_UTC: '20:00:00-06:00', Equipo_Local: 'Uruguay', Bandera_Local: '🇺🇾', Equipo_Visita: 'España', Bandera_Visita: '🇪🇸', Match_Num: 48},
  {ID_Partido: 'M49', Fase: 'Grupos', Grupo: 'I', Fecha: '2026-06-16', Hora_UTC: '15:00:00-04:00', Equipo_Local: 'Francia', Bandera_Local: '🇫🇷', Equipo_Visita: 'Senegal', Bandera_Visita: '🇸🇳', Match_Num: 49},
  {ID_Partido: 'M50', Fase: 'Grupos', Grupo: 'I', Fecha: '2026-06-16', Hora_UTC: '18:00:00-04:00', Equipo_Local: 'Irak', Bandera_Local: '🇮🇶', Equipo_Visita: 'Noruega', Bandera_Visita: '🇳🇴', Match_Num: 50},
  {ID_Partido: 'M51', Fase: 'Grupos', Grupo: 'I', Fecha: '2026-06-22', Hora_UTC: '17:00:00-04:00', Equipo_Local: 'Francia', Bandera_Local: '🇫🇷', Equipo_Visita: 'Irak', Bandera_Visita: '🇮🇶', Match_Num: 51},
  {ID_Partido: 'M52', Fase: 'Grupos', Grupo: 'I', Fecha: '2026-06-22', Hora_UTC: '20:00:00-04:00', Equipo_Local: 'Noruega', Bandera_Local: '🇳🇴', Equipo_Visita: 'Senegal', Bandera_Visita: '🇸🇳', Match_Num: 52},
  {ID_Partido: 'M53', Fase: 'Grupos', Grupo: 'I', Fecha: '2026-06-26', Hora_UTC: '15:00:00-04:00', Equipo_Local: 'Senegal', Bandera_Local: '🇸🇳', Equipo_Visita: 'Irak', Bandera_Visita: '🇮🇶', Match_Num: 53},
  {ID_Partido: 'M54', Fase: 'Grupos', Grupo: 'I', Fecha: '2026-06-26', Hora_UTC: '15:00:00-04:00', Equipo_Local: 'Noruega', Bandera_Local: '🇳🇴', Equipo_Visita: 'Francia', Bandera_Visita: '🇫🇷', Match_Num: 54},
  {ID_Partido: 'M55', Fase: 'Grupos', Grupo: 'J', Fecha: '2026-06-16', Hora_UTC: '20:00:00-05:00', Equipo_Local: 'Argentina', Bandera_Local: '🇦🇷', Equipo_Visita: 'Argelia', Bandera_Visita: '🇩🇿', Match_Num: 55},
  {ID_Partido: 'M56', Fase: 'Grupos', Grupo: 'J', Fecha: '2026-06-16', Hora_UTC: '21:00:00-07:00', Equipo_Local: 'Austria', Bandera_Local: '🇦🇹', Equipo_Visita: 'Jordania', Bandera_Visita: '🇯🇴', Match_Num: 56},
  {ID_Partido: 'M57', Fase: 'Grupos', Grupo: 'J', Fecha: '2026-06-22', Hora_UTC: '12:00:00-05:00', Equipo_Local: 'Argentina', Bandera_Local: '🇦🇷', Equipo_Visita: 'Austria', Bandera_Visita: '🇦🇹', Match_Num: 57},
  {ID_Partido: 'M58', Fase: 'Grupos', Grupo: 'J', Fecha: '2026-06-22', Hora_UTC: '20:00:00-07:00', Equipo_Local: 'Jordania', Bandera_Local: '🇯🇴', Equipo_Visita: 'Argelia', Bandera_Visita: '🇩🇿', Match_Num: 58},
  {ID_Partido: 'M59', Fase: 'Grupos', Grupo: 'J', Fecha: '2026-06-27', Hora_UTC: '21:00:00-05:00', Equipo_Local: 'Argelia', Bandera_Local: '🇩🇿', Equipo_Visita: 'Austria', Bandera_Visita: '🇦🇹', Match_Num: 59},
  {ID_Partido: 'M60', Fase: 'Grupos', Grupo: 'J', Fecha: '2026-06-27', Hora_UTC: '21:00:00-05:00', Equipo_Local: 'Jordania', Bandera_Local: '🇯🇴', Equipo_Visita: 'Argentina', Bandera_Visita: '🇦🇷', Match_Num: 60},
  {ID_Partido: 'M61', Fase: 'Grupos', Grupo: 'K', Fecha: '2026-06-17', Hora_UTC: '12:00:00-05:00', Equipo_Local: 'Portugal', Bandera_Local: '🇵🇹', Equipo_Visita: 'RD Congo', Bandera_Visita: '🇨🇩', Match_Num: 61},
  {ID_Partido: 'M62', Fase: 'Grupos', Grupo: 'K', Fecha: '2026-06-17', Hora_UTC: '20:00:00-06:00', Equipo_Local: 'Uzbekistán', Bandera_Local: '🇺🇿', Equipo_Visita: 'Colombia', Bandera_Visita: '🇨🇴', Match_Num: 62},
  {ID_Partido: 'M63', Fase: 'Grupos', Grupo: 'K', Fecha: '2026-06-23', Hora_UTC: '12:00:00-05:00', Equipo_Local: 'Portugal', Bandera_Local: '🇵🇹', Equipo_Visita: 'Uzbekistán', Bandera_Visita: '🇺🇿', Match_Num: 63},
  {ID_Partido: 'M64', Fase: 'Grupos', Grupo: 'K', Fecha: '2026-06-23', Hora_UTC: '20:00:00-06:00', Equipo_Local: 'Colombia', Bandera_Local: '🇨🇴', Equipo_Visita: 'RD Congo', Bandera_Visita: '🇨🇩', Match_Num: 64},
  {ID_Partido: 'M65', Fase: 'Grupos', Grupo: 'K', Fecha: '2026-06-27', Hora_UTC: '19:30:00-04:00', Equipo_Local: 'Colombia', Bandera_Local: '🇨🇴', Equipo_Visita: 'Portugal', Bandera_Visita: '🇵🇹', Match_Num: 65},
  {ID_Partido: 'M66', Fase: 'Grupos', Grupo: 'K', Fecha: '2026-06-27', Hora_UTC: '19:30:00-04:00', Equipo_Local: 'RD Congo', Bandera_Local: '🇨🇩', Equipo_Visita: 'Uzbekistán', Bandera_Visita: '🇺🇿', Match_Num: 66},
  {ID_Partido: 'M67', Fase: 'Grupos', Grupo: 'L', Fecha: '2026-06-17', Hora_UTC: '14:00:00-04:00', Equipo_Local: 'Inglaterra', Bandera_Local: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', Equipo_Visita: 'Croacia', Bandera_Visita: '🇭🇷', Match_Num: 67},
  {ID_Partido: 'M68', Fase: 'Grupos', Grupo: 'L', Fecha: '2026-06-17', Hora_UTC: '17:00:00-04:00', Equipo_Local: 'Ghana', Bandera_Local: '🇬🇭', Equipo_Visita: 'Panamá', Bandera_Visita: '🇵🇦', Match_Num: 68},
  {ID_Partido: 'M69', Fase: 'Grupos', Grupo: 'L', Fecha: '2026-06-23', Hora_UTC: '14:00:00-04:00', Equipo_Local: 'Croacia', Bandera_Local: '🇭🇷', Equipo_Visita: 'Panamá', Bandera_Visita: '🇵🇦', Match_Num: 69},
  {ID_Partido: 'M70', Fase: 'Grupos', Grupo: 'L', Fecha: '2026-06-23', Hora_UTC: '17:00:00-04:00', Equipo_Local: 'Inglaterra', Bandera_Local: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', Equipo_Visita: 'Ghana', Bandera_Visita: '🇬🇭', Match_Num: 70},
  {ID_Partido: 'M71', Fase: 'Grupos', Grupo: 'L', Fecha: '2026-06-27', Hora_UTC: '17:00:00-04:00', Equipo_Local: 'Panamá', Bandera_Local: '🇵🇦', Equipo_Visita: 'Inglaterra', Bandera_Visita: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', Match_Num: 71},
  {ID_Partido: 'M72', Fase: 'Grupos', Grupo: 'L', Fecha: '2026-06-27', Hora_UTC: '17:00:00-04:00', Equipo_Local: 'Ghana', Bandera_Local: '🇬🇭', Equipo_Visita: 'Croacia', Bandera_Visita: '🇭🇷', Match_Num: 72},
  {ID_Partido: 'M73', Fase: 'Ronda de 32', Fecha: '2026-06-28', Hora_UTC: '12:00:00-07:00', Equipo_Local: '2do Grupo A', Bandera_Local: '', Equipo_Visita: '2do Grupo B', Bandera_Visita: '', Match_Num: 73},
  {ID_Partido: 'M74', Fase: 'Ronda de 32', Fecha: '2026-06-29', Hora_UTC: '12:00:00-05:00', Equipo_Local: '1ro Grupo C', Bandera_Local: '', Equipo_Visita: '2do Grupo F', Bandera_Visita: '', Match_Num: 74},
  {ID_Partido: 'M75', Fase: 'Ronda de 32', Fecha: '2026-06-29', Hora_UTC: '16:30:00-04:00', Equipo_Local: '1ro Grupo E', Bandera_Local: '', Equipo_Visita: '3ro Grupos A/B/C/D/F', Bandera_Visita: '', Match_Num: 75},
  {ID_Partido: 'M76', Fase: 'Ronda de 32', Fecha: '2026-06-29', Hora_UTC: '19:00:00-06:00', Equipo_Local: '1ro Grupo F', Bandera_Local: '', Equipo_Visita: '2do Grupo C', Bandera_Visita: '', Match_Num: 76},
  {ID_Partido: 'M77', Fase: 'Ronda de 32', Fecha: '2026-06-30', Hora_UTC: '12:00:00-05:00', Equipo_Local: '2do Grupo E', Bandera_Local: '', Equipo_Visita: '2do Grupo I', Bandera_Visita: '', Match_Num: 77},
  {ID_Partido: 'M78', Fase: 'Ronda de 32', Fecha: '2026-06-30', Hora_UTC: '17:00:00-04:00', Equipo_Local: '1ro Grupo I', Bandera_Local: '', Equipo_Visita: '3ro Grupos C/D/F/G/H', Bandera_Visita: '', Match_Num: 78},
  {ID_Partido: 'M79', Fase: 'Ronda de 32', Fecha: '2026-06-30', Hora_UTC: '19:00:00-06:00', Equipo_Local: '1ro Grupo A', Bandera_Local: '', Equipo_Visita: '3ro Grupos C/E/F/H/I', Bandera_Visita: '', Match_Num: 79},
  {ID_Partido: 'M80', Fase: 'Ronda de 32', Fecha: '2026-07-01', Hora_UTC: '12:00:00-04:00', Equipo_Local: '1ro Grupo L', Bandera_Local: '', Equipo_Visita: '3ro Grupos E/H/I/J/K', Bandera_Visita: '', Match_Num: 80},
  {ID_Partido: 'M81', Fase: 'Ronda de 32', Fecha: '2026-07-01', Hora_UTC: '13:00:00-07:00', Equipo_Local: '1ro Grupo G', Bandera_Local: '', Equipo_Visita: '3ro Grupos A/E/H/I/J', Bandera_Visita: '', Match_Num: 81},
  {ID_Partido: 'M82', Fase: 'Ronda de 32', Fecha: '2026-07-01', Hora_UTC: '17:00:00-07:00', Equipo_Local: '1ro Grupo D', Bandera_Local: '', Equipo_Visita: '3ro Grupos B/E/F/I/J', Bandera_Visita: '', Match_Num: 82},
  {ID_Partido: 'M83', Fase: 'Ronda de 32', Fecha: '2026-07-02', Hora_UTC: '12:00:00-07:00', Equipo_Local: '1ro Grupo H', Bandera_Local: '', Equipo_Visita: '2do Grupo J', Bandera_Visita: '', Match_Num: 83},
  {ID_Partido: 'M84', Fase: 'Ronda de 32', Fecha: '2026-07-02', Hora_UTC: '19:00:00-04:00', Equipo_Local: '2do Grupo K', Bandera_Local: '', Equipo_Visita: '2do Grupo L', Bandera_Visita: '', Match_Num: 84},
  {ID_Partido: 'M85', Fase: 'Ronda de 32', Fecha: '2026-07-02', Hora_UTC: '20:00:00-07:00', Equipo_Local: '1ro Grupo B', Bandera_Local: '', Equipo_Visita: '3ro Grupos E/F/G/I/J', Bandera_Visita: '', Match_Num: 85},
  {ID_Partido: 'M86', Fase: 'Ronda de 32', Fecha: '2026-07-03', Hora_UTC: '13:00:00-05:00', Equipo_Local: '2do Grupo D', Bandera_Local: '', Equipo_Visita: '2do Grupo G', Bandera_Visita: '', Match_Num: 86},
  {ID_Partido: 'M87', Fase: 'Ronda de 32', Fecha: '2026-07-03', Hora_UTC: '18:00:00-04:00', Equipo_Local: '1ro Grupo J', Bandera_Local: '', Equipo_Visita: '2do Grupo H', Bandera_Visita: '', Match_Num: 87},
  {ID_Partido: 'M88', Fase: 'Ronda de 32', Fecha: '2026-07-03', Hora_UTC: '20:30:00-05:00', Equipo_Local: '1ro Grupo K', Bandera_Local: '', Equipo_Visita: '3ro Grupos D/E/I/J/L', Bandera_Visita: '', Match_Num: 88},
  {ID_Partido: 'M89', Fase: 'Octavos', Fecha: '2026-07-04', Hora_UTC: '13:00:00-05:00', Equipo_Local: 'Ganador M73', Bandera_Local: '', Equipo_Visita: 'Ganador M75', Bandera_Visita: '', Match_Num: 89},
  {ID_Partido: 'M90', Fase: 'Octavos', Fecha: '2026-07-04', Hora_UTC: '17:00:00-04:00', Equipo_Local: 'Ganador M74', Bandera_Local: '', Equipo_Visita: 'Ganador M77', Bandera_Visita: '', Match_Num: 90},
  {ID_Partido: 'M91', Fase: 'Octavos', Fecha: '2026-07-05', Hora_UTC: '16:00:00-04:00', Equipo_Local: 'Ganador M76', Bandera_Local: '', Equipo_Visita: 'Ganador M78', Bandera_Visita: '', Match_Num: 91},
  {ID_Partido: 'M92', Fase: 'Octavos', Fecha: '2026-07-05', Hora_UTC: '20:00:00-06:00', Equipo_Local: 'Ganador M79', Bandera_Local: '', Equipo_Visita: 'Ganador M80', Bandera_Visita: '', Match_Num: 92},
  {ID_Partido: 'M93', Fase: 'Octavos', Fecha: '2026-07-06', Hora_UTC: '15:00:00-05:00', Equipo_Local: 'Ganador M81', Bandera_Local: '', Equipo_Visita: 'Ganador M82', Bandera_Visita: '', Match_Num: 93},
  {ID_Partido: 'M94', Fase: 'Octavos', Fecha: '2026-07-06', Hora_UTC: '20:00:00-07:00', Equipo_Local: 'Ganador M83', Bandera_Local: '', Equipo_Visita: 'Ganador M84', Bandera_Visita: '', Match_Num: 94},
  {ID_Partido: 'M95', Fase: 'Octavos', Fecha: '2026-07-07', Hora_UTC: '12:00:00-04:00', Equipo_Local: 'Ganador M85', Bandera_Local: '', Equipo_Visita: 'Ganador M86', Bandera_Visita: '', Match_Num: 95},
  {ID_Partido: 'M96', Fase: 'Octavos', Fecha: '2026-07-07', Hora_UTC: '16:00:00-07:00', Equipo_Local: 'Ganador M87', Bandera_Local: '', Equipo_Visita: 'Ganador M88', Bandera_Visita: '', Match_Num: 96},
  {ID_Partido: 'M97', Fase: 'Cuartos', Fecha: '2026-07-09', Hora_UTC: '16:00:00-04:00', Equipo_Local: 'Ganador M89', Bandera_Local: '', Equipo_Visita: 'Ganador M90', Bandera_Visita: '', Match_Num: 97},
  {ID_Partido: 'M98', Fase: 'Cuartos', Fecha: '2026-07-10', Hora_UTC: '15:00:00-07:00', Equipo_Local: 'Ganador M93', Bandera_Local: '', Equipo_Visita: 'Ganador M94', Bandera_Visita: '', Match_Num: 98},
  {ID_Partido: 'M99', Fase: 'Cuartos', Fecha: '2026-07-10', Hora_UTC: '20:00:00-04:00', Equipo_Local: 'Ganador M91', Bandera_Local: '', Equipo_Visita: 'Ganador M92', Bandera_Visita: '', Match_Num: 99},
  {ID_Partido: 'M100', Fase: 'Cuartos', Fecha: '2026-07-11', Hora_UTC: '20:00:00-04:00', Equipo_Local: 'Ganador M95', Bandera_Local: '', Equipo_Visita: 'Ganador M96', Bandera_Visita: '', Match_Num: 100},
  {ID_Partido: 'M101', Fase: 'Semifinales', Fecha: '2026-07-14', Hora_UTC: '20:00:00-04:00', Equipo_Local: 'Ganador M97', Bandera_Local: '', Equipo_Visita: 'Ganador M98', Bandera_Visita: '', Match_Num: 101},
  {ID_Partido: 'M102', Fase: 'Semifinales', Fecha: '2026-07-15', Hora_UTC: '20:00:00-04:00', Equipo_Local: 'Ganador M99', Bandera_Local: '', Equipo_Visita: 'Ganador M100', Bandera_Visita: '', Match_Num: 102},
  {ID_Partido: 'M103', Fase: 'Tercer Puesto', Fecha: '2026-07-18', Hora_UTC: '16:00:00-04:00', Equipo_Local: 'Perdedor M101', Bandera_Local: '', Equipo_Visita: 'Perdedor M102', Bandera_Visita: '', Match_Num: 103},
  {ID_Partido: 'M104', Fase: 'Final', Fecha: '2026-07-19', Hora_UTC: '15:00:00-04:00', Equipo_Local: 'Ganador M101', Bandera_Local: '', Equipo_Visita: 'Ganador M102', Bandera_Visita: '', Match_Num: 104}
];

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
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      inicializarSistema();
      sheet = ss.getSheetByName(sheetName);
      if (!sheet) return [];
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const headers = data.shift();
    return data.map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        if (header) {
          let val = row[i];
          // Convertir fechas a string ISO para evitar errores de serialización GAS
          if (val instanceof Date) {
            val = val.toISOString();
          }
          obj[header] = val;
        }
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
  if (partidoSheet.getLastRow() > 1) {
    partidoSheet.getRange(2, 1, partidoSheet.getLastRow() - 1, 15).clearContent();
  }

  const partidosData = CALENDARIO_HARDCODED.map(m => {
    return [
      m.ID_Partido,
      m.Fase,
      m.Grupo || '',
      m.Fecha,
      m.Hora_UTC,
      m.Equipo_Local,
      m.Bandera_Local || '',
      m.Equipo_Visita,
      m.Bandera_Visita || '',
      '',
      '',
      'Abierto',
      calcularFechaCierreLocal(m.Fecha, m.Hora_UTC),
      '',
      m.Match_Num
    ];
  });

  partidoSheet.getRange(2, 1, partidosData.length, 15).setValues(partidosData);
  SpreadsheetApp.flush();
}

// --- AUTENTICACIÓN Y PARTICIPANTES ---

function registrarParticipante(email, nombre, alias) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Participantes');
    const data = sheet.getDataRange().getValues();

    // Validar email único
    if (data.some(row => row[0].toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'Email ya registrado. Usa la opción de ingreso.' };
    }

    // Validar alias único
    if (data.some(row => row[2].toLowerCase() === alias.toLowerCase())) {
      return { success: false, error: 'Este alias ya está en uso. Elige otro.' };
    }

    sheet.appendRow([email, nombre, alias, 0, 0, 0, 0, new Date()]);
    return { success: true, message: '¡Cuenta creada exitosamente!' };
  } catch (e) {
    logError('registrarParticipante', e.message, email);
    return { success: false, error: 'Error en el servidor al registrar.' };
  }
}

function loginParticipante(email) {
  try {
    const data = getSheetData('Participantes');
    const p = data.find(row => row.Email.toLowerCase() === email.toLowerCase());

    if (p) {
      return { success: true, participante: p };
    } else {
      return { success: false, error: 'Email no registrado. ¿Deseas crear una cuenta?' };
    }
  } catch (e) {
    logError('loginParticipante', e.message, email);
    return { success: false, error: 'Error al intentar ingresar.' };
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
  try {
    // Leemos directamente del Sheet como se solicitó
    let data = getSheetData('Partidos');

    // Si la hoja está vacía (solo cabecera), forzamos el seed una vez
    if (data.length === 0) {
      console.log("Hoja vacía detectada, ejecutando seed...");
      seedPartidos();
      data = getSheetData('Partidos');
    }

    return data;
  } catch (e) {
    logError('obtenerPartidos', e.message, '');
    return [];
  }
}

// Función auxiliar interna para el fallback
function calcularFechaCierreLocal(fecha, hora) {
  try {
    const parts = hora.split(':');
    const hh = parts[0].padStart(2, '0');
    const mm = parts[1].padStart(2, '0');
    let ss = "00";
    let offset = "";
    if (parts[2]) {
      if (parts[2].includes('-')) {
        const sParts = parts[2].split('-');
        ss = sParts[0].padStart(2, '0');
        offset = '-' + sParts[1];
      } else if (parts[2].includes('+')) {
        const sParts = parts[2].split('+');
        ss = sParts[0].padStart(2, '0');
        offset = '+' + sParts[1];
      } else {
        ss = parts[2].padStart(2, '0');
      }
    }
    const cleanHora = `${hh}:${mm}:${ss}${offset}`;
    const f = new Date(fecha + 'T' + cleanHora);
    f.setHours(f.getHours() - 24);
    return f;
  } catch (e) {
    return new Date(fecha);
  }
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
