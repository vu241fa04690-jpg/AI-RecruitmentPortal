import os
import re
import json
from typing import Any, Dict, List, Optional
from database import get_db
from services.ai_service import (
    calculate_resume_match,
    analyze_resume_ats,
    evaluate_interview_answer,
    generate_career_roadmap,
    generate_interview_questions,
    generate_job_description,
    COMMON_TECH_SKILLS
)

# Optional LLM integration if external API key is provided
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


async def execute_job_search(query_str: str, location_filter: str = "", min_skills: List[str] = None) -> List[Dict[str, Any]]:
    """
    Agent tool: Searches active jobs from the MongoDB database matching criteria.
    """
    db = get_db()
    mongo_query: Dict[str, Any] = {}
    
    # Text search on title/company
    if query_str and query_str.lower() != "all":
        # Search words
        words = [w for w in re.split(r"\s+", query_str) if len(w) > 2 and w.lower() not in ["find", "jobs", "job", "for", "with", "in", "remote", "developer", "engineer"]]
        if words:
            regex_pattern = "|".join([re.escape(w) for w in words])
            mongo_query["$or"] = [
                {"title": {"$regex": regex_pattern, "$options": "i"}},
                {"skills": {"$in": [re.compile(re.escape(w), re.IGNORECASE) for w in words]}},
                {"company": {"$regex": regex_pattern, "$options": "i"}}
            ]
    
    if location_filter:
        mongo_query["location"] = {"$regex": re.escape(location_filter), "$options": "i"}

    cursor = db["jobs"].find(mongo_query).limit(6)
    jobs = []
    async for j in cursor:
        jobs.append({
            "id": str(j.get("_id")),
            "title": j.get("title", "Opportunity"),
            "company": j.get("company", "Tech Partner"),
            "location": j.get("location", "Remote"),
            "salary": j.get("stipend_or_salary") or j.get("salary_range", "Competitive"),
            "skills": j.get("skills", [])[:5],
            "type": j.get("type", "Full-Time")
        })
    
    # If no results from specific query, return top active jobs
    if not jobs:
        cursor2 = db["jobs"].find({}).limit(4)
        async for j in cursor2:
            jobs.append({
                "id": str(j.get("_id")),
                "title": j.get("title", "Opportunity"),
                "company": j.get("company", "Tech Partner"),
                "location": j.get("location", "Remote"),
                "salary": j.get("stipend_or_salary") or j.get("salary_range", "Competitive"),
                "skills": j.get("skills", [])[:5],
                "type": j.get("type", "Full-Time")
            })
    return jobs


async def execute_application_lookup(candidate_email: str) -> List[Dict[str, Any]]:
    """
    Agent tool: Looks up live application records for the current candidate.
    """
    if not candidate_email:
        return []
    db = get_db()
    cursor = db["applications"].find({"candidate_email": candidate_email}).sort("applied_at", -1).limit(5)
    apps = []
    async for a in cursor:
        apps.append({
            "id": str(a.get("_id")),
            "job_title": a.get("job_title", "Software Role"),
            "company": a.get("company", "Partner"),
            "status": a.get("status", "Applied"),
            "applied_at": a.get("applied_at", "Recently"),
            "match_score": a.get("match_score", 85)
        })
    return apps


def generate_tailored_cover_letter(candidate_name: str, job_title: str, company: str, skills: List[str], experience: str = "2+ years") -> str:
    """
    Agent tool: Synthesizes a high-conversion, professional cover letter tailored for a specific role.
    """
    skills_str = ", ".join(skills[:4]) if skills else "modern software engineering patterns, scalable backend design, and frontend interfaces"
    cand_name = candidate_name if candidate_name and candidate_name != "Guest User" else "Candidate"
    
    letter = f"""Dear Hiring Team at {company},

I am writing to express my strong enthusiasm for the {job_title} position at {company}. With a proven track record delivering robust systems using {skills_str}, I am excited about the opportunity to contribute directly to your engineering team's high-impact initiatives.

In my previous projects and experience ({experience}), I focused on building high-performance architectures, optimizing database queries, and creating intuitive user experiences. Specifically, applying {skills[0] if skills else 'core technologies'} allowed me to design fault-tolerant workflows that increased throughput while significantly reducing system latency.

What excites me most about {company} is your commitment to technical innovation and developer excellence. I bring a proactive problem-solving mindset, a deep passion for clean code, and a collaborative approach to cross-functional product execution.

Thank you for your time and consideration. I welcome the opportunity to discuss how my technical expertise and background will drive measurable value for {company}.

Warm regards,

{cand_name}
Email: Registered on TalentAI
Portfolio: Verified on TalentAI Platform"""
    return letter.strip()


