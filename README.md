# ER Queue System

A real-time waiting time and queue tracking system for hospital Emergency Rooms in Romania.

Patients arriving at the ER currently have no information about how long they'll wait. This system surfaces that information through a public display in the waiting room, personal status links for patients, and a staff dashboard for queue management.

## Features

- **Nurse check-in terminal** — register a patient with a triage level, get an instant wait estimate
- **Public waiting room display** — anonymized counts and estimated wait times per triage level, auto-refreshed every 30 seconds
- **Staff dashboard** — full queue sorted by priority, with one-click actions to call and discharge patients
- **Patient status page** — shareable link (e.g. via QR code) showing a patient's position and estimated wait

## Triage levels

Romanian ERs use the 5-level triage system (*triaj pe 5 niveluri*):

| Level | Color | Description |
|-------|-------|-------------|
| 1 | Red | Immediate |
| 2 | Orange | Urgent |
| 3 | Yellow | Semi-urgent |
| 4 | Green | Less urgent |
| 5 | Blue | Non-urgent |

## Tech stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy, SQLite
- **Frontend:** React 18, Vite, React Router
- **Deployment target:** Docker Compose (on-premises)

## Getting started

### Backend

```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

API runs at `http://localhost:8000`.  
Interactive docs (try every endpoint in the browser): `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## Project structure

```
er-queue-system/
├── backend/
│   ├── main.py          # FastAPI app and route definitions
│   ├── models.py        # SQLAlchemy ORM models (Patient, ServiceTimeHistory)
│   ├── schemas.py       # Pydantic request/response schemas
│   ├── queue_logic.py   # Priority sorting and wait time estimation
│   ├── database.py      # SQLite connection and session management
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── NurseCheckIn.jsx
│   │   │   ├── PublicDisplay.jsx
│   │   │   ├── StaffDashboard.jsx
│   │   │   └── PatientStatus.jsx
│   │   ├── api.js       # All fetch() calls in one place
│   │   └── App.jsx
│   └── package.json
├── .gitignore
├── CLAUDE.md
└── README.md
```

## API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/patients/check-in` | Register a new patient |
| POST | `/api/patients/{id}/start-treatment` | Move patient to in-treatment |
| POST | `/api/patients/{id}/discharge` | Mark patient as discharged |
| GET | `/api/queue/public` | Anonymized counts and avg waits per level |
| GET | `/api/patients/{id}/status` | Single patient's position and wait estimate |
| GET | `/api/dashboard/staff` | Full active queue with timestamps |

## Status

Early prototype — not yet approved for clinical use.

- [ ] Authentication on staff dashboard
- [ ] QR code generation on check-in
- [ ] Docker Compose setup
- [ ] Romanian localization throughout
- [ ] Tests