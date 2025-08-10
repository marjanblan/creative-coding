#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
git pull --rebase origin main
SLUG="${1:-}"
if [ -z "$SLUG" ]; then
  SLUG="$(ls -1dt sketches/*/ | grep -v '_template' | head -n1 | xargs -n1 basename)"
fi

if [ ! -d "sketches/$SLUG" ]; then
  echo "❌ Folder sketches/$SLUG not found"; exit 1
fi

npm run gallery

git add "sketches/$SLUG" gallery.json README.md || true
MSG="${2:-"feat: add/update $SLUG"}"
if git diff --cached --quiet; then
  echo "ℹ️ Nothing to commit. Up to date."
else
  git commit -m "$MSG"
fi
git push origin main
echo "✅ Deployed: $SLUG"
echo "🌐 Site: https://marjanblan.github.io/creative-coding/"
