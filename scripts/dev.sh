#!/usr/bin/env bash
#
# Development Startup — launches the complete local environment.
#
# Topology:
#   Browser → options-prototype (Vite :5173) → /api proxy → evidence-service (:3100) → Tradier
#
# Usage:
#   ./scripts/dev.sh          (from workspace root)
#   scripts/dev.sh            (from workspace root)
#
# Both processes are terminated together on Ctrl+C or script exit.
#
set -euo pipefail

WORKSPACE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$WORKSPACE_ROOT/evidence-service"
FRONTEND_DIR="$WORKSPACE_ROOT/options-prototype"

# --- Environment ---

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
elif [ -s "/opt/homebrew/opt/nvm/nvm.sh" ]; then
  . "/opt/homebrew/opt/nvm/nvm.sh"
fi

echo "=== Options Prototype — Development Environment ==="
echo "Node: $(node --version)"
echo "npm:  $(npm --version)"
echo ""

# --- Preflight Checks ---

if [ ! -d "$BACKEND_DIR" ]; then
  echo "ERROR: evidence-service directory not found at $BACKEND_DIR"
  exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
  echo "ERROR: options-prototype directory not found at $FRONTEND_DIR"
  exit 1
fi

# Kill any existing process on port 3100 (leftover from prior run)
EXISTING_PID=$(lsof -ti :3100 2>/dev/null || true)
if [ -n "$EXISTING_PID" ]; then
  echo "[cleanup] Killing existing process on :3100 (PID $EXISTING_PID)"
  kill "$EXISTING_PID" 2>/dev/null || true
  sleep 1
fi

# Install dependencies if needed
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
  echo "[backend] Installing dependencies..."
  (cd "$BACKEND_DIR" && npm install)
fi

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
  echo ""
  echo "Shutting down..."
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null && wait "$FRONTEND_PID" 2>/dev/null
  [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null && wait "$BACKEND_PID" 2>/dev/null
  echo "Done."
}

trap cleanup EXIT INT TERM

# Start backend (evidence-service)
echo "[backend] Starting evidence-service on :3100..."
(cd "$BACKEND_DIR" && exec npm run dev 2>&1 | sed -u 's/^/[backend] /') &
BACKEND_PID=$!

# Give the backend a moment to bind the port
sleep 2

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
