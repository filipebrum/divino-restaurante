#!/usr/bin/env bash
set -u

APP_DIR="/home/antigravity/divino-restaurante"
cd "$APP_DIR" || exit 1

CHILD_PID=""

cleanup() {
  if [ -n "$CHILD_PID" ]; then
    kill -TERM "$CHILD_PID" 2>/dev/null || true
  fi
  exit 0
}
trap cleanup TERM INT

start_server() {
  fuser -k 3000/tcp 2>/dev/null || true
  npx next start --port 3000 --hostname 0.0.0.0 &
  CHILD_PID=$!
}

start_server

FAILS=0
while true; do
  sleep 5

  if ! kill -0 "$CHILD_PID" 2>/dev/null; then
    echo "[watchdog] next-server exited, restarting..."
    FAILS=0
    start_server
    continue
  fi

  if curl -sf --max-time 3 http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
    FAILS=0
  else
    FAILS=$((FAILS + 1))
    echo "[watchdog] health check failed ($FAILS/2)"
    if [ "$FAILS" -ge 2 ]; then
      echo "[watchdog] next-server hung, killing and restarting..."
      kill -9 "$CHILD_PID" 2>/dev/null || true
      wait "$CHILD_PID" 2>/dev/null || true
      FAILS=0
      start_server
    fi
  fi
done
