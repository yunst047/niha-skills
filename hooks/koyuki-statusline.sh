#!/usr/bin/env bash
# koyuki — statusline badge. Prints the active mode if the flag file exists.
# Reads ~/.claude/.koyuki-active (or $CLAUDE_CONFIG_DIR/.koyuki-active).
set -euo pipefail

claude_dir="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
flag="$claude_dir/.koyuki-active"

[ -f "$flag" ] || exit 0

mode="$(tr -d '[:space:]' < "$flag" 2>/dev/null || true)"
case "$mode" in
  lite)  label="CHILL" ;;
  full)  label="NIHAHA" ;;
  ultra) label="NIHAHAHACK" ;;
  crack) label="CRACK" ;;
  "")    exit 0 ;;
  *)     label="$(printf '%s' "$mode" | tr '[:lower:]' '[:upper:]')" ;;
esac

printf '[KOYUKI:%s]' "$label"
