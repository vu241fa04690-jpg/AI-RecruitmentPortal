import math
import re
from typing import Any, Dict, List, Set

COMMON_TECH_SKILLS = [
    # Software, AI & Cloud
    "Python", "FastAPI", "Django", "Flask", "React", "Vue", "Angular", "Next.js",
    "Node.js", "Express", "TypeScript", "JavaScript", "Docker", "Kubernetes", "AWS",
    "Azure", "GCP", "PostgreSQL", "MySQL", "MongoDB", "Redis", "GraphQL", "REST APIs",
    "CI/CD", "Git", "Linux", "Terraform", "PyTorch", "TensorFlow", "Pandas", "Scikit-Learn",
    "NLP", "LLM", "Vector DB", "Tailwind CSS", "Microservices", "Java", "Spring Boot",
    "C++", "C#", ".NET", "Golang", "Rust", "Solidity", "Kafka", "ElasticSearch",
    "Sentence Transformers", "Transformers",
    # Business, Strategy, Product & Finance
    "SQL", "Excel", "Tableau", "PowerBI", "Financial Modeling", "Business Strategy",
    "Market Research", "Valuation", "DCF", "PRD Writing", "Agile", "Growth Marketing",
    "User Research", "Product Strategy", "Figma", "Data Analysis", "Revenue Strategy",
    # Hardware, Embedded & Electronics
    "Embedded C", "FreeRTOS", "ARM Cortex", "STM32", "I2C/SPI", "CAN Bus", "Verilog",
    "FPGA", "PCB Design", "Power Electronics", "MATLAB/Simulink", "Battery Management (BMS)",
    "Circuit Design", "Firmware Debugging", "Sensors", "I2C", "SPI", "UART"
]


def extract_skills_from_text(text: str) -> List[str]:
    found = []
    text_lower = text.lower()
    for skill in COMMON_TECH_SKILLS:
        pattern = r"\b" + re.escape(skill.lower()) + r"\b"
        if re.search(pattern, text_lower):
            found.append(skill)
    return list(dict.fromkeys(found))


def calculate_resume_match(
    resume_text: str,
    job_skills: List[str],
    job_requirements: List[str] = None,
    candidate_skills: List[str] = None
) -> Dict[str, Any]:
    job_requirements = job_requirements or []
    candidate_skills = candidate_skills or []

    # Extract skills directly from resume text
    detected_resume_skills = extract_skills_from_text(resume_text)
    all_candidate_skills = list(dict.fromkeys(candidate_skills + detected_resume_skills))

    # Normalize for comparison
    cand_lower = {s.lower() for s in all_candidate_skills}
    job_skills_lower = {s.lower(): s for s in job_skills}

    matched = []
    missing = []

    for s_low, s_orig in job_skills_lower.items():
        pattern = r"\b" + re.escape(s_low) + r"\b"
        if s_low in cand_lower or re.search(pattern, resume_text, re.IGNORECASE):
            matched.append(s_orig)
        else:
            missing.append(s_orig)

    # Skill score (0-100)
    total_req_skills = max(1, len(job_skills))
    skills_score = int((len(matched) / total_req_skills) * 100)

    # Experience & Metrics evaluation
    exp_matches = re.findall(r"(\d+)\+?\s*(?:years?|yrs)", resume_text, re.IGNORECASE)
    years_detected = [int(y) for y in exp_matches if int(y) < 40]
    max_years = max(years_detected) if years_detected else 2
    has_metrics = bool(re.search(r"\d+[%kK+]|\b\d+\s*(?:years?|yrs|users|ms|lpa)", resume_text, re.IGNORECASE))
    exp_score = (92 if has_metrics or max_years >= 3 else 75) if len(matched) > 0 else 35
    formatting_score = 92 if len(resume_text.strip()) > 150 else 50

    # Overall match score (weighted: 75% skills, 15% experience, 10% formatting)
    overall_score = min(98, max(15, int(skills_score * 0.75 + exp_score * 0.15 + formatting_score * 0.10)))

    strengths = []
    if len(matched) > 0:
        strengths.append(f"Strong alignment in core competencies: {', '.join(matched[:4])}")
    if max_years >= 4:
        strengths.append(f"Demonstrated professional experience ({max_years}+ years indicated)")
    if any(k in resume_text.lower() for k in ["architect", "lead", "optimized", "scaled"]):
        strengths.append("Track record of ownership, scalability, and system optimization")

    recommendations = []
    if missing:
        recommendations.append(f"Add projects or certifications demonstrating hands-on experience in: {', '.join(missing[:3])}")
    recommendations.append("Include measurable metrics (e.g., 'reduced latency by 40%', 'managed team of 5') to strengthen impact")

    summary = (
        f"Candidate displays a {overall_score}% compatibility profile with {len(matched)} of {total_req_skills} "
        f"critical technical requirements met. Recommended for initial technical screening."
        if overall_score >= 75 else
        f"Candidate meets {overall_score}% of core qualifications. High potential with slight training in {', '.join(missing[:2]) or 'specialized tooling'}."
    )

    return {
        "match_score": overall_score,
        "skills_score": skills_score,
        "experience_score": exp_score,
        "matched_skills": matched,
        "missing_skills": missing,
        "strengths": strengths,
        "recommendations": recommendations,
        "summary": summary
    }


