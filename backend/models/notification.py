from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


class Notification(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    title: str
    message: str
    type: str  # application_status, interview_invite, interview_reminder, job_recommendation
    reference_id: Optional[str] = None
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True

