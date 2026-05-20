# Changelog — Naowee Project Module

> **Esquema:** [Semantic Versioning 2.0](https://semver.org/lang/es/) · `MAJOR.MINOR.PATCH`
> **Política de versionado (acordada con Doug 17/05/2026):**
> - `v2.0.0` es la **MVP entregada a desarrollo** — flujo end-to-end cerrado para los 3 perfiles
> - **Cambios de UI / UX** posteriores → **PATCH** (`v2.0.x`)
> - **Sub-funcionalidades / mejoras internas** → **MINOR** (`v2.x.0`)
> - **Nuevas funcionalidades top-level / breaking changes** → **MAJOR** (`v3.0.0+`)
>
> **Tag scheme en git:** `project-vX.Y.Z` (prefijo `project-` para diferenciarlo del versionado del módulo `digitacion/`).

---

## [Unreleased] — `v2.0.x` (próximo PATCH)

> Sin cambios funcionales acumulados aún. La última versión publicada es `project-v2.0.3`.

---

## [project-v2.0.3] — 2026-05-20 · Patch SUID wizard + Postular reestructurado + fixes UX

> **Hito:** tercer PATCH consolidado. 8 commits enfocados en el modal SUID v3 (wizard 2 pasos + borrador), la reestructuración del wizard de Postular (3 bloques con cantidades correctas de docs por solicitud de Doug), y fixes UX (panel-card hover, padding interno de cards, filtro de convocatorias cerradas).
> **Tag git:** `project-v2.0.3` · **Snapshot:** https://naowee-tech.github.io/naowee-test-digitacion/project/v2.0.3/index.html

### Added — Modal SUID `modal-registro-escenario-v3.js` (wizard 2 pasos + borrador localStorage)
- **Paso 1:** Datos básicos + Georreferenciación (campos existentes: nombre, departamento/municipio, catastral, mapa Leaflet, lat/lon, dirección, zona).
- **Paso 2 (nuevo):** Características físicas + Disciplinas — tipo de escenario (11 opciones), área construida (m²), capacidad de espectadores, estado físico (4 niveles), disciplinas deportivas (14 opciones multi-select pills), observaciones (textarea opcional 500 chars).
- **Wizard navigation:** botón "Continuar →" en paso 1, "Validar y registrar →" en paso 2. Botón "Atrás" visible solo en paso 2. Step indicator con dots (verde=done, naranja=activo, gris=pendiente).
- **Helper error inline:** ícono minus-circle filled rojo + mensaje específico debajo de cada field obligatorio. Solo aparecen al intentar avanzar (no por default). Animation fade-in + wiggle en el campo.
- **Borrador localStorage por proyectoId:** key `naowee.escenario.draft.<proyectoId>`. Debounced save (350ms) en cada keystroke / selección. Al reabrir el modal del mismo proyecto restaura automáticamente todos los campos. Se borra al completar exitosamente el paso 2.
- **Toast positive de éxito** tras registro: "Escenario registrado en SUID · {nombre} quedó pre-validado" antes del reload.

### Changed — `modal-postular.js` Bloque 1 (RBI · Documentación indispensable)
Antes: 3 grupos con múltiples docs cada uno (3 + 2 + 3 = 8 docs). Ahora: **4 grupos de 1 doc cada uno**:
1. Carta de intención (Sec. 1.1)
2. Titularidad del predio (Sec. 1.2-1.3)
3. Registro fotográfico (Sec. 1.4) ← nuevo
4. Riesgos y norma urbana (Sec. 1.5) ← nuevo

Eliminado: "Soporte presupuestal y SUID" (no aplica en flujo MVP). Renombrado: "Carta de intención y formalización" → "Carta de intención". Íconos nuevos: `ICON_RBI_FOTO` (cámara) y `ICON_RBI_RIESGO` (escudo).

### Changed — `modal-postular.js` Bloque 2 (Documentación general)
Antes: 3 grupos con 3-4 docs cada uno (3 + 4 + 4 = 11 docs). Ahora: **7 grupos de 1 doc cada uno** (uno por subsección Res. 933 Sec. 2.x):
1. Documento de análisis (2.1)
2. Certificaciones (2.2)
3. Documentos de representante legal (2.3)
4. Banco de programas y proyectos (2.4)
5. Licencias (2.5)
6. Socialización (2.6)
7. Otros Servicios públicos (2.7)

### Changed — `modal-postular.js` Bloque 3 (Documentación técnica)
8 áreas con cantidades específicas según solicitud:
1. Levantamiento topográfico — 1 doc
2. Estudio de suelos — 1 doc
3. Diseño arquitectónico — 3 docs (principal + Zona de competencia + Otros diseños)
4. Diseño estructural — 1 doc
5. Diseño hidráulico, sanitario y pluvial — 3 docs (renombrado de "Hidráulico, sanitario y RCI")
6. Diseño eléctrico — 3 docs (renombrado de "Diseño eléctrico (RETIE/RETILAP)")
7. Planes de manejo, Riesgos y Licencia ambiental — 1 doc (renombrado)
8. Presupuesto — 1 doc (renombrado de "Presupuesto integral")

IDs de áreas (`topografico`, `arquitectonico`, etc.) preservados para no romper la asignación de revisores especialistas en `admin/usuarios.html`.

### Fixed — `panel-card__body` padding-bottom
Tablas sin tfoot (Postulaciones recientes, Convocatorias activas) mostraban el hover de la última fila pegado al borde inferior del card. Causa: `padding: 12px 14px 0` (bottom 0) — diseñado para tablas con tfoot. Fix: padding simétrico por default + excepción con `:has(.dash-table tfoot)` para preservar el comportamiento anterior.

### Fixed — `.pm-anexo__panel` padding-top
El label del primer doc dentro de cada card del wizard de Postular aparecía pegado al divider del summary. Cambiado de `padding: 0 18px 18px` a `padding: 16px 18px 18px`. Aplica a TODOS los cards de Paso 2 (RBI), Paso 3 (General) y Paso 4 (Técnica).

### Fixed — Modal SUID: bug del mock duplicate check + cache de módulos ES
El mock de detección de duplicados bloqueaba el submit con cualquier valor de 30 dígitos que coincidiera con el placeholder. Removido. Archivo renombrado `v1 → v2 → v3` para evitar el cache de módulos ES del browser que servía la versión vieja con la lógica buggy.

### Fixed — `municipio/dashboard.html` filtro de convocatorias cerradas
Convocatoria "DANNA" aparecía como abierta en el dashboard municipal pero como cerrada en `/municipio/convocatorias.html`. Causa: dashboard usaba solo `c.estado === 'abierta'` mientras convocatorias.html usaba estado + ventana `apertura..cierre`. Aplicado el mismo doble check. Defense-in-depth: el click handler re-valida al momento del click y aborta con alert si cerró entre render y click.

### Misc
- Cache busters bumpeados: `pages.css 20260519p → 20260520b`, `modal-postular.js 20260519a → 20260520g`, `modal-registro-escenario v1 → v3 ?v=20260520d`.
- Activación de inversión arreglada (null-guard en tabs binding — era el root cause de "Activar inversión no hace nada").
- Modal SUID copiado del módulo escenarios reemplaza el wizard 3-step viejo (`modal-suid.js`) en `admin/inversion.html`.

---

## [project-v2.0.2] — 2026-05-19 · Patch UI/UX refinements + DS canonical

> **Hito:** segundo PATCH consolidado. 23 commits de refinos visuales, fixes UX y migración de componentes custom al patrón canónico DS Naowee. Sin cambios funcionales/breaking — todo es visual + refinos de interacción.
> **Tag git:** `project-v2.0.2` · **Release:** [project-v2.0.2 — Patch UI/UX consolidado v2](https://github.com/naowee-tech/naowee-test-digitacion/releases/tag/project-v2.0.2)
> **Snapshot:** https://naowee-tech.github.io/naowee-test-digitacion/project/v2.0.2/index.html

### Fixed — botón editar de la tabla de convocatorias
- **Inner shadow naranja persistente** después del primer click: el DS aplica `box-shadow: 0 0 0 3px rgba(215,64,9,.15)` (`--naowee-shadow-focus-accent`) en `:focus-visible`, y el botón retenía el halo después de click + hover siguiente. Fix scoped en `pages.css`: `.convo-edit-btn:focus-visible` ahora adopta el mismo estado visual que `:hover` (orange-bg + accent + svg accent) **sin** box-shadow ni outline — feedback claro para teclado y mouse, sin el ring "fantasma".
- **Tooltip "Editar convocatoria" no se mostraba en la tabla** (sí funcionaba en cards). Root cause: el `::after` CSS-only del `.has-tooltip` se posiciona `bottom: calc(100% + 8px)` (arriba del trigger), pero la columna ACCIONES vive dentro de `.naowee-table-card__table-wrap` que tiene `overflow-x: auto` — y por spec CSS, eso fuerza `overflow-y: auto` también, **clipeando** el tooltip que extiende hacia arriba del primer row.

### Refactored — `.has-tooltip` ahora usa body-portal (`position: fixed`)
- Nuevo helper `initHasTooltipPortal()` en `shell.js` instancia UN tooltip `<div class="naowee-tip-portal">` adjunto al `<body>` con `position: fixed`. En cada `mouseover` / `focusin` de un `.has-tooltip[data-tooltip]`, el helper posiciona el tooltip vía `getBoundingClientRect()` justo encima del trigger. Beneficios:
  - Escapa cualquier overflow ancestor (tablas, cards, modales scrollables)
  - Una sola instancia DOM reutilizada para todos los triggers (memoria mínima)
  - Delegación a nivel `document` — funciona para `.has-tooltip` que se renderizan después (tabs, modales, listas async)
  - Soporte de teclado (`focusin`/`focusout`) + escape via `Esc`
  - Auto-hide en `scroll` / `resize` / `click` (la posición fixed quedaría stale)
- Cuando el portal se inicializa, `<body>` recibe la clase `has-tooltip-portal-active` y `pages.css` desactiva el `::after` CSS-only para evitar tooltips duplicados.
- **Transversal por defecto:** se inicializa desde `mountShell()`, así que toda página del módulo recibe el upgrade sin cambio adicional.

### Refined — modal de edición rápida de convocatoria (`openEditarConvocatoriaQuick`)
- **Section titles** ahora usan gris claro explícito `#9ca0b8` (antes heredaba un color demasiado oscuro), separación visual clara entre bloques de sección.
- **Spacing entre campos**: body gap aumentado de 16px → 22px. Nombre y descripción ya respiran.
- **Estado lock UX — sin emojis** (Doug 19/05/2026):
  - Eliminado el `🔒` que se añadía como pseudo-element `::after` al label de campos bloqueados.
  - Eliminados los bloques `editq-field-wrap__lock-reason` que duplicaban el motivo del lock como texto debajo del input.
  - **Nuevo:** icono `?` circular naranja inline al final del label (`.editq-lock-icon` — 16×16, border 1.5px accent, cursor `help`). Al hover/focus muestra tooltip DS canónico con copy: **"Bloqueado: \<reason\>"**.
  - Inputs/dropdowns/datepickers/textarea bloqueados usan ahora los tokens DS Naowee de disabled (`--naowee-color-bg-disabled`, `--naowee-color-text-disabled`, `--naowee-color-border-disabled`) en lugar de un estilo custom.
- **Estado segment**: reemplazado el segment no-canónico por el pattern DS canónico (mismo que `.suid-segment` en `modal-suid.js`) — outline container con padding 3px, opt transparente, selected `orange-bg + accent` SIN shift visual.
- **Footer CTAs**: cambiaron de stretch (`flex:1`) a auto-width (`flex: 0 0 auto`), posicionados en lados opuestos vía `justify-content: space-between` — Cancelar pegado a la izquierda, Guardar cambios pegado a la derecha.

### Added
- **Historial de versiones accesible bajo `/project/vX.Y.Z/`** (Doug 19/05/2026). Cada release publicado vive permanentemente en su propia URL:
  - https://naowee-tech.github.io/naowee-test-digitacion/project/v2.0.1/index.html
  - Permite al dev team comparar UX entre versiones, validar regressions y reproducir bugs sobre versión específica
  - Snapshot generado vía `scripts/snapshot-version.sh vX.Y.Z` (rsync de `project/` excluyendo otras carpetas de versión y `scripts/`)
- **Version switcher en el footer** — el badge `Project vX.Y.Z` ahora es un dropdown que:
  - Lista todas las versiones publicadas (fetch en runtime desde `api.github.com/repos/.../releases`, cache sessionStorage 10 min)
  - Marca la versión activa con badge `Viendo` y la más reciente con badge `Latest`
  - Click en cualquier item navega al snapshot de esa versión (preservando el path actual: `/admin/dashboard.html` → `/v2.0.1/admin/dashboard.html`)
  - Footer del dropdown: link a "Ver todos los releases en GitHub"
  - Fallback elegante si la API falla (rate limit, offline)

### Release process (documentado)
A partir de v2.0.1, cada release sigue este flujo:
1. Bump `PROJECT_VERSION` constante en `shared/shell.js`
2. Bump cache buster de `shell.js` en todos los HTML que lo importen
3. Mover `[Unreleased]` → `[project-vX.Y.Z]` en este CHANGELOG con fecha y resumen de cambios
4. Commit + push de los cambios
5. Crear tag annotated: `git tag -a project-vX.Y.Z <commit> -m "..."` + push
6. Crear GitHub Release: `gh release create project-vX.Y.Z --notes "..."`
7. **Snapshot de la versión:** `./scripts/snapshot-version.sh vX.Y.Z` + `git add project/vX.Y.Z` + commit + push
8. Actualizar título del PR si aplica

### Refined — modal de edición rápida v3+ (rev finales)
- **Spacing vertical real con section wrappers**: el `gap: 22px` del body nunca aplicaba (el body solo tenía 1 hijo: el `<form>`). Refactor con `<section class="editq-section">` por bloque + flex anidado (form gap 28px entre sections, section gap 16px entre fields, title→field 12px efectivo).
- **Datepicker funcional**: bug pre-existente — el DS v1.8.0 requiere `.naowee-datepicker--open` para que el popover sea visible (opacity 0→1). `bindDatepickers` solo togglaba el atributo `hidden` → popover renderizaba pero invisible. Fix transversal: add/remove `--open` class en open/close/closePopover/outside-click.
- **Tooltip copy limpio**: removidos los em-dashes (`—`) de todos los tooltips y el prefijo "Bloqueado:" del `lockIcon` helper. Mensajes naturales sin verbo redundante.
- **? icon refinado**: SVG Lucide-style info outline (no más text-based "?"), 14px, margin-left 3px (más pegado al label). Asteriscos `*` de required ocultos en el modal scope.
- **Guardar deshabilitado sin cambios + toast en éxito**: dirty-tracking con `snapshotForm()` JSON post-prefill. Save button arranca `disabled`. Toast `naowee-message--positive` en esquina inferior derecha al guardar.
- **Card-view edit-btn fix**: bug — `bindEditButtons()` solo se llamaba desde `renderView()` (toggle), pero el cards view se renderiza inline en el initial load. Sin bind, los buttons heredaban el `onclick="fadeAndGo()"` del `<article>` padre → modal nunca abría. Fix: bind también post-initial-render.

### Fixed — datepicker UX + persist view preference
- **Month-selector "Mayo 2026" rectángulo gris**: el DS define el `<button>` sin background ni border explícitos → heredaba UA default. Fix transversal en pages.css: `background: transparent !important` + hover orange-bg.
- **Clear (×) siempre visible en datepicker idle**: el DS pone `display: flex` explícito en `.naowee-datepicker-field__clear` que sobrescribe el `hidden` attribute. Fix: `[hidden] { display: none !important }`.
- **Preferencia cards/list persistente**: `localStorage` con key `naowee-project-convocatorias-view`. Sticky entre refreshes y sesiones. View-toggle buttons dinámicos en HTML + handler guarda en cada cambio.
- **TDZ regression fix**: `renderView()` se llamaba antes de la declaración de `activeFilters` (const, no hoistea) → crashbomb silencioso. Llamada movida al final del script.

### Refined — wizard de creación de convocatoria
- **Eliminados campos innecesarios** del wizard admin: "Plazo posterior al cierre / Emisión de conceptos" (step 1) y "Fases del proyecto permitidas" (step 3). El proceso documental se hace de un solo, sin fasing.
- **2 multiSelect ya no required**: "Tipos de solicitud permitidos" y "Fuentes de financiación permitidas" pueden quedar vacíos como filtro abierto (default: todos los tipos/fuentes aceptados).

### Refined — demo-switcher (panel del DEMO chip)
- **Botones + chips migrados a DS canonical**: los 2 chips estáticos + botón "Saltar a modo libre" → un solo `.naowee-segment --small --proportional` interactivo (toggle directo con sliding pill). "Reiniciar tour" y "Reiniciar demo" → `.naowee-btn --mute --small`.
- **Scroll unificado**: cada `.demo-role-switcher__list` tenía su propio `overflow-y: auto` → cada sección scrolleaba independientemente. Fix: nuevo wrapper `.demo-role-switcher__scroll` envuelve todo el contenido scrollable, footer queda sticky.

### Refined — file-uploader multi-chip al pattern `--uploaded`
- Los chips de `Plantillas y anexos` (multi-file) tenían icono PDF rojo circular + border gris → inconsistente con los uploaders single-file (Acto admin / Términos) que usan el pattern canonical `--uploaded` (border verde 2px + shadow positive halo).
- Refactor: chip ahora con `background: surface blanca` + `border: 2px solid feedback-border-positive-loud` + `box-shadow: highlight-positive` + icono document outline.

### Refined — `proj-data` transversal (proyecto-perfil, proyecto-detalle, revisar-postulacion)
- Eliminado el campo "Fase" del wizard postular (`modal-postular.js`) — consistente con el wizard admin. Const `faseOptions` removida + persistencia + row del review step 5.
- `proj-data` spacing: row gap 18px→24px, dt→dd margin 4px→6px, dd font 13.5→14px.
- **Representante legal → avatar component canónico transversal** en 3 pages: avatar circular 28-36px con iniciales (color = `perfilMuni.color`) + nombre + cargo secundario. Reemplaza `<strong>nombre</strong>` + línea con "documento · cargo".

### Refined — modal de confirmación RBI con jerarquía y peso financiero
- Rediseño del data display del modal `¿Aprobar RBI de esta postulación?` en `revisor/revisar-postulacion.html`. Antes 3 rows planas (Proyecto/Radicado/Municipio) sin jerarquía.
- Nuevo summary card con hero (nombre + radicado pill + 📍 muni) + stats split (representante con avatar + monto solicitado verde 17px tabular).

### Refactored — `.naowee-confirm-summary` transversal en 4 modales de decisión
- Pattern promovido a `pages.css` como clase compartida y aplicado en:
  - `revisor/revisar-postulacion` (Aprobar RBI)
  - `revisor/doc-general` (Aprobar doc general)
  - `revisor/revisar-area` (Devolver + Aprobar área — 2 modales)
  - `admin/convocatoria-notificar` (Enviar / Reenviar notificación con stats grid `--triple` para reenvio)
- Modifiers `__stats--single` y `__stats--triple` para layouts de 1 o 3 columnas. 4 value variants (`-rep`, `-money`, `-count`, `-strong`).

### Fixed — green CTA focus glow + empty states con container DS
- El DS aplica `box-shadow: var(--naowee-shadow-focus-accent)` (3px halo naranja) en `.naowee-btn:focus-visible`. Los CTAs verdes (`btn-favorable`, `btn-aprobar`, `btn-aprobar-doc`) quedaban con halo naranja después del click. Override scoped: mantiene la elevation verde del CTA en focus-visible.
- Empty states de `doc-general` y `doc-tecnica` flotaban sin container → nuevo pattern `.naowee-page-empty` (card con border + radius + icon circular + title + msg) en pages.css.

### Refined — veredicto buttons (Cumple / No cumple / No aplica)
- Tooltips simplificados: `"Marcar como cumple"` → **`"Cumple"`** (mismo para los otros 2).
- Icon-only sin stroke: idle = icono en su color semántico (green/red/blue), hover = bg subtle del color, active = bg subtle + icono en **variant oscuro** (`#156d18` verde / `#8a1212` rojo / `#145b9c` azul).
- Aplicado en `revisor/doc-general` (`.dg-toggle__btn` con hover-reveal pattern) y `revisor/revisar-area` (`.ra-toggle__btn` refactor de segmented-control con text → 3 icon-only buttons).

### Fixed — strip lateral del `dt-area-card` confinado dentro del border-radius
- El strip vertical de status (green/orange/red) sobresalía del border-radius del card. Root cause: la card tiene `overflow: visible` (necesario para que el badge "Tu área" protruya), así que el strip absolutely-positioned con `top: 0; bottom: 0` se salía por los corners curvos.
- Fix transversal sin tocar `overflow`: strip ahora con `top: var(--radius-lg); bottom: var(--radius-lg)` para vivir dentro del safe zone. `border-radius: 99px` adicional le da pill-cap.

### Refined — cenefa edge-to-edge para revisión completada (`admin/proyecto-detalle`)
- Cuando el proyecto está en `concepto_favorable` o `en_inversion`, el mensaje "Revisión completada" ya no vive dentro del stepper card sino como **cenefa edge-to-edge** pegada al header (`.convo-status-cenefa--positive --top`). Mismo pattern que `convocatoria-detalle` y `proyecto-perfil`.
- Bonus: limpieza de un bug previo donde `__content + </div>` orfanos hacían aparecer el mensaje 2 veces.

### Fixed — botón Diligenciar al pattern ghost DS Naowee
- En `admin/inversion.html`, el botón "Diligenciar →" de la columna SUID usaba `.inversion-suid-cta` (clase custom que solo seteaba color, sin reset de background/border → heredaba UA defaults del `<button>` como un rectángulo gris).
- Migrado al pattern canónico `.naowee-btn --link --small` con SVG arrow inline. Clase custom eliminada de pages.css.

### Fixed — tabla `usuarios` al pattern canonico `naowee-table-card`
- El header gris no estaba separado de los bordes del card y sin border-radius en las esquinas inferiores. Overrides `margin-left/right: -32px` rompían el pattern pill canónico del DS.
- Fix: removidos los overrides que extendían el table-wrap edge-to-edge. El thead ahora aparece como pill flotante con 4 esquinas redondeadas inset del card, igual que las demás tablas del módulo.

### Refined — pull-quote oficial del certificado de favorabilidad
- El bloque `__obs` del certificado en `municipio/proyecto-perfil.html` era una simple card blanca con border gris → se sentía como comentario informal, no como cláusula formal de certificado.
- Redesign: dashed green border + double-frame (outline + outline-offset), Georgia serif italic center-aligned, decorative quote glyphs `❝ ❞` floating en las esquinas (56px verde 22% opacity).

---

## [project-v2.0.1] — 2026-05-19 · Patch UI/UX consolidado

> **Hito:** primer PATCH después del MVP. Consolida 16 commits de refinos UI/UX, fixes visuales y mejoras de flujo distribuidos en todos los perfiles.
> **Tag git:** `project-v2.0.1` · **Release:** [project-v2.0.1 — Patch UI/UX consolidado](https://github.com/naowee-tech/naowee-test-digitacion/releases/tag/project-v2.0.1)
> **Demo Pages:** https://naowee-tech.github.io/naowee-test-digitacion/project/index.html (badge `v2.0.1` visible en el footer)

### Fixed
- **`municipio/proyecto-perfil.html`** · layout del certificado: el card del certificado tenía 2 `</div>` faltantes (`__main` y `__top` quedaban abiertos), por lo que el `proj-tabs-card` se renderizaba como hermano de `__main` dentro de `__top` (flex container) y quedaba side-by-side con el certificado en lugar de debajo. Cierre estructural correcto: el certificado ahora ocupa el ancho completo del contenedor en el medio del layout, con la card de tabs (Datos / Historial / Conversación) apilada debajo.
- **`municipio/convocatorias.html`** · "NaN días para cerrar" cuando la convocatoria fue creada sin fechas válidas (admin saltó los datepickers en el wizard). Fix triple:
  - Nueva función `isValidDate()` que detecta Invalid Date (`!isNaN(dt.getTime())`).
  - `diasRestantes()` devuelve `null` cuando la fecha es inválida en vez de NaN.
  - `countdownLabel` muestra "Cerró hoy" + variant negative cuando `dias === null` (igual que cuando es <=0). Tanto en cards como en list.
  - `isPostulable()` retorna false cuando `apertura` o `cierre` son inválidas — CTA queda disabled con tooltip "Fechas de la convocatoria no definidas — contacta al Ministerio".
  - Meta `dl` (cards): muestra "Sin definir" en lugar de "— · 08:00 a.m." cuando la fecha falta.
  - Columna Cierre (list): muestra `<em>Sin definir</em>` cuando inválida.
  - **`shared/modal-convocatoria.js`** (defensive): el admin ya no persiste `''` para fechas vacías — ahora pasa por `(fd.get(x) || '').trim() || null`, dejando null explícito.
- **`municipio/convocatorias.html`** · list view: badge "Cerró hoy" estaba en `caution` (amarillo) en list y `negative` (rojo) en cards. Inconsistencia fija — list ahora también usa `negative` para "Cerró hoy" y agrega `negative` para `dias < 7` (consistente con el `countdownVariant` de cards).
- **`shared/modal-convocatoria.js`** · chips del file uploader multi-file (admin wizard): los chips verdes saturados (`green-bg + green-border + green text`) no pertenecían al lenguaje del DS Naowee. Refinados al pattern canónico — surface blanca + border-dark sutil + icon PDF rojo mini circular (consistente con `.convo-doc-chip` en municipio) + text-primary + close button neutral con hover red. Variante overflow `+N más` también refinada (neutral en lugar de naranja).

### Removed
- **Panel "Notificaciones para ti"** del dashboard del revisor (`revisor/dashboard.html`) — feedback de Doug: no aplica para todos los revisores. Se removieron HTML render, JS click handler, fetch de `allNotifs/misNotifs/misNotifsRecientes/misNotifsNoLeidas`, y todo el bloque CSS `.rev-notif-panel` (~120 líneas) en `pages.css`. La data de notificaciones per-revisor sigue persistiendo en `localStorage` (con `revisorId`) por si más adelante se reintroduce otra vista.

### Added
- **Descarga de documentos de convocatoria** en `municipio/convocatorias.html` — feedback Juanma: el municipio (ente departamental o municipal) debe poder ver y descargar los documentos que el Ministerio subió al crear la convocatoria (Acto administrativo, Términos de referencia, Anexos). Implementado:
  - Seed `CONV-2026-001` (única convocatoria abierta) ahora incluye `documentos: { actoAdmin, terminosRef, plantillas[] }` para que la demo muestre los descargables.
  - Cards (vista grilla): bloque "Documentos publicados por el Ministerio" con **chip cluster horizontal** (pattern wrap como `.convo-card__fuentes`), cada chip con icono PDF rojo + label + arrow download. Tooltip DS muestra filename + size completo. Counter `(N)` en el header. Compacto: 3-4 chips ocupan 1-2 líneas en vez de 4 rows.
  - Lista (vista tabla): nueva columna "Documentos" con iconos compactos de PDF (rojo) por doc + tooltip DS canónico, `+N` cuando hay >3.
  - Click en cualquier doc → snackbar `informative` con el nombre del archivo (no hay backend de archivos reales en la demo).
- **Columna "Apertura"** agregada a la tabla `dl` de la card de convocatoria — antes solo se mostraba "Cierre", ahora también la fecha de apertura para que el municipio vea la ventana completa.

### Changed
- **Gate de postulación por ventana de fechas** en `municipio/convocatorias.html` (feedback Juanma): aun si `estado === 'abierta'`, el municipio NO puede postular si la fecha actual está fuera del rango `apertura..cierre`. CTA "Postular" queda en estado disabled (DS Naowee) con tooltip explicativo (`Postulaciones abren el dd MMM` o `Postulaciones cerraron el dd MMM`). Nueva función `isPostulable(c)` + `razonNoPostulable(c)` en el render. Aplica a vista cards y lista.

### Added (cont.)
- **Selector de convocatoria DENTRO del wizard de postulación** (`shared/modal-postular.js`) — feedback Doug (rev 3): reemplaza el picker modal separado por un **dropdown como primer campo del paso 1** (más práctico que un modal extra).
  - Sección "Convocatoria asociada" al inicio del paso 1, con dropdown DS canónico que lista todas las convocatorias postulables (`isPostulableConv`: abierta + dentro de ventana).
  - Helper line bajo el dropdown: `Año XXXX · Cierra dd MMM · Tope $X` con valores en bold (reactivo al cambio del dropdown).
  - **Eliminado el banner azul `naowee-message--informative`** "Postulando a CONV-XXX" que era estático y redundante con el dropdown.
  - On change del dropdown: actualiza `conv` reference, subtitle del modal header, helper line y tope del campo "Monto solicitado". El submit final usa `conv.id` actualizado.
  - **Picker modal separado removido del flujo** — la función `openConvocatoriaPickerModal` queda como dead-code por backward-compat, no se invoca desde ningún lado.

### Fixed (cont.)
- **Download icon button → ghost button DS Naowee** transversal en `revisor/doc-general.html` (`.dg-item__download`) y `revisor/revisar-area.html` (`.ra-doc-pill__download`). Antes: outline con border + bg blanco + color text-secondary. Ahora: pattern ghost canónico DS — `border: 0`, `background: transparent`, `color: var(--accent)` (naranja), hover `background: var(--orange-bg)` sutil. Icon-only, sin transición de border ni color.
- **Alineación de badges** en `revisor/doc-general.html` — el download icon se desplazaba horizontalmente cuando cambiaba el ancho del badge (Cumple/N/A/No cumple/Sin verificar). Fix: nuevo `.dg-item__pill-slot` con `width: 140px + justify-content: flex-start`, envuelve la pill (modo read-only) o el toggle group (modo editable). Resultado: download icon en posición estable independiente del estado del badge; los pills siempre left-aligned dentro de su slot fijo.
- **Tooltip clipped en sidebar de docs** (`revisor/revisar-area.html`) — el tooltip DS canónico del botón download quedaba enmascarado dentro del card por dos `overflow: hidden` en cadena (`.ra-docs-card` y `.ra-docs-card__list`). El `overflow-y: auto` de la lista además clipea implícitamente el eje X (CSS quirk: cuando un eje es non-visible, el otro tampoco puede serlo). Fix: ambos contenedores migrados a `overflow: visible`. El crecimiento del listado se contiene con el patrón "Ver más" existente (no se necesita scroll interno).

### Refactored
- **Registro SUID rev2 — arquitectura 2 fases** (`shared/modal-suid.js`, Doug 17/05/2026): el wizard de 8 pasos plano se reemplazó por la arquitectura 2-fases del módulo de escenarios oficial:
  - **Fase A · Pre-validación** — 1 pantalla con datos básicos (nombre, depto, municipio, catastral, zona) + georreferenciación (mapa placeholder con grid + 2 CTAs cream "Marcar mi ubicación actual" / "Ubicarme en el mapa" + lat/lng + dirección). CTA `Validar y continuar` → inline success state (check verde + bullets) → "Continuar registro" abre Fase B
  - **Fase B · Datos del escenario** — sub-stepper de 3 pasos:
    1. *Información general* — propiedad/administración (entidad, tipo propietario/tenencia, responsable, contacto, `toggleSwitch` "¿Es proyecto de inversión?") + datos administrativos (`segmentControl` horario preset + `daySelector` L/M/M/J/V/S/D + `toggleSwitch` 24h + `timeField` apertura/cierre)
    2. *Escenario físico* — identificación (`toggleSwitch` CAR + `segmentControl` tipo infra + dropdowns) + dimensiones (áreas, aforo, cubierta, años, estado conservación)
    3. *Documentación* — disciplinas (`chipMulti`) + dotación + acceso + accesibilidad + programas + fotos (`datepicker` + 6 photo slots) + `fileUpload` soportes admin
  - **Nuevos helpers DS-aligned:** `toggleSwitch` (iOS-like switch con hidden input true/false), `segmentControl` (radio segmented), `chipMulti` (multi-toggle con check), `daySelector` (chips L/M/M/J/V/S/D), `mapPlaceholder` (grid SVG + pin + 2 CTAs cream), `timeField` (input type=time DS-wrapped)
  - **Routing inteligente:** `openSuidModal` lee `reg.prevalidacionEn` — si existe, salta directo a Fase B; si no, arranca por Fase A
  - **Persistencia preservada:** mismo `p.registroSuid` data shape + nuevos campos (entidadPropietaria, horarioPreset, esInversion, etc) + push notif admin + historial

### Refactored (legado)
- **Registro SUID del escenario deportivo (Res. 933 Art. 10)** — el formulario inline de 9 secciones (`admin/registro-suid.html`, 963 líneas) usaba componentes hardcoded (segments custom, chips custom, photo slots, textarea sin DS, type=date nativo, messages custom, sin stepper). Refactor completo replicando el patrón del wizard de escenarios oficial ([naowee-test-escenarios/escenario-08-dashboard.html](https://naowee-tech.github.io/naowee-test-escenarios/escenario-08-dashboard.html?mode=single)) con DS Naowee canonical:
  - **Nuevo `shared/modal-suid.js`** — modal wizard de 8 pasos:
    1. **Datos básicos** — catastral + zona (con `naowee-message --informative` de pre-validación y `--positive` cuando el catastral es único)
    2. **Georreferencia** — lat/lng con CTA "Usar coordenadas del proyecto" + dirección
    3. **Identificación deportiva** — segmentos (CAR Sí/No, tipo infra Recreativa/Alta competencia) + dropdowns (tipo infra general, tipo escenario)
    4. **Características físicas** — áreas/aforo con money mask + año/sub-espacios/pisos + estado conservación
    5. **Disciplinas** — chip multi-toggle (21 disciplinas catálogo nacional)
    6. **Dotación** — chip multi-toggle (servicios) + dropdown acceso + chip accesibilidad
    7. **Programas y fotografías** — textarea + multiselect programas Mindeporte + población + datepicker DS Naowee + grid de 6 photo slots
    8. **Administración** — responsable, contacto, horario, presupuesto operativo + `naowee-message --positive` "Listo para inventariar"
  - **Helpers locales DS-aligned:** `radioSegment()` (segmented control con hidden input) y `chipMulti()` (multi-toggle con check icon).
  - **Components canonical reutilizados:** `textfield`, `dropdown`, `multiselect`, `datepicker`, `fileUpload`, `textarea`, `naowee-message`, `naowee-stepper--pulse`, `naowee-modal--wide`.
  - **Persistencia preservada:** mismo data shape (`p.registroSuid`) + push notif admin + historial.
  - **Datepicker DS Naowee** ahora exportado desde `modal-convocatoria.js` (era función privada interna) para que `modal-suid.js` y futuros wizards lo reutilicen.
  - **`admin/registro-suid.html`** convertido a launcher de 100 líneas (era 963 de form inline) — abre el modal automáticamente, fallback empty-state con CTA reabrir si el user cierra sin completar (mismo patrón que `municipio/postular.html`).
  - **`admin/inversion.html`** — pill "Diligenciar SUID" en la tabla ahora abre el modal in-place (event delegation con `data-suid-modal`) en lugar de navegar a `registro-suid.html`. Tooltip DS canónico (`has-tooltip + data-tooltip`).

cache: `pages.css` → `20260517l` · `modal-postular.js` → `20260517n`

---

## [project-v2.0.0] — 2026-05-17 · MVP entregado a desarrollo

> **Hito:** Primera entrega formal end-to-end del módulo Project para los 3 perfiles (Admin · Municipio · Revisor). A partir de esta versión, todo cambio nuevo se incorpora vía PATCH (UI) o MINOR (sub-funcionalidades), siguiendo la política acordada.

**Documento de entrega:** [`ACTA-MVP-PROJECT-v1.0.md`](./ACTA-MVP-PROJECT-v1.0.md)
**Pull Request:** [#9](https://github.com/naowee-tech/naowee-test-digitacion/pull/9)
**Demo:** https://naowee-tech.github.io/naowee-test-digitacion/project/index.html

### Added
- **Estado de área `subsanada`** (nuevo en `ESTADOS_AREA`) — diferenciado de `pendiente` y `devuelto`. Permite al revisor re-evaluar tras subsanación del municipio sin quedar en read-only.
- **Sistema de notificaciones per-revisor** — cada notif incluye `revisorId`, `proyectoId`, `tipo` y `href` deep-link. Filtrado en `revisor/dashboard.html` por revisor activo.
- **Panel "Notificaciones para ti"** en dashboard del revisor — feed personal con badge de no-leídas, timestamp relativo, click marca como leída + navega al deep-link.
- **Smart accordion de subsanación** en modal `subsanar` — `<details>/<summary>` por observación, auto-progresión con smooth scroll, primera pendiente abierta por default.
- **Estado de "Listo para reenviar"** en cards de área dentro del modal subsanar (verde + check icon).
- **Cenefa edge-to-edge `--top`** patrón canónico DS para banners de estado contextual (variants: `--positive` `--caution` `--informative` `--neutral` `--negative`).
- **`.naowee-sla` utility transversal** (reemplaza 5 variantes custom de SLA pill scattered en el codebase).
- **`.has-tooltip` utility global** (reemplaza tooltips nativos `title=""` con tooltips DS Naowee con flecha).
- **Bento layout en `revisar-area.html`** — proyecto card full-width arriba + grid 70/30 (checklist | docs sidebar sticky).
- **Toggles icon-only hover-reveal** en `doc-general.html` — 34×34 cumple verde · no cumple rojo · n/a azul. Visibles en hover, persistentes en estado activo.
- **Re-asignación de áreas técnicas** desde `admin/proyecto-detalle.html` (DS ghost button con tooltip).
- **Highlight de documentos nuevos** en `revisar-area.html` cuando área en `subsanada` — bg azul + tag "NUEVO" inline + ordenados primero.
- **Owner badge "Tu área"** centrado top en cards de `doc-tecnica.html`.
- **File card refinado** en review readonly del subsanar — tile rojo PDF con extension text + corner fold + filename mono + meta + preview eye button.
- **Nota etiquetada** como "TU NOTA PARA EL REVISOR" eyebrow + quote glyph + texto destacado.
- **Snackbar vertical stacking** con exit sutil del anterior.
- **`ACTA-MVP-PROJECT-v1.0.md`** — documento PM-ready con 19 historias de usuario entregadas + 8 sugeridas para v2.x.
- **`CHANGELOG.md`** — este archivo.

### Changed
- **Documento mandatorio + nota opcional** en wizard subsanar (antes era inverso). Gate del CTA "Marcar como subsanada" ahora es `input[type=file]` con archivos.
- **Persistence threshold** del subsanar — antes `textarea.length >= 10`, ahora la clase `.subs-obs-item--done` (set explícito por el user).
- **Banner devolución a subsanación** en `municipio/proyecto-perfil.html` migrado de `naowee-message` inline a `convo-status-cenefa --caution --top`.
- **Badge "X/Y pend."** en `revisor/bandeja.html` migrado a `naowee-badge` canónico DS con variants semánticos.
- **Botones Delegar/Revisar** en `doc-tecnica.html` migrados a `naowee-btn--mute/--quiet --small` DS.
- **Avatares de revisores** unificados — `ProjectData.getRevisor(revisorId)` para `r.color` y `r.avatar` consistente cross-página.
- **Card de proyecto en `revisar-area.html`** estilo card normal (sin shadow, border gris) + sin dividers entre doc pills.
- **Header de cards `.naowee-card__header`** column-stack (title + subtitle vertical) con divider edge-to-edge.
- **Padding interno de tablas** dentro de cards (top + lateral + bottom breathing room).
- **Disabled state** del CTA "Marcar como subsanada" usa tokens DS oficiales (`--naowee-color-text-disabled`, `--naowee-color-bg-disabled`) en lugar de hardcoded `#c9c9d1`.
- **Check del num-circle** centrado óptica y geométricamente (forzado `inline-flex` + `display:block` en svg).

### Removed
- **Botón "Subsanar" del top hero** en `municipio/proyecto-perfil.html` — el CTA ahora vive en la cenefa edge-to-edge para evitar redundancia.
- **CTA azul "Actualizar respuesta"** del smart accordion — el CTA verde "Marcar como subsanada" se mantiene al reabrir un item done (sin variant azul).
- **Cita naranja del detalle** bajo summary del accordion — era redundante con el title del summary.
- **Card "Notificaciones a municipios"** en `admin/convocatoria-detalle.html` — redundancia con la sección de notificaciones global.

### Fixed
- **Modal CTAs** del subsanar — banner devolución y CTA hero del proyecto ahora lanzan correctamente el modal vía event delegation.
- **`${targetId}` ReferenceError** en `municipio/dashboard.html` — template literal evaluaba todas las branches; replaced con regex parser dentro de IIFE.
- **Codemod damage** orphan markup — fragmentos `</div>X" stroke-linecap=` en `proyecto-perfil.html` y `doc-tecnica.html`.
- **Empty state left-aligned** — `panel-head` faltante de `</div></div>` causaba que `panel-card__body` se anidara dentro de header flex.
- **Divider edge-to-edge en `.naowee-card__header`** — DS CDN aplicaba padding al `.naowee-card`. Fixed con `:has()` selector override.
- **`municipio/dashboard.html` y `revisor/dashboard.html`** force-add — estaban siendo ignorados por regla `dashboard.html` no anclada en `.gitignore` padre.
- **Tu área badge overlap** con Pendiente — repositioned a `top: -10px; left: 50%; translateX(-50%)` + `overflow: visible` en card.

### Performance / DX
- **CSS `:has()` selector** para overrides scopeados sobre el DS CDN sin tocar el bundle externo.
- **Cache busters** en CSS y JS module imports (`?v=YYYYMMDDx`) bumped a `20260517e`.
- **Migración limpia** del esquema `localStorage` v9 — sin breaking del state antiguo.

---

## [project-v1.1.0] — 2026-05-13 · Flujo de postulación completa + prórroga RBI

> **Cambio mayor de flujo aprobado por Danna Arrieta (13/05/2026)**

### Changed
- **Flujo de postulación** — antes el municipio postulaba RBI primero, luego subía anexos técnicos en etapa documental aparte. Ahora postula el proyecto completo en un solo wizard.
- **Modelo de revisión secuencial:** RBI → (Doc General + 6 áreas técnicas en paralelo) → Concepto favorable.
- **Equipo revisor v2.0** — 6 personas: 1 RBI + 1 Doc General + 4 Técnicos (cubren 8 áreas en pares).

### Added
- **Sistema de prórroga RBI** — municipio solicita extensión, admin aprueba/rechaza, SLA se extiende automáticamente.
- **Estados de postulación expandidos** — `en_revision_rbi`, `rbi_aprobada`, `en_revision_docs`, `concepto_favorable`, `en_inversion`.
- **Catálogo de áreas técnicas (Res. 933 Art. 3)** — 6 áreas con items canónicos.

---

## [project-v1.0.0] — 2026-05-08 · Versión inicial del módulo

### Added
- 3 perfiles base (Admin · Municipio · Revisor) con dashboards y shells.
- Listados de convocatorias, proyectos, postulaciones.
- Wizard de postulación (versión inicial).
- Estados de postulación (versión simplificada).
- LocalStorage backend con SEED_FREE / SEED_GUIDED.
- Naowee DS v1.8.0 integrado vía CDN.

---

## Política de futuros releases (post-MVP)

### Patches `v2.0.x` — UI fixes
Cambios visuales menores, ajustes de spacing, color, tipografía, fixes de bugs visuales conocidos (BUG-V01..V03 del ACTA).

### Minor `v2.1.0+` — Sub-funcionalidades
Mejoras internas, nuevas variantes de componentes existentes, optimizaciones de UX dentro de flujos ya implementados, integraciones secundarias.

**Ejemplos del backlog del ACTA que serían MINOR:**
- HU-F03 — Dashboard con métricas agregadas del bienio
- HU-F04 — Filtrar bandeja por área + estado
- HU-F07 — Vista de auditoría con timeline completo
- A11Y-01 — Audit completo WCAG 2.2 AA

### Major `v3.0.0+` — Funcionalidades top-level / breaking
Reservado para cambios que rompan compatibilidad del modelo de datos, nuevas máquinas de estado, integraciones a backend real (no localStorage), o nuevos perfiles del sistema.

**Ejemplos que justificarían MAJOR:**
- HU-F05 — Migración a backend real con notif por email
- Reemplazo de localStorage por API REST
- Adición de un cuarto perfil (ej. interventoría / contratista)

---

**Mantenido por el equipo de producto Naowee.**
*Para registrar nuevos cambios: agregar entrada arriba del último release con la fecha y el tipo de cambio (Added / Changed / Removed / Fixed).*
