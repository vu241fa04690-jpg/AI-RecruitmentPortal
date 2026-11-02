import unittest
import asyncio
import os
import sys

# Ensure backend root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.ai_service import (
    analyze_resume_ats,
    generate_career_roadmap,
    evaluate_interview_answer,
    calculate_resume_match
)


class TestAIEngineV2(unittest.TestCase):

    def test_ats_analysis_quality(self):
        sample_resume = """
        Sumii - Software Engineer
        Email: sumii@example.com | Phone: +1 555-0192 | Location: Bengaluru
        Professional Summary:
        Experienced Full-Stack Engineer with 3+ years architecting scalable microservices using FastAPI and React.
        Technical Skills:
        Python, FastAPI, React, Docker, MongoDB, TypeScript, Redis
        Work Experience:
        Software Engineer at CognitiveFlow Labs (2024 - Present):
        - Architected distributed RESTful APIs using FastAPI and MongoDB Atlas.
        - Reduced 99th percentile query latency by 45% using compound indexing.
        - Scaled service to handle 50,000 requests per minute with zero downtime.
        Education:
        B.Tech in Computer Science from National Institute of Technology (2025).
        Projects & Certifications:
        AWS Certified Cloud Practitioner. Built AI Recruitment Portal.
        """

        result = analyze_resume_ats(
            resume_text=sample_resume,
            target_role="Full-Stack Engineer",
            required_skills=["Python", "FastAPI", "React", "Docker", "MongoDB"]
        )

        self.assertIn("ats_score", result)
        self.assertGreaterEqual(result["ats_score"], 80)
        self.assertEqual(result["section_score"], 100)
        self.assertGreater(result["impact_metric_score"], 50)
        self.assertTrue(len(result["detected_action_verbs"]) >= 3)
        self.assertEqual(result["ats_status"], "Highly ATS Compatible")

    def test_career_roadmap_generation(self):
        current_skills = ["Python", "FastAPI", "React"]
        target_role = "Senior AI & Machine Learning Engineer"

        roadmap = generate_career_roadmap(current_skills, target_role)

        self.assertEqual(roadmap["target_role"], target_role)
        self.assertIn("milestones", roadmap)
        self.assertEqual(len(roadmap["milestones"]), 4)
        self.assertGreater(roadmap["progress_percentage"], 0)
        for m in roadmap["milestones"]:
            self.assertIn("phase", m)
            self.assertIn("skills", m)
            self.assertIn("recommended_project", m)

    def test_mock_interview_evaluation(self):
        question = "How do you handle database connection pooling and query latency in FastAPI?"
        candidate_answer = (
            "In our FastAPI services, we configure Motor and AsyncIOMotorClient with an optimal connection pool "
            "(min_pool_size=10, max_pool_size=100) to avoid socket exhaustion. We also implement compound indexing "
            "on frequently filtered query fields, and cache read-heavy endpoints in Redis. Because of this architecture, "
            "we reduced our p99 database response time by 45% and scaled to 10k RPS without dropped connections."
        )

        evaluation = evaluate_interview_answer(
            question=question,
            candidate_answer=candidate_answer,
            job_role="Backend Engineer",
            round_type="Technical"
        )

        self.assertGreaterEqual(evaluation["score"], 80)
        self.assertGreaterEqual(evaluation["technical_accuracy"], 75)
        self.assertIn("verdict", evaluation)
        self.assertGreater(len(evaluation["strengths"]), 0)
        self.assertIn("model_answer", evaluation)

    def test_semantic_resume_matching(self):
        resume_text = "Proficient in Python, FastAPI, Docker, and MongoDB with 3 years of building REST APIs."
        job_skills = ["Python", "FastAPI", "Docker", "MongoDB", "Kubernetes"]

        match_res = calculate_resume_match(
            resume_text=resume_text,
            job_skills=job_skills,
            candidate_skills=["Python", "FastAPI"]
        )

        self.assertIn("Python", match_res["matched_skills"])
        self.assertIn("FastAPI", match_res["matched_skills"])
        self.assertIn("MongoDB", match_res["matched_skills"])
        self.assertIn("Kubernetes", match_res["missing_skills"])
        self.assertGreaterEqual(match_res["match_score"], 70)


if __name__ == "__main__":
    unittest.main()