def generate_interview_questions(job_title: str, skills: List[str], round_type: str = "Technical") -> List[Dict[str, str]]:
    questions = []
    primary_skills = skills[:3] if skills else ["Python", "System Architecture", "APIs"]

    if "technical" in round_type.lower():
        questions.append({
            "category": "Core Architecture",
            "question": f"How have you designed and maintained high-throughput services using {primary_skills[0]} in production?",
            "eval_focus": "Concurrency, caching, failure recovery, clean modular code"
        })
        if len(primary_skills) > 1:
            questions.append({
                "category": "Technical Depth",
                "question": f"What are common performance bottlenecks when working with {primary_skills[1]}, and how do you diagnose them?",
                "eval_focus": "Profiling, indexing, asynchronous I/O, memory management"
            })
        questions.append({
            "category": "Data & Scalability",
            "question": "Walk us through how you handle database connection pooling, indexing, and data schema migrations without downtime.",
            "eval_focus": "Database design, zero-downtime deployment, consistency"
        })
        questions.append({
            "category": "Real-world Scenario",
            "question": f"If an API endpoint for {job_title} experiences sudden 10x traffic spikes and p99 latency increases, what is your systematic troubleshooting process?",
            "eval_focus": "Observability, rate limiting, distributed tracing, horizontal scaling"
        })
    else:
        questions.append({
            "category": "Leadership & Collaboration",
            "question": f"Tell us about a time you had to balance urgent product deadlines with technical debt on a {job_title} deliverable.",
            "eval_focus": "Pragmatism, stakeholder communication, architectural compromises"
        })
        questions.append({
            "category": "Problem Solving",
            "question": "Describe a challenging technical disagreement you had with a teammate or lead. How did you resolve it?",
            "eval_focus": "Empathy, data-backed reasoning, alignment"
        })

    return questions


def generate_job_description(title: str, department: str, experience_level: str, key_skills: List[str]) -> Dict[str, Any]:
    skills_str = ", ".join(key_skills)
    return {
        "title": title,
        "department": department,
        "experience_level": experience_level,
        "description": f"We are looking for an ambitious and talented {title} to join our high-performing {department} division. In this position, you will lead development, build scalable systems, and collaborate with cross-functional teams using {skills_str}.",
        "responsibilities": [
            f"Architect, develop, and deliver robust production features utilizing {key_skills[0] if key_skills else 'modern technologies'}",
            "Collaborate closely with product managers, designers, and engineering leads",
            "Write clean, maintainable, thoroughly tested, and well-documented code",
            "Optimize latency, reliability, and security across distributed cloud services"
        ],
        "requirements": [
            f"{experience_level} background with proven enterprise engineering delivery",
            f"Extensive hands-on expertise in {skills_str}",
            "Strong grasp of RESTful APIs, microservices, and asynchronous event streams",
            "Excellent communication skills and customer-centric mindset"
        ],
        "benefits": [
            "Competitive compensation package with high-upside equity",
            "Comprehensive health, dental, and vision insurance",
            "Flexible remote/hybrid work setup with home office stipend",
            "Annual learning and conference budget"
        ]
    }


