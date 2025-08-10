#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
git pull --rebase origin main
npm run gallery
mapfile -t SLUGS < <(git status --porcelain \
  | awk '{print $2}' \
  | grep -E '^sketches/[^/]+/' \
  | cut -d'/' -f2 \
  | grep -v '^_template$' \
  | sort -u)

if [ ${#SLUGS[@]} -eq 0 ]; then
  echo "ℹ️ Нет локальных изменений в sketches/. Нечего деплоить."
  exit 0
fi

echo "🧩 Найдены изменённые скетчи:"
printf ' - %s\n' "${SLUGS[@]}"
for s in "${SLUGS[@]}"; do
  git add -A "sketches/$s"
done
git add -A gallery.json README.md || true

if git diff --cached --quiet; then
  echo "ℹ️ Нечего коммитить. Выходим."
  exit 0
fi
MSG="chore(deploy): update sketches: ${SLUGS[*]}"
git commit -m "$MSG"
git push origin main
echo "✅ Deploy complete."
echo "🌐 Site: https://marjanblan.github.io/creative-coding/"
