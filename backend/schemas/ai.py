from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class ResumeMatchRequest(BaseModel):
    job_id: Optional[str] = None
    job_title: Optional[str] = None
    job_requirements: Optional[List[str]] = []
    job_skills: Optional[List[str]] = []
    resume_text: str
    candidate_skills: Optional[List[str]] = []


class ResumeMatchResponse(BaseModel):
    match_score: int
    skills_score: int
    experience_score: int
    matched_skills: List[str]
    missing_skills: List[str]
    strengths: List[str]
    recommendations: List[str]
    summary: str


class JobDescriptionGenRequest(BaseModel):
    title: str
    department: str = "Engineering"
    experience_level: str = "Mid-Senior"
    key_skills: List[str]


class InterviewPrepRequest(BaseModel):
    job_title: str
    skills: List[str]
    round_type: str = "Technical"

