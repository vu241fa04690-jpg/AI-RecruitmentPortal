from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from database import get_db
from schemas.ai import InterviewPrepRequest, JobDescriptionGenRequest, ResumeMatchRequest, ResumeMatchResponse
from services.ai_service import (
    analyze_resume_ats,
    calculate_resume_match,
    evaluate_interview_answer,
    generate_career_roadmap,
    generate_interview_questions,
    generate_job_description,
)
from services.resume_parser import parse_resume_bytes

router = APIRouter(prefix="/ai", tags=["AI Engine"])


class ATSAnalysisRequest(BaseModel):
    resume_text: str
    target_role: Optional[str] = ""
    required_skills: Optional[List[str]] = []


class CareerRoadmapRequest(BaseModel):
    current_skills: List[str]
    target_role: str


class AnswerEvaluationRequest(BaseModel):
    question: str
    candidate_answer: str
    job_role: Optional[str] = "Software Engineer"
    round_type: Optional[str] = "Technical"


class JobRecommendationRequest(BaseModel):
    skills: List[str]
    preferred_category: Optional[str] = "all"


@router.post("/parse-resume-file")
async def parse_resume_file(file: UploadFile = File(...)):
    filename = file.filename or "resume.pdf"
    content = await file.read()
    
    # 10MB size limit
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 10MB limit. Please upload a smaller PDF or DOCX file."
        )

    parsed_result = parse_resume_bytes(content, filename)
    return {
        "status": "success",
        "filename": filename,
        "candidate_name": parsed_result.get("candidate_name", "Candidate"),
        "email": parsed_result.get("email"),
        "phone": parsed_result.get("phone"),
        "skills": parsed_result.get("skills", []),
        "education": parsed_result.get("education", []),
        "certifications": parsed_result.get("certifications", []),
        "extracted_text": parsed_result.get("text", "")
    }


@router.post("/match-resume", response_model=ResumeMatchResponse)
async def match_resume(req: ResumeMatchRequest):
    job_skills = req.job_skills or []
    job_requirements = req.job_requirements or []

    if req.job_id:
        db = get_db()
        job = await db["jobs"].find_one({"_id": req.job_id})
        if job:
            if not job_skills:
                job_skills = job.get("skills", [])
            if not job_requirements:
                job_requirements = job.get("requirements", [])

    if not job_skills:
        job_skills = ["Python", "FastAPI", "React", "Docker", "Database Design"]

    result = calculate_resume_match(
        resume_text=req.resume_text,
        job_skills=job_skills,
        job_requirements=job_requirements,
        candidate_skills=req.candidate_skills or []
    )
    return ResumeMatchResponse(**result)


@router.post("/generate-job-description")
async def generate_jd(req: JobDescriptionGenRequest):
    return generate_job_description(
        title=req.title,
        department=req.department,
        experience_level=req.experience_level,
        key_skills=req.key_skills
    )


@router.post("/interview-prep")
async def get_prep_questions(req: InterviewPrepRequest):
    questions = generate_interview_questions(
        job_title=req.job_title,
        skills=req.skills,
        round_type=req.round_type
    )
    return {"questions": questions}


@router.post("/analyze-ats")
async def analyze_ats_endpoint(req: ATSAnalysisRequest):
    """
    Evaluates resume ATS compliance, section presence, action verbs, and impact metrics.
    """
    return analyze_resume_ats(
        resume_text=req.resume_text,
        target_role=req.target_role or "",
        required_skills=req.required_skills or []
    )


@router.post("/career-roadmap")
async def career_roadmap_endpoint(req: CareerRoadmapRequest):
    """
    Generates a personalized learning roadmap with timelines, milestones, and projects.
    """
    return generate_career_roadmap(
        current_skills=req.current_skills,
        target_role=req.target_role
    )


@router.post("/evaluate-answer")
async def evaluate_answer_endpoint(req: AnswerEvaluationRequest):
    """
    Scores interview answer with technical accuracy, clarity, and provides model response.
    """
    return evaluate_interview_answer(
        question=req.question,
        candidate_answer=req.candidate_answer,
        job_role=req.job_role or "Software Engineer",
        round_type=req.round_type or "Technical"
    )


