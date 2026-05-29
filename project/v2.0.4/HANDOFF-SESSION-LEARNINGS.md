# 📋 HANDOFF — Módulo Project (Postulación de proyectos de infraestructura)

> Memoria persistente de lo construido y aprendido en este módulo. Cualquier sesión nueva de Claude Code debe leer este archivo **antes de tocar código** del módulo `project/`.
>
> **Última actualización:** 2026-05-08
> **Autor:** Doug Vargas (`@douguizard`)
> **Stack:** HTML estático puro + DS Naowee v1.8.0 (CDN) + ES modules + localStorage E2E

---

## 🎯 Qué es este módulo

Demo visual del flujo de **postulación de proyectos de infraestructura** (Resolución 933) para el Ministerio del Deporte de Colombia. 3 roles encadenados con state compartido en `localStorage`:

| Rol | Pages | Función |
|---|---|---|
| **Admin Convocatorias** | dashboard, convocatorias, crear (modal wizard), detalle, proyectos, proyecto-detalle, inversion, inversion-crear | Crear convocatorias, ver postulaciones, asignar revisores, abrir inversión |
| **Municipio** | dashboard, convocatorias, postular, mis proyectos, perfil, prorroga, subsanar, etapa-documental | Postular proyectos, subsanar, solicitar prórrogas, cargar documentos |
| **Revisor** | dashboard, bandeja, revisar-postulacion, doc-general, doc-tecnica, revisar-area, concepto | Revisar postulaciones, revisar documentación general/técnica, emitir concepto |

**Total:** 19 páginas + 1 modal wizard de 3 pasos.

---

## 📁 Estructura del módulo

```
project/
├── index.html                          # router por rol (selector de demo)
├── HANDOFF-SESSION-LEARNINGS.md        # este archivo
├── shared/
│   ├── shell.css                       # copia del shell oficial Naowee
│   ├── pages.css                       # tokens custom + patrones de incentivos (KPI, layouts, tables)
│   ├── shell.js                        # mountSidebar + mountHeader + mountSwitcher + mountNaoweeFooter + fadeAndGo
│   ├── data.js                         # state E2E en localStorage["naowee.project.v1"]
│   ├── states.js                       # ESTADOS_POSTULACION/DOC/AREA con colors=DS modifiers
│   ├── modal-convocatoria.js           # wizard 3 pasos (~700 líneas)
│   ├── spec.json                       # 42 docs Res. 933 + catálogos
│   └── logos/
├── admin/                              # 8 páginas
├── municipio/                          # 8 páginas
└── revisor/                            # 7 páginas
```

**Path absoluto del worktree:** `/Users/dvargas/Desktop/Claude-Doug/.claude/worktrees/funny-leakey-205859/project/`

---

## 🚀 Cómo arrancar

```bash
# Preview server ya configurado en .claude/launch.json del worktree
# (NO en ~/.claude/launch.json — es local al worktree)
```

Usar Preview MCP:
```
preview_start({ name: "project-preview" })
# → http://localhost:4700
```

URLs principales:
- http://localhost:4700/index.html (selector de rol)
- http://localhost:4700/admin/dashboard.html
- http://localhost:4700/municipio/dashboard.html
- http://localhost:4700/revisor/dashboard.html

---

## ✅ Componentes DS aplicados (verbatim del playground oficial)

| Componente | Clase oficial | Notas críticas |
|---|---|---|
| Modal | `.naowee-modal__header` + `__title-group` + `__title` + `__subtitle` + `__dismiss` | NO añadir botón "Cancelar" en header — solo ✕ dismiss |
| Stepper | `.naowee-stepper__step` + `__number` + `__label` + `__connector` + `--active` + `--done` + `--pulse` | NO usar `--distributed` (colapsa labels) |
| Dropdown | `.naowee-dropdown__trigger` + `__chevron` (20×20, path `M6 9l6 6 6-6`) | Menu requiere **portal a body** |
| Datepicker | `.naowee-datepicker-field` + `.naowee-datepicker--popover` | Popover requiere **portal a body** |
| Checkbox | `.naowee-checkbox` + `__box` + `__label` + SVG path oficial | **NO usar SVG con `<polyline>` stroke** — usa `<path>` con `fill="currentColor"` |
| Textfield | `.naowee-textfield` (multiline para textarea) | |
| Message | `.naowee-message` + `--informative/--caution/--negative` | |
| Badge | `.naowee-badge--{positive,caution,negative,brand,informative,neutral}` + `--quiet` | |
| KPI | `.kpi-card` (custom de pages.css) | **`border:none !important`**, sin hover transform |
| Table | `.naowee-table` | header bg `#f5f6fa` padding `12px 18px`, body `14px 18px`, hover row `#fafbfd` |
| Footer | `.naowee-floating-footer` | Auto-mount en `mountShell()` |

