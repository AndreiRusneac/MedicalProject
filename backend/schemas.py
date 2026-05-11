from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class PatientCheckIn(BaseModel):
    triage_level: int = Field(..., ge=1, le=5)


class PatientStatus(BaseModel):
    id: str
    triage_level: int
    status: str
    arrival_time: datetime
    queue_position: int
    estimated_wait_minutes: int

    model_config = {"from_attributes": True}


class QueuePublic(BaseModel):
    triage_level: int
    waiting_count: int
    avg_wait_minutes: int


class StaffPatient(BaseModel):
    id: str
    triage_level: int
    status: str
    arrival_time: datetime
    treatment_start_time: Optional[datetime]
    discharge_time: Optional[datetime]
    estimated_wait_minutes: int

    model_config = {"from_attributes": True}