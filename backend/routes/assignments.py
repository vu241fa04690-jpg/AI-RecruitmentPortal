import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from pydantic import BaseModel, Field
from database import get_db
from utils.auth import get_current_user

router = APIRouter(prefix="/assignments", tags=["Assignments"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "assignments")
os.makedirs(UPLOAD_DIR, exist_ok=True)


class AssignmentCreate(BaseModel):
    title: str = Field(..., min_length=3)
    type: str = Field(..., description="coding, aptitude, mcq, technical, project")
    description: str
    instructions: Optional[str] = ""
    deadline: str = Field(..., description="ISO 8601 or string formatted date")
    total_marks: int = Field(default=100, ge=1)
    passing_marks: int = Field(default=50, ge=1)
    evaluation_criteria: Optional[List[str]] = []
    allowed_file_types: Optional[List[str]] = [".pdf", ".docx", ".zip", "github_link", "project_link"]
    allow_late_submission: bool = False
    job_id: Optional[str] = None
    job_title: Optional[str] = None
    assigned_candidates: Optional[List[str]] = []  # list of candidate emails or IDs


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    deadline: Optional[str] = None
    total_marks: Optional[int] = None
    passing_marks: Optional[int] = None
    evaluation_criteria: Optional[List[str]] = None
    allow_late_submission: Optional[bool] = None
    assigned_candidates: Optional[List[str]] = None


class AssignmentSubmissionCreate(BaseModel):
    assignment_id: str
    github_link: Optional[str] = None
    project_link: Optional[str] = None
    submission_notes: Optional[str] = None
    submitted_files: Optional[List[str]] = []


class SubmissionEvaluation(BaseModel):
    marks_awarded: int
    feedback: str
    status: str = Field(..., description="approved, rejected, resubmission_requested")


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_assignment(
    assign_in: AssignmentCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Recruiter creates a new assignment (Coding, Aptitude, MCQ, Technical, or Project).
    """
    db = get_db()
    role = current_user.get("role", "candidate")
    if role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only recruiters or administrators can create assignments.")

    assign_id = f"asgn-{uuid.uuid4().hex[:8]}"
    doc = {
        "_id": assign_id,
        "title": assign_in.title,
        "type": assign_in.type.lower(),
        "description": assign_in.description,
        "instructions": assign_in.instructions or "",
        "deadline": assign_in.deadline,
        "total_marks": assign_in.total_marks,
        "passing_marks": assign_in.passing_marks,
        "evaluation_criteria": assign_in.evaluation_criteria or [
            "Code Quality & Architecture",
            "Completeness & Test Coverage",
            "Problem Solving Approach",
            "Documentation & Presentation"
        ],
        "allowed_file_types": assign_in.allowed_file_types or [".pdf", ".docx", ".zip", "github_link", "project_link"],
        "allow_late_submission": assign_in.allow_late_submission,
        "job_id": assign_in.job_id or "",
        "job_title": assign_in.job_title or "Software Engineer",
        "assigned_candidates": assign_in.assigned_candidates or [],
        "created_by": current_user.get("email") or current_user.get("id"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db["assignments"].insert_one(doc)

    # Automatically notify assigned candidates
    for cand_email in doc["assigned_candidates"]:
        notif = {
            "_id": f"notif-{uuid.uuid4().hex[:6]}",
            "recipient_id": cand_email,
            "title": f"New Assignment Assigned: {doc['title']}",
            "message": f"You have been assigned '{doc['title']}' ({doc['type'].title()}). Deadline: {doc['deadline']}.",
            "category": "assignment",
            "link": "/dashboard?tab=assignments",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        try:
            await db["notifications"].insert_one(notif)
        except Exception:
            pass

    return doc


@router.get("")
async def list_assignments(
    job_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    List assignments. Recruiters see all assignments created by them or their company;
    Candidates see assignments specifically assigned to them or for jobs they applied to.
    """
    db = get_db()
    role = current_user.get("role", "candidate")
    user_email = (current_user.get("email") or "").lower().strip()

    query: Dict[str, Any] = {}
    if job_id:
        query["job_id"] = job_id

    if role == "candidate":
        # Check jobs candidate applied to
        cand_apps = await db["applications"].find({"candidate_email": user_email}).to_list(100)
        applied_job_ids = [a.get("job_id") for a in cand_apps if a.get("job_id")]

        query["$or"] = [
            {"assigned_candidates": {"$in": [user_email, current_user.get("id")]}},
            {"assigned_candidates": []},  # open to all applicants
            {"job_id": {"$in": applied_job_ids}}
        ]

    cursor = db["assignments"].find(query).sort("created_at", -1)
    assignments = []
    async for a in cursor:
        # Check if candidate has submitted
        sub_doc = await db["assignment_submissions"].find_one({
            "assignment_id": a["_id"],
            "candidate_email": user_email
        })
        a["my_submission"] = sub_doc
        assignments.append(a)

    return {"total": len(assignments), "assignments": assignments}


@router.get("/{assign_id}")
async def get_assignment(assign_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    assignment = await db["assignments"].find_one({"_id": assign_id})
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    
    user_email = (current_user.get("email") or "").lower().strip()
    sub_doc = await db["assignment_submissions"].find_one({
        "assignment_id": assign_id,
        "candidate_email": user_email
    })
    assignment["my_submission"] = sub_doc
    return assignment


@router.put("/{assign_id}")
async def update_assignment(
    assign_id: str,
    update_data: AssignmentUpdate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    role = current_user.get("role", "candidate")
    if role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    existing = await db["assignments"].find_one({"_id": assign_id})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    payload = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if payload:
        await db["assignments"].update_one({"_id": assign_id}, {"$set": payload})

    updated = await db["assignments"].find_one({"_id": assign_id})
    return updated


@router.delete("/{assign_id}")
async def delete_assignment(assign_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    role = current_user.get("role", "candidate")
    if role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    await db["assignments"].delete_one({"_id": assign_id})
    await db["assignment_submissions"].delete_many({"assignment_id": assign_id})
    return {"message": "Assignment and associated submissions deleted", "id": assign_id}


@router.post("/{assign_id}/submit")
async def submit_assignment(
    assign_id: str,
    sub_in: AssignmentSubmissionCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Candidate submits their assignment (PDF/DOCX/ZIP attachment references, GitHub link, project link, and notes).
    Enforces deadline validation unless allow_late_submission is enabled.
    """
    db = get_db()
    assignment = await db["assignments"].find_one({"_id": assign_id})
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    cand_email = (current_user.get("email") or "").lower().strip()
    cand_name = current_user.get("name") or current_user.get("full_name") or "Candidate"

    # Deadline enforcement
    deadline_str = assignment.get("deadline", "")
    now = datetime.now(timezone.utc)
    is_late = False
    try:
        deadline_dt = datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
        if now > deadline_dt:
            if not assignment.get("allow_late_submission", False):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Assignment deadline has passed. Submissions are no longer accepted."
                )
            is_late = True
    except (ValueError, TypeError):
        pass

    # Check for existing submission
    existing_sub = await db["assignment_submissions"].find_one({
        "assignment_id": assign_id,
        "candidate_email": cand_email
    })

    if existing_sub and existing_sub.get("status") not in ["resubmission_requested", "rejected"]:
        # If already approved or submitted without resubmission permission
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted this assignment. Resubmission is only allowed if requested by the recruiter."
        )

    sub_id = existing_sub["_id"] if existing_sub else f"sub-{uuid.uuid4().hex[:8]}"
    doc = {
        "_id": sub_id,
        "assignment_id": assign_id,
        "assignment_title": assignment.get("title", ""),
        "candidate_id": current_user.get("id"),
        "candidate_name": cand_name,
        "candidate_email": cand_email,
        "github_link": sub_in.github_link or "",
        "project_link": sub_in.project_link or "",
        "submission_notes": sub_in.submission_notes or "",
        "submitted_files": sub_in.submitted_files or [],
        "is_late": is_late,
        "status": "submitted",
        "marks_awarded": None,
        "feedback": "",
        "evaluated_at": None,
        "submitted_at": now.isoformat(),
        "resubmission_count": (existing_sub.get("resubmission_count", 0) + 1) if existing_sub else 0
    }

    if existing_sub:
        await db["assignment_submissions"].replace_one({"_id": sub_id}, doc)
    else:
        await db["assignment_submissions"].insert_one(doc)

    # Update candidate application stage if applicable
    app = await db["applications"].find_one({"candidate_email": cand_email, "job_id": assignment.get("job_id")})
    if app:
        await db["applications"].update_one(
            {"_id": app["_id"]},
            {"$set": {"status": "assignment_submitted"}}
        )
        stage_doc = {
            "_id": f"stg-{uuid.uuid4().hex[:6]}",
            "application_id": app["_id"],
            "candidate_email": cand_email,
            "stage": "assignment_submitted",
            "changed_by": cand_email,
            "notes": f"Submitted assignment: {assignment.get('title')}",
            "timestamp": now.isoformat()
        }
        await db["recruitment_stage_history"].insert_one(stage_doc)

    return {"message": "Assignment successfully submitted!", "submission": doc}


@router.get("/{assign_id}/submissions")
async def list_assignment_submissions(
    assign_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Recruiter lists all candidate submissions for an assignment.
    """
    db = get_db()
    role = current_user.get("role", "candidate")
    if role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    cursor = db["assignment_submissions"].find({"assignment_id": assign_id}).sort("submitted_at", -1)
    submissions = await cursor.to_list(200)
    return {"total": len(submissions), "submissions": submissions}


@router.post("/submissions/{sub_id}/evaluate")
async def evaluate_submission(
    sub_id: str,
    eval_in: SubmissionEvaluation,
    current_user: dict = Depends(get_current_user)
):
    """
    Recruiter evaluates candidate assignment: assigns marks, writes detailed feedback,
    and sets status to 'approved', 'rejected', or 'resubmission_requested'.
    """
    db = get_db()
    role = current_user.get("role", "candidate")
    if role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    submission = await db["assignment_submissions"].find_one({"_id": sub_id})
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    assignment = await db["assignments"].find_one({"_id": submission["assignment_id"]})
    passing_marks = assignment.get("passing_marks", 50) if assignment else 50

    eval_data = {
        "marks_awarded": eval_in.marks_awarded,
        "feedback": eval_in.feedback,
        "status": eval_in.status,
        "evaluated_by": current_user.get("name") or current_user.get("email"),
        "evaluated_at": datetime.now(timezone.utc).isoformat()
    }

    await db["assignment_submissions"].update_one(
        {"_id": sub_id},
        {"$set": eval_data}
    )

    # Notify the candidate
    notif = {
        "_id": f"notif-{uuid.uuid4().hex[:6]}",
        "recipient_id": submission["candidate_email"],
        "title": f"Assignment Evaluated: {submission.get('assignment_title', 'Task')}",
        "message": f"Your submission received {eval_in.marks_awarded} marks. Status: {eval_in.status.replace('_', ' ').title()}.",
        "category": "assignment",
        "link": "/dashboard?tab=assignments",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db["notifications"].insert_one(notif)

    # Progress candidate in recruitment pipeline
    app = await db["applications"].find_one({
        "candidate_email": submission["candidate_email"],
        "job_id": assignment.get("job_id") if assignment else None
    })
    if app:
        new_stage = "assignment_evaluated" if eval_in.status == "approved" else ("rejected" if eval_in.status == "rejected" else "assignment_assigned")
        await db["applications"].update_one(
            {"_id": app["_id"]},
            {"$set": {"status": new_stage}}
        )
        stage_doc = {
            "_id": f"stg-{uuid.uuid4().hex[:6]}",
            "application_id": app["_id"],
            "candidate_email": submission["candidate_email"],
            "stage": new_stage,
            "changed_by": current_user.get("email", "Recruiter"),
            "notes": f"Assignment evaluated: {eval_in.marks_awarded} marks - {eval_in.status}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db["recruitment_stage_history"].insert_one(stage_doc)

    return {"message": "Submission evaluated successfully", "status": eval_in.status}

