# ACTA DE ALCANCE MVP — Epic: Digitacion

**Proyecto:** Naowee — Sistema de Gestion Deportiva  
**Epic:** Digitacion (Registro de resultados en competencias deportivas)  
**Fecha:** 7 de abril de 2026  
**Version:** 1.0.0  
**Roles involucrados:** Coordinador de Eventos, Digitador

---

## 1. Resumen Ejecutivo

El MVP de Digitacion permite gestionar el ciclo completo de registro de resultados deportivos: desde la creacion y configuracion de competencias por parte del Coordinador de Eventos, hasta la digitacion de marcadores, penalizaciones, estadisticas y descalificaciones por parte del Digitador. El sistema soporta 30+ deportes parametrizados con 6 tipos de puntuacion distintos.

---

## 2. Historias de Usuario — Coordinador de Eventos

### HU-CE-01: Dashboard de Competencias

**Como** Coordinador de Eventos  
**quiero** ver un resumen general del estado de todas las competencias  
**para** monitorear el avance de la digitacion en tiempo real.

**Criterios de aceptacion:**
- Visualizar 4 tarjetas resumen: Asignaciones totales, Finalizadas, Enfrentamientos, Pendientes
- Tabla de competencias con columnas: nombre, deporte (emoji + label), ubicacion, sistema de competencia, barra de progreso, estado, accion
- Enlace de accion por estado:
  - En digitacion → "Continuar"
  - Asignada → "Iniciar"
  - En pausa → "Continuar"
  - Finalizada → "Ver"

**Subfuncionalidades:**
- Filtro por deporte
- Navegacion a lista de competencias detallada

---

### HU-CE-02: Lista de Competencias con Filtros Avanzados

**Como** Coordinador de Eventos  
**quiero** explorar todas las competencias con filtros multiples  
**para** encontrar rapidamente una competencia especifica.

**Criterios de aceptacion:**
- Barra de pills sticky por deporte con emoji + nombre + conteo
- Buscador de texto (nombre, codigo, deporte, ubicacion)
- Dropdown de estado: Todos, En digitacion, Asignadas, En pausa, Finalizada
- Tabs por tipo: Todos, Individual, Conjunto
- Layout dos columnas: lista (izquierda) + panel de detalle (derecha)

**Subfuncionalidades:**
- Al seleccionar una competencia, el panel derecho muestra tabla de enfrentamientos con: ID, fase, equipos, estado, marcador, accion
- Estado vacio con icono e instruccion "Selecciona una competencia"
- Los enfrentamientos muestran estado visual: listo (gris), en curso (azul), completado (verde)

---

### HU-CE-03: Asignar Competencia a un Digitador

**Como** Coordinador de Eventos  
**quiero** asignar una competencia a un digitador  
**para** delegar el registro de resultados.

**Criterios de aceptacion:**
- Modal de asignacion con tarjetas de digitadores disponibles
- Cada tarjeta muestra: avatar con iniciales, nombre completo, rol
- Seleccion por clic con borde de resaltado
- Boton de confirmacion para asignar
- La competencia cambia a estado "Asignada" al confirmar

---

### HU-CE-04: Crear Competencia — Paso 1: Informacion General

**Como** Coordinador de Eventos  
**quiero** definir los datos basicos de una competencia  
**para** configurar su identidad y estructura.

**Criterios de aceptacion:**
- Stepper de 4 pasos con breadcrumb visual (completado/activo/pendiente)
- Campos del paso 1:
  - Nombre de la competencia (obligatorio)
  - Categoria (Sub-12, Sub-18, Adultos, Abierto)
  - Ubicacion (Zipaquira, Chia, Bogota, etc.)
  - Sistema de competencia (Fase de grupos, Eliminacion directa, Round robin, Final directa, Rondas)
  - Toggle de medallas (Si/No)
- Validacion de campos obligatorios con asterisco rojo

---

### HU-CE-05: Crear Competencia — Paso 2: Deportes y Participantes

**Como** Coordinador de Eventos  
**quiero** agregar uno o mas deportes a la competencia y configurar sus reglas  
**para** que el sistema sepa como puntuar cada enfrentamiento.

