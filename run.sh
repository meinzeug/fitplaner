#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

PORT="${PORT:-8090}"

echo "=========================================================="
echo "🥗 FitPlaner - Smarter Ernährungsplaner & Multi-Supermarkt Familien-Manager"
echo "=========================================================="

LAN_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7}' || hostname -I | awk '{print $1}')
if [ -z "$LAN_IP" ]; then
    LAN_IP="127.0.0.1"
fi

# Wenn der systemd-Dienst läuft, informiere und öffne den Browser
if systemctl --user is-active --quiet fitplaner.service 2>/dev/null; then
    echo "🟢 FitPlaner läuft bereits als dauerhafter systemd-Dienst auf Port $PORT!"
    echo "👉 Am Linux-PC (Browser):          http://localhost:$PORT"
    echo "📱 Vom Smartphone / Tablet im WLAN: http://$LAN_IP:$PORT"
    echo "📲 Android APK Download im WLAN:   http://$LAN_IP:$PORT/FitPlaner.apk"
    echo "=========================================================="
    xdg-open "http://localhost:$PORT" 2>/dev/null || true
    echo "💡 Für Live-Logs: fitplaner logs (oder: journalctl --user -u fitplaner.service -f)"
    echo "💡 Für Neustart:  fitplaner restart"
    exit 0
fi

# Falls der Dienst noch nicht installiert oder inaktiv ist, starte lokal im Vordergrund:
if [ ! -d ".venv" ]; then
    echo "Erstelle Python virtuelles Environment..."
    python3 -m venv .venv
    .venv/bin/pip install --upgrade pip fastapi "uvicorn[standard]" httpx pydantic beautifulsoup4 lxml reportlab
fi

if [ ! -d "frontend/dist" ]; then
    echo "Baue Frontend..."
    npm --prefix frontend install
    npm --prefix frontend run build
fi

echo "Starte Applikation auf Port $PORT (gebunden an 0.0.0.0)..."
echo "👉 Am Linux-PC (Browser):          http://localhost:$PORT"
echo "📱 Vom Smartphone / Tablet im WLAN: http://$LAN_IP:$PORT"
echo "📲 Android APK Download im WLAN:   http://$LAN_IP:$PORT/FitPlaner.apk"
echo "=========================================================="

exec .venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port "$PORT"
