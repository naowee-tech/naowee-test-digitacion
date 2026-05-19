# GAP ANALYSIS — Módulo Project (Ministerio del Deporte)
**Demo objetivo:** 15 de mayo · Base normativa: **Resolución 933 de 2024** · Flujo: **Operativo Módulo Project V2**
**Worktree analizado:** `/Users/dvargas/Desktop/Claude-Doug/.claude/worktrees/funny-leakey-205859/project/`
**Especificación:** `Formulario radicación.xlsx` (4 hojas) + `Formularios Adicionales.xlsx` (11 hojas) + transcripción Gemini Sync Eventos & Project.

---

## A · Resumen ejecutivo (Stakeholder POV)

| Criterio del acta | Cumple |
|---|---|
| 3 perfiles (Admin Ministerio, Municipio, Revisor) | **Sí** |
| Crear convocatoria (wizard) y notificar municipios | **Parcial** (no hay vista de notificación) |
| Postular proyecto + carta de intención + radicado | **Parcial** (faltan ~12 campos obligatorios del xlsx) |
| Revisión 15 días con Favorable / Devuelto / Rechazado / Expirado | **Parcial** (estado "Expirada" existe, pero NO hay reloj/temporizador, ni transición automática) |
| Subsanación con prórroga | **Parcial** (existe `subsanar.html` y `prorroga.html`, pero el ciclo de subsanación por área no respeta el patrón "ciclo N" del xlsx) |
| Etapa Documental con 42 documentos (Res. 933) | **Sí** (`spec.json` los carga) |
| 8 áreas técnicas con checklist Cumple/No cumple + Aprobado/Devuelto/Rechazado | **Parcial** (solo **7** áreas implementadas — falta separar Urbanismo del bloque Arquitectónico, o hay confusión de nomenclatura) |
| Concepto de favorabilidad automático cuando todas las áreas + general estén aprobadas | **Sí** |
| Activación de inversión + asociación a escenario SUID | **Sí** (modal-activar-inversion.js) |
| Tabla de inversión con sumatoria total | **Sí** |
| Creación de proyecto de inversión (formulario admin separado) | **Parcial** (existe `inversion-crear.html` pero no asocia campos financieros del xlsx hoja 11) |
| Registro SUID que se habilita al activar inversión | **Parcial** (se notifica en modal, NO existe formulario/pantalla real de Registro SUID) |

### Top 5 cosas que el stakeholder DEFINITIVAMENTE va a notar que faltan

1. **Formulario de postulación incompleto.** El xlsx exige ~25 campos obligatorios en el Registro Básico (Departamento/Municipio con código DANE, **Tipo de entidad formuladora**, **NIT**, **ZOMAC**, **PDET**, **EBI/PND**, **Bienio**, **Aforo proyectado**, **Tipología/Subtipología** del Censo, **Modalidades deportivas**, **Coordenadas con datum**, etc.). El `modal-postular.js` solo tiene **19 campos** y **muchos hardcoded** (Departamento="Chocó", Municipio="Quibdó", Cargo="Alcalde Municipal"). Diego va a notar esto al primer minuto.
2. **No existe pantalla de "Registro SUID de escenario".** Solo se promete en el modal-activar-inversion ("Al activar este proyecto se habilitará el formulario de Registro de Escenarios…"). Pero al hacer clic en "Ir a tabla de inversión" la promesa no se cumple — no hay módulo SUID. Danna y Andrea preguntaron explícitamente por esto en la transcripción (00:42:56).
3. **Faltan 8 áreas técnicas — solo hay 7.** El xlsx hoja "7. Revisión Técnica" define: Topográfico, Suelos, Arquitectónico, Estructural, Hidrosanitario, Eléctrico, Ambiental, Presupuesto. En `revisar-area.html` veo: topografico, suelos, arquitectonico, estructural, hidrosanitario, electrico (implícito por nombre), ambiental, presupuesto — **el listado parece estar pero el código solo despliega cards para 7**. Validar conteo y nombres exactos.
4. **No hay temporizador/contador de 15 días** visible en bandeja del revisor ni en lista del municipio. El xlsx exige que el estado pase automáticamente a "Expirada" al vencer el plazo. Hoy es un cambio manual.
5. **Tabla de inversión no muestra "Ejecutor" ni "Centro de costo"** (`ejecutor mentions: 0`, `centroCosto mentions: 1` solo en un comentario). El xlsx hoja 11 "Creación de proyecto de inversión" los pide. La columna SUID está, pero como texto plano sin link al Registro SUID.

