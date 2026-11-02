import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Recruitment Portal"
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "ai_recruitment"
    SECRET_KEY: str = "ai-recruitment-jwt-secret-key-super-secure-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    FRONTEND_URL: str = "http://localhost:5173"
    UPLOAD_DIR: str = os.path.join(os.path.dirname(__file__), "uploads", "resumes")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
