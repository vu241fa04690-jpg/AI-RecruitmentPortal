import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from database import get_db
from schemas.interview import (
    InterviewCreate,
    InterviewEvaluationCreate,
    InterviewResponse,
    InterviewUpdate,
    RescheduleRequest,
)
from utils.auth import get_current_user

router = APIRouter(prefix="/interviews", tags=["Interviews"])

# In-memory signaling cache for WebRTC video rooms
SIGNAL_STORE: Dict[str, List[Dict[str, Any]]] = {}


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
        interview_type=doc.get("interview_type", "online_video"),
        meeting_link=doc.get("meeting_link", ""),
        meeting_room_id=doc.get("meeting_room_id", ""),
        company_location=doc.get("company_location", "Corporate Tech Center"),
        office_address=doc.get("office_address", ""),
        interviewer=doc.get("interviewer", "Hiring Team"),
        interviewer_email=doc.get("interviewer_email", ""),
        contact_phone=doc.get("contact_phone", ""),
        instructions=doc.get("instructions", ""),
        status=doc.get("status", "scheduled"),
        reschedule_notes=doc.get("reschedule_notes", ""),
        notes=doc.get("notes", ""),
        evaluation=doc.get("evaluation")
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
    interviews = await cursor.to_list(length=200)
    interviews.sort(key=lambda x: x.get("scheduled_date", ""), reverse=True)
    return [_format_interview(i) for i in interviews]


