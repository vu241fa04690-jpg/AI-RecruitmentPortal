from typing import List, Optional
from pydantic import BaseModel, EmailStr


class SendOtpRequest(BaseModel):
    email: EmailStr


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp_code: str


class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None
    token: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    picture: Optional[str] = None
    role: Optional[str] = "candidate"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    role: str = "candidate"  # "candidate", "recruiter", "admin"
    company_name: Optional[str] = None
    skills: Optional[List[str]] = []
    bio: Optional[str] = None
    otp_code: Optional[str] = None


class UserLogin(BaseModel):
    # Can provide identifier (email or phone) OR specific email / phone
    identifier: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str
    remember_me: Optional[bool] = False


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
    refresh_token: Optional[str] = None
