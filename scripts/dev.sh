#!/usr/bin/env bash
#
# Development Startup — launches the complete local environment.
#
# Topology:
#   Browser → options-prototype (Vite :5173) → /api proxy → Java backend (:3100) → Tradier
#
# Usage:
#   ./scripts/dev.sh          (from workspace root)
#   scripts/dev.sh            (from workspace root)
#
# Both processes are terminated together on Ctrl+C or script exit.
#
set -euo pipefail

WORKSPACE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$WORKSPACE_ROOT/evidence-service-java"
FRONTEND_DIR="$WORKSPACE_ROOT/options-prototype"

# --- Environment ---

# Source root .env for credentials (untracked, operator-specific)
if [ -f "$WORKSPACE_ROOT/.env" ]; then
  set -a
  source "$WORKSPACE_ROOT/.env"
  set +a
fi

# Node (for frontend)
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
elif [ -s "/opt/homebrew/opt/nvm/nvm.sh" ]; then
  . "/opt/homebrew/opt/nvm/nvm.sh"
fi

echo "=== Wheelwright — Development Environment ==="
echo "Java: $(java --version 2>&1 | head -1)"
echo "Node: $(node --version)"
echo ""

# --- Preflight Checks ---

if [ ! -d "$BACKEND_DIR" ]; then
  echo "ERROR: evidence-service-java directory not found at $BACKEND_DIR"
  exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
  echo "ERROR: options-prototype directory not found at $FRONTEND_DIR"
  exit 1
fi

if [ -z "${TRADIER_API_KEY:-}" ]; then
  echo "WARNING: TRADIER_API_KEY not set. Backend will start but cannot acquire evidence."
  echo "         Copy .env.example to .env and add your credential."
  echo ""
fi

# Kill any existing process on port 3100 (leftover from prior run)
EXISTING_PID=$(lsof -ti :3100 2>/dev/null || true)
if [ -n "$EXISTING_PID" ]; then
  echo "[cleanup] Killing existing process on :3100 (PID $EXISTING_PID)"
  kill "$EXISTING_PID" 2>/dev/null || true
  sleep 1
fi

# Install frontend dependencies if needed
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "[frontend] Installing dependencies..."
  (cd "$FRONTEND_DIR" && npm install)
fi

# --- Process Management ---
# Launch both processes. Prefix output for readability.
# Trap ensures both are killed on exit.

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  # Disable errexit inside the trap: a non-zero return from kill/wait on an
  # already-dead process must NEVER abort cleanup before it reaps the backend.
  # (This was the bug: `set -e` aborted cleanup at the frontend `wait` line,
  # so the port-based backend reap below never ran and :3100 stayed held.)
  set +e
  trap - EXIT INT TERM  # prevent re-entrancy

  echo ""
  echo "Shutting down..."

  # Frontend (Vite): kill the tracked pipeline PID. No `wait` — a dead child's
  # non-zero status is irrelevant and must not stop cleanup.
  if [ -n "$FRONTEND_PID" ]; then
    kill "$FRONTEND_PID" 2>/dev/null
  fi
  # Reap anything still bound to the Vite port for good measure.
  local vite_pids
  vite_pids=$(lsof -ti :5173 2>/dev/null)
  [ -n "$vite_pids" ] && kill $vite_pids 2>/dev/null

  # Backend: the tracked PID is the launching pipeline/gradlew, NOT the JVM that
  # actually binds :3100. Gradle bootRun forks a separate JVM, so killing the
  # launcher orphans the app JVM and leaves :3100 held (the bug this fixes).
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null
  fi

  # Authoritative reap: kill whatever actually holds :3100 (survives the gradle
  # process tree). This is the line that guarantees the appliance is stopped.
  local port_pids
  port_pids=$(lsof -ti :3100 2>/dev/null)
  if [ -n "$port_pids" ]; then
    echo "[cleanup] Terminating backend JVM bound to :3100 (PID(s): $port_pids)"
    kill $port_pids 2>/dev/null
    sleep 2
    port_pids=$(lsof -ti :3100 2>/dev/null)
    if [ -n "$port_pids" ]; then
      echo "[cleanup] Force-killing stubborn backend JVM on :3100 (PID(s): $port_pids)"
      kill -9 $port_pids 2>/dev/null
    fi
  fi

  echo "Done."
}

trap cleanup EXIT INT TERM

# Start backend (Java Evidence Appliance)
echo "[backend] Starting Java Evidence Appliance on :3100..."
(cd "$BACKEND_DIR" && exec ./gradlew bootRun --quiet 2>&1 | sed -u 's/^/[backend] /') &
BACKEND_PID=$!

# Give the backend a moment to bind the port
sleep 4

# Start frontend (options-prototype)
echo "[frontend] Starting Vite dev server..."
(cd "$FRONTEND_DIR" && exec npm run dev 2>&1 | sed -u 's/^/[frontend] /') &
FRONTEND_PID=$!

echo ""
echo "=== Both services running ==="
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3100"
echo "  API proxy: /api/* → localhost:3100"
echo ""
echo "Press Ctrl+C to stop both."
echo ""

# Wait forever (until Ctrl+C triggers the trap)
wait
