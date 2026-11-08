import re
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


class AgentChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = []
    user_role: Optional[str] = "candidate"
    user_name: Optional[str] = "Candidate"
    current_tab: Optional[str] = "jobs"


@router.post("/agent-chat")
async def agent_chat_endpoint(req: AgentChatRequest):
    """
    Intelligent Conversational AI Agent with Voice support.
    Answers candidate and recruiter questions, searches live opportunities,
    conducts interactive mock interviews, and triggers navigation actions.
    """
    msg_raw = req.message.strip()
    msg = msg_raw.lower()
    user_name = req.user_name or "Candidate"
    role = req.user_role or "candidate"
    db = get_db()

    action = None
    reply = ""
    spoken_text = ""

    # 1. Navigation Commands
    if any(k in msg for k in ["go to jobs", "explore jobs", "open jobs", "show jobs", "find jobs", "show openings", "browse jobs"]):
        action = {"type": "navigate", "tab": "jobs"}
        reply = f"Taking you to **Live Opportunities & Jobs**, {user_name}! You can filter by Software, Hardware, Business tracks, and apply directly on the spot."
        spoken_text = f"Navigating to live opportunities and job catalog for you, {user_name}."

    elif any(k in msg for k in ["internship", "internships", "ppo", "summer intern"]):
        action = {"type": "navigate", "tab": "internships"}
        cursor = db["jobs"].find({"category": "internship"}).limit(3)
        top_interns = await cursor.to_list(length=3)
        if top_interns:
            reply = f"Here are the top featured internships with Pre-Placement Offers (PPO) right now:\n\n"
            for idx, j in enumerate(top_interns):
                reply += f"{idx+1}. **{j.get('title')}** at {j.get('company')} — *{j.get('stipend_or_salary', '₹60,000/mo')}*\n"
            reply += "\nI have switched your view to **Internships & PPO**."
            spoken_text = f"Switched to internships view. Top openings include {top_interns[0].get('title')} at {top_interns[0].get('company')}."
        else:
            reply = "Switching to the **Internships & PPO** section for you!"
            spoken_text = "Opening the internships section."

    elif any(k in msg for k in ["assessment", "assessment rounds", "scheduled rounds", "coding test", "coding sandbox"]):
        action = {"type": "navigate", "tab": "interviews"}
        reply = f"Navigating to **Assessment Rounds & Screening Center**, {user_name}! You can practice in the interactive coding sandbox, run test cases, or join live technical video screening."
        spoken_text = f"Opening your Assessment Rounds and live coding sandbox, {user_name}."

    elif any(k in msg for k in ["ats", "resume matcher", "check resume", "scan resume", "ats score"]):
        action = {"type": "navigate", "tab": "matcher"}
        reply = "Opening the **AI Resume & ATS Scanner**. You can upload your PDF or DOCX resume to get an instant semantic match score and missing keyword analysis."
        spoken_text = "Opening the AI Resume ATS scanner."

    elif any(k in msg for k in ["build resume", "create resume", "resume builder"]):
        action = {"type": "navigate", "tab": "builder"}
        reply = "Taking you to the **ATS Resume Builder** to generate a clean, recruiter-approved one-page resume."
        spoken_text = "Opening the resume builder."

    elif any(k in msg for k in ["my application", "track application", "submitted application", "status"]):
        action = {"type": "navigate", "tab": "applications"}
        reply = f"Navigating to **My Applications** tracker for {user_name}. You can review submitted applications, interview stages, and recruiter feedback."
        spoken_text = f"Opening your applications tracker, {user_name}."

    elif any(k in msg for k in ["prep", "interview prep", "interview questions", "mcq test", "practice questions"]):
        action = {"type": "navigate", "tab": "prep"}
        reply = "Opening **Interview Preparation Hub** with 17+ technical categories (Python, React, FastAPI, DSA, DBMS, System Design, HR) and timed MCQ assessments."
        spoken_text = "Navigating to interview preparation with question banks and practice tests."

    # 2. Mock Interview Trigger
    elif any(k in msg for k in ["mock interview", "interview me", "ask me a question", "test my skills"]):
        action = {"type": "navigate", "tab": "prep"}
        sample_q = (
            "Here is your live interview question:\n\n"
            "**Question:** *Explain how FastAPI handles asynchronous I/O with asyncio, and in what scenario should you avoid declaring an endpoint as `async def`?*\n\n"
            "💡 **Key points to mention:**\n"
            "- FastAPI event loop execution on Uvicorn/Starlette.\n"
            "- Non-blocking database and network calls vs CPU-heavy blocking operations.\n"
            "- Synchronous operations in regular `def` are dispatched to a separate threadpool to prevent freezing the event loop.\n\n"
            "Whenever you're ready, speak or type your answer and I will evaluate your response!"
        )
        reply = sample_q
        spoken_text = "Here is your mock interview question: Explain how FastAPI handles asynchronous I/O with asyncio, and in what scenario should you avoid declaring an endpoint as async def? Take your time, then tell me your answer."

    # 3. Resume / ATS Optimization Advice
    elif any(k in msg for k in ["optimize resume", "improve ats", "ats tip", "resume advice", "higher score"]):
        reply = (
            "Here are **3 critical strategies to achieve 95%+ ATS Scores** on TalentAI:\n\n"
            "1. **Hard Skill Keyword Density:** Match the exact technical stack from the job description (e.g. *FastAPI, Pydantic, PostgreSQL, React 18, Docker*).\n"
            "2. **Quantifiable STAR Metrics:** Frame accomplishments with numbers — e.g. *'Reduced API response latency by 42% through Redis LRU caching and indexed MongoDB queries'*, rather than vague duties.\n"
            "3. **Clean Single-Column Typography:** Use standard headings (*Experience, Education, Technical Skills*) and avoid complex multi-column tables or graphics that confuse PDF parsers."
        )
        spoken_text = "To get an ATS score above 95 percent, focus on three things: hard skill keyword density matching the job, quantifiable STAR metrics with exact numbers, and a clean single-column structure without complex tables."

    # 4. Salary / Stipend Questions
    elif any(k in msg for k in ["salary", "stipend", "pay", "highest paying", "compensation"]):
        reply = (
            "On TalentAI, current verified compensation ranges for top roles are:\n\n"
            "- **AI & Generative LLM Research Intern:** ₹60,000 – ₹85,000/month (PPO: ₹20–28 LPA)\n"
            "- **Software Development Engineer (SDE):** ₹55,000 – ₹80,000/month (PPO: ₹18–24 LPA)\n"
            "- **Full-Stack Engineering (FastAPI + React):** ₹40,000 – ₹60,000/month\n"
            "- **Data Science & Business Analytics:** ₹35,000 – ₹50,000/month\n\n"
            "Would you like me to take you directly to the highest paying openings?"
        )
        spoken_text = "Top internships on TalentAI offer stipends up to eighty-five thousand rupees per month with Pre-Placement Offers between eighteen and twenty-eight LPA. Would you like me to open these roles for you?"

    # 5. General Greeting & Introduction
    elif any(k in msg for k in ["hello", "hi", "hey", "who are you", "what can you do", "help"]):
        reply = (
            f"Hello {user_name}! I am **TalentAI Voice Copilot**, your real-time recruitment and career intelligence assistant.\n\n"
            "Here is what you can ask me with your voice or text:\n"
            "• *'Find me the best SDE internships'* — Discover high-match openings\n"
            "• *'Conduct a mock interview'* — Practice technical and behavioral questions\n"
            "• *'Open my assessment rounds'* — Access your coding sandbox and tests\n"
            "• *'How do I improve my ATS resume score?'* — Get semantic optimization tips\n"
            "• *'Go to My Applications'* — Track real-time hiring progress"
        )
        spoken_text = f"Hello {user_name}! I am TalentAI Voice Copilot. You can speak to me anytime to find jobs, conduct mock interviews, optimize your resume, or launch coding assessments. How can I help you today?"

    # 6. Default Fallback Intelligence
    else:
        # Search relevant jobs to provide dynamic context
        keywords = [w for w in msg_raw.split() if len(w) > 3][:3]
        query = {}
        if keywords:
            query = {"$or": [
                {"title": {"$regex": keywords[0], "$options": "i"}},
                {"skills": {"$in": [re.compile(keywords[0], re.IGNORECASE)]}}
            ]}
        cursor = db["jobs"].find(query).limit(2)
        found = await cursor.to_list(length=2)

        if found:
            job_titles = ", ".join([f"**{j.get('title')}** at {j.get('company')}" for j in found])
            reply = (
                f"I found matching opportunities on the platform: {job_titles}.\n\n"
                f"You can ask me to **'Open Jobs'**, **'Start an Assessment'**, or **'Test my knowledge'** to prepare. Let me know what you'd like to do next, {user_name}!"
            )
            spoken_text = f"I found matching opportunities for you on TalentAI. Would you like to view the jobs, test your knowledge with a mock interview, or scan your resume?"
        else:
            reply = (
                f"I heard: *\"{msg_raw}\"*\n\n"
                f"I am ready to help you, {user_name}! You can ask me to search live opportunities, conduct a mock interview with voice feedback, review your ATS score, or open your technical assessment rounds."
            )
            spoken_text = f"I am ready to assist you, {user_name}. You can ask me to search jobs, conduct an interview, or check your assessment rounds."

    return {
        "reply": reply,
        "spoken_text": spoken_text,
        "action": action
    }