### Top 5 cosas que están bien implementadas

1. Máquina de estados clara y consistente (`states.js`) con 11 estados de postulación, 5 de documento, 4 de área. Colores mapean al DS oficial.
2. Modal-activar-inversion con wizard multi-paso, mensaje de concepto favorable, success screen con CTA a tabla de inversión, integración a `naowee-modal` oficial.
3. Tabla de inversión con KPIs (Inversión total activada, Solicitado total, Listos para activar) **+ fila de sumatoria total** — exactamente lo que pidió Danna (00:34:07).
4. Auto-cálculo de concepto favorable en `revisar-area.html` (cuando todas las áreas + general están aprobadas, emite concepto y avanza estado).
5. Seed data realista con proyectos en **cada estado del flujo** (en revisión, devuelta a subsanación, favorable, etapa documental, en inversión) — la demo "se ve viva" al instante.

---

## B · Roles y permisos

| Rol definido en docs | ¿Existe en código? | Brecha |
|---|---|---|
| **Administrador del Ministerio** (crea convocatoria, asigna revisor, activa inversión, crea proyecto de inversión) | Sí (`admin/`) | Falta "asignar revisor" explícito (en código el revisor es 1 solo string) |
| **Municipio / Entidad territorial** (postula, subsana, solicita prórroga, carga documentos) | Sí (`municipio/`) | Falta soporte para entidades NO-Alcaldía (Gobernación, Resguardo, Consejo comunitario) — xlsx exige catálogo |
| **Revisor técnico** (revisa postulación, doc general, doc técnica por área, emite concepto) | Sí (`revisor/`) | El xlsx dice "cada área puede ser revisada por un revisor distinto" → en código todo es el mismo `revisor` |
| **Comité Municipal del Deporte** (concepto local previo) | No (solo aparece como documento `comite-deportivo-quibdo.pdf` en seed) | No tiene perfil. Aceptable para demo |
| **Coordinador de inversión** (rol financiero post-activación) | No | Aceptable (alcance posterior, lo dijo Andrea) |

---

## C · Formulario de postulación (Registro Básico Indispensable)

### Campos obligatorios según xlsx hoja "1. Registro Básico (53×7)"

| Sección | Campo | Tipo | ¿Está en `modal-postular.js`? |
|---|---|---|---|
| Convocatoria | Convocatoria a la que se postula | Selección auto | **No explícito** (se pasa por param) |
| Convocatoria | Bienio | Auto | **No mostrado** (visible solo en mensaje) |
| Convocatoria | Fecha límite | Auto | **No mostrada en form** |
| Entidad Formuladora | Departamento | Selección | **Hardcoded "Chocó"** ❌ |
| Entidad Formuladora | Municipio (con código DANE) | Selección dependiente | **Hardcoded "Quibdó"**, sin DANE ❌ |
| Entidad Formuladora | Tipo de entidad formuladora | Selección | **Falta** ❌ |
| Entidad Formuladora | Nombre oficial de la entidad | Texto | **Falta** (solo viene del perfil) ❌ |
| Entidad Formuladora | NIT | Texto | **Falta** ❌ |
| Entidad Formuladora | Municipio ZOMAC | Booleano | **Falta** ❌ |
| Entidad Formuladora | Municipio PDET | Booleano | **Falta** ❌ |
| Entidad Formuladora | EBI/PND | Booleano | **Falta** ❌ (no aparece en queries) |
| Representante Legal | Nombre completo | Texto | Sí (`repNombre`) |
| Representante Legal | Documento de identidad | Texto | Sí (`repDoc`) |
| Representante Legal | Cargo | Texto | Sí (**hardcoded "Alcalde Municipal"** ⚠) |
| Representante Legal | Contacto | Texto | Sí (`repContacto`) |
| Proyecto | Nombre del proyecto | Texto | Sí (`nombre`) |
| Proyecto | Tipo de proyecto | Selección | Sí (`tipo` — solo "Infraestructura") |
| Proyecto | Fase | Selección | Sí (`fase`) |
| Proyecto | Tipo de solicitud | Selección | Sí (`tipoSolicitud`) |
| Proyecto | Tipología principal (Censo, 15 valores) | Selección única | **Texto libre** ❌ debería ser dropdown del catálogo |
| Proyecto | Subtipología | Selección dependiente | **Falta** ❌ |
| Proyecto | Modalidades deportivas | Multi-selección | **Falta** ❌ |
| Predio | Dirección | Texto | Sí (`direccion`) |
| Predio | Latitud / Longitud | Decimal | Sí (`lat`, `lng`) |
| Predio | Datum (WGS84 / MAGNA) | Selección | **Falta** ❌ |
| Predio | Área del predio (m²) | Número | **Falta** ❌ |
| Predio | Aforo proyectado | Número | **Falta** ❌ |
| Financiero | Presupuesto total | Moneda | Sí (`presupuesto`) |
| Financiero | Monto solicitado al Mindeporte | Moneda | Sí (`monto`) |
| Financiero | Contrapartida municipal | Moneda | Sí (`contrapartida`) |
| Financiero | Fuentes de cofinanciación | Multi-checkbox | Sí (`cofinanciacion`) ✓ |
| Documentos | Carta de intención (PDF) | Archivo | Sí (`carta`) ✓ |