**Botones — variantes válidas SOLO:** `--loud` (primary naranja), `--quiet` (secondary), `--mute` (ghost/tertiary), `--link`. NO existen `--ghost`, `--accent`, `--primary`. **Grep antes de inventar.**

---

## 🔑 Patrones técnicos críticos del módulo

### 1. Portal de popovers a `<body>` (datepicker + dropdown)

**Problema:** un ancestor del modal tiene `transform/animation`, lo que crea un containing block y convierte cualquier `position:fixed` interno en `absolute` relativo al modal → el popover se corta por `overflow:hidden`.

**Fix:** mover el popover/menu al `<body>` al abrir y posicionar con `getBoundingClientRect`.

```js
// Patrón usado en modal-convocatoria.js
function openPopover(trigger, popover) {
  document.body.appendChild(popover);             // PORTAL
  const r = trigger.getBoundingClientRect();
  popover.style.position = 'fixed';
  popover.style.top  = (r.bottom + 6) + 'px';
  popover.style.left = r.left + 'px';
  popover.style.zIndex = '9999';
  // Reposition en scroll/resize si el modal scrollea internamente
}
```

Cleanup obligatorio al cerrar el modal (sino quedan popovers huérfanos en `<body>`).

### 2. Dropdown menu — width fijo (NO min-width)

```js
// shared/modal-convocatoria.js → función positionMenu()
menu.style.width    = rect.width + 'px';
menu.style.maxWidth = rect.width + 'px';
// NO usar min-width — permite que el menu crezca y se salga del modal
```

### 3. Dropdown — override de transition cubic-bezier

El DS aplica una transition con `cubic-bezier(.68,-.2,.32,1.4)` (rebote negativo) al menu. Combinada con opacity:0 inicial bloquea cambios de opacity desde JS aunque uses `!important`.

**Fix:** override inline al abrir:
```js
menu.style.setProperty('transition', 'none', 'important');
menu.style.setProperty('opacity', '1', 'important');
```

### 4. Checkbox SVG visible cuando checked

Mismo problema que el dropdown — `cubic-bezier(.68,-.2,.32,1.4)` + `opacity:0 + scale(.5)` por defecto bloquea opacity desde CSS.

**Fix:** listener JS que fuerza inline al cambiar:
```js
const syncCheckbox = (inp) => {
  const label = inp.closest('label.naowee-checkbox');
  if (!label) return;
  label.classList.toggle('naowee-checkbox--checked', inp.checked);
  const svg = label.querySelector('.naowee-checkbox__box svg');
  if (svg) {
    svg.style.setProperty('transition', 'none', 'important');
    svg.style.setProperty('transform', inp.checked ? 'scale(1)' : 'scale(.5)', 'important');
    svg.style.setProperty('opacity',   inp.checked ? '1' : '0', 'important');
  }
};
overlay.querySelectorAll('label.naowee-checkbox > input[type="checkbox"]').forEach(inp => {
  inp.addEventListener('change', () => syncCheckbox(inp));
  syncCheckbox(inp);    // sync en mount
});
```

**IMPORTANTE:** todas las checkboxes del módulo deben pasar por el builder `checkbox()` de `modal-convocatoria.js` que ya genera el SVG correcto (`<path fill="currentColor">`). NO hardcodear `<polyline stroke>`.

### 5. KPI cards — sin border, sin hover transform

```css
/* pages.css */
.kpi-card {
  border: none !important;        /* HANDOFF de incentivos */
  box-shadow: 0 1px 3px rgba(145,158,171,.12),
              0 6px 16px rgba(145,158,171,.08);
}
.kpi-card:hover {
  transform: none !important;     /* NO translateY */
}
```

### 6. Tables — paddings exactos

```css
.naowee-table thead th { padding: 12px 18px; background: #f5f6fa; }
.naowee-table tbody td { padding: 14px 18px; }
.naowee-table tbody tr:hover { background: #fafbfd; }
```

### 7. Page-header — `align-items: flex-start`

NO `flex-end` (empuja título a la derecha cuando hay wrap). Patrón verbatim de `incentivo-07/14`:

```css
.naowee-page-header { display:flex; align-items:flex-start; gap:20px; flex-wrap:wrap; }
```

