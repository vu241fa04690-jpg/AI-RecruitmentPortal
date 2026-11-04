
import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Recruitment Portal"

    # Local MongoDB fallback; set MONGODB_URL on Render
    MONGODB_URL: str = "mongodb://localhost:27017"

    DATABASE_NAME: str = "ai_recruitment"

    # Set a strong SECRET_KEY through environment variables
    SECRET_KEY: str = "development-only-change-this-secret"

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # Set this to your deployed frontend URL on Render
    FRONTEND_URL: str = "http://localhost:5173"

    UPLOAD_DIR: str = os.path.join(
        os.path.dirname(__file__),
        "uploads",
        "resumes"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
