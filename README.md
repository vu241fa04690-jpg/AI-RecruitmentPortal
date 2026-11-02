# AI Recruitment Platform V2 – Enterprise Upgrade

An advanced, full-stack AI recruitment platform featuring real-time ATS compatibility scoring, interactive AI mock interview evaluation, personalized career learning roadmaps, recruiter bulk resume ingestion, candidate side-by-side comparison, recruitment analytics with CSV export, and in-app notifications.

**Stack:** React 18 (Vite) · Python FastAPI · MongoDB Atlas Cloud · JWT 256-bit Auth · PyMuPDF & Python-DOCX · Semantic Matching Engine

---

## 🚀 Quick Start & Access Credentials

### 🛡️ Authorized Credentials
| Role | Portal Tab | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Admin / Recruiter** *(Sole Hiring Authority)* | **🛡️ Admin / Recruiter Portal** | `admin@recruitmentportal.com` | `Admin@2026` | Full Access: Applicant Tracking, Resumes, Candidate Requests, Pipeline Status, Interview Scheduler, Job Management |
| **Candidate** *(Job Seeker)* | **🎓 Candidate Login** | `sumii@example.com` | `Candidate@2026` | Candidate Profile, Resume ATS Matcher, Browse Jobs, Submit Applications, View Status |

> **Note:** Public signups are strictly restricted to Candidate roles. Only the single verified Administrator (`admin@recruitmentportal.com`) has access to candidate applications, resumes, and hiring pipelines.

### 🌐 Live Server URLs
- **Frontend Portal:** [http://127.0.0.1:5173](http://127.0.0.1:5173)
- **FastAPI Backend:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Swagger Interactive API Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **MongoDB Atlas Cloud DB:** Cluster0 (`ai_recruitment`)

### Option B: Manual Command Line

#### 1. Backend (FastAPI)
```bash
cd backend
# Activate virtualenv (if configured)
venv\Scripts\activate      # Windows
# or source venv/bin/activate (Mac/Linux)

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
- Interactive Swagger API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health Check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

#### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

---

## ✨ Key Features

### 👤 Candidate Experience & Career System
- **ATS Resume Builder:** Interactive, single-column resume builder with multi-version cloud storage in MongoDB Atlas and PDF export.
- **ATS Quality Audit:** Checks section presence, action verb density, keyword density, and quantifiable impact metrics.
- **Personalized Career Roadmap:** Multi-phase structured 12-week learning roadmaps tailored to current skills and dream role.
- **Interactive AI Mock Interview:** Practice real role-specific questions with instant AI scoring (technical accuracy, clarity, completeness, strengths, and model answer).
- **Mock Interview History:** Full progression tracking over time saved in MongoDB Atlas.
- **Saved Opportunities:** 1-Click bookmarking to review openings later.
- **In-App Notifications:** Real-time updates on application status changes, interview appointments, and job alerts.

### 🏢 Intelligent Recruiter Command Center
- **Bulk Resume Upload & Ranking:** Concurrently ingest dozens of `.pdf` and `.docx` resumes with automated scoring and auto-shortlist badges.
- **Side-by-Side Candidate Comparison:** Compare up to 3 candidates simultaneously across match scores, skills, and experience.
- **Recruitment Analytics & Funnel:** Monitor conversion rates, time-to-hire, skill distribution, and match score histograms.
- **CSV & Report Exports:** 1-Click download of complete recruitment reports formatted for Excel and executive review.
- **Automated Selection Email Modal:** Dispatch official offer and next-step credentials with audit tracking.

---

## 🧪 Automated Testing

Run the automated test suite verifying AI scoring, ATS diagnostics, career roadmap synthesis, and interview evaluation:
```bash
cd backend
python tests/test_v2_features.py
```

---

## 🛠️ API Endpoints Overview

| Category | Method & Route | Purpose |
| :--- | :--- | :--- |
| **Auth** | `POST /api/auth/register` | Register new user (candidate or recruiter) |
| | `POST /api/auth/login` | Login with JWT token |
| | `GET /api/auth/me` | Current authenticated user profile |
| **Jobs** | `GET /api/jobs` | Search & list jobs with filters |
| | `GET /api/jobs/{id}` | Get specific job details |
| | `POST /api/jobs` | Post new job opening |
| | `PUT /api/jobs/{id}` | Update job spec |
| | `DELETE /api/jobs/{id}` | Archive or delete job |
| **Applications** | `GET /api/applications` | List applications by candidate or job |
| | `POST /api/applications` | Submit application with AI match scoring |
| | `PATCH /api/applications/{id}/status` | Update candidate pipeline stage |
| **Interviews** | `GET /api/interviews` | List scheduled interviews |
| | `POST /api/interviews` | Schedule an interview round |
| | `PATCH /api/interviews/{id}` | Update interview details |
| **AI Engine** | `POST /api/ai/match-resume` | Semantic resume match & ATS diagnostics |
| | `POST /api/ai/generate-job-description`| Generate full job description |
| | `POST /api/ai/interview-prep` | Generate tailored interview questions |
| **Analytics** | `GET /api/analytics/stats` | Pipeline metrics & average match rating |