**Criterios de aceptacion:**
- Boton "Agregar deporte" que abre modal de seleccion con busqueda
- El modal muestra todos los deportes de SPORTS_DB con emoji + label
- Por cada deporte agregado se muestra tarjeta con:
  - Emoji + nombre + boton de eliminar
  - Badge del tipo de puntuacion (acumulativa, sets, marca, jueces)
  - Lista de parciales
  - Acciones: editar / eliminar
- Campos de configuracion condicionales segun deporte:
  - Maximo de enfrentamientos
  - Configuracion de prorrogas (toggle, etiqueta, maximo)
  - Configuracion de tiempo extra
  - Configuracion de botones de scoring (para estilo basketball)
  - Toggle de descalificacion por jugador

---

### HU-CE-06: Crear Competencia — Paso 3: Enfrentamientos

**Como** Coordinador de Eventos  
**quiero** generar o crear manualmente los enfrentamientos por fase  
**para** definir quien compite contra quien.

**Criterios de aceptacion:**
- Dropdown de seleccion de fase (Fase 1, Semifinales, Final, etc.)
- Opcion de generacion automatica (boton "Generar")
- Opcion de creacion manual (agregar filas con equipo 1 vs equipo 2)
- Tabla de enfrentamientos con: #, Equipo 1, Equipo 2, Estado, Accion
- Boton de eliminar enfrentamiento (icono papelera)
- Gestion de multiples fases

---

### HU-CE-07: Crear Competencia — Paso 4: Resumen y Guardado

**Como** Coordinador de Eventos  
**quiero** revisar toda la configuracion antes de guardar  
**para** verificar que los datos sean correctos.

**Criterios de aceptacion:**
- Resumen de: datos de competencia, deportes agregados, cantidad de enfrentamientos
- Botones de accion: Guardar (verde), Editar (gris), Cancelar
- Navegacion de regreso a cualquier paso previo

---

### HU-CE-08: Cambio de Perfil

**Como** Coordinador de Eventos  
**quiero** alternar entre mi vista y la del Digitador  
**para** supervisar o digitar cuando sea necesario.

**Criterios de aceptacion:**
- Selector de perfil en el header de todas las paginas
- Opciones: "Coordinador de eventos" y "Digitador"
- La navegacion redirige a la pagina correspondiente al perfil seleccionado

---

## 3. Historias de Usuario — Digitador

### HU-DI-01: Dashboard del Digitador

**Como** Digitador  
**quiero** ver las competencias que me han asignado  
**para** saber que debo digitar.

**Criterios de aceptacion:**
- 4 tarjetas resumen: Asignaciones totales, Completadas, Enfrentamientos totales, Pendientes
- Lista de competencias asignadas con filtros: busqueda texto, dropdown de estado, pills de deporte
- Layout dos columnas: lista (izquierda) + panel de detalle o estado vacio (derecha)
- Al seleccionar competencia: tabla de enfrentamientos con enlace para abrir modal de scoring

---

### HU-DI-02: Abrir Modal de Scoring (Marcador)

**Como** Digitador  
**quiero** abrir el marcador de un enfrentamiento  
**para** registrar los resultados en tiempo real.

**Criterios de aceptacion:**
- Modal a pantalla completa (95vw, max 860px) con animacion de entrada (scaleIn)
- Header: boton cerrar (X), nombre de competencia + fase, nombres de equipos
- Sistema de tabs: Marcador, Penalizaciones*, Estadisticas*, Incidencias* (*condicional segun config del deporte)
- El tipo de UI de marcador se determina automaticamente por `sport.puntuacion`

---

### HU-DI-03: Scoring — Tipo Basketball Grid

**Como** Digitador  
**quiero** registrar puntos con botones rapidos por periodo  
**para** digitar deportes de puntuacion acumulativa con ritmo agil.

**Aplica a:** Baloncesto 5x5, Baloncesto 3x3, Balonmano, Beisbol, Softbol, Hockey, Cricket, entre otros.

**Criterios de aceptacion:**
- Pills/tabs por periodo (Q1, Q2, Q3, Q4 / 1T, 2T / innings 1-9, etc.)
- Marcador inline visible: "Q1 12-8"
- Panel de scoring por equipo:
  - Botones configurables por deporte (ej: +3, +2, +1 para basketball; +5, +3, +1 para otros)
  - Boton Deshacer (icono papelera) para revertir ultimo punto
- Estado activo destacado en el periodo seleccionado
- Totalizacion automatica de marcador general

