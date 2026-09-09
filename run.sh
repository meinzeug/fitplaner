#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

PORT="${PORT:-8090}"

echo "=========================================================="
echo "🥗 FitPlaner - Smarter Ernährungsplaner & Multi-Supermarkt Familien-Manager"
echo "=========================================================="

# Check Python environment
if [ ! -d ".venv" ]; then
    echo "Erstelle Python virtuelles Environment..."
    python3 -m venv .venv
    .venv/bin/pip install --upgrade pip fastapi uvicorn httpx pydantic beautifulsoup4 lxml
fi

# Build frontend if dist doesn't exist
if [ ! -d "frontend/dist" ]; then
    echo "Baue Frontend..."
    npm --prefix frontend install
    npm --prefix frontend run build
fi

LAN_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7}' || hostname -I | awk '{print $1}')
if [ -z "$LAN_IP" ]; then
    LAN_IP="127.0.0.1"
fi

echo "Starte Applikation auf Port $PORT (gebunden an 0.0.0.0)..."
echo "👉 Am Linux-PC (Browser):          http://localhost:$PORT"
echo "📱 Vom Smartphone / Tablet im WLAN: http://$LAN_IP:$PORT"
echo "📲 Android APK Download im WLAN:   http://$LAN_IP:$PORT/FitPlaner.apk"
echo "=========================================================="

exec .venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port "$PORT"