@router.get("/{int_id}", response_model=InterviewResponse)
async def get_interview_by_id(int_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db["interviews"].find_one({"_id": int_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")
    return _format_interview(doc)


@router.post("", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
async def schedule_interview(
    int_in: InterviewCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Schedules an interview (supports both Online Video WebRTC rooms and In-Person Face-to-Face meetings).
    """
    db = get_db()
    role = current_user.get("role", "candidate")
    if role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only recruiters can schedule interviews.")

    int_id = f"int-{uuid.uuid4().hex[:6]}"
    room_id = int_in.meeting_room_id or f"room-{uuid.uuid4().hex[:8]}"
    meeting_link = int_in.meeting_link or f"/video-interview/{room_id}"

    office_addr = int_in.office_address
    if int_in.interview_type == "face_to_face" and not office_addr:
        office_addr = "Level 4, Innovation Tech Tower, Sector 62, Cyber City (Reception Desk)"

    doc = {
        "_id": int_id,
        "application_id": int_in.application_id,
        "job_id": int_in.job_id,
        "job_title": int_in.job_title,
        "candidate_name": int_in.candidate_name,
        "candidate_email": int_in.candidate_email.lower().strip(),
        "scheduled_date": int_in.scheduled_date,
        "round": int_in.round,
        "duration_minutes": int_in.duration_minutes,
        "interview_type": int_in.interview_type or "online_video",
        "meeting_link": meeting_link,
        "meeting_room_id": room_id,
        "company_location": int_in.company_location or "Corporate Tech Center",
        "office_address": office_addr or "",
        "interviewer": int_in.interviewer or current_user.get("name", "Hiring Lead"),
        "interviewer_email": int_in.interviewer_email or current_user.get("email", ""),
        "contact_phone": int_in.contact_phone or "+1 (555) 019-2834",
        "instructions": int_in.instructions or (
            "Please bring a valid photo ID and printed resume copy."
            if int_in.interview_type == "face_to_face"
            else "Ensure a stable internet connection, working microphone, and camera."
        ),
        "status": "scheduled",
        "notes": int_in.notes or "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db["interviews"].insert_one(doc)

    # Update application status
    stage_key = "face_to_face_interview" if int_in.interview_type == "face_to_face" else "technical_interview"
    await db["applications"].update_one(
        {"_id": int_in.application_id},
        {"$set": {"status": stage_key}}
    )

    # Send in-app notification
    notif = {
        "_id": f"notif-{uuid.uuid4().hex[:6]}",
        "recipient_id": doc["candidate_email"],
        "title": f"Interview Scheduled: {doc['round']}",
        "message": f"You have an upcoming {doc['interview_type'].replace('_', ' ').title()} on {doc['scheduled_date']}.",
        "category": "interview",
        "link": "/dashboard?tab=interviews",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db["notifications"].insert_one(notif)

    return _format_interview(doc)


@router.post("/{int_id}/confirm", response_model=InterviewResponse)
async def confirm_interview_attendance(
    int_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Candidate confirms attendance for a scheduled Face-to-Face or Online Video interview.
    """
    db = get_db()
    existing = await db["interviews"].find_one({"_id": int_id})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")

    await db["interviews"].update_one(
        {"_id": int_id},
        {"$set": {"status": "confirmed"}}
    )

    # Notify recruiter
    notif = {
        "_id": f"notif-{uuid.uuid4().hex[:6]}",
        "recipient_id": existing.get("interviewer_email") or "all",
        "title": "Interview Confirmed by Candidate",
        "message": f"{existing.get('candidate_name')} has confirmed attendance for {existing.get('round')} on {existing.get('scheduled_date')}.",
        "category": "interview",
        "link": "/recruiter?tab=interviews",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db["notifications"].insert_one(notif)

    updated = await db["interviews"].find_one({"_id": int_id})
    return _format_interview(updated)


@router.post("/{int_id}/reschedule-request", response_model=InterviewResponse)
async def request_reschedule(
    int_id: str,
    req: RescheduleRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Candidate submits an official reschedule request with preferred time and reason.
    """
    db = get_db()
    existing = await db["interviews"].find_one({"_id": int_id})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")

    reschedule_note = f"Preferred Date: {req.preferred_date} | Reason: {req.reason}"
    await db["interviews"].update_one(
        {"_id": int_id},
        {"$set": {
            "status": "reschedule_requested",
            "reschedule_notes": reschedule_note
        }}
    )

    # Notify recruiter
    notif = {
        "_id": f"notif-{uuid.uuid4().hex[:6]}",
        "recipient_id": existing.get("interviewer_email") or "all",
        "title": "Candidate Reschedule Request",
        "message": f"{existing.get('candidate_name')} requested to reschedule {existing.get('round')}. Reason: {req.reason}.",
        "category": "interview",
        "link": "/recruiter?tab=interviews",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db["notifications"].insert_one(notif)

    updated = await db["interviews"].find_one({"_id": int_id})
    return _format_interview(updated)


@router.post("/{int_id}/evaluate")
async def evaluate_interview(
    int_id: str,
    eval_in: InterviewEvaluationCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Module 7: Recruiter submits standardized 6-criteria post-interview evaluation form.
    Calculates composite score, records strengths/weaknesses, and progresses candidate pipeline.
    """
    db = get_db()
    role = current_user.get("role", "candidate")
    if role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only interviewers can evaluate candidates.")

    existing = await db["interviews"].find_one({"_id": int_id})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")

    # Composite score (out of 100)
    scores = [
        eval_in.technical_knowledge,
        eval_in.communication_skills,
        eval_in.problem_solving,
        eval_in.practical_knowledge,
        eval_in.project_explanation,
        eval_in.role_suitability
    ]
    avg_score_10 = sum(scores) / len(scores)
    composite_percent = int(avg_score_10 * 10)

    eval_doc = {
        "technical_knowledge": eval_in.technical_knowledge,
        "communication_skills": eval_in.communication_skills,
        "problem_solving": eval_in.problem_solving,
        "practical_knowledge": eval_in.practical_knowledge,
        "project_explanation": eval_in.project_explanation,
        "role_suitability": eval_in.role_suitability,
        "composite_score": composite_percent,
        "strengths": eval_in.strengths or [],
        "weaknesses": eval_in.weaknesses or [],
        "detailed_comments": eval_in.detailed_comments or "",
        "recommendation": eval_in.recommendation,
        "evaluated_by": current_user.get("name") or current_user.get("email"),
        "evaluated_at": datetime.now(timezone.utc).isoformat()
    }

    # Mark interview as completed with evaluation attached
    await db["interviews"].update_one(
        {"_id": int_id},
        {"$set": {
            "status": "completed",
            "evaluation": eval_doc
        }}
    )

    # Save to interview_evaluations collection
    eval_id = f"eval-{uuid.uuid4().hex[:8]}"
    await db["interview_evaluations"].insert_one({
        "_id": eval_id,
        "interview_id": int_id,
        "application_id": existing.get("application_id"),
        "candidate_email": existing.get("candidate_email"),
        "round": existing.get("round"),
        **eval_doc
    })

    # Update candidate stage in recruitment pipeline
    app_id = existing.get("application_id")
    if app_id:
        target_stage = "selected" if eval_in.recommendation == "selected" else (
            "rejected" if eval_in.recommendation == "rejected" else "final_interview"
        )
        await db["applications"].update_one(
            {"_id": app_id},
            {"$set": {"status": target_stage}}
        )
        stage_doc = {
            "_id": f"stg-{uuid.uuid4().hex[:6]}",
            "application_id": app_id,
            "candidate_email": existing.get("candidate_email"),
            "stage": target_stage,
            "changed_by": current_user.get("email", "Interviewer"),
            "notes": f"Interview {existing.get('round')} evaluated: {composite_percent}% - Recommendation: {eval_in.recommendation}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db["recruitment_stage_history"].insert_one(stage_doc)

    return {
        "message": "Evaluation recorded successfully",
        "composite_score": composite_percent,
        "recommendation": eval_in.recommendation,
        "evaluation": eval_doc
    }


@router.get("/{int_id}/evaluation")
async def get_interview_evaluation(int_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    existing = await db["interviews"].find_one({"_id": int_id})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")
    return {"interview_id": int_id, "evaluation": existing.get("evaluation")}


# WebRTC Video Signaling API for peer-to-peer online video rooms
@router.post("/video/signal/{room_id}")
async def post_video_signal(room_id: str, payload: dict):
    """
    Exchanges WebRTC signaling offers, answers, and ICE candidate packets between participants.
    """
    if room_id not in SIGNAL_STORE:
        SIGNAL_STORE[room_id] = []
    
    # Store with timestamp
    signal_entry = {
        "id": uuid.uuid4().hex[:8],
        "sender": payload.get("sender", "anonymous"),
        "type": payload.get("type", "candidate"),
        "data": payload.get("data"),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    SIGNAL_STORE[room_id].append(signal_entry)
    
    # Keep only last 50 signals per room
    if len(SIGNAL_STORE[room_id]) > 50:
        SIGNAL_STORE[room_id] = SIGNAL_STORE[room_id][-50:]

    return {"status": "ok", "signal_id": signal_entry["id"]}


@router.get("/video/signal/{room_id}")
async def get_video_signals(room_id: str, since: Optional[str] = Query(None)):
    """
    Pulls signals for room participants.
    """
    signals = SIGNAL_STORE.get(room_id, [])
    if since:
        signals = [s for s in signals if s.get("timestamp", "") > since]
    return {"room_id": room_id, "signals": signals}