**Subfuncionalidades:**
- **Timer de juego** (opcional, si `tiempoParcial` esta configurado):
  - Navegacion de periodo (< Q1 >)
  - Display de cronometro (MM:SS)
  - Controles: Play, Pausa, Reset

---

### HU-DI-04: Scoring — Tipo Sets Counter

**Como** Digitador  
**quiero** registrar puntos set por set con contadores +/-  
**para** digitar deportes basados en sets.

**Aplica a:** Voleibol Sala, Voleibol Playa, Mini Voleibol, Badminton Singles, Badminton Dobles.

**Criterios de aceptacion:**
- Tabs por set (Set 1, Set 2, Set 3, etc.)
- Marcador inline: "Set 1  21-18"
- Controles por equipo: boton (-), valor numerico, boton (+)
- Indicador de set ganado (badge con ganador)
- Logica de puntos por set configurable: `puntosSet: 25` (voleibol) / `puntosSet: 21` (badminton)
- Puntos del set decisivo configurables: `setDecisivoPuntos: 15`

---

### HU-DI-05: Scoring — Tipo Marca

**Como** Digitador  
**quiero** registrar tiempos o marcas  
**para** digitar deportes individuales o de medicion.

**Aplica a:** Atletismo (56 pruebas), Remo, Natacion, Bobsleigh, Ciclismo, Patinaje.

**Criterios de aceptacion:**
- Campo de entrada para tiempo/marca (formato MM:SS.CC u otro segun deporte)
- Tipo de marca configurable: tiempo, distancia, puntos
- Unidad de medida visible

---

### HU-DI-06: Scoring — Tipo Jueces

**Como** Digitador  
**quiero** registrar calificaciones de multiples jueces  
**para** digitar deportes evaluados por jurado.

**Aplica a:** Gimnasia, Porrismo, deportes de exhibicion.

**Criterios de aceptacion:**
- Campos de entrada por juez (1 a N jueces)
- Calculo automatico del puntaje final
- Tabs por ronda si aplica (R1, R2, R3)

---

### HU-DI-07: Scoring — Tipo Combate

**Como** Digitador  
**quiero** registrar puntos de combate por ronda  
**para** digitar deportes de contacto.

**Aplica a:** Taekwondo, Judo, Karate, Boxeo.

**Criterios de aceptacion:**
- Tabs por ronda (R1, R2, R3)
- Botones de puntuacion configurable por deporte (ej: Taekwondo: +1, +2, +3, +4)
- Penalizaciones inline que suman al rival (+1 por infraccion)
- Auto-DQ por acumulacion de penalizaciones (ej: 10 penalizaciones = descalificacion automatica)

---

### HU-DI-08: Prorrogas (Tiempo Extra)

**Como** Digitador  
**quiero** agregar periodos de prorroga  
**para** resolver empates segun las reglas del deporte.

**Criterios de aceptacion:**
- Boton de prorroga con etiqueta configurable por deporte:
  - Beisbol: "+ Extra Inning" → genera E1, E2, E3...
  - Balonmano Playa: "Punto de Oro" (max 1)
  - Futbol: "Prorroga" (max 2)
  - Baloncesto 3x3: Auto-win a 21 pts o diferencia de 2
- Limite maximo de prorrogas configurable (`maxProrrogas`)
- Nuevo tab/pill aparece al agregar prorroga
- Etiquetas personalizables: `prorrogaLabels`, `prorrogaPrefix`
- Scoring continua con la misma mecanica del tiempo regular

---

### HU-DI-09: Penalizaciones Inline (Suman al Rival)

**Como** Digitador  
**quiero** registrar penalizaciones que otorgan puntos al equipo contrario  
**para** reflejar correctamente el marcador en deportes donde las infracciones modifican el score.

**Aplica a:** Cricket, Voleibol, Badminton, Disco Volador, entre otros.

**Criterios de aceptacion:**
- Seccion de penalizaciones dentro del tab Marcador (estilo cricket)
- Grilla de botones por equipo con valor de puntos (+1, +5, etc.)
- Label "al rival" para indicar que los puntos van al contrario
- Log de penalizaciones visible debajo:
  - Timestamp, descripcion, puntos otorgados, enlace para deshacer
- Los puntos de penalizacion se suman al marcador del equipo contrario automaticamente
- Deshacer revierte los puntos

