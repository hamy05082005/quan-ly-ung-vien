#!/usr/bin/env bash
# Usage: ./install-into-project.sh [KIT_DIR] [TARGET_DIR]
set -euo pipefail
KIT_DIR="${1:-.}"
TARGET_DIR="${2:-.}"
mkdir -p "$TARGET_DIR/docs/templates" "$TARGET_DIR/data" "$TARGET_DIR/.agents/skills" "$TARGET_DIR/.agents/rules"
cp -R "$KIT_DIR/.agents/." "$TARGET_DIR/.agents/"
cp -R "$KIT_DIR/docs/templates/." "$TARGET_DIR/docs/templates/"
cp "$KIT_DIR/docs/README.md" "$TARGET_DIR/docs/" 2>/dev/null || true
cp "$KIT_DIR/CHEATSHEET.md" "$TARGET_DIR/" 2>/dev/null || true
cp "$KIT_DIR/README.md" "$TARGET_DIR/KIT-README.md" 2>/dev/null || true
cp "$KIT_DIR/AGENTS.md" "$TARGET_DIR/AGENTS.md" 2>/dev/null || true
cp "$KIT_DIR/COPYRIGHT.md" "$TARGET_DIR/KIT-COPYRIGHT.md" 2>/dev/null || true
echo "Installed Codex kit into: $(cd "$TARGET_DIR" && pwd)"
echo "Next: cp docs/templates/*.md docs/  then open the project in Codex."
