#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# snapshot-version.sh — Congela el estado actual de /project/ a
# /project/vX.Y.Z/ para preservar versiones históricas en Pages.
#
# Uso:
#   ./scripts/snapshot-version.sh v2.0.1
#
# Después de ejecutar:
#   1. git add project/vX.Y.Z
#   2. git commit -m "snapshot(vX.Y.Z): freeze para historial"
#   3. git push
#   4. La URL https://naowee-tech.github.io/naowee-test-digitacion/project/vX.Y.Z/
#      queda accesible permanentemente
#
# Doug 19/05/2026
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

VERSION="${1:-}"
if [ -z "$VERSION" ]; then
  echo "❌ Uso: $0 vX.Y.Z (ej. v2.0.1)"
  exit 1
fi
if ! [[ "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "❌ Formato inválido. Debe ser vX.Y.Z (ej. v2.0.1, v3.1.0)"
  exit 1
fi

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="$PROJECT_DIR/$VERSION"

if [ -d "$TARGET" ]; then
  echo "⚠️  $TARGET ya existe."
  read -p "¿Sobrescribir? [y/N] " -n 1 -r
  echo
  if ! [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelado."
    exit 0
  fi
  rm -rf "$TARGET"
fi

echo "📸 Snapshot project/ → project/$VERSION/"
mkdir -p "$TARGET"

# Copia todo project/ a project/vX.Y.Z/ excepto:
#   - Otras carpetas de versión (v[0-9]*/)
#   - scripts/ (no necesario en el snapshot)
#   - .git, .DS_Store (basura)
rsync -a \
  --exclude='v[0-9]*' \
  --exclude='scripts/' \
  --exclude='.git' \
  --exclude='.DS_Store' \
  --exclude='node_modules' \
  "$PROJECT_DIR/" "$TARGET/"

# Conteo de archivos copiados
COUNT=$(find "$TARGET" -type f | wc -l | tr -d ' ')
SIZE=$(du -sh "$TARGET" | cut -f1)

echo "✅ Snapshot creado: $COUNT archivos · $SIZE"
echo ""
echo "Siguiente paso:"
echo "  git add project/$VERSION"
echo "  git commit -m 'snapshot($VERSION): freeze para historial'"
echo "  git push"
echo ""
echo "URL futura (tras push + Pages rebuild):"
echo "  https://naowee-tech.github.io/naowee-test-digitacion/project/$VERSION/index.html"
