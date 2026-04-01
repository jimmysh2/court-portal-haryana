# Contributing to the Naib Court Portal — Haryana

> **This document is mandatory reading for all contributors — human and AI — before making any contribution.**
> The portal handles sensitive judicial data. Following these rules is non-negotiable.

---

## Table of Contents
1. [For AI Agents — Read This First](#1-for-ai-agents--read-this-first)
2. [Getting Started](#2-getting-started)
3. [Branch Workflow](#3-branch-workflow)
4. [Development Rules](#4-development-rules)
5. [Making a Pull Request](#5-making-a-pull-request)
6. [What NOT to Do](#6-what-not-to-do)
7. [Tech Stack Reference](#7-tech-stack-reference)

---

## 1. For AI Agents — Read This First

If you are an AI agent (Antigravity or any other), the file **`AGENTS.md`** in the root of this repository contains your **mandatory standing orders**. You must read it before taking any action.

```
AGENTS.md  ← Read this immediately. It is your primary instruction file.
```

### How AI Agents Must Work in This Project

| Rule | Instruction |
|---|---|
| **Branch first** | Always `git checkout -b feature/task-name` before any file edit |
| **No direct push to master** | Push the feature branch only, then open a PR |
| **No hardcoded text** | Every UI string must be in `client/src/locales/translations.js` — both `en` and `hi` |
| **No editing auto-generated files** | `prisma/table-definitions.js`, `prisma/seed-production.js`, `Disrtrict_PS.csv` are READ-ONLY |
| **Commit message format** | Must start with a prefix: `feat:`, `fix:`, `ui:`, `lang:`, `refactor:`, `docs:` |
| **Verify before PR** | Run `git status` and review the checklist in `AGENTS.md` before any commit |

### How the Enforcement Works

`AGENTS.md` is a standard instruction file that Antigravity agents automatically read at the start of every workspace session. This means:
- The AI agent cannot claim it "didn't know" the rules
- Every session starts with the rules already loaded
- Violations will be caught during Pull Request review by the project owner

---

## 2. Getting Started

### Prerequisites
- Node.js v18+
- Git
- Access to the project's `.env` file *(request from the project owner — never stored in this repo)*

### One-Time Setup
```bash
# Clone the repository
git clone https://github.com/jimmysh2/court-portal-haryana.git
cd court-portal-haryana

# Install all dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations against your local DB
npx prisma migrate dev

# Start the development server
npm run dev
```

The app will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

---

## 3. Branch Workflow

**You are NOT allowed to push directly to `master`.** All changes must go through a Pull Request.
This applies to both human developers and AI agents.

### Step 1 — Always start from the latest master
```bash
git checkout master
git pull origin master
```

### Step 2 — Create a feature branch
```bash
git checkout -b feature/your-task-description
```

### Branch Naming Convention

| Type | Format | Example |
|---|---|---|
| New feature | `feature/description` | `feature/table-18-gangster-cases` |
| Bug fix | `fix/description` | `fix/naib-login-crash` |
| UI change | `ui/description` | `ui/report-page-layout` |
| Localization | `lang/description` | `lang/hindi-column-headers` |

### Step 3 — Develop locally
```bash
npm run dev
```

### Step 4 — Commit your work
```bash
git add .
git commit -m "feat: Added Table 18 for high-profile cases with Hindi translations"
git push origin feature/your-task-description
```

### Step 5 — Open a Pull Request on GitHub
Go to the repository on GitHub. You will see a prompt to open a Pull Request from your branch. Fill in the title and description clearly before submitting.

---

## 4. Development Rules

These rules are **enforced during code review**. PRs that violate them will be rejected.

### 4.1 Table & Column Changes — UI Only
**Never** hardcode table or column definitions in JavaScript files.

❌ **Wrong:**
```js
const columns = [{ name: 'FIR Number', slug: 'fir_no', dataType: 'text' }];
```

✅ **Correct:**
Use the **Developer Dashboard → Manage Data Entry Tables** UI to add or modify tables and columns. The system will automatically sync changes to the relevant files via `scripts/auto-sync.js`.

> The following files are **AUTO-GENERATED**. Do NOT edit them manually:
> - `prisma/table-definitions.js`
> - `prisma/seed-production.js`

---

### 4.2 Localization — No Hardcoded Text
Any user-facing text (labels, buttons, messages, headings) must be added to the translation dictionary.

**File:** `client/src/locales/translations.js`

❌ **Wrong:**
```jsx
<button>Save Entry</button>
<label>Name of Accused</label>
```

✅ **Correct:**
```jsx
// 1. Add to translations.js under both 'en' and 'hi' keys
// en: { saveEntry: "Save Entry" }
// hi: { saveEntry: "प्रविष्टि सहेजें" }

// 2. Use the t() hook in your component
const { t } = useLanguage();
<button>{t('saveEntry')}</button>
```

---

### 4.3 Commit Message Format
Use clear, descriptive commit messages.

| Prefix | When to use |
|---|---|
| `feat:` | New feature or table |
| `fix:` | Bug fix |
| `ui:` | Visual/styling changes |
| `lang:` | Translation additions |
| `refactor:` | Code restructuring |
| `docs:` | Documentation only |

---

### 4.4 Police Stations & Districts
Do not edit `Disrtrict_PS.csv` directly. Use the **System Management** page to add or modify districts and police stations. The file will update automatically via `scripts/auto-sync.js`.

---

## 5. Making a Pull Request

### What to include in your PR description:
```
## What does this PR do?
[Brief description of the change]

## Tables/Columns affected (if any)
[List any structural changes made via the Developer Dashboard UI]

## Translations added
[List new keys added to translations.js — both en and hi]

## How to test
[Steps to verify the change works correctly]
```

### Review Process
1. You (or your AI agent) submits the PR
2. The project owner reviews the changes
3. Outcome:
   - ✅ **Approved and merged** — code is live on Render automatically
   - 💬 **Changes requested** — fix the issues and update the PR

---

## 6. What NOT to Do

| ❌ Never do this | ✅ Do this instead |
|---|---|
| Push directly to `master` | Open a Pull Request |
| Edit auto-generated files | Use the Developer Dashboard UI |
| Hardcode text strings | Use `translations.js` and the `t()` hook |
| Share the `.env` file | Request the project owner to share it securely |
| Edit `Disrtrict_PS.csv` directly | Use System Management UI |
| Run `git push --force` | Never force push — ever |
| Commit to `master` directly from an AI agent | Branch → PR → Owner approval |

---

## 7. Tech Stack Reference

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite |
| **Styling** | Vanilla CSS (see `client/src/index.css`) |
| **Backend** | Node.js + Express |
| **Database** | PostgreSQL via Prisma ORM |
| **Auth** | JWT (stored in HTTP-only cookies) |
| **Deployment** | Render (auto-deploys on merge to master) |
| **Localization** | Custom `LanguageContext` with `useLanguage()` hook |

### Key Files to Know
| File | Purpose |
|---|---|
| `AGENTS.md` | **AI agent standing orders** — read first |
| `prisma/schema.prisma` | Database schema definition |
| `prisma/table-definitions.js` | Auto-generated table structure *(do not edit)* |
| `client/src/locales/translations.js` | All UI text in English and Hindi |
| `client/src/App.jsx` | Frontend routing |
| `server/index.js` | Express server entry point |
| `scripts/auto-sync.js` | Auto-sync engine (runs on every UI table/PS change) |
| `client/src/context/LanguageContext.jsx` | Translation hook (`useLanguage`) |

---

*For questions, contact the project owner before making assumptions in code.
AI agents must consult `AGENTS.md` before beginning any task.*
