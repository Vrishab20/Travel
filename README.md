# Atlas

Interactive globe travel planning: Next.js + Mapbox frontend, Python FastAPI + LangGraph backend.

## Architecture

```text
Next.js (localhost:3000)
    |  HTTP / SSE
Python FastAPI (localhost:8000)
    |  LangGraph travel agent
Mock flight / hotel / places providers
```

## Backend setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Health check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

## Frontend setup

```bash
npm install
copy .env.example .env.local
```

Set:

```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_token_here
NEXT_PUBLIC_TRAVEL_API_BASE_URL=http://localhost:8000
```

Then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

1. Select origin and destination on the globe.
2. Click **Continue** — creates a trip on the Python backend.
3. Chat with Atlas; the workspace updates from SSE graph events.

## Mock providers

Leave `FLIGHT_PROVIDER`, `HOTEL_PROVIDER`, and `PLACES_PROVIDER` as `mock` in `backend/.env`. No live API keys are required.

Optional LLM (structured preference extraction later):

```env
LLM_PROVIDER=openai
LLM_API_KEY=
LLM_MODEL=gpt-4o-mini
```

Without an LLM key, the agent uses deterministic heuristics + mock providers.

## API surface

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Health |
| POST | `/api/trips` | Initialize trip + LangGraph thread |
| GET | `/api/trips/{trip_id}` | Fetch trip plan |
| POST | `/api/trips/{trip_id}/reset` | Reset trip |
| POST | `/api/travel-agent/messages` | Non-streaming turn |
| POST | `/api/travel-agent/stream` | SSE graph events |

## Project layout

```text
src/                 # Next.js frontend (Mapbox + trip UI)
backend/app/         # FastAPI + LangGraph agent
backend/tests/       # Pytest
```

## Scripts

- `npm run dev` — frontend
- `uvicorn app.main:app --reload --port 8000` — backend (from `backend/`)
- `npm run lint` — ESLint
- `pytest` — backend tests (from `backend/` with venv active)
