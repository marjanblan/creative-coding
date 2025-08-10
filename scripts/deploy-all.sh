#!/bin/sh
set -eu

# В корень репо
cd "$(git rev-parse --show-toplevel)"

# Подтянуть удалённые изменения
git pull --rebase origin main || true

# Собрать список слугов (папки в sketches/, кроме _template)
SLUGS=$(ls -1d sketches/*/ 2>/dev/null | sed -E 's#^sketches/([^/]+)/$#\1#' | grep -v '^_template$' || true)

if [ -z "$SLUGS" ]; then
  echo "⚠️  No sketches found."
  exit 0
fi

# Перегенерим галерею
npm run gallery

# Добавим все скетчи и служебные файлы
for SLUG in $SLUGS; do
  [ -d "sketches/$SLUG" ] && git add "sketches/$SLUG"
done
git add gallery.json README.md || true

# Коммитим только если есть что коммитить
if git diff --cached --quiet; then
  echo "ℹ️  Nothing to commit. Up to date."
else
  git commit -m "chore(deploy): deploy all sketches"
fi

# Пуш
git push origin main
echo "✅ Deployed all sketches"
echo "🌐 https://marjanblan.github.io/creative-coding/"
