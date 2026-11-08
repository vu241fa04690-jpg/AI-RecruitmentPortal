import React, { useState, useEffect } from "react";
import {
  CalendarIcon,
  VideoIcon,
  ClockIcon,
  UsersIcon,
  CheckCircleIcon,
  SparklesIcon,
  AlertCircleIcon,
  BriefcaseIcon
} from "../components/Icons";
import { api, INITIAL_MOCK_INTERVIEWS } from "../services/api";

export default function InterviewsView({ user }) {
  const userEmail = (user?.email || "").toLowerCase().trim();
  const isCandidate = user?.role === "candidate" || !user?.role;

  const [interviews, setInterviews] = useState(() => {
    if (!user) return [];
    if (userEmail === "sumii@example.com") {
      return (INITIAL_MOCK_INTERVIEWS || []).filter(i => i.candidate_email?.toLowerCase() === "sumii@example.com");
    }
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  // Assessment Sandbox Modal State
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [assessmentCode, setAssessmentCode] = useState(
`// Function to find pair of IDs summing to target microservice load
function findTargetIndices(nums, target) {
  const seenMap = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seenMap.has(complement)) {
      return [seenMap.get(complement), i];
    }
    seenMap.set(nums[i], i);
  }
  return [];
}`
  );
  const [testResults, setTestResults] = useState(null);
  const [assessmentSubmitted, setAssessmentSubmitted] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(45 * 60);

  // Live Video Room Modal State
  const [activeVideoRoom, setActiveVideoRoom] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [whiteboardText, setWhiteboardText] = useState(`// Collaborative Notes & Architectural Diagram\nCandidate: ${user?.name || "Candidate"}\nFocus: FastAPI Concurrency, DB Connection Pool, Redis TTL`);
  const [videoSessionCompleted, setVideoSessionCompleted] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadInterviews = async () => {
      setLoading(true);
      try {
        const params = {};
        if (isCandidate && userEmail) {
          params.candidate_email = userEmail;
        }
        const data = await api.getInterviews(params);
        if (mounted) {
          if (Array.isArray(data)) {
            const userSpecific = isCandidate && userEmail
              ? data.filter(i => i.candidate_email && i.candidate_email.toLowerCase() === userEmail)
              : data;
            setInterviews(userSpecific);
          } else {
            setInterviews([]);
          }
        }
      } catch (err) {
        console.error("Failed to load interviews:", err);
        if (mounted) {
          if (userEmail === "sumii@example.com") {
            setInterviews((INITIAL_MOCK_INTERVIEWS || []).filter(i => i.candidate_email?.toLowerCase() === "sumii@example.com"));
          } else {
            setInterviews([]);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadInterviews();
    return () => { mounted = false; };
  }, [userEmail, isCandidate]);

  // Timer countdown for active assessment
  useEffect(() => {
    if (!activeAssessment || assessmentSubmitted) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeAssessment, assessmentSubmitted]);

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleRunTests = () => {
    setTestResults([
      { id: 1, name: "Test Case 1: [2, 7, 11, 15], target = 9", expected: "[0, 1]", output: "[0, 1]", passed: true },
      { id: 2, name: "Test Case 2: [3, 2, 4], target = 6", expected: "[1, 2]", output: "[1, 2]", passed: true },
      { id: 3, name: "Test Case 3: High-throughput 100,000 items (O(N) check)", expected: "< 15ms execution", output: "4.2ms execution", passed: true }
    ]);
  };

  const handleSubmitAssessment = (item) => {
    setAssessmentSubmitted(true);
    setInterviews(prev => prev.map(i => i.id === item.id ? { ...i, status: "completed", score: 96 } : i));
  };

  const filteredInterviews = interviews.filter(item => {
    if (activeCategory === "upcoming") return item.status !== "completed";
    if (activeCategory === "completed") return item.status === "completed";
    return true;
  });

  return (
    <div style={{ maxWidth: 1340, margin: "0 auto", padding: "28px 24px 60px" }}>
      {/* Top Banner (Unstop Navy Style) */}
      <div style={{
        background: "linear-gradient(135deg, #0f2b48 0%, #0066cc 60%, #00b4d8 100%)",
        borderRadius: 22,
        padding: "32px 36px",
        color: "#ffffff",
        marginBottom: 28,
        boxShadow: "0 14px 38px -6px rgba(0, 102, 204, 0.35)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(255, 255, 255, 0.2)",
            padding: "5px 14px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 800,
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            backdropFilter: "blur(6px)"
          }}>
            🎯 UNSTOP ASSESSMENT ROUNDS & SCREENING CENTER
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: -0.8, marginBottom: 8 }}>
            Multi-Round Technical Assessments & Live Screening
          </h1>
          <p style={{ color: "#dbeafe", fontSize: 15, maxWidth: 740, lineHeight: 1.5, margin: 0 }}>
            Take timed technical coding assessments, participate in live video screening with engineering leads, and track round evaluations in real-time.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 16,
        marginBottom: 26
      }}>
        <div className="card" style={{ padding: "18px 22px", background: "#ffffff", border: "1px solid #bfdbfe" }}>
          <div style={{ fontSize: 12, color: "#0066cc", fontWeight: 800, textTransform: "uppercase" }}>Scheduled Rounds</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#0f2b48", marginTop: 4 }}>{interviews.length} Confirmed</div>
          <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>Technical Assessments & 1-on-1s</div>
        </div>

        <div className="card" style={{ padding: "18px 22px", background: "#ffffff", border: "1px solid #bbf7d0" }}>
          <div style={{ fontSize: 12, color: "#059669", fontWeight: 800, textTransform: "uppercase" }}>Platform Readiness</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#065f46", marginTop: 4 }}>100% Ready</div>
          <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>Interactive Coding Sandbox & Video</div>
        </div>

        <div className="card" style={{ padding: "18px 22px", background: "#ffffff", border: "1px solid #fed7aa" }}>
          <div style={{ fontSize: 12, color: "#ea580c", fontWeight: 800, textTransform: "uppercase" }}>Candidate Profile</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#9a3412", marginTop: 4 }}>Sumii</div>
          <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>Verified Engineering Applicant</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        <button
          className={`filter-pill ${activeCategory === "all" ? "filter-pill-active" : ""}`}
          onClick={() => setActiveCategory("all")}
        >
          All Assessment Rounds ({interviews.length})
        </button>
        <button
          className={`filter-pill ${activeCategory === "upcoming" ? "filter-pill-active" : ""}`}
          onClick={() => setActiveCategory("upcoming")}
        >
          ⏱️ Active & Upcoming
        </button>
        <button
          className={`filter-pill ${activeCategory === "completed" ? "filter-pill-active" : ""}`}
          onClick={() => setActiveCategory("completed")}
        >
          ✓ Completed Rounds
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "#64748b" }}>Loading interview schedule...</div>
      ) : filteredInterviews.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px 24px" }}>
          <CalendarIcon size={40} color="#94a3b8" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1c4980", marginBottom: 8 }}>
            No Rounds Found Under Filter
          </h3>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            Switch back to "All Assessment Rounds" to view confirmed rounds.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 24 }}>
          {filteredInterviews.map((item) => {
            const isCompleted = item.status === "completed";
            const isCodingRound = item.round.toLowerCase().includes("coding") || item.round.toLowerCase().includes("assessment") || item.round.toLowerCase().includes("dsa");

            return (
              <div
                key={item.id}
                className="card card-hover"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  border: isCompleted ? "1.5px solid #86efac" : "1.5px solid #bfdbfe",
                  background: isCompleted ? "#f0fdf4" : "#ffffff",
                  padding: "24px",
                  borderRadius: 18
                }}
              >
                <div>
                  {/* Round Header & Status */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    {isCompleted ? (
                      <span className="badge badge-success" style={{ fontSize: 12, fontWeight: 800 }}>
                        ✓ Completed (Score: {item.score || 96}/100)
                      </span>
                    ) : (
                      <span className="badge badge-ppo" style={{ fontSize: 12, fontWeight: 800 }}>
                        ⚡ Live Assessment Round
                      </span>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#0073e6", fontWeight: 700 }}>
                      <ClockIcon size={14} /> {item.duration_minutes || 45} mins
                    </div>
                  </div>

                  <h3 style={{ fontSize: 18, fontWeight: 900, color: "#0f2b48", marginBottom: 4 }}>
                    {item.round}
                  </h3>
                  <p style={{ fontSize: 14, color: "#0073e6", fontWeight: 700, marginBottom: 16 }}>
                    {item.job_title}
                  </p>

                  {/* Details Box */}
                  <div style={{
                    background: isCompleted ? "#ffffff" : "#f8fafc",
                    padding: 16,
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    marginBottom: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    fontSize: 13
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#0f2b48", fontWeight: 700 }}>
                      <CalendarIcon size={16} color="#0073e6" />
                      <span>{item.scheduled_date}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#475569" }}>
                      <UsersIcon size={16} color="#0284c7" />
                      <span>Candidate: <strong style={{ color: "#0f172a" }}>{item.candidate_name || "Sumii"}</strong></span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#475569" }}>
                      <UsersIcon size={16} color="#059669" />
                      <span>Evaluator: <strong style={{ color: "#0f172a" }}>{item.interviewer}</strong></span>
                    </div>
                  </div>

                  {item.notes && (
                    <div style={{
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      padding: "10px 14px",
                      borderRadius: 8,
                      fontSize: 12.5,
                      color: "#1e40af",
                      marginBottom: 18,
                      lineHeight: 1.45
                    }}>
                      <strong>Round Syllabus:</strong> "{item.notes}"
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: 10, borderTop: "1px solid #f1f5f9", paddingTop: 16, flexWrap: "wrap" }}>
                  {/* Enter Coding Sandbox Simulator */}
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setActiveAssessment(item);
                      setAssessmentSubmitted(false);
                      setTestResults(null);
                      setTimerSeconds(45 * 60);
                    }}
                    style={{
                      flex: 1,
                      padding: "11px 16px",
                      fontSize: 13.5,
                      fontWeight: 800,
                      background: "linear-gradient(135deg, #0066cc 0%, #00b4d8 100%)"
                    }}
                  >
                    💻 Enter Coding Sandbox
                  </button>

                  {/* Enter Live Video Room Simulator */}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setActiveVideoRoom(item);
                      setVideoSessionCompleted(false);
                    }}
                    style={{
                      flex: 1,
                      padding: "11px 16px",
                      fontSize: 13.5,
                      fontWeight: 700
                    }}
                  >
                    <VideoIcon size={15} color="#0073e6" /> Live Video Room
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. INTERACTIVE ASSESSMENT CODING SANDBOX MODAL SIMULATOR  */}
      {/* ========================================================= */}
      {activeAssessment && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: 20,
            maxWidth: 960,
            width: "100%",
            maxHeight: "92vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35)",
            border: "2px solid #0066cc"
          }}>
            {/* Modal Header */}
            <div style={{
              background: "#0f2b48",
              color: "#ffffff",
              padding: "16px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ fontSize: 12, color: "#38bdf8", fontWeight: 800, textTransform: "uppercase" }}>
                  UNSTOP ONLINE CODING CHALLENGE · PROCTORED ROUND
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 900, margin: "2px 0 0" }}>
                  {activeAssessment.round}
                </h3>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  background: timerSeconds < 300 ? "#ef4444" : "#0284c7",
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: 14,
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}>
                  <ClockIcon size={15} /> {formatTimer(timerSeconds)}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveAssessment(null)}
                  style={{
                    background: "rgba(255, 255, 255, 0.15)",
                    border: "none",
                    color: "#ffffff",
                    borderRadius: "50%",
                    width: 32,
                    height: 32,
                    fontSize: 18,
                    cursor: "pointer"
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
              {assessmentSubmitted ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
                  <h2 style={{ fontSize: 24, fontWeight: 900, color: "#0f2b48" }}>Assessment Submitted Successfully!</h2>
                  <p style={{ color: "#64748b", fontSize: 15, maxWidth: 520, margin: "8px auto 20px" }}>
                    All 3 test cases executed with 100% pass rate. Your diagnostic evaluation score has been logged to your application tracker.
                  </p>
                  <div style={{
                    display: "inline-block",
                    background: "#ecfdf5",
                    border: "2px solid #86efac",
                    padding: "16px 32px",
                    borderRadius: 14,
                    marginBottom: 24
                  }}>
                    <div style={{ fontSize: 13, color: "#065f46", fontWeight: 800 }}>ASSESSMENT SCORE</div>
                    <div style={{ fontSize: 36, fontWeight: 900, color: "#059669" }}>96 / 100</div>
                    <div style={{ fontSize: 12, color: "#047857" }}>Time: 12 mins • Memory: Optimal (O(N))</div>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setActiveAssessment(null)}
                      style={{ padding: "10px 28px", fontWeight: 800 }}
                    >
                      Done & Return to Rounds
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Problem Description */}
                  <div style={{ background: "#f8fafc", padding: "16px 18px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <strong style={{ fontSize: 16, color: "#0f2b48" }}>Problem: Microservice Load Pair Deduplication</strong>
                      <span className="badge badge-neutral" style={{ fontWeight: 700 }}>Difficulty: Medium</span>
                    </div>
                    <p style={{ fontSize: 13.5, color: "#475569", margin: "4px 0 10px", lineHeight: 1.5 }}>
                      Given an array of integer request IDs <code style={{ background: "#e2e8f0", padding: "2px 6px", borderRadius: 4 }}>nums</code> and an integer <code style={{ background: "#e2e8f0", padding: "2px 6px", borderRadius: 4 }}>target</code>, return indices of the two numbers such that they add up to target. You may assume each input has exactly one solution in O(N) time complexity.
                    </p>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      <strong>Input:</strong> nums = [2, 7, 11, 15], target = 9 · <strong>Output:</strong> [0, 1]
                    </div>
                  </div>

                  {/* Code Editor Area */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#0f2b48" }}>Interactive Sandbox (JavaScript / Python):</span>
                      <span style={{ fontSize: 12, color: "#0066cc", fontWeight: 700 }}>Proctoring Active ✓</span>
                    </div>
                    <textarea
                      value={assessmentCode}
                      onChange={(e) => setAssessmentCode(e.target.value)}
                      rows={9}
                      style={{
                        width: "100%",
                        fontFamily: "Consolas, Menlo, Monaco, monospace",
                        fontSize: 13,
                        background: "#0f172a",
                        color: "#38bdf8",
                        padding: 14,
                        borderRadius: 10,
                        border: "1px solid #334155",
                        outline: "none",
                        lineHeight: 1.5,
                        resize: "vertical"
                      }}
                    />
                  </div>

                  {/* Test Cases Results */}
                  {testResults && (
                    <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 12, padding: 14 }}>
                      <div style={{ fontWeight: 800, color: "#065f46", fontSize: 13.5, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        <CheckCircleIcon size={16} color="#059669" /> All Test Cases Passed Successfully!
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {testResults.map(tr => (
                          <div key={tr.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#047857" }}>
                            <span>✓ {tr.name}</span>
                            <strong>Expected: {tr.expected} (Output: {tr.output})</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Modal Footer Controls */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 10 }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleRunTests}
                      style={{ fontWeight: 800 }}
                    >
                      ▶ Run Test Cases
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleSubmitAssessment(activeAssessment)}
                      style={{
                        background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                        padding: "10px 24px",
                        fontWeight: 900
                      }}
                    >
                      Submit Assessment & Record Score →
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. LIVE VIDEO SCREENING ROOM SIMULATOR MODAL              */}
      {/* ========================================================= */}
      {activeVideoRoom && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: 20,
            maxWidth: 1000,
            width: "100%",
            maxHeight: "92vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4)",
            border: "2px solid #0066cc"
          }}>
            {/* Header */}
            <div style={{
              background: "#0f2b48",
              color: "#ffffff",
              padding: "14px 22px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ fontSize: 11, color: "#38bdf8", fontWeight: 800, textTransform: "uppercase" }}>
                  🔴 LIVE ENCRYPTED VIDEO SCREENING ROOM
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 900, margin: 0 }}>
                  {activeVideoRoom.round} · {activeVideoRoom.company || "CognitiveFlow Technologies"}
                </h3>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="badge badge-verified" style={{ background: "#10b981", color: "#ffffff" }}>
                  HD Audio/Video Active
                </span>
                <button
                  type="button"
                  onClick={() => setActiveVideoRoom(null)}
                  style={{
                    background: "rgba(255, 255, 255, 0.15)",
                    border: "none",
                    color: "#ffffff",
                    borderRadius: "50%",
                    width: 32,
                    height: 32,
                    fontSize: 18,
                    cursor: "pointer"
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Video Screening Grid */}
            <div style={{ padding: 20, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
              {videoSessionCompleted ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ fontSize: 48, marginBottom: 10 }}>🎉</div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f2b48" }}>Interview Round Concluded!</h2>
                  <p style={{ color: "#64748b", fontSize: 14.5, maxWidth: 480, margin: "6px auto 18px" }}>
                    Evaluator feedback has been recorded. Your stage has advanced to "Shortlisted for Final Executive Discussion".
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setActiveVideoRoom(null)}
                    style={{ padding: "10px 24px", fontWeight: 800 }}
                  >
                    Close Screening Room
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {/* Evaluator Feed */}
                    <div style={{
                      background: "#1e293b",
                      borderRadius: 14,
                      height: 220,
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      border: "2px solid #3b82f6"
                    }}>
                      <div style={{
                        width: 68,
                        height: 68,
                        borderRadius: "50%",
                        background: "#0284c7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 26,
                        fontWeight: 900,
                        boxShadow: "0 0 20px rgba(56, 189, 248, 0.5)"
                      }}>
                        {activeVideoRoom.interviewer ? activeVideoRoom.interviewer[0] : "S"}
                      </div>
                      <div style={{ marginTop: 10, fontWeight: 800, fontSize: 15 }}>{activeVideoRoom.interviewer}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>Lead Engineering Evaluator</div>
                      <div style={{
                        position: "absolute",
                        bottom: 12,
                        left: 12,
                        background: "rgba(0,0,0,0.6)",
                        padding: "3px 10px",
                        borderRadius: 12,
                        fontSize: 11,
                        color: "#4ade80"
                      }}>
                        ● Speaking... (Audio Level: Normal)
                      </div>
                    </div>

                    {/* Candidate Feed */}
                    <div style={{
                      background: "#0f172a",
                      borderRadius: 14,
                      height: 220,
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      border: isVideoOn ? "2px solid #10b981" : "2px solid #64748b"
                    }}>
                      {isVideoOn ? (
                        <>
                          <div style={{
                            width: 68,
                            height: 68,
                            borderRadius: "50%",
                            background: "#059669",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 26,
                            fontWeight: 900
                          }}>
                            A
                          </div>
                          <div style={{ marginTop: 10, fontWeight: 800, fontSize: 15 }}>Sumii (Candidate)</div>
                          <div style={{ fontSize: 12, color: "#86efac" }}>HD Camera Connected</div>
                        </>
                      ) : (
                        <div style={{ color: "#94a3b8", fontSize: 14 }}>Camera is turned off</div>
                      )}
                      <div style={{
                        position: "absolute",
                        bottom: 12,
                        left: 12,
                        background: "rgba(0,0,0,0.6)",
                        padding: "3px 10px",
                        borderRadius: 12,
                        fontSize: 11,
                        color: isMicOn ? "#4ade80" : "#f87171"
                      }}>
                        {isMicOn ? "● Mic On" : "● Muted"}
                      </div>
                    </div>
                  </div>

                  {/* Whiteboard / Collaborative Scratchpad */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#0f2b48", marginBottom: 6 }}>
                      Live Collaborative Whiteboard & Architecture Scratchpad:
                    </div>
                    <textarea
                      value={whiteboardText}
                      onChange={(e) => setWhiteboardText(e.target.value)}
                      rows={5}
                      style={{
                        width: "100%",
                        fontFamily: "Consolas, Menlo, monospace",
                        fontSize: 13,
                        background: "#f8fafc",
                        color: "#0f172a",
                        padding: 12,
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        lineHeight: 1.5,
                        outline: "none"
                      }}
                    />
                  </div>

                  {/* Audio / Video Controls & End Session */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid #e2e8f0",
                    paddingTop: 12
                  }}>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => setIsMicOn(!isMicOn)}
                        className="btn btn-secondary"
                        style={{ fontSize: 13, fontWeight: 700 }}
                      >
                        {isMicOn ? "🎙️ Mute Microphone" : "🔇 Unmute Microphone"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsVideoOn(!isVideoOn)}
                        className="btn btn-secondary"
                        style={{ fontSize: 13, fontWeight: 700 }}
                      >
                        {isVideoOn ? "📹 Stop Camera" : "🎥 Start Camera"}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setVideoSessionCompleted(true)}
                      style={{
                        background: "#ef4444",
                        color: "#ffffff",
                        border: "none",
                        padding: "10px 22px",
                        borderRadius: 10,
                        fontWeight: 800,
                        fontSize: 13.5,
                        cursor: "pointer"
                      }}
                    >
                      End Screening Session
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
