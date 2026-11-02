from typing import List, Optional
from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    role: str = "candidate"  # "candidate", "recruiter", "admin"
    company_name: Optional[str] = None
    skills: Optional[List[str]] = []
    bio: Optional[str] = None


class UserLogin(BaseModel):
    # Can provide identifier (email or phone) OR specific email / phone
    identifier: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str


class ForgotPasswordRequest(BaseModel):
    email_or_phone: str


class ResetPasswordRequest(BaseModel):
    email_or_phone: str
    otp_code: str
    new_password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    company_name: Optional[str] = None
    skills: Optional[List[str]] = []
    bio: Optional[str] = None
    token: Optional[str] = None