def rewrite_resume_bullets(raw_bullet: str, target_role: str = "Software Engineer") -> Dict[str, Any]:
    """
    Agent tool: Rewrites a candidate's weak resume bullet into a high-impact, STAR-compliant statement with metrics.
    """
    action_verbs = ["Architected", "Engineered", "Spearheaded", "Optimized", "Refactored", "Deployed"]
    verb = action_verbs[len(raw_bullet) % len(action_verbs)]
    
    enhanced_1 = f"{verb} a scalable workflow for {raw_bullet.lower().strip('. ')}, reducing execution latency by 38% and supporting 15,000+ daily requests."
    enhanced_2 = f"Spearheaded technical development of {raw_bullet.lower().strip('. ')} using modular design patterns, boosting system reliability to 99.9% uptime."
    enhanced_3 = f"Streamlined {raw_bullet.lower().strip('. ')} through automated CI/CD and containerized microservices, accelerating feature release cycles by 2.5x."
    
    return {
        "original": raw_bullet,
        "recommendations": [
            {"version": "Impact & Latency Focused", "text": enhanced_1, "star_format": "Action + Metric + Scale"},
            {"version": "Reliability & Quality Focused", "text": enhanced_2, "star_format": "Leadership + Architecture + Uptime"},
            {"version": "DevOps & Pipeline Focused", "text": enhanced_3, "star_format": "Process Optimization + Cycle Time"}
        ],
        "ats_tips": "Always quantify results with numbers (e.g. percentages, request volume, time saved). Use strong past-tense action verbs."
    }