### 8. Section titles claros (`#b5b9d4`)

Para títulos de sub-sección dentro de cards/modales (ej: "IDENTIFICACIÓN", "ALCANCE TERRITORIAL"):

```css
color: #b5b9d4;       /* NO usar var(--text-secondary) que es más oscuro */
font-size: 11px;
font-weight: 700;
letter-spacing: .5px;
text-transform: uppercase;
```

### 9. Stepper — `--pulse` solo en current step

```html
<div class="naowee-stepper">
  <div class="naowee-stepper__step naowee-stepper__step--done">
    <span class="naowee-stepper__number"><svg>...check...</svg></span>
    <span class="naowee-stepper__label">Identificación</span>
  </div>
  <div class="naowee-stepper__connector"></div>
  <div class="naowee-stepper__step naowee-stepper__step--active naowee-stepper__step--pulse">
    <span class="naowee-stepper__number">2</span>
    <span class="naowee-stepper__label">Alcance territorial</span>
  </div>
  <div class="naowee-stepper__connector"></div>
  <div class="naowee-stepper__step">
    <span class="naowee-stepper__number">3</span>
    <span class="naowee-stepper__label">Condiciones</span>
  </div>
</div>
```

Animación pulse en `pages.css` con keyframe `naoweeStepperPulse` (box-shadow ring naranja, 2s infinite).

### 10. Floating footer del modal — flat structure

NO envolver botones en wrappers vacíos (genera padding asimétrico). Estructura plana con `margin-right: auto` en el primer botón:

```html
<div class="modal-footer">
  <button class="naowee-btn naowee-btn--mute" style="margin-right:auto">← Anterior</button>
  <a class="wz-save-draft naowee-btn--large">Guardar borrador</a>
  <button class="naowee-btn naowee-btn--loud naowee-btn--large">Continuar →</button>
</div>
```

---

## 🐛 Bugs enfrentados — root cause + fix

