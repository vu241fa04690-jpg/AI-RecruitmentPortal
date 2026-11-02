from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field


class InterviewRound(BaseModel):
    round_number: int
    name: str  # e.g., "Technical Screening", "System Design", "Cultural Fit"
    description: Optional[str] = None


class Interview(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    application_id: str
    job_id: str
    job_title: str
    candidate_id: str
    candidate_name: str
    candidate_email: str
    recruiter_id: str
    
    interview_date: str
    interview_time: str
    duration_minutes: int = 45
    round_info: InterviewRound
    meeting_link: str
    assigned_interviewers: List[str] = []
    description: Optional[str] = None
    
    # Candidate response status: Pending, Accepted, Declined, Reschedule Requested
    candidate_status: str = "Pending"
    reschedule_reason: Optional[str] = None
    
    # Overall Interview status: Scheduled, Completed, Cancelled
    status: str = "Scheduled"
    
    feedback: Optional[str] = None
    rating: Optional[int] = None  # 1-5
    result: Optional[str] = None  # Passed, Failed, On Hold
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True

