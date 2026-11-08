import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from database import get_db
from schemas.interview import InterviewCreate, InterviewResponse, InterviewUpdate
from utils.auth import get_current_user

router = APIRouter(prefix="/interviews", tags=["Interviews"])


def _format_interview(doc: dict) -> InterviewResponse:
    return InterviewResponse(
        id=str(doc.get("_id")),
        application_id=doc.get("application_id", ""),
        job_id=doc.get("job_id", ""),
        job_title=doc.get("job_title", ""),
        candidate_name=doc.get("candidate_name", ""),
        candidate_email=doc.get("candidate_email", ""),
        scheduled_date=doc.get("scheduled_date", ""),
        round=doc.get("round", "Technical"),
        duration_minutes=doc.get("duration_minutes", 45),
        meeting_link=doc.get("meeting_link", ""),
        interviewer=doc.get("interviewer", "Hiring Team"),
        status=doc.get("status", "scheduled"),
        notes=doc.get("notes", "")
    )


@router.get("", response_model=List[InterviewResponse])
async def list_interviews(
    candidate_email: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    query = {}
    if status_filter:
        query["status"] = status_filter

    user_role = current_user.get("role", "candidate")
    user_email = (current_user.get("email") or "").lower().strip()
    target_email = (candidate_email or "").lower().strip()

    if user_role in ["candidate", "guest"]:
        effective_email = target_email or user_email
        if effective_email:
            query["candidate_email"] = effective_email
        else:
            return []
    else:
        # Recruiters and Admins can view all scheduled interviews or filter
        if target_email:
            query["candidate_email"] = target_email

    cursor = db["interviews"].find(query)
    interviews = await cursor.to_list(length=100)

    # If candidate has no rounds yet, automatically seed confirmed assessment rounds for their profile
    if not interviews and user_role in ["candidate", "guest"] and effective_email:
        cand_name = current_user.get("name") or effective_email.split("@")[0].capitalize()
        default_rounds = [
            {
                "_id": f"int-{uuid.uuid4().hex[:6]}",
                "application_id": "app-101",
                "job_id": "opp-1",
                "job_title": "Software Development Engineer Intern (SDE Summer/Winter 2026)",
                "candidate_name": cand_name,
                "candidate_email": effective_email,
                "scheduled_date": "Active Now · Take Online",
                "round": "Round 1: Online Technical Assessment (Coding Sandbox & Algorithms)",
                "duration_minutes": 60,
                "meeting_link": "https://meet.google.com/rec-flow-ai",
                "interviewer": "Automated AI Evaluator & SDE Mentor",
                "status": "scheduled",
                "notes": "Topics: Array search, Two-Pointer technique, FastAPI concurrency, and Database indexing. Practice in the live coding sandbox."
            },
            {
                "_id": f"int-{uuid.uuid4().hex[:6]}",
                "application_id": "app-102",
                "job_id": "opp-2",
                "job_title": "AI & Generative LLM Research Intern",
                "candidate_name": cand_name,
                "candidate_email": effective_email,
                "scheduled_date": "Tomorrow, 2:30 PM IST",
                "round": "Round 2: Technical Interview (DSA & Live Code Pair)",
                "duration_minutes": 45,
                "meeting_link": "https://meet.google.com/rec-nlp-sprint",
                "interviewer": "Dr. Aris Vance (AI Research Director)",
                "status": "scheduled",
                "notes": "Review transformer attention layers, loss functions, vector embeddings, and real-time inference optimization."
            },
            {
                "_id": f"int-{uuid.uuid4().hex[:6]}",
                "application_id": "app-103",
                "job_id": "opp-3",
                "job_title": "Full-Stack Web Development Intern (FastAPI + React)",
                "candidate_name": cand_name,
                "candidate_email": effective_email,
                "scheduled_date": "Friday, 4:00 PM IST",
                "round": "Round 3: Engineering Leadership & Cultural Fitment",
                "duration_minutes": 30,
                "meeting_link": "https://meet.google.com/rec-apex-leadership",
                "interviewer": "Nashu (Director of Engineering)",
                "status": "scheduled",
                "notes": "Discussion on project milestones, team collaboration, code review best practices, and career growth roadmap."
            }
        ]
        await db["interviews"].insert_many(default_rounds)
        interviews = default_rounds

    return [_format_interview(i) for i in interviews]


@router.post("", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
async def schedule_interview(
    int_in: InterviewCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    int_id = f"int-{uuid.uuid4().hex[:6]}"
    doc = {
        "_id": int_id,
        "application_id": int_in.application_id,
        "job_id": int_in.job_id,
        "job_title": int_in.job_title,
        "candidate_name": int_in.candidate_name,
        "candidate_email": int_in.candidate_email,
        "scheduled_date": int_in.scheduled_date,
        "round": int_in.round,
        "duration_minutes": int_in.duration_minutes,
        "meeting_link": int_in.meeting_link,
        "interviewer": int_in.interviewer or current_user.get("name", "Hiring Lead"),
        "status": "scheduled",
        "notes": int_in.notes or ""
    }
    await db["interviews"].insert_one(doc)

    # Also make sure application status is set to interview_scheduled
    await db["applications"].update_one(
        {"_id": int_in.application_id},
        {"$set": {"status": "interview_scheduled"}}
    )

    return _format_interview(doc)


@router.patch("/{int_id}", response_model=InterviewResponse)
async def update_interview(
    int_id: str,
    update_data: InterviewUpdate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    existing = await db["interviews"].find_one({"_id": int_id})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")

    data = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if data:
        await db["interviews"].update_one({"_id": int_id}, {"$set": data})

    updated = await db["interviews"].find_one({"_id": int_id})
    return _format_interview(updated)


@router.post("/mock/history")
async def save_mock_interview_attempt(
    attempt_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Saves an interactive AI mock interview evaluation attempt into candidate history.
    """
    db = get_db()
    cand_id = current_user.get("id") or current_user.get("email")
    attempt_id = f"mock-{uuid.uuid4().hex[:8]}"

    doc = {
        "_id": attempt_id,
        "candidate_id": cand_id,
        "job_title": attempt_data.get("job_title", "Software Engineer"),
        "round_type": attempt_data.get("round_type", "Technical"),
        "question": attempt_data.get("question", ""),
        "candidate_answer": attempt_data.get("candidate_answer", ""),
        "score": attempt_data.get("score", 75),
        "technical_accuracy": attempt_data.get("technical_accuracy", 70),
        "clarity": attempt_data.get("clarity", 75),
        "completeness": attempt_data.get("completeness", 70),
        "verdict": attempt_data.get("verdict", "Hire / Solid Technical Competence"),
        "strengths": attempt_data.get("strengths", []),
        "improvements": attempt_data.get("improvements", []),
        "model_answer": attempt_data.get("model_answer", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db["mock_interview_history"].insert_one(doc)
    return {"message": "Mock interview attempt recorded", "attempt": doc}


@router.get("/mock/history")
async def get_mock_interview_history(current_user: dict = Depends(get_current_user)):
    """
    Returns candidate's full mock interview history and tracks improvement across attempts.
    """
    db = get_db()
    cand_id = current_user.get("id") or current_user.get("email")
    cursor = db["mock_interview_history"].find({"candidate_id": cand_id})
    history = []
    async for h in cursor:
        history.append(h)

    history.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    avg_score = round(sum(h.get("score", 0) for h in history) / len(history), 1) if history else 0
    return {
        "total_attempts": len(history),
        "average_score": avg_score,
        "history": history
    }


