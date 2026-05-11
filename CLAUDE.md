# ER Queue System

## Project overview

A real-time waiting time and queue tracking system for hospital Emergency Rooms in Romania. Patients arriving at the ER currently have no information about how long they'll wait. This system surfaces that information through public displays in the waiting room, personal QR-code links for patients, and a staff dashboard for queue management.

**Status:** Early prototype / learning project
**Target deployment:** Pilot with one Romanian hospital (TBD), runs on-premises (Raspberry Pi or small Linux box)

## Goals and constraints

- **No personal health data** in the prototype — only triage level and timestamps. This keeps the project outside GDPR/Romanian health data regulation scope for the pilot.
- **Nurse-fed input** is intentional. Sensor-based or fully automated capture is out of scope for v1.
- **Wait estimates, not promises.** The UI shows brackets ("~15 min", "~45 min") rather than exact times to manage patient expectations without creating anxiety or liability.
- **Triage system:** Romanian ERs use the 5-level triage system (*triaj pe 5 niveluri*). Level 1 = immediate (red), Level 5 = non-urgent (blue/white).

## Tech stack

- **Backend:** Python 3.11+, FastAPI, SQLAlchemy, Pydantic
- **Database:** SQLite for the prototype, PostgreSQL planned for production
- **Frontend:** React 18 + Vite (plain JavaScript, not TypeScript for now)
- **Deployment target:** Docker Compose on a local hospital machine
- **Dev environment:** macOS, CLion as primary editor, Python venv for isolation

## Architecture

Three layers:

1. **Input layer** — nurse check-in and discharge terminals (React forms)
2. **Core logic** — priority queue engine, wait time estimator, SQLite storage
3. **Output layer** — public waiting room screen, patient QR/link, staff dashboard

Frontend and backend communicate over HTTP/JSON. They run as separate processes and are deliberately decoupled.

## Project structure

```
er-queue-system/
├── backend/
│   ├── main.py              # FastAPI app entry, route registration
│   ├── models.py            # SQLAlchemy ORM models (Patient, ServiceTime)
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── queue_logic.py       # Priority sorting + wait time estimation
│   ├── database.py          # SQLite connection, session management
│   ├── requirements.txt
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── NurseCheckIn.jsx
│   │   │   ├── PublicDisplay.jsx
│   │   │   └── StaffDashboard.jsx
│   │   ├── components/
│   │   ├── api.js           # All fetch() calls live here
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Data model

Two core tables, kept deliberately minimal:

```python
class Patient:
    id: str (UUID)
    arrival_time: datetime
    triage_level: int  # 1-5
    status: str  # "waiting" | "in_treatment" | "discharged"
    treatment_start_time: datetime | None
    discharge_time: datetime | None

class ServiceTimeHistory:
    triage_level: int
    avg_minutes: float
    sample_count: int
    # Updated on each discharge using a rolling average
```

No patient names, no medical details, no contact info. The QR code links to a page identified only by the patient's UUID.

## Wait time estimation

The core algorithm:

```
estimated_wait(patient) =
    sum(avg_service_time[p.triage_level] for p in queue
        if p.priority_higher_or_equal(patient))
    / n_doctors_available
```

A patient ahead in the queue is one who either:
- Has a lower triage level number (higher priority), OR
- Has the same level but earlier arrival time

Service times are computed per triage level from historical discharges, stored as a rolling average. Patients currently in treatment count partially (subtract elapsed time from their expected service time).

## API endpoints

Minimum surface for v1:

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/patients/check-in` | Nurse registers a new patient |
| POST | `/api/patients/{id}/start-treatment` | Nurse moves patient to in-treatment |
| POST | `/api/patients/{id}/discharge` | Nurse marks patient as seen |
| GET | `/api/queue/public` | Anonymized counts + avg waits per level (public screen) |
| GET | `/api/patients/{id}/status` | Single patient's queue position + estimate (QR link) |
| GET | `/api/dashboard/staff` | Full queue with timestamps (auth-protected) |

## Conventions

- **Python:** PEP 8, `snake_case`, type hints required on all function signatures.
- **JavaScript:** Modern ES6+, `camelCase` for variables, functional React components with hooks (no class components).
- **JSON over the wire:** `snake_case` keys to match the Python backend. Don't auto-convert.
- **API base URL** lives in `frontend/src/api.js` as a single constant — never hardcoded across files.
- **Time:** Always store and transmit UTC. Format for display only at the rendering layer.
- **Errors:** Backend returns proper HTTP status codes with `{"detail": "..."}` bodies. Frontend surfaces these to the nurse in plain Romanian.

## What I'm trying to learn

I'm a first-year CS student. My background:
- Comfortable with: Python, C, C++, basic data structures and algorithms
- Learning: FastAPI, React, full-stack integration, SQL/ORM patterns, Docker

When helping me, please:
- Explain *why* a decision is being made, not just the code. I learn best when I understand the reasoning.
- Use Python analogies for new JavaScript/React concepts when possible.
- Prefer the simpler, more readable solution over the clever one. I'd rather understand the code than have the most optimized version.
- Flag when I'm reinventing something a library already does well — but explain what the library is doing under the hood.
- Don't skip steps. I'd rather you walk me through 4 small changes than hand me 1 large rewrite.

## How to run the project

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
API runs at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
App runs at `http://localhost:5173`.

**Both at once (later, once Docker is set up):**
```bash
docker compose up
```

## Current status / known issues

- [ ] Project skeleton not yet created
- [ ] No tests yet
- [ ] No authentication on staff dashboard yet (planned: simple token-based auth for the pilot)
- [ ] Wait time estimator currently uses constant averages; needs historical update on discharge
- [ ] Frontend has no error boundary; nurse-facing UI needs better failure handling
- [ ] No internationalization yet — all UI text is currently English; pilot will need Romanian

## Decisions log

Things we've decided and shouldn't revisit without good reason:

- **SQLite for v1** — Postgres only when we hit concurrent-write limits or deploy to multiple hospitals.
- **No patient names or PHI** — keeps regulatory scope minimal during the pilot.
- **Polling, not WebSockets, for the public display** — 30-second polling is fine for a waiting room screen; WebSockets add complexity not justified at this scale.
- **CORS allowed from localhost dev ports only** in development; will be locked down further before any production deployment.
- **Plain JavaScript, not TypeScript** — for the learning curve. May migrate later.

## Things I'd like help thinking through

When relevant, push back on me about:

- Whether a feature is actually needed for the pilot or is scope creep
- Whether the data model is leaking toward storing more than it needs to
- Whether the wait estimate UX is helpful or anxiety-inducing
- Whether I'm building the right thing vs. what a real ER nurse would actually use
