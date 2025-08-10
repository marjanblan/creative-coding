#!/bin/bash
set -e

echo "🔎 Git status (before):"
git status --short

# --- Auto-commit local changes before pulling ---
if [ -n "$(git status --porcelain)" ]; then
  echo "💾 Staging local changes..."
  git add -A
  git commit -m "auto: save local changes before sync" || true
fi

# --- Pull latest changes with rebase ---
echo "⬇️  Pull (rebase)..."
git pull --rebase origin main

echo "✅ Sync complete!"
#!/usr/bin/env bash
set -euo pipefail
echo "🔎 Git status (before):"
git status -s || true
echo
echo "⬇️  Pull (rebase)..."
git pull --rebase origin main || {
  echo "❌ Pull failed. Resolve conflicts, then run again: scripts/sync.sh"
  exit 1
}
if [ ! -f .gitignore ] || ! grep -qE '(^|/)\.DS_Store$' .gitignore; then
  echo ".DS_Store" >> .gitignore
fi
if [ ! -f .gitignore ] || ! grep -qE '(^|/)\.DS_Store$' .gitignore; then
  echo ".DS_Store" >> .gitignore
fi
echo "🧩 Generate gallery..."
npm run gallery || echo "ℹ️  Skipped gallery (no script?)"
echo "➕ Stage changes..."
git add -A

if git diff --cached --quiet; then
  echo "ℹ️  Nothing to commit. Up to date."
  echo "🌐 Site: https://marjanblan.github.io/creative-coding/"
  exit 0
fi
	COUNT_ADDED=$(git diff --cached --name-only --diff-filter=A | wc -l | tr -d ' ')
COUNT_MOD=$(git diff --cached --name-only --diff-filter=M | wc -l | tr -d ' ')
COUNT_DEL=$(git diff --cached --name-only --diff-filter=D | wc -l | tr -d ' ')
STAMP=$(date +"%Y-%m-%d %H:%M")

MSG="sync: ${COUNT_ADDED} add, ${COUNT_MOD} mod, ${COUNT_DEL} del (${STAMP})"
echo "📝 Commit: $MSG"
git commit -m "$MSG"
echo "⬆️  Push..."
git push origin main
echo "✅ Done."
echo "🌐 Site: https://marjanblan.github.io/creative-coding/"
