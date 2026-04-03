#!/usr/bin/env bash
# =============================================================================
#  deploy.sh  —  Naib Court Portal  |  One-command server deployment
#  Usage:  bash deploy.sh
#  Tested: Ubuntu 20.04 / 22.04 / 24.04 with Docker Engine + Compose plugin
# =============================================================================
set -euo pipefail

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'
info()    { echo -e "${CYAN}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
fatal()   { echo -e "${RED}[ERROR]${RESET} $*" >&2; exit 1; }

echo -e "\n${BOLD}╔══════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║       Naib Court Portal — Deployment Script       ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════════════╝${RESET}\n"

# ── 1. Pre-flight checks ──────────────────────────────────────────────────────
info "Checking prerequisites..."
command -v docker  >/dev/null 2>&1 || fatal "Docker is not installed. See https://docs.docker.com/engine/install/"
docker compose version >/dev/null 2>&1 || fatal "'docker compose' plugin not found. Install it alongside Docker Engine."
success "Docker $(docker --version | awk '{print $3}' | tr -d ',')"

# ── 2. Environment file ───────────────────────────────────────────────────────
if [[ ! -f .env ]]; then
  warn ".env not found — copying from .env.example"
  cp .env.example .env

  echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  warn "IMPORTANT: Edit .env now and set production secrets before continuing."
  echo -e "  Required keys:  DB_PASSWORD  JWT_SECRET  JWT_REFRESH_SECRET"
  echo -e "  Optional:       GD_FOLDER_ID  GD_SERVICE_ACCOUNT_JSON (Google Drive backup)"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n"
  read -rp "Press ENTER when .env is ready (or Ctrl-C to abort)..."
fi

# Quick sanity check — ensure at least JWT_SECRET is not the placeholder
if grep -q "replace-me" .env 2>/dev/null; then
  fatal ".env still contains placeholder secrets. Edit it and re-run."
fi
success ".env loaded"

# ── 3. Pull latest code (if inside a git repo) ────────────────────────────────
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  info "Pulling latest code from origin/master..."
  git pull origin master || warn "git pull failed — continuing with existing code."
fi

# ── 4. Ensure required directories exist ─────────────────────────────────────
info "Creating runtime directories..."
mkdir -p backups uploads
success "backups/ and uploads/ ready"

# ── 5. Build & start services ────────────────────────────────────────────────
info "Building Docker image (this may take a few minutes)..."
docker compose build --no-cache

info "Starting services..."
docker compose up -d

# ── 6. Wait for the app to be healthy ────────────────────────────────────────
info "Waiting for the portal to become healthy..."
MAX_WAIT=90        # seconds
ELAPSED=0
INTERVAL=5

until curl -sf "http://localhost:${PORT:-3000}/api/health" >/dev/null 2>&1; do
  if [[ $ELAPSED -ge $MAX_WAIT ]]; then
    echo ""
    warn "Portal did not respond in ${MAX_WAIT}s — showing logs:"
    docker compose logs --tail=40 app
    fatal "Deployment failed. Check the logs above."
  fi
  printf "."
  sleep $INTERVAL
  ELAPSED=$(( ELAPSED + INTERVAL ))
done
echo ""

# ── 7. Done ───────────────────────────────────────────────────────────────────
PORT_DISPLAY="${PORT:-3000}"
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "YOUR_SERVER_IP")

echo -e "\n${GREEN}${BOLD}╔══════════════════════════════════════════════════╗${RESET}"
echo -e "${GREEN}${BOLD}║          ✅  Deployment Successful!               ║${RESET}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════╝${RESET}\n"
echo -e "  ${BOLD}Portal URL:${RESET}  http://${SERVER_IP}:${PORT_DISPLAY}"
echo -e "  ${BOLD}Health:${RESET}      http://${SERVER_IP}:${PORT_DISPLAY}/api/health\n"
echo -e "  Useful commands:"
echo -e "    ${CYAN}docker compose logs -f app${RESET}       — tail live logs"
echo -e "    ${CYAN}docker compose down${RESET}              — stop all services"
echo -e "    ${CYAN}docker compose restart app${RESET}       — restart app only"
echo -e "    ${CYAN}bash deploy.sh${RESET}                   — redeploy after a git pull\n"