**Subfuncionalidad — Auto-DQ por acumulacion:**
- Barra de progreso de penalizaciones cuando `penaltyDqThreshold` esta configurado
- Al alcanzar el umbral: alerta roja "DERROTA POR ACUMULACION DE PENALIZACIONES"
  - Icono: prohibido
  - Mensaje: "{Equipo} acumulo {N} penalizaciones (limite: {umbral}) — derrota inmediata"
- Deshacer penalizacion quita la alerta si baja del umbral

---

### HU-DI-10: Descalificaciones por Jugador (Formulario Progresivo)

**Como** Digitador  
**quiero** registrar descalificaciones seleccionando tipo, equipo y jugador paso a paso  
**para** documentar con precision las descalificaciones.

**Aplica a:** Deportes con `descalificacionPorJugador: true`.

**Criterios de aceptacion:**
- Formulario de revelacion progresiva con animacion (fadeInUp):
  1. **Seccion Tipo:** Botones con opciones del deporte (ej: "Tarjeta roja", "Acumulacion de 3 faltas")
  2. **Seccion Equipo:** Se revela al seleccionar tipo. Botones: Equipo 1 / Equipo 2
  3. **Seccion Jugador:** Se revela al seleccionar equipo. Lista o dropdown de jugadores
  4. **Boton "Registrar descalificacion":** Deshabilitado hasta completar los 3 pasos. Estilo naranja, padding compacto (9px), sin emoji
- Validacion: `_updateDqRegisterBtn()` verifica team + player seleccionados

---

### HU-DI-11: Penalizaciones por Contador

**Como** Digitador  
**quiero** registrar penalizaciones disciplinarias con contadores  
**para** llevar control de faltas en deportes que no usan el formulario progresivo.

**Aplica a:** Deportes con `penalizaciones` definidas pero sin `descalificacionPorJugador`.

**Criterios de aceptacion:**
- Tab "Penalizaciones" en el modal de scoring
- Grilla de contadores por tipo de penalizacion: boton (-), valor, boton (+)
- Contadores separados por equipo/participante

---

### HU-DI-12: Estadisticas de Juego (Rendimiento)

**Como** Digitador  
**quiero** registrar estadisticas de rendimiento por equipo  
**para** capturar datos complementarios al marcador.

**Aplica a:** Deportes con `estadisticasJuego` (ej: Beisbol: Hits, Home Runs, Bases Robadas).

**Criterios de aceptacion:**
- Seccion dentro del tab "Estadisticas"
- Tabla con contadores por stat: Equipo 1 [- valor +], Equipo 2 [- valor +]
- Stats configurables por deporte via `estadisticasJuego[]`

---

### HU-DI-13: Registro de Incidencias (Disciplinarias)

**Como** Digitador  
**quiero** registrar incidencias disciplinarias durante el partido  
**para** documentar advertencias, tarjetas y expulsiones.

**Aplica a:** Deportes con `estadisticasComplementarias`.

**Criterios de aceptacion:**
- Seccion dentro del tab "Estadisticas" (debajo de stats de rendimiento)
- Formulario: tipo de incidencia (dropdown) + equipo/jugador objetivo + boton "Registrar"
- Log de incidencias: timestamp, descripcion, enlace para deshacer
- Tipos configurables por deporte via `estadisticasComplementarias[]`

---

### HU-DI-14: Notificaciones de Guardado (Toast)

**Como** Digitador  
**quiero** recibir confirmacion visual al guardar un resultado  
**para** saber que mis datos se registraron correctamente.

**Criterios de aceptacion:**
- Toast en esquina inferior derecha o centro
- Icono de checkmark verde + titulo + descripcion
- Auto-cierre despues de 3-4 segundos
- Boton de cierre manual (X)

---

## 4. Historias de Usuario — Transversales

### HU-TR-01: Selector de Perfil Global

**Como** usuario del sistema  
**quiero** alternar entre los perfiles de Coordinador y Digitador  
**para** acceder a las funcionalidades de cada rol.

**Criterios de aceptacion:**
- Presente en el header de todas las paginas (dashboard, lista, stepper, digitador)
- Dropdown con dos opciones: "Coordinador de eventos", "Digitador"
- Al cambiar perfil, redirige a la pagina principal del rol seleccionado via `window.location.href`

---

### HU-TR-02: Sidebar de Navegacion

