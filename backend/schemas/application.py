from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class ApplicationCreate(BaseModel):
    job_id: str
    candidate_name: str
    candidate_email: str
    candidate_skills: Optional[List[str]] = []
    cover_letter: Optional[str] = ""
    resume_name: Optional[str] = "Resume.pdf"
    resume_text: Optional[str] = ""


class ApplicationStatusUpdate(BaseModel):
    status: str  # applied, reviewing, shortlisted, interview_scheduled, rejected, accepted


class ApplicationResponse(BaseModel):
    id: str
    job_id: str
    job_title: str
    company: str
    candidate_id: Optional[str] = None
    candidate_name: str
    candidate_email: str
    candidate_skills: List[str]
    cover_letter: Optional[str] = ""
    resume_name: Optional[str] = ""
    match_score: int
    match_breakdown: Optional[Dict[str, Any]] = None
    status: str
    applied_at: str