def analyze_resume_ats(resume_text: str, target_role: str = "", required_skills: List[str] = None) -> Dict[str, Any]:
    """
    Advanced ATS Compatibility & Resume Quality Scoring Engine.
    Evaluates section structure, keyword density, quantifiable metrics, formatting, and action verbs.
    """
    required_skills = required_skills or []
    text_lower = resume_text.lower()

    # 1. Section Header Check
    sections = {
        "Contact Information": bool(re.search(r"[\w\.-]+@[\w\.-]+|\+?\d[\d\s-]{8,}", resume_text)),
        "Professional Summary": bool(re.search(r"(summary|about me|profile|overview|objective)", text_lower)),
        "Technical Skills": bool(re.search(r"(skills|competencies|technologies|tech stack)", text_lower)),
        "Work Experience": bool(re.search(r"(experience|employment|work history|career)", text_lower)),
        "Education": bool(re.search(r"(education|bachelor|master|b\.tech|degree|university|college)", text_lower)),
        "Projects & Certifications": bool(re.search(r"(projects?|certifications?|credentials|awards)", text_lower))
    }
    present_sections = [k for k, v in sections.items() if v]
    missing_sections = [k for k, v in sections.items() if not v]
    section_score = int((len(present_sections) / len(sections)) * 100)

    # 2. Action Verbs Check
    action_verbs = [
        "built", "developed", "architected", "engineered", "implemented", "optimized",
        "designed", "spearheaded", "accelerated", "reduced", "delivered", "mentored",
        "launched", "deployed", "automated", "scaled", "collaborated", "managed"
    ]
    detected_verbs = [v for v in action_verbs if re.search(r"\b" + v + r"\b", text_lower)]
    action_verb_score = min(100, int((len(detected_verbs) / 6) * 100))

    # 3. Quantifiable Impact & Metrics Check
    metric_matches = re.findall(r"(\d+[\%kK\+]|\b\d+\s*(?:ms|users|requests|million|lpa|fold|x)\b)", resume_text)
    metric_score = min(100, len(metric_matches) * 20) if metric_matches else 35

    # 4. Keyword & Skill Analysis
    detected_skills = extract_skills_from_text(resume_text)
    matched_skills = []
    missing_skills = []
    if required_skills:
        for sk in required_skills:
            if sk.lower() in [s.lower() for s in detected_skills] or re.search(r"\b" + re.escape(sk.lower()) + r"\b", text_lower):
                matched_skills.append(sk)
            else:
                missing_skills.append(sk)
        keyword_score = int((len(matched_skills) / max(1, len(required_skills))) * 100)
    else:
        keyword_score = min(100, len(detected_skills) * 12)

    # 5. Length & Readability Check
    word_count = len(resume_text.split())
    if word_count < 150:
        readability_note = "Resume is too brief. Standard professional resumes typically contain 350-700 words."
        length_score = 45
    elif word_count > 1200:
        readability_note = "Resume may exceed optimal 1-2 page length. Consider condensing earlier experiences."
        length_score = 75
    else:
        readability_note = f"Optimal word count ({word_count} words). High parser readability."
        length_score = 95

    # Overall ATS Score (weighted: 35% sections, 25% keywords, 20% impact metrics, 20% action verbs)
    overall_ats_score = int(section_score * 0.35 + keyword_score * 0.25 + metric_score * 0.20 + action_verb_score * 0.20)
    overall_ats_score = min(99, max(20, overall_ats_score))

    # Actionable Improvement Suggestions
    improvements = []
    if missing_sections:
        improvements.append(f"Add missing ATS standard section(s): {', '.join(missing_sections)}")
    if metric_score < 70:
        improvements.append("Incorporate quantifiable impact in bullet points (e.g. 'Improved API response time by 45%', 'Scaled service to 50k DAU')")
    if action_verb_score < 70:
        improvements.append("Start bullet points with strong power action verbs (e.g. 'Architected', 'Spearheaded', 'Automated') instead of passive duties")
    if missing_skills:
        improvements.append(f"Target role keywords missing from resume: {', '.join(missing_skills[:4])}")
    if not sections.get("Contact Information"):
        improvements.append("Ensure email address and phone number are formatted cleanly at the top of the resume")

    return {
        "ats_score": overall_ats_score,
        "section_score": section_score,
        "keyword_score": keyword_score,
        "impact_metric_score": metric_score,
        "action_verb_score": action_verb_score,
        "word_count": word_count,
        "readability_note": readability_note,
        "present_sections": present_sections,
        "missing_sections": missing_sections,
        "detected_action_verbs": detected_verbs[:8],
        "extracted_skills": detected_skills,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "improvements": improvements,
        "ats_status": "Highly ATS Compatible" if overall_ats_score >= 80 else ("Moderate ATS Pass Rate" if overall_ats_score >= 60 else "ATS Review Recommended")
    }


