# ESTRUCTURA DE DATOS Y FÓRMULAS VSM LEAN

## 1. Hoja "Proyectos"
| Col | Encabezado | Fórmula / Validación |
|-----|------------|-----------------------|
| I | Total_Pasos_Actual | `=COUNTIFS(Pasos!$B:$B; $A2; Pasos!$E:$E; "Actual"; Pasos!$U:$U; "Activo")` |
| J | Total_Pasos_Propuesto | `=COUNTIFS(Pasos!$B:$B; $A2; Pasos!$E:$E; "Propuesto"; Pasos!$U:$U; "Activo")` |
| K | Lead_Time_Actual_Hrs | `=SUMIFS(Pasos!$L:$L; Pasos!$B:$B; $A2; Pasos!$E:$E; "Actual"; Pasos!$U:$U; "Activo") / 60` |
| L | Lead_Time_Propuesto_Hrs | `=SUMIFS(Pasos!$L:$L; Pasos!$B:$B; $A2; Pasos!$E:$E; "Propuesto"; Pasos!$U:$U; "Activo") / 60` |
| M | PCE_Actual_% | `=(SUMIFS(Pasos!$J:$J; Pasos!$B:$B; $A2; Pasos!$E:$E; "Actual"; Pasos!$G:$G; "VA"; Pasos!$U:$U; "Activo") / (K2*60))` |
| N | PCE_Propuesto_% | `=(SUMIFS(Pasos!$J:$J; Pasos!$B:$B; $A2; Pasos!$E:$E; "Propuesto"; Pasos!$G:$G; "VA"; Pasos!$U:$U; "Activo") / (L2*60))` |
| O | Dias_Hombre_Ahorrados | `=(K2 - L2) / Configuracion!$B$5` (Donde B5 es la Jornada Laboral) |

## 2. Hoja "Pasos"
| Col | Encabezado | Fórmula / Validación |
|-----|------------|-----------------------|
| L | Lead_Time_Paso_Min | `=J2 + K2` |
| G | Etiqueta_Valor | Lista: VA, VNA-N, VNA |
| E | Escenario | Lista: Actual, Propuesto |
| O | Cuello_Botella | Lista: Sí, No |

**Formato Condicional en "Pasos":**
- Columna G: "VA" -> Verde, "VNA-N" -> Amarillo, "VNA" -> Rojo.
- Columna O: "Sí" -> Fondo Rojo, Texto Blanco Negrita.

## 3. Hoja "Dashboard_KPIs"
| Celda | Métrica | Fórmula |
|-------|---------|---------|
| B2 | Proyectos Activos | `=COUNTIF(Proyectos!G:G; "Activo")` |
| B10 | % VA Global | `=SUMIF(Pasos!G:G; "VA"; Pasos!J:J) / SUM(Pasos!L:L)` |
| B14 | LT Actual Total | `=SUMIFS(Pasos!L:L; Pasos!E:E; "Actual") / 60` |
| B15 | LT Propuesto Total | `=SUMIFS(Pasos!L:L; Pasos!E:E; "Propuesto") / 60` |

## 4. Hoja "Configuracion"
- **JORNADA_HORAS**: 8
- **DIAS_LABORALES**: 5
- **AREAS**: Lista de departamentos.

---

## 5. Instrucciones de Instalación
1. Crear un Google Sheet nuevo.
2. Ir a `Extensiones` > `Apps Script`.
3. Crear los archivos `.gs` y `.html` con el código proporcionado.
4. Crear las hojas manualemente con los nombres: `Proyectos`, `Pasos`, `Configuracion`, `Dashboard_KPIs`, `Auditoria`.
5. Ejecutar la función `onOpen` o recargar el Sheet para ver el menú "VSM Lean".