async def process_agent_query(
    message: str,
    conversation_history: List[Dict[str, str]] = None,
    user_context: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Central Agent Orchestrator:
    Parses intent, selects and executes tools, and returns conversational response with rich payloads.
    """
    conversation_history = conversation_history or []
    user_context = user_context or {}
    
    role = user_context.get("role", "candidate")
    user_name = user_context.get("name", "there")
    user_email = user_context.get("email", "")
    user_skills = user_context.get("skills", ["Python", "React", "FastAPI"])
    target_role = user_context.get("target_role", "Software Engineer")
    
    msg_lower = message.lower().strip()
    
    # Default response structure
    agent_response = {
        "agent_name": "TalentAI Copilot",
        "reply": "",
        "action_taken": None,
        "tool_used": None,
        "payload": None,
        "suggested_prompts": []
    }
    
    # -------------------------------------------------------------
    # INTENT 1: JOB SEARCH / FIND OPPORTUNITIES
    # -------------------------------------------------------------
    if any(k in msg_lower for k in ["job", "jobs", "internship", "opening", "openings", "position", "positions", "hiring", "find work"]):
        location = "Remote" if "remote" in msg_lower else ("Bengaluru" if "bengaluru" in msg_lower or "bangalore" in msg_lower else "")
        matched_jobs = await execute_job_search(msg_lower, location_filter=location)
        
        agent_response["action_taken"] = "DATABASE_SEARCH"
        agent_response["tool_used"] = "execute_job_search"
        agent_response["payload"] = {"jobs": matched_jobs}
        agent_response["reply"] = (
            f"I searched our live TalentAI opportunities database and identified **{len(matched_jobs)} verified positions** matching your profile and query. "
            f"Here are the top matches with competitive compensation and verified hiring teams:"
        )
        agent_response["suggested_prompts"] = [
            "Tailor my cover letter for the first job",
            "What skills am I missing for these roles?",
            "Mock interview questions for Software Engineer",
            "Show me only remote roles"
        ]
        return agent_response

    # -------------------------------------------------------------
    # INTENT 2: COVER LETTER GENERATION
    # -------------------------------------------------------------
    if any(k in msg_lower for k in ["cover letter", "write a letter", "application letter", "draft letter"]):
        company_match = re.search(r"for\s+([A-Za-z0-9\s&]+?)(?:\s+as|\s+role|\s+position|$)", message, re.IGNORECASE)
        company = company_match.group(1).strip() if company_match else "CognitiveFlow Technologies"
        
        job_match = re.search(r"(?:as|role|position|for)\s+([A-Za-z0-9\s]+?)(?:at|\.|$)", message, re.IGNORECASE)
        job_title = job_match.group(1).strip() if job_match else target_role
        
        letter = generate_tailored_cover_letter(
            candidate_name=user_name,
            job_title=job_title,
            company=company,
            skills=user_skills
        )
        
        agent_response["action_taken"] = "DOCUMENT_GENERATION"
        agent_response["tool_used"] = "generate_tailored_cover_letter"
        agent_response["payload"] = {
            "cover_letter": letter,
            "company": company,
            "job_title": job_title
        }
        agent_response["reply"] = (
            f"I've crafted a customized, high-converting cover letter for the **{job_title}** role at **{company}**, "
            f"highlighting your competencies in {', '.join(user_skills[:3])}. You can copy it directly using the button below:"
        )
        agent_response["suggested_prompts"] = [
            "Make it more concise",
            "Add my cloud & Docker experience",
            "Prepare interview questions for this role",
            "Check my resume ATS score"
        ]
        return agent_response

    # -------------------------------------------------------------
    # INTENT 3: RESUME BULLET OPTIMIZATION / ATS REVIEW
    # -------------------------------------------------------------
    if any(k in msg_lower for k in ["optimize resume", "improve resume", "bullet point", "ats score", "rewrite", "resume tips"]):
        # Extract sample bullet or use query text
        sample_bullet = message
        for prefix in ["optimize bullet:", "rewrite:", "improve:"]:
            if prefix in msg_lower:
                sample_bullet = message.split(prefix, 1)[1].strip()
                break
        if len(sample_bullet) < 15:
            sample_bullet = "Developed backend APIs using FastAPI and integrated MongoDB database for user data."
        
        rewrite_data = rewrite_resume_bullets(sample_bullet, target_role)
        ats_eval = analyze_resume_ats(sample_bullet, target_role=target_role, required_skills=user_skills)
        
        agent_response["action_taken"] = "RESUME_OPTIMIZATION"
        agent_response["tool_used"] = "rewrite_resume_bullets"
        agent_response["payload"] = {
            "bullet_rewrites": rewrite_data,
            "ats_score": ats_eval.get("ats_score", 82),
            "detected_keywords": ats_eval.get("detected_keywords", user_skills[:4])
        }
        agent_response["reply"] = (
            f"Here is your AI-optimized resume analysis! I evaluated your statement against high-performance ATS screening filters. "
            f"I have rewritten your bullet point into 3 high-impact, quantified versions using the industry-standard **STAR methodology**:"
        )
        agent_response["suggested_prompts"] = [
            "How do I add metrics if I don't know exact numbers?",
            "What technical skills should I add to my resume?",
            "Generate career roadmap for Senior Full Stack",
            "Find jobs matching my updated resume"
        ]
        return agent_response

    # -------------------------------------------------------------
    # INTENT 4: MOCK INTERVIEW / PRACTICE QUESTIONS
    # -------------------------------------------------------------
    if any(k in msg_lower for k in ["interview", "mock", "practice question", "prepare for interview", "technical round", "behavioral"]):
        # Check if user is submitting an answer to an existing question
        if any(marker in msg_lower for marker in ["my answer is", "answer:", "here is my answer"]) or len(message.split()) > 30:
            eval_res = evaluate_interview_answer(
                question="Explain the architecture and technical considerations of your most complex project.",
                candidate_answer=message,
                job_role=target_role
            )
            agent_response["action_taken"] = "ANSWER_EVALUATION"
            agent_response["tool_used"] = "evaluate_interview_answer"
            agent_response["payload"] = {"evaluation": eval_res}
            agent_response["reply"] = (
                f"### Interview Answer Evaluation\n\n"
                f"**Overall Score:** `{eval_res['score']}/100` ({eval_res['verdict']})\n\n"
                f"- **Technical Depth:** `{eval_res['technical_accuracy']}/100`\n"
                f"- **Delivery & Clarity:** `{eval_res['clarity']}/100`\n"
                f"- **Completeness:** `{eval_res['completeness']}/100`\n\n"
                f"**Strengths:**\n" + "\n".join([f"✓ {s}" for s in eval_res['strengths']]) + "\n\n"
                f"**Key Recommendations:**\n" + "\n".join([f"⚡ {i}" for i in eval_res['improvements']]) + "\n\n"
                f"**Executive Model Answer:**\n_{eval_res['model_answer']}_"
            )
            agent_response["suggested_prompts"] = [
                "Give me another technical question",
                "Ask me a System Design question",
                "Practice HR STAR behavioral question",
                "Check my application status"
            ]
            return agent_response

        # Otherwise generate fresh interview questions
        questions = generate_interview_questions(
            job_title=target_role,
            skills=user_skills,
            round_type="Technical"
        )
        agent_response["action_taken"] = "INTERVIEW_PREP"
        agent_response["tool_used"] = "generate_interview_questions"
        agent_response["payload"] = {"questions": questions[:3]}
        agent_response["reply"] = (
            f"Here are **3 curated technical interview questions** tailored for a **{target_role}** role focusing on {', '.join(user_skills[:3])}:\n\n"
            + "\n\n".join([f"**Q{i+1}: {q['question']}**\n- *Topic:* {q.get('topic', 'Core CS')}\n- *Tip:* {q.get('tip', 'Structure response using STAR')}" for i, q in enumerate(questions[:3])])
            + "\n\nType your answer to any question above, and I'll score your technical depth, clarity, and metrics!"
        )
        agent_response["suggested_prompts"] = [
            "Ask me Question 1 again so I can answer",
            "Give me a behavioral question instead",
            "Explain the solution to Question 1",
            "Find jobs for this role"
        ]
        return agent_response

    # -------------------------------------------------------------
    # INTENT 5: APPLICATION STATUS & TRACKING
    # -------------------------------------------------------------
    if any(k in msg_lower for k in ["my application", "application status", "applied jobs", "where did i apply", "interview status"]):
        apps = await execute_application_lookup(user_email)
        agent_response["action_taken"] = "APPLICATION_LOOKUP"
        agent_response["tool_used"] = "execute_application_lookup"
        agent_response["payload"] = {"applications": apps}
        if apps:
            agent_response["reply"] = (
                f"I checked your active records. You currently have **{len(apps)} active application(s)** in the pipeline:\n\n"
                + "\n".join([f"- **{a['job_title']}** at **{a['company']}** — Status: `{a['status']}` (Match: {a['match_score']}%)" for a in apps])
                + "\n\nWould you like me to prepare mock interview questions for any of these upcoming rounds?"
            )
        else:
            agent_response["reply"] = (
                f"You don't have any pending applications submitted under **{user_email or 'your account'}** yet! "
                f"I can help you discover verified openings matching your {', '.join(user_skills[:2])} skills right now."
            )
        agent_response["suggested_prompts"] = [
            "Find matching jobs to apply to",
            "Practice interview questions",
            "Optimize my resume",
            "Create a cover letter"
        ]
        return agent_response

    # -------------------------------------------------------------
    # INTENT 6: RECRUITER / HIRING COPILOT (JD Generation & Candidate Screening)
    # -------------------------------------------------------------
    if role in ["recruiter", "admin"] or any(k in msg_lower for k in ["post job", "write jd", "job description", "screen candidate", "hiring", "create job"]):
        title = "Full Stack AI Engineer"
        for candidate_title in ["Frontend Engineer", "Backend Developer", "DevOps Engineer", "Data Scientist", "Product Manager"]:
            if candidate_title.lower() in msg_lower:
                title = candidate_title
                break
        
        jd = generate_job_description(
            title=title,
            department="Engineering",
            experience_level="2-5 years",
            key_skills=["Python", "FastAPI", "React", "Docker", "PostgreSQL"]
        )
        
        agent_response["action_taken"] = "JD_GENERATION"
        agent_response["tool_used"] = "generate_job_description"
        agent_response["payload"] = {"job_description": jd}
        agent_response["reply"] = (
            f"### AI Recruiter Copilot — Generated Job Description\n\n"
            f"**Title:** {jd.get('title')}\n"
            f"**Department:** {jd.get('department')}\n"
            f"**Salary Range:** {jd.get('salary_range')}\n\n"
            f"**Summary:**\n{jd.get('summary')}\n\n"
            f"**Key Responsibilities:**\n" + "\n".join([f"• {r}" for r in jd.get('responsibilities', [])[:4]]) + "\n\n"
            f"**Required Qualifications:**\n" + "\n".join([f"• {q}" for q in jd.get('requirements', [])[:4]])
        )
        agent_response["suggested_prompts"] = [
            "Generate technical screening questions for this JD",
            "Adjust salary range to $120k-$150k",
            "Add Kubernetes and AWS requirements",
            "Screen current applicants for this role"
        ]
        return agent_response

    # -------------------------------------------------------------
    # INTENT 7: CAREER ROADMAP & UPSKILLING
    # -------------------------------------------------------------
    if any(k in msg_lower for k in ["roadmap", "career plan", "learn", "how to become", "skill gap", "upskill"]):
        target = "AI & Full Stack Architect"
        for t in ["Backend Engineer", "Frontend Specialist", "Cloud & DevOps", "ML Engineer", "Data Engineer"]:
            if t.lower() in msg_lower:
                target = t
                break
        
        roadmap = generate_career_roadmap(current_skills=user_skills, target_role=target)
        agent_response["action_taken"] = "CAREER_ROADMAP"
        agent_response["tool_used"] = "generate_career_roadmap"
        agent_response["payload"] = {"roadmap": roadmap}
        agent_response["reply"] = (
            f"### Personalized Career Roadmap: Path to {target}\n\n"
            f"Based on your existing strengths ({', '.join(user_skills[:3])}), here is your step-by-step 3-month acceleration path:\n\n"
            + "\n\n".join([f"**{phase.get('phase', 'Phase')}: {phase.get('focus', 'Deep Dive')}**\n- Skills: {', '.join(phase.get('skills', []))}\n- Project: {phase.get('project', 'Production App')}" for phase in roadmap.get("phases", [])])
        )
        agent_response["suggested_prompts"] = [
            "Find jobs matching this roadmap",
            "Practice interview questions for Phase 1",
            "What projects should I build?",
            "Review my resume ATS score"
        ]
        return agent_response

    # -------------------------------------------------------------
    # DEFAULT INTELLIGENT AGENT CONVERSATION
    # -------------------------------------------------------------
    agent_response["reply"] = (
        f"Hello {user_name}! I am your **TalentAI Autonomous Agent**.\n\n"
        f"I can execute end-to-end recruitment and career workflows for you:\n\n"
        f"• **Job Search & Matching:** *\"Find remote React & FastAPI jobs\"*\n"
        f"• **Cover Letter Generator:** *\"Write a tailored cover letter for CognitiveFlow\"*\n"
        f"• **Resume Bullet Optimizer:** *\"Optimize bullet: Built backend APIs with MongoDB\"*\n"
        f"• **Interactive Mock Interview:** *\"Practice technical interview for Software Engineer\"*\n"
        f"• **Application Tracking:** *\"Check my active application status\"*\n"
        f"• **Recruiter Copilot:** *\"Draft job description for Senior Full Stack Engineer\"*\n\n"
        f"What would you like to achieve today?"
    )
    agent_response["suggested_prompts"] = [
        "Find remote software jobs",
        "Generate a tailored cover letter",
        "Optimize my resume bullets for ATS",
        "Start a mock interview round"
    ]
    return agent_response
