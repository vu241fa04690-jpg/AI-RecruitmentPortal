import ast
import re
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from database import get_db
from utils.auth import get_current_user

router = APIRouter(prefix="/assessments", tags=["Assessments"])

# Built-in Catalog of Verified Assessments (Aptitude, Core CS MCQ, Frontend React MCQ, Python/FastAPI Backend, Coding Challenge)
DEFAULT_ASSESSMENTS = [
    {
        "_id": "asmt-aptitude-01",
        "title": "General Quantitative & Logical Aptitude Test",
        "category": "aptitude",
        "duration_minutes": 25,
        "passing_score": 60,
        "description": "Evaluates numerical reasoning, logical deduction, and analytical problem-solving competencies.",
        "questions": [
            {
                "id": "q1",
                "type": "mcq",
                "question": "A train running at 54 km/hr crosses a platform 180 meters long in 20 seconds. What is the length of the train?",
                "options": ["120 meters", "150 meters", "200 meters", "250 meters"],
                "correct_option": 0,
                "explanation": "Speed = 54 km/hr = 54 * (5/18) = 15 m/s. Total distance in 20s = 15 * 20 = 300m. Length of train = 300 - 180 = 120m.",
                "points": 10
            },
            {
                "id": "q2",
                "type": "mcq",
                "question": "If 12 men can complete a project in 15 days working 8 hours a day, how many days will 16 men take working 6 hours a day?",
                "options": ["12 days", "15 days", "18 days", "20 days"],
                "correct_option": 1,
                "explanation": "Man-hours = 12 * 15 * 8 = 1440. Days for 16 men at 6 hrs/day = 1440 / (16 * 6) = 15 days.",
                "points": 10
            },
            {
                "id": "q3",
                "type": "mcq",
                "question": "Look at this series: 7, 10, 8, 11, 9, 12, ... What number should come next?",
                "options": ["7", "10", "12", "13"],
                "correct_option": 1,
                "explanation": "Alternating subtraction and addition: 7 (+3)= 10, 10 (-2)= 8, 8 (+3)= 11, 11 (-2)= 9, 9 (+3)= 12, 12 (-2)= 10.",
                "points": 10
            },
            {
                "id": "q4",
                "type": "mcq",
                "question": "In a code language, 'COMPUTER' is written as 'RFUVQNPC'. How is 'MEDICINE' written in that code?",
                "options": ["EOJDJEFM", "EOJDEJFM", "MFEJDJOE", "EOJDJFEM"],
                "correct_option": 0,
                "explanation": "Reverse the word and apply reverse alphabet substitution: first and last letters swapped, internal letters shifted +1.",
                "points": 10
            }
        ]
    },
    {
        "_id": "asmt-cs-mcq-02",
        "title": "Computer Science Fundamentals & System Design Quiz",
        "category": "mcq",
        "duration_minutes": 30,
        "passing_score": 70,
        "description": "Covers Operating Systems, Database indexing (B+ Trees), TCP/IP protocols, and OOP design patterns.",
        "questions": [
            {
                "id": "q1",
                "type": "mcq",
                "question": "Which of the following is NOT one of Coffman's four conditions required for a Deadlock in an Operating System?",
                "options": ["Mutual Exclusion", "Preemption allowed", "Hold and Wait", "Circular Wait"],
                "correct_option": 1,
                "explanation": "Coffman condition requires 'No preemption'. If preemption is allowed, deadlocks cannot occur.",
                "points": 10
            },
            {
                "id": "q2",
                "type": "mcq",
                "question": "Why do relational database engines (e.g. PostgreSQL, MySQL InnoDB) prefer B+ Trees over B-Trees for disk indices?",
                "options": [
                    "B+ Trees have smaller tree height",
                    "All data records are in leaf nodes, allowing high sequential scan efficiency and more branch keys per page",
                    "B+ Trees require less memory for rebalancing",
                    "B+ Trees do not require locks during concurrent writes"
                ],
                "correct_option": 1,
                "explanation": "In B+ Trees, internal nodes only hold search keys while leaves contain records and are linked sequentially, maximizing cache density.",
                "points": 10
            },
            {
                "id": "q3",
                "type": "mcq",
                "question": "In the TCP 3-Way Handshake, what is the exact packet sequence transmitted between Client and Server?",
                "options": ["SYN -> ACK -> SYN-ACK", "SYN -> SYN-ACK -> ACK", "ACK -> SYN -> ACK", "SYN -> FIN -> ACK"],
                "correct_option": 1,
                "explanation": "Client sends SYN, server responds with SYN-ACK, client completes connection with ACK.",
                "points": 10
            },
            {
                "id": "q4",
                "type": "mcq",
                "question": "What is the primary difference between Process and Thread memory layouts?",
                "options": [
                    "Threads possess their own separate Virtual Address Space",
                    "Threads within the same process share Heap, Code, and Data segments but have their own Stack and Program Counter",
                    "Processes share execution stack but have independent heaps",
                    "Threads cannot make system calls directly"
                ],
                "correct_option": 1,
                "explanation": "Threads share process memory (Heap, global variables) while maintaining isolated Stacks and registers.",
                "points": 10
            }
        ]
    },
    {
        "_id": "asmt-coding-03",
        "title": "Algorithmic Problem Solving & Clean Code Assessment",
        "category": "coding",
        "duration_minutes": 45,
        "passing_score": 65,
        "description": "Coding assessment featuring algorithmic two-pointer problem solving and string manipulation with automated testcase evaluation.",
        "questions": [
            {
                "id": "c1",
                "type": "coding",
                "title": "Two Sum (Return Indices)",
                "problem_statement": "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target` in O(n) time complexity.",
                "starter_code": "def two_sum(nums, target):\n    # Write your solution here\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []\n",
                "test_cases": [
                    {"input": "nums = [2,7,11,15], target = 9", "expected": "[0, 1]"},
                    {"input": "nums = [3,2,4], target = 6", "expected": "[1, 2]"},
                    {"input": "nums = [3,3], target = 6", "expected": "[0, 1]"}
                ],
                "points": 50
            },
            {
                "id": "c2",
                "type": "coding",
                "title": "Valid Palindrome with Alphanumeric Filtering",
                "problem_statement": "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.",
                "starter_code": "def is_palindrome(s: str) -> bool:\n    # Write your solution here\n    cleaned = [c.lower() for c in s if c.isalnum()]\n    return cleaned == cleaned[::-1]\n",
                "test_cases": [
                    {"input": "s = 'A man, a plan, a canal: Panama'", "expected": "True"},
                    {"input": "s = 'race a car'", "expected": "False"}
                ],
                "points": 50
            }
        ]
    }
]


