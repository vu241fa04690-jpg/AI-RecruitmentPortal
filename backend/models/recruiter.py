from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


class Company(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    industry: str
    website: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    logo_url: Optional[str] = None
    verified: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True


class RecruiterProfile(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    company_id: Optional[str] = None
    company_name: str
    position_title: str
    phone: Optional[str] = None
    is_verified: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True

