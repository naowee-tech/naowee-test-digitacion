# Handoff — Módulo Project · sesión 2026-05-12 (actualizado)

Este documento captura **TODO** lo necesario para continuar el trabajo en otra
cuenta de Claude sin perder contexto. Acompaña al chat fijado.

---

## 🎯 TL;DR para arrancar en la otra sesión

1. **Pin** este chat en la nueva cuenta (UI de Claude → fijar conversación).
2. Abrir la nueva sesión y enviar este mensaje inicial:
   ```
   Lee estos archivos completos antes de cualquier acción:
   - project/HANDOFF-SESSION-2026-05-12.md
   - project/CLAUDE.md
   - project/GAP-ANALYSIS-DEMO-15MAY.md
   - .claude/launch.json

   Estado: branch project/refinements-validation-suite, PR #8 abierto.
   Link público: https://naowee-tech.github.io/naowee-test-project/
   Repo Pages: naowee-tech/naowee-test-project (separado del PR repo)
   Repo PR:    naowee-tech/naowee-test-digitacion#8

   Confirma que entendiste y dime qué quieres iterar a continuación.
   ```
3. Iterar.

---

## 1. URLs y repos

| Recurso | URL |
|---------|-----|
| **🌐 Demo público (Pages)** | **https://naowee-tech.github.io/naowee-test-project/** |
| Repo de Pages (root del project module) | https://github.com/naowee-tech/naowee-test-project |
| Repo del PR | https://github.com/naowee-tech/naowee-test-digitacion |
| **PR público** | **https://github.com/naowee-tech/naowee-test-digitacion/pull/8** |
| Preview local | http://localhost:4700 (server `project-preview` en `.claude/launch.json`) |
| DS Naowee CDN | https://cdn.jsdelivr.net/gh/naowee-tech/naowee-design-system@v1.8.0/dist/design-system.css |
| DS Playground local | http://localhost:4600 |
| Referencia escenarios | https://naowee-tech.github.io/naowee-test-escenarios/escenario-08-dashboard.html?mode=single |

⚠️ **Hay DOS repos remotos** distintos para project:
- **PR repo** (`naowee-test-digitacion`) — donde vive el PR técnico y el diff.
- **Pages repo** (`naowee-test-project`) — repo separado solo para servir la demo
  pública. Tiene `project/` en root (sin la carpeta wrapper).

## 2. Estructura de archivos local

```
/Users/dvargas/Desktop/Claude-Doug/
├── .claude/
│   └── worktrees/funny-leakey-205859/
│       └── project/                         ← TRABAJAR AQUÍ
│           ├── admin/  municipio/  revisor/
│           ├── shared/
│           │   ├── masks.js            ← NUEVO esta sesión
│           │   ├── modal-postular.js
│           │   ├── modal-activar-inversion.js
│           │   ├── modal-convocatoria.js
│           │   ├── wizard-page.js
│           │   ├── pages.css
│           │   └── ...
│           ├── HANDOFF-SESSION-2026-05-12.md ← este archivo
│           ├── CLAUDE.md
│           └── GAP-ANALYSIS-DEMO-15MAY.md
└── /tmp/naowee-test-project/                ← clon del repo de Pages
                                                (usado solo para deploy)
```

## 3. Workflow de deploy a Pages

Para actualizar la demo pública en `naowee-tech.github.io/naowee-test-project/`:

```bash
# 1. Trabajar normal en el worktree:
cd /Users/dvargas/Desktop/Claude-Doug/.claude/worktrees/funny-leakey-205859
# editar project/admin/... etc

# 2. Commit en la rama del PR:
git add project/
git commit -m "feat(project): ..."
git push origin project/refinements-validation-suite

# 3. Espejar al repo de Pages:
rsync -av --delete --exclude='.git' \
  /Users/dvargas/Desktop/Claude-Doug/.claude/worktrees/funny-leakey-205859/project/ \
  /tmp/naowee-test-project/
cd /tmp/naowee-test-project
git add .
git commit -m "deploy: sync con PR XXXXXXX"
git push origin main
# Pages reconstruye automáticamente en ~30s
```

Si `/tmp/naowee-test-project/` se perdió (reinicio), reclonar:
```bash
git clone https://github.com/naowee-tech/naowee-test-project.git /tmp/naowee-test-project
```

## 4. Branches

| Branch | Repo | Propósito |
|--------|------|-----------|
| `project/refinements-validation-suite` | naowee-test-digitacion | Mi rama del PR (orphan, sin historia con main) |
| `project/refinements-suite-orphan` | naowee-test-digitacion | Base del PR (orphan previa) |
| `main` | naowee-test-project | Demo pública servida en Pages |

⚠️ El push directo al repo `douguizard/digitacion-ui-ux-demo` (que redirige a
`naowee-tech/naowee-test-digitacion`) está bloqueado por Secret Scanning
(webhook Slack en commits históricos). Por eso usamos ramas orphan.

## 5. Commits del PR (en orden cronológico)

