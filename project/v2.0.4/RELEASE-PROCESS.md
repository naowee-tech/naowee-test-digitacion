# Release Process — Naowee modular demos

Playbook reutilizable para versionar demos, conservar historial accesible por URL, y entregar versiones estables al equipo de desarrollo.

> Aplica a cualquier módulo Naowee con la misma arquitectura de Pages (Project, Digitación, Escenarios, Incentivos, etc.). Para módulos nuevos, replicar la setup inicial al final de este doc.

---

## Esquema semver

- **MAJOR** `vX.0.0` · Nuevas funcionalidades top-level o breaking changes (modelo de datos, máquinas de estado, perfiles nuevos)
- **MINOR** `vX.Y.0` · Sub-funcionalidades nuevas, mejoras internas con compatibilidad hacia atrás
- **PATCH** `vX.Y.Z` · Fixes UI / UX, bugs visuales, micro-refinamientos

**Tag scheme en git:** `<modulo>-vX.Y.Z` (ej. `project-v2.0.1`, `digitacion-v1.5.0`). El prefijo previene colisión entre módulos en el mismo repo.

---

## Arquitectura de URLs por versión

```
https://naowee-tech.github.io/<repo>/<modulo>/index.html            ← live (latest)
https://naowee-tech.github.io/<repo>/<modulo>/vX.Y.Z/index.html     ← snapshot frozen
https://naowee-tech.github.io/<repo>/<modulo>/vX.Y.Z/admin/...      ← preserva paths nested
```

**Ejemplo (project):**
- Live: `https://naowee-tech.github.io/naowee-test-digitacion/project/index.html`
- Snapshot v2.0.1: `https://naowee-tech.github.io/naowee-test-digitacion/project/v2.0.1/index.html`

---

## Setup Pages (una sola vez por módulo)

Pages debe servir desde una **branch orphan** con la estructura `<modulo>/...` al root del branch.

```bash
# Pages source = orphan branch, path = /
gh api -X PUT repos/<owner>/<repo>/pages \
  -f "source[branch]=<modulo>/refinements-suite-orphan" \
  -f "source[path]=/"
```

Esta branch contiene todo el código del módulo bajo el subfolder `<modulo>/`. Las URLs de Pages tienen prefijo `/<modulo>/` automático.

---

## Release de una nueva versión (PATCH / MINOR / MAJOR)

### 1. Bump version constants

En `<modulo>/shared/shell.js`:
```js
const PROJECT_VERSION = 'vX.Y.Z';   // ← bump aquí
```

Bump cache buster del `shell.js` en todos los HTML del módulo:
```bash
find <modulo>/ -maxdepth 3 -name "*.html" -not -path "*/v[0-9]*/*" \
  -exec sed -i '' 's/shell\.js?v=YYYYMMDDx/shell.js?v=YYYYMMDDy/g' {} \;
```

### 2. Promover CHANGELOG

Editar `<modulo>/CHANGELOG.md`:
- Vaciar la sección `## [Unreleased]`
- Mover el contenido a `## [<modulo>-vX.Y.Z] — YYYY-MM-DD` con resumen

### 3. Commit + push de los cambios

```bash
git add -u
git commit -m "release(vX.Y.Z): <título corto>

<resumen de cambios>"
git push origin HEAD:<rama-PR>
```

### 4. Tag annotated

```bash
git tag -a <modulo>-vX.Y.Z <commit-sha> -m "<modulo> — vX.Y.Z

<resumen para release notes>"
git push origin <modulo>-vX.Y.Z
```

### 5. GitHub Release

```bash
gh release create <modulo>-vX.Y.Z \
  --repo <owner>/<repo> \
  --target <rama-PR> \
  --title "<modulo>-vX.Y.Z — <título>" \
  --notes "$(cat <<'EOF'
# <modulo> · vX.Y.Z
## <subtítulo>

Descripción + highlights + links a docs.
EOF
)"
```

### 6. Snapshot del estado de la versión

Desde la raíz del módulo:
```bash
./scripts/snapshot-version.sh vX.Y.Z
```

El script `snapshot-version.sh` hace `rsync` de `<modulo>/` → `<modulo>/vX.Y.Z/` excluyendo otras carpetas de versión y `scripts/`. Resultado: snapshot completo congelado.

### 7. Sincronizar a la branch orphan (donde Pages sirve)

Pages NO sirve desde la branch del PR — sirve desde la branch orphan. Hay que propagar el snapshot ahí:

```bash
# Worktree temporal en la branch orphan
TMP_WT=/tmp/<modulo>-orphan-sync
rm -rf "$TMP_WT" 2>/dev/null
git fetch origin <modulo>/refinements-suite-orphan
git worktree add "$TMP_WT" origin/<modulo>/refinements-suite-orphan

# Sincronizar TODO el contenido (live + snapshot) desde la PR branch
rsync -a --delete \
  --exclude='.git' \
  --exclude='.DS_Store' \
  <modulo>/ "$TMP_WT/<modulo>/"

# Commit + push a la orphan
cd "$TMP_WT"
git checkout -B <modulo>/refinements-suite-orphan
git add -A
git commit -m "sync: <modulo>/ desde refinements-validation-suite (incluye snapshot vX.Y.Z)"
git push origin <modulo>/refinements-suite-orphan

# Limpiar
cd -
git worktree remove "$TMP_WT" --force
```

