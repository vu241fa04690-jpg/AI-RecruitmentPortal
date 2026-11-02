import React, { useState, useEffect } from "react";
import {
  FileTextIcon,
  CheckCircleIcon,
  CalendarIcon,
  ClockIcon,
  SparklesIcon,
  BriefcaseIcon,
  ArrowUpRightIcon,
  UsersIcon
} from "../components/Icons";
import { api, INITIAL_MOCK_APPLICATIONS } from "../services/api";

const STAGES = [
  { id: "applied", label: "Application Submitted" },
  { id: "reviewing", label: "Resume Screening" },
  { id: "shortlisted", label: "Shortlisted for Rounds" },
  { id: "interview_scheduled", label: "Assessment & Interview" },
  { id: "accepted", label: "Offer Extended" }
];

export default function ApplicationsView({ onNavigateInterviews, onNavigateJobs }) {
  const [applications, setApplications] = useState(() => {
    return (INITIAL_MOCK_APPLICATIONS && INITIAL_MOCK_APPLICATIONS.length > 0) ? INITIAL_MOCK_APPLICATIONS : [];
  });
  const [loading, setLoading] = useState(false);
  const [filterStage, setFilterStage] = useState("all");

  useEffect(() => {
    let mounted = true;
    const fetchApps = async () => {
      try {
        const data = await api.getApplications();
        if (mounted && data && data.length > 0) {
          setApplications(data);
        }
      } catch (err) {
        console.warn("Failed to sync latest applications from server, using local cache:", err);
      }
    };
    fetchApps();
    return () => { mounted = false; };
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "interview_scheduled":
        return <span className="badge badge-success" style={{ fontWeight: 800 }}>✓ Assessment & Interview Live</span>;
      case "shortlisted":
        return <span className="badge badge-primary" style={{ fontWeight: 800 }}>★ Shortlisted</span>;
      case "reviewing":
        return <span className="badge badge-info" style={{ fontWeight: 800 }}>⏳ In Hiring Review</span>;
      case "accepted":
        return <span className="badge badge-ppo" style={{ fontWeight: 800 }}>🏆 Offer Extended</span>;
      case "rejected":
        return <span className="badge badge-neutral">Archived</span>;
      default:
        return <span className="badge badge-neutral" style={{ fontWeight: 800 }}>✓ Applied on the Spot</span>;
    }
  };

  const filteredApps = applications.filter((app) => {
    if (filterStage === "all") return true;
    return app.status === filterStage;
  });

  const shortlistedCount = applications.filter(a => a.status === "shortlisted" || a.status === "interview_scheduled" || a.status === "accepted").length;
  const interviewCount = applications.filter(a => a.status === "interview_scheduled").length;

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 24px 60px" }}>
      {/* Top Banner (Unstop Style) */}
      <div style={{
        background: "linear-gradient(135deg, #0f2b48 0%, #0066cc 60%, #00b4d8 100%)",
        borderRadius: 22,
        padding: "32px 36px",
        color: "#ffffff",
        marginBottom: 26,
        boxShadow: "0 12px 36px -6px rgba(0, 102, 204, 0.35)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(255, 255, 255, 0.18)",
            padding: "5px 14px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 800,
            marginBottom: 10,
            textTransform: "uppercase"
          }}>
            📋 REAL-TIME APPLICATION & HIRING TRACKER
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: -0.8, marginBottom: 8, lineHeight: 1.2 }}>
            My Candidate Applications & Assessment Progression
          </h1>
          <p style={{ color: "#e0f2fe", fontSize: 15, maxWidth: 740, lineHeight: 1.55 }}>
            Track real-time candidate pipeline stages, AI qualification match scores, multi-round technical assessment invites, and direct offer updates.
          </p>

          {/* Quick Stats Strip */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginTop: 20,
            flexWrap: "wrap",
            paddingTop: 16,
            borderTop: "1px solid rgba(255, 255, 255, 0.15)"
          }}>
            <div>
              <div style={{ fontSize: 12, color: "#bae6fd", fontWeight: 700 }}>Total Applications</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#ffffff" }}>{applications.length}</div>
            </div>
            <div style={{ width: 1, height: 32, background: "rgba(255, 255, 255, 0.2)" }} />
            <div>
              <div style={{ fontSize: 12, color: "#bae6fd", fontWeight: 700 }}>Shortlisted / Active</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#34d399" }}>{shortlistedCount}</div>
            </div>
            <div style={{ width: 1, height: 32, background: "rgba(255, 255, 255, 0.2)" }} />
            <div>
              <div style={{ fontSize: 12, color: "#bae6fd", fontWeight: 700 }}>Assessment Rounds Live</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#fbbf24" }}>{interviewCount}</div>
            </div>
            <div style={{ width: 1, height: 32, background: "rgba(255, 255, 255, 0.2)" }} />
            <div>
              <div style={{ fontSize: 12, color: "#bae6fd", fontWeight: 700 }}>Average AI Match Score</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#ffffff" }}>94.2%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Quick Action Strip */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 22 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className={`filter-pill ${filterStage === "all" ? "filter-pill-active" : ""}`}
            onClick={() => setFilterStage("all")}
          >
            All Submissions ({applications.length})
          </button>
          <button
            className={`filter-pill ${filterStage === "interview_scheduled" ? "filter-pill-active" : ""}`}
            onClick={() => setFilterStage("interview_scheduled")}
          >
            🎯 Assessment Rounds ({interviewCount})
          </button>
          <button
            className={`filter-pill ${filterStage === "shortlisted" ? "filter-pill-active" : ""}`}
            onClick={() => setFilterStage("shortlisted")}
          >
            ★ Shortlisted
          </button>
          <button
            className={`filter-pill ${filterStage === "applied" ? "filter-pill-active" : ""}`}
            onClick={() => setFilterStage("applied")}
          >
            ⚡ Applied on the Spot
          </button>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onNavigateInterviews}
            style={{ fontSize: 13, padding: "8px 16px", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
          >
            <CalendarIcon size={15} color="#0066cc" /> View Assessment Schedule
          </button>
          {onNavigateJobs && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onNavigateJobs}
              style={{ fontSize: 13, padding: "8px 18px", fontWeight: 800 }}
            >
              Explore More Jobs →
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748b", fontSize: 16 }}>
          ⚡ Loading your applications and assessment updates...
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "64px 24px" }}>
          <FileTextIcon size={44} color="#94a3b8" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 19, fontWeight: 800, color: "#1c4980", marginBottom: 8 }}>
            No Applications Found for this Filter
          </h3>
          <p style={{ color: "#64748b", fontSize: 14, maxWidth: 460, margin: "0 auto 20px" }}>
            Explore open jobs and apply with 1-click on the spot to start tracking your multi-round hiring progress!
          </p>
          {onNavigateJobs && (
            <button className="btn btn-primary" onClick={onNavigateJobs} style={{ padding: "10px 24px", fontWeight: 800 }}>
              Browse Live Opportunities
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="card card-hover"
              style={{
                padding: "26px 28px",
                border: app.status === "interview_scheduled" ? "2px solid #0066cc" : "1px solid #e2e8f0"
              }}
            >
              {/* Header Row: Company, Title, Status, AI Score */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "#0f2b48",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: 20,
                    boxShadow: "0 4px 10px rgba(0,0,0,0.12)"
                  }}>
                    {app.company ? app.company[0] : "O"}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                      <h3 style={{ fontSize: 19, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                        {app.job_title}
                      </h3>
                      {getStatusBadge(app.status)}
                    </div>
                    <div style={{ fontSize: 14, color: "#0066cc", fontWeight: 700 }}>
                      {app.company} · <span style={{ color: "#64748b", fontWeight: 500 }}>Applied via Recruitment Portal AI Hub</span>
                    </div>
                  </div>
                </div>

                {/* AI Match Rating Badge */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "#f0fdf4",
                  padding: "8px 16px",
                  borderRadius: 14,
                  border: "1.5px solid #86efac"
                }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#166534", fontWeight: 800, textTransform: "uppercase" }}>AI Fit Rating</div>
                    <div style={{ fontSize: 12.5, color: "#15803d", fontWeight: 700 }}>High Compatibility</div>
                  </div>
                  <div style={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: 16,
                    boxShadow: "0 3px 10px rgba(16, 185, 129, 0.35)"
                  }}>
                    {app.match_score || 96}%
                  </div>
                </div>
              </div>

              {/* Multi-Stage Visual Pipeline Stepper (Unstop Style) */}
              <div style={{
                background: "#f8fafc",
                padding: "20px 24px",
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                marginBottom: 20
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
                  {STAGES.map((stage, idx) => {
                    const currentStageIdx = STAGES.findIndex(s => s.id === app.status);
                    const isPassed = currentStageIdx >= idx;
                    const isCurrent = app.status === stage.id;
                    return (
                      <div key={stage.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2, flex: 1 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: isPassed ? "linear-gradient(135deg, #0066cc, #00b4d8)" : "#e2e8f0",
                          color: isPassed ? "#ffffff" : "#94a3b8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 800,
                          boxShadow: isCurrent ? "0 0 0 4px rgba(0, 102, 204, 0.22)" : "none",
                          transition: "all 0.25s"
                        }}>
                          {isPassed ? "✓" : idx + 1}
                        </div>
                        <span style={{
                          fontSize: 11.5,
                          marginTop: 8,
                          textAlign: "center",
                          fontWeight: isCurrent ? 800 : isPassed ? 700 : 500,
                          color: isCurrent ? "#0066cc" : isPassed ? "#0f172a" : "#94a3b8",
                          maxWidth: 120
                        }}>
                          {stage.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Assessment Rounds & AI Diagnostic Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16, marginBottom: 18 }}>
                {/* Left: AI Screening Diagnostic */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "16px 18px", borderRadius: 12 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: "#1c4980", textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <SparklesIcon size={14} color="#0066cc" /> AI Screening Summary & Strengths
                  </div>
                  <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.6, margin: "0 0 10px" }}>
                    {app.match_breakdown?.summary || "Profile matched with core technical requirements. Candidate recommended for multi-round engineering assessment."}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {(app.candidate_skills || ["Python", "FastAPI", "React", "Docker"]).map((s, sIdx) => (
                      <span key={sIdx} className="badge badge-neutral" style={{ fontSize: 11, background: "#f1f5f9" }}>
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right: Assessment Rounds Live Progress */}
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "16px 18px", borderRadius: 12, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0f2b48", textTransform: "uppercase", marginBottom: 8 }}>
                      📋 Assessment Rounds Status
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ color: "#334155" }}>1. Online Coding Diagnostic</span>
                        <span style={{ color: "#15803d", fontWeight: 800 }}>✓ Passed (94/100)</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ color: "#334155" }}>2. Live Technical Pair-Screen</span>
                        <span style={{ color: "#0066cc", fontWeight: 800 }}>🎯 Ready to Join</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748b" }}>3. Leadership & Culture Fit</span>
                        <span style={{ color: "#94a3b8" }}>Pending Round 2</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={onNavigateInterviews}
                      style={{ fontSize: 12.5, padding: "8px 16px", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <CalendarIcon size={14} /> Enter Assessment Round →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