1. **800514f** · feat(project): validación canónica DS + hover messages + SUID flow
2. **1c0bb21** · feat(inversion): ejecutor ellipsis + fuentes +N tooltip; refactor SUID
3. **3536765** · feat(project): registro SUID v2 (3 fases) + máscara numérica + fix SUID pill
4. **c5f8ec2** · docs: handoff para la próxima sesión
5. _(nuevos commits de la próxima sesión aquí)_

## 6. Lo que ya está hecho

### A. Validación progresiva canónica DS
- `validateRequired(panel)` + `bindValidationReset(scope)` en `wizard-page.js`.
- Helper canónico `.naowee-helper--negative` con badge SVG oficial.
- Wiggle limitado a 5 + autoscroll + focus al primer error.
- 2º click bypass (no entorpece demo).
- Cubre textfield, dropdown, multiselect, file-uploader, datepicker.
- Aplicado en: `modal-postular`, `modal-activar-inversion`, `modal-convocatoria`.

### B. Hover de botones primarios dentro de naowee-message
- Mantienen `--accent` en idle/hover/focus/active.
- Hover solo añade elevation (box-shadow + translateY).
- Transition limitada a `box-shadow + transform` para evitar lock del CDN.
- En `pages.css` líneas ~480-525.

### C. Tabla de inversión
- Ejecutor con ellipsis 1 línea (max 150px) + `title` attribute.
- Fuentes: primer badge + chip `+N` con tooltip CSS-driven.
- SUID column: `inversion-suid-pill` compacto (max 150px) con dot status + ellipsis.

### D. Registro SUID v2
- `admin/registro-suid.html` reescrito completo.
- 3 fases visuales: Pre-validación · Datos deportivos · Documentación.
- 9 secciones accordion en UN solo `.naowee-card`.
- Replica escenario-08-dashboard fields.
- Validaciones específicas: catastral, lat/lng rango Colombia (-4.23 a 12.53 /
  -81.73 a -66.87), tipo infra/escenario, mín 1 disciplina, área + aforo, acceso.
- Footer integrado dentro del card (no sticky).
- Componentes DS canónicos en todo (no `<select>` nativo).

### E. Máscara numérica transversal
- `shared/masks.js` con `bindMasksIn(scope)` + `unmask(value)`.
- `data-mask="money"` formatea con locale `es-CO` (1.500.000) en tiempo real.
- Cursor preservado al reformatear.
- `textfield()` helper acepta param `mask: 'money'`.
- Aplicada en: modal-postular (5 campos), modal-activar-inversion, registro-suid.

## 7. Patrones obligatorios al iterar

### Validación de wizard
```js
import { validateRequired, bindValidationReset } from './wizard-page.js';

btnNext.addEventListener('click', () => {
  const panel = overlay.querySelector(`[data-panel="${currentStep}"]`);
  if (!validateRequired(panel)) return;
  goToStep(currentStep + 1);
});
bindValidationReset(form);
```

### Campo numérico con máscara
```js
import { bindMasksIn, unmask } from './masks.js';

// HTML
${textfield({ name: 'monto', mask: 'money', placeholder: '4.800.000.000' })}

// Bind tras mount
bindMasksIn(form);

// Read
const raw = unmask(fd.get('monto'));
```

### Cache busting
Cualquier cambio en `shared/*.js` o `shared/pages.css` requiere bump `?v=`:
```bash
# Bump global de pages.css:
grep -rl "pages.css?v=" project --include="*.html" | \
  xargs sed -i '' -E 's|pages\.css\?v=[0-9a-z]+|pages.css?v=NUEVA|g'

# Bump específico de un módulo:
grep -rl "modal-postular.js?v=" project --include="*.html" | \
  xargs sed -i '' -E 's|modal-postular\.js\?v=[0-9a-z]+|modal-postular.js?v=NUEVA|g'
```
Versión actual al cierre de sesión: **20260512m**.

## 8. Anatomía DS (cánones absolutos)

| Componente | Anatomía obligatoria |
|------------|---------------------|
| textfield / dropdown / multiselect | height 48px · padding 0 12px · radius 12px · border 1px #8788ab · focus accent + shadow 3px |
| datepicker-field | height 46px · radius 12px · border 1.5px #d0d4e6 |
| Botón primary (loud) | bg `--accent` · hover solo elevation (box-shadow + translateY -1px) · NO cambia bg |
| Botón positive (verde) | bg #15803d · clase `naowee-btn--primary-positive` · hover elevation verde |
| Tooltip dark canónico | bg #282834 · padding 10px 12px · radius 8px · flecha 5px solid border-top |
| `.has-error` state | border-color #b42318 · **background blanco** · `transition: none !important` · helper `--negative` |
| `.naowee-helper--negative` | inline-flex · gap 6px · badge SVG circle 12px con icon "i" blanco |
| Phase header (registro-suid) | bg #fafbfd · número circular naranja 22px · título uppercase letter-spacing .3px |
| Accordion section | border-top sutil · head con número circular 26px · body con dashed separator top |
| Pill compacto (SUID) | max-width 150px · dot 6px · ellipsis + title attr |
| Chip toggle (multi) | radius 999px · border 1.5px · selected: orange-bg + check-circle ::before |
| Segmented (Sí/No) | inline-flex container · padding 3px · option radius 6px · selected: bg accent + color white |

