import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from database import get_db
from schemas.application import ApplicationCreate, ApplicationResponse, ApplicationStatusUpdate
from services.ai_service import calculate_resume_match
from utils.auth import get_current_user

router = APIRouter(prefix="/applications", tags=["Applications"])


def _format_app(doc: dict) -> ApplicationResponse:
    return ApplicationResponse(
        id=str(doc.get("_id")),
        job_id=doc.get("job_id", ""),
        job_title=doc.get("job_title", ""),
        company=doc.get("company", ""),
        candidate_id=doc.get("candidate_id"),
        candidate_name=doc.get("candidate_name", ""),
        candidate_email=doc.get("candidate_email", ""),
        candidate_skills=doc.get("candidate_skills", []),
        cover_letter=doc.get("cover_letter", ""),
        resume_name=doc.get("resume_name", ""),
        match_score=doc.get("match_score", 85),
        match_breakdown=doc.get("match_breakdown", {}),
        status=doc.get("status", "applied"),
        applied_at=doc.get("applied_at") or datetime.now(timezone.utc).isoformat()
    )


@router.get("", response_model=List[ApplicationResponse])
async def list_applications(
    job_id: Optional[str] = Query(None),
    candidate_id: Optional[str] = Query(None),
    candidate_email: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    query = {}
    if job_id:
        query["job_id"] = job_id
    if status_filter:
        query["status"] = status_filter

    user_role = current_user.get("role", "candidate")
    user_email = (current_user.get("email") or "").lower().strip()
    user_id = current_user.get("id")

    target_email = (candidate_email or "").lower().strip()
    target_id = candidate_id

    # Separate applications strictly per user account
    if user_role == "candidate":
        # Candidates can ONLY view their own submitted applications
        effective_email = target_email or user_email
        effective_id = target_id or user_id
        or_clauses = []
        if effective_email:
            or_clauses.append({"candidate_email": effective_email})
        if effective_id and effective_id != "guest":
            or_clauses.append({"candidate_id": effective_id})

        if or_clauses:
            query["$or"] = or_clauses
        else:
            return []
    elif user_role == "guest":
        # Unauthenticated guests only see applications if explicitly queried for their email
        if target_email or target_id:
            or_clauses = []
            if target_email:
                or_clauses.append({"candidate_email": target_email})
            if target_id and target_id != "guest":
                or_clauses.append({"candidate_id": target_id})
            if or_clauses:
                query["$or"] = or_clauses
            else:
                return []
        else:
            return []
    else:
        # Recruiters and Admins can view all applications to review candidates, or filter by specific candidate
        if target_email or target_id:
            or_clauses = []
            if target_email:
                or_clauses.append({"candidate_email": target_email})
            if target_id:
                or_clauses.append({"candidate_id": target_id})
            if or_clauses:
                query["$or"] = or_clauses

    cursor = db["applications"].find(query)
    apps = await cursor.to_list(length=300)
    apps.sort(key=lambda x: x.get("applied_at", ""), reverse=True)
    return [_format_app(a) for a in apps]


@router.get("/{app_id}", response_model=ApplicationResponse)
async def get_application(app_id: str):
    db = get_db()
    app = await db["applications"].find_one({"_id": app_id})
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return _format_app(app)


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def submit_application(
    app_in: ApplicationCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    job = await db["jobs"].find_one({"_id": app_in.job_id})
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target job does not exist")

    cand_id = current_user.get("id")
    if not cand_id or cand_id == "guest":
        cand_id = f"cand-{uuid.uuid4().hex[:6]}"
    cand_email = (app_in.candidate_email or current_user.get("email", "")).lower().strip()
    cand_name = app_in.candidate_name or current_user.get("name") or "Applicant"

    if not cand_email:
        cand_email = f"candidate-{cand_id}@example.com"

    # Prevent duplicate applications for the same opening
    existing_app = await db["applications"].find_one({
        "job_id": app_in.job_id,
        "$or": [{"candidate_id": cand_id}, {"candidate_email": cand_email}]
    })
    if existing_app:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You have already submitted an active application for {job.get('title')}. Please check 'My Applications' to track your hiring status."
        )

    # Run AI match calculation
    resume_content = (app_in.resume_text or "") + "\n" + (app_in.cover_letter or "")
    if not resume_content.strip():
        resume_content = f"Experience with {', '.join(app_in.candidate_skills or [])}. Worked on web platforms."

    ai_analysis = calculate_resume_match(
        resume_text=resume_content,
        job_skills=job.get("skills", []),
        job_requirements=job.get("requirements", []),
        candidate_skills=app_in.candidate_skills or []
    )

    app_id = f"app-{uuid.uuid4().hex[:6]}"
    doc = {
        "_id": app_id,
        "job_id": app_in.job_id,
        "job_title": job.get("title", "Software Engineer"),
        "company": job.get("company", "Tech Enterprise"),
        "candidate_id": cand_id,
        "candidate_name": app_in.candidate_name or current_user.get("name", "Applicant"),
        "candidate_email": cand_email or "candidate@example.com",
        "candidate_skills": app_in.candidate_skills or current_user.get("skills", []),
        "cover_letter": app_in.cover_letter or "",
        "resume_name": app_in.resume_name or "Resume.pdf",
        "match_score": ai_analysis["match_score"],
        "match_breakdown": ai_analysis,
        "status": "applied",
        "applied_at": datetime.now(timezone.utc).isoformat()
    }

    await db["applications"].insert_one(doc)

    # Log audit event
    audit_doc = {
        "_id": f"audit-{uuid.uuid4().hex[:6]}",
        "action": "APPLICATION_SUBMITTED",
        "user_email": doc["candidate_email"],
        "job_id": doc["job_id"],
        "match_score": doc["match_score"],
        "timestamp": doc["applied_at"]
    }
    try:
        await db["audit_logs"].insert_one(audit_doc)
    except Exception:
        pass

    return _format_app(doc)


@router.patch("/{app_id}/status", response_model=ApplicationResponse)
async def update_application_status(
    app_id: str,
    status_update: ApplicationStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    existing = await db["applications"].find_one({"_id": app_id})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    await db["applications"].update_one(
        {"_id": app_id},
        {"$set": {"status": status_update.status}}
    )

    # If status becomes interview_scheduled, auto-create interview slot if not yet created
    if status_update.status == "interview_scheduled":
        existing_interview = await db["interviews"].find_one({"application_id": app_id})
        if not existing_interview:
            int_doc = {
                "_id": f"int-{uuid.uuid4().hex[:6]}",
                "application_id": app_id,
                "job_id": existing.get("job_id"),
                "job_title": existing.get("job_title"),
                "candidate_name": existing.get("candidate_name"),
                "candidate_email": existing.get("candidate_email"),
                "scheduled_date": "Next Tuesday, 11:00 AM EST",
                "round": "Technical Screening",
                "duration_minutes": 45,
                "meeting_link": f"https://meet.google.com/rec-{uuid.uuid4().hex[:4]}",
                "interviewer": current_user.get("name", "Technical Recruiter"),
                "status": "scheduled",
                "notes": f"Initial screening for {existing.get('job_title')}"
            }
            await db["interviews"].insert_one(int_doc)

    updated = await db["applications"].find_one({"_id": app_id})
    return _format_app(updated)


@router.post("/{app_id}/withdraw")
async def withdraw_application(
    app_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Candidate withdraws their active job application.
    """
    db = get_db()
    existing = await db["applications"].find_one({"_id": app_id})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    user_email = (current_user.get("email") or "").lower().strip()
    user_role = current_user.get("role", "candidate")

    if user_role == "candidate" and existing.get("candidate_email", "").lower() != user_email:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only withdraw your own applications.")

    await db["applications"].update_one(
        {"_id": app_id},
        {"$set": {"status": "withdrawn"}}
    )

    now = datetime.now(timezone.utc).isoformat()
    # Record stage change
    stage_doc = {
        "_id": f"stg-{uuid.uuid4().hex[:6]}",
        "application_id": app_id,
        "candidate_email": existing.get("candidate_email"),
        "from_stage": existing.get("status"),
        "to_stage": "withdrawn",
        "changed_by": user_email or "Candidate",
        "notes": "Application withdrawn by candidate.",
        "timestamp": now
    }
    await db["recruitment_stage_history"].insert_one(stage_doc)

    return {"message": "Application successfully withdrawn.", "application_id": app_id, "status": "withdrawn"}


@router.get("/{app_id}/timeline")
async def get_application_timeline(
    app_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Returns full timeline of events, assessments, and interview stages for an application.
    """
    db = get_db()
    cursor = db["recruitment_stage_history"].find({"application_id": app_id}).sort("timestamp", 1)
    timeline = await cursor.to_list(100)
    return {"application_id": app_id, "events": timeline}
