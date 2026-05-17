#!/usr/bin/env bash
# WS8.1 (v1.38.0) — unified CLI dispatcher (AutoResearchClaw-style).
#
#   career-ops-ui setup    → one-command bootstrap (bin/setup.sh)
#   career-ops-ui init     → choose LLM provider + set its key (interactive)
#   career-ops-ui doctor   → verify env/tooling/keys (reuses /api/health)
#   career-ops-ui run      → launch the server (bin/start.sh)
#   career-ops-ui help     → this text
#
# One command does the whole chain: `setup` runs install → doctor →
# (unless SKIP_START=1) run. Every verb is also usable standalone.
set -euo pipefail
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WEB_UI="$( cd "$SCRIPT_DIR/.." && pwd )"
VERB="${1:-help}"; shift || true

case "$VERB" in
  setup)
    bash "$SCRIPT_DIR/setup.sh" "$@"
    ;;
  run|start)
    bash "$SCRIPT_DIR/start.sh" "$@"
    ;;
  doctor)
    node "$WEB_UI/scripts/doctor.mjs" "$@"
    ;;
  init)
    node "$WEB_UI/scripts/init.mjs" "$@"
    ;;
  help|-h|--help)
    sed -n '2,11p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
    ;;
  *)
    echo "unknown verb: $VERB" >&2
    sed -n '2,11p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//' >&2
    exit 2
    ;;
esac