| Síntoma | Root cause | Fix |
|---|---|---|
| Page-header empuja título a la derecha | `align-items: flex-end` con `flex-wrap` | `align-items: flex-start` (verbatim inc-07/14) |
| Stepper labels solapan connector | `--distributed` con `min-width:0` colapsa step | Quitar `--distributed`, dejar solo `--pulse` |
| Datepicker popover cortado por modal | Modal ancestor con `transform` crea containing block | Portal a `<body>` + `position:fixed` + `getBoundingClientRect` |
| Dropdown menu cortado + opacity:0 | Mismo containing block + transition cubic-bezier negativa | Portal + override `transition:none + opacity:1` con `setProperty(...,'important')` |
| Dropdown menu se sale a la derecha | `min-width: rect.width` permite crecer | `width + max-width` fijos al ancho del trigger |
| KPI cards con border y hover translateY | Inventé estilos custom | `border:none !important` + `transform:none !important` (HANDOFF incentivos) |
| Stepper sin pulse en current step | Faltaba clase `--pulse` | Añadir clase + keyframe `naoweeStepperPulse` |
| Footer paddings asimétricos | Wrapper div vacío para "Anterior" oculto | Estructura flat + `margin-right: auto` |
| Modal "Cancelar" en header redundante | Inferí del wireframe genérico | Quitar — incentivos solo tiene ✕ dismiss |
| Stepper "PASO N" doble línea | Inferí del wireframe | Una sola línea: `__number` + `__label` |
| Section titles muy oscuros | Usé `var(--text-secondary)` (#646587) | Usar `#b5b9d4` directo |
| Inventé clases `--ghost`/`--accent`/`--primary` | No grepé el DS oficial primero | **Regla:** grep `design-system.css` antes de cualquier clase |
| Hardcodé checkbox con `<polyline stroke>` | No reusé el builder `checkbox()` | Usar el builder — ya genera SVG `<path fill>` oficial |
| Checkbox SVG invisible aunque CSS correcto | DS aplica transition cubic-bezier negativa que bloquea opacity | Listener JS + `setProperty('transition','none','important')` |

---

## 🔄 State E2E — `localStorage["naowee.project.v1"]`

```js
// data.js
{
  perfil: 'admin' | 'municipio' | 'revisor',
  convocatorias: [{ id, nombre, bienio, estado, cierre, postulaciones }, ...],
  proyectos: [{ idUnico, radicado, nombre, municipio, departamento, estado, presupuesto, fechaPostulacion, ... }, ...],
  notificaciones: [{ perfil, tipo, titulo, detalle }, ...]
}
```

**6 proyectos demo** cubriendo todos los estados (Quibdó, Bahía Solano, Istmina, El Carmen de Atrato, Riosucio, Atrato).

**Demo switcher inferior** (`<div id="demoRoleSwitcherRoot">`) alterna perfiles sin perder state.

**Estados — color modifiers DS (states.js):**
- `borrador` → neutral
- `radicada` → informative
- `en_revision` → brand
- `devuelta_subsanacion` → caution
- `subsanada` → informative
- `concepto_favorable` → positive
- `concepto_desfavorable` → negative
- `etapa_documental` → brand
- `lista_inversion` → positive
- `en_inversion` → positive
- `archivada` → neutral

---

## ⏳ Pendientes (priorizados)

### Alta prioridad (entrega)
- [ ] **Validaciones del wizard** — actualmente `validateStep()` retorna `true`. Reactivar con wiggle + helper "Este campo es obligatorio" cuando se finalice el alcance de campos requeridos.
- [ ] **Confetti + check verde** al "Publicar convocatoria" — pattern de incentivo-11. Implementado parcialmente.
- [ ] **Migrar `postular.html` al wizard** — formulario largo, mismo pattern del modal de convocatoria pero embebido en page.

### Media prioridad
- [ ] **Migrar `prorroga.html`, `subsanar.html`, `inversion-crear.html`** al pattern wizard.
- [ ] **`fadeAndGo()` en `<a href>` de navegación** — actualmente usa navegación nativa, sin fade entre páginas.

### Baja prioridad
- [ ] Test cross-browser (Safari, Firefox) — solo validado en Chrome.
- [ ] Responsive en mobile (<768px) — diseño focus desktop.

---

## 🤝 Reviewer / handoff backend

**TBD.** Es trabajo independiente del stack auth de Juan Manuel. Probable receptor: equipo de la suite-web-v2 cuando se integre a Angular.

---

## 📚 Lecciones específicas del módulo

1. **Cuando un fix CSS no funciona en 1 intento, abrir DevTools (`preview_eval` con `getComputedStyle`) ANTES de seguir editando.** No iterar a ciegas. Ejemplo: el SVG del checkbox tomó múltiples iteraciones por no diagnosticar el `transition` bloqueando opacity.

2. **CORS bloquea leer reglas de stylesheets de CDN.** No se puede `document.styleSheets[i].cssRules` para CDN. Alternativa: descargar el CSS local con `curl` y grep.

3. **`!important` en CSS no es suficiente para vencer una transition activa.** Si el DS define `transition: opacity .25s cubic-bezier(...)`, hay que matar la transition primero con `setProperty('transition','none','important')`, luego cambiar la propiedad.

4. **El builder pattern (`textfield()`, `dropdown()`, `checkbox()`, `datepicker()`) garantiza consistencia.** Hardcodear HTML inline lleva a desincronización (las 2 checkboxes ZOMAC/PDET olvidadas en migración).

5. **Verificar visualmente DESPUÉS de cada cambio antes de decir "listo".** `preview_screenshot` es 5 segundos y evita decir "ya está" cuando no está.

6. **Los wireframes genéricos (Figma sin ref a incentivos/escenarios) inducen a inventar.** Si un patrón existe en `incentivo-XX` o `escenario-XX`, copiar verbatim — no "interpretarlo".

---

## 📞 Cómo arrancar una sesión nueva en este módulo

Pegar este prompt:

> Soy Doug Vargas. Voy a seguir trabajando en el módulo `project/`.
> Lee primero:
> 1. `~/Desktop/Claude-Doug/PLAYBOOK-REFINAMIENTO.md` (contexto general)
> 2. `~/Desktop/Claude-Doug/.claude/worktrees/funny-leakey-205859/project/HANDOFF-SESSION-LEARNINGS.md` (este archivo)
> 3. `CLAUDE.md` del worktree (rules específicas).
>
> Después arranca el preview con `preview_start({ name: "project-preview" })`.
>
> Tarea: [describir].

---

> **Regla operativa post-2026-05-08:**
> 1. Antes de escribir cualquier clase `naowee-*` → grep `design-system.css`.
> 2. Antes de tocar visualmente algo → `preview_screenshot` del estado actual.
> 3. Después de cualquier edición visual → `preview_screenshot` para validar.
> 4. Si un fix CSS no funciona en 1 intento → `preview_eval` con `getComputedStyle` para diagnosticar antes de seguir editando.
> 5. Releer un archivo si han pasado >5 ediciones desde la última lectura.