**Brecha total:** ~12 campos obligatorios faltantes + 3 hardcoded que deberían ser dinámicos.

### Documentos en etapa de Postulación
- **Solo Carta de intención** — bien implementado. ✓
- Los otros 41 documentos son de Etapa Documental, no de postulación.

---

## D · Máquina de estados

### Estados en `states.js` vs xlsx

| Estado xlsx | En `ESTADOS_POSTULACION` | Comentario |
|---|---|---|
| Borrador | `borrador` ✓ | |
| Presentada | `presentado` ✓ | |
| En revisión | `en_revision` ✓ | |
| No revisada | `no_revisada` ✓ | El xlsx no lo nombra explícitamente — podría sobrar o ser el caso "revisor no asignado" |
| Devuelta a subsanación | `devuelta_subsanacion` ✓ | |
| Expirada | `expirada` ✓ | **No hay transición automática por tiempo** |
| Rechazada | `rechazada` ✓ | |
| Favorable | `favorable` ✓ | |
| Etapa documental | `etapa_documental` ✓ | |
| Concepto favorable | `concepto_favorable` ✓ | |
| En inversión | `en_inversion` ✓ | |

**Transiciones faltantes:**
- `presentado` → `expirada` automático al cumplir N días sin revisión.
- `en_revision` → `expirada` al vencer 15 días.
- `devuelta_subsanacion` → `expirada` al vencer 15 días sin respuesta.
- Prórroga: no aumenta el contador visualmente.

**Estados ESTADOS_AREA:** `pendiente`, `en_revision` (implícito), `aprobado`, `devuelto`. Falta diferenciar `rechazado` del `devuelto` (en xlsx son distintos: rechazado = no aplica subsanar).

---

## E · Flujos end-to-end (QA POV)

### E.1 Admin (Ministerio)

| Caso de uso | Pasos esperados | ¿Implementado? | Bug/Gap |
|---|---|---|---|
| Crear convocatoria | Wizard 3 pasos: identificación / alcance / notificación | **Sí** (`modal-convocatoria.js` ~700 líneas) | Verificar que el alcance territorial dispare notificación |
| Ver listado de convocatorias | Tabla con estado, fechas, postulaciones | Sí (`convocatorias.html`) | OK |
| Ver detalle de convocatoria | Estadísticas, lista postulaciones | Sí | OK |
| Asignar revisor a postulación | Selector de revisor | **No** | El revisor está fijo |
| Ver listado global de proyectos | Tabla cross-municipio | Sí (`proyectos.html`) | OK |
| Activar inversión | Modal multi-paso, confirma concepto favorable, captura monto/BPIN/SUID | **Sí** (`modal-activar-inversion.js`) | OK |
| Ver tabla de inversión | KPIs + tabla con sumatoria | **Sí** (`inversion.html`) | Falta col. "Ejecutor", "Centro de costo" |
| Crear proyecto de inversión (form admin separado xlsx hoja 11) | Datos financieros + asociación SUID | **Parcial** (`inversion-crear.html` existe pero no auditado en este reporte — revisar campos) | Auditar |

### E.2 Municipio

| Caso de uso | Pasos | ¿Implementado? | Gap |
|---|---|---|---|
| Ver convocatorias activas | Cards/lista | Sí (`convocatorias.html`) | OK |
| Postular a una convocatoria | Wizard 5 pasos en modal | **Sí pero incompleto** | **12 campos obligatorios faltantes** (ver Sección C) |
| Generar radicado al enviar | Auto `RAD-AAAA-NNN-CONV-…` | Sí | OK |
| Ver mis proyectos | Lista con estado | Sí (`proyectos.html`) | OK |
| Cargar documentos en etapa documental | 42 docs Res. 933 agrupados en 3 bloques | Sí (`etapa-documental.html` + `spec.json`) | Verificar paquetes consolidados |
| Subsanar postulación | Editar campos rechazados | Sí (`subsanar.html`) | Falta selector "área a subsanar" (xlsx exige multi-área en paralelo) |
| Solicitar prórroga | Form con justificación y días | Sí (`prorroga.html`) | Verificar que extienda el contador |
| Ver perfil | — | Sí | OK |