@router.post("/bulk-parse-resumes")
async def bulk_parse_resumes_endpoint(
    files: List[UploadFile] = File(...),
    job_id: Optional[str] = Form(None)
):
    """
    Bulk resume upload & parsing engine.
    Parses multiple resumes concurrently and calculates comparative ATS matching against a job.
    """
    db = get_db()
    target_job = None
    job_skills = []
    job_requirements = []
    if job_id:
        target_job = await db["jobs"].find_one({"_id": job_id})
        if target_job:
            job_skills = target_job.get("skills", [])
            job_requirements = target_job.get("requirements", [])

    results = []
    for file in files:
        try:
            content = await file.read()
            if len(content) > 10 * 1024 * 1024:
                continue
            parsed = parse_resume_bytes(content, file.filename or "resume.pdf")
            cand_name = parsed.get("candidate_name") or file.filename.rsplit(".", 1)[0]
            cand_skills = parsed.get("skills", [])
            raw_text = parsed.get("text", "")

            # Match against target job if provided, or evaluate standalone quality
            if job_skills:
                match_info = calculate_resume_match(
                    resume_text=raw_text,
                    job_skills=job_skills,
                    job_requirements=job_requirements,
                    candidate_skills=cand_skills
                )
                score = match_info.get("match_score", 70)
                matched_s = match_info.get("matched_skills", [])
                missing_s = match_info.get("missing_skills", [])
            else:
                ats_info = analyze_resume_ats(raw_text)
                score = ats_info.get("ats_score", 75)
                matched_s = cand_skills[:4]
                missing_s = []

            results.append({
                "filename": file.filename,
                "candidate_name": cand_name,
                "email": parsed.get("email") or "Not detected",
                "phone": parsed.get("phone") or "Not detected",
                "skills": cand_skills,
                "education": parsed.get("education", []),
                "certifications": parsed.get("certifications", []),
                "match_score": score,
                "matched_skills": matched_s,
                "missing_skills": missing_s,
                "recommendation": "Auto-Shortlist" if score >= 85 else ("Review" if score >= 65 else "Low Match")
            })
        except Exception as e:
            results.append({
                "filename": file.filename,
                "error": str(e),
                "match_score": 0
            })

    # Sort candidates by match_score descending
    results.sort(key=lambda x: x.get("match_score", 0), reverse=True)
    return {
        "total_parsed": len(results),
        "job_title": target_job.get("title") if target_job else "General Quality Ranking",
        "candidates": results
    }


@router.post("/job-recommendations")
async def job_recommendations_endpoint(req: JobRecommendationRequest):
    """
    Ranks all active platform opportunities against candidate skills and returns top personalized matches.
    """
    db = get_db()
    query = {}
    if req.preferred_category and req.preferred_category != "all":
        query["category"] = req.preferred_category

    cursor = db["jobs"].find(query)
    jobs = []
    async for j in cursor:
        jobs.append(j)

    scored_jobs = []
    for job in jobs:
        j_skills = job.get("skills", [])
        match_info = calculate_resume_match(
            resume_text=" ".join(req.skills),
            job_skills=j_skills,
            candidate_skills=req.skills
        )
        score = match_info.get("match_score", 50)
        scored_jobs.append({
            "job_id": job.get("_id"),
            "title": job.get("title"),
            "company": job.get("company"),
            "location": job.get("location"),
            "category": job.get("category"),
            "stipend_or_salary": job.get("stipend_or_salary") or job.get("salary_range"),
            "skills": j_skills,
            "match_score": score,
            "matched_skills": match_info.get("matched_skills", []),
            "missing_skills": match_info.get("missing_skills", []),
            "fit_reason": f"Matches {len(match_info.get('matched_skills', []))} of your primary skills ({', '.join(match_info.get('matched_skills', [])[:3])})"
        })

    scored_jobs.sort(key=lambda x: x["match_score"], reverse=True)
    return {"recommendations": scored_jobs[:6]}
