from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field


class Job(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    recruiter_id: str
    company_name: str
    title: str
    description: str
    required_qualifications: List[str] = []
    required_skills: List[str] = []
    salary_range: str
    experience_requirements: str
    job_location: str
    job_type: str = "Full-Time"  # Full-Time, Part-Time, Contract, Internship
    workplace_type: str = "Hybrid"  # Remote, Onsite, Hybrid
    application_deadline: Optional[str] = None
    status: str = "active"  # "active", "inactive", "closed"
    views_count: int = 0
    applicants_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True

