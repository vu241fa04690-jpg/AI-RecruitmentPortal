import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from database import get_db
from schemas.assignment import (
    AssignmentCreate,
    AssignmentEvaluation,
    AssignmentResponse,
    AssignmentSubmissionCreate,
    AssignmentUpdate,
    SubmissionResponse
)
from utils.auth import get_current_user, require_roles

router = APIRouter(prefix="/assignments", tags=["Assignment Management"])


def _format_assignment(doc: dict, submissions_count: int = 0) -> AssignmentResponse:
    return AssignmentResponse(
        id=str(doc.get("_id")),
        title=doc.get("title", ""),
        category=doc.get("category", "Technical"),
        description=doc.get("description", ""),
        instructions=doc.get("instructions", ""),
        requirements=doc.get("requirements", []),
        deadline=doc.get("deadline", ""),
        total_marks=doc.get("total_marks", 100),
        passing_marks=doc.get("passing_marks", 50),
        assigned_to=doc.get("assigned_to", "all"),
        document_url=doc.get("document_url"),
        created_by=doc.get("created_by"),
        recruiter_name=doc.get("recruiter_name", "Hiring Team"),
        status=doc.get("status", "active"),
        created_at=doc.get("created_at") or datetime.now(timezone.utc).isoformat(),
        submissions_count=submissions_count
    )


def _format_submission(doc: dict) -> SubmissionResponse:
    return SubmissionResponse(
        id=str(doc.get("_id")),
        assignment_id=doc.get("assignment_id", ""),
        assignment_title=doc.get("assignment_title", "Assignment"),
        candidate_id=doc.get("candidate_id", ""),
        candidate_name=doc.get("candidate_name", "Candidate"),
        candidate_email=doc.get("candidate_email", ""),
        file_name=doc.get("file_name"),
        file_url=doc.get("file_url"),
        github_url=doc.get("github_url"),
        project_url=doc.get("project_url"),
        notes=doc.get("notes"),
        submitted_at=doc.get("submitted_at") or datetime.now(timezone.utc).isoformat(),
        status=doc.get("status", "submitted"),
        marks=doc.get("marks"),
        total_marks=doc.get("total_marks", 100),
        passing_marks=doc.get("passing_marks", 50),
        feedback=doc.get("feedback"),
        evaluated_by=doc.get("evaluated_by"),
        evaluated_at=doc.get("evaluated_at")
    )