**Como** usuario del sistema  
**quiero** navegar entre secciones desde un menu lateral  
**para** acceder rapidamente a cualquier area del sistema.

**Criterios de aceptacion:**
- Sidebar de 274px con logo, navegacion y seccion inferior
- Items de navegacion con iconos SVG + label
- Estado activo destacado
- Responsive: colapsa a 72px (solo iconos) en pantallas < 900px

---

### HU-TR-03: Flujo de Estados de Competencia

**Como** usuario del sistema  
**quiero** que las competencias sigan un flujo de estados coherente  
**para** saber en que etapa se encuentra cada una.

**Estados y transiciones:**
1. **Creada** → La competencia fue configurada pero no asignada
2. **Asignada** → Fue asignada a un digitador, esperando inicio
3. **En digitacion** → El digitador esta registrando resultados activamente
4. **En pausa** → Pausada temporalmente (puede reanudarse)
5. **Finalizada** → Todos los enfrentamientos fueron completados

**Estados de enfrentamiento:**
- Ready → In Progress → Done

---

### HU-TR-04: Flujo de Fases de Competencia

**Como** usuario del sistema  
**quiero** que las competencias soporten multiples fases  
**para** manejar eliminatorias, semifinales y finales.

**Criterios de aceptacion:**
- Fases con estados visuales diferenciados
- Navegacion entre fases dentro de una competencia
- Cada fase contiene su propio conjunto de enfrentamientos
- Sistemas soportados: Fase de grupos, Eliminacion directa, Round robin, Final directa, Rondas

---

## 5. Parametrizacion de Deportes (Base de Datos)

### HU-DB-01: Motor de Deportes Parametrizados (SPORTS_DB)

**Como** sistema  
**quiero** una base de datos de deportes completamente parametrizada  
**para** que la UI se adapte automaticamente a cada deporte sin codigo custom.

**Estructura de configuracion por deporte:**

| Campo | Descripcion | Ejemplo |
|-------|-------------|---------|
| `emoji` | Icono visual | `'🏀'` |
| `label` | Nombre display | `'Baloncesto 5x5'` |
| `tipo` | Clasificacion | `'conjunto'` / `'individual'` |
| `puntuacion` | Tipo de scoring | `'acumulativa_tiempos'` / `'sets'` / `'marca'` / `'jueces'` / `'combate'` |
| `parciales` | Periodos de juego | `['Q1','Q2','Q3','Q4']` |
| `tiempoParcial` | Duracion por periodo | `'10 min'` |
| `penalizaciones` | Tipos de falta | `['Falta personal','Falta tecnica']` |
| `descalificaciones` | Motivos de DQ | `['2 faltas antideportivas']` |
| `estadisticasJuego` | Stats de rendimiento | `['Hits','Home Runs']` |
| `estadisticasComplementarias` | Stats disciplinarias | `['Rebotes','Asistencias']` |
| `permiteTiempoExtra` | Habilita prorrogas | `true` / `false` |
| `tiempoExtraConfig` | Config de prorroga | `{duracion: '5 min'}` |
| `scoringConfig.buttons` | Botones de puntuacion | `[{points:3,label:'+3'}]` |
| `prorrogaLabels` | Etiquetas de prorroga | `['PR1','PR2']` |
| `prorrogaPrefix` | Prefijo de tab extra | `'E'` (Extra Inning) |
| `prorrogaButtonLabel` | Texto del boton | `'+ Extra Inning'` |
| `maxProrrogas` | Limite de extras | `2` |
| `descalificacionPorJugador` | DQ progresiva | `true` |
| `penalizacionesSumanAlContrario` | Penalizaciones inline | `true` |
| `penaltyDqThreshold` | Umbral auto-DQ | `10` |
| `puntosSet` | Puntos para ganar set | `25` |
| `setDecisivoPuntos` | Puntos set decisivo | `15` |
| `modalidades` | Sub-categorias | `[{nombre, pruebas}]` |

### Deportes Parametrizados (v1.0.0)

**Deportes de Conjunto (Duelo):**
- Baloncesto 5x5, Baloncesto 3x3
- Balonmano Pista, Balonmano Playa
- Beisbol Tradicional, Beisbol 5, Softbol
- Badminton Singles, Badminton Dobles
- Futbol, Hockey, Curling
- Cricket (5 variantes: T20, ODI, Test, Hundred, Indoor)
- Disco Volador (2 variantes)
- Voleibol Sala, Voleibol Playa, Mini Voleibol
- Padel
- Bobsleigh
- Taekwondo (20 pruebas), Judo, Karate
- Rugby, Waterpolo, Tenis, Tenis de Mesa
- Levantamiento de Pesas, Remo, Ciclismo, Patinaje
- Porrismo, Boccia

