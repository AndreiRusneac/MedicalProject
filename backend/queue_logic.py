from datetime import datetime, timezone
from typing import List

from sqlalchemy.orm import Session

from models import Patient, ServiceTimeHistory

N_DOCTORS = 2

# Sensible defaults when no discharge history exists yet for a level.
_DEFAULT_SERVICE_MINUTES = {1: 60.0, 2: 45.0, 3: 30.0, 4: 20.0, 5: 15.0}


def get_service_time(db: Session, triage_level: int) -> float:
    record = db.query(ServiceTimeHistory).filter_by(triage_level=triage_level).first()
    if record:
        return record.avg_minutes
    return _DEFAULT_SERVICE_MINUTES.get(triage_level, 30.0)


def sorted_queue(patients: List[Patient]) -> List[Patient]:
    """Sort by priority: lower triage number (more urgent) first, then earlier arrival."""
    return sorted(patients, key=lambda p: (p.triage_level, p.arrival_time))


def _patients_ahead(queue: List[Patient], patient: Patient) -> List[Patient]:
    return [
        p for p in queue
        if p.triage_level < patient.triage_level
        or (p.triage_level == patient.triage_level and p.arrival_time < patient.arrival_time)
    ]


def estimate_wait(db: Session, patient: Patient, n_doctors: int = N_DOCTORS) -> int:
    """
    Estimate wait time in minutes.

    Algorithm (from CLAUDE.md):
        sum(avg_service_time[p.level] for p ahead in queue) / n_doctors
    Patients in treatment contribute only their *remaining* expected time.
    """
    now = datetime.now(timezone.utc)

    waiting = db.query(Patient).filter_by(status="waiting").all()
    in_treatment = db.query(Patient).filter_by(status="in_treatment").all()

    total_minutes = 0.0

    # Remaining time for patients already being treated.
    for p in in_treatment:
        service_time = get_service_time(db, p.triage_level)
        if p.treatment_start_time:
            start = p.treatment_start_time.replace(tzinfo=timezone.utc)
            elapsed = (now - start).total_seconds() / 60
            total_minutes += max(0.0, service_time - elapsed)
        else:
            total_minutes += service_time

    # Time for waiting patients who are ahead of this patient.
    ahead = _patients_ahead(waiting, patient)
    for p in ahead:
        total_minutes += get_service_time(db, p.triage_level)

    return max(0, int(total_minutes / n_doctors))


def update_service_time(db: Session, triage_level: int, actual_minutes: float) -> None:
    """Update the rolling average after a patient is discharged."""
    record = db.query(ServiceTimeHistory).filter_by(triage_level=triage_level).first()
    if record is None:
        db.add(ServiceTimeHistory(
            triage_level=triage_level,
            avg_minutes=actual_minutes,
            sample_count=1,
        ))
    else:
        n = record.sample_count
        record.avg_minutes = (record.avg_minutes * n + actual_minutes) / (n + 1)
        record.sample_count = n + 1
    db.commit()