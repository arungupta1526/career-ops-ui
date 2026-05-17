#!/usr/bin/env bash
# WS8.1 (v1.38.0) — unified CLI dispatcher (AutoResearchClaw-style).
#
#   career-ops-ui setup    → one-command bootstrap (bin/setup.sh)
#   career-ops-ui init     → choose LLM provider + set its key (interactive)
#   career-ops-ui doctor   → verify env/tooling/keys (reuses /api/health)
#   career-ops-ui run      → launch the server (bin/start.sh)
#   career-ops-ui open     → open + RAISE the dashboard in your browser
#   career-ops-ui help     → this text
#
# One command does the whole chain: `setup` runs install → doctor →
# (unless SKIP_START=1) run. Every verb is also usable standalone.
set -euo pipefail
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WEB_UI="$( cd "$SCRIPT_DIR/.." && pwd )"
VERB="${1:-help}"; shift || true

# Single source of truth for the usage text — a heredoc, so it can never
# leak surrounding shell source the way the old `sed -n` line-scrape did
# (v1.40.0 fix; an off-by-one had printed `set -euo pipefail`).
usage() {
  cat <<'USAGE'
career-ops-ui — unified CLI dispatcher (AutoResearchClaw-style).

  career-ops-ui setup    → one-command bootstrap (bin/setup.sh)
  career-ops-ui init     → choose LLM provider + set its key (interactive)
  career-ops-ui doctor   → verify env/tooling/keys (reuses /api/health)
  career-ops-ui run      → launch the server (bin/start.sh)
  career-ops-ui open     → open + RAISE the dashboard in your browser
  career-ops-ui help     → this text

One command does the whole chain: `setup` runs install → doctor →
(unless SKIP_START=1) run. Every verb is also usable standalone.
USAGE
}

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
  open|dash|focus)
    node "$WEB_UI/scripts/open-dashboard.mjs" "$@"
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    echo "unknown verb: $VERB" >&2
    usage >&2
    exit 2
    ;;
esac