### 8. Force Pages rebuild + verificar

```bash
gh api -X POST repos/<owner>/<repo>/pages/builds

# Esperar ~1-2 min, luego verificar
curl -sI "https://naowee-tech.github.io/<repo>/<modulo>/vX.Y.Z/admin/dashboard.html" | head -1
# Esperado: HTTP/2 200
```

### 9. Actualizar título del PR (opcional)

```bash
gh pr edit <PR-NUMBER> --repo <owner>/<repo> \
  --title "release: <Modulo> vX.Y.Z — <título corto>"
```

---

## Version switcher (built-in)

Cada release tiene en el footer un dropdown que:
- Muestra la versión activa con badge `Viendo`
- Fetcha en runtime `api.github.com/repos/<owner>/<repo>/releases` (cache sessionStorage 10 min)
- Lista todas las versiones publicadas con badges `Latest`
- Click navega al snapshot preservando el path actual (ej: `/admin/dashboard.html` → `/v2.0.1/admin/dashboard.html`)
- Fallback elegante si la API falla (rate limit, offline)

El código vive en `<modulo>/shared/shell.js` función `bindVersionSwitcher`. El CSS en `<modulo>/shared/shell.css`.

---

## Setup inicial para un módulo nuevo

Para crear un módulo desde cero con esta arquitectura:

1. **Crear branch orphan** con el contenido bajo `<modulo>/` subfolder:
   ```bash
   git checkout --orphan <modulo>/refinements-suite-orphan
   git rm -rf .
   mkdir -p <modulo>
   # ... agregar archivos del módulo a <modulo>/
   git add <modulo>
   git commit -m "init: <modulo> base"
   git push origin <modulo>/refinements-suite-orphan
   ```

2. **Crear branch de desarrollo (PR)** desde la orphan:
   ```bash
   git checkout -b <modulo>/refinements-validation-suite
   git push origin <modulo>/refinements-validation-suite
   gh pr create --base main --head <modulo>/refinements-validation-suite \
     --title "<modulo>: development branch"
   ```

3. **Configurar Pages** apuntando a la orphan:
   ```bash
   gh api -X PUT repos/<owner>/<repo>/pages \
     -f "source[branch]=<modulo>/refinements-suite-orphan" \
     -f "source[path]=/"
   ```

4. **Copiar archivos esenciales** desde un módulo existente:
   - `scripts/snapshot-version.sh` (ajustar paths internos al nuevo módulo)
   - `CHANGELOG.md` (template con `[Unreleased]`)
   - `RELEASE-PROCESS.md` (este archivo)
   - `shared/shell.js` con el version switcher built-in
   - `shared/shell.css` con los estilos del switcher

5. **Primer release `v1.0.0`** siguiendo los pasos del release process.

---

## Troubleshooting

| Síntoma | Causa probable | Fix |
|---|---|---|
| Snapshot URL `/<modulo>/vX.Y.Z/` retorna 404 | Pages source apunta a la branch del PR, no a orphan | `gh api -X PUT ...pages -f "source[branch]=<modulo>/refinements-suite-orphan"` |
| Live demo serves contenido viejo | Pages cache (CDN delay 1-2 min) | `gh api -X POST .../pages/builds` para force rebuild |
| Version switcher dropdown vacío | GitHub API rate limit | Esperar 1h o autenticar con token PAT |
| Snapshot subdirs 404 pero index 200 | Faltó sincronizar a orphan branch | Repetir paso 7 del release process |
| Cache de browser persiste | HTML cacheado | Hard refresh (`Cmd+Shift+R`) |

---

## Quick checklist (copiar para cada release)

```
[ ] 1. Bump PROJECT_VERSION en shell.js
[ ] 2. Bump cache busters de shell.js en HTMLs
[ ] 3. Promover [Unreleased] → [vX.Y.Z] en CHANGELOG
[ ] 4. Commit + push a PR branch
[ ] 5. Tag annotated <modulo>-vX.Y.Z + push tag
[ ] 6. GitHub Release con notes
[ ] 7. ./scripts/snapshot-version.sh vX.Y.Z
[ ] 8. Commit snapshot + push a PR branch
[ ] 9. Worktree temp + rsync → orphan + commit + push
[ ] 10. gh api POST /pages/builds (force rebuild)
[ ] 11. Verificar curl HTTP/2 200 en snapshot URL
[ ] 12. Actualizar título del PR
[ ] 13. Enviar mensaje a dev team (template en SLACK-MESSAGE.md)
```

---

**Versionado de este documento:** Última actualización 2026-05-19 (proceso establecido tras release v2.0.1 del módulo project).
