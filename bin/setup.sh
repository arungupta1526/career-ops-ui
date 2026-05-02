#!/usr/bin/env bash
# career-ops-ui — one-command bootstrap.
#
# Sets up BOTH repos (santifer/career-ops + Fighter90/career-ops-ui) in
# the current directory and starts the web UI. Idempotent: safe to re-run.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/Fighter90/career-ops-ui/main/bin/setup.sh | bash
#
# Or after cloning manually:
#   bash web-ui/bin/setup.sh
#
# What it does:
#   1. Clones (or updates) santifer/career-ops into ./career-ops
#   2. Clones (or updates) Fighter90/career-ops-ui into career-ops/web-ui
#   3. Adds /web-ui/ to career-ops/.gitignore (so the parent doesn't track it)
#   4. Installs npm deps for web-ui (only on first run, two deps)
#   5. Starts the server on http://127.0.0.1:4317
#
# Env knobs:
#   PORT              default 4317
#   HOST              default 127.0.0.1
#   CAREER_OPS_DIR    target dir for the parent project (default: ./career-ops)
#   SKIP_START=1      install only, don't launch the server

set -euo pipefail

CAREER_OPS_REPO="${CAREER_OPS_REPO:-https://github.com/santifer/career-ops.git}"
CAREER_OPS_UI_REPO="${CAREER_OPS_UI_REPO:-https://github.com/Fighter90/career-ops-ui.git}"
CAREER_OPS_DIR="${CAREER_OPS_DIR:-career-ops}"
PORT="${PORT:-4317}"
HOST="${HOST:-127.0.0.1}"

bold()  { printf "\033[1m%s\033[0m\n" "$1"; }
green() { printf "\033[32m%s\033[0m\n" "$1"; }
red()   { printf "\033[31m%s\033[0m\n" "$1"; }
dim()   { printf "\033[2m%s\033[0m\n" "$1"; }

bold ""
bold "  career-ops-ui — one-command setup"
bold "  ───────────────────────────────────"
dim   "  parent: $CAREER_OPS_REPO"
dim   "  ui:     $CAREER_OPS_UI_REPO"
dim   "  target: $(pwd)/$CAREER_OPS_DIR"
echo  ""

# ── 0. preflight ──────────────────────────────────────────────────────
need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    red "  error: '$1' is required but not installed."
    [ -n "${2:-}" ] && dim "  → $2"
    exit 1
  fi
}
need git "Install: brew install git  /  apt install git"
need node "Install Node.js >= 18 from https://nodejs.org"
need npm

NODE_MAJOR=$(node -p "parseInt(process.versions.node)")
if [ "$NODE_MAJOR" -lt 18 ]; then
  red "  error: Node.js >= 18 required (found $(node -v))"
  exit 1
fi
green "  ✓ git, node $(node -v), npm $(npm -v)"

# ── 1. parent repo ────────────────────────────────────────────────────
if [ -d "$CAREER_OPS_DIR/.git" ]; then
  green "  ✓ $CAREER_OPS_DIR already cloned — fetching updates"
  ( cd "$CAREER_OPS_DIR" && git fetch --quiet origin && \
    git pull --quiet --ff-only origin main 2>/dev/null || true )
else
  green "  → cloning $CAREER_OPS_REPO"
  git clone --quiet "$CAREER_OPS_REPO" "$CAREER_OPS_DIR"
fi

# ── 2. UI repo as web-ui ──────────────────────────────────────────────
UI_DIR="$CAREER_OPS_DIR/web-ui"
if [ -d "$UI_DIR/.git" ]; then
  green "  ✓ $UI_DIR already cloned — fetching updates"
  ( cd "$UI_DIR" && git fetch --quiet origin && \
    git pull --quiet --ff-only origin main 2>/dev/null || true )
else
  green "  → cloning $CAREER_OPS_UI_REPO into $UI_DIR"
  git clone --quiet "$CAREER_OPS_UI_REPO" "$UI_DIR"
fi

# ── 3. tell parent to ignore web-ui ──────────────────────────────────
GITIGNORE="$CAREER_OPS_DIR/.gitignore"
if ! grep -q "^/web-ui" "$GITIGNORE" 2>/dev/null; then
  echo "" >> "$GITIGNORE"
  echo "# career-ops-ui (separate repo: $CAREER_OPS_UI_REPO)" >> "$GITIGNORE"
  echo "/web-ui/" >> "$GITIGNORE"
  green "  ✓ added /web-ui/ to $GITIGNORE"
else
  green "  ✓ /web-ui/ already in $GITIGNORE"
fi

# ── 4. npm install ────────────────────────────────────────────────────
if [ ! -d "$UI_DIR/node_modules" ]; then
  green "  → installing npm deps (one-time, two packages)"
  ( cd "$UI_DIR" && npm install --silent --no-audit --no-fund )
else
  green "  ✓ npm deps already installed"
fi

# ── 5. show first-run hints ───────────────────────────────────────────
echo ""
bold "  Setup complete."
dim   "  parent project: $(cd "$CAREER_OPS_DIR" && pwd)"
dim   "  web UI:         $(cd "$UI_DIR" && pwd)"
echo  ""

# ── 6. onboarding hints if user files are missing ────────────────────
[ ! -f "$CAREER_OPS_DIR/cv.md" ] && \
  dim "  ! cv.md missing — open the UI and the Health page will guide you."
[ ! -f "$CAREER_OPS_DIR/config/profile.yml" ] && \
  dim "  ! config/profile.yml missing — see career-ops onboarding."

# ── 7. launch ─────────────────────────────────────────────────────────
if [ "${SKIP_START:-0}" = "1" ]; then
  bold "  Skipping start (SKIP_START=1). To launch later:"
  dim   "    bash $UI_DIR/bin/start.sh"
  exit 0
fi

bold "  Launching at http://${HOST}:${PORT}/"
echo  ""
exec env PORT="$PORT" HOST="$HOST" bash "$UI_DIR/bin/start.sh"