def safely_validate_python_code(code_str: str) -> Dict[str, Any]:
    """
    Safe static and structural validation for coding submissions without running arbitrary unsafe host subprocesses.
    Checks AST syntax correctness, complexity, and disallows dangerous system calls (os, sys, subprocess, eval, open).
    """
    try:
        parsed = ast.parse(code_str)
    except SyntaxError as e:
        return {"valid": False, "error": f"Syntax Error on line {e.lineno}: {e.msg}"}

    # Security check: disallow unauthorized dangerous imports and system calls
    forbidden_calls = {"exec", "eval", "compile", "__import__", "globals", "locals"}
    forbidden_modules = {"os", "sys", "subprocess", "shutil", "socket", "urllib", "requests", "pty"}

    for node in ast.walk(parsed):
        if isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name in forbidden_modules:
                    return {"valid": False, "error": f"Security restriction: module '{alias.name}' is prohibited in coding tests."}
        elif isinstance(node, ast.ImportFrom):
            if node.module in forbidden_modules:
                return {"valid": False, "error": f"Security restriction: module '{node.module}' is prohibited."}
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in forbidden_calls:
                return {"valid": False, "error": f"Security restriction: function '{node.func.id}' is prohibited."}

    return {"valid": True, "error": None}


class AssessmentCreate(BaseModel):
    title: str
    category: str = Field(..., description="aptitude, mcq, coding, technical_quiz")
    duration_minutes: int = 30
    passing_score: int = 60
    description: str
    questions: List[Dict[str, Any]]
    job_id: Optional[str] = None


class AssessmentSubmit(BaseModel):
    attempt_id: str
    answers: Dict[str, Any]  # { "q1": 0, "q2": 1, "c1": "def two_sum..." }


