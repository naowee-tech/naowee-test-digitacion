# ACTA DE ENTREGA — Módulo Project v1.0

> **Naowee · Ministerio del Deporte de Colombia**
> Digitalización del flujo de inversión en infraestructura deportiva
> **Marco normativo:** Resolución 933 de 2024 · Ley 181 de 1995

---

## 0 · Información de la entrega

| Campo | Valor |
|---|---|
| Producto | **Naowee Project** — módulo de gestión de proyectos de inversión |
| Versión oficial | **`project-v2.0.0`** · MVP entregada a desarrollo |
| Fecha | 17 mayo 2026 |
| Branch | `project/refinements-validation-suite` |
| Tag git | `project-v2.0.0` ([ver release](https://github.com/naowee-tech/naowee-test-digitacion/releases/tag/project-v2.0.0)) |
| Pull Request | [#9 — naowee-tech/naowee-test-digitacion](https://github.com/naowee-tech/naowee-test-digitacion/pull/9) |
| Demo Pages | https://naowee-tech.github.io/naowee-test-digitacion/project/index.html |
| Demo local | `http://localhost:4700/index.html` |
| Stack técnico | HTML + CSS + JS vanilla · Naowee DS v1.8.0 (CDN) · LocalStorage como backend simulado |
| Documentos relacionados | `CHANGELOG.md` · `docs/V2-FLUJOS-POR-ROL.md` · `FLUJO-E2E.md` · `DEMO-SCRIPT-DEV-HANDOFF.md` |

> **Política de versionado** (acordada con Doug 17/05/2026):
> - `v2.0.0` es la **MVP entregada a desarrollo**
> - Cambios de **UI / UX** posteriores → **PATCH** (`v2.0.x`)
> - **Sub-funcionalidades / mejoras internas** → **MINOR** (`v2.x.0`)
> - **Nuevas funcionalidades top-level / breaking changes** → **MAJOR** (`v3.0.0+`)
>
> Detalle completo en [`CHANGELOG.md`](./CHANGELOG.md).

---

## 1 · Resumen ejecutivo

Esta entrega cubre **el ciclo completo de gestión de un proyecto de inversión** desde la apertura de una convocatoria hasta la activación de los recursos, atravesando los **3 perfiles del sistema**: Administrador (Ministerio), Municipio postulante y Equipo Revisor.

El flujo end-to-end ya está cerrado y operativo en demo:

```
[Admin] crea convocatoria
   └─→ [Municipio] postula proyecto
         └─→ [Revisor RBI] valida requisitos básicos
               ├─→ devuelve a subsanación  ────┐
               └─→ aprueba RBI                  │
                     └─→ [Revisor General + Técnicos] revisan en paralelo
                           ├─→ devuelven áreas a subsanación ──┐
                           ├─→ aprueban todas                   │
                           │     └─→ Concepto Favorable        │
                           │           └─→ [Admin] activa inversión
                           ▼                                     ▼
                     [Municipio] subsana ←─── notificación per-revisor
                           └─→ áreas pasan a estado 'subsanada'
                                 └─→ revisor re-evalúa con docs nuevos
```

**Capacidades clave de v1.0:**
- 3 dashboards perfilados (admin / municipio / revisor)
- Wizard de postulación con validaciones + persistencia
- Wizard de subsanación con smart accordion + auto-progresión
- Sistema de notificaciones per-revisor con deep-links
- Catálogo canónico de 6 áreas técnicas (Res. 933 Art. 3)
- Equipo revisor de 6 personas (1 RBI + 1 Doc General + 4 Técnicos cubriendo 8 especialidades)
- Estados con máquina de transiciones (10 estados de postulación + 6 estados de área)
- Modo demo `guided` (seed vacío) y `free` (data poblada)
- Persistencia 100% en `localStorage` con esquema versionado

---

## 2 · Mapa de pantallas por perfil

### 2.1 Admin · Ministerio del Deporte (12 pantallas)

| Pantalla | Ruta | Responsabilidad |
|---|---|---|
| Dashboard | `admin/dashboard.html` | KPIs globales del bienio + alertas SLA |
| Convocatorias — listado | `admin/convocatorias.html` | Tabla con filtros, búsqueda, vista cards/list |
| Convocatoria — crear | `admin/convocatoria-crear.html` | Wizard de creación de convocatoria |
| Convocatoria — detalle | `admin/convocatoria-detalle.html` | Hero + bento de info + tabla de postulaciones |
| Convocatoria — notificar | `admin/convocatoria-notificar.html` | Selección de municipios destinatarios |
| Proyectos — listado | `admin/proyectos.html` | Vista global de todos los proyectos del bienio |
| Proyecto — detalle | `admin/proyecto-detalle.html` | Vista 360 con áreas, revisores asignados, SLA |
| Inversión — listado | `admin/inversion.html` | Proyectos en ejecución de inversión |
| Inversión — crear | `admin/inversion-crear.html` | Wizard de activación de inversión |
| Prórrogas | `admin/prorrogas.html` | Solicitudes de prórroga RBI pendientes |
| Usuarios | `admin/usuarios.html` | CRUD de usuarios municipales + revisores |
| Registro SUID | `admin/registro-suid.html` | Registro inicial al sistema |

### 2.2 Municipio · Alcaldía / Gobernación / Resguardo / Consejo (9 pantallas)

| Pantalla | Ruta | Responsabilidad |
|---|---|---|
| Dashboard | `municipio/dashboard.html` | Mi panel — proyectos vigentes + notificaciones |
| Convocatorias — listado | `municipio/convocatorias.html` | Convocatorias abiertas + cerradas |
| Convocatoria — detalle | `municipio/convocatoria-detalle.html` | Info de convocatoria + CTA postular |
| Postular | `municipio/postular.html` | Wizard multi-paso de postulación |
| Proyectos — listado | `municipio/proyectos.html` | Mis proyectos postulados |
| Proyecto — perfil | `municipio/proyecto-perfil.html` | Vista del proyecto + chat de observaciones |
| Etapa documental | `municipio/etapa-documental.html` | Carga de documentos técnicos por área |
| Subsanar (modal) | `?subsanar=1` | Wizard de respuesta a observaciones |
| Prórroga | `municipio/prorroga.html` | Solicitud de extensión de plazo |

### 2.3 Revisor · Equipo del Ministerio (7 pantallas)

| Pantalla | Ruta | Responsabilidad |
|---|---|---|
| Dashboard | `revisor/dashboard.html` | KPIs personales + notificaciones para mí |
| Bandeja | `revisor/bandeja.html` | Postulaciones que requieren acción |
| Revisar postulación (RBI) | `revisor/revisar-postulacion.html` | Checklist RBI · solo revisor 'rbi' |
| Doc Técnica | `revisor/doc-tecnica.html` | Vista de las 6 áreas técnicas del proyecto |
| Doc General | `revisor/doc-general.html` | Checklist documentación general · solo revisor 'general' |
| Revisar Área | `revisor/revisar-area.html` | Checklist por área técnica + docs sidebar |
| Concepto | `revisor/concepto.html` | Cierre de concepto favorable |

---

## 3 · Estados y máquina de transiciones

### 3.1 Estados de postulación (10)

| Estado | Color | Significado |
|---|---|---|
| `borrador` | neutral | El municipio empezó pero no ha enviado |
| `presentado` | informative | Postulación radicada · esperando asignación |
| `en_revision_rbi` | caution | Revisor RBI evaluando requisitos básicos |
| `rbi_aprobada` | informative | RBI ok · libera revisión paralela (general + áreas) |
| `en_revision_docs` | brand | Revisión paralela en curso |
| `devuelta_subsanacion` | caution | Hay áreas devueltas · municipio debe corregir |
| `concepto_favorable` | positive | Todas las áreas + general aprobadas |
| `en_inversion` | positive | Recursos activados · ejecución |
| `expirada` | negative | Plazo vencido sin acción |
| `rechazada` | negative | Rechazada por incumplimiento (Res. 933 Art. 9) |

### 3.2 Estados de área técnica (6)

| Estado | Color | Significado |
|---|---|---|
| `pendiente` | neutral | Aún no inicia revisión |
| `en_revision` | caution | Revisor activamente revisando |
| `aprobado` | positive | Cerrada · decisión final |
| `devuelto` | caution | Esperando subsanación del municipio |
| `subsanada` ✨ | informative | **Nuevo en v1.0** — municipio respondió, revisor debe re-evaluar |
| `rechazado` | negative | No subsanable · requiere replantear (raro) |

### 3.3 Transiciones permitidas

```text
borrador → presentado
presentado → en_revision_rbi
en_revision_rbi → rbi_aprobada | devuelta_subsanacion | rechazada
rbi_aprobada → en_revision_docs
en_revision_docs → concepto_favorable | devuelta_subsanacion | rechazada
devuelta_subsanacion → en_revision_rbi | en_revision_docs | expirada
expirada → borrador | presentado
concepto_favorable → en_inversion
```

A nivel de área técnica:
```text
pendiente → en_revision → aprobado | devuelto
devuelto → subsanada (al recibir subsanación municipio)
subsanada → aprobado | devuelto (re-evaluación del revisor)
```

---

## 4 · Reglas de negocio implementadas

### 4.1 Equipo revisor — modelo Danna/Juanma

| Tipo | Cantidad | Especialidad | Pantalla principal |
|---|---|---|---|
| `rbi` | 1 | Requisitos Básicos Indispensables | `revisar-postulacion.html` |
| `general` | 1 | Documentación General | `doc-general.html` |
| `tecnico` | 4 | Cubren 8 áreas en 4 personas (2 áreas por revisor) | `revisar-area.html` |

**Personas en seed:**
- **Diana Patricia Salgado** · RBI
- **Luis Felipe Rondón** · General
- **Juan Manuel Ávila** · Arquitectónico + Estructural
- **María Elena Cortés** · Hidrosanitario + Eléctrico
- **Carlos Beltrán** · Suelos + Topográfico
- **Andrea Quintero** · Ambiental + Presupuesto

**Regla "solo apruebas lo tuyo":** cada área tiene un `revisorId` asignado por especialidad. Solo el revisor asignado puede aprobar / devolver. El resto del equipo ve la información en modo consulta.

### 4.2 Catálogo de áreas técnicas (Res. 933 Art. 3)

| Key | Nombre | Items checklist |
|---|---|---|
| `topografico` | Levantamiento topográfico | 5 |
| `suelos` | Estudio de suelos | 4 |
| `arquitectonico` | Diseño arquitectónico | 8 |
| `estructural` | Diseño estructural | 4 |
| `hidrosanitario` | Diseño hidráulico, sanitario y pluvial | 6 |
| `electrico` | Diseño eléctrico (RETIE/RETILAP) | 5 |

**Total: 32 items de checklist** distribuidos en 6 áreas. Más documentación general (`general`) que tiene su propio bloque de validación.

### 4.3 SLA · plazos legales

| Etapa | Plazo |
|---|---|
| Revisión de cada área técnica | **15 días hábiles** desde asignación |
| Revisión RBI | **15 días hábiles** desde recepción |
| Subsanación municipio | **15 días hábiles** desde devolución |
| Re-evaluación tras subsanación | **15 días hábiles** (SLA reset) |

**Indicadores visuales:**
- 🟢 verde · `--ok` · más de 7 días restantes
- 🟠 naranja · `--warn` · ≤7 días
- 🔴 rojo · `--vencido` · < 0 días

Todos unificados bajo `.naowee-sla` (utility transversal).

### 4.4 Tipos de entidad postulante

`Alcaldía Municipal` · `Gobernación Departamental` · `Resguardo Indígena` · `Consejo Comunitario` · `Distrito Especial`

Marcadores: `zomac`, `pdet`, `ebiPnd` (priorizan revisión).

---

## 5 · Funcionalidades destacadas (entregables PM-ready)

### 5.1 Wizard de postulación
**Pantalla:** `municipio/postular.html`
- Stepper multi-paso (información proyecto → ubicación → documentos → revisar → enviar)
- Validación campo a campo con wiggle + scroll automático al primer error
- File uploaders con tamaño máximo + accept type + chips por archivo
- Review readonly del paso final agrupado por área
- Success screen con confetti + entry en historial

### 5.2 Smart Accordion de subsanación ⭐
**Pantalla:** `municipio/proyecto-perfil.html?subsanar=1`
- Cada observación es un `<details>` colapsable con número, título, ref, status pill
- Primera pendiente se abre automáticamente
- CTA "Marcar como subsanada" se habilita cuando hay documento adjunto
- Auto-progresión con smooth scroll al siguiente pendiente
- Botón "Continuar" del wizard se desbloquea cuando todas las obs están done
- Review readonly con file cards (PDF tile + meta + preview) + nota etiquetada
- Documento es **mandatorio**, nota es **opcional**

### 5.3 Per-revisor notifications ⭐
**Origen:** `shared/modal-subsanar.js` · `btnEnviar` handler
**Consumo:** `revisor/dashboard.html` panel "Notificaciones para ti"
- Una notificación por revisor asignado (no genérica al rol)
- Cada notif lleva `revisorId`, `proyectoId`, `tipo`, `href` deep-link
- Filtrado en dashboard por `revisorId === activo`
- Click marca como leída + navega al deep-link
- Timestamp relativo (Hace 2 min · Hace 3 h · Hace 1 día)
- Badge de no-leídas en el header del panel

### 5.4 Estado 'subsanada' editable ⭐
**Pantalla:** `revisor/revisar-area.html`
- Cuando municipio envía subsanación, el área pasa de `devuelto` → `subsanada`
- La pantalla deja de estar en read-only para el revisor asignado
- Cenefa edge-to-edge informativa: "Subsanación recibida — re-evalúa el área"
- Sidebar de docs con border-top azul + badge "X nuevos"
- Documentos nuevos (`d.subsanacionDe`) se ordenan PRIMERO con tag "NUEVO" inline
- SLA reset (15 días para re-evaluar)
- Aprobar/devolver flujos sin cambios — naturalmente transicionan

### 5.5 Bento layout para revisión de área
**Pantalla:** `revisor/revisar-area.html`
- Card de proyecto full-width arriba
- Grid 70/30: checklist (izquierda) + sidebar de docs sticky (derecha)
- Doc pills compactos con icon, nombre, meta, descarga DS-tooltip
- "Ver más" inline expansion cuando >4 docs

### 5.6 Doc General con toggles icon-only
**Pantalla:** `revisor/doc-general.html`
- Secciones colapsables `<details>`
- Toggles 34×34 icon-only (cumple verde · no cumple rojo · n/a azul)
- Hover-reveal pattern: visibles al hacer hover de la fila, persistentes en estado activo
- Descarga PDF con tooltip canónico DS

### 5.7 Cenefa edge-to-edge top
**Pantalla:** transversal (admin/convocatoria-detalle, municipio/proyecto-perfil, revisor/revisar-area)
- Patrón canónico DS para banners de estado contextual
- Variantes semánticas: `--positive` `--caution` `--informative` `--neutral` `--negative`
- Edge-to-edge debajo del header (margins negativos para escapar el padding del `.page`)
- Reemplaza scattered `naowee-message` inline placements

### 5.8 Sistema de prórroga
**Pantalla:** `municipio/prorroga.html`
- Solicitud con justificación + duración
- Admin aprueba/rechaza desde `admin/prorrogas.html`
- Extensión automática del SLA
- Persistencia en historial del proyecto

### 5.9 Modo demo dual
- **`guided`** (seed vacío) — para hacer demos de "primer uso"
- **`free`** (seed completo) — para mostrar el módulo en plena operación
- Toggle desde el role switcher inferior
- Reset desde admin/dashboard.html (botón "Reiniciar demo")

---

## 6 · Sistema de Diseño (DS Naowee v1.8.0)

### 6.1 Componentes consumidos del DS canónico
- `naowee-btn` (variants: `--loud` `--quiet` `--mute` `--link` + `--small` `--large`)
- `naowee-badge` (variants: `--positive` `--caution` `--informative` `--neutral` `--negative` + `--quiet` `--small`)
- `naowee-message` (deprecado en favor de cenefa para banners contextuales)
- `naowee-modal` + `naowee-modal__body` + `naowee-modal__footer`
- `naowee-stepper` (paso a paso con conectores)
- `naowee-textfield` + `naowee-helper`
- `naowee-file-uploader`
- `naowee-page-header`
- `naowee-empty-state`
- `naowee-pagination`

### 6.2 Patrones / utilidades nuevos creados en v1.0

| Utilidad | Archivo | Reemplaza |
|---|---|---|
| `.naowee-sla` | `pages.css` | 5+ variantes custom de SLA pill |
| `.has-tooltip` | `pages.css` | Tooltips nativos `title=""` del navegador |
| `.convo-status-cenefa --top` | `pages.css` | `naowee-message` inline para banners de estado |
| `.subs-obs-item` | `pages.css` | Listas verticales de observaciones |
| `.subs-review` | `pages.css` | Review readonly key/value plano |
| `.rev-notif-panel` | `pages.css` | Sin equivalente previo (nuevo) |
| `.ra-doc-pill--new` + `__new-tag` | `revisar-area.html` | Sin equivalente previo (nuevo) |

### 6.3 Tokens custom usados (alineados al DS)

| Token | Valor | Uso |
|---|---|---|
| `--naranja` | `#FF7500` | Brand primario |
| `--accent` | `#d74009` | Acciones, focus |
| `--green` | `#1f8923` | Aprobado, subsanado |
| `--blue-info` | `#1f78d1` | Subsanación recibida, info |
| `--text-primary` | `#282834` | Texto principal |
| `--text-secondary` | `#646587` | Texto secundario |
| `--shadow-card` | `0 0 2px rgba(145,158,171,.2), 0 12px 24px -4px rgba(145,158,171,.12)` | Cards elevados |

---

## 7 · Backlog para PM (historias sugeridas)

> Estas son user stories listas para que el PM las redacte en su backlog. Cada una está vinculada a una funcionalidad ya implementada (o explícitamente marcada como _pendiente post-MVP_).

### 7.1 Épicas v1.0 (entregadas)

#### Épica · Convocatorias (Admin)
- **HU-A01** — Como Admin quiero crear una nueva convocatoria con presupuesto, fechas y tipos de entidad elegibles, para que aparezca en el listado de los municipios. ✅ `admin/convocatoria-crear.html`
- **HU-A02** — Como Admin quiero notificar a un grupo de municipios cuando publico una convocatoria, para que reciban el aviso oficial. ✅ `admin/convocatoria-notificar.html`
- **HU-A03** — Como Admin quiero ver el detalle de una convocatoria con todas las postulaciones recibidas, filtrar por estado y descargar el listado. ✅ `admin/convocatoria-detalle.html`

#### Épica · Postulación (Municipio)
- **HU-M01** — Como Municipio quiero ver las convocatorias abiertas que aplican a mi tipo de entidad, para decidir a cuál postular. ✅ `municipio/convocatorias.html`
- **HU-M02** — Como Municipio quiero diligenciar un formulario multi-paso para postular un proyecto, con validaciones por campo y poder guardar borradores. ✅ `municipio/postular.html`
- **HU-M03** — Como Municipio quiero ver el detalle de mi postulación con su estado actual y el chat de observaciones del revisor. ✅ `municipio/proyecto-perfil.html`

#### Épica · Revisión RBI (Revisor RBI)
- **HU-R01** — Como Revisor RBI quiero ver mi bandeja con las postulaciones nuevas, ordenadas por SLA, para priorizar mi trabajo. ✅ `revisor/bandeja.html`
- **HU-R02** — Como Revisor RBI quiero validar el checklist RBI de cada postulación y aprobar / devolver con observaciones. ✅ `revisor/revisar-postulacion.html`

#### Épica · Revisión Documental (Revisor General + Técnicos)
- **HU-R03** — Como Revisor de Doc General quiero validar la documentación general de un proyecto con checklist colapsable y descarga de cada PDF. ✅ `revisor/doc-general.html`
- **HU-R04** — Como Revisor Técnico quiero ver mis 6 áreas técnicas asignadas con avance y SLA, y entrar a revisar cada una. ✅ `revisor/doc-tecnica.html`
- **HU-R05** — Como Revisor Técnico quiero validar el checklist de mi área con docs sidebar y aprobar / devolver. ✅ `revisor/revisar-area.html`

#### Épica · Subsanación (Municipio + Revisor) ⭐ flujo nuevo
- **HU-S01** — Como Municipio quiero ver banner contextual cuando mi proyecto está devuelto a subsanación, con CTA directo al wizard. ✅ `municipio/proyecto-perfil.html`
- **HU-S02** — Como Municipio quiero responder cada observación con un documento corregido (mandatorio) y nota opcional, viendo mi avance en tiempo real. ✅ smart accordion en modal-subsanar
- **HU-S03** — Como Municipio quiero confirmar todas mis respuestas en un review readonly antes de enviar, con visualización clara de archivos y notas. ✅ `subs-review` redesign
- **HU-S04** — Como Revisor quiero recibir notificación específica para mí (no genérica al rol) cuando llegue subsanación de un área que tengo asignada. ✅ per-revisor notif
- **HU-S05** — Como Revisor quiero ver en mi dashboard un panel "Notificaciones para ti" filtrado a las acciones que requieren mi atención directa. ✅ `rev-notif-panel`
- **HU-S06** — Como Revisor quiero entrar a un área en estado "subsanada" y poder re-evaluarla (no solo verla en read-only), con highlight de los documentos nuevos. ✅ `subsanada` editable + `ra-doc-pill--new`

#### Épica · Inversión (Admin)
- **HU-A04** — Como Admin quiero activar la inversión de un proyecto con concepto favorable, registrando código presupuestal y fecha de inicio. ✅ `admin/inversion-crear.html`
- **HU-A05** — Como Admin quiero ver el listado de proyectos en inversión con su estado de ejecución. ✅ `admin/inversion.html`

#### Épica · Prórrogas
- **HU-P01** — Como Municipio quiero solicitar prórroga del plazo RBI con justificación, y ver el estado de mi solicitud. ✅ `municipio/prorroga.html`
- **HU-P02** — Como Admin quiero aprobar / rechazar las solicitudes de prórroga pendientes, y que la extensión se aplique automáticamente al SLA. ✅ `admin/prorrogas.html`

### 7.2 Backlog post-MVP (sugeridos para v1.1+)

#### Bugs visuales conocidos
- **BUG-V01** — Algunos breakpoints intermedios (601px–899px) muestran overflow horizontal en la tabla de doc-general
- **BUG-V02** — El stepper en mobile no rota a vertical (queda apretado horizontalmente)
- **BUG-V03** — El confetti del success screen no respeta `prefers-reduced-motion`

#### Funcionalidades opcionales pendientes
- **HU-F01** — Como Municipio quiero descargar mi proyecto completo como PDF para mi archivo
- **HU-F02** — Como Revisor quiero exportar el concepto técnico como PDF firmable
- **HU-F03** — Como Admin quiero un dashboard con métricas agregadas del bienio (presupuesto comprometido, proyectos por estado, tiempos promedio de revisión)
- **HU-F04** — Como Revisor quiero filtrar mi bandeja por área técnica + estado
- **HU-F05** — Como Municipio quiero recibir email cuando mi proyecto cambie de estado (hoy solo notificación in-app)
- **HU-F06** — Sistema de delegación de áreas entre revisores (cubrir vacaciones)
- **HU-F07** — Vista de auditoría con timeline completo del proyecto (historial enriquecido)
- **HU-F08** — Búsqueda global cross-perfil (Cmd+K)

#### Mejoras de accesibilidad
- **A11Y-01** — Audit completo WCAG 2.2 AA con focus visible en todos los componentes interactivos
- **A11Y-02** — Live regions para anuncios de cambios de estado (toasts, snackbars)
- **A11Y-03** — Navegación por teclado completa en el smart accordion (flechas)

---

## 8 · Cómo correr la demo

### 8.1 Servidor local
```bash
# Desde la raíz del repo (donde está project/)
cd project
python3 -m http.server 4700
# o el inline server de Node configurado en .claude/launch.json
```

Abrir `http://localhost:4700/index.html` y elegir un perfil.

### 8.2 Cambiar de perfil
- Botón flotante inferior (role switcher) → 3 perfiles
- Dentro del perfil revisor, sub-switcher para cambiar entre los 6 revisores del equipo

### 8.3 Modo demo
- `Free` (default) — data poblada con 4 proyectos en distintos estados
- `Guided` — seed vacío para hacer demos desde cero

Toggle desde admin/dashboard.html → botón "Modo demo".

### 8.4 Reset de la demo
- admin/dashboard.html → botón "Reiniciar demo" (limpia localStorage y recarga seed)

---

## 9 · Stakeholders y team

### 9.1 Para presentar a stakeholders (URLs clave)

| Demo | URL | Personaje sugerido |
|---|---|---|
| Vista Admin: convocatorias del bienio | `/admin/dashboard.html` | Andrea Rodríguez |
| Crear nueva convocatoria | `/admin/convocatoria-crear.html` | Andrea Rodríguez |
| Vista Municipio: postular | `/municipio/convocatorias.html` | Carlos Mosquera (Quibdó) |
| Vista Municipio: subsanar | `/municipio/proyecto-perfil.html?id=PROJ-2026-001&subsanar=1` | Carlos Mosquera |
| Vista Revisor RBI | `/revisor/dashboard.html` | Diana Patricia Salgado |
| Vista Revisor Técnico (re-evaluar subsanación) | `/revisor/revisar-area.html?id=PROJ-2026-001&area=electrico` | María Elena Cortés |

### 9.2 Para dev team (handoff técnico)
- `docs/V2-FLUJOS-POR-ROL.md` — flujos por rol con anotaciones de implementación
- `FLUJO-E2E.md` — guía paso a paso del flujo end-to-end
- `DEMO-SCRIPT-DEV-HANDOFF.md` — script de demo para PMs / devs
- `HANDOFF-SESSION-2026-05-12.md` — handoff de sesión anterior
- `shared/states.js` — máquina de estados completa
- `shared/data.js` — modelo de datos + seed completo

---

## 10 · Compromiso de calidad

- ✅ Flujo end-to-end probado manualmente en los 3 perfiles
- ✅ Sin errores de consola en navegación normal
- ✅ Persistencia funcional en `localStorage` con migración de esquema
- ✅ Cache busters en CSS y JS (`?v=YYYYMMDDx`) para deploy sin caché
- ✅ Naming convention BEM-inspired consistente
- ⚠️ Coverage de tests automatizados: **0%** (proyecto sin build tools, validación manual)
- ⚠️ Audit Lighthouse / a11y pendiente para v1.1
- ⚠️ Cross-browser pendiente: probado en Chrome desktop, falta validar Safari + Firefox

---

## 11 · Próximos pasos sugeridos

1. **Demo a stakeholders** con el script de la sección 9.1
2. **Backlog grooming** con el PM usando las historias de la sección 7
3. **Sprint 1 v1.1** sugerido: A11Y-01 + BUG-V01 + HU-F03 (métricas dashboard admin)
4. **Migración a backend real**: el contrato de datos vive en `shared/data.js` — replicar las funciones (`getProyectos`, `setProyecto`, `pushNotificacion`, etc.) como API REST manteniendo las mismas firmas

---

**Acta firmada por la entrega técnica.**
*Para preguntas, dudas o ajustes: ver el PR #9 o agendar revisión con el equipo de producto.*
