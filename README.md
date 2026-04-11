# Naib Court Portal — Haryana

A judicial data entry and reporting system for Haryana courts. Handles case data entry, report generation, multi-role access control, and district/court management.

---

## Deployment Options

Choose the method that matches your server setup:

| Method | Best For | Prerequisites |
|---|---|---|
| [🪟 Windows Server (install.bat)](#-windows-server-recommended) | Govt Windows Server 2022 | None (auto-installs everything) |
| [🐳 Docker (Linux/Cloud)](#-docker-linux--cloud) | Linux VMs, AWS, Azure, DigitalOcean | Docker & Docker Compose |
| [🛠️ Manual (Development)](#️-manual-local-development) | Local development only | Node.js 20+, PostgreSQL, Git |

---

## 🪟 Windows Server (Recommended)

This is the **primary deployment method** for the Haryana government server (Windows Server 2022). A single script handles everything — no manual setup required.

### What `install.bat` does automatically:
- Installs Node.js, Git, and PostgreSQL silently if not present
- Clones the repository from GitHub
- Generates the `.env` configuration file
- Installs dependencies and builds the React frontend
- Runs Prisma database migrations and seeds initial data
- Configures PM2 to run the app as a background Windows service (auto-starts on reboot)
- Sets up the GitHub Webhook listener for automatic future deployments

### Steps:

1. **Download** `install.bat` from the repository (or copy it to the server)
2. **Double-click** `install.bat` — it will self-elevate to Administrator
3. **Answer the 4 prompts** (press Enter to accept defaults):
   - Git branch to deploy (default: `master`)
   - PostgreSQL password (default: `Admin2026`)
   - App port (default: `4000`)
   - Webhook port (default: `4001`)
4. **Wait** — the script handles everything (~5–10 minutes)
5. **Access the app** at `http://localhost:4000`

### After install — Auto-Deployment via GitHub Webhook:
Any future `git push` to `master` will automatically redeploy the app on the server via `deploy.bat`. Set up the GitHub Webhook in your repository settings pointing to:
```
http://<SERVER_IP>:4001/webhook
```

---

## 🐳 Docker (Linux / Cloud)

Use this for Linux servers, cloud VMs (AWS EC2, Azure, DigitalOcean), or any machine where Docker is available.

**Prerequisite:** [Docker](https://docs.docker.com/engine/install/) and Docker Compose must be installed.

### Option A: Testing / Staging (includes bundled PostgreSQL)

```bash
# 1. Clone the repo
git clone https://github.com/jimmysh2/court-portal-haryana.git
cd court-portal-haryana

# 2. Build and start (app + database together)
docker-compose up --build -d

# 3. App is live at http://localhost:4000
```

> Database migrations run automatically on every container boot. No manual step needed.

To stop: `docker-compose down`  
To view logs: `docker-compose logs -f app`

### Option B: Production (connects to existing PostgreSQL)

```bash
# 1. Clone the repo
git clone https://github.com/jimmysh2/court-portal-haryana.git
cd court-portal-haryana

# 2. Create and configure your .env file
cp .env.server.example .env
# Edit .env with your DB credentials, JWT secrets, CORS_ORIGIN, etc.

# 3. Build and start
docker-compose -f docker-compose.prod.yml up --build -d

# 4. App is live at http://localhost:4000
```

### Updating a Docker deployment:
```bash
git pull origin master
docker-compose -f docker-compose.prod.yml up --build -d
```

---

## 🛠️ Manual (Local Development)

Use this only for active development on your local machine.

### Prerequisites
- Node.js v20+
- PostgreSQL (running locally)
- Git

### Steps

```bash
# 1. Clone
git clone https://github.com/jimmysh2/court-portal-haryana.git
cd court-portal-haryana

# 2. Install dependencies
npm install
cd client && npm install && cd ..

# 3. Configure environment
cp .env.local .env
# Edit .env — set DATABASE_URL to your local PostgreSQL connection string

# 4. Set up database
npx prisma migrate dev
node prisma/seed-production.js

# 5. Run in development mode (hot reload)
npm run dev
```

- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:5173

---

## 🔄 Syncing UI Changes to Git (CRITICAL)

If you make changes via the admin UI (e.g., adding Police Stations or new Data Tables), those changes exist only in your local database. Run the sync script before committing:

```bash
npm run db:sync
git add .
git commit -m "sync: update seed data and district/PS CSV"
git push
```

> [!IMPORTANT]
> Always run `npm run db:sync` before `git commit` when you have made UI-driven database changes. This keeps the repository as the single source of truth.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch rules, PR workflow, and translation guidelines.
