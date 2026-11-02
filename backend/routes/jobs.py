import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from database import get_db
from schemas.job import JobCreate, JobResponse, JobUpdate
from utils.auth import get_current_user

router = APIRouter(prefix="/jobs", tags=["Jobs"])


def _format_job(job_doc: dict) -> JobResponse:
    return JobResponse(
        id=str(job_doc.get("_id") or job_doc.get("id")),
        title=job_doc.get("title", ""),
        company=job_doc.get("company", ""),
        location=job_doc.get("location", ""),
        type=job_doc.get("type", "Full-Time Job"),
        domain=job_doc.get("domain", "software"),
        category=job_doc.get("category", "job"),
        duration=job_doc.get("duration"),
        stipend_or_salary=job_doc.get("stipend_or_salary") or job_doc.get("salary_range", ""),
        experience_level=job_doc.get("experience_level", "College Students & Freshers"),
        eligibility=job_doc.get("eligibility"),
        salary_range=job_doc.get("salary_range", ""),
        department=job_doc.get("department", "Engineering"),
        description=job_doc.get("description", ""),
        requirements=job_doc.get("requirements", []),
        skills=job_doc.get("skills", []),
        interview_rounds=job_doc.get("interview_rounds", []),
        benefits=job_doc.get("benefits", []),
        deadline_days_left=job_doc.get("deadline_days_left", 5),
        applicants_count=job_doc.get("applicants_count", 120),
        verified_partner=job_doc.get("verified_partner", True),
        company_logo_color=job_doc.get("company_logo_color", "#0066cc"),
        status=job_doc.get("status", "active"),
        posted_by=job_doc.get("posted_by", "recruiter-1"),
        created_at=job_doc.get("created_at") or datetime.now(timezone.utc).isoformat()
    )


@router.get("", response_model=List[JobResponse])
async def list_jobs(
    search: Optional[str] = Query(None, description="Search by title, company, or skills"),
    category: Optional[str] = Query(None, description="internship or job"),
    domain: Optional[str] = Query(None, description="software, business, hardware"),
    job_type: Optional[str] = Query(None, description="Full-Time, Remote, Part-Time, etc."),
    location: Optional[str] = Query(None, description="Location search"),
    status_filter: Optional[str] = Query(None, description="Filter by status")
):
    db = get_db()
    cursor = db["jobs"].find({})
    jobs = await cursor.to_list(length=200)

    filtered = []
    for j in jobs:
        if status_filter and j.get("status") != status_filter:
            continue
        if category and category != "all" and j.get("category", "").lower() != category.lower():
            continue
        if domain and domain != "all" and j.get("domain", "software").lower() != domain.lower():
            continue
        if job_type and job_type.lower() not in j.get("type", "").lower():
            continue
        if location and location.lower() not in j.get("location", "").lower():
            continue
        if search:
            s = search.lower()
            title = j.get("title", "").lower()
            company = j.get("company", "").lower()
            skills_str = " ".join(j.get("skills", [])).lower()
            dept_str = j.get("department", "").lower()
            if s not in title and s not in company and s not in skills_str and s not in dept_str:
                continue
        filtered.append(_format_job(j))

    return filtered


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    db = get_db()
    job = await db["jobs"].find_one({"_id": job_id})
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return _format_job(job)


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(job_in: JobCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    job_id = f"job-{uuid.uuid4().hex[:6]}"
    doc = {
        "_id": job_id,
        "title": job_in.title,
        "company": job_in.company,
        "location": job_in.location,
        "type": job_in.type,
        "experience_level": job_in.experience_level,
        "salary_range": job_in.salary_range,
        "department": job_in.department,
        "description": job_in.description,
        "requirements": job_in.requirements,
        "skills": job_in.skills,
        "status": job_in.status or "active",
        "posted_by": current_user.get("id", "recruiter-1"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db["jobs"].insert_one(doc)
    return _format_job(doc)


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(job_id: str, job_update: JobUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    existing = await db["jobs"].find_one({"_id": job_id})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    update_data = {k: v for k, v in job_update.model_dump().items() if v is not None}
    if update_data:
        await db["jobs"].update_one({"_id": job_id}, {"$set": update_data})

    updated = await db["jobs"].find_one({"_id": job_id})
    return _format_job(updated)


@router.delete("/{job_id}")
async def delete_job(job_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    res = await db["jobs"].delete_one({"_id": job_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return {"message": "Job deleted successfully", "id": job_id}


@router.post("/{job_id}/save")
async def save_job_for_candidate(job_id: str, current_user: dict = Depends(get_current_user)):
    """
    Saves/bookmarks a job posting for the current candidate in MongoDB.
    """
    db = get_db()
    cand_id = current_user.get("id") or current_user.get("email")
    job = await db["jobs"].find_one({"_id": job_id})
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    existing = await db["saved_jobs"].find_one({"candidate_id": cand_id, "job_id": job_id})
    if not existing:
        await db["saved_jobs"].insert_one({
            "_id": f"save-{uuid.uuid4().hex[:6]}",
            "candidate_id": cand_id,
            "job_id": job_id,
            "saved_at": datetime.now(timezone.utc).isoformat()
        })
    return {"message": "Job bookmarked successfully", "job_id": job_id, "saved": True}


@router.delete("/{job_id}/save")
async def unsave_job_for_candidate(job_id: str, current_user: dict = Depends(get_current_user)):
    """
    Removes a bookmarked job for the candidate.
    """
    db = get_db()
    cand_id = current_user.get("id") or current_user.get("email")
    await db["saved_jobs"].delete_one({"candidate_id": cand_id, "job_id": job_id})
    return {"message": "Job removed from bookmarks", "job_id": job_id, "saved": False}


@router.get("/saved/list", response_model=List[JobResponse])
async def list_saved_jobs_for_candidate(current_user: dict = Depends(get_current_user)):
    """
    Returns all jobs bookmarked by the candidate.
    """
    db = get_db()
    cand_id = current_user.get("id") or current_user.get("email")
    saved_cursor = db["saved_jobs"].find({"candidate_id": cand_id})
    saved_records = []
    async for s in saved_cursor:
        saved_records.append(s)

    job_ids = [s.get("job_id") for s in saved_records]
    if not job_ids:
        return []

    jobs_cursor = db["jobs"].find({"_id": {"$in": job_ids}})
    saved_jobs = []
    async for j in jobs_cursor:
        saved_jobs.append(_format_job(j))
    return saved_jobs

