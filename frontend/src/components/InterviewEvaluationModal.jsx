import React, { useState } from "react";
import { api } from "../services/api";

export default function InterviewEvaluationModal({ interview, onClose, onEvaluated }) {
  const [tech, setTech] = useState(8);
  const [comm, setComm] = useState(8);
  const [problemSolving, setProblemSolving] = useState(7);
  const [practical, setPractical] = useState(8);
  const [projectExp, setProjectExp] = useState(8);
  const [suitability, setSuitability] = useState(8);

  const [strengths, setStrengths] = useState(["FastAPI Architecture", "Async Execution Patterns", "Database Design"]);
  const [newStrength, setNewStrength] = useState("");
  const [weaknesses, setWeaknesses] = useState(["Needs more distributed tracing familiarity"]);
  const [newWeakness, setNewWeakness] = useState("");

  const [comments, setComments] = useState("Candidate demonstrated strong conceptual depth in backend scaling and clean modular code design. Recommended to advance to executive round.");
  const [recommendation, setRecommendation] = useState("next_round"); // 'next_round' | 'selected' | 'rejected'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const compositeScore = Math.round(((tech + comm + problemSolving + practical + projectExp + suitability) / 60) * 100);

  const handleAddStrength = () => {
    if (newStrength.trim()) {
      setStrengths([...strengths, newStrength.trim()]);
      setNewStrength("");
    }
  };

  const handleAddWeakness = () => {
    if (newWeakness.trim()) {
      setWeaknesses([...weaknesses, newWeakness.trim()]);
      setNewWeakness("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      await api.evaluateInterview(interview.id || interview._id, {
        technical_knowledge: tech,
        communication_skills: comm,
        problem_solving: problemSolving,
        practical_knowledge: practical,
        project_explanation: projectExp,
        role_suitability: suitability,
        strengths,
        weaknesses,
        detailed_comments: comments,
        recommendation
      });
      alert("Standardized interview evaluation successfully submitted!");
      if (onEvaluated) onEvaluated();
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || "Failed to submit evaluation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(15, 23, 42, 0.7)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 99999
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: "20px",
        width: "680px",
        maxWidth: "92vw",
        maxHeight: "90vh",
        overflowY: "auto",
        padding: "32px",
        boxShadow: "0 25px 60px rgba(0,0,0,0.25)"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <span style={{ background: "#e0e7ff", color: "#3157D5", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>
              FORMAL EVALUATION RUBRIC
            </span>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: "6px 0 2px" }}>
              Evaluate Candidate: {interview.candidate_name}
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              {interview.round} • {interview.job_title}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", color: "#991b1b", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Composite Score Card */}
          <div style={{
            background: "linear-gradient(135deg, #172554, #3157D5)",
            color: "#ffffff",
            padding: "18px 24px",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", fontWeight: "600" }}>COMPOSITE INTERVIEW SCORE</div>
              <div style={{ fontSize: "32px", fontWeight: "800" }}>{compositeScore}%</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{
                background: compositeScore >= 75 ? "#10b981" : (compositeScore >= 60 ? "#f59e0b" : "#ef4444"),
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "700"
              }}>
                {compositeScore >= 75 ? "Strong Hire" : (compositeScore >= 60 ? "Consider" : "Needs Review")}
              </span>
            </div>
          </div>

          {/* 6 Standardized Criteria Sliders */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>
                <span>1. Technical Knowledge</span>
                <span style={{ color: "#3157D5" }}>{tech}/10</span>
              </div>
              <input type="range" min="1" max="10" value={tech} onChange={(e) => setTech(parseInt(e.target.value, 10))} style={{ width: "100%" }} />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>
                <span>2. Communication Skills</span>
                <span style={{ color: "#3157D5" }}>{comm}/10</span>
              </div>
              <input type="range" min="1" max="10" value={comm} onChange={(e) => setComm(parseInt(e.target.value, 10))} style={{ width: "100%" }} />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>
                <span>3. Problem Solving Ability</span>
                <span style={{ color: "#3157D5" }}>{problemSolving}/10</span>
              </div>
              <input type="range" min="1" max="10" value={problemSolving} onChange={(e) => setProblemSolving(parseInt(e.target.value, 10))} style={{ width: "100%" }} />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>
                <span>4. Practical Experience</span>
                <span style={{ color: "#3157D5" }}>{practical}/10</span>
              </div>
              <input type="range" min="1" max="10" value={practical} onChange={(e) => setPractical(parseInt(e.target.value, 10))} style={{ width: "100%" }} />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>
                <span>5. Project Explanation</span>
                <span style={{ color: "#3157D5" }}>{projectExp}/10</span>
              </div>
              <input type="range" min="1" max="10" value={projectExp} onChange={(e) => setProjectExp(parseInt(e.target.value, 10))} style={{ width: "100%" }} />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>
                <span>6. Role Suitability</span>
                <span style={{ color: "#3157D5" }}>{suitability}/10</span>
              </div>
              <input type="range" min="1" max="10" value={suitability} onChange={(e) => setSuitability(parseInt(e.target.value, 10))} style={{ width: "100%" }} />
            </div>
          </div>

          {/* Strengths & Weaknesses Tags */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>Key Strengths</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                {strengths.map((s, i) => (
                  <span key={i} style={{ background: "#ecfdf5", color: "#065f46", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "600" }}>
                    ✓ {s}
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  placeholder="Add strength..."
                  value={newStrength}
                  onChange={(e) => setNewStrength(e.target.value)}
                  style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
                <button type="button" onClick={handleAddStrength} style={{ background: "#3157D5", color: "#fff", border: "none", borderRadius: "6px", padding: "0 10px", fontSize: "12px", cursor: "pointer" }}>+</button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>Areas of Improvement</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                {weaknesses.map((w, i) => (
                  <span key={i} style={{ background: "#fef2f2", color: "#991b1b", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "600" }}>
                    • {w}
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  placeholder="Add area to improve..."
                  value={newWeakness}
                  onChange={(e) => setNewWeakness(e.target.value)}
                  style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
                <button type="button" onClick={handleAddWeakness} style={{ background: "#3157D5", color: "#fff", border: "none", borderRadius: "6px", padding: "0 10px", fontSize: "12px", cursor: "pointer" }}>+</button>
              </div>
            </div>
          </div>

          {/* Hiring Recommendation Radio Selection */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "8px" }}>
              Final Hiring Recommendation *
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setRecommendation("next_round")}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: recommendation === "next_round" ? "2px solid #3157D5" : "1px solid #cbd5e1",
                  background: recommendation === "next_round" ? "#eff6ff" : "#ffffff",
                  color: recommendation === "next_round" ? "#1e40af" : "#334155",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                ➔ Pass to Next Round
              </button>

              <button
                type="button"
                onClick={() => setRecommendation("selected")}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: recommendation === "selected" ? "2px solid #10b981" : "1px solid #cbd5e1",
                  background: recommendation === "selected" ? "#ecfdf5" : "#ffffff",
                  color: recommendation === "selected" ? "#065f46" : "#334155",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                🏆 Final Selection / Offer
              </button>

              <button
                type="button"
                onClick={() => setRecommendation("rejected")}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: recommendation === "rejected" ? "2px solid #ef4444" : "1px solid #cbd5e1",
                  background: recommendation === "rejected" ? "#fef2f2" : "#ffffff",
                  color: recommendation === "rejected" ? "#991b1b" : "#334155",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                ✕ Reject Application
              </button>
            </div>
          </div>

          {/* Detailed Comments */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
              Interviewer Synthesis & Executive Comments
            </label>
            <textarea
              rows={3}
              required
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{ background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", padding: "12px 20px", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ background: "#3157D5", color: "#fff", border: "none", borderRadius: "8px", padding: "12px 26px", fontWeight: "700", fontSize: "13px", cursor: submitting ? "wait" : "pointer" }}
            >
              {submitting ? "Submitting..." : "Submit Formal Evaluation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

