
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from config import settings
from database import (
    close_mongo_connection,
    connect_to_mongo,
    get_storage_status,
)

from routes.ai import router as ai_router
from routes.analytics import router as analytics_router
from routes.applications import router as applications_router
from routes.assignments import router as assignments_router
from routes.auth import router as auth_router
from routes.interviews import router as interviews_router
from routes.jobs import router as jobs_router
from routes.notifications import router as notifications_router
from routes.resumes import router as resumes_router


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "camera=(self), microphone=(self), geolocation=()"
        )

        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description=(
        "Intelligent AI-driven talent recruitment, semantic candidate "
        "matching, and interview management platform."
    ),
    lifespan=lifespan,
)

# Security middleware
app.add_middleware(SecurityHeadersMiddleware)

# CORS configuration
allowed_origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

# Remove empty and duplicate origins
allowed_origins = list({
    origin for origin in allowed_origins if origin
})

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=(
        r"https?://(localhost|127\.0\.0\.1|.*\.onrender\.com)(:\d+)?"
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(auth_router, prefix="/api")
app.include_router(jobs_router, prefix="/api")
app.include_router(applications_router, prefix="/api")
app.include_router(assignments_router, prefix="/api")
app.include_router(interviews_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(resumes_router, prefix="/api")


# Root endpoint: supports GET and HEAD
@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "status": "operational",
        "security": "hardened",
        "documentation": "/docs",
        "health": "/health",
        "endpoints": {
            "auth": "/api/auth",
            "jobs": "/api/jobs",
            "applications": "/api/applications",
            "interviews": "/api/interviews",
            "ai": "/api/ai",
            "analytics": "/api/analytics",
        },
    }


# Health endpoint: supports GET and HEAD
@app.api_route("/health", methods=["GET", "HEAD"])
async def health():
    storage = get_storage_status()

    return {
        "status": "ok",
        "database": storage.get("status", "connected"),
        "storage_mode": storage.get("mode", "standard"),
        "service": settings.APP_NAME,
        "security_policy": "active",
    }
