import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from database import get_db
from utils.auth import get_current_user

router = APIRouter(prefix="/resumes", tags=["Resume Builder & Versions"])


class ResumeExperience(BaseModel):
    title: str
    company: str
    duration: str
    description: str


class ResumeEducation(BaseModel):
    degree: str
    institution: str
    year: str
    grade: Optional[str] = None


class ResumeProject(BaseModel):
    title: str
    tech_stack: str
    description: str
    link: Optional[str] = None


class ResumeBuilderSchema(BaseModel):
    resume_title: str
    full_name: str
    email: str
    phone: str
    location: str
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None
    summary: str
    skills: List[str]
    experiences: List[ResumeExperience] = []
    education: List[ResumeEducation] = []
    projects: List[ResumeProject] = []
    certifications: List[str] = []


@router.post("/builder/save")
async def save_builder_resume(
    resume_data: ResumeBuilderSchema,
    current_user: dict = Depends(get_current_user)
):
    """
    Saves or updates an ATS-friendly structured resume version for the candidate in MongoDB.
    """
    db = get_db()
    cand_id = current_user.get("id") or current_user.get("email")
    resume_id = f"res-{uuid.uuid4().hex[:8]}"

    doc = {
        "_id": resume_id,
        "candidate_id": cand_id,
        "resume_title": resume_data.resume_title,
        "full_name": resume_data.full_name,
        "email": resume_data.email,
        "phone": resume_data.phone,
        "location": resume_data.location,
        "linkedin": resume_data.linkedin,
        "github": resume_data.github,
        "portfolio": resume_data.portfolio,
        "summary": resume_data.summary,
        "skills": resume_data.skills,
        "experiences": [e.model_dump() for e in resume_data.experiences],
        "education": [ed.model_dump() for ed in resume_data.education],
        "projects": [p.model_dump() for p in resume_data.projects],
        "certifications": resume_data.certifications,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_primary": True
    }

    # Set existing resumes to not primary
    await db["resumes"].update_many(
        {"candidate_id": cand_id},
        {"$set": {"is_primary": False}}
    )

    await db["resumes"].insert_one(doc)
    return {"message": "Resume version saved successfully", "resume_id": resume_id, "resume": doc}


@router.get("/builder/list")
async def list_candidate_resumes(current_user: dict = Depends(get_current_user)):
    """
    Retrieves all resume versions saved by the candidate.
    """
    db = get_db()
    cand_id = current_user.get("id") or current_user.get("email")
    cursor = db["resumes"].find({"candidate_id": cand_id})
    resumes = []
    async for r in cursor:
        resumes.append(r)

    # If candidate doesn't have a saved resume yet, return a template
    if not resumes:
        default_resume = {
            "_id": "res-default",
            "candidate_id": cand_id,
            "resume_title": "Primary Full-Stack Resume",
            "full_name": current_user.get("name", "Sumii"),
            "email": current_user.get("email", "sumii@example.com"),
            "phone": current_user.get("phone", "+1 555-0192"),
            "location": "Bengaluru, India / Remote",
            "linkedin": "linkedin.com/in/sumii-dev",
            "github": "github.com/sumii-tech",
            "portfolio": "sumii.dev",
            "summary": "High-performing Full-Stack Engineer with 3+ years of experience engineering asynchronous FastAPI microservices, reactive React web applications, and MongoDB cloud architectures.",
            "skills": current_user.get("skills") or ["Python", "FastAPI", "React", "Docker", "MongoDB", "TypeScript"],
            "experiences": [
                {
                    "title": "Software Engineer",
                    "company": "CognitiveFlow Labs",
                    "duration": "2024 - Present",
                    "description": "Architected distributed RESTful APIs using FastAPI and MongoDB Atlas. Reduced 99th percentile query latency by 45% using compound indexing and Redis caching."
                }
            ],
            "education": [
                {
                    "degree": "B.Tech in Computer Science & Engineering",
                    "institution": "National Institute of Technology",
                    "year": "2021 - 2025",
                    "grade": "8.9 / 10 CGPA"
                }
            ],
            "projects": [
                {
                    "title": "AI Recruitment Portal",
                    "tech_stack": "FastAPI, React 18, Vite, MongoDB, Sentence Transformers",
                    "description": "Engineered automated resume parsing and ATS matching engine supporting concurrent PDF/DOCX processing.",
                    "link": "https://github.com/sumii-tech/ai-recruitment"
                }
            ],
            "certifications": [
                "AWS Certified Cloud Practitioner",
                "DeepLearning.AI Machine Learning Specialization"
            ],
            "is_primary": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        resumes.append(default_resume)

    return {"resumes": resumes}


@router.delete("/builder/{resume_id}")
async def delete_builder_resume(resume_id: str, current_user: dict = Depends(get_current_user)):
    """
    Deletes a specific resume version.
    """
    db = get_db()
    cand_id = current_user.get("id") or current_user.get("email")
    res = await db["resumes"].delete_one({"_id": resume_id, "candidate_id": cand_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume version not found")
    return {"message": "Resume version deleted", "id": resume_id}

