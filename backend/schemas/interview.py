from typing import Optional
from pydantic import BaseModel


class InterviewCreate(BaseModel):
    application_id: str
    job_id: str
    job_title: str
    candidate_name: str
    candidate_email: str
    scheduled_date: str
    round: str
    duration_minutes: int = 45
    meeting_link: str
    interviewer: str
    notes: Optional[str] = ""


class InterviewUpdate(BaseModel):
    scheduled_date: Optional[str] = None
    round: Optional[str] = None
    duration_minutes: Optional[int] = None
    meeting_link: Optional[str] = None
    status: Optional[str] = None  # scheduled, completed, cancelled
    notes: Optional[str] = None


class InterviewResponse(BaseModel):
    id: str
    application_id: str
    job_id: str
    job_title: str
    candidate_name: str
    candidate_email: str
    scheduled_date: str
    round: str
    duration_minutes: int
    meeting_link: str
    interviewer: str
    status: str
    notes: Optional[str] = ""

