from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class Application(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    job_id: str
    job_title: str
    company_name: str
    candidate_id: str
    candidate_name: str
    candidate_email: str
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None
    resume_filename: Optional[str] = None
    extracted_skills: List[str] = []
    
    # Status progression: Applied -> Under Review -> Shortlisted -> Interview Scheduled -> Selected / Rejected
    status: str = "Applied"
    
    # AI resume analysis decision support
    matching_score: int = 0
    suitability_report: Optional[Dict[str, Any]] = None
    recruiter_feedback: Optional[str] = None
    
    applied_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True