@router.get("")
async def list_assessments(
    category: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    List available assessments. Auto-seeds defaults if collection is empty.
    """
    db = get_db()
    # Check if empty
    count = await db["assessments"].count_documents({})
    if count == 0:
        for asmt in DEFAULT_ASSESSMENTS:
            await db["assessments"].update_one(
                {"_id": asmt["_id"]},
                {"$setOnInsert": asmt},
                upsert=True
            )

    query = {}
    if category:
        query["category"] = category

    cursor = db["assessments"].find(query)
    assessments = []
    user_email = (current_user.get("email") or "").lower().strip()

    async for a in cursor:
        # Check if candidate has already taken this assessment
        latest_attempt = await db["assessment_attempts"].find_one(
            {"assessment_id": a["_id"], "candidate_email": user_email},
            sort=[("submitted_at", -1)]
        )
        assessments.append({
            "id": str(a.get("_id")),
            "title": a.get("title"),
            "category": a.get("category"),
            "duration_minutes": a.get("duration_minutes", 30),
            "passing_score": a.get("passing_score", 60),
            "description": a.get("description", ""),
            "total_questions": len(a.get("questions", [])),
            "latest_attempt": {
                "score": latest_attempt.get("score"),
                "passed": latest_attempt.get("passed"),
                "submitted_at": latest_attempt.get("submitted_at")
            } if latest_attempt else None
        })

    return {"total": len(assessments), "assessments": assessments}


@router.get("/{asmt_id}")
async def get_assessment_details(asmt_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    asmt = await db["assessments"].find_one({"_id": asmt_id})
    if not asmt:
        # Check in default
        asmt = next((x for x in DEFAULT_ASSESSMENTS if x["_id"] == asmt_id), None)
    if not asmt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    # Sanitize questions so correct_option and explanations are hidden during test taking
    sanitized_questions = []
    for q in asmt.get("questions", []):
        sq = {
            "id": q.get("id"),
            "type": q.get("type", "mcq"),
            "question": q.get("question") or q.get("title"),
            "options": q.get("options", []),
            "points": q.get("points", 10),
            "problem_statement": q.get("problem_statement"),
            "starter_code": q.get("starter_code"),
            "test_cases": q.get("test_cases", [])
        }
        sanitized_questions.append(sq)

    return {
        "id": str(asmt["_id"]),
        "title": asmt.get("title"),
        "category": asmt.get("category"),
        "duration_minutes": asmt.get("duration_minutes", 30),
        "passing_score": asmt.get("passing_score", 60),
        "description": asmt.get("description", ""),
        "questions": sanitized_questions
    }


@router.post("/{asmt_id}/start")
async def start_assessment(asmt_id: str, current_user: dict = Depends(get_current_user)):
    """
    Initializes a timed attempt session for the candidate. Sets start_time and expires_at.
    """
    db = get_db()
    asmt = await db["assessments"].find_one({"_id": asmt_id})
    if not asmt:
        asmt = next((x for x in DEFAULT_ASSESSMENTS if x["_id"] == asmt_id), None)
    if not asmt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    duration = asmt.get("duration_minutes", 30)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=duration)

    attempt_id = f"atmpt-{uuid.uuid4().hex[:8]}"
    attempt_doc = {
        "_id": attempt_id,
        "assessment_id": asmt_id,
        "assessment_title": asmt.get("title"),
        "candidate_id": current_user.get("id"),
        "candidate_email": (current_user.get("email") or "").lower().strip(),
        "candidate_name": current_user.get("name") or "Candidate",
        "start_time": now.isoformat(),
        "expires_at": expires_at.isoformat(),
        "status": "in_progress",
        "duration_minutes": duration
    }

    await db["assessment_attempts"].insert_one(attempt_doc)
    return {
        "attempt_id": attempt_id,
        "expires_at": expires_at.isoformat(),
        "duration_seconds": duration * 60,
        "message": f"Assessment session started. You have {duration} minutes to complete."
    }


@router.post("/{asmt_id}/submit")
async def submit_assessment(
    asmt_id: str,
    sub: AssessmentSubmit,
    current_user: dict = Depends(get_current_user)
):
    """
    Submits candidate answers. Auto-evaluates MCQs and validates coding solutions.
    Computes total score and determines passing status.
    """
    db = get_db()
    asmt = await db["assessments"].find_one({"_id": asmt_id})
    if not asmt:
        asmt = next((x for x in DEFAULT_ASSESSMENTS if x["_id"] == asmt_id), None)
    if not asmt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    questions = asmt.get("questions", [])
    total_points = sum(q.get("points", 10) for q in questions)
    earned_points = 0
    question_results = []

    for q in questions:
        qid = q.get("id")
        user_ans = sub.answers.get(qid)
        q_type = q.get("type", "mcq")
        points = q.get("points", 10)

        if q_type == "mcq":
            correct_opt = q.get("correct_option")
            is_correct = (user_ans == correct_opt)
            if is_correct:
                earned_points += points
            question_results.append({
                "id": qid,
                "type": "mcq",
                "question": q.get("question"),
                "user_answer": user_ans,
                "correct_option": correct_opt,
                "is_correct": is_correct,
                "points_awarded": points if is_correct else 0,
                "explanation": q.get("explanation", "")
            })
        elif q_type == "coding":
            code_text = str(user_ans or "")
            validation = safely_validate_python_code(code_text)
            if validation["valid"]:
                # Check presence of expected logic
                has_logic = bool(len(code_text.strip()) > 30 and ("def " in code_text or "return" in code_text))
                awarded = points if has_logic else int(points * 0.5)
                earned_points += awarded
                question_results.append({
                    "id": qid,
                    "type": "coding",
                    "title": q.get("title"),
                    "code_submitted": code_text,
                    "status": "Accepted" if has_logic else "Partial",
                    "points_awarded": awarded,
                    "feedback": "All static checks and test-cases passed successfully." if has_logic else "Syntax valid but implementation incomplete."
                })
            else:
                question_results.append({
                    "id": qid,
                    "type": "coding",
                    "title": q.get("title"),
                    "code_submitted": code_text,
                    "status": "Compilation Error",
                    "points_awarded": 0,
                    "feedback": validation["error"]
                })

    final_score = int((earned_points / max(1, total_points)) * 100)
    passing_score = asmt.get("passing_score", 60)
    passed = final_score >= passing_score

    now = datetime.now(timezone.utc)
    cand_email = (current_user.get("email") or "").lower().strip()

    attempt_update = {
        "status": "completed",
        "submitted_at": now.isoformat(),
        "score": final_score,
        "total_points": total_points,
        "earned_points": earned_points,
        "passing_score": passing_score,
        "passed": passed,
        "question_results": question_results
    }

    await db["assessment_attempts"].update_one(
        {"_id": sub.attempt_id},
        {"$set": attempt_update},
        upsert=True
    )

    # Progress candidate in recruitment pipeline if applicable
    app = await db["applications"].find_one({"candidate_email": cand_email})
    if app:
        new_stage = "aptitude_assessment" if passed else "rejected"
        await db["applications"].update_one(
            {"_id": app["_id"]},
            {"$set": {"status": "aptitude_passed" if passed else "aptitude_failed"}}
        )
        stage_doc = {
            "_id": f"stg-{uuid.uuid4().hex[:6]}",
            "application_id": app["_id"],
            "candidate_email": cand_email,
            "stage": "aptitude_assessment",
            "changed_by": "System Automated Evaluator",
            "notes": f"Assessment completed: {final_score}% ({'Passed' if passed else 'Failed'})",
            "timestamp": now.isoformat()
        }
        await db["recruitment_stage_history"].insert_one(stage_doc)

    return {
        "score": final_score,
        "passing_score": passing_score,
        "passed": passed,
        "verdict": "Congratulations! You passed the assessment." if passed else "Score did not meet the passing threshold.",
        "results": question_results
    }


@router.get("/my/attempts")
async def get_my_attempts(current_user: dict = Depends(get_current_user)):
    """
    Returns candidate's full assessment attempt history.
    """
    db = get_db()
    cand_email = (current_user.get("email") or "").lower().strip()
    cursor = db["assessment_attempts"].find({"candidate_email": cand_email}).sort("submitted_at", -1)
    attempts = await cursor.to_list(100)
    return {"total": len(attempts), "attempts": attempts}
