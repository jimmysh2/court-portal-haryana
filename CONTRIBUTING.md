# Contributing to the Naib Court Portal — Haryana

> **This document is mandatory reading for all developers before making any contribution.**
> The portal handles sensitive judicial data. Following these rules is non-negotiable.

---

## Table of Contents
1. [Getting Started](#1-getting-started)
2. [Branch Workflow](#2-branch-workflow)
3. [Development Rules](#3-development-rules)
4. [Making a Pull Request](#4-making-a-pull-request)
5. [What NOT to Do](#5-what-not-to-do)
6. [Tech Stack Reference](#6-tech-stack-reference)

---

## 1. Getting Started

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

## 2. Branch Workflow

**You are NOT allowed to push directly to `master`.** All changes must go through a Pull Request.

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

## 3. Development Rules

These rules are **enforced during code review**. PRs that violate them will be rejected.

### 3.1 Table & Column Changes — UI Only
**Never** hardcode table or column definitions in JavaScript files.

❌ **Wrong:**
```js
const columns = [{ name: 'FIR Number', slug: 'fir_no', dataType: 'text' }];
```

✅ **Correct:**
Use the **Developer Dashboard → Manage Data Entry Tables** UI to add or modify tables and columns. The system will automatically sync changes to the relevant files.

> The following files are **AUTO-GENERATED**. Do NOT edit them manually:
> - `prisma/table-definitions.js`
> - `prisma/seed-production.js`

---

### 3.2 Localization — No Hardcoded Text
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

### 3.3 Commit Message Format
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

### 3.4 Police Stations & Districts
Do not edit `Disrtrict_PS.csv` directly. Use the **System Management** page in the Developer Dashboard to add or modify districts and police stations. The file will update automatically.

---

## 4. Making a Pull Request

### What to include in your PR description:
```
## What does this PR do?
[Brief description of the change]

## Tables/Columns affected (if any)
[List any structural changes]

## Translations added
[List new keys added to translations.js]

## How to test
[Steps to verify the change works correctly]
```

### Review Process
1. You submit the PR
2. An automated review may flag issues
3. The project owner reviews and either:
   - ✅ **Approves and merges** — your code is now live
   - 💬 **Requests changes** — fix the issues and update your PR
4. Once merged, Render auto-deploys to the live portal

---

## 5. What NOT to Do

| ❌ Never do this | ✅ Do this instead |
|---|---|
| Push directly to `master` | Open a Pull Request |
| Edit auto-generated files manually | Use the Developer Dashboard UI |
| Hardcode text strings | Use `translations.js` and the `t()` hook |
| Share the `.env` file | Request the project owner to share it securely |
| Edit `Disrtrict_PS.csv` directly | Use System Management UI |
| Run `git push --force` | Never force push — ever |

---

## 6. Tech Stack Reference

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
| `prisma/schema.prisma` | Database schema definition |
| `prisma/table-definitions.js` | Auto-generated table structure *(do not edit)* |
| `client/src/locales/translations.js` | All UI text in English and Hindi |
| `client/src/App.jsx` | Frontend routing |
| `server/index.js` | Express server entry point |
| `scripts/auto-sync.js` | Auto-sync engine (runs on every UI table change) |

---

*For questions, contact the project owner before making assumptions in code.*
