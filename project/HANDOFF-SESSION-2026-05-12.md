# Handoff — Módulo Project · sesión 2026-05-12

Este documento captura **TODO lo necesario** para que una nueva sesión de Claude
continúe el trabajo sin perder contexto. Acompaña la inclusión del chat fijado
("pinned").

---

## 1. Dónde está todo

| Cosa | Ubicación |
|------|-----------|
| **Worktree activo** | `/Users/dvargas/Desktop/Claude-Doug/.claude/worktrees/funny-leakey-205859/project/` |
| **Branch local** | `project/refinements-validation-suite` (orphan, sin historia con main) |
| **Repo remoto** | https://github.com/naowee-tech/naowee-test-digitacion |
| **PR público** | https://github.com/naowee-tech/naowee-test-digitacion/pull/8 |
| **Base PR** | `project/refinements-suite-orphan` (orphan previa de la sesión anterior) |
| **Preview local** | http://localhost:4700 (config en `.claude/launch.json` → `project-preview`) |
| **DS Naowee CDN** | https://cdn.jsdelivr.net/gh/naowee-tech/naowee-design-system@v1.8.0/dist/design-system.css |
| **Referencia escenarios** | https://naowee-tech.github.io/naowee-test-escenarios/escenario-08-dashboard.html?mode=single |
| **Diseño escenarios** | `/Users/dvargas/Desktop/Claude-Doug/naowee-test-escenarios/` (servido en :4400) |

## 2. Por qué la rama es orphan

El repo original `douguizard/digitacion-ui-ux-demo` tiene un webhook de Slack
detectado por GitHub Secret Scanning en commits históricos
(`RESUMEN-SESION-v1.8.0.md`). El push directo es rechazado. Solución:

- Rama `project/refinements-suite-orphan` en remote (commit 1affbd3) =
  snapshot LIMPIO inicial del módulo Project.
- Mi rama `project/refinements-validation-suite` se basa en ese orphan
  y suma 3 commits con todos los refinamientos de esta sesión.

Para continuar:
```bash
cd /Users/dvargas/Desktop/Claude-Doug/.claude/worktrees/funny-leakey-205859
git fetch origin project/refinements-validation-suite
git checkout project/refinements-validation-suite
```

## 3. Commits del PR (en orden)

1. **800514f** — `feat(project): validación canónica DS + hover messages + SUID flow`
   - `validateRequired` + `bindValidationReset` en wizard-page.js
   - Helper canónico `naowee-helper--negative`
   - Wiggle limitado a 5 + autoscroll + focus
   - 2º click bypass para demo
   - Cubre textfield, dropdown, multiselect, file-uploader, datepicker
   - Fix hover botones primarios dentro de `naowee-message`
   - Fix fill blanco en `.has-error` (no rosado)
   - Fix `transition: none !important` para vencer la transición del CDN
2. **1c0bb21** — `feat(inversion): ejecutor ellipsis + fuentes +N tooltip; refactor SUID`
   - Tabla inversión: Ejecutor con ellipsis 1 línea + tooltip
   - Fuentes: primer badge + chip "+N" con CSS tooltip dark
   - Rewrite completo de `registro-suid.html`: 1 card único, accordion
     sections, dropdowns DS canónicos (vs `<select>` nativo), footer
     integrado no sticky.
3. **3536765** — `feat(project): registro SUID v2 (3 fases) + máscara numérica + fix SUID pill`
   - `shared/masks.js` nuevo — máscara `data-mask="money"` con locale es-CO
   - `bindMasksIn(scope)` + `unmask(value)` API
   - `textfield()` helper acepta nuevo param `mask: 'money'`
   - Aplicada en modal-postular (5 campos), modal-activar-inversion,
     registro-suid
   - Registro SUID v2: 3 fases (Pre-validación · Datos deportivos ·
     Documentación) · 9 secciones, replica escenario-08-dashboard
   - `inversion-suid-pill` compacto + dot status para no desbordar tabla

## 4. Patrones establecidos en esta sesión

### Validación progresiva DS
```js
import { validateRequired, bindValidationReset } from './wizard-page.js';

// En el btnNext del wizard
btnNext.addEventListener('click', () => {
  const panel = overlay.querySelector(`[data-panel="${currentStep}"]`);
  if (!validateRequired(panel)) return;  // 1er click → muestra + wiggle, 2º → pasa
  goToStep(currentStep + 1);
});

bindValidationReset(form); // limpia helper al corregir
```

### Helper canónico DS — markup obligatorio
```html
<span class="naowee-helper naowee-helper--negative">
  <span class="naowee-helper__badge">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="6" fill="currentColor"
        style="color:var(--naowee-color-feedback-fill-negative-loud,#b42318)"/>
      <path d="M5.25 5.25h1.5v3h-1.5z" fill="#fff"/>
      <circle cx="6" cy="3.75" r=".75" fill="#fff"/>
    </svg>
  </span>
  Campo es obligatorio
</span>
```
Variantes: `--negative` (rojo) · `--informative` (azul) · `--positive` (verde) · `--caution` (naranja).

