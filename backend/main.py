from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from config import settings
from database import close_mongo_connection, connect_to_mongo, get_storage_status
from routes.ai import router as ai_router
from routes.analytics import router as analytics_router
from routes.applications import router as applications_router
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
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(self), microphone=(self), geolocation=()"
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Intelligent AI-driven talent recruitment, semantic candidate matching, and interview management platform.",
    lifespan=lifespan
)

# Apply Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# Apply CORS Middleware (Allows credentials with localhost/127.0.0.1 without throwing Starlette origin errors)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(auth_router, prefix="/api")
app.include_router(jobs_router, prefix="/api")
app.include_router(applications_router, prefix="/api")
app.include_router(interviews_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(resumes_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "status": "operational",
        "security": "hardened (JWT, rate-limiting, CSP headers, PBKDF2/Bcrypt)",
        "documentation": "/docs",
        "health": "/health",
        "endpoints": {
            "auth": "/api/auth",
            "jobs": "/api/jobs",
            "applications": "/api/applications",
            "interviews": "/api/interviews",
            "ai": "/api/ai",
            "analytics": "/api/analytics"
        }
    }


@app.get("/health")
async def health():
    storage = get_storage_status()
    return {
        "status": "ok",
        "database": storage.get("status", "connected"),
        "storage_mode": storage.get("mode", "standard"),
        "service": settings.APP_NAME,
        "security_policy": "active"
    }
