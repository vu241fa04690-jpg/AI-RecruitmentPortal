import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import settings
from database import get_db

security = HTTPBearer(auto_error=False)

# In-memory brute force protection tracking: {identifier_or_ip: [timestamps]}
_FAILED_LOGIN_ATTEMPTS: Dict[str, List[float]] = {}
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_WINDOW_SECONDS = 300  # 5 minutes


def validate_password_strength(password: str) -> Tuple[bool, str]:
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Za-z]", password):
        return False, "Password must include at least one letter."
    if not re.search(r"\d", password):
        return False, "Password must include at least one number."
    return True, "Password meets security requirements."


def normalize_phone(phone: Optional[str]) -> Optional[str]:
    if not phone:
        return None
    # Keep leading + if present, strip all other non-digits
    has_plus = phone.strip().startswith("+")
    digits = re.sub(r"\D", "", phone)
    if not digits:
        return None
    return f"+{digits}" if has_plus else digits


def check_rate_limit(key: str) -> None:
    now = time.time()
    attempts = _FAILED_LOGIN_ATTEMPTS.get(key, [])
    # Filter attempts within lockout window
    recent = [t for t in attempts if now - t < LOCKOUT_WINDOW_SECONDS]
    _FAILED_LOGIN_ATTEMPTS[key] = recent
    if len(recent) >= MAX_FAILED_ATTEMPTS:
        remaining = int(LOCKOUT_WINDOW_SECONDS - (now - recent[0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Security alert: Too many failed login attempts. Account temporarily locked for {remaining} seconds."
        )


def record_failed_attempt(key: str) -> None:
    now = time.time()
    attempts = _FAILED_LOGIN_ATTEMPTS.get(key, [])
    attempts.append(now)
    _FAILED_LOGIN_ATTEMPTS[key] = attempts


def reset_failed_attempts(key: str) -> None:
    if key in _FAILED_LOGIN_ATTEMPTS:
        del _FAILED_LOGIN_ATTEMPTS[key]


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"{salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt, key_hex = hashed_password.split("$")
        check_key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100000)
        return hmac.compare_digest(check_key.hex(), key_hex)
    except Exception:
        return False


def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _base64url_decode(s: str) -> bytes:
    padding = "=" * (4 - len(s) % 4) if len(s) % 4 != 0 else ""
    return base64.urlsafe_b64decode((s + padding).encode("ascii"))


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": int(expire.timestamp()), "type": "access"})

    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = _base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _base64url_encode(json.dumps(to_encode, separators=(",", ":")).encode("utf-8"))

    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    signature = hmac.new(settings.SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature_b64 = _base64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"


def create_refresh_token(data: Dict[str, Any], expires_days: int = 30) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=expires_days)
    to_encode.update({"exp": int(expire.timestamp()), "type": "refresh"})

    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = _base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _base64url_encode(json.dumps(to_encode, separators=(",", ":")).encode("utf-8"))

    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    signature = hmac.new(settings.SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature_b64 = _base64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, signature_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
        expected_sig = hmac.new(settings.SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
        provided_sig = _base64url_decode(signature_b64)

        if not hmac.compare_digest(expected_sig, provided_sig):
            return None

        payload_bytes = _base64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))

        exp = payload.get("exp")
        if exp and datetime.now(timezone.utc).timestamp() > exp:
            return None

        return payload
    except Exception:
        return None


async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    if not credentials:
        return {
            "id": "guest",
            "email": "",
            "phone": "",
            "name": "Guest",
            "role": "guest",
            "skills": []
        }

    token = credentials.credentials
    if token.startswith("jwt-secure-token-"):
        # Support demo session tokens
        if "admin" in token:
            return {
                "id": "admin-1",
                "email": "admin@recruitmentportal.com",
                "phone": "+15550001111",
                "name": "Admin (Hiring Authority)",
                "role": "admin",
                "company_name": "Recruitment Portal Central",
                "skills": ["Candidate Review", "Interview Scheduling", "Job Management"]
            }
        elif "candidate" in token:
            return {
                "id": "candidate-1",
                "email": "sumii@example.com",
                "phone": "+15554445555",
                "name": "Sumii",
                "role": "candidate",
                "skills": ["Python", "FastAPI", "React", "TypeScript", "Docker", "MongoDB"]
            }

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    db = get_db()
    user = await db["users"].find_one({"_id": payload["sub"]})
    if not user:
        return {
            "id": payload.get("sub"),
            "email": payload.get("email", ""),
            "phone": payload.get("phone", ""),
            "name": payload.get("name", "User"),
            "role": payload.get("role", "candidate")
        }
    user["id"] = str(user["_id"])
    return user


def require_roles(allowed_roles: List[str]):
    async def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)):
        user_role = current_user.get("role", "candidate")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Security access restricted: role '{user_role}' lacks permission. Required: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker
