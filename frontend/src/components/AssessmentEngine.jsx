import React, { useState, useEffect, useRef } from "react";
import { api } from "../services/api";

export default function AssessmentEngine({ assessmentId = "asmt-aptitude-01", onFinish, onCancel }) {
  const [assessment, setAssessment] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scoreReport, setScoreReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const timerRef = useRef(null);

  // Load Assessment & Start Attempt Session
  useEffect(() => {
    async function loadAssessment() {
      try {
        setLoading(true);
        setError("");
        const details = await api.getAssessmentDetails(assessmentId);
        setAssessment(details);

        // Start session
        const startRes = await api.startAssessment(assessmentId);
        setAttemptId(startRes.attempt_id);
        setTimeLeft(startRes.duration_seconds || details.duration_minutes * 60);

        // Initialize empty answers
        const initialAnswers = {};
        details.questions.forEach((q) => {
          initialAnswers[q.id] = q.type === "coding" ? (q.starter_code || "") : null;
        });
        setAnswers(initialAnswers);
      } catch (err) {
        setError(err.message || "Failed to load assessment.");
      } finally {
        setLoading(false);
      }
    }

    loadAssessment();
  }, [assessmentId]);

  // Countdown Timer
  useEffect(() => {
    if (timeLeft <= 0 && attemptId && !scoreReport && !loading) {
      // Auto-submit when time expires
      handleSubmitAssessment();
      return;
    }

    if (timeLeft > 0 && !scoreReport) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, attemptId, scoreReport, loading]);

  const handleSelectOption = (qid, optionIdx) => {
    setAnswers((prev) => ({ ...prev, [qid]: optionIdx }));
  };

  const handleCodeChange = (qid, codeText) => {
    setAnswers((prev) => ({ ...prev, [qid]: codeText }));
  };

  const handleSubmitAssessment = async () => {
    if (isSubmitting || scoreReport) return;
    try {
      setIsSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);

      const res = await api.submitAssessment(assessmentId, {
        attempt_id: attemptId,
        answers: answers
      });
      setScoreReport(res);
    } catch (err) {
      setError(err.message || "Error submitting assessment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
        <div className="talentai-spin" style={{ width: "28px", height: "28px", border: "3px solid #3157D5", borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 16px" }}></div>
        <p>Initializing secure online assessment session...</p>
      </div>
    );
  }

  if (error && !scoreReport) {
    return (
      <div style={{ padding: "30px", background: "#fef2f2", border: "1px solid #f87171", borderRadius: "12px", color: "#991b1b" }}>
        <h4>Error loading assessment</h4>
        <p>{error}</p>
        <button onClick={onCancel} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>
          Go Back
        </button>
      </div>
    );
  }

  // Final Results Scorecard View
  if (scoreReport) {
    return (
      <div style={{
        background: "#ffffff",
        borderRadius: "16px",
        padding: "32px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        border: "1px solid #e2e8f0",
        maxWidth: "800px",
        margin: "0 auto"
      }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: scoreReport.passed ? "#ecfdf5" : "#fef2f2",
            color: scoreReport.passed ? "#10b981" : "#ef4444",
            fontSize: "36px",
            marginBottom: "16px"
          }}>
            {scoreReport.passed ? "🏆" : "📝"}
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "0 0 8px" }}>
            {scoreReport.passed ? "Assessment Passed!" : "Assessment Completed"}
          </h2>
          <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>
            {scoreReport.verdict}
          </p>
        </div>

        {/* Score Metric Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginBottom: "32px"
        }}>
          <div style={{ padding: "18px", background: "#F5F7FC", borderRadius: "12px", textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>YOUR SCORE</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: scoreReport.passed ? "#10b981" : "#ef4444", marginTop: "4px" }}>
              {scoreReport.score}%
            </div>
          </div>
          <div style={{ padding: "18px", background: "#F5F7FC", borderRadius: "12px", textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>PASSING THRESHOLD</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
              {scoreReport.passing_score}%
            </div>
          </div>
          <div style={{ padding: "18px", background: "#F5F7FC", borderRadius: "12px", textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>FINAL STATUS</div>
            <div style={{
              fontSize: "16px",
              fontWeight: "700",
              color: scoreReport.passed ? "#10b981" : "#ef4444",
              marginTop: "10px",
              textTransform: "uppercase"
            }}>
              {scoreReport.passed ? "Qualified" : "Review Needed"}
            </div>
          </div>
        </div>

        {/* Question-by-Question Breakdown */}
        <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>
          Question Breakdown & Verified Explanations
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px" }}>
          {scoreReport.results?.map((r, idx) => (
            <div key={idx} style={{
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "16px",
              background: r.is_correct || r.status === "Accepted" ? "#f8fafc" : "#fff5f5"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontWeight: "700", fontSize: "14px", color: "#1e293b" }}>
                  Question {idx + 1}: {r.question || r.title}
                </span>
                <span style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: r.is_correct || r.status === "Accepted" ? "#dcfce7" : "#fee2e2",
                  color: r.is_correct || r.status === "Accepted" ? "#166534" : "#991b1b"
                }}>
                  {r.points_awarded > 0 ? `+${r.points_awarded} pts` : "0 pts"}
                </span>
              </div>

              {r.type === "mcq" && (
                <div style={{ fontSize: "13px", color: "#475569" }}>
                  <div><strong>Your Answer:</strong> Option {r.user_answer !== null ? r.user_answer + 1 : "None"}</div>
                  <div><strong>Correct Answer:</strong> Option {r.correct_option + 1}</div>
                  {r.explanation && (
                    <div style={{ marginTop: "6px", padding: "8px", background: "#f1f5f9", borderRadius: "6px", color: "#334155" }}>
                      💡 <em>{r.explanation}</em>
                    </div>
                  )}
                </div>
              )}

              {r.type === "coding" && (
                <div style={{ fontSize: "13px", color: "#475569" }}>
                  <div><strong>Status:</strong> {r.status}</div>
                  <div style={{ color: "#3b82f6", marginTop: "4px" }}>{r.feedback}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onFinish}
          style={{
            width: "100%",
            background: "#3157D5",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "14px",
            fontWeight: "700",
            fontSize: "15px",
            cursor: "pointer"
          }}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentQ = assessment.questions[currentIdx];
  const isLastQuestion = currentIdx === assessment.questions.length - 1;

  return (
    <div style={{
      background: "#ffffff",
      borderRadius: "16px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
      border: "1px solid #e2e8f0",
      maxWidth: "840px",
      margin: "0 auto",
      overflow: "hidden"
    }}>
      {/* Test Header */}
      <div style={{
        padding: "18px 24px",
        background: "#172554",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div>
          <h2 style={{ fontSize: "17px", fontWeight: "700", margin: 0 }}>
            {assessment.title}
          </h2>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
            Question {currentIdx + 1} of {assessment.questions.length} • {assessment.category?.toUpperCase()}
          </span>
        </div>

        {/* Live Countdown Badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: timeLeft < 180 ? "rgba(239, 68, 68, 0.3)" : "rgba(255, 255, 255, 0.12)",
          border: `1px solid ${timeLeft < 180 ? "#ef4444" : "rgba(255, 255, 255, 0.2)"}`,
          padding: "8px 16px",
          borderRadius: "20px",
          fontWeight: "800",
          fontSize: "14px",
          color: timeLeft < 180 ? "#fca5a5" : "#60a5fa"
        }}>
          <span>⏱️</span>
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Question Body */}
      <div style={{ padding: "32px 28px" }}>
        {currentQ.type === "mcq" && (
          <div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "20px", lineHeight: "1.5" }}>
              {currentQ.question}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {currentQ.options?.map((opt, oIdx) => {
                const isSelected = answers[currentQ.id] === oIdx;
                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(currentQ.id, oIdx)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "14px 18px",
                      borderRadius: "10px",
                      border: isSelected ? "2px solid #3157D5" : "1px solid #e2e8f0",
                      background: isSelected ? "#eff6ff" : "#ffffff",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "14px",
                      color: isSelected ? "#1e40af" : "#334155",
                      fontWeight: isSelected ? "600" : "400",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <span style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      border: isSelected ? "2px solid #3157D5" : "2px solid #cbd5e1",
                      background: isSelected ? "#3157D5" : "#ffffff",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: "700"
                    }}>
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {currentQ.type === "coding" && (
          <div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
              {currentQ.title}
            </div>
            <p style={{ color: "#475569", fontSize: "14px", marginBottom: "16px", lineHeight: "1.5" }}>
              {currentQ.problem_statement}
            </p>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "6px" }}>
                SAMPLE TEST CASES:
              </div>
              {currentQ.test_cases?.map((tc, tcIdx) => (
                <div key={tcIdx} style={{ fontSize: "12px", background: "#f8fafc", padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", marginBottom: "4px" }}>
                  <code>Input: {tc.input} ➔ Output: {tc.expected}</code>
                </div>
              ))}
            </div>

            <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "6px" }}>
              PYTHON SOLUTION EDITOR:
            </div>
            <textarea
              rows={12}
              value={answers[currentQ.id] || ""}
              onChange={(e) => handleCodeChange(currentQ.id, e.target.value)}
              style={{
                width: "100%",
                fontFamily: "monospace",
                fontSize: "13px",
                background: "#0f172a",
                color: "#38bdf8",
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid #334155",
                outline: "none",
                lineHeight: "1.5"
              }}
            />
          </div>
        )}
      </div>

      {/* Footer Navigation Bar */}
      <div style={{
        padding: "18px 24px",
        background: "#F5F7FC",
        borderTop: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <button
          onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
          disabled={currentIdx === 0}
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            color: currentIdx === 0 ? "#94a3b8" : "#334155",
            borderRadius: "8px",
            padding: "10px 18px",
            fontWeight: "600",
            fontSize: "13px",
            cursor: currentIdx === 0 ? "not-allowed" : "pointer"
          }}
        >
          ← Previous
        </button>

        <div style={{ display: "flex", gap: "8px" }}>
          {assessment.questions.map((_, dotIdx) => (
            <span
              key={dotIdx}
              onClick={() => setCurrentIdx(dotIdx)}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: currentIdx === dotIdx ? "#3157D5" : (answers[assessment.questions[dotIdx].id] !== null ? "#dbeafe" : "#e2e8f0"),
                color: currentIdx === dotIdx ? "#fff" : "#334155",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              {dotIdx + 1}
            </span>
          ))}
        </div>

        {isLastQuestion ? (
          <button
            onClick={handleSubmitAssessment}
            disabled={isSubmitting}
            style={{
              background: "#10b981",
              border: "none",
              color: "#ffffff",
              borderRadius: "8px",
              padding: "10px 22px",
              fontWeight: "700",
              fontSize: "14px",
              cursor: isSubmitting ? "wait" : "pointer"
            }}
          >
            {isSubmitting ? "Grading..." : "Submit Test ➔"}
          </button>
        ) : (
          <button
            onClick={() => setCurrentIdx((prev) => Math.min(assessment.questions.length - 1, prev + 1))}
            style={{
              background: "#3157D5",
              border: "none",
              color: "#ffffff",
              borderRadius: "8px",
              padding: "10px 22px",
              fontWeight: "700",
              fontSize: "14px",
              cursor: "pointer"
            }}
          >
            Next Question →
          </button>
        )}
      </div>
    </div>
  );
}
