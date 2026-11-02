from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class User(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    email: EmailStr
    password_hash: str
    name: str
    role: str = "candidate"  # "admin", "recruiter", "candidate"
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True

