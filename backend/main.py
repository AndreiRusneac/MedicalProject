import uuid
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import queue_logic
import schemas
from database import engine, get_db

# Create all tables on startup (safe to call repeatedly; skips existing tables).
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ER Queue System")

# Only allow the local Vite dev server in development.
# Lock this down before any production deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Nurse input endpoints
# ---------------------------------------------------------------------------

@app.post("/api/patients/check-in", response_model=schemas.PatientStatus)
def check_in(payload: schemas.PatientCheckIn, db: Session = Depends(get_db)):
    patient = models.Patient(
        id=str(uuid.uuid4()),
        arrival_time=datetime.now(timezone.utc),
        triage_level=payload.triage_level,
        status="waiting",
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return _build_patient_status(db, patient)


@app.post("/api/patients/{patient_id}/start-treatment", response_model=schemas.PatientStatus)
def start_treatment(patient_id: str, db: Session = Depends(get_db)):
    patient = _get_or_404(db, patient_id)
    if patient.status != "waiting":
        raise HTTPException(status_code=409, detail="Pacientul nu este în stare de așteptare.")
    patient.status = "in_treatment"
    patient.treatment_start_time = datetime.now(timezone.utc)
    db.commit()
    db.refresh(patient)
    return _build_patient_status(db, patient)


@app.post("/api/patients/{patient_id}/discharge", response_model=schemas.PatientStatus)
def discharge(patient_id: str, db: Session = Depends(get_db)):
    patient = _get_or_404(db, patient_id)
    if patient.status != "in_treatment":
        raise HTTPException(status_code=409, detail="Pacientul nu este în tratament.")
    now = datetime.now(timezone.utc)
    patient.status = "discharged"
    patient.discharge_time = now
    db.commit()
    if patient.treatment_start_time:
        start = patient.treatment_start_time.replace(tzinfo=timezone.utc)
        actual_minutes = (now - start).total_seconds() / 60
        queue_logic.update_service_time(db, patient.triage_level, actual_minutes)
    db.refresh(patient)
    return _build_patient_status(db, patient)


# ---------------------------------------------------------------------------
# Public / patient-facing endpoints
# ---------------------------------------------------------------------------

@app.get("/api/queue/public", response_model=list[schemas.QueuePublic])
def queue_public(db: Session = Depends(get_db)):
    result = []
    for level in range(1, 6):
        waiting = db.query(models.Patient).filter_by(triage_level=level, status="waiting").all()
        count = len(waiting)
        avg_wait = (
            int(sum(queue_logic.estimate_wait(db, p) for p in waiting) / count)
            if count
            else 0
        )
        result.append(schemas.QueuePublic(
            triage_level=level,
            waiting_count=count,
            avg_wait_minutes=avg_wait,
        ))
    return result


@app.get("/api/patients/{patient_id}/status", response_model=schemas.PatientStatus)
def patient_status(patient_id: str, db: Session = Depends(get_db)):
    patient = _get_or_404(db, patient_id)
    return _build_patient_status(db, patient)


# ---------------------------------------------------------------------------
# Staff dashboard
# ---------------------------------------------------------------------------

@app.get("/api/dashboard/staff", response_model=list[schemas.StaffPatient])
def staff_dashboard(db: Session = Depends(get_db)):
    active = db.query(models.Patient).filter(
        models.Patient.status.in_(["waiting", "in_treatment"])
    ).all()
    return [
        schemas.StaffPatient(
            id=p.id,
            triage_level=p.triage_level,
            status=p.status,
            arrival_time=p.arrival_time,
            treatment_start_time=p.treatment_start_time,
            discharge_time=p.discharge_time,
            estimated_wait_minutes=queue_logic.estimate_wait(db, p),
        )
        for p in queue_logic.sorted_queue(active)
    ]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_or_404(db: Session, patient_id: str) -> models.Patient:
    patient = db.query(models.Patient).filter_by(id=patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Pacientul nu a fost găsit.")
    return patient


def _build_patient_status(db: Session, patient: models.Patient) -> schemas.PatientStatus:
    waiting = db.query(models.Patient).filter_by(status="waiting").all()
    sorted_waiting = queue_logic.sorted_queue(waiting)
    position = next(
        (i + 1 for i, p in enumerate(sorted_waiting) if p.id == patient.id), 0
    )
    return schemas.PatientStatus(
        id=patient.id,
        triage_level=patient.triage_level,
        status=patient.status,
        arrival_time=patient.arrival_time,
        queue_position=position,
        estimated_wait_minutes=queue_logic.estimate_wait(db, patient),
    )