from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from services.ai_agent import (
    process_agent_query,
    generate_tailored_cover_letter,
    rewrite_resume_bullets
)
from utils.auth import get_optional_current_user

router = APIRouter(prefix="/agent", tags=["AI Autonomous Agent"])


class AgentChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User prompt or task for the AI Agent")
    conversation_history: Optional[List[Dict[str, str]]] = Field(default=[], description="Previous chat turns")
    user_context: Optional[Dict[str, Any]] = Field(default={}, description="Current user profile and preferences")


class CoverLetterGenRequest(BaseModel):
    candidate_name: Optional[str] = "Candidate"
    job_title: str
    company: str
    skills: Optional[List[str]] = []
    experience: Optional[str] = "2+ years"


class BulletOptimizeRequest(BaseModel):
    raw_bullet: str
    target_role: Optional[str] = "Software Engineer"


@router.post("/chat")
async def chat_with_agent(
    req: AgentChatRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    """
    Primary endpoint for interacting with the TalentAI Autonomous Agent.
    Accepts natural language, determines intent, executes tool calls against DB/AI models,
    and returns rich conversational responses.
    """
    ctx = req.user_context or {}
    if current_user:
        ctx["name"] = current_user.get("full_name") or current_user.get("name") or ctx.get("name", "User")
        ctx["email"] = current_user.get("email") or ctx.get("email", "")
        ctx["role"] = current_user.get("role") or ctx.get("role", "candidate")
        if current_user.get("skills"):
            ctx["skills"] = current_user.get("skills")
    
    response = await process_agent_query(
        message=req.message,
        conversation_history=req.conversation_history or [],
        user_context=ctx
    )
    return response


@router.post("/cover-letter")
async def create_cover_letter(req: CoverLetterGenRequest):
    """
    Direct tool endpoint: Synthesizes high-impact personalized cover letter.
    """
    letter = generate_tailored_cover_letter(
        candidate_name=req.candidate_name,
        job_title=req.job_title,
        company=req.company,
        skills=req.skills or ["Python", "FastAPI", "React"],
        experience=req.experience or "2+ years"
    )
    return {
        "status": "success",
        "job_title": req.job_title,
        "company": req.company,
        "cover_letter": letter
    }


@router.post("/optimize-bullet")
async def optimize_bullet(req: BulletOptimizeRequest):
    """
    Direct tool endpoint: Rewrites a resume bullet point into quantified STAR versions.
    """
    if len(req.raw_bullet.strip()) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bullet point must contain at least 5 characters."
        )
    result = rewrite_resume_bullets(req.raw_bullet, req.target_role or "Software Engineer")
    return result


@router.get("/capabilities")
async def get_agent_capabilities():
    """
    Returns available tools, autonomous workflows, and system parameters of the TalentAI Agent.
    """
    return {
        "agent_name": "TalentAI Autonomous Agent",
        "version": "2.0.0",
        "status": "active",
        "tools": [
            {
                "name": "execute_job_search",
                "description": "Searches live verified opportunities in MongoDB Atlas matching skills, location, and salary",
                "intents": ["find jobs", "search positions", "recommend opportunities"]
            },
            {
                "name": "generate_tailored_cover_letter",
                "description": "Auto-crafts structured, tailored cover letter for any specific company and role",
                "intents": ["write cover letter", "draft application letter"]
            },
            {
                "name": "rewrite_resume_bullets",
                "description": "Converts weak resume statements into quantified STAR-compliant achievements with metrics",
                "intents": ["optimize resume", "improve bullets", "ats score"]
            },
            {
                "name": "evaluate_interview_answer",
                "description": "Assesses interview answer for technical accuracy, clarity, completeness, and model STAR solution",
                "intents": ["mock interview", "score answer", "practice technical question"]
            },
            {
                "name": "execute_application_lookup",
                "description": "Retrieves real-time application pipeline and status updates from the candidate's account",
                "intents": ["check application status", "track jobs", "my interviews"]
            },
            {
                "name": "generate_job_description",
                "description": "Generates complete recruiter job descriptions with responsibilities and requirements",
                "intents": ["post job", "create jd", "recruiter hiring copilot"]
            }
        ]
    }
