import React, { useState, useEffect } from "react";
import { api } from "../services/api";

const STAGES = [
  { key: "applied", label: "Applied", color: "#64748b" },
  { key: "resume_screening", label: "Resume Screening", color: "#0284c7" },
  { key: "shortlisted", label: "Shortlisted", color: "#3157D5" },
  { key: "assignment_assigned", label: "Assignment Assigned", color: "#7c3aed" },
  { key: "assignment_submitted", label: "Assignment Submitted", color: "#9333ea" },
  { key: "assignment_evaluated", label: "Assignment Evaluated", color: "#c026d3" },
  { key: "aptitude_assessment", label: "Aptitude Assessment", color: "#d97706" },
  { key: "technical_interview", label: "Technical Interview", color: "#2563eb" },
  { key: "face_to_face_interview", label: "Face-to-Face Interview", color: "#0d9488" },
  { key: "hr_interview", label: "HR Interview", color: "#4f46e5" },
  { key: "final_interview", label: "Final Interview", color: "#0891b2" },
  { key: "selected", label: "Selected / Offered", color: "#16a34a" },
  { key: "rejected", label: "Rejected", color: "#dc2626" }
];

export default function RecruitmentPipelineKanban({ onScheduleInterview, onEvaluateCandidate }) {
  const [pipelineData, setPipelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState("all");
  const [historyModalApp, setHistoryModalApp] = useState(null);
  const [historyTimeline, setHistoryTimeline] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [movingAppId, setMovingAppId] = useState(null);

  useEffect(() => {
    loadPipeline();
  }, []);

  const loadPipeline = async () => {
    try {
      setLoading(true);
      const res = await api.getPipelineSummary();
      setPipelineData(res.stages || []);
    } catch (err) {
      console.warn("Error fetching pipeline:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveStage = async (appId, targetStage) => {
    try {
      setMovingAppId(appId);
      await api.moveCandidateStage(appId, targetStage, `Moved to ${targetStage} via Recruitment Pipeline Kanban`);
      await loadPipeline();
    } catch (err) {
      alert(err.message || "Could not move candidate stage");
    } finally {
      setMovingAppId(null);
    }
  };

  const handleOpenHistory = async (candidate) => {
    try {
      setHistoryModalApp(candidate);
      setLoadingHistory(true);
      const res = await api.getCandidateStageHistory(candidate.id);
      setHistoryTimeline(res.timeline || []);
    } catch (err) {
      alert("Error loading timeline");
    } finally {
      setLoadingHistory(false);
    }
  };

  const totalCandidates = pipelineData.reduce((acc, stg) => acc + (stg.count || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Pipeline Statistics Banner */}
      <div style={{
        background: "linear-gradient(135deg, #172554, #3157D5)",
        color: "#fff",
        borderRadius: "16px",
        padding: "24px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "800", margin: "0 0 6px" }}>
            13-Stage Visual Recruitment Pipeline
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>
            Real-time candidate progression through screening, assignments, multi-round technical interviews, and final offers.
          </p>
        </div>
        <div style={{
          background: "rgba(255,255,255,0.12)",
          backdropFilter: "blur(8px)",
          padding: "10px 20px",
          borderRadius: "12px",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Active Pipeline</div>
          <div style={{ fontSize: "24px", fontWeight: "800" }}>{totalCandidates} Candidates</div>
        </div>
      </div>

      {/* Stage Selector Pills */}
      <div style={{
        display: "flex",
        gap: "8px",
        overflowX: "auto",
        paddingBottom: "8px"
      }}>
        <button
          onClick={() => setSelectedStage("all")}
          style={{
            background: selectedStage === "all" ? "#3157D5" : "#ffffff",
            color: selectedStage === "all" ? "#ffffff" : "#475569",
            border: "1px solid #cbd5e1",
            borderRadius: "20px",
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: "700",
            cursor: "pointer",
            whiteSpace: "nowrap"
          }}
        >
          All Stages ({totalCandidates})
        </button>
        {pipelineData.map((stg) => (
          <button
            key={stg.key}
            onClick={() => setSelectedStage(stg.key)}
            style={{
              background: selectedStage === stg.key ? "#3157D5" : "#ffffff",
              color: selectedStage === stg.key ? "#ffffff" : "#475569",
              border: "1px solid #cbd5e1",
              borderRadius: "20px",
              padding: "8px 16px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span>{stg.label}</span>
            <span style={{
              background: selectedStage === stg.key ? "rgba(255,255,255,0.25)" : "#f1f5f9",
              padding: "2px 6px",
              borderRadius: "10px",
              fontSize: "10px"
            }}>
              {stg.count}
            </span>
          </button>
        ))}
      </div>

      {/* Pipeline Lanes Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
          Loading visual candidate pipeline...
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: selectedStage === "all" ? "repeat(auto-fill, minmax(320px, 1fr))" : "1fr",
          gap: "20px"
        }}>
          {pipelineData
            .filter((stg) => selectedStage === "all" || stg.key === selectedStage)
            .map((stg) => {
              const stageConfig = STAGES.find((s) => s.key === stg.key) || { color: "#3157D5" };
              return (
                <div
                  key={stg.key}
                  style={{
                    background: "#ffffff",
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    overflow: "hidden",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
                  }}
                >
                  {/* Lane Header */}
                  <div style={{
                    padding: "14px 18px",
                    background: "#f8fafc",
                    borderBottom: "2px solid " + stageConfig.color,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: stageConfig.color }}></span>
                      <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
                        {stg.label}
                      </h4>
                    </div>
                    <span style={{
                      background: stageConfig.color + "18",
                      color: stageConfig.color,
                      padding: "2px 8px",
                      borderRadius: "10px",
                      fontSize: "12px",
                      fontWeight: "800"
                    }}>
                      {stg.count}
                    </span>
                  </div>

                  {/* Candidate Cards within Stage */}
                  <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "12px", maxHeight: "480px", overflowY: "auto" }}>
                    {stg.candidates.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "24px 12px", color: "#94a3b8", fontSize: "12px" }}>
                        No candidates currently in this stage.
                      </div>
                    ) : (
                      stg.candidates.map((cand) => (
                        <div
                          key={cand.id}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            padding: "14px",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
                                {cand.candidate_name}
                              </div>
                              <div style={{ fontSize: "12px", color: "#64748b" }}>
                                {cand.job_title}
                              </div>
                            </div>
                            <span style={{
                              background: cand.match_score >= 80 ? "#ecfdf5" : "#eff6ff",
                              color: cand.match_score >= 80 ? "#059669" : "#2563eb",
                              padding: "2px 6px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "700"
                            }}>
                              {cand.match_score}% Match
                            </span>
                          </div>

                          <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                            {cand.candidate_email}
                          </div>

                          {/* Action Bar */}
                          <div style={{ display: "flex", gap: "6px", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                            {/* Move Stage Selector */}
                            <select
                              value={cand.status}
                              disabled={movingAppId === cand.id}
                              onChange={(e) => handleMoveStage(cand.id, e.target.value)}
                              style={{
                                flex: 1,
                                fontSize: "11px",
                                padding: "6px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                background: "#fff",
                                color: "#334155"
                              }}
                            >
                              {STAGES.map((s) => (
                                <option key={s.key} value={s.key}>
                                  ➔ Move to {s.label}
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() => handleOpenHistory(cand)}
                              style={{
                                background: "#f1f5f9",
                                border: "none",
                                borderRadius: "6px",
                                padding: "6px 10px",
                                fontSize: "11px",
                                fontWeight: "600",
                                cursor: "pointer",
                                color: "#475569"
                              }}
                              title="View Stage Transition Audit History"
                            >
                              🕒 Audit
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Stage Transition Audit History Modal */}
      {historyModalApp && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "560px",
            maxWidth: "92vw",
            maxHeight: "80vh",
            padding: "26px",
            overflowY: "auto",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                  Stage History: {historyModalApp.candidate_name}
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Role: {historyModalApp.job_title}
                </span>
              </div>
              <button
                onClick={() => setHistoryModalApp(null)}
                style={{ background: "transparent", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            {loadingHistory ? (
              <p style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>Loading timeline audit...</p>
            ) : historyTimeline.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                Candidate submitted application directly. Initial stage: <code>{historyModalApp.status}</code>.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {historyTimeline.map((ev, idx) => (
                  <div key={idx} style={{
                    display: "flex",
                    gap: "12px",
                    padding: "12px",
                    background: "#f8fafc",
                    borderRadius: "10px",
                    borderLeft: "3px solid #3157D5"
                  }}>
                    <div style={{ fontSize: "16px" }}>⚡</div>
                    <div style={{ flex: 1, fontSize: "13px" }}>
                      <div style={{ fontWeight: "700", color: "#0f172a" }}>
                        Stage: {ev.to_stage || ev.stage}
                      </div>
                      <div style={{ color: "#64748b", fontSize: "12px", marginTop: "2px" }}>
                        {ev.notes || "Transition recorded"} • By: {ev.changed_by}
                      </div>
                      <div style={{ color: "#94a3b8", fontSize: "11px", marginTop: "4px" }}>
                        {new Date(ev.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
