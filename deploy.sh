#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  🏛️  Naib Court Portal — One-Line Deployment Script
#  Usage:
#    First time:  bash deploy.sh
#    Update only: bash deploy.sh --update
# ═══════════════════════════════════════════════════════════════
set -e

REPO_URL="https://github.com/jimmysh2/court-portal-haryana.git"
APP_DIR="/opt/court-portal"
ENV_FILE="$APP_DIR/.env"

# ── Colour helpers ─────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${GREEN}[✔]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
error()   { echo -e "${RED}[✘]${NC} $1"; exit 1; }

echo ""
echo "═══════════════════════════════════════════════════"
echo "  🏛️  Naib Court Portal — Deployment Script"
echo "═══════════════════════════════════════════════════"
echo ""

# ── 1. Check dependencies ──────────────────────────────────────
info "Checking system dependencies..."
command -v docker  >/dev/null 2>&1 || error "Docker is not installed. Run: curl -fsSL https://get.docker.com | sh"
command -v docker compose version >/dev/null 2>&1 || error "Docker Compose v2 is not available. Update Docker to a recent version."
info "Docker $(docker --version | awk '{print $3}' | tr -d ',')"

# ── 2. Clone or update repo ────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  info "Repository already exists. Pulling latest code..."
  git -C "$APP_DIR" pull origin master
else
  info "Cloning repository to $APP_DIR..."
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

# ── 3. Ensure .env exists ──────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  warn ".env file not found — creating from template."
  cp "$APP_DIR/.env.example" "$ENV_FILE"
  warn "⚠️  IMPORTANT: Edit $ENV_FILE and set your passwords/secrets before continuing."
  warn "   Run:  nano $ENV_FILE"
  warn "   Then re-run this script."
  exit 1
fi

# Validate required env vars are not placeholders
source "$ENV_FILE" 2>/dev/null || true
[ -z "$DB_PASSWORD" ]           && error "DB_PASSWORD is not set in .env"
[ "$DB_PASSWORD" = "replace-me-with-a-strong-password" ] && error "DB_PASSWORD is still the placeholder. Set a real password in .env"
[ -z "$JWT_SECRET" ]            && error "JWT_SECRET is not set in .env"
[ "$JWT_SECRET" = "replace-me-with-a-long-random-string" ] && error "JWT_SECRET is still the placeholder. Set a real secret in .env"

info ".env validated."

# ── 4. Build & start containers ───────────────────────────────
if [ "$1" = "--update" ]; then
  info "Rebuilding and restarting app container only (database data preserved)..."
  docker compose build --no-cache app
  docker compose up -d app
else
  info "Building Docker image (this may take a few minutes on first run)..."
  docker compose build --no-cache
  info "Starting all services..."
  docker compose up -d
fi

# ── 5. Wait for app to be healthy ─────────────────────────────
info "Waiting for the portal to be ready..."
MAX_WAIT=120
ELAPSED=0
until curl -sf http://localhost:${APP_PORT:-3000}/api/health > /dev/null 2>&1; do
  sleep 2
  ELAPSED=$((ELAPSED + 2))
  if [ $ELAPSED -ge $MAX_WAIT ]; then
    error "App did not become healthy in ${MAX_WAIT}s. Check logs: docker compose logs app"
  fi
done

# ── 6. Done ───────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
info "Deployment complete! 🎉"
echo ""
echo "  Portal URL : http://$(hostname -I | awk '{print $1}'):${APP_PORT:-3000}"
echo "  Health     : http://$(hostname -I | awk '{print $1}'):${APP_PORT:-3000}/api/health"
echo ""
echo "  Useful commands:"
echo "    View logs     :  docker compose logs -f app"
echo "    Stop portal   :  docker compose down"
echo "    Update portal :  bash $APP_DIR/deploy.sh --update"
echo "    DB backup     :  docker compose exec app node scripts/backup.js"
echo "═══════════════════════════════════════════════════"
