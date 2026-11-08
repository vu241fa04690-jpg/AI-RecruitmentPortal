from typing import List, Optional
from pydantic import BaseModel, Field


class InterviewCreate(BaseModel):
    application_id: str
    job_id: str
    job_title: str
    candidate_name: str
    candidate_email: str
    scheduled_date: str
    round: str
    duration_minutes: int = 45
    interview_type: Optional[str] = "online_video"  # online_video or face_to_face
    meeting_link: Optional[str] = ""
    meeting_room_id: Optional[str] = ""
    company_location: Optional[str] = "Main Corporate Office"
    office_address: Optional[str] = ""
    interviewer: str
    interviewer_email: Optional[str] = ""
    contact_phone: Optional[str] = ""
    instructions: Optional[str] = ""
    notes: Optional[str] = ""


class InterviewUpdate(BaseModel):
    scheduled_date: Optional[str] = None
    round: Optional[str] = None
    duration_minutes: Optional[int] = None
    interview_type: Optional[str] = None
    meeting_link: Optional[str] = None
    company_location: Optional[str] = None
    office_address: Optional[str] = None
    status: Optional[str] = None  # scheduled, confirmed, reschedule_requested, completed, cancelled, no_show
    notes: Optional[str] = None
    instructions: Optional[str] = None


class RescheduleRequest(BaseModel):
    preferred_date: str
    reason: str


class InterviewEvaluationCreate(BaseModel):
    technical_knowledge: int = Field(..., ge=1, le=10)
    communication_skills: int = Field(..., ge=1, le=10)
    problem_solving: int = Field(..., ge=1, le=10)
    practical_knowledge: int = Field(..., ge=1, le=10)
    project_explanation: int = Field(..., ge=1, le=10)
    role_suitability: int = Field(..., ge=1, le=10)
    strengths: Optional[List[str]] = []
    weaknesses: Optional[List[str]] = []
    detailed_comments: Optional[str] = ""
    recommendation: str = Field(..., description="next_round, selected, rejected")


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
    interview_type: Optional[str] = "online_video"
    meeting_link: str
    meeting_room_id: Optional[str] = ""
    company_location: Optional[str] = ""
    office_address: Optional[str] = ""
    interviewer: str
    interviewer_email: Optional[str] = ""
    contact_phone: Optional[str] = ""
    instructions: Optional[str] = ""
    status: str
    reschedule_notes: Optional[str] = ""
    notes: Optional[str] = ""
    evaluation: Optional[dict] = None