**Deportes Individuales:**
- Atletismo (56 pruebas en 9 modalidades: velocidad, medio fondo, fondo, saltos, lanzamientos, marcha, combinados, relevos, obstaculos)

---

## 6. Tipos de Scoring — Mapa de Routing

| Tipo | Condicion en SPORTS_DB | UI Generada | Deportes Ejemplo |
|------|----------------------|-------------|-----------------|
| Basketball Grid | `acumulativa_tiempos` + `scoringConfig.buttons` | Tabs de periodo + botones +N | Baloncesto, Balonmano, Beisbol |
| Times Grid | `acumulativa_tiempos` sin buttons | Inputs por periodo | Futbol, Hockey |
| Sets Counter | `sets` + `puntosSet` | Tabs de set + contadores +/- | Voleibol, Badminton |
| Sets Grid | `sets` sin `puntosSet` | Inputs por set | — |
| Marca | `marca` | Input unico de tiempo/distancia | Atletismo, Remo, Natacion |
| Jueces | `jueces` | Inputs por juez | Gimnasia, Porrismo |
| Combate | `combate` | Rondas + botones scoring | Taekwondo, Judo, Karate |

---

## 7. Flujo Completo del Sistema

```
COORDINADOR DE EVENTOS                          DIGITADOR
========================                         =========

1. Dashboard (HU-CE-01)
   └─> Lista competencias (HU-CE-02)
       ├─> Asignar a digitador (HU-CE-03)  ──>  1. Dashboard asignaciones (HU-DI-01)
       └─> Crear competencia (Stepper)            └─> Seleccionar competencia
           ├─ Paso 1: Info (HU-CE-04)                 └─> Abrir enfrentamiento
           ├─ Paso 2: Deportes (HU-CE-05)                 └─> Modal Scoring (HU-DI-02)
           ├─ Paso 3: Enfrentamientos (HU-CE-06)              ├─ Marcador (HU-DI-03..07)
           └─ Paso 4: Resumen (HU-CE-07)                      ├─ Prorrogas (HU-DI-08)
                                                                ├─ Penalizaciones (HU-DI-09..11)
                                                                ├─ Estadisticas (HU-DI-12)
                                                                ├─ Incidencias (HU-DI-13)
                                                                └─ Guardar → Toast (HU-DI-14)
```

---

## 8. Paginas del Sistema

| Pagina | Archivo | Rol Principal | Funcion |
|--------|---------|---------------|---------|
| Dashboard | `dashboard.html` | Coordinador | Vista resumen general |
| Lista | `lista.html` | Coordinador | Explorar y asignar competencias |
| Stepper | `stepper.html` | Coordinador | Crear/configurar competencia (4 pasos) |
| Digitador | `digitador.html` | Digitador | Digitar resultados y scoring |

**Modulo compartido:** `shared.js` — SPORTS_DB, GameTimer, InputValidation

---

## 9. Alcance Excluido del MVP

- Persistencia en base de datos (actualmente demo data en memoria)
- Autenticacion y autorizacion de usuarios
- Integracion con backend Angular (previsto para Fase 2 — handoff a Daniel)
- Gestion de equipos y jugadores (CRUD)
- Reportes y exportacion de resultados
- Notificaciones push o en tiempo real entre roles
- Historial de cambios / audit log

---

## 10. Notas Tecnicas

- **Stack:** HTML + CSS + JavaScript vanilla, sin framework ni build tools
- **Fuente:** Google Fonts Inter (400, 500, 600, 700, 800)
- **Responsive:** Breakpoint unico 900px (sidebar colapsa, grids a 1 columna)
- **Animaciones:** fadeInUp, scaleIn, slideInLeft/Right con cubic-bezier
- **Fuente de verdad de deportes:** Objeto `SPORTS_DB` en `shared.js`
- **CSVs de referencia:** Carpeta `Base por deporte/` contiene reglas originales por deporte

---

*Documento generado el 7 de abril de 2026*  
*MVP version 1.0.0 — Epic Digitacion*