def generate_career_roadmap(current_skills: List[str], target_role: str) -> Dict[str, Any]:
    """
    Generates a personalized, structured multi-phase career roadmap based on candidate's current skills and target role.
    """
    role_lower = target_role.lower()
    curr_lower = {s.lower() for s in current_skills}

    # Role specific goal definitions
    if "ai" in role_lower or "machine learning" in role_lower or "data science" in role_lower:
        domain = "Artificial Intelligence & ML Engineering"
        milestones = [
            {
                "phase": "Phase 1: Foundations & Mathematical Modeling (Weeks 1-3)",
                "skills": ["Python", "Pandas", "NumPy", "Scikit-Learn", "Linear Algebra"],
                "focus": "Data preprocessing pipelines, statistical modeling, supervised/unsupervised learning fundamentals",
                "recommended_project": "End-to-end Predictive Analytics Microservice with automated feature engineering"
            },
            {
                "phase": "Phase 2: Deep Learning & Modern NLP/Vision (Weeks 4-7)",
                "skills": ["PyTorch", "Transformers", "Sentence Transformers", "Hugging Face"],
                "focus": "Fine-tuning LLMs, semantic vector embeddings, RAG (Retrieval Augmented Generation) architectures",
                "recommended_project": "Context-aware Document Assistant with Vector Database Search (FAISS/Qdrant)"
            },
            {
                "phase": "Phase 3: Production MLOps & Scalable Serving (Weeks 8-10)",
                "skills": ["FastAPI", "Docker", "MLflow", "ONNX Runtime", "AWS/GCP"],
                "focus": "Low-latency model inference, containerization, GPU acceleration, CI/CD for ML",
                "recommended_project": "Asynchronous Real-time Inference API with Prometheus monitoring and rate-limiting"
            },
            {
                "phase": "Phase 4: Capstone Portfolio & System Design Interviews (Weeks 11-12)",
                "skills": ["Distributed System Design", "Benchmarking", "Live Demo Deployment"],
                "focus": "Designing billion-scale recommendation engines, handling data drift, mock interview practice",
                "recommended_project": "Live Production SaaS Portfolio Showcase with public GitHub repository and benchmark logs"
            }
        ]
    elif "cloud" in role_lower or "devops" in role_lower or "sre" in role_lower:
        domain = "Cloud DevOps & Platform Engineering"
        milestones = [
            {
                "phase": "Phase 1: Linux Kernel, Networking & Scripting (Weeks 1-3)",
                "skills": ["Linux", "Bash", "Python", "TCP/IP & DNS", "Git"],
                "focus": "OS internals, system troubleshooting, automated shell scripts, security fundamentals",
                "recommended_project": "Automated server provisioning and network health watchdog script"
            },
            {
                "phase": "Phase 2: Containerization & Cloud Infrastructure (Weeks 4-7)",
                "skills": ["Docker", "Kubernetes", "Terraform", "AWS / GCP"],
                "focus": "Multi-stage Docker builds, declarative infrastructure as code, pod orchestration, Helm charts",
                "recommended_project": "Production-grade Kubernetes cluster deployment with GitOps (ArgoCD)"
            },
            {
                "phase": "Phase 3: Observability, Security & CI/CD Pipelines (Weeks 8-10)",
                "skills": ["GitHub Actions", "Prometheus", "Grafana", "Vault"],
                "focus": "Zero-downtime blue/green deployment, secret management, APM telemetry, SLA monitoring",
                "recommended_project": "Automated Canary Release pipeline with automated rollbacks on error spikes"
            },
            {
                "phase": "Phase 4: Site Reliability Engineering & Scalability (Weeks 11-12)",
                "skills": ["Chaos Engineering", "Disaster Recovery", "FinOps Optimization"],
                "focus": "High availability across multi-region clusters, cost optimization, incident postmortems",
                "recommended_project": "Resilient High-Throughput Ingress architecture surviving simulated region outage"
            }
        ]
    else:
        domain = "Full-Stack Software Architecture"
        milestones = [
            {
                "phase": "Phase 1: Core Backend & Scalable APIs (Weeks 1-3)",
                "skills": ["Python", "FastAPI", "PostgreSQL / MongoDB", "REST & GraphQL"],
                "focus": "Clean architecture, asynchronous I/O, database indexing, caching strategies with Redis",
                "recommended_project": "High-concurrency E-commerce or Booking API handling 5,000 req/sec"
            },
            {
                "phase": "Phase 2: Modern Frontend & Reactive State (Weeks 4-7)",
                "skills": ["React 18", "TypeScript", "Tailwind CSS", "Vite", "Zustand/Redux"],
                "focus": "Component composition, optimistic UI updates, web vitals optimization, accessible design",
                "recommended_project": "Interactive Real-time Collaborative Analytics Dashboard with WebSocket feeds"
            },
            {
                "phase": "Phase 3: Security, Authentication & Cloud Deployment (Weeks 8-10)",
                "skills": ["JWT & OAuth2", "Docker", "CI/CD", "AWS/Cloudflare"],
                "focus": "Role-based access control, CSRF/XSS mitigation, containerized microservices, CDN caching",
                "recommended_project": "Multi-tenant SaaS application with stripe billing and automated test coverage"
            },
            {
                "phase": "Phase 4: Advanced System Design & Technical Interviews (Weeks 11-12)",
                "skills": ["Microservices", "Event-Driven Architecture (Kafka/RabbitMQ)", "System Design"],
                "focus": "Distributed transactions, message queues, rate-limiting, mock interview drilling",
                "recommended_project": "Distributed Event-Driven Notification System with idempotency guarantees"
            }
        ]

    # Calculate current progress percentage
    matched_milestone_skills = 0
    total_milestone_skills = 0
    for m in milestones:
        for sk in m["skills"]:
            total_milestone_skills += 1
            if sk.lower() in curr_lower:
                matched_milestone_skills += 1

    progress_pct = min(95, max(10, int((matched_milestone_skills / max(1, total_milestone_skills)) * 100)))

    return {
        "target_role": target_role or "Full-Stack Software Engineer",
        "domain": domain,
        "current_skills": current_skills,
        "progress_percentage": progress_pct,
        "estimated_duration": "12 Weeks (Self-paced, 10 hrs/week)",
        "milestones": milestones,
        "key_takeaway": f"You already possess {len(current_skills)} foundational skills ({progress_pct}% readiness). Following this roadmap will elevate you into top-tier eligibility for senior {target_role} opportunities."
    }