## 9. Anti-patrones (NUNCA usar)

| ❌ Mal | ✅ Bien |
|--------|---------|
| `<select>` nativo | `dropdown()` de modal-convocatoria + `bindDropdowns` |
| `<input type="number">` para moneda | `textfield({ mask: 'money' })` + `bindMasksIn` |
| Markup naowee-textfield inline | `textfield()` helper |
| Banner custom con gradiente | `naowee-message --positive/informative/negative/caution` |
| Footer `position: sticky` | Footer integrado como última div dentro del card |
| Validación con `alert()` | `validateRequired` + `toast` |
| Hover que cambia bg del botón primary | Hover solo añade elevation |
| `background:` shorthand en `.has-error` | `background-color: #fff !important` (preserva chevron del multiselect) |
| Olvidar `transition: none` en `.has-error` | Siempre incluirlo (vence transition del CDN) |

## 10. Áreas pendientes / próximas iteraciones (orden sugerido)

1. **Validación lat/lng activa con helper inline** en registro-suid: hoy
   se valida al submit; podría disparar `helper--negative` al `blur` del campo.
2. **Auto-fill de Departamento + Municipio** al seleccionar uno (cascade con
   catálogo DANE — hoy son textfields manuales).
3. **`inversion-crear.html`** — auditar si tiene campos numéricos sin máscara.
4. **`proyecto-detalle.html`** — el tab Historial usa timeline custom; podría DSificarse.
5. **`dashboard.html` (admin)** — KPI cards usan estilos custom; auditar.
6. **`modal-convocatoria`** — paso 1 datepicker requiere validación de
   `apertura < cierre` (lógica de negocio).
7. **Persistencia real** — hoy todo vive en localStorage (key `naowee.project.v6`).
8. **Tests E2E (Playwright)** para los 3 wizards.
9. **Demo script (12 min)** — `DEMO-SCRIPT.md` con storyline + checkpoints.
10. **Accessibility audit** — focus management, aria-live para los toasts,
    keyboard nav en chips/segments.

## 11. Servers locales necesarios

```bash
# Si el preview no está corriendo, usar el tool MCP Claude_Preview
# o levantar manualmente desde .claude/launch.json:
# - project-preview        → :4700
# - naowee-test-escenarios → :4400  (referencia)
# - naowee-ds-playground   → :4600  (playground DS)
```

## 12. Tooling MCP útil para la nueva sesión

| MCP | Para qué |
|-----|----------|
| `Claude_Preview` | preview_start, preview_screenshot, preview_eval (JS inspector) |
| `context-mode` | ctx_fetch_and_index para URLs (la web está bloqueada en WebFetch) |
| `gh` (CLI) | gh pr view, gh api repos/.../pages, gh repo create |

## 13. Filosofía operativa (lecciones aprendidas)

- **DS first, custom last**: cuando dudes, abrir el playground `:4600` y replicar.
- **Cache bust agresivo**: cualquier cambio en `shared/` necesita bump `?v=`.
- **No `position: sticky` en footers de forms** — integrar dentro del card.
- **`transition: none !important` en `.has-error`** — la transition del CDN
  atasca el repinte del border-color.
- **`background-color`, no `background:` shorthand** — para preservar
  `background-image` (chevron de multiselect).
- **Specificity wars con el CDN**: scope con id del overlay/modal para ganar.
- **Demo-friendly**: 2º click bypass en validación, mocks visibles,
  toasts informativos, pre-fill desde perfil.
- **Inline `!important` puede no ganar** vs el CDN porque usa @layer; siempre
  incluir `transition: none` cuando se sobrescriben propiedades animadas.
- **Ramas orphan** evitan secret scanning sobre commits históricos sin
  borrar historia.

## 14. Checklist de arranque para la nueva sesión

- [ ] Pin del chat anterior en UI de Claude
- [ ] Worktree existe en `.claude/worktrees/funny-leakey-205859/`
- [ ] `git fetch && git checkout project/refinements-validation-suite`
- [ ] `git pull` para últimos commits
- [ ] Leer este HANDOFF completo
- [ ] Leer `project/CLAUDE.md` y `project/GAP-ANALYSIS-DEMO-15MAY.md`
- [ ] Levantar `project-preview` server (:4700) vía MCP `Claude_Preview`
- [ ] Verificar `https://naowee-tech.github.io/naowee-test-project/` se ve OK
- [ ] Verificar PR #8 sigue OPEN
- [ ] Confirmar autenticación `gh auth status` → activo `douguizard`
- [ ] Empezar la siguiente iteración

---

🤖 Generado al cierre de la sesión 2026-05-12.

PR técnico: https://github.com/naowee-tech/naowee-test-digitacion/pull/8
Demo pública: https://naowee-tech.github.io/naowee-test-project/
