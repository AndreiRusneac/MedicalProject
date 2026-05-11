import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Integer, String

from database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    arrival_time = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    triage_level = Column(Integer, nullable=False)  # 1 (immediate) – 5 (non-urgent)
    status = Column(String, default="waiting")  # "waiting" | "in_treatment" | "discharged"
    treatment_start_time = Column(DateTime, nullable=True)
    discharge_time = Column(DateTime, nullable=True)


class ServiceTimeHistory(Base):
    """Rolling average of actual treatment durations, one row per triage level."""

    __tablename__ = "service_time_history"

    triage_level = Column(Integer, primary_key=True)
    avg_minutes = Column(Float, nullable=False)
    sample_count = Column(Integer, nullable=False, default=0)