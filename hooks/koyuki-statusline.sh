#!/usr/bin/env bash
# koyuki — statusline badge. Prints the active mode if the flag file exists,
# combined with Yuuka's when yuuka-skill is active too: [KOYUKI:NIHAHA|YUUKA:LEDGER]
# Reads ~/.claude/.koyuki-active and .yuuka-active (or under $CLAUDE_CONFIG_DIR).
set -euo pipefail

claude_dir="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"

read_flag() {
  [ -f "$1" ] || return 0
  tr -d '[:space:]' < "$1" 2>/dev/null || true
}

upper() { printf '%s' "$1" | tr '[:lower:]' '[:upper:]'; }

badges=()

mode="$(read_flag "$claude_dir/.koyuki-active")"
case "$mode" in
  "")    ;;
  lite)  badges+=("KOYUKI:CHILL") ;;
  full)  badges+=("KOYUKI:NIHAHA") ;;
  ultra) badges+=("KOYUKI:NIHAHAHACK") ;;
  *)     badges+=("KOYUKI:$(upper "$mode")") ;;
esac

ymode="$(read_flag "$claude_dir/.yuuka-active")"
case "$ymode" in
  "")    ;;
  lite)  badges+=("YUUKA:ALLOWANCE") ;;
  full)  badges+=("YUUKA:LEDGER") ;;
  ultra) badges+=("YUUKA:DEFICIT") ;;
  *)     badges+=("YUUKA:$(upper "$ymode")") ;;
esac

[ "${#badges[@]}" -gt 0 ] || exit 0
(IFS='|'; printf '[%s]' "${badges[*]}")