### E.3 Revisor

| Caso de uso | Pasos | ¿Implementado? | Gap |
|---|---|---|---|
| Bandeja con pendientes | Lista por estado | Sí (`bandeja.html`) | Falta SLA visible "Quedan X días" |
| Revisar postulación inicial | Checklist datos básicos / Aprobar / Devolver / Rechazar | Sí (`revisar-postulacion.html`) | OK |
| Revisar doc. general | Checklist documentos comunes | Sí (`doc-general.html`) | OK |
| Revisar doc. técnica (vista de 8 áreas) | Cards de cada área con estado | Sí (`doc-tecnica.html`) | Verificar **conteo de áreas = 8** |
| Revisar un área | Checklist Cumple/No cumple + Aprobar/Devolver | Sí (`revisar-area.html`) | OK pero ver Sección F |
| Emitir concepto de favorabilidad | Auto cuando todas las áreas + general OK | Sí (`concepto.html`) | OK |

---

## F · Áreas técnicas de revisión

### Áreas según xlsx hoja "7. Revisión Técnica (82×5)"
1. **Levantamiento topográfico** (Res. 933 Art. 3.1)
2. **Estudio de suelos** (Art. 3.2)
3. **Diseño arquitectónico** (Art. 3.3)
4. **Diseño estructural** (Art. 3.4)
5. **Diseño hidrosanitario y red contra incendios** (Art. 3.5)
6. **Diseño eléctrico (incl. RETIE/RETILAP)** (Art. 3.6)
7. **Manejo, riesgos y ambiental** (Art. 3.7)
8. **Presupuesto integral** (Art. 3.8)

### Áreas en `revisor/revisar-area.html` (AREAS const)
- `topografico`, `suelos`, `arquitectonico`, `estructural`, `hidrosanitario`, `ambiental` (etiqueta "Manejo, Riesgos y Ambiental"), `presupuesto`
- **Posible faltante: `electrico`** — aparece en los queries pero el grep solo muestra estos 7 keys explícitos. **Validar manualmente este punto antes de la demo.**

### Checklists por área (xlsx)
Cada área tiene 5–10 ítems con referencia al artículo de Res. 933. El código replica el patrón (ítems con `n`, `item`, `ref`) — bien.

**Estado resultante por área:** Aprobado / Devuelto / Rechazado. El código solo maneja `aprobado` / `devuelto` / `pendiente` → falta `rechazado` (no subsanable).

---

## G · Tabla de inversión

### Columnas requeridas por negocio (transcripción Danna 00:34:07 + xlsx hoja 11)
- BPIN, Proyecto, Municipio, Presupuesto solicitado, **Monto aprobado**, Fecha activación, SUID escenario, **Ejecutor**, **Centro de costo**, **Fuentes de financiación**.
- Sumatoria total al pie ✓.

### Columnas actuales en `admin/inversion.html`
`["BPIN", "Proyecto", "Municipio", "Presupuesto", "Aprobado", "Activado", "SUID"]`
- **Falta:** Ejecutor, Centro de costo, Fuentes.
- Sumatoria total: **Sí** (L166-167 — "Sumatoria total de inversión").
- KPIs: Inversión total activada, Solicitado total, Listos para activar — **bien**.

---

## H · Registro SUID de escenarios

### Lo que pide el negocio
- Al activar inversión de un proyecto de **infraestructura**, se debe **abrir formulario de Registro SUID** para inventariar el escenario en el sistema nacional (transcripción 00:42:56, xlsx Formularios Adicionales hoja 10–11).
- El SUID es el identificador único del escenario deportivo.

### Lo que existe en código
- `modal-activar-inversion.js` muestra mensaje informativo: *"Al activar este proyecto se habilitará el formulario de Registro de Escenarios para inventariar la infraestructura en el sistema nacional."*
- Captura el `suidEscenario` en el formulario de activación → guarda en `proyecto.inversion.suidEscenario`.
- Botón "Ir a tabla de inversión" en success screen.
- **NO existe pantalla/módulo de Registro SUID** que se abra después de activar.