### Máscara numérica
```js
import { bindMasksIn, unmask } from './masks.js';

// HTML — agregar data-mask="money"
${textfield({ name: 'monto', mask: 'money', placeholder: '4.800.000.000' })}

// Tras montar el form
bindMasksIn(form);

// Al leer
const raw = unmask(fd.get('monto'));  // number entero
```

### `.has-error` quirks del CDN
El CDN del DS aplica transitions que ATASCAN el repintado de `border-color`
cuando se añade `.has-error` en runtime. Workaround: `transition: none !important`
en la regla `.has-error`. Específico a inputs CDN-styled. Patrón completo en
`pages.css` líneas 2090-2110.

Para rules id-prefixed del modal (ej. `#convocatoriaOverlay`), scope la regla
`.has-error` con el mismo id para outspecify por specificity:
```css
#convocatoriaOverlay .has-error .naowee-textfield__input-wrap { ... }
```

### Hover de botones dentro de `naowee-message`
El CDN del DS apaga el background a cream en `:hover` (queda visualmente roto
en banners negativos). Fix en pages.css: forzar background `--accent` en
idle/hover/focus + transition limitada a box-shadow + transform.

### Cache busting
- ES modules: `?v=20260512m` en cada `import`
- pages.css: `?v=20260512m` en `<link>`
- Para bump global usar:
```bash
grep -rl "pages.css?v=" project --include="*.html" | xargs sed -i '' -E 's|pages\.css\?v=[0-9a-z]+|pages.css?v=NEW|g'
```

## 5. Anatomía DS (cánones)

| Componente | Anatomía |
|------------|----------|
| textfield / dropdown / multiselect | height 48px · padding 0 12px · radius 12px · border 1px #8788ab · focus accent + shadow 3px |
| datepicker-field | height 46px · radius 12px · border 1.5px #d0d4e6 |
| `.naowee-message` action button (primary) | bg --accent · hover elevation only · transition box-shadow + transform |
| Botón primario verde (inventariar/positive CTA) | `naowee-btn--primary-positive` · bg #15803d · hover elevation verde |
| Tooltip dark canónico | bg #282834 · padding 10px 12px · radius 8px · flecha 5px solid border-top |
| Pill SUID compacto | max-width 150px · dot 6px · ellipsis + title attr |
| Phase header (registro-suid) | bg #fafbfd · número circular naranja + título uppercase |
| Accordion section | border-top sutil · header con número circular + título + chev rotativo · body con dashed separator |

## 6. Componentes que se DEBEN usar (canónicos)

| Lo que NO usar | Lo correcto |
|----------------|-------------|
| `<select>` nativo | `dropdown()` de modal-convocatoria.js + `bindDropdowns()` |
| `<input type="number">` para moneda | `textfield({ mask: 'money' })` + `bindMasksIn` |
| markup inline naowee-textfield | `textfield()` helper |
| Banner custom con gradiente | `naowee-message --positive/informative/negative/caution` |
| Footer sticky position | Footer integrado dentro del card como última div |
| Validación manual con `alert()` | `validateRequired` + `bindValidationReset` + `toast` |
| Card sticky con título flotante | `naowee-page-header` + card inferior con accordion |

## 7. Áreas pendientes / mejoras futuras (no críticas)

- `inversion-crear.html` — verificar si tiene campos numéricos que faltan máscara.
- `proyecto-detalle.html` — el tab "Historial" usa timeline custom; podría DSificarse.
- `dashboard.html` — KPI cards y banners usan estilos custom; auditar.
- Persistencia real: hoy todo vive en `localStorage` (key `naowee.project.v6`).
- Tests E2E (Playwright) para los wizards.

## 8. Lo que el preview necesita

```bash
# Si el preview no está corriendo:
cd /Users/dvargas/Desktop/Claude-Doug
# (los servers se inician desde .claude/launch.json vía preview tool MCP)
```

Servers de launch.json:
- `project-preview` → :4700 (este proyecto)
- `naowee-test-escenarios` → :4400 (referencia escenarios)
- `naowee-ds-playground` → :4600 (DS playground)

## 9. Para la nueva sesión — checklist de arranque

1. [ ] Confirmar branch `project/refinements-validation-suite`
2. [ ] `git pull --rebase origin project/refinements-validation-suite`
3. [ ] Leer este HANDOFF + `project/CLAUDE.md` (rules) + `project/GAP-ANALYSIS-DEMO-15MAY.md`
4. [ ] Iniciar preview server (project-preview en :4700)
5. [ ] Verificar PR #8 en remoto sigue abierto
6. [ ] Continuar el trabajo

## 10. Filosofía operativa (lo que aprendimos)

- **DS first, custom last**: cuando dudes, abrir el playground `:4600` y replicar.
- **Cache bust agresivo**: cualquier cambio en `shared/` necesita bump `?v=`.
- **No `position: sticky` en footers de forms** — integrar dentro del card.
- **`transition: none !important` en `.has-error`** — la transition del CDN atasca el repinte.
- **`background-color`, no `background:` shorthand** — para no pisar `background-image` del chevron.
- **Specificity wars con el CDN**: scope con id del overlay/modal para ganar.
- **Demo-friendly**: 2º click bypass en validación, mocks visibles, toasts informativos.

---

🤖 Generado al cierre de la sesión 2026-05-12 — PR https://github.com/naowee-tech/naowee-test-digitacion/pull/8
