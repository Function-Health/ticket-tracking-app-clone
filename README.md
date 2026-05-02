# Ticket Tracker

A small Linear-style issue tracker. Single workspace per signup; issues with status/priority/assignee/markdown description, comments, list and board views, keyboard shortcuts, command palette.

## Stack

- **Backend** — Python 3.11 · FastAPI · SQLAlchemy · SQLite · JWT auth
- **Frontend** — Next.js 14 (App Router) · TypeScript · Tailwind · @dnd-kit · marked
- **Tests** — pytest (backend) · Playwright (frontend e2e)

## Layout

```
backend/         FastAPI app + tests
frontend/        Next.js app + e2e tests
dev-startup.sh   seeds DB and starts both servers
```

## One-time setup

```bash
# Backend
cd backend && uv venv && uv pip install -e ".[dev]"

# Frontend
cd ../frontend && npm install && npx playwright install chromium
```

## Run

```bash
./dev-startup.sh
```

- App: http://localhost:3000
- API: http://localhost:8000 (interactive docs at `/docs`)

Stop with Ctrl+C.

## Seeded logins

The script runs the seed on every start (idempotent).

| email | password |
|---|---|
| `alice@acme.com` | `password` |
| `bob@acme.com`   | `password` |
| `carol@beta.com` | `password` |

To reset the DB: `rm backend/tickets.db` and restart.

## Tests

```bash
# Backend
cd backend && .venv/bin/pytest

# Frontend e2e — both servers must be running
cd frontend && npx playwright test
```

## Notable shortcuts

`c` create · `/` focus search · `j`/`k` navigate · `e` edit title · `⌘K` command palette
