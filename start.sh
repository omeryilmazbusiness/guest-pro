#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Load .env
export $(grep -v '^#' "$ROOT/.env" | xargs)

# Override migrations path (absolute, bundle-safe)
export MIGRATIONS_PATH="$ROOT/lib/db/migrations"

echo "=== Building API Server ==="
cd "$ROOT/artifacts/api-server"
pnpm run build

echo "=== Starting API Server on port ${PORT:-3000} ==="
node --enable-source-maps ./dist/index.mjs &
API_PID=$!
echo "API PID: $API_PID"

sleep 3

echo "=== Starting Frontend (Vite) ==="
cd "$ROOT/artifacts/guest-pro"
pnpm run dev &
VITE_PID=$!
echo "Vite PID: $VITE_PID"

echo ""
echo "✅ Services started!"
echo "   API  → http://localhost:${PORT:-3000}"
echo "   App  → http://localhost:5173"
echo ""
echo "Logs: /tmp/api-server.log"
echo "Stop: kill $API_PID $VITE_PID"

wait
