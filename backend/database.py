import asyncio
import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from config import settings

true = True
false = False
null = None

client = None
db = None
_storage_mode = "pending"  # "mongodb" or "fallback_json"

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)
DB_FILE = os.path.join(DATA_DIR, "db.json")


class FallbackCursor:
    def __init__(self, items: List[Dict[str, Any]]):
        self._items = items

    def sort(self, key_or_list: Any, direction: int = 1):
        if isinstance(key_or_list, list):
            k = key_or_list[0][0]
            reverse = key_or_list[0][1] < 0
        else:
            k = key_or_list
            reverse = direction < 0
        self._items.sort(key=lambda x: x.get(k, ""), reverse=reverse)
        return self

    def skip(self, n: int):
        self._items = self._items[n:]
        return self

    def limit(self, n: int):
        self._items = self._items[:n]
        return self

    def __aiter__(self):
        self._iter = iter(self._items)
        return self

    async def __anext__(self):
        try:
            return next(self._iter)
        except StopIteration:
            raise StopAsyncIteration

    async def to_list(self, length: Optional[int] = None):
        if length is not None:
            return self._items[:length]
        return list(self._items)


class FallbackCollection:
    def __init__(self, name: str, parent_db: "FallbackDatabase"):
        self.name = name
        self.db = parent_db

    def _matches(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        for k, v in query.items():
            if k == "_id" and str(doc.get("_id")) == str(v):
                continue
            if isinstance(v, dict):
                if "$in" in v and doc.get(k) not in v["$in"]:
                    return False
                if "$regex" in v:
                    import re
                    pattern = re.compile(v["$regex"], re.IGNORECASE)
                    if not pattern.search(str(doc.get(k, ""))):
                        return False
            else:
                if doc.get(k) != v:
                    return False
        return True

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for doc in self.db._data.get(self.name, []):
            if self._matches(doc, query):
                return dict(doc)
        return None

    def find(self, query: Optional[Dict[str, Any]] = None) -> FallbackCursor:
        query = query or {}
        matches = [dict(doc) for doc in self.db._data.get(self.name, []) if self._matches(doc, query)]
        return FallbackCursor(matches)

    async def insert_one(self, doc: Dict[str, Any]):
        doc = dict(doc)
        if "_id" not in doc:
            doc["_id"] = str(uuid.uuid4())
        self.db._data.setdefault(self.name, []).append(doc)
        self.db._save()
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc["_id"])

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        for doc in self.db._data.get(self.name, []):
            if self._matches(doc, query):
                if "$set" in update:
                    doc.update(update["$set"])
                self.db._save()
                class UpdateResult:
                    modified_count = 1
                return UpdateResult()
        class UpdateResult:
            modified_count = 0
        return UpdateResult()

    async def delete_one(self, query: Dict[str, Any]):
        items = self.db._data.get(self.name, [])
        for i, doc in enumerate(items):
            if self._matches(doc, query):
                items.pop(i)
                self.db._save()
                class DeleteResult:
                    deleted_count = 1
                return DeleteResult()
        class DeleteResult:
            deleted_count = 0
        return DeleteResult()

    async def count_documents(self, query: Optional[Dict[str, Any]] = None) -> int:
        query = query or {}
        return sum(1 for doc in self.db._data.get(self.name, []) if self._matches(doc, query))


class FallbackDatabase:
    def __init__(self):
        self._data: Dict[str, List[Dict[str, Any]]] = {}
        self._collections: Dict[str, FallbackCollection] = {}
        self._load()

    def _load(self):
        if os.path.exists(DB_FILE):
            try:
                with open(DB_FILE, "r", encoding="utf-8") as f:
                    self._data = json.load(f)
            except Exception:
                self._data = {}
        else:
            self._data = {}

    def _save(self):
        try:
            with open(DB_FILE, "w", encoding="utf-8") as f:
                json.dump(self._data, f, indent=2, default=str)
        except Exception as e:
            print(f"Error saving fallback DB: {e}")

    def __getitem__(self, name: str) -> FallbackCollection:
        if name not in self._collections:
            self._collections[name] = FallbackCollection(name, self)
        return self._collections[name]


fallback_db_instance = FallbackDatabase()


async def connect_to_mongo() -> None:
    global client, db, _storage_mode
    import asyncio
    connected = False
    last_exc = None

    for attempt in range(1, 4):
        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            client_kwargs = {
                "serverSelectionTimeoutMS": 10000 if "mongodb+srv" in settings.MONGODB_URL else 2500
            }
            try:
                import certifi
                client_kwargs["tlsCAFile"] = certifi.where()
            except Exception:
                pass

            test_client = AsyncIOMotorClient(settings.MONGODB_URL, **client_kwargs)
            await test_client.admin.command("ping")
            client = test_client
            db = client[settings.DATABASE_NAME]
            _storage_mode = "mongodb"
            print(f"Connected to MongoDB Atlas: {settings.DATABASE_NAME} (attempt {attempt})")
            connected = True
            break
        except Exception as exc:
            last_exc = exc
            if attempt < 3:
                await asyncio.sleep(1.2)

    if not connected:
        client = None
        db = fallback_db_instance
        _storage_mode = "fallback_json"
        print(f"MongoDB unavailable ({last_exc}). Using high-performance JSON-backed database.")

    try:
        await seed_initial_data()
    except Exception as seed_err:
        print(f"Seed note: {seed_err}")


async def close_mongo_connection() -> None:
    global client
    if client is not None:
        client.close()
        client = None


def get_db():
    global db
    if db is None:
        return fallback_db_instance
    return db


def get_storage_status() -> Dict[str, str]:
    return {
        "mode": _storage_mode,
        "database": settings.DATABASE_NAME,
        "status": "connected" if _storage_mode in ["mongodb", "fallback_json"] else "disconnected"
    }


