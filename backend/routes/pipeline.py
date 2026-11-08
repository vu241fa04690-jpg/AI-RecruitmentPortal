import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from database import get_db
from utils.auth import get_current_user

router = APIRouter(prefix="/pipeline", tags=["Recruitment Pipeline"])

PIPELINE_STAGES = [
    {"key": "applied", "label": "Applied", "category": "screening"},
    {"key": "resume_screening", "label": "Resume Screening", "category": "screening"},
    {"key": "shortlisted", "label": "Shortlisted", "category": "screening"},
    {"key": "assignment_assigned", "label": "Assignment Assigned", "category": "assessment"},
    {"key": "assignment_submitted", "label": "Assignment Submitted", "category": "assessment"},
    {"key": "assignment_evaluated", "label": "Assignment Evaluated", "category": "assessment"},
    {"key": "aptitude_assessment", "label": "Aptitude Assessment", "category": "assessment"},
    {"key": "technical_interview", "label": "Technical Interview", "category": "interview"},
    {"key": "face_to_face_interview", "label": "Face-to-Face Interview", "category": "interview"},
    {"key": "hr_interview", "label": "HR Interview", "category": "interview"},
    {"key": "final_interview", "label": "Final Interview", "category": "interview"},
    {"key": "selected", "label": "Selected / Offered", "category": "hiring"},
    {"key": "rejected", "label": "Rejected", "category": "hiring"}
]

DEFAULT_JOB_ROUNDS = [
    {"round_number": 1, "name": "Aptitude Assessment", "type": "online_assessment", "duration_minutes": 30, "instructions": "Standard quantitative and logic assessment."},
    {"round_number": 2, "name": "Technical Assignment", "type": "assignment", "duration_minutes": 120, "instructions": "Hands-on project or algorithmic coding assignment."},
    {"round_number": 3, "name": "Technical Interview", "type": "online_video", "duration_minutes": 60, "instructions": "Deep dive into system architecture, data structures, and code."},
    {"round_number": 4, "name": "Face-to-Face Interview", "type": "face_to_face", "duration_minutes": 60, "instructions": "In-person architectural review with engineering leads."},
    {"round_number": 5, "name": "HR Interview", "type": "online_video", "duration_minutes": 45, "instructions": "Cultural alignment, behavioral scenarios, and benefits review."},
    {"round_number": 6, "name": "Final Interview", "type": "online_video", "duration_minutes": 45, "instructions": "Leadership discussion and executive offer confirmation."}
]


class MoveStageRequest(BaseModel):
    application_id: str
    target_stage: str = Field(..., description="Target stage key from 13 stages")
    notes: Optional[str] = "Moved stage in recruitment pipeline"


class RoundCreate(BaseModel):
    round_number: int
    name: str
    type: str = Field(..., description="online_assessment, assignment, online_video, face_to_face")
    duration_minutes: int = 45
    instructions: Optional[str] = ""
    interviewer: Optional[str] = "Engineering Lead"


@router.get("/stages")
async def list_stages():
    """
    Returns the 13 defined recruitment stages.
    """
    return {"stages": PIPELINE_STAGES}