def evaluate_interview_answer(
    question: str,
    candidate_answer: str,
    job_role: str = "Software Engineer",
    round_type: str = "Technical"
) -> Dict[str, Any]:
    """
    Real-time AI Interview Evaluation Engine.
    Scores technical accuracy, communication clarity, completeness, and provides actionable feedback and model answer.
    """
    answer_text = candidate_answer.strip()
    words = answer_text.split()
    word_count = len(words)
    answer_lower = answer_text.lower()

    if word_count < 15:
        return {
            "score": 35,
            "technical_accuracy": 30,
            "clarity": 40,
            "completeness": 30,
            "verdict": "Needs Expansion",
            "strengths": ["Attempted response"],
            "improvements": ["Answer is too brief. Provide a comprehensive explanation detailing implementation details, tradeoffs, and examples."],
            "model_answer": f"In a production {job_role} context, I would structure this response using the STAR method: explain the architectural situation, the specific challenge, the technical approach chosen (with reasons for choosing it over alternatives), and the measurable outcome achieved.",
            "word_count": word_count
        }

    # Evaluate Technical Terminology & Depth
    technical_keywords = [
        "architecture", "latency", "throughput", "concurrency", "asynchronous", "thread",
        "index", "cache", "redis", "database", "scaling", "api", "rest", "microservices",
        "tradeoff", "failure", "retry", "metrics", "monitoring", "tested", "security",
        "optimization", "memory", "profiling", "bottleneck", "event-driven", "pipeline"
    ]
    detected_tech = [k for k in technical_keywords if k in answer_lower]
    tech_score = min(98, 50 + len(detected_tech) * 8)

    # Evaluate Structure & Clarity (STAR Method: Situation, Task, Action, Result)
    has_action = bool(re.search(r"(i implemented|we built|i designed|i solved|the approach|we used|i ensured)", answer_lower))
    has_outcome = bool(re.search(r"(result|outcome|improved|reduced|increased|successfully|achieved|percent|\d+%)", answer_lower))
    has_reasoning = bool(re.search(r"(because|tradeoff|instead of|due to|ensuring|preventing|advantage)", answer_lower))

    clarity_score = 65
    if has_action: clarity_score += 12
    if has_outcome: clarity_score += 12
    if has_reasoning: clarity_score += 10
    clarity_score = min(98, clarity_score)

    # Completeness based on length and structure
    if word_count >= 80 and has_action and has_outcome:
        completeness_score = 92
    elif word_count >= 50:
        completeness_score = 80
    else:
        completeness_score = 65

    # Composite Score
    overall_score = int(tech_score * 0.45 + clarity_score * 0.35 + completeness_score * 0.20)
    overall_score = min(97, max(40, overall_score))

    # Dynamic feedback
    strengths = []
    if detected_tech:
        strengths.append(f"Demonstrated solid technical grasp of: {', '.join(detected_tech[:4])}")
    if has_outcome:
        strengths.append("Successfully highlighted tangible outcomes and performance metrics")
    if has_reasoning:
        strengths.append("Clearly articulated engineering tradeoffs and decision rationale")
    if not strengths:
        strengths.append("Addressed the core subject of the question directly")

    improvements = []
    if not has_outcome:
        improvements.append("Conclude with the quantifiable impact or result of your solution (e.g. latency drop, uptime guarantee)")
    if not has_reasoning:
        improvements.append("Explain *why* this design or pattern was superior to alternative approaches")
    if len(detected_tech) < 2:
        improvements.append("Incorporate specific architectural concepts, data structures, or system components")
    if not improvements:
        improvements.append("Excellent answer! Maintain this structured delivery during live executive rounds.")

    verdict = (
        "Strong Hire / Outstanding Response" if overall_score >= 85 else
        ("Hire / Solid Technical Competence" if overall_score >= 70 else "Borderline / Needs Practice")
    )

    return {
        "score": overall_score,
        "technical_accuracy": tech_score,
        "clarity": clarity_score,
        "completeness": completeness_score,
        "verdict": verdict,
        "strengths": strengths,
        "improvements": improvements,
        "detected_tech_terms": detected_tech,
        "word_count": word_count,
        "model_answer": f"To address '{question}' at an executive level: 1. State the architectural objective clearly. 2. Outline the primary engineering design chosen and how it mitigates bottleneck/failure scenarios. 3. Mention specific benchmarks (e.g., handling 10k RPS with sub-50ms p99 latency). 4. Summarize lessons learned regarding maintainability."
    }


