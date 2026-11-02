from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field


class Education(BaseModel):
    institution: str
    degree: str
    field_of_study: str
    start_year: int
    end_year: Optional[int] = None
    grade: Optional[str] = None


class WorkExperience(BaseModel):
    company: str
    position: str
    start_date: str
    end_date: Optional[str] = "Present"
    responsibilities: List[str] = []


class Project(BaseModel):
    title: str
    description: str
    technologies: List[str] = []
    link: Optional[str] = None


class CandidateProfile(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    skills: List[str] = []
    education: List[Education] = []
    experience: List[WorkExperience] = []
    projects: List[Project] = []
    certifications: List[str] = []
    resume_url: Optional[str] = None
    resume_filename: Optional[str] = None
    profile_completion: int = 20  # percentage
    saved_jobs: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True

