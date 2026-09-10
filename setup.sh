#!/usr/bin/env bash
# ==============================================================================
# 🥗 FitPlaner - Smarter Ernährungsplaner & Multi-Supermarkt Familien-Manager
# Lokaler Linux PC Installations- & Setup-Assistent (Dauerhafter Dienst auf 8090)
# ==============================================================================

set -e

COLOR_RESET="\033[0m"
COLOR_BOLD="\033[1m"
COLOR_GREEN="\033[1;32m"
COLOR_BLUE="\033[1;34m"
COLOR_YELLOW="\033[1;33m"
COLOR_RED="\033[1;31m"
COLOR_CYAN="\033[1;36m"

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$ROOT_DIR"

echo -e "${COLOR_CYAN}"
cat << "BANNER"
  ______ _ _   _____  _                       
 |  ____(_) | |  __ \| |                      
 | |__   _| |_| |__) | | __ _ _ __   ___ _ __ 
 |  __| | | __|  ___/| |/ _` | '_ \ / _ \ '__|
 | |    | | |_| |    | | (_| | | | |  __/ |   
 |_|    |_|\__|_|    |_|\__,_|_| |_|\___|_|   
BANNER
echo -e "${COLOR_RESET}"
echo -e "${COLOR_BOLD}🥗 FitPlaner • Smarter Ernährungsplaner & Multi-Supermarkt Familien-Manager${COLOR_RESET}"
echo -e "Dauerhafte Linux-PC Installation (Port 8090, Autostart & Persistenz)"
echo "------------------------------------------------------------------"

# 1. System-Prüfungen
echo -e "\n${COLOR_BLUE}[1/6] Überprüfe System-Voraussetzungen...${COLOR_RESET}"

if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo -e "${COLOR_YELLOW}⚠️ Hinweis: Dieses Setup-Skript ist für Linux optimiert. Dein Betriebssystem meldet: $OSTYPE.${COLOR_RESET}"
fi

if ! command -v python3 &> /dev/null; then
    echo -e "${COLOR_RED}❌ Fehler: python3 wurde nicht gefunden!${COLOR_RESET}"
    echo "Bitte installiere Python 3 mit: sudo apt install python3 python3-venv python3-pip"
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo -e "${COLOR_GREEN}✓ Python gefunden: Version $PYTHON_VERSION${COLOR_RESET}"

# Node & npm Check
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo -e "${COLOR_YELLOW}⚠️ Node.js / npm nicht gefunden.${COLOR_RESET}"
    echo "Falls das Frontend bereits gebaut ist (frontend/dist), kann die App trotzdem laufen."
    HAS_NODE=false
else
    NODE_VERSION=$(node -v)
    NPM_VERSION=$(npm -v)
    echo -e "${COLOR_GREEN}✓ Node.js ($NODE_VERSION) & npm ($NPM_VERSION) gefunden.${COLOR_RESET}"
    HAS_NODE=true
fi

# 2. Python Virtual Environment (.venv)
echo -e "\n${COLOR_BLUE}[2/6] Richte Python-Umgebung ein (.venv)...${COLOR_RESET}"
if [ ! -d ".venv" ] || ! .venv/bin/pip --version &>/dev/null; then
    echo "Erstelle isoliertes virtuelles Python Environment in $ROOT_DIR/.venv..."
    rm -rf .venv
    python3 -m venv .venv || {
        echo -e "${COLOR_RED}❌ Fehler beim Erstellen der venv! Möglicherweise fehlt python3-venv.${COLOR_RESET}"
        echo "Installiere es mit: sudo apt install python3-venv"
        exit 1
    }
fi

echo "Installiere & aktualisiere Python-Abhängigkeiten (FastAPI, Uvicorn, Pydantic, etc.)..."
.venv/bin/pip install --quiet --upgrade pip
if [ -f "requirements.txt" ]; then
    .venv/bin/pip install --quiet -r requirements.txt
else
    .venv/bin/pip install --quiet fastapi "uvicorn[standard]" pydantic httpx beautifulsoup4 lxml reportlab qrcode
fi
echo -e "${COLOR_GREEN}✓ Python-Umgebung & Abhängigkeiten erfolgreich installiert.${COLOR_RESET}"

# 3. Frontend Build
echo -e "\n${COLOR_BLUE}[3/6] Richte Web-Frontend ein...${COLOR_RESET}"
if [ "$HAS_NODE" = true ]; then
    echo "Baue Frontend-Produktions-Bundle..."
    npm --prefix frontend install --quiet
    node frontend/scripts/ensure-binding.cjs 2>/dev/null || true
    npm --prefix frontend run build
    echo -e "${COLOR_GREEN}✓ Frontend erfolgreich mit Vite kompiliert (frontend/dist).${COLOR_RESET}"
else
    if [ -d "frontend/dist" ]; then
        echo -e "${COLOR_GREEN}✓ Vorhandenes Frontend-Build in frontend/dist wird verwendet.${COLOR_RESET}"
    else
        echo -e "${COLOR_RED}❌ Fehler: frontend/dist fehlt und npm ist nicht installiert!${COLOR_RESET}"
        echo "Bitte installiere Node.js & npm, um das Frontend zu erstellen."
        exit 1
    fi
fi

# 4. Daten-Verzeichnis & Persistenz sicherstellen
echo -e "\n${COLOR_BLUE}[4/6] Initialisiere persistente Datenspeicher...${COLOR_RESET}"
mkdir -p "$ROOT_DIR/backend/data"
chmod 755 "$ROOT_DIR/backend/data"
echo -e "${COLOR_GREEN}✓ Persistentes Verzeichnis 'backend/data/' bereit (Einstellungen, Profile, Vorräte bleiben dauerhaft erhalten).${COLOR_RESET}"

# 5. Dauerhafter Systemd-Hintergrunddienst (Port 8090, Autostart bei PC-Boot)
echo -e "\n${COLOR_BLUE}[5/6] Richte dauerhaften Systemd-Hintergrunddienst ein...${COLOR_RESET}"
SYSTEMD_USER_DIR="$HOME/.config/systemd/user"
mkdir -p "$SYSTEMD_USER_DIR"

SERVICE_FILE="$SYSTEMD_USER_DIR/fitplaner.service"
cat > "$SERVICE_FILE" << SERVICETOKEN
[Unit]
Description=FitPlaner - Smarter Ernährungsplaner & Multi-Supermarkt Familien-Manager (Port 8090)
After=network.target

[Service]
Type=simple
WorkingDirectory=$ROOT_DIR
ExecStart=$ROOT_DIR/.venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8090
Restart=always
RestartSec=3
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=default.target
SERVICETOKEN

# Port 8090 freimachen, falls dort noch ein manueller Prozess läuft
if command -v fuser &>/dev/null; then
    fuser -k 8090/tcp 2>/dev/null || true
fi

# Systemd User Daemon neu laden, Dienst aktivieren und starten
systemctl --user daemon-reload
systemctl --user enable fitplaner.service
systemctl --user restart fitplaner.service

# Linger für den Benutzer aktivieren, damit der Dienst auch ohne aktive GUI-Sitzung / nach Reboot läuft
loginctl enable-linger "$USER" 2>/dev/null || true

# Warte kurz und prüfe, ob der Dienst aktiv ist
sleep 2
if systemctl --user is-active --quiet fitplaner.service; then
    echo -e "${COLOR_GREEN}✓ systemd-Dienst 'fitplaner.service' läuft aktiv auf Port 8090!${COLOR_RESET}"
    echo -e "${COLOR_GREEN}✓ Autostart bei jedem PC-Boot ist aktiviert.${COLOR_RESET}"
else
    echo -e "${COLOR_YELLOW}⚠️ Status des Dienstes:${COLOR_RESET}"
    systemctl --user status fitplaner.service --no-pager || true
fi

# 6. Desktop- & CLI-Integration
echo -e "\n${COLOR_BLUE}[6/6] Richte Desktop-Starter & CLI-Befehl ein...${COLOR_RESET}"
chmod +x run.sh setup.sh 2>/dev/null || true

# Desktop Starter (~/.local/share/applications/fitplaner.desktop)
APP_DIR="$HOME/.local/share/applications"
ICON_DIR="$HOME/.local/share/icons"
BIN_DIR="$HOME/.local/bin"
mkdir -p "$APP_DIR" "$ICON_DIR" "$BIN_DIR" 2>/dev/null || true

ICON_PATH="$ICON_DIR/fitplaner.svg"
if [ -f "frontend/public/favicon.svg" ]; then
    cp "frontend/public/favicon.svg" "$ICON_PATH" 2>/dev/null || true
fi

DESKTOP_FILE="$APP_DIR/fitplaner.desktop"
cat > "$DESKTOP_FILE" << DESKTOPTOKEN
[Desktop Entry]
Version=1.0
Type=Application
Name=FitPlaner
Comment=Smarter Ernährungsplaner, Multi-Supermarkt Familien-Manager & Einkaufsliste
Exec=xdg-open http://localhost:8090
Icon=$ICON_PATH
Terminal=false
Categories=Utility;Office;Food;
StartupNotify=true
DESKTOPTOKEN
chmod +x "$DESKTOP_FILE" 2>/dev/null || true
echo -e "${COLOR_GREEN}✓ Desktop-Starter erstellt: $DESKTOP_FILE (im Anwendungsmenü auffindbar)${COLOR_RESET}"

# CLI Helper (~/.local/bin/fitplaner)
CLI_FILE="$BIN_DIR/fitplaner"
cat > "$CLI_FILE" << 'CLITOKEN'
#!/usr/bin/env bash
# FitPlaner CLI Steuerungs-Tool
case "$1" in
    start)
        systemctl --user start fitplaner.service
        echo "FitPlaner Dienst gestartet."
        ;;
    stop)
        systemctl --user stop fitplaner.service
        echo "FitPlaner Dienst gestoppt."
        ;;
    restart)
        systemctl --user restart fitplaner.service
        echo "FitPlaner Dienst neu gestartet."
        ;;
    status)
        systemctl --user status fitplaner.service
        ;;
    logs)
        journalctl --user -u fitplaner.service -f
        ;;
    open)
        xdg-open "http://localhost:8090" 2>/dev/null || true
        ;;
    *)
        echo "FitPlaner Steuerungs-Befehle:"
        echo "  fitplaner open     - Öffnet FitPlaner direkt im Standard-Browser"
        echo "  fitplaner status   - Zeigt den aktuellen Dienst-Status (Port 8090)"
        echo "  fitplaner logs     - Zeigt Live-Logs des Servers"
        echo "  fitplaner restart  - Startet den Hintergrunddienst neu"
        echo "  fitplaner stop     - Beendet den Hintergrunddienst"
        echo "  fitplaner start    - Startet den Hintergrunddienst"
        ;;
esac
CLITOKEN
chmod +x "$CLI_FILE" 2>/dev/null || true
echo -e "${COLOR_GREEN}✓ CLI-Befehl erstellt: $CLI_FILE (z.B. 'fitplaner status', 'fitplaner logs')${COLOR_RESET}"

# LAN-IP ermitteln
LAN_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7}' || hostname -I | awk '{print $1}')
if [ -z "$LAN_IP" ]; then
    LAN_IP="127.0.0.1"
fi

echo -e "\n${COLOR_GREEN}==================================================================${COLOR_RESET}"
echo -e "${COLOR_GREEN}${COLOR_BOLD}🎉 FitPlaner ist dauerhaft auf deinem Linux-PC installiert!${COLOR_RESET}"
echo -e "${COLOR_GREEN}==================================================================${COLOR_RESET}"
echo ""
echo -e "🟢 ${COLOR_BOLD}Dienst-Status:${COLOR_RESET} Läuft dauerhaft im Hintergrund als systemd-Service"
echo -e "💾 ${COLOR_BOLD}Persistenz:${COLOR_RESET} Alle Einstellungen, Vorräte, Profile & Pläne bleiben nach Reboot erhalten"
echo -e "🔄 ${COLOR_BOLD}Autostart:${COLOR_RESET} Startet automatisch bei jedem Rechner-Boot"
echo ""
echo -e "🌐 ${COLOR_BOLD}Im Browser öffnen:${COLOR_RESET}"
echo -e "    👉 ${COLOR_CYAN}http://localhost:8090${COLOR_RESET}"
echo ""
echo -e "📱 ${COLOR_BOLD}Vom Smartphone / Tablet im gemeinsamen WLAN:${COLOR_RESET}"
echo -e "    👉 ${COLOR_GREEN}${COLOR_BOLD}http://$LAN_IP:8090${COLOR_RESET}"
echo ""
echo -e "📲 ${COLOR_BOLD}Android APK direkt laden & installieren:${COLOR_RESET}"
echo -e "    Im Handy-Browser: ${COLOR_CYAN}http://$LAN_IP:8090/FitPlaner.apk${COLOR_RESET}"
echo ""
echo -e "🛠️  ${COLOR_BOLD}Dienst verwalten:${COLOR_RESET}"
echo -e "    Status:   ${COLOR_BOLD}systemctl --user status fitplaner.service${COLOR_RESET}  oder  ${COLOR_BOLD}fitplaner status${COLOR_RESET}"
echo -e "    Logs:     ${COLOR_BOLD}journalctl --user -u fitplaner.service -f${COLOR_RESET}  oder  ${COLOR_BOLD}fitplaner logs${COLOR_RESET}"
echo -e "    Neustart: ${COLOR_BOLD}systemctl --user restart fitplaner.service${COLOR_RESET} oder  ${COLOR_BOLD}fitplaner restart${COLOR_RESET}"
echo "------------------------------------------------------------------"
