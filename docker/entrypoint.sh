#!/bin/sh

# 1. Handle Permissions (if PUID/PGID passed)
if [ ! -z "${PUID}" ] && [ ! -z "${PGID}" ]; then
    echo "Setting permissions to ${PUID}:${PGID}..."
    chown -R ${PUID}:${PGID} /app
fi

# 2. Setup Backend Bridge
# The frontend expects the backend at localhost:8000.
# We map internal localhost:8000 -> host.docker.internal:8000 (or custom target).
TARGET_HOST=${BACKEND_HOST:-host.docker.internal}
TARGET_PORT=${BACKEND_PORT:-8000}

echo "Bridge: Forwarding localhost:8000 -> ${TARGET_HOST}:${TARGET_PORT}"

# Start socat in background
# bind=127.0.0.1 ensures it catches requests to 'localhost' made by Vite
socat TCP-LISTEN:8000,fork,bind=127.0.0.1 TCP:${TARGET_HOST}:${TARGET_PORT} &

# 3. Execute Command
exec "$@"
