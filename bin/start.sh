#!/usr/bin/env bash
# career-ops-ui launcher
#
# Layouts supported:
#   1. career-ops/web-ui/         (this repo cloned as web-ui inside career-ops)
#   2. career-ops-ui/             (standalone clone — set CAREER_OPS_ROOT)
#
# Usage:
#   bash bin/start.sh                              # default port 4317
#   PORT=8080 bash bin/start.sh
#   HOST=0.0.0.0 PORT=4317 bash bin/start.sh       # expose on LAN
#   CAREER_OPS_ROOT=/path/to/career-ops bash bin/start.sh
#
# What it does:
#   1. Verifies Node ≥ 18.
#   2. npm install (only on first run, two deps).
#   3. Starts the Express server.
#   4. Opens the browser when ready (macOS / Linux).

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WEB_UI="$( cd "$SCRIPT_DIR/.." && pwd )"

PORT="${PORT:-4317}"
HOST="${HOST:-127.0.0.1}"

# Resolve project root: explicit env var, then ../, then cwd.
if [[ -n "${CAREER_OPS_ROOT:-}" ]]; then
  PROJECT_ROOT="$( cd "$CAREER_OPS_ROOT" && pwd )"
elif [[ -f "$WEB_UI/../cv.md" || -f "$WEB_UI/../portals.yml" ]]; then
  PROJECT_ROOT="$( cd "$WEB_UI/.." && pwd )"
elif [[ -f "$PWD/cv.md" || -f "$PWD/portals.yml" ]]; then
  PROJECT_ROOT="$PWD"
else
  PROJECT_ROOT="$( cd "$WEB_UI/.." && pwd )"
fi

export CAREER_OPS_ROOT="$PROJECT_ROOT"

echo ""
echo "  career-ops-ui"
echo "  ─────────────"
echo "  project: $PROJECT_ROOT"
echo "  ui dir : $WEB_UI"
echo "  bind   : http://${HOST}:${PORT}"
echo ""

# 1. node check
if ! command -v node >/dev/null 2>&1; then
  echo "  error: node not found. Install Node.js >= 18 from https://nodejs.org"
  exit 1
fi

NODE_MAJOR=$(node -p "parseInt(process.versions.node)")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "  error: Node.js >= 18 required (found $(node -v))"
  exit 1
fi

cd "$WEB_UI"

# 2. install deps if missing
if [ ! -d "node_modules" ]; then
  echo "  installing dependencies (one-time)…"
  npm install --silent --no-audit --no-fund
  echo "  done."
  echo ""
fi

# 3. open browser when port responds
open_when_ready() {
  for i in {1..30}; do
    sleep 0.4
    if curl -fsS -o /dev/null "http://${HOST}:${PORT}/api/health" 2>/dev/null; then
      URL="http://${HOST}:${PORT}/"
      if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$URL" 2>/dev/null || true
      elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$URL" 2>/dev/null || true
      fi
      return 0
    fi
  done
}
open_when_ready &

# 4. start server (foreground, so Ctrl-C kills it cleanly)
PORT="$PORT" HOST="$HOST" CAREER_OPS_ROOT="$PROJECT_ROOT" exec node server/index.mjs