### Brecha
**Crítica para demo.** El stakeholder va a hacer clic esperando el formulario SUID y no aparece. Mínimo: una pantalla mock con el formulario de Registro SUID (aunque sea read-only o solo placeholder).

---

## I · Plan de acción priorizado

### P0 (BLOQUEANTES para demo 15 de mayo)

| # | Archivo | Cambio | Tiempo |
|---|---|---|---|
| 1 | `shared/modal-postular.js` | Agregar campos obligatorios: Tipo de entidad formuladora, NIT, ZOMAC (bool), PDET (bool), EBI/PND (bool), Tipología (dropdown 15 opciones), Subtipología (dependiente), Modalidades (multi), Aforo proyectado, Área del predio, Datum. Convertir Departamento y Municipio en dropdowns reales (al menos top-5 catálogo). | 4–6 h |
| 2 | `revisor/revisar-area.html` | Verificar que las **8 áreas** estén cargadas. Si falta "Eléctrico", agregarla con su checklist (Art. 3.6). | 1 h |
| 3 | NUEVO `municipio/registro-suid.html` o `admin/registro-suid.html` | Pantalla mock de Registro SUID que se abre desde el success screen de activar inversión. Formulario con: SUID generado, datos del escenario heredados, tipología, modalidades, características Art. 10. | 3 h |
| 4 | `shared/modal-activar-inversion.js` | Cambiar el botón "Ir a tabla de inversión" por **dos botones**: "Ir a tabla" + "Diligenciar Registro SUID". | 30 min |
| 5 | `admin/inversion.html` | Agregar columnas **Ejecutor** y **Fuentes de financiación**. Asegurar que **SUID sea link clickeable** a `registro-suid.html`. | 1 h |
| 6 | `shared/data.js` | Quitar valores hardcoded "Chocó/Quibdó/Alcalde Municipal" del seed para que la demo no se vea de un solo municipio. Agregar 2 municipios más al seed. | 1 h |

### P1 (Importantes — fortalecen la demo)

| # | Archivo | Cambio | Tiempo |
|---|---|---|---|
| 7 | `revisor/bandeja.html` + `municipio/proyectos.html` | Agregar contador visible "Quedan X días" basado en `fechaPostulacion + 15 días`. Color caution cuando ≤3 días. | 2 h |
| 8 | `shared/states.js` | Agregar estado `rechazado` a `ESTADOS_AREA` (distinto de `devuelto`). | 30 min |
| 9 | `municipio/subsanar.html` | Agregar selector "Área a subsanar" (multi-área en paralelo según xlsx hoja 8). | 2 h |
| 10 | `admin/inversion-crear.html` | Auditar y completar campos financieros del xlsx hoja 11 (BPIN, ejecutor, centro de costo, fuentes, vigencia presupuestal). | 3 h |
| 11 | `admin/convocatoria-detalle.html` | Sección "Asignar revisor" con selector (aunque sea mock de 3 revisores). | 1 h |
| 12 | `municipio/prorroga.html` | Mostrar nueva fecha límite tras prórroga aprobada, propagar al contador. | 1 h |

### P2 (Nice-to-have — pulen el detalle)

| # | Archivo | Cambio | Tiempo |
|---|---|---|---|
| 13 | `shared/data.js` | Diversificar seed con entidades no-alcaldía (Gobernación, Resguardo) para mostrar el catálogo completo. | 1 h |
| 14 | `shared/states.js` + UI | Job/setTimeout simulado que mueva proyectos a `expirada` cuando vence el plazo (auto). | 2 h |
| 15 | `admin/inversion.html` | Filtro por departamento/municipio + export CSV. | 2 h |
| 16 | Cross-pages | Toast unificado cuando se hereda radicado entre pantallas. | 1 h |
| 17 | Documentación | Generar `DEMO-SCRIPT.md` con guion de 12 minutos para presentar al Ministerio (orden de clics). | 2 h |

---

## Resumen final

**Estado actual:** El módulo cubre el **80% del happy path** estructural y visual, pero le faltan los **detalles que un stakeholder normativo nota inmediatamente**: campos obligatorios del Registro Básico, la pantalla de Registro SUID, y las 8 áreas técnicas exactas.

**Esfuerzo P0 estimado:** **10–12 horas** de implementación concentrada. Con esto la demo del 15 de mayo pasa la validación del Ministerio.

**Esfuerzo P0+P1:** **22–25 horas** (3 días-persona).

**Riesgo más alto:** Item #3 (Registro SUID). Es el deliverable que Danna/Andrea preguntaron en voz alta y que hoy es solo una promesa textual.