async def seed_initial_data():
    database = get_db()

    # Comprehensive catalog of Unstop-style opportunities (Internships, PPO & Full-Time Jobs)
    sample_jobs = [
        {
            "_id": "opp-1",
            "domain": "software",
            "category": "internship",
            "title": "Software Development Engineer Intern (SDE Summer/Winter 2026)",
            "company": "CognitiveFlow Technologies",
            "company_logo_color": "#0066cc",
            "location": "Remote / Bengaluru & San Francisco",
            "type": "Internship",
            "duration": "6 Months",
            "stipend_or_salary": "₹55,000 - ₹80,000/month + PPO (₹18-24 LPA)",
            "salary_range": "₹55k - ₹80k / mo",
            "department": "Core Platform Engineering",
            "experience_level": "College Students & Freshers (Batch 2025-2027)",
            "eligibility": "B.Tech / B.E / M.Tech / MCA in CS, IT, ECE or related engineering disciplines",
            "deadline_days_left": 4,
            "applicants_count": 542,
            "verified_partner": True,
            "description": "Join our fast-paced core engineering team to develop high-throughput microservices, design scalable asynchronous backend architectures, and build modern React components with Pre-Placement Offer (PPO) opportunities upon internship completion.",
            "requirements": [
                "Strong grasp of Data Structures, Algorithms, and Object-Oriented Design (Java, C++, or Python)",
                "Hands-on experience with modern web development (FastAPI/Django, Node.js, or React)",
                "Solid understanding of Relational (PostgreSQL/MySQL) or NoSQL (MongoDB) databases",
                "Demonstrated problem-solving abilities and curiosity to learn production systems"
            ],
            "skills": ["Python", "FastAPI", "React", "Java", "Data Structures", "Docker", "MongoDB"],
            "interview_rounds": [
                "Round 1: Online Coding Assessment (DSA & CS Fundamentals - 90 mins)",
                "Round 2: Technical Interview 1 (DSA Problem Solving & Live Coding)",
                "Round 3: Technical Interview 2 (System Architecture & Framework Deep Dive)",
                "Round 4: Engineering Manager & Cultural Fit Discussion"
            ],
            "benefits": [
                "High-conversion Pre-Placement Offer (PPO) for full-time SDE role",
                "Direct 1-on-1 mentorship from senior tech leads and FAANG alumni",
                "Home office setup stipend and comprehensive health insurance coverage",
                "Certificate of Internship and formal Letter of Recommendation"
            ],
            "status": "active",
            "posted_by": "recruiter-1",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "_id": "opp-2",
            "domain": "software",
            "category": "internship",
            "title": "AI & Generative LLM Research Intern",
            "company": "DeepRecruit AI Labs",
            "company_logo_color": "#7928ca",
            "location": "Remote",
            "type": "Internship",
            "duration": "4-6 Months",
            "stipend_or_salary": "₹60,000 - ₹85,000/month + PPO (₹20-28 LPA)",
            "salary_range": "₹60k - ₹85k / mo",
            "department": "AI Research & NLP",
            "experience_level": "Pre-Final & Final Year Students / M.Tech",
            "eligibility": "Background in Machine Learning, Mathematics, Deep Learning, and Python",
            "deadline_days_left": 6,
            "applicants_count": 680,
            "verified_partner": True,
            "description": "Conduct cutting-edge research in NLP, fine-tune transformer models, implement semantic search pipelines, and deploy generative AI agents for intelligent candidate-job matching.",
            "requirements": [
                "Hands-on experience with PyTorch, Hugging Face, Transformers, or Sentence Transformers",
                "Solid mathematics foundation in linear algebra, probability, and optimization",
                "Familiarity with Vector Databases (Chroma, Pinecone, Qdrant) and RAG pipelines",
                "Clean Python programming practices with modular code"
            ],
            "skills": ["Python", "PyTorch", "NLP", "Transformers", "Sentence Transformers", "Vector DB"],
            "interview_rounds": [
                "Round 1: Machine Learning & Algorithmic Problem Solving Assessment",
                "Round 2: Deep Learning Paper Review & Architecture Screening",
                "Round 3: Executive Research Director Discussion"
            ],
            "benefits": [
                "Opportunity to co-author AI research publications and open-source contributions",
                "Top-tier compute credits (A100/H100 GPU cluster access)",
                "Direct path to full-time AI Scientist offer"
            ],
            "status": "active",
            "posted_by": "recruiter-1",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "_id": "opp-3",
            "domain": "software",
            "category": "internship",
            "title": "Full-Stack Web Development Intern (FastAPI + React)",
            "company": "ScaleApex Labs",
            "company_logo_color": "#0284c7",
            "location": "Hybrid / Bengaluru (Remote friendly)",
            "type": "Internship",
            "duration": "3-6 Months",
            "stipend_or_salary": "₹40,000 - ₹60,000/month + PPO",
            "salary_range": "₹40k - ₹60k / mo",
            "department": "Product Engineering",
            "experience_level": "College Students (Batch 2024-2027)",
            "eligibility": "B.Tech / B.E / MCA / B.Sc with hands-on full-stack projects",
            "deadline_days_left": 8,
            "applicants_count": 420,
            "verified_partner": True,
            "description": "Build responsive React web interfaces, integrate FastAPI RESTful endpoints, implement JWT token authentication, and optimize database queries for our enterprise talent platform.",
            "requirements": [
                "Experience building web applications with React (hooks, context, state management)",
                "Good knowledge of Python and FastAPI or Flask",
                "Familiarity with HTML5, CSS3, modern JavaScript/TypeScript, and RESTful APIs",
                "Experience with Git version control and collaborative workflows"
            ],
            "skills": ["React", "Python", "FastAPI", "TypeScript", "MongoDB", "CSS", "REST APIs"],
            "interview_rounds": [
                "Round 1: Web Development & JavaScript/Python Quiz",
                "Round 2: Live Code Sandbox & Component Construction",
                "Round 3: Technical Team Fitment Round"
            ],
            "benefits": [
                "Pre-Placement Offer (PPO) potential for SDE-1 role",
                "Flexible work hours and weekly technical learning sessions",
                "Certificate of Internship and project recommendation"
            ],
            "status": "active",
            "posted_by": "recruiter-2",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "_id": "opp-4",
            "domain": "software",
            "category": "job",
            "title": "Graduate Software Development Engineer (SDE-1 Full-Time)",
            "company": "CloudScale Systems",
            "company_logo_color": "#16a34a",
            "location": "Bengaluru / Hyderabad (Hybrid)",
            "type": "Full-Time Job",
            "duration": "Permanent",
            "stipend_or_salary": "₹14,00,000 - ₹22,00,000 / year + ESOPs",
            "salary_range": "₹14 - ₹22 LPA",
            "department": "Enterprise Cloud Squad",
            "experience_level": "0 - 2 Years / Fresh Graduates",
            "eligibility": "Graduating Batch 2024 / 2025 or up to 2 years experience",
            "deadline_days_left": 11,
            "applicants_count": 890,
            "verified_partner": True,
            "description": "Architect mission-critical distributed systems, high-concurrency microservices, event-driven pipelines, and cloud native architectures serving millions of users.",
            "requirements": [
                "Excellent algorithmic problem solving and Data Structures proficiency",
                "Experience in Java/Spring Boot, Python, or Golang in academic or production projects",
                "Solid grasp of relational databases, indexing, and distributed caching (Redis)",
                "Knowledge of containerization (Docker) and basic cloud fundamentals (AWS/GCP)"
            ],
            "skills": ["Java", "Spring Boot", "Python", "Microservices", "SQL", "Redis", "Docker", "AWS"],
            "interview_rounds": [
                "Round 1: Unstop Online Coding Challenge (3 DSA problems)",
                "Round 2: Technical Interview 1 (DSA & Problem Solving)",
                "Round 3: Technical Interview 2 (System Design Basics & Database)",
                "Round 4: Vice President of Engineering Fitment"
            ],
            "benefits": [
                "Competitive salary package with high-upside stock equity (ESOPs)",
                "Comprehensive medical insurance for employee and dependents",
                "Annual learning allowance and wellness stipend"
            ],
            "status": "active",
            "posted_by": "recruiter-1",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "_id": "opp-5",
            "domain": "software",
            "category": "internship",
            "title": "Data Science & Business Analytics Intern",
            "company": "FinPulse Analytics",
            "company_logo_color": "#ea580c",
            "location": "Remote / Mumbai",
            "type": "Internship",
            "duration": "3-6 Months",
            "stipend_or_salary": "₹35,000 - ₹55,000/month + PPO",
            "salary_range": "₹35k - ₹55k / mo",
            "department": "Data Science & BI",
            "experience_level": "College Students / Recent Graduates",
            "eligibility": "Degree in Computer Science, Data Science, Statistics, Mathematics, or Economics",
            "deadline_days_left": 5,
            "applicants_count": 380,
            "verified_partner": True,
            "description": "Extract actionable business insights from big data, build predictive machine learning models, design executive BI dashboards, and automate reporting pipelines.",
            "requirements": [
                "Strong hands-on proficiency in Python (Pandas, NumPy, Scikit-Learn)",
                "Advanced SQL querying skills (joins, window functions, aggregations)",
                "Experience with data visualization tools (Tableau, PowerBI, or Seaborn)",
                "Strong analytical mindset and ability to communicate findings clearly"
            ],
            "skills": ["Python", "SQL", "Pandas", "Scikit-Learn", "Tableau", "Machine Learning"],
            "interview_rounds": [
                "Round 1: SQL & Data Wrangling Online Assessment",
                "Round 2: Case Study Presentation & Machine Learning Model Discussion",
                "Round 3: Head of Analytics Interview"
            ],
            "benefits": [
                "PPO conversion opportunity for full-time Data Analyst / Data Scientist",
                "Mentorship on enterprise data warehouse architectures",
                "Industry-recognized internship credential"
            ],
            "status": "active",
            "posted_by": "recruiter-2",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "_id": "opp-6",
            "domain": "software",
            "category": "job",
            "title": "Cloud & DevOps Engineer (Graduate / Junior)",
            "company": "ScaleApex Cloud Solutions",
            "company_logo_color": "#0891b2",
            "location": "Pune / Remote",
            "type": "Full-Time Job",
            "duration": "Permanent",
            "stipend_or_salary": "₹12,00,000 - ₹18,00,000 / year",
            "salary_range": "₹12 - ₹18 LPA",
            "department": "DevOps & SRE",
            "experience_level": "0 - 2 Years / Fresh Graduates",
            "eligibility": "B.Tech / B.E in CS/IT or proven cloud certifications (AWS/CKA)",
            "deadline_days_left": 9,
            "applicants_count": 310,
            "verified_partner": True,
            "description": "Design resilient multi-cloud container orchestration, automate continuous integration and delivery (CI/CD) pipelines, and implement automated observability systems.",
            "requirements": [
                "Strong command of Linux operating system and Bash/Python scripting",
                "Hands-on experience with Docker containerization and Kubernetes orchestration",
                "Understanding of AWS cloud services (EC2, S3, RDS, IAM, EKS) or GCP",
                "Knowledge of Infrastructure as Code using Terraform"
            ],
            "skills": ["Linux", "Docker", "Kubernetes", "AWS", "Terraform", "CI/CD", "Git"],
            "interview_rounds": [
                "Round 1: Linux Administration & Networking Diagnostic Test",
                "Round 2: Live Containerization & Infrastructure Troubleshooting",
                "Round 3: Cloud Architect Fitment Round"
            ],
            "benefits": [
                "Cloud certification sponsorship (AWS Solutions Architect, CKA)",
                "Cutting-edge DevOps toolchain exposure",
                "Hybrid flexibility with top-tier hardware kit"
            ],
            "status": "active",
            "posted_by": "recruiter-2",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "_id": "opp-7",
            "domain": "business",
            "category": "internship",
            "title": "Associate Product Management Intern (APM Intern)",
            "company": "VentureFlow Technologies",
            "company_logo_color": "#d97706",
            "location": "Remote / Delhi NCR",
            "type": "Internship",
            "duration": "4 Months",
            "stipend_or_salary": "₹45,000 - ₹65,000/month + APM PPO",
            "salary_range": "₹45k - ₹65k / mo",
            "department": "Product Management",
            "experience_level": "Pre-final & Final Year Students",
            "eligibility": "All engineering and management undergraduate/graduate degrees",
            "deadline_days_left": 7,
            "applicants_count": 620,
            "verified_partner": True,
            "description": "Work directly with engineering leads and founders to define product roadmaps, conduct user interviews, analyze product funnel metrics, and create detailed PRDs.",
            "requirements": [
                "First-principles problem-solving approach and user empathy",
                "Strong analytical thinking and data-driven prioritization skills",
                "Familiarity with wireframing tools (Figma) and analytics (Mixpanel/Google Analytics)",
                "Exceptional written and oral communication skills"
            ],
            "skills": ["Product Strategy", "Figma", "User Research", "SQL", "Agile", "PRD Writing"],
            "interview_rounds": [
                "Round 1: Product Teardown & Case Study Submission",
                "Round 2: Product Design, Root-Cause Analysis & Estimation Interview",
                "Round 3: Director of Product Leadership Round"
            ],
            "benefits": [
                "Fast-track full-time Associate Product Manager (APM) conversion",
                "Direct exposure to C-suite leadership and strategic decision making",
                "Comprehensive product management toolkit mentorship"
            ],
            "status": "active",
            "posted_by": "recruiter-1",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "_id": "opp-8",
            "domain": "software",
            "category": "internship",
            "title": "Cybersecurity & Ethical Hacking Intern",
            "company": "SentinelShield Security",
            "company_logo_color": "#dc2626",
            "location": "Remote",
            "type": "Internship",
            "duration": "3-6 Months",
            "stipend_or_salary": "₹40,000 - ₹70,000/month + PPO",
            "salary_range": "₹40k - ₹70k / mo",
            "department": "Information Security & SOC",
            "experience_level": "Students & Self-taught Ethical Hackers",
            "eligibility": "Passionate about application security, network defense, or bug bounties",
            "deadline_days_left": 10,
            "applicants_count": 290,
            "verified_partner": True,
            "description": "Conduct web application penetration testing, identify OWASP Top 10 vulnerabilities, review code security, and assist in incident response monitoring.",
            "requirements": [
                "Understanding of web protocols (HTTP/HTTPS, TLS, TCP/IP)",
                "Knowledge of OWASP Top 10 vulnerabilities (SQLi, XSS, CSRF, IDOR)",
                "Familiarity with security testing tools (Burp Suite, Wireshark, Nmap)",
                "Basic scripting in Python or Bash for security automation"
            ],
            "skills": ["Penetration Testing", "OWASP", "Burp Suite", "Network Security", "Python", "Linux"],
            "interview_rounds": [
                "Round 1: Hands-on Capture The Flag (CTF) Challenge",
                "Round 2: Vulnerability Analysis & Exploit Mitigation Interview",
                "Round 3: Chief Information Security Officer (CISO) Discussion"
            ],
            "benefits": [
                "Bug bounty program bonuses for confirmed vulnerability discoveries",
                "Security certification sponsorship (CEH, OSCP)",
                "Full-time Security Analyst offer upon successful internship"
            ],
            "status": "active",
            "posted_by": "recruiter-2",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "_id": "opp-9",
            "domain": "software",
            "category": "internship",
            "title": "Mobile App Development Intern (React Native / Flutter)",
            "company": "AppVibe Mobile Labs",
            "company_logo_color": "#2563eb",
            "location": "Remote / Chennai",
            "type": "Internship",
            "duration": "3-6 Months",
            "stipend_or_salary": "₹35,000 - ₹50,000/month + PPO",
            "salary_range": "₹35k - ₹50k / mo",
            "department": "Mobile Engineering",
            "experience_level": "Students with mobile app project experience",
            "eligibility": "B.Tech / B.E / MCA with at least one mobile app demo or repository",
            "deadline_days_left": 6,
            "applicants_count": 340,
            "verified_partner": True,
            "description": "Build cross-platform iOS and Android mobile features, implement state management, design smooth animations, and integrate REST/GraphQL APIs.",
            "requirements": [
                "Experience with React Native or Flutter cross-platform development",
                "Familiarity with state management libraries (Redux, Zustand, or Bloc)",
                "Understanding of mobile UI design guidelines (Material Design & iOS Human Interface)",
                "Knowledge of API integration and offline local caching (SQLite/AsyncStorage)"
            ],
            "skills": ["React Native", "Flutter", "JavaScript", "TypeScript", "Mobile UI", "REST APIs"],
            "interview_rounds": [
                "Round 1: Mobile App Architecture & UI Construction Screen",
                "Round 2: Live Debugging & State Management Assessment",
                "Round 3: Mobile Engineering Lead Fitment"
            ],
            "benefits": [
                "PPO opportunity for Junior Mobile Engineer role",
                "Apple Developer & Google Play Console publishing mentorship",
                "Flexible remote working policy"
            ],
            "status": "active",
            "posted_by": "recruiter-2",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "_id": "opp-10",
            "domain": "software",
            "category": "job",
            "title": "Quality Assurance & Test Automation Engineer (SDET)",
            "company": "EnterpriseTech QA",
            "company_logo_color": "#059669",
            "location": "Hyderabad / Remote",
            "type": "Full-Time Job",
            "duration": "Permanent",
            "stipend_or_salary": "₹10,00,000 - ₹16,00,000 / year",
            "salary_range": "₹10 - ₹16 LPA",
            "department": "Quality Assurance & SDET",
            "experience_level": "0 - 3 Years / Fresh Graduates with Automation Skills",
            "eligibility": "B.Tech / B.E in CS/IT/ECE with software testing knowledge",
            "deadline_days_left": 14,
            "applicants_count": 270,
            "verified_partner": True,
            "description": "Develop end-to-end test automation suites using Playwright, Selenium, and PyTest; design automated API verification pipelines; and ensure production release reliability.",
            "requirements": [
                "Proficiency in Python or Java for test automation scripting",
                "Hands-on experience with modern automation frameworks (Playwright, Selenium, Cypress)",
                "Experience in REST API testing with Postman or Requests/RestAssured",
                "Understanding of CI/CD integration using GitHub Actions or Jenkins"
            ],
            "skills": ["Selenium", "Playwright", "Python", "PyTest", "API Testing", "Postman", "CI/CD"],
            "interview_rounds": [
                "Round 1: Automation Scripting & Test Strategy Quiz",
                "Round 2: Live Test Framework Construction & Bug Hunt Challenge",
                "Round 3: SDET Director Interview"
            ],
            "benefits": [
                "Fast-track career growth in software reliability engineering",
                "Performance bonus and annual increment cycles",
                "Comprehensive medical insurance and wellness allowance"
            ],
            "status": "active",
            "posted_by": "recruiter-1",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # --- NEW SOFTWARE & AI JOBS ---
        {
            "_id": "opp-11",
            "domain": "software",
            "category": "job",
            "title": "Big Data Engineer & Distributed Streaming Pipelines",
            "company": "DataStream Technologies",
            "company_logo_color": "#0284c7",
            "location": "Bengaluru / Pune (Hybrid)",
            "type": "Full-Time Job",
            "duration": "Permanent",
            "stipend_or_salary": "₹18,00,000 - ₹28,00,000 / year + Equity",
            "salary_range": "₹18 - ₹28 LPA",
            "department": "Data Platform & Analytics Infrastructure",
            "experience_level": "1 - 3 Years / Strong Final Year Master's",
            "eligibility": "B.Tech / M.Tech in CS/IT with distributed data systems background",
            "deadline_days_left": 12,
            "applicants_count": 315,
            "verified_partner": True,
            "description": "Architect high-throughput real-time streaming pipelines using Apache Spark, Kafka, and Snowflake. Ingest and transform billions of telemetry events daily.",
            "requirements": [
                "Strong grasp of distributed computing and Apache Spark / Kafka streaming",
                "Proficiency in Python, Scala, or Java with SQL query optimization",
                "Experience with cloud data lakes (AWS S3, EMR, Athena, or Snowflake)",
                "Solid understanding of data warehousing concepts (Star schema, Parquet)"
            ],
            "skills": ["Apache Spark", "Kafka", "Python", "SQL", "Snowflake", "AWS EMR", "Docker"],
            "interview_rounds": [
                "Round 1: Distributed Systems & Advanced SQL Online Challenge",
                "Round 2: Data Pipeline Design & Live Spark Coding",
                "Round 3: Principal Data Architect Review"
            ],
            "benefits": [
                "Competitive base salary + attractive equity grant",
                "Generous annual learning and conference attendance budget",
                "Remote-flexible work arrangements"
            ],
            "status": "active",
            "posted_by": "recruiter-1",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "_id": "opp-12",
            "domain": "software",
            "category": "job",
            "title": "Senior Frontend Systems Engineer (React 18 & Next.js)",
            "company": "PixelCraft Design Tech",
            "company_logo_color": "#ec4899",
            "location": "Remote / Bengaluru",
            "type": "Full-Time Job",
            "duration": "Permanent",
            "stipend_or_salary": "₹16,00,000 - ₹25,00,000 / year",
            "salary_range": "₹16 - ₹25 LPA",
            "department": "Design Systems & Web Experience",
            "experience_level": "1 - 4 Years",
            "eligibility": "Proven track record with production React, Next.js, and design systems",
            "deadline_days_left": 9,
            "applicants_count": 480,
            "verified_partner": True,
            "description": "Lead the design system architecture, build pixel-perfect micro-frontends with React 18 and Next.js, and push web performance to achieve 99+ Lighthouse scores.",
            "requirements": [
                "Deep mastery of JavaScript (ESNext), TypeScript, React 18+, and Next.js",
                "Experience building accessible component libraries (Radix, Tailwind, Storybook)",
                "Understanding of web vitals (LCP, FID, CLS), SSR, and bundle optimization",
                "Passion for micro-interactions, smooth animations, and clean CSS architecture"
            ],
            "skills": ["React", "Next.js", "TypeScript", "Tailwind CSS", "Redux", "Storybook", "Web Vitals"],
            "interview_rounds": [
                "Round 1: UI Component Sandbox & Live Coding Test",
                "Round 2: Frontend Architecture & Performance Deep Dive",
                "Round 3: Head of Product Design Fitment"
            ],
            "benefits": [
                "Latest Apple MacBook Pro M3 Max hardware provided",
                "Home workstation reimbursement (up to ₹80,000)",
                "Comprehensive family health insurance"
            ],
            "status": "active",
            "posted_by": "recruiter-2",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # --- BUSINESS, MANAGEMENT & FINANCE JOBS ---
        {
            "_id": "opp-13",
            "domain": "business",
            "category": "job",
            "title": "Business Analyst & Operations Strategy Associate",
            "company": "Apex Global Consulting Group",
            "company_logo_color": "#0f766e",
            "location": "Gurugram / Mumbai / Bengaluru",
            "type": "Full-Time Job",
            "duration": "Permanent",
            "stipend_or_salary": "₹13,00,000 - ₹20,00,000 / year + Performance Bonus",
            "salary_range": "₹13 - ₹20 LPA",
            "department": "Strategy & Management Consulting",
            "experience_level": "0 - 2 Years / Fresh Graduates (Batch 2024-2026)",
            "eligibility": "B.Tech / B.E / BBA / Economics / MBA from top institutes",
            "deadline_days_left": 7,
            "applicants_count": 620,
            "verified_partner": True,
            "description": "Synthesize enterprise market data, build executive financial models, conduct competitor bench-marking, and deliver data-driven strategic roadmaps to Fortune 500 leadership.",
            "requirements": [
                "Proficiency in SQL data extraction and advanced Excel financial modeling",
                "Experience creating business intelligence dashboards (Tableau, PowerBI)",
                "Exceptional structured problem solving and case study analytical capabilities",
                "Strong executive storytelling, slide deck presentation, and stakeholder communication"
            ],
            "skills": ["SQL", "Excel", "Tableau", "PowerBI", "Financial Modeling", "Business Strategy", "Market Research"],
            "interview_rounds": [
                "Round 1: Quantitative Aptitude & Data Interpretation Assessment",
                "Round 2: Strategy Case Study & Guesstimate Presentation",
                "Round 3: Managing Director & Partner Interview"
            ],
            "benefits": [
                "Direct exposure to Fortune 500 CXO stakeholders",
                "Accelerated promotion track to Senior Consultant",
                "Global mobility and international project opportunities"
            ],
            "status": "active",
            "posted_by": "recruiter-1",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "_id": "opp-14",
            "domain": "business",
            "category": "internship",
            "title": "Investment Banking & Financial Valuation Analyst Intern",
            "company": "Horizon Capital Partners",
            "company_logo_color": "#d97706",
            "location": "Mumbai (Bandra-Kurla Complex)",
            "type": "Internship",
            "duration": "6 Months",
            "stipend_or_salary": "₹60,000 - ₹90,000/month + PPO (₹22-30 LPA)",
            "salary_range": "₹60k - ₹90k / mo",
            "department": "M&A and Corporate Finance",
            "experience_level": "College Students / Final Year B.Com / B.Tech / MBA",
            "eligibility": "Strong acumen in corporate finance, accounting, and financial modeling",
            "deadline_days_left": 5,
            "applicants_count": 780,
            "verified_partner": True,
            "description": "Perform discounted cash flow (DCF) and leveraged buyout (LBO) financial modeling, prepare pitch books for mergers and acquisitions (M&A), and analyze industry transaction multiples.",
            "requirements": [
                "Solid understanding of 3-statement financial models, DCF, and comparable company analysis",
                "Advanced Microsoft Excel modeling and PowerPoint pitch book creation",
                "High attention to detail, numerical precision, and financial statement literacy",
                "Knowledge of Bloomberg Terminal or Capital IQ is a strong plus"
            ],
            "skills": ["Financial Modeling", "Valuation (DCF/LBO)", "M&A", "Advanced Excel", "PowerPoint", "Corporate Finance"],
            "interview_rounds": [
                "Round 1: Financial Concepts & Accounting Diagnostic Test",
                "Round 2: Live 3-Statement Modeling Challenge (Excel)",
                "Round 3: Investment Banking Vice President Interview"
            ],
            "benefits": [
                "High-conversion Pre-Placement Offer (PPO) to full-time Investment Banking Analyst",
                "Direct deal-making exposure to high-profile M&A transactions",
                "Deal completion bonuses and comprehensive executive perks"
            ],
            "status": "active",
            "posted_by": "recruiter-1",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "_id": "opp-15",
            "domain": "business",
            "category": "internship",
            "title": "Digital Growth Marketing & Performance Analytics Intern",
            "company": "ScaleRocket Media Tech",
            "company_logo_color": "#dc2626",
            "location": "Remote / Bengaluru",
            "type": "Internship",
            "duration": "3-6 Months",
            "stipend_or_salary": "₹35,00,000 - ₹50,000/month + PPO",
            "salary_range": "₹35k - ₹50k / mo",
            "department": "Growth & User Acquisition",
            "experience_level": "College Students with digital marketing enthusiasm",
            "eligibility": "Open to all branches (B.Tech, BBA, B.Com, Media)",
            "deadline_days_left": 8,
            "applicants_count": 410,
            "verified_partner": True,
            "description": "Run high-ROI growth campaigns, manage Google/Meta Ads attribution, optimize funnel conversion rates (CRO), and analyze user acquisition metrics (CAC, LTV).",
            "requirements": [
                "Hands-on familiarity with Google Analytics (GA4), Search Console, and Meta Ads Manager",
                "Analytical mindset with ability to interpret A/B test split results",
                "Basic understanding of SEO on-page optimization and content marketing",
                "Creative copywriting and data-driven experimental mindset"
            ],
            "skills": ["Digital Marketing", "SEO", "Google Analytics", "Performance Marketing", "A/B Testing", "Content Strategy"],
            "interview_rounds": [
                "Round 1: Digital Campaign Strategy & Analytics Screening",
                "Round 2: Funnel Optimization Case Study",
                "Round 3: Head of Growth Discussion"
            ],
            "benefits": [
                "Direct ownership of real advertising budgets (up to ₹5,00,000/month)",
                "PPO path to Associate Growth Manager role",
                "Flexible work-from-home policy"
            ],
            "status": "active",
            "posted_by": "recruiter-2",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "_id": "opp-16",
            "domain": "business",
            "category": "job",
            "title": "Enterprise B2B SaaS Sales & Account Executive",
            "company": "Velocity Cloud Corp",
            "company_logo_color": "#2563eb",
            "location": "Bengaluru / Hyderabad",
            "type": "Full-Time Job",
            "duration": "Permanent",
            "stipend_or_salary": "₹12,00,000 - ₹20,00,000 / year + Uncapped Commissions",
            "salary_range": "₹12 - ₹20 LPA",
            "department": "Enterprise Commercial Sales",
            "experience_level": "0 - 3 Years / High-Energy Freshers",
            "eligibility": "B.Tech / BBA / MBA with persuasive communication and negotiation abilities",
            "deadline_days_left": 13,
            "applicants_count": 330,
            "verified_partner": True,
            "description": "Drive mid-market and enterprise SaaS software sales across North America and APAC. Prospect CXO buyers, conduct technical demonstrations, and close multi-year enterprise contracts.",
            "requirements": [
                "Exceptional verbal and written communication in English with negotiation finesse",
                "Familiarity with CRM tools (Salesforce, HubSpot, Apollo)",
                "Demonstrated tenacity, resilience, and consultative closing techniques",
                "Ability to understand and pitch complex technical cloud software solutions"
            ],
            "skills": ["Enterprise Sales", "B2B SaaS", "Salesforce", "Lead Generation", "Negotiation", "Account Management"],
            "interview_rounds": [
                "Round 1: Sales Aptitude & Cold Call Roleplay Simulation",
                "Round 2: Enterprise Software Solution Pitch Presentation",
                "Round 3: VP of Global Sales Interview"
            ],
            "benefits": [
                "Uncapped sales commission incentive structure (OTEs up to ₹35 LPA)",
                "Annual international club trips for top quota achievers",
                "Comprehensive medical insurance and wellness allowance"
            ],
            "status": "active",
            "posted_by": "recruiter-1",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "_id": "opp-17",
            "domain": "business",
            "category": "job",
            "title": "Technical Talent Acquisition & HR Business Partner",
            "company": "PeopleFirst Global Solutions",
            "company_logo_color": "#7c3aed",
            "location": "Remote / Bengaluru",
            "type": "Full-Time Job",
            "duration": "Permanent",
            "stipend_or_salary": "₹9,00,000 - ₹15,00,000 / year",
            "salary_range": "₹9 - ₹15 LPA",
            "department": "Human Resources & Talent Management",
            "experience_level": "0 - 3 Years",
            "eligibility": "Any Degree / MBA in HR / Psychology with technical recruiting skills",
            "deadline_days_left": 15,
            "applicants_count": 290,
            "verified_partner": True,
            "description": "Lead full-cycle technical recruiting for high-growth software and AI engineering teams. Manage applicant tracking systems (ATS), conduct behavioral screenings, and elevate candidate experience.",
            "requirements": [
                "Understanding of tech stacks (FastAPI, React, Kubernetes, AI/ML)",
                "Experience sourcing candidates via LinkedIn Recruiter, GitHub, and campus drives",
                "Strong interpersonal empathy, negotiation, and stakeholder management",
                "Knowledge of modern HR labor compliance and interview governance"
            ],
            "skills": ["Technical Recruiting", "HR Operations", "LinkedIn Recruiter", "ATS Management", "Talent Sourcing", "Onboarding"],
            "interview_rounds": [
                "Round 1: Tech Sourcing & Candidate Engagement Screen",
                "Round 2: Stakeholder Alignment & Offer Negotiation Scenario",
                "Round 3: Chief Human Resources Officer (CHRO) Chat"
            ],
            "benefits": [
                "Quarterly hiring milestone bonuses",
                "Hybrid remote working flexibility",
                "Mental health & wellness coaching benefits"
            ],
            "status": "active",
            "posted_by": "recruiter-2",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # --- HARDWARE, EMBEDDED SYSTEMS & ELECTRONICS JOBS ---
        {
            "_id": "opp-18",
            "domain": "hardware",
            "category": "internship",
            "title": "Embedded Systems & Firmware Engineering Intern",
            "company": "SiliconEdge Micro Systems",
            "company_logo_color": "#ea580c",
            "location": "Bengaluru (Electronic City)",
            "type": "Internship",
            "duration": "6 Months",
            "stipend_or_salary": "₹45,000 - ₹65,000/month + PPO (₹15-22 LPA)",
            "salary_range": "₹45k - ₹65k / mo",
            "department": "Firmware & Embedded Hardware",
            "experience_level": "College Students / Freshers (ECE, EEE, Robotics, CS)",
            "eligibility": "B.Tech / B.E / M.Tech in Electronics, Electrical, Embedded Systems",
            "deadline_days_left": 6,
            "applicants_count": 390,
            "verified_partner": True,
            "description": "Write low-level firmware in Embedded C/C++ on ARM Cortex microcontrollers, implement communication drivers (I2C, SPI, UART, CAN), and interface hardware sensors with FreeRTOS.",
            "requirements": [
                "Strong proficiency in Embedded C and C++ for microcontrollers (STM32, ESP32, or NXP)",
                "Experience with real-time operating systems (FreeRTOS)",
                "Hands-on familiarity with hardware lab tools (Logic Analyzer, Oscilloscope, Multimeter)",
                "Solid understanding of communication protocols (UART, SPI, I2C, CAN Bus)"
            ],
            "skills": ["Embedded C", "C++", "FreeRTOS", "ARM Cortex", "STM32", "I2C/SPI", "Firmware Debugging"],
            "interview_rounds": [
                "Round 1: Embedded C Concepts & Bitwise Manipulation Assessment",
                "Round 2: Firmware Architecture & Hardware Driver Design",
                "Round 3: Principal Embedded Hardware Lead Interview"
            ],
            "benefits": [
                "High-conversion PPO for full-time Firmware Engineer role",
                "Access to state-of-the-art semiconductor prototyping laboratory",
                "Relocation stipend and accommodation assistance"
            ],
            "status": "active",
            "posted_by": "recruiter-1",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "_id": "opp-19",
            "domain": "hardware",
            "category": "job",
            "title": "VLSI & ASIC Semiconductor Chip Design Engineer",
            "company": "NanoSilicon Semiconductor Labs",
            "company_logo_color": "#4338ca",
            "location": "Bengaluru / Noida / Austin",
            "type": "Full-Time Job",
            "duration": "Permanent",
            "stipend_or_salary": "₹18,00,000 - ₹32,00,000 / year + Sign-On Bonus",
            "salary_range": "₹18 - ₹32 LPA",
            "department": "Silicon RTL & Digital Architecture",
            "experience_level": "0 - 3 Years / Master's (M.Tech in VLSI / Microelectronics)",
            "eligibility": "B.Tech / M.Tech in ECE / VLSI / Microelectronics",
            "deadline_days_left": 10,
            "applicants_count": 280,
            "verified_partner": True,
            "description": "Design high-performance digital logic in Verilog and SystemVerilog, implement synthesis and static timing analysis (STA), and verify cutting-edge ASIC micro-architectures.",
            "requirements": [
                "Deep knowledge of Digital Electronics, Computer Architecture, and RTL design",
                "Proficiency in Verilog / SystemVerilog and verification methodologies (UVM basics)",
                "Experience with EDA tools (Synopsys Design Compiler, Cadence, ModelSim, Vivado)",
                "Understanding of Static Timing Analysis (STA), clock domain crossing (CDC), and power optimization"
            ],
            "skills": ["Verilog", "SystemVerilog", "RTL Design", "VLSI", "Static Timing Analysis", "FPGA", "Synopsys"],
            "interview_rounds": [
                "Round 1: Digital Electronics & RTL Design Challenge",
                "Round 2: Timing Analysis, State Machines & Verilog Live Coding",
                "Round 3: Silicon Engineering Director Technical Interview"
            ],
            "benefits": [
                "Top-tier semiconductor industry compensation and equity",
                "Cutting-edge 3nm/5nm tape-out project experience",
                "Comprehensive medical, dental, and vision insurance"
            ],
            "status": "active",
            "posted_by": "recruiter-1",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "_id": "opp-20",
            "domain": "hardware",
            "category": "job",
            "title": "Robotics & Autonomous Hardware Systems Engineer",
            "company": "RoboDrive Dynamics",
            "company_logo_color": "#0891b2",
            "location": "Pune / Bengaluru",
            "type": "Full-Time Job",
            "duration": "Permanent",
            "stipend_or_salary": "₹16,00,000 - ₹26,00,000 / year",
            "salary_range": "₹16 - ₹26 LPA",
            "department": "Robotics Hardware & Autonomous Vehicles",
            "experience_level": "0 - 3 Years",
            "eligibility": "B.Tech / M.Tech in Mechatronics, Robotics, Mechanical, ECE",
            "deadline_days_left": 11,
            "applicants_count": 240,
            "verified_partner": True,
            "description": "Develop hardware controllers, sensor integration (LiDAR, IMU, cameras), and motor drive electronics for autonomous mobile robots (AMRs) using ROS2 and C++.",
            "requirements": [
                "Experience with Robot Operating System (ROS / ROS2) and sensor fusion algorithms",
                "Strong C++ and Python development for real-time robotic systems",
                "Knowledge of motor drivers (BLDC, Stepper), actuators, and battery power systems",
                "Familiarity with kinematic modeling, motion planning, and Gazebo simulation"
            ],
            "skills": ["ROS2", "C++", "Robotics", "Sensor Fusion", "LiDAR", "Motor Controllers", "Gazebo"],
            "interview_rounds": [
                "Round 1: Kinematics, Control Systems & C++ Technical Screening",
                "Round 2: Autonomous Navigation & Sensor Fusion Case Study",
                "Round 3: Head of Autonomous Systems Interview"
            ],
            "benefits": [
                "Hands-on robotics hardware prototyping workshop access",
                "Patent filing financial incentives",
                "Flexible work schedule and relocation allowance"
            ],
            "status": "active",
            "posted_by": "recruiter-1",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "_id": "opp-21",
            "domain": "hardware",
            "category": "internship",
            "title": "IoT Hardware Prototyping & PCB Design Intern",
            "company": "SmartConnected Devices Lab",
            "company_logo_color": "#15803d",
            "location": "Bengaluru / Hyderabad",
            "type": "Internship",
            "duration": "3-6 Months",
            "stipend_or_salary": "₹35,000 - ₹50,000/month + PPO (₹12-16 LPA)",
            "salary_range": "₹35k - ₹50k / mo",
            "department": "Hardware R&D",
            "experience_level": "College Students (ECE, EEE, Instrumentation)",
            "eligibility": "B.Tech / B.E with circuit design and PCB layout experience",
            "deadline_days_left": 7,
            "applicants_count": 310,
            "verified_partner": True,
            "description": "Design multi-layer PCB schematics and layouts using KiCad or Altium, test prototype boards in the lab, integrate wireless modules (BLE, Wi-Fi, LoRa), and debug analog circuits.",
            "requirements": [
                "Proficiency in schematic capture and PCB layout tools (KiCad, Altium Designer, or Eagle)",
                "Understanding of signal integrity, ground planes, and power distribution networks",
                "Hands-on soldering and surface-mount device (SMD) rework skills",
                "Knowledge of low-power IoT microcontrollers (ESP32, Nordic nRF52)"
            ],
            "skills": ["PCB Design", "Altium Designer", "KiCad", "IoT", "ESP32", "Circuit Simulation", "Hardware Testing"],
            "interview_rounds": [
                "Round 1: Analog & Digital Circuit Fundamentals Assessment",
                "Round 2: PCB Layout Review & Design Rule Check (DRC) Challenge",
                "Round 3: Lead Hardware Engineer Interview"
            ],
            "benefits": [
                "Fast PPO conversion to Junior Hardware Engineer",
                "All hardware prototyping and PCB fabrication costs fully sponsored",
                "Flexible hours and technical mentorship"
            ],
            "status": "active",
            "posted_by": "recruiter-2",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "_id": "opp-22",
            "domain": "hardware",
            "category": "job",
            "title": "Power Electronics & EV Battery Management Systems (BMS) Engineer",
            "company": "VoltMobility Electric Technologies",
            "company_logo_color": "#0284c7",
            "location": "Bengaluru / Pune",
            "type": "Full-Time Job",
            "duration": "Permanent",
            "stipend_or_salary": "₹15,00,000 - ₹24,00,000 / year + EV Perks",
            "salary_range": "₹15 - ₹24 LPA",
            "department": "EV Powertrain & Battery Systems",
            "experience_level": "0 - 3 Years / Fresh Postgraduates",
            "eligibility": "B.Tech / M.Tech in Electrical / Power Electronics / ECE",
            "deadline_days_left": 14,
            "applicants_count": 260,
            "verified_partner": True,
            "description": "Develop and calibrate Battery Management Systems (BMS), design DC-DC converters and inverter power stages for high-voltage electric vehicle (EV) battery packs.",
            "requirements": [
                "Expertise in power electronics topologies (Buck, Boost, Flyback, Inverters)",
                "Experience with MATLAB / Simulink for control algorithm modeling",
                "Familiarity with Lithium-ion battery chemistry, State of Charge (SoC) algorithms, and thermal management",
                "Understanding of automotive communication standards (CAN, CAN-FD, LIN)"
            ],
            "skills": ["Power Electronics", "Battery Management (BMS)", "MATLAB/Simulink", "CAN Bus", "Circuit Design", "EV Powertrain"],
            "interview_rounds": [
                "Round 1: Power Electronics & Circuit Analysis Online Test",
                "Round 2: BMS Architecture & Simulink Model Design Challenge",
                "Round 3: Chief Powertrain Engineer Discussion"
            ],
            "benefits": [
                "High-impact role accelerating sustainable clean mobility",
                "Employee discount and subsidies on company electric vehicles",
                "Comprehensive health cover and annual performance bonuses"
            ],
            "status": "active",
            "posted_by": "recruiter-1",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]

    for j in sample_jobs:
        existing = await database["jobs"].find_one({"_id": j["_id"]})
        if not existing:
            await database["jobs"].insert_one(j)
        else:
            await database["jobs"].update_one({"_id": j["_id"]}, {"$set": j})

    # Seed or update sample candidate application
    sample_app = {
        "_id": "app-101",
        "job_id": "opp-1",
        "job_title": "Software Development Engineer Intern (SDE Summer/Winter 2026)",
        "company": "CognitiveFlow Technologies",
        "category": "internship",
        "candidate_id": "candidate-1",
        "candidate_name": "Sumii",
        "candidate_email": "sumii@example.com",
        "candidate_phone": "+15554445555",
        "candidate_skills": ["Python", "FastAPI", "React", "TypeScript", "Docker", "MongoDB"],
        "cover_letter": "I have built production-grade full-stack applications with FastAPI and React, and have solved 400+ DSA problems. I am eager to contribute to CognitiveFlow.",
        "resume_name": "Sumii_Resume.pdf",
        "match_score": 96,
        "match_breakdown": {
            "skills_score": 98,
            "experience_score": 94,
            "matched_skills": ["Python", "FastAPI", "React", "Docker", "MongoDB"],
            "missing_skills": ["Java"],
            "strengths": [
                "Exceptional alignment in core Python, FastAPI, and React full-stack stack",
                "Strong foundation in Data Structures and algorithmic problem solving",
                "High eligibility for Pre-Placement Offer (PPO)"
            ],
            "recommendations": [
                "Review Java concurrency basics before Round 3"
            ],
            "summary": "Outstanding candidate match with 96% overall fit. Recommended for Round 2 Technical Screening."
        },
        "status": "interview_scheduled",
        "applied_at": datetime.now(timezone.utc).isoformat()
    }
    existing_app = await database["applications"].find_one({"_id": sample_app["_id"]})
    if not existing_app:
        await database["applications"].insert_one(sample_app)
    else:
        await database["applications"].update_one({"_id": sample_app["_id"]}, {"$set": sample_app})

    # Seed or update sample confirmed interview
    sample_interview = {
        "_id": "int-201",
        "application_id": "app-101",
        "job_id": "opp-1",
        "job_title": "Software Development Engineer Intern (SDE Summer/Winter 2026)",
        "candidate_name": "Sumii",
        "candidate_email": "sumii@example.com",
        "scheduled_date": "Tomorrow, 2:00 PM EST",
        "round": "Round 2: Technical Interview (DSA & Live Code Pair)",
        "duration_minutes": 60,
        "meeting_link": "https://meet.google.com/rec-flow-ai",
        "interviewer": "Summya (Lead Engineering Mentor)",
        "status": "scheduled",
        "notes": "Focus on array/string algorithms, FastAPI concurrency, and database indexing."
    }
    existing_int = await database["interviews"].find_one({"_id": sample_interview["_id"]})
    if not existing_int:
        await database["interviews"].insert_one(sample_interview)
    else:
        await database["interviews"].update_one({"_id": sample_interview["_id"]}, {"$set": sample_interview})

    # Seed or update the single authorized default Admin/Recruiter account into MongoDB Atlas
    try:
        from utils.auth import hash_password
        admin_account = {
            "_id": "admin-1",
            "name": "Admin (Hiring Authority)",
            "email": "admin@recruitmentportal.com",
            "phone": "+15550001111",
            "role": "admin",
            "company_name": "Recruitment Portal Central",
            "skills": ["Candidate Applications Review", "Interview Scheduling", "Selection Approval", "Job Management"],
            "bio": "Sole Authorized Platform Administrator & Hiring Recruiter",
            "password_hash": hash_password("Admin@2026")
        }
        existing_admin = await database["users"].find_one({"_id": admin_account["_id"]})
        if not existing_admin:
            await database["users"].insert_one(admin_account)
        else:
            await database["users"].update_one({"_id": admin_account["_id"]}, {"$set": admin_account})

        # Seed candidate account Sumii
        candidate_account = {
            "_id": "candidate-1",
            "name": "Sumii",
            "email": "sumii@example.com",
            "phone": "+15554445555",
            "role": "candidate",
            "company_name": "",
            "skills": ["Python", "FastAPI", "React", "TypeScript", "Docker", "MongoDB"],
            "bio": "Full-Stack Software Engineer & Candidate",
            "password_hash": hash_password("Candidate@2026")
        }
        existing_cand = await database["users"].find_one({"_id": candidate_account["_id"]})
        if not existing_cand:
            await database["users"].insert_one(candidate_account)
        else:
            await database["users"].update_one({"_id": candidate_account["_id"]}, {"$set": candidate_account})
    except Exception as admin_seed_err:
        print(f"Admin seed note: {admin_seed_err}")

    print("Initial seed data loaded successfully with 10 comprehensive Unstop-style opportunities.")