# 1. LIST ASSIGNMENTS (Candidates see assigned/public, Recruiters & Admins see all)
@router.get("", response_model=List[AssignmentResponse])
async def list_assignments(
    category: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    query = {}
    if category and category != "all":
        query["category"] = category
    if status_filter:
        query["status"] = status_filter

    user_role = current_user.get("role", "candidate")
    user_id = current_user.get("id")

    if user_role == "candidate":
        # Candidate can see assignments assigned to 'all' or specifically to them
        or_clauses = [{"assigned_to": "all"}]
        if user_id:
            or_clauses.append({"assigned_to": user_id})
        query["$or"] = or_clauses

    cursor = db["assignments"].find(query)
    docs = await cursor.to_list(length=200)

    # Initial mock assignments if collection is empty
    if not docs and not query:
        sample_assignments = [
            {
                "_id": "asg-1",
                "title": "Full-Stack Task Management API & Dashboard",
                "category": "Coding",
                "description": "Design and implement a secure RESTful API in FastAPI with MongoDB persistence, JWT authentication, and a responsive React frontend with interactive task cards.",
                "instructions": "1. Implement CRUD endpoints for tasks with pagination.\n2. Write unit tests with pytest.\n3. Include a detailed README with setup instructions and API documentation.\n4. Submit GitHub repo link and live demo URL or ZIP archive.",
                "requirements": [
                    "Clean modular architecture with schemas and controllers",
                    "JWT Bearer authorization and rate-limiting",
                    "Comprehensive error handling with standard HTTP status codes",
                    "Frontend responsive design using React and Tailwind/CSS"
                ],
                "deadline": "2026-11-20T23:59:59Z",
                "total_marks": 100,
                "passing_marks": 60,
                "assigned_to": "all",
                "document_url": "https://talentai.dev/docs/assignment-sde-spec.pdf",
                "created_by": "recruiter-1",
                "recruiter_name": "CognitiveFlow Hiring Authority",
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "_id": "asg-2",
                "title": "Data Science & Feature Engineering Challenge",
                "category": "Technical",
                "description": "Clean and preprocess a 100,000-row customer churn dataset, train predictive machine learning models, and prepare an executive summary report with actionable insights.",
                "instructions": "1. Perform exploratory data analysis (EDA) and visualize correlations.\n2. Handle missing data and engineer at least 5 new features.\n3. Train XGBoost and Random Forest classifiers; report ROC-AUC, Precision, and Recall.\n4. Export trained model artifacts and write a 2-page findings PDF.",
                "requirements": [
                    "Jupyter Notebook with reproducible seed and comments",
                    "Model evaluation cross-validation matrix",
                    "Executive findings deck or PDF summary"
                ],
                "deadline": "2026-11-25T23:59:59Z",
                "total_marks": 100,
                "passing_marks": 70,
                "assigned_to": "all",
                "document_url": "https://talentai.dev/docs/ds-churn-data.pdf",
                "created_by": "recruiter-1",
                "recruiter_name": "FinPulse Analytics",
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "_id": "asg-3",
                "title": "Algorithms & System Performance Optimization Test",
                "category": "Aptitude",
                "description": "Solve three algorithmic performance puzzles: LRU Cache implementation with O(1) ops, Bounded Blocking Queue concurrency, and Graph Cycle topological resolution.",
                "instructions": "Implement each algorithm with strict memory bounds and optimal asymptotic complexity. All solutions must pass edge cases.",
                "requirements": [
                    "Time complexity O(1) for cache get and put",
                    "Thread safety and deadlock avoidance",
                    "Optimal space complexity"
                ],
                "deadline": "2026-11-18T18:00:00Z",
                "total_marks": 75,
                "passing_marks": 45,
                "assigned_to": "all",
                "document_url": None,
                "created_by": "admin-1",
                "recruiter_name": "TalentAI Technical Review Board",
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db["assignments"].insert_many(sample_assignments)
        docs = sample_assignments

    result = []
    for d in docs:
        sub_count = await db["assignment_submissions"].count_documents({"assignment_id": str(d.get("_id"))})
        result.append(_format_assignment(d, sub_count))
    return result


# 2. CREATE ASSIGNMENT (Recruiter / Admin only)
@router.post("", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    asg_in: AssignmentCreate,
    current_user: dict = Depends(require_roles(["recruiter", "admin"]))
):
    db = get_db()
    asg_id = f"asg-{uuid.uuid4().hex[:6]}"
    doc = {
        "_id": asg_id,
        "title": asg_in.title.strip(),
        "category": asg_in.category.strip(),
        "description": asg_in.description.strip(),
        "instructions": asg_in.instructions or "",
        "requirements": asg_in.requirements or [],
        "deadline": asg_in.deadline,
        "total_marks": asg_in.total_marks,
        "passing_marks": asg_in.passing_marks,
        "assigned_to": asg_in.assigned_to or "all",
        "document_url": asg_in.document_url,
        "created_by": current_user.get("id"),
        "recruiter_name": current_user.get("name") or "Hiring Authority",
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db["assignments"].insert_one(doc)
    return _format_assignment(doc, 0)


# 3. GET ASSIGNMENT DETAILS
@router.get("/{asg_id}", response_model=AssignmentResponse)
async def get_assignment(asg_id: str):
    db = get_db()
    asg = await db["assignments"].find_one({"_id": asg_id})
    if not asg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found.")
    sub_count = await db["assignment_submissions"].count_documents({"assignment_id": asg_id})
    return _format_assignment(asg, sub_count)


# 4. UPDATE ASSIGNMENT (Recruiter / Admin)
@router.put("/{asg_id}", response_model=AssignmentResponse)
async def update_assignment(
    asg_id: str,
    asg_update: AssignmentUpdate,
    current_user: dict = Depends(require_roles(["recruiter", "admin"]))
):
    db = get_db()
    update_data = {k: v for k, v in asg_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided for update.")

    res = await db["assignments"].update_one({"_id": asg_id}, {"$set": update_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found.")

    updated_asg = await db["assignments"].find_one({"_id": asg_id})
    sub_count = await db["assignment_submissions"].count_documents({"assignment_id": asg_id})
    return _format_assignment(updated_asg, sub_count)


# 5. DELETE ASSIGNMENT (Recruiter / Admin)
@router.delete("/{asg_id}")
async def delete_assignment(
    asg_id: str,
    current_user: dict = Depends(require_roles(["recruiter", "admin"]))
):
    db = get_db()
    res = await db["assignments"].delete_one({"_id": asg_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found.")
    await db["assignment_submissions"].delete_many({"assignment_id": asg_id})
    return {"status": "success", "message": "Assignment and associated submissions deleted successfully."}


# 6. SUBMIT ASSIGNMENT (Candidate)
@router.post("/{asg_id}/submit", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def submit_assignment(
    asg_id: str,
    sub_in: AssignmentSubmissionCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    asg = await db["assignments"].find_one({"_id": asg_id})
    if not asg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target assignment does not exist.")

    cand_id = current_user.get("id") or f"cand-{uuid.uuid4().hex[:6]}"
    cand_name = current_user.get("name") or "Candidate"
    cand_email = current_user.get("email") or "candidate@example.com"

    sub_id = f"sub-{uuid.uuid4().hex[:8]}"
    doc = {
        "_id": sub_id,
        "assignment_id": asg_id,
        "assignment_title": asg.get("title", "Assignment"),
        "candidate_id": cand_id,
        "candidate_name": cand_name,
        "candidate_email": cand_email,
        "file_name": sub_in.file_name or "submission.pdf",
        "file_url": sub_in.file_url,
        "github_url": sub_in.github_url,
        "project_url": sub_in.project_url,
        "notes": sub_in.notes or "",
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "status": "submitted",
        "marks": None,
        "total_marks": asg.get("total_marks", 100),
        "passing_marks": asg.get("passing_marks", 50),
        "feedback": None,
        "evaluated_by": None,
        "evaluated_at": None
    }
    await db["assignment_submissions"].insert_one(doc)
    return _format_submission(doc)


# 7. GET SUBMISSIONS FOR AN ASSIGNMENT (Recruiter / Admin)
@router.get("/{asg_id}/submissions", response_model=List[SubmissionResponse])
async def list_assignment_submissions(
    asg_id: str,
    current_user: dict = Depends(require_roles(["recruiter", "admin"]))
):
    db = get_db()
    cursor = db["assignment_submissions"].find({"assignment_id": asg_id}).sort("submitted_at", -1)
    submissions = await cursor.to_list(length=200)
    return [_format_submission(s) for s in submissions]


# 8. GET CANDIDATE'S OWN SUBMISSIONS
@router.get("/submissions/my", response_model=List[SubmissionResponse])
async def get_my_submissions(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user.get("id")
    user_email = (current_user.get("email") or "").lower().strip()

    query = {}
    or_clauses = []
    if user_id:
        or_clauses.append({"candidate_id": user_id})
    if user_email:
        or_clauses.append({"candidate_email": user_email})

    if or_clauses:
        query["$or"] = or_clauses

    cursor = db["assignment_submissions"].find(query).sort("submitted_at", -1)
    submissions = await cursor.to_list(length=100)
    return [_format_submission(s) for s in submissions]


# 9. EVALUATE / GRADE SUBMISSION (Recruiter / Admin)
@router.put("/submissions/{sub_id}/evaluate", response_model=SubmissionResponse)
async def evaluate_submission(
    sub_id: str,
    eval_in: AssignmentEvaluation,
    current_user: dict = Depends(require_roles(["recruiter", "admin"]))
):
    db = get_db()
    sub = await db["assignment_submissions"].find_one({"_id": sub_id})
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found.")

    update_fields = {
        "marks": eval_in.marks,
        "feedback": eval_in.feedback,
        "status": eval_in.status,
        "evaluated_by": current_user.get("name") or "Recruiter",
        "evaluated_at": datetime.now(timezone.utc).isoformat()
    }

    await db["assignment_submissions"].update_one({"_id": sub_id}, {"$set": update_fields})
    updated = await db["assignment_submissions"].find_one({"_id": sub_id})
    return _format_submission(updated)
