from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel


class AssignmentCreate(BaseModel):
    title: str
    category: str = "Technical"  # Coding, Aptitude, Technical, Project, MCQ
    description: str
    instructions: Optional[str] = ""
    requirements: Optional[List[str]] = []
    deadline: str
    total_marks: int = 100
    passing_marks: int = 50
    assigned_to: Optional[str] = "all"  # "all" or candidate_id
    document_url: Optional[str] = None


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    requirements: Optional[List[str]] = None
    deadline: Optional[str] = None
    total_marks: Optional[int] = None
    passing_marks: Optional[int] = None
    assigned_to: Optional[str] = None
    status: Optional[str] = None


class AssignmentResponse(BaseModel):
    id: str
    title: str
    category: str
    description: str
    instructions: Optional[str] = ""
    requirements: Optional[List[str]] = []
    deadline: str
    total_marks: int
    passing_marks: int
    assigned_to: Optional[str] = "all"
    document_url: Optional[str] = None
    created_by: Optional[str] = None
    recruiter_name: Optional[str] = "Hiring Team"
    status: str = "active"  # "active", "closed"
    created_at: str
    submissions_count: Optional[int] = 0


class AssignmentSubmissionCreate(BaseModel):
    file_name: Optional[str] = "assignment_submission.pdf"
    file_url: Optional[str] = None
    github_url: Optional[str] = None
    project_url: Optional[str] = None
    notes: Optional[str] = None


class AssignmentEvaluation(BaseModel):
    marks: int
    feedback: str
    status: str = "evaluated"  # "evaluated", "approved", "rejected", "resubmission_requested"


class SubmissionResponse(BaseModel):
    id: str
    assignment_id: str
    assignment_title: Optional[str] = "Assignment"
    candidate_id: str
    candidate_name: str
    candidate_email: str
    file_name: Optional[str] = None
    file_url: Optional[str] = None
    github_url: Optional[str] = None
    project_url: Optional[str] = None
    notes: Optional[str] = None
    submitted_at: str
    status: str  # "submitted", "evaluated", "approved", "rejected", "resubmission_requested"
    marks: Optional[int] = None
    total_marks: Optional[int] = 100
    passing_marks: Optional[int] = 50
    feedback: Optional[str] = None
    evaluated_by: Optional[str] = None
    evaluated_at: Optional[str] = None

