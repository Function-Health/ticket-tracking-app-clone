#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

if [[ ! -x "$BACKEND/.venv/bin/python" ]]; then
  echo "Backend venv missing. Run:"
  echo "  cd backend && uv venv && uv pip install -e \".[dev]\""
  exit 1
fi

if [[ ! -d "$FRONTEND/node_modules" ]]; then
  echo "Frontend deps missing. Run:"
  echo "  cd frontend && npm install"
  exit 1
fi

cleanup() {
  echo
  echo "→ Stopping…"
  jobs -p | xargs -r kill 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "→ Seeding database (idempotent)…"
( cd "$BACKEND" && .venv/bin/python -m app.seed )

echo "→ Starting backend on :8000…"
( cd "$BACKEND" && exec .venv/bin/uvicorn app.main:app --reload --port 8000 ) &

echo "→ Starting frontend on :3000…"
( cd "$FRONTEND" && exec npm run dev ) &

echo
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo "  Logins:   alice@acme.com / bob@acme.com / carol@beta.com  (password: password)"
echo
echo "Press Ctrl+C to stop both."

wait
