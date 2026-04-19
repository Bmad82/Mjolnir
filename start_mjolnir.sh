#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Install / update dependencies quietly
pip install -q -r requirements.txt

# Load port from .env if present
PORT="${PORT:-8855}"
HOST="${HOST:-0.0.0.0}"
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "⚡ Mjölnir startet auf http://${HOST}:${PORT}"
exec uvicorn main:app --host "$HOST" --port "$PORT" --reload