@router.get("/summary")
async def get_pipeline_summary(
    job_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Returns candidate distribution and counts across all 13 pipeline stages.
    """
    db = get_db()
    query = {}
    if job_id:
        query["job_id"] = job_id

    cursor = db["applications"].find(query)
    all_apps = await cursor.to_list(500)

    # Initialize count per stage
    stage_buckets = {s["key"]: [] for s in PIPELINE_STAGES}

    for app in all_apps:
        stg = app.get("status", "applied").lower()
        # Normalization mapping
        if stg in ["interview_scheduled", "interview"]:
            stg = "technical_interview"
        elif stg in ["shortlist"]:
            stg = "shortlisted"
        elif stg not in stage_buckets:
            stg = "applied"

        stage_buckets[stg].append({
            "id": str(app.get("_id")),
            "job_id": app.get("job_id"),
            "job_title": app.get("job_title"),
            "candidate_name": app.get("candidate_name"),
            "candidate_email": app.get("candidate_email"),
            "match_score": app.get("match_score", 80),
            "applied_at": app.get("applied_at"),
            "status": stg
        })

    summary = [
        {
            "key": s["key"],
            "label": s["label"],
            "category": s["category"],
            "count": len(stage_buckets[s["key"]]),
            "candidates": stage_buckets[s["key"]]
        }
        for s in PIPELINE_STAGES
    ]

    return {
        "total_candidates": len(all_apps),
        "stages": summary
    }


@router.post("/move-stage")
async def move_candidate_stage(
    req: MoveStageRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Moves a candidate to a new pipeline stage, creates an audit log entry in recruitment_stage_history,
    and dispatches a notification to the candidate.
    """
    db = get_db()
    role = current_user.get("role", "candidate")
    if role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only recruiters can progress candidates in pipeline.")

    app = await db["applications"].find_one({"_id": req.application_id})
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    old_stage = app.get("status", "applied")
    new_stage = req.target_stage.lower()

    # Update application
    await db["applications"].update_one(
        {"_id": req.application_id},
        {"$set": {"status": new_stage}}
    )

    now = datetime.now(timezone.utc)
    # Record stage history audit
    history_id = f"stg-{uuid.uuid4().hex[:8]}"
    stage_entry = {
        "_id": history_id,
        "application_id": req.application_id,
        "candidate_email": app.get("candidate_email"),
        "from_stage": old_stage,
        "to_stage": new_stage,
        "changed_by": current_user.get("email") or current_user.get("name", "Recruiter"),
        "notes": req.notes,
        "timestamp": now.isoformat()
    }
    await db["recruitment_stage_history"].insert_one(stage_entry)

    # Friendly human-readable stage name
    stage_label = next((s["label"] for s in PIPELINE_STAGES if s["key"] == new_stage), new_stage.replace("_", " ").title())

    # Send in-app notification to candidate
    notif = {
        "_id": f"notif-{uuid.uuid4().hex[:6]}",
        "recipient_id": app.get("candidate_email"),
        "title": f"Application Update: {app.get('job_title', 'Role')}",
        "message": f"Your application has advanced to the '{stage_label}' stage at {app.get('company', 'TalentAI Partner')}.",
        "category": "application",
        "link": "/dashboard?tab=applications",
        "read": False,
        "created_at": now.isoformat()
    }
    await db["notifications"].insert_one(notif)

    return {
        "message": f"Candidate successfully moved to {stage_label}",
        "application_id": req.application_id,
        "new_stage": new_stage,
        "history_id": history_id
    }


@router.get("/history/{app_id}")
async def get_candidate_stage_history(
    app_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Returns full chronological audit trail of recruitment stages for an application.
    """
    db = get_db()
    cursor = db["recruitment_stage_history"].find({"application_id": app_id}).sort("timestamp", 1)
    history = await cursor.to_list(100)
    return {"application_id": app_id, "total_events": len(history), "timeline": history}


@router.get("/rounds/{job_id}")
async def get_job_rounds(job_id: str, current_user: dict = Depends(get_current_user)):
    """
    Returns customizable interview pipeline rounds configured for a specific job.
    Falls back to default 6-round pipeline if not explicitly customized.
    """
    db = get_db()
    configured = await db["interview_rounds"].find({"job_id": job_id}).sort("round_number", 1).to_list(20)
    if not configured:
        return {"job_id": job_id, "is_custom": False, "rounds": DEFAULT_JOB_ROUNDS}
    return {"job_id": job_id, "is_custom": True, "rounds": configured}


@router.post("/rounds/{job_id}")
async def save_job_rounds(
    job_id: str,
    rounds: List[RoundCreate],
    current_user: dict = Depends(get_current_user)
):
    """
    Customizes the interview rounds pipeline for a job.
    """
    db = get_db()
    role = current_user.get("role", "candidate")
    if role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    await db["interview_rounds"].delete_many({"job_id": job_id})
    docs = []
    for r in rounds:
        doc = {
            "_id": f"rnd-{uuid.uuid4().hex[:6]}",
            "job_id": job_id,
            "round_number": r.round_number,
            "name": r.name,
            "type": r.type,
            "duration_minutes": r.duration_minutes,
            "instructions": r.instructions or "",
            "interviewer": r.interviewer or "Technical Lead"
        }
        docs.append(doc)
    if docs:
        await db["interview_rounds"].insert_many(docs)

    return {"message": "Pipeline rounds successfully updated", "total_rounds": len(docs), "rounds": docs}
