#!/usr/bin/env bash
# ==============================================================================
# 🥗 FitPlaner - Netto & NP Ernährungsplaner & Familien-Manager
# Lokaler Linux PC Installations- & Setup-Assistent
# ==============================================================================

set -e

# Farben für ansprechende Terminal-Ausgabe
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
cat << "EOF"
  ______ _ _   _____  _                       
 |  ____(_) | |  __ \| |                      
 | |__   _| |_| |__) | | __ _ _ __   ___ _ __ 
 |  __| | | __|  ___/| |/ _` | '_ \ / _ \ '__|
 | |    | | |_| |    | | (_| | | | |  __/ |   
 |_|    |_|\__|_|    |_|\__,_|_| |_|\___|_|   
EOF
echo -e "${COLOR_RESET}"
echo -e "${COLOR_BOLD}🥗 FitPlaner • Netto & NP Ernährungsplaner & Familien-Manager${COLOR_RESET}"
echo -e "Installations- und Einrichtungs-Assistent für Linux (Ubuntu, Debian, Fedora, Arch)"
echo "------------------------------------------------------------------"

# 1. System-Prüfungen
echo -e "\n${COLOR_BLUE}[1/5] Überprüfe System-Voraussetzungen...${COLOR_RESET}"

# Linux OS Check
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo -e "${COLOR_YELLOW}⚠️ Hinweis: Dieses Setup-Skript ist für Linux optimiert. Dein Betriebssystem meldet: $OSTYPE.${COLOR_RESET}"
fi

# Python 3 Check
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
    echo "Für Frontend-Änderungen installiere Node.js: sudo apt install nodejs npm"
    HAS_NODE=false
else
    NODE_VERSION=$(node -v)
    NPM_VERSION=$(npm -v)
    echo -e "${COLOR_GREEN}✓ Node.js ($NODE_VERSION) & npm ($NPM_VERSION) gefunden.${COLOR_RESET}"
    HAS_NODE=true
fi

# 2. Python Virtual Environment (.venv)
echo -e "\n${COLOR_BLUE}[2/5] Richte Python-Umgebung ein (.venv)...${COLOR_RESET}"
if [ ! -d ".venv" ]; then
    echo "Erstelle isoliertes virtuelles Python Environment in $ROOT_DIR/.venv..."
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
    .venv/bin/pip install --quiet fastapi "uvicorn[standard]" pydantic httpx beautifulsoup4 lxml
fi
echo -e "${COLOR_GREEN}✓ Python-Umgebung & Abhängigkeiten erfolgreich installiert.${COLOR_RESET}"

# 3. Frontend Build
echo -e "\n${COLOR_BLUE}[3/5] Richte Web-Frontend ein...${COLOR_RESET}"
if [ "$HAS_NODE" = true ]; then
    echo "Installiere npm-Pakete und baue Produktions-Bundle..."
    npm --prefix frontend install --quiet
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

# 4. Berechtigungen & Desktop-Integration
echo -e "\n${COLOR_BLUE}[4/5] Richte Linux-Desktop-Integration & Berechtigungen ein...${COLOR_RESET}"
chmod +x run.sh setup.sh 2>/dev/null || true

# Desktop Starter erstellen (~/.local/share/applications/fitplaner.desktop)
APP_DIR="$HOME/.local/share/applications"
ICON_DIR="$HOME/.local/share/icons"
mkdir -p "$APP_DIR" "$ICON_DIR" 2>/dev/null || true

ICON_PATH="$ICON_DIR/fitplaner.svg"
if [ -f "frontend/public/favicon.svg" ]; then
    cp "frontend/public/favicon.svg" "$ICON_PATH" 2>/dev/null || true
fi

DESKTOP_FILE="$APP_DIR/fitplaner.desktop"
cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=FitPlaner (Netto & NP)
Comment=Ernährungsplaner, Familien-Manager, Barcode-Scanner & Tellertrick
Exec=bash -c "cd '$ROOT_DIR' && ./run.sh"
Icon=$ICON_PATH
Terminal=true
Categories=Utility;Office;Food;
StartupNotify=true
EOF
chmod +x "$DESKTOP_FILE" 2>/dev/null || true
echo -e "${COLOR_GREEN}✓ Desktop-Starter erstellt: $DESKTOP_FILE (im Anwendungsmenü auffindbar)${COLOR_RESET}"

# 5. Integritäts- und Selbsttest
echo -e "\n${COLOR_BLUE}[5/5] Führe automatisierten Selbsttest durch...${COLOR_RESET}"
TEST_OUTPUT=$(.venv/bin/python3 -m unittest discover backend/tests 2>&1)
if echo "$TEST_OUTPUT" | grep -q "OK"; then
    TEST_COUNT=$(echo "$TEST_OUTPUT" | grep -o 'Ran [0-9]* tests' | awk '{print $2}')
    echo -e "${COLOR_GREEN}✓ Alle $TEST_COUNT Selbsttests erfolgreich bestanden!${COLOR_RESET}"
else
    echo -e "${COLOR_YELLOW}⚠️ Hinweis beim Selbsttest:${COLOR_RESET}"
    echo "$TEST_OUTPUT"
fi

# LAN-IP ermitteln
LAN_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7}' || hostname -I | awk '{print $1}')
if [ -z "$LAN_IP" ]; then
    LAN_IP="127.0.0.1"
fi

# Firewall-Hinweis (UFW / firewalld)
FW_HINT=""
if command -v ufw &> /dev/null; then
    if sudo -n ufw status 2>/dev/null | grep -q "Status: active"; then
        FW_HINT="⚠️ UFW ist aktiv. Falls dein Handy keine Verbindung bekommt: sudo ufw allow 8090/tcp"
    fi
fi

echo -e "\n${COLOR_GREEN}==================================================================${COLOR_RESET}"
echo -e "${COLOR_GREEN}${COLOR_BOLD}🎉 FitPlaner wurde erfolgreich auf deinem Linux-PC installiert!${COLOR_RESET}"
echo -e "${COLOR_GREEN}==================================================================${COLOR_RESET}"
echo ""
echo -e "▶️  ${COLOR_BOLD}App jetzt starten:${COLOR_RESET}"
echo -e "    ${COLOR_CYAN}cd $ROOT_DIR && ./run.sh${COLOR_RESET}"
echo ""
echo -e "🌐 ${COLOR_BOLD}Lokaler Aufruf am Linux-PC (Browser):${COLOR_RESET}"
echo -e "    ${COLOR_CYAN}http://localhost:8090${COLOR_RESET}"
echo ""
echo -e "📱 ${COLOR_BOLD}Vom Smartphone / Tablet im gemeinsamen WLAN:${COLOR_RESET}"
echo -e "    👉 ${COLOR_GREEN}${COLOR_BOLD}http://$LAN_IP:8090${COLOR_RESET}"
echo -e "    (Frontend & Backend sind auf 0.0.0.0 gebunden und im gesamten WLAN erreichbar)"
echo ""
echo -e "📲 ${COLOR_BOLD}Android APK direkt laden & installieren:${COLOR_RESET}"
echo -e "    Im Handy-Browser: ${COLOR_CYAN}http://$LAN_IP:8090/FitPlaner.apk${COLOR_RESET}"
echo -e "    Oder lokal: ${COLOR_CYAN}$ROOT_DIR/FitPlaner.apk${COLOR_RESET}"
echo ""
if [ -n "$FW_HINT" ]; then
    echo -e "${COLOR_YELLOW}$FW_HINT${COLOR_RESET}\n"
fi
echo -e "💡 ${COLOR_BOLD}Tipp:${COLOR_RESET} Du kannst die App ab sofort auch direkt über dein Linux-Startmenü"
echo -e "   unter dem Namen ${COLOR_BOLD}\"FitPlaner (Netto & NP)\"${COLOR_RESET} aufrufen!"
echo "------------------------------------------------------------------"

