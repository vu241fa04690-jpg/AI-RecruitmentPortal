from typing import List, Optional
from pydantic import BaseModel


class JobCreate(BaseModel):
    title: str
    company: str
    location: str
    type: str = "Full-Time Job"
    domain: Optional[str] = "software"
    category: Optional[str] = "job"
    duration: Optional[str] = None
    stipend_or_salary: Optional[str] = None
    salary_range: str
    experience_level: str = "College Students & Freshers"
    eligibility: Optional[str] = None
    department: Optional[str] = "Engineering"
    description: str
    requirements: List[str]
    skills: List[str]
    interview_rounds: Optional[List[str]] = []
    benefits: Optional[List[str]] = []
    deadline_days_left: Optional[int] = 5
    applicants_count: Optional[int] = 120
    verified_partner: Optional[bool] = True
    company_logo_color: Optional[str] = "#0066cc"
    status: Optional[str] = "active"


class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    type: Optional[str] = None
    domain: Optional[str] = None
    category: Optional[str] = None
    duration: Optional[str] = None
    stipend_or_salary: Optional[str] = None
    experience_level: Optional[str] = None
    salary_range: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    interview_rounds: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    status: Optional[str] = None


class JobResponse(BaseModel):
    id: str
    title: str = ""
    company: str = ""
    location: str = ""
    type: str = "Full-Time Job"
    domain: Optional[str] = "software"
    category: Optional[str] = "job"
    duration: Optional[str] = None
    stipend_or_salary: Optional[str] = None
    experience_level: Optional[str] = "College Students & Freshers"
    eligibility: Optional[str] = None
    salary_range: Optional[str] = ""
    department: Optional[str] = "Engineering"
    description: Optional[str] = ""
    requirements: Optional[List[str]] = []
    skills: Optional[List[str]] = []
    interview_rounds: Optional[List[str]] = []
    benefits: Optional[List[str]] = []
    deadline_days_left: Optional[int] = 5
    applicants_count: Optional[int] = 120
    verified_partner: Optional[bool] = True
    company_logo_color: Optional[str] = "#0066cc"
    status: Optional[str] = "active"
    posted_by: Optional[str] = None
    created_at: Optional[str] = None
