# PMO Playbook Prototype

FastAPI + Next.js application for editing SOP markdown stored in PostgreSQL and running AI-assisted chat threads. The backend owns all data access and provider toggles. The frontend renders SOP content, allows inline editing, and surfaces chat conversations that will later be powered by LangGraph/RAG.

## Repository layout

- `backend/` – FastAPI service, SQLAlchemy models, and REST endpoints
- `frontend/` – Next.js (App Router) UI with SOP editor and chat pane
- `backend/db/schema.sql` – SQL bootstrap you can run manually against PostgreSQL
- `backend/.env.example` and `frontend/.env.local.example` – Environment variable templates

## Backend (FastAPI)

### Install & run

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install "poetry<2"  # if you want to use Poetry commands
poetry install           # or: pip install -r requirements.txt (generate via `poetry export`)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> **Tip:** If you prefer plain `pip`, run `poetry export -f requirements.txt --output requirements.txt --without-hashes` once, then install from that file.

### Environment variables

Copy `.env.example` to `.env` and adjust:

- `DATABASE_URL` – e.g. `postgresql+psycopg://postgres:postgres@localhost:5432/pmo_playbook`
- `LLM_PROVIDER` – `openai` or `azure`
- `OPENAI_API_KEY`, `OPENAI_MODEL`
- `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT_NAME`

Switching `LLM_PROVIDER` flips the placeholder client; the contract is ready for real provider hooks.

### Database bootstrapping

Run the SQL manually after creating the database:

```bash
psql -d pmo_playbook -f backend/db/schema.sql
```

Tables:

- `sops` – current version of each SOP (JSONB content)
- `sop_history` – append-only snapshots per edit (auto filled on update)
- `chat_threads` & `chat_messages` – persisted conversations, linked to SOPs when available

### API surface

- `GET /api/sops/`, `GET/PUT /api/sops/{id}`, `POST /api/sops/`, `GET /api/sops/{id}/history`
- `GET/POST /api/chat/threads`, `GET /api/chat/threads/{id}`, `POST /api/chat/threads/{id}/messages`
- `GET /health`

SOP updates automatically version-bump and capture the old copy in history. Chat message POSTs create a deterministic placeholder assistant response so the full UI flow works without LLM credentials.

## Frontend (Next.js)

### Install & run

```bash
cd frontend
npm install
npm run dev
```

Set up `frontend/.env.local` with the API origin:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

### UX highlights

- Header buttons list all SOPs; clicking loads the latest version.
- SOP pane renders markdown (with GFM) and has an edit toggle. Saving issues a PUT and refreshes history/versions.
- Chat pane lists threads, supports thread creation, and persists Q&A messages. Placeholder responses are tagged with the current provider selection.

Styling is CSS modules + a simple layout so you can later swap in a design system without refactoring logic.

## Deployment notes

- **Local/dev** – Run FastAPI and PostgreSQL however you like (Docker Compose optional), then `npm run dev` for the frontend.
- **Vercel** – Deploy only the Next.js app. Point `NEXT_PUBLIC_API_BASE_URL` to wherever the FastAPI service lives (Render, Azure App Service, etc.).
- **Kubernetes/self-hosted** – Containerise `backend` (e.g. `uvicorn app.main:app --port 8000`) and wire env secrets + Postgres service. The frontend can also be containerised or still hosted via Vercel.

Future integrations (LangGraph, RAG, observability, auth) slot into the existing service layers (`services/llm_provider.py`, FastAPI dependencies) without breaking the UI contract.
