# ACTA DE ENTREGA — Módulo Project v2.0

> **Naowee · Ministerio del Deporte de Colombia**
> Digitalización del flujo de inversión en infraestructura deportiva
> **Marco normativo:** Resolución 933 de 2024 · Ley 181 de 1995
> **Continuación de** `ACTA-MVP-PROJECT-v1.0.md` — solo cubre lo nuevo / refinado en el ciclo v2.0.x

---

## 0 · Información de la entrega

| Campo | Valor |
|---|---|
| Producto | **Naowee Project** — módulo de gestión de proyectos de inversión |
| Versión oficial | **`project-v2.0.2`** · 2 PATCH releases consolidados desde MVP |
| Fecha de corte | 19 mayo 2026 |
| Branch | `project/refinements-validation-suite` |
| Tags git | `project-v2.0.1` · `project-v2.0.2` |
| Pull Request | [#9 — naowee-tech/naowee-test-digitacion](https://github.com/naowee-tech/naowee-test-digitacion/pull/9) |
| Demo Pages (última) | https://naowee-tech.github.io/naowee-test-digitacion/project/index.html |
| Demo Pages (histórico) | `/project/v2.0.1/` · `/project/v2.0.2/` — cada release en su URL |
| Demo local | `http://localhost:4700/index.html` |
| Stack técnico | HTML + CSS + JS vanilla · Naowee DS v1.8.0 (CDN) · LocalStorage backend |
| Documento base | [`ACTA-MVP-PROJECT-v1.0.md`](./ACTA-MVP-PROJECT-v1.0.md) (capacidades MVP) |
| Detalle técnico | [`CHANGELOG.md`](./CHANGELOG.md) (40+ commits documentados) |

> **Versionado** (acordado con Doug 17/05/2026):
> - `v2.0.0` MVP entregada a desarrollo
> - Cambios **UI / UX** → **PATCH** (`v2.0.x`) ← *este ciclo*
> - **Sub-funcionalidades / mejoras internas** → **MINOR** (`v2.x.0`)
> - **Nuevas funcionalidades top-level / breaking changes** → **MAJOR** (`v3.0.0+`)
>
> Este ciclo (v2.0.0 → v2.0.2) consolidó **40+ commits** de refinements visuales, fixes UX, migración de componentes custom al DS canónico, y nueva infraestructura de versionamiento. **Sin breaking changes**, sin nuevas features top-level, sin cambios al modelo de datos ni al flujo end-to-end.

---

## 1 · Resumen ejecutivo

El v1.0 entregó el **flujo end-to-end completo** (admin crea → municipio postula → revisores aprueban → admin activa inversión). El v2.0 **NO cambia el flujo** — refina la experiencia para que sea production-ready y consistente con el DS Naowee.

**3 grandes ejes del v2.0:**

1. **Capacidad nueva**: edición rápida de convocatoria post-publicación (con business rules de seguridad para no romper postulaciones en curso).
2. **Infraestructura nueva**: versionamiento canónico con snapshots históricos por release (cada versión vive bajo `/project/vX.Y.Z/`), version switcher en el footer de la demo.
3. **Calidad transversal**: 40+ fixes y refinements UX/UI que afectan TODAS las pantallas — toolbars, tabs, modales, ghost buttons, empty states, hover states, focus rings, spacing, copy.

```
v1.0 (MVP)           →    v2.0 (Production-ready demo)
─────────────────────     ──────────────────────────────
Flujo E2E funcional       Mismo flujo + edición de convocatoria
Estados consistentes      Estados consistentes + business rules per-campo
Componentes mixtos        Migración masiva a DS Naowee canónico
Sin versionamiento        Snapshots /vX.Y.Z/ + dropdown switcher
Per-pantalla CSS          Patterns transversales extraídos
```

---

## 2 · Capacidad nueva — edición de convocatoria post-publicación

### 2.1 Contexto del problema

El v1.0 permitía crear convocatorias pero no editarlas. Si el admin tipeaba mal un nombre, una fecha o un presupuesto, no había forma de corregirlo sin borrar y recrear (lo que es destructivo y rompe la auditoría).

### 2.2 Solución: `openEditarConvocatoriaQuick`

**Trigger:** botón "lápiz" en cada card / row de la tabla de convocatorias (`admin/convocatorias.html`).
**Modal:** wizard de 1 paso (no es flujo multi-step — es edición rápida).

### 2.3 Business rules implementadas (function `getEditPolicy`)

| Campo | Editable cuando | Razón |
|---|---|---|
| Nombre, descripción | Siempre (excepto si cerrada) | Texto, no afecta postulaciones |
| Apertura | Solo si la fecha NO ha pasado | Reescribir el pasado rompe auditoría |
| Cierre | Solo extender (no acortar al pasado) | Acortar perjudica municipios en curso |
| Presupuesto total | Solo aumentar si hay postulaciones | Reducir comprometería plata ya asignada |
| Tope por proyecto | Solo si NO hay postulaciones | Cambia la regla del juego para quien postuló |
| Estado | Abierta ↔ Cerrada (1 vía) | Una vez cerrada no se reabre |
| Convocatoria cerrada | NADA es editable | Read-only mode total |

**UX:** cada campo bloqueado muestra un icono `?` outline naranja al lado del label con tooltip explicando el motivo del lock. Inputs locked usan los tokens DS de disabled. Sin emojis 🔒.

### 2.4 Dirty tracking
- Guardar Cambios arranca **disabled**
- Snapshot del form como JSON post-prefill
- Cualquier cambio (input, change, segment toggle, datepicker pick) activa el botón
- Save → toast `positive` en esquina inferior derecha con resumen ("Se actualizó: nombre" o "Se actualizaron 3 campos: nombre, apertura, presupuesto")

### 2.5 Historial automático
Cada edición agrega un evento al historial del proyecto con la lista de campos modificados + contador de postulaciones afectadas (si las hay).

---

## 3 · Infraestructura nueva — versionamiento canónico

### 3.1 Snapshots históricos
Cada release publicado vive permanentemente en su propia URL bajo `/project/vX.Y.Z/`:
- https://naowee-tech.github.io/naowee-test-digitacion/project/v2.0.1/index.html
- https://naowee-tech.github.io/naowee-test-digitacion/project/v2.0.2/index.html

Permite al dev team:
- Comparar UX entre versiones lado a lado
- Validar regressions sobre una versión específica
- Reproducir bugs reportados con la versión exacta

### 3.2 Script de snapshot
`scripts/snapshot-version.sh vX.Y.Z` — usa `rsync` para copiar `project/` excluyendo otras carpetas de versión + scripts/.

### 3.3 Version switcher en el footer
- El badge `Project vX.Y.Z` en el footer (todas las pantallas) ahora es un dropdown
- Lista todas las versiones publicadas (fetch en runtime desde `api.github.com/repos/.../releases`, cache sessionStorage 10 min)
- Marca la versión activa con badge `Viendo` y la más reciente con `Latest`
- Click en cualquier item navega al snapshot preservando el path (`/admin/dashboard.html` → `/v2.0.1/admin/dashboard.html`)
- Footer del dropdown: link a "Ver todos los releases en GitHub"

### 3.4 Playbook de release (`RELEASE-PROCESS.md`)
9 pasos documentados para que cualquiera del team pueda sacar un release nuevo. Plus template Slack para anunciar al dev team.

---

## 4 · Mapa de cambios por pantalla (12 pantallas tocadas)

### 4.1 Admin

| Pantalla | Cambios v2.0 |
|---|---|
| `dashboard.html` | (sin cambios funcionales) |
| `convocatorias.html` | **Nuevo:** edit-btn por card + por row con modal de edición rápida. **Persistencia:** preferencia cards/list en `localStorage`. **Fix:** card-view edit-btn ahora abre el modal (bug pre-existente). |
| `convocatoria-detalle.html` | (sin cambios funcionales) |
| `convocatoria-notificar.html` | Modal confirmar envío rediseñado con summary card (stats `--triple` para reenvío) |
| `proyectos.html` | (sin cambios funcionales) |
| `proyecto-detalle.html` | **Nuevo:** cenefa edge-to-edge "Revisión completada" cuando concepto favorable emitido. **Refined:** spacing transversal `proj-data` + avatar canónico para representante. **Fix:** null-guard tabs binding (root cause de bug "Activar inversión no hacía nada"). |
| `inversion.html` | Botón "Diligenciar →" migrado a ghost canónico (antes tenía estilos UA default) |
| `inversion-crear.html` | (sin cambios) |
| `prorrogas.html` | (sin cambios) |
| `usuarios.html` | Tabla refactorizada al pattern canónico `naowee-table-card` (header pill con 4 esquinas redondeadas) |
| `registro-suid.html` | (sin cambios) |

### 4.2 Municipio

| Pantalla | Cambios v2.0 |
|---|---|
| `dashboard.html` | (sin cambios funcionales) |
| `convocatorias.html` | (sin cambios funcionales) |
| `convocatoria-detalle.html` | (sin cambios funcionales) |
| `postular.html` | Wizard step 1: campo "Fase" eliminado (proceso documental sin fasing) |
| `proyectos.html` | (sin cambios funcionales) |
| `proyecto-perfil.html` | **Refined:** spacing transversal en datos del proyecto + avatar canónico para representante legal. **Refined:** pull-quote oficial del certificado de favorabilidad (Georgia serif + ❝ ❞ decorativos). Campo Fase eliminado de la tabla. |
| `etapa-documental.html` | (sin cambios funcionales) |
| `prorroga.html` | (sin cambios) |

### 4.3 Revisor

| Pantalla | Cambios v2.0 |
|---|---|
| `dashboard.html` | **Fix:** markup bug en "Tus áreas próximas a vencer" (tabla no full-width). State filter incluye `en_revision_docs`. |
| `bandeja.html` | **Fix:** "Limpiar filtros" del empty state ya no se corta (min-height insuficiente) |
| `revisar-postulacion.html` | **Rediseñado:** modal "Aprobar RBI" con summary card jerárquica (proyecto + radicado + 📍 muni + representante con avatar + monto solicitado verde). Modal "Solicitar prórroga RBI" migrado a header canónico DS con X close. |
| `doc-general.html` | **Empty state** con container DS (antes flotaba sin card). **Veredicto buttons** icon-only sin stroke + dark active. **Buttons siempre visibles** (no hover-reveal — consistente con revisar-area). **Read-only mode** para revisores que no son Doc General (badge "🔒 Solo lectura · Esperando decisión de [avatar] Luis Felipe"). State filter incluye `en_revision_docs`. |
| `doc-tecnica.html` | **Empty state** con container DS. **Fix:** strip lateral del card confinado dentro del border-radius. State filter incluye `en_revision_docs`. |
| `revisar-area.html` | **Modales devolver/aprobar** con summary card transversal. **Veredicto buttons** refactorizados de segmented control con text → 3 icon-only buttons. |
| `concepto.html` | **Fix:** padding bottom de `.proj-tab-panel--flush` (hover de la última row pegado al borde). State filter incluye `en_revision_docs`. |

---

## 5 · Patterns transversales nuevos (extraídos a `pages.css`)

Estos patterns nacieron en v2.0 como respuesta a duplicación cross-pantalla y son reutilizables para futuras features:

| Pattern | Clase / helper | Usado en |
|---|---|---|
| **Avatar de persona** con color del rol | `.proj-data__rep` (avatar circular + nombre + cargo) | `municipio/proyecto-perfil`, `admin/proyecto-detalle`, `revisor/revisar-postulacion` |
| **Summary card** para modales de decisión | `.naowee-confirm-summary` (header + meta + stats grid 1/2/3 cols) | 4 modales: aprobar RBI, doc general, revisar área (devolver + aprobar), enviar notificación |
| **Empty state de página** con container DS | `.naowee-page-empty` (card + icon circular + title + msg) | `doc-general`, `doc-tecnica` |
| **Body-portal tooltip** | `initHasTooltipPortal()` en `shell.js` + `.naowee-tip-portal` | Cualquier `.has-tooltip` del módulo (escapa overflow ancestors) |
| **Icono `?` outline** para help/lock | `.editq-help-icon` con SVG info Lucide-style | Edit modal de convocatoria (lockIcon + infoIcon helpers) |
| **Help icon `?` naranja en label** | Aplicado a campos lockeados/restringidos | Solo modal de edición por ahora — patrón aplicable a futuros forms |

---

## 6 · Migración masiva a DS Naowee canónico

El v2.0 reemplazó componentes custom por sus equivalentes del DS oficial:

| Componente custom (v1.0) | DS canónico (v2.0) | Beneficio |
|---|---|---|
| `.editq-segment` (estado convocatoria) | `.naowee-segment --small` con sliding pill | Consistencia con otros segments del DS |
| `.demo-mode-row__chip` + button | `.naowee-segment --small --proportional` interactivo | Toggle directo sin botón redundante |
| `.demo-reset-btn` custom | `.naowee-btn --mute --small` | Estilos hover/focus DS |
| `.inversion-suid-cta` custom | `.naowee-btn --link --small` con SVG arrow | Sin UA defaults raros |
| `.subs-review__file-preview` outline | Ghost icon-only canónico | Match con `.convo-edit-btn`, `.dg-item__download` |
| `.dg-toggle__btn` con stroke + rectangle | Icon-only sin stroke, color semántico, dark active | UX más limpia y consistente con `.ra-toggle__btn` |
| `.ra-toggle__btn` segmented + text | Icon-only sin stroke (mismo pattern que dg) | Consistencia cross-pantalla |
| File-uploader multi-chips rojos | Pattern DS `--uploaded` (verde outline) | Consistente con uploaders single-file |
| Email-style copy con em-dashes (`—`) | Comas y puntos | Lenguaje natural sin tipografía forzada |
| Tooltips con prefijo "Bloqueado:" | Texto directo sin prefijo redundante | Less wordy, más claro |

---

## 7 · Bug fixes notables (los que el PM debe saber)

| Bug | Síntoma | Root cause | Fix |
|---|---|---|---|
| **Activar inversión no hacía nada** | Click en botón sin respuesta | `TypeError: Cannot read properties of null` en línea de tabs binding mataba todo el script downstream — el handler del botón nunca se enlazaba | Null-guard + scoped query `#pageContent .naowee-tabs` |
| **Doc-general no mostraba proyectos aprobados** | Tras aprobar RBI, el proyecto no aparecía | Mismatch de estados: `revisar-postulacion` setea `en_revision_docs` (canónico nuevo) pero 5 filtros leían `etapa_documental` (alias legacy) | Filtros aceptan ambos estados (transversal) |
| **Datepicker no se abría** | Click sobre el field sin respuesta | DS v1.8.0 requiere `.naowee-datepicker--open` para opacity 0→1, `bindDatepickers` solo togglaba `hidden` | Add/remove `--open` class en open/close |
| **Card-view edit-btn navegaba al detalle** | En vez de abrir modal | `bindEditButtons()` solo se llamaba desde `renderView()` pero el cards view se renderiza inline en initial load | `bindEditButtons()` también post-initial-render |
| **Tabla de doc-general clipeaba tooltip** | Tooltip "Editar convocatoria" no aparecía en la tabla | `.naowee-table-card__table-wrap` con `overflow-x: auto` clipea ambos ejes | Body-portal tooltip transversal con `position: fixed` |
| **Botón "Limpiar filtros" cortado** | En empty state de bandeja revisor | `min-height: 240px` del wrap insuficiente para contenido (icon + title + msg + btn = 246px) | `min-height: 360px` |
| **Buttons verdes con halo naranja** | Después de click, focus-visible dejaba ring naranja sobre el verde | DS aplica `--naowee-shadow-focus-accent` (orange halo) en `:focus-visible` | Override scoped para `.btn-favorable`, `.btn-aprobar*` |
| **Strip lateral del card se salía** | Strip verde se extendía fuera del border-radius | Card tenía `overflow: visible` para badge protrudido; strip square corners pasaban del curvo | `top/bottom: var(--radius-lg)` + `border-radius: 99px` |
| **Hover de última row pegado al borde** | En tabs con tabla, hover tocaba el borde inferior | `.proj-tab-panel--flush` con `padding-bottom: 0` | `padding: 16px 28px` simétrico |
| **Inner shadow naranja persistente en botones** | Click + hover dejaba halo de focus | DS aplica `box-shadow: 0 0 0 3px rgba(accent, .15)` en `:focus-visible` | Override por componente para usar hover state como focus visual |

---

## 8 · Stories para el PM / PO

### 8.1 Épicas entregadas v2.0

#### Épica · Edición de convocatoria (NUEVA)
- **HU-A06** — Como Admin quiero editar el nombre, descripción, fechas y presupuesto de una convocatoria publicada, con un wizard que respete las reglas de negocio (no reescribir el pasado, no perjudicar postulaciones en curso). ✅ `openEditarConvocatoriaQuick`
- **HU-A07** — Como Admin quiero ver claramente qué campos puedo editar y por qué los bloqueados están bloqueados, con un icono `?` outline que muestre el motivo al hover. ✅ `lockIcon` + `infoIcon` helpers
- **HU-A08** — Como Admin quiero que el botón Guardar arranque deshabilitado y solo se active cuando hay cambios reales, para evitar saves vacíos. ✅ dirty-tracking con snapshot del form
- **HU-A09** — Como Admin quiero recibir feedback visual (toast positivo en esquina inferior derecha) confirmando qué campos se actualizaron. ✅ `toast()` con resumen específico

#### Épica · Versionamiento histórico (NUEVA)
- **HU-DX01** — Como dev del team de Naowee quiero ver el historial completo de versiones del módulo Project con cambios documentados, para hacer trazabilidad de regressions. ✅ `CHANGELOG.md` + snapshots `/project/vX.Y.Z/`
- **HU-DX02** — Como stakeholder quiero comparar visualmente dos versiones del módulo (ej. v1.0 vs v2.0) lado a lado, para validar el progreso. ✅ snapshots accesibles vía URL
- **HU-DX03** — Como usuario de la demo quiero ver en qué versión estoy y poder cambiar entre versiones desde el footer, para auditoría rápida. ✅ Version switcher dropdown

#### Épica · Refinements transversales (consolidación UX)
- **HU-UX01** — Como usuario quiero que TODOS los modales de decisión muestren la misma información estructurada (qué proyecto, código, ubicación, quién aprobará, monto involucrado) para que la decisión sea informada. ✅ `.naowee-confirm-summary` en 4 modales
- **HU-UX02** — Como usuario quiero que los empty states (sin proyectos, sin resultados) vivan dentro de un card visual claro, no flotando sueltos en la página. ✅ `.naowee-page-empty` + `.table-empty` con container
- **HU-UX03** — Como usuario quiero que los tooltips informativos sean siempre visibles (no clipeados por contenedores con scroll), accesibles por teclado, y desaparezcan al hacer scroll/click. ✅ Body-portal tooltip transversal
- **HU-UX04** — Como revisor quiero que los buttons de veredicto (cumple / no cumple / no aplica) siempre estén visibles para que cambiar mi decisión sea descubrible, no solo al hacer hover. ✅ Removido hover-reveal en doc-general

#### Épica · Read-only mode por RBAC
- **HU-RBAC01** — Como revisor que no soy el assignee de un área, quiero ver el checklist en modo solo lectura con un badge claro indicando quién sí puede decidir, para entender el gate. ✅ Read-only mode en doc-general
- **HU-RBAC02** — Como revisor RBI quiero entrar a doc-general y ver el avance del proyecto que aprobé, pero sin poder marcar items (eso lo hace el revisor general). ✅ Items + buttons gated por `esRevisorGeneral`

### 8.2 Backlog post-v2.0.x (sugeridos para v2.1.0+)

#### MINOR pendientes (v2.1.0 — sub-funcionalidades)

- **HU-M07** — Como Municipio quiero descargar la convocatoria completa (incluidos los documentos adjuntos del admin) en un ZIP para mi archivo. _Pendiente: API de zip + backend de archivos._
- **HU-A10** — Como Admin quiero un dashboard con métricas agregadas del bienio (proyectos por estado, presupuesto comprometido, tiempos promedio de revisión, top 10 municipios más activos). _Pendiente: agregaciones._
- **HU-R06** — Como Revisor quiero exportar el concepto técnico de un área aprobada como PDF firmable (con firma digital del revisor + fecha + código de verificación). _Pendiente: integración con firma digital._
- **HU-R07** — Como Revisor quiero filtrar mi bandeja por área técnica + estado + SLA crítico, para priorizar mejor. _Pendiente: UI de filtros._
- **HU-R08** — Como Revisor quiero re-asignar un área a otro miembro del equipo (cubrir vacaciones), con justificación + notificación automática al re-assignee. _Pendiente: API + UI de delegación._
- **HU-S07** — Como Municipio quiero recibir email (no solo notificación in-app) cuando mi proyecto cambia de estado, con deep-link al detalle. _Pendiente: SMTP backend._

#### MAJOR pendientes (v3.0.0 — nuevas funcionalidades top-level)

- **HU-EV01** — **Sistema de evaluación con scoring** — el revisor puede dar puntaje por ítem (0-5) en lugar de solo cumple/no cumple, y el sistema calcula un score global del proyecto. _Cambia el modelo de datos._
- **HU-CO01** — **Comparador de proyectos** — el admin puede seleccionar 2-5 proyectos de una convocatoria y verlos side-by-side para tomar decisión de priorización presupuestal. _Nueva vista._
- **HU-AU01** — **Vista de auditoría** con timeline completo por proyecto (cada cambio de estado, cada subsanación, cada decisión con autor + timestamp + diff). _Requires backend audit log._
- **HU-MO01** — **App móvil nativa para revisores** — versión iOS/Android del flow de revisión (los revisores hacen visitas en campo). _Nuevo stack._

#### Bugs visuales conocidos (heredados de v1.0)
- **BUG-V01** — Breakpoints intermedios (601-899px) muestran overflow horizontal en doc-general
- **BUG-V02** — Stepper en mobile no rota a vertical (queda apretado horizontalmente)
- **BUG-V03** — Confetti del success screen no respeta `prefers-reduced-motion`

#### Mejoras de accesibilidad (heredados de v1.0)
- **A11Y-01** — Audit completo WCAG 2.2 AA con focus visible en todos los componentes interactivos
- **A11Y-02** — Live regions para anuncios de cambios de estado (toasts, snackbars)
- **A11Y-03** — Navegación por teclado completa en el smart accordion (flechas)
- **A11Y-04** — Reducir motion (animaciones del segment pill, cenefa, modal scaleIn) cuando `prefers-reduced-motion: reduce`

---

## 9 · Cómo correr la demo v2.0.2

### 9.1 Servidor local
```bash
# Desde la raíz del repo
cd .claude/worktrees/funny-leakey-205859
node -e "$(cat .claude/launch.json | jq -r '.configurations[] | select(.name=="project-preview") | .runtimeArgs[1]')"
# Abre http://localhost:4700/index.html
```

### 9.2 Snapshot histórico
- v1.0: https://naowee-tech.github.io/naowee-test-digitacion/project/v2.0.0/index.html (= MVP — sin sufijo de PATCH en v1.0)
- v2.0.1: https://naowee-tech.github.io/naowee-test-digitacion/project/v2.0.1/index.html
- v2.0.2: https://naowee-tech.github.io/naowee-test-digitacion/project/v2.0.2/index.html

### 9.3 Demo flows nuevos para mostrar a stakeholders

| Demo | URL | Personaje | Qué se está mostrando |
|---|---|---|---|
| **Editar convocatoria** (lápiz) | `/admin/convocatorias.html` → click lápiz | Andrea Rodríguez | Modal de edición con campos bloqueados según business rules + toast en save |
| **Versionar releases** | Cualquier pantalla → footer dropdown `Project vX.Y.Z` | Cualquiera | Navegar entre snapshots históricos |
| **Modal RBI con summary** | `/revisor/revisar-postulacion.html?id=PROJ-2026-001` → Aprobar | Diana Patricia | Card con avatar + monto verde |
| **Read-only mode en doc-general** | `/revisor/doc-general.html?id=PROJ-2026-001` (estando como Diana RBI) | Diana Patricia | Badge "Solo lectura · Esperando decisión de Luis Felipe" |
| **Veredicto icon-only** | `/revisor/doc-general.html?id=PROJ-2026-001` (estando como Luis Felipe) | Luis Felipe Rondón | Click cumple → verde oscuro con bg subtle, los otros 2 siguen visibles |
| **Cenefa edge-to-edge "Revisión completada"** | `/admin/proyecto-detalle.html?id=PROJ-2026-001` | Andrea Rodríguez | Banner verde sticky arriba del back-btn |
| **Avatar de representante legal** | `/municipio/proyecto-perfil.html?id=PROJ-2026-001` | Carlos Mosquera | Avatar circular azul "CM" + nombre + cargo |
| **Pull-quote certificado** | Mismo URL anterior (proyecto con concepto favorable) | Carlos Mosquera | Card del certificado con quote glyphs ❝ ❞ y border verde dashed |

### 9.4 Probar Modal de edición end-to-end

1. Demo en modo `guided` desde admin/dashboard
2. Click "+ Nueva convocatoria" → completar wizard → guardar
3. Volver a `admin/convocatorias.html`
4. Click el lápiz junto a la convocatoria recién creada
5. Cambiar el nombre o el presupuesto → ver el botón "Guardar cambios" activarse
6. Save → toast en esquina inferior derecha confirmando el cambio
7. Refrescar página → el cambio persiste

---

## 10 · Métricas del ciclo v2.0

| Métrica | Valor |
|---|---|
| Commits desde v1.0 | 40+ |
| Releases publicados | 2 (`project-v2.0.1`, `project-v2.0.2`) |
| Snapshots históricos | 2 |
| Pantallas tocadas | 12 (de 28 totales) |
| Patterns transversales nuevos | 6 |
| Componentes custom migrados a DS | 10 |
| Bugs fixados (notables) | 10+ |
| Breaking changes | 0 |
| Cambios al modelo de datos | 0 |
| Cambios al flujo end-to-end | 0 |

---

## 11 · Compromiso de calidad v2.0

- ✅ Flujo end-to-end probado (mismo cobertura que v1.0)
- ✅ Sin errores de consola en navegación normal (verificado en proyecto-detalle tras el null-guard fix)
- ✅ Persistencia funcional en `localStorage` (sin cambios al esquema)
- ✅ Cache busters incrementados sistemáticamente (`shell.js c→e`, `pages.css c→o`, etc.)
- ✅ Patterns transversales documentados en comentarios CSS extensos
- ✅ Snapshots históricos verificados accesibles
- ⚠️ Coverage de tests automatizados: **0%** (heredado de v1.0 — sin build tools)
- ⚠️ Audit Lighthouse / a11y aún pendiente para v3.0
- ⚠️ Cross-browser pendiente: probado en Chrome desktop, falta validar Safari + Firefox

---

## 12 · Próximos pasos sugeridos al PM/PO

1. **Backlog grooming** con las stories de la sección 8.1 (✅ entregadas — solo confirmar) y 8.2 (pendientes — priorizar)
2. **Decisión de scope v2.1.0**: ¿qué MINOR features entran al próximo sprint? (sugiero HU-A10 dashboard de métricas + HU-R07 filtros bandeja como quick wins)
3. **Decisión de scope v3.0.0**: ¿el sistema de scoring (HU-EV01) o app móvil (HU-MO01) merece prioridad después de los MINOR?
4. **Demo a stakeholders** del módulo en su estado v2.0.2 con la guía de la sección 9.3
5. **Validación legal/normativa**: los nuevos business rules de edición (sección 2.3) deben ser aprobados por el equipo jurídico del Ministerio antes de producción
6. **Audit a11y** como track paralelo (no bloquea features, pero debe entrar al backlog)
7. **Migración a backend real**: el contrato de datos sigue intacto (`shared/data.js`) — replicar como API REST manteniendo las firmas

---

**Acta firmada por la entrega técnica de v2.0.2 (ciclo v2.0.x consolidado).**
*Para preguntas técnicas: ver el PR #9 o agendar revisión con el equipo de producto.*
*Para preguntas de producto: revisar las stories de la sección 8 y agendar grooming.*
