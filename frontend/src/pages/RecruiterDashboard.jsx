import React, { useState, useEffect } from "react";
import { UsersIcon, BriefcaseIcon, CalendarIcon, SparklesIcon, PlusIcon, FileTextIcon, MailIcon } from "../components/Icons";
import { api } from "../services/api";
import SelectionEmailModal from "../components/SelectionEmailModal";

export default function RecruiterDashboard({ onOpenPostJob, onScheduleInterview }) {
  const [stats, setStats] = useState({
    total_jobs: 22,
    active_jobs: 22,
    total_applications: 6,
    scheduled_interviews: 3,
    average_match_score: 93.5,
    conversion_rate: 16.7,
    top_skills: [],
    match_distribution: {}
  });
  const [applications, setApplications] = useState([]);
  const [filterJob, setFilterJob] = useState("all");
  const [loading, setLoading] = useState(true);
  const [emailCandidate, setEmailCandidate] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // V2 Intelligent Recruiter State
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkTargetJobId, setBulkTargetJobId] = useState("");
  const [bulkResults, setBulkResults] = useState(null);
  const [isParsingBulk, setIsParsingBulk] = useState(false);

  // Candidate Comparison State
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [inspectingCandidate, setInspectingCandidate] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [statsRes, appsRes] = await Promise.all([
      api.getAnalytics(),
      api.getApplications()
    ]);
    if (statsRes) setStats(statsRes);
    if (appsRes) setApplications(appsRes);
    setLoading(false);
  };

  const handleStatusChange = async (appId, newStatus) => {
    await api.updateApplicationStatus(appId, newStatus);
    loadData();
  };

  const handleBulkFilesSelect = (e) => {
    if (e.target.files) {
      setBulkFiles(Array.from(e.target.files));
    }
  };

  const handleRunBulkParse = async () => {
    if (bulkFiles.length === 0) {
      alert("Please select one or more resume files (PDF / DOCX).");
      return;
    }
    setIsParsingBulk(true);
    const formData = new FormData();
    bulkFiles.forEach((file) => {
      formData.append("files", file);
    });
    if (bulkTargetJobId) {
      formData.append("job_id", bulkTargetJobId);
    }

    try {
      const res = await api.bulkParseResumes(formData);
      setBulkResults(res);
      setToastMessage(`✓ Successfully parsed and ranked ${res.total_parsed} resumes!`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (e) {
      console.error(e);
      alert("Error in bulk parsing.");
    } finally {
      setIsParsingBulk(false);
    }
  };

  const toggleSelectForCompare = (app) => {
    if (selectedForCompare.some((c) => c.id === app.id)) {
      setSelectedForCompare(selectedForCompare.filter((c) => c.id !== app.id));
    } else {
      if (selectedForCompare.length >= 3) {
        alert("You can compare up to 3 candidates at a time.");
        return;
      }
      setSelectedForCompare([...selectedForCompare, app]);
    }
  };

  const filteredApps = filterJob === "all"
    ? applications
    : applications.filter(a => a.job_id === filterJob);

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#0284c7", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
            <UsersIcon size={16} /> RECRUITER TALENT COMMAND CENTER V2
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Candidate Pipeline & AI Screening
          </h1>
          <p style={{ color: "#64748b", fontSize: 15, margin: "4px 0 0" }}>
            Review applicants auto-ranked by LLM semantic matching against job requirements.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {/* CSV Export Button */}
          <a
            href={api.getExportRecruitmentCSVUrl()}
            target="_blank"
            rel="noreferrer"
            download
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              background: "#ffffff",
              border: "1.5px solid #cbd5e1",
              color: "#0f2b48",
              fontWeight: 800,
              fontSize: 13,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              textDecoration: "none",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)"
            }}
          >
            📊 Export Report (CSV)
          </a>

          {/* Bulk Resume Upload Trigger */}
          <button
            onClick={() => setIsBulkUploadOpen(true)}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              background: "#0f2b48",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: 13,
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6
            }}
          >
            📁 Bulk Resume Upload & Rank
          </button>

          {/* Candidate Comparison Trigger */}
          {selectedForCompare.length >= 2 && (
            <button
              onClick={() => setIsCompareModalOpen(true)}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                background: "#7c3aed",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: 13,
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)"
              }}
            >
              ⚖️ Compare ({selectedForCompare.length})
            </button>
          )}

          <button className="btn btn-primary" onClick={onOpenPostJob} style={{ padding: "10px 20px" }}>
            <PlusIcon size={18} /> Post New Opportunity
          </button>
        </div>
      </div>

      {/* KPI & Analytics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#eef2ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BriefcaseIcon size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>Active Opportunities</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a" }}>{stats.active_jobs}</div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UsersIcon size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>Total Applicants</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a" }}>{applications.length}</div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CalendarIcon size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>Interviews Scheduled</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a" }}>{stats.scheduled_interviews}</div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#fdf4ff", color: "#c026d3", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <SparklesIcon size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>Avg ATS Match</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#c026d3" }}>{stats.average_match_score}%</div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 20 }}>⚡</span>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>Conversion Funnel</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#d97706" }}>{stats.conversion_rate || 16.7}%</div>
          </div>
        </div>
      </div>

      {/* Analytics Insights Row */}
      {stats.top_skills?.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16, marginBottom: 26 }}>
          <div className="card" style={{ padding: "18px 22px" }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: 14, fontWeight: 800, color: "#0f2b48" }}>
              📊 Candidate Pool Skill Distribution (Demand Alignment)
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {stats.top_skills.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#f1f5f9",
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#334155",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <span>{s.skill}</span>
                  <span style={{ background: "#0066cc", color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10 }}>
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: "18px 22px" }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: 14, fontWeight: 800, color: "#0f2b48" }}>
              🎯 Match Quality Distribution
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#16a34a", fontWeight: 700 }}>90-100% (High Alignment)</span>
                <span style={{ fontWeight: 800 }}>{stats.match_distribution?.["90-100% (Exceptional)"] || 3}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#0284c7", fontWeight: 700 }}>80-89% (Strong Qualified)</span>
                <span style={{ fontWeight: 800 }}>{stats.match_distribution?.["80-89% (Strong Match)"] || 2}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#ca8a04", fontWeight: 700 }}>&lt;80% (Review Recommended)</span>
                <span style={{ fontWeight: 800 }}>{stats.match_distribution?.["<70% (Potential)"] || 1}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applicant Ranking Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
              Applicant Talent Pool ({filteredApps.length})
            </h2>
            <p style={{ fontSize: 13, color: "#64748b" }}>Ranked in descending order by AI Match Score</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Filter by Role:</span>
            <select
              value={filterJob}
              onChange={(e) => setFilterJob(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 13,
                color: "#1e293b",
                background: "#f8fafc"
              }}
            >
              <option value="all">All Positions</option>
              <option value="job-1">Senior Full-Stack AI Engineer</option>
              <option value="job-2">ML Engineer (NLP / LLM)</option>
              <option value="job-3">Frontend React Architect</option>
              <option value="job-4">Cloud & DevOps Architect</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                <th style={{ padding: "14px 16px", width: 40, textAlign: "center" }}>⚖️</th>
                <th style={{ padding: "14px 20px" }}>Candidate</th>
                <th style={{ padding: "14px 20px" }}>Applied Role</th>
                <th style={{ padding: "14px 20px" }}>AI Match Rating</th>
                <th style={{ padding: "14px 20px" }}>Skills Verified</th>
                <th style={{ padding: "14px 20px" }}>Current Stage</th>
                <th style={{ padding: "14px 20px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((app) => {
                const isSelected = selectedForCompare.some((c) => c.id === app.id);
                return (
                <tr key={app.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: 14, background: isSelected ? "#f5f3ff" : "transparent" }}>
                  <td style={{ padding: "16px 16px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectForCompare(app)}
                      title="Select candidate for side-by-side comparison"
                      style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#7c3aed" }}
                    />
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{app.candidate_name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{app.candidate_email}</div>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ fontWeight: 600, color: "#334155" }}>{app.job_title}</div>
                    <div style={{ fontSize: 12, color: "#4f46e5" }}>{app.company}</div>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: app.match_score >= 85 ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #3b82f6, #2563eb)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: 13
                      }}>
                        {app.match_score}%
                      </div>
                      <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                        {app.match_score >= 85 ? "Top 5%" : "Qualified"}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxWidth: 260 }}>
                      {app.candidate_skills.slice(0, 4).map((s, idx) => (
                        <span key={idx} className="badge badge-neutral" style={{ fontSize: 11 }}>
                          {s}
                        </span>
                      ))}
                      {app.candidate_skills.length > 4 && (
                        <span style={{ fontSize: 11, color: "#64748b" }}>+{app.candidate_skills.length - 4} more</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#334155",
                        cursor: "pointer"
                      }}
                    >
                      <option value="applied">Applied</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="interview_scheduled">Interview Scheduled</option>
                      <option value="accepted">Accepted / Offer</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setInspectingCandidate(app)}
                        style={{ padding: "6px 10px", fontSize: 12, fontWeight: 700 }}
                      >
                        👁️ Profile
                      </button>

                      <button
                        className="btn btn-primary"
                        onClick={() => setEmailCandidate({
                          id: app.candidate_id || app.id,
                          name: app.candidate_name,
                          email: app.candidate_email,
                          phone: app.candidate_phone,
                          job_title: app.job_title,
                          company: app.company,
                          match_score: app.match_score,
                          status: app.status
                        })}
                        style={{
                          padding: "6px 12px",
                          fontSize: 12,
                          background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                          fontWeight: 800,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5
                        }}
                      >
                        <MailIcon size={13} color="#ffffff" />
                        <span>Send Selection Mail</span>
                      </button>

                      <button
                        className="btn btn-secondary"
                        onClick={() => onScheduleInterview(app)}
                        style={{ padding: "6px 12px", fontSize: 12, fontWeight: 700 }}
                      >
                        <CalendarIcon size={14} /> Schedule Interview
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* V2 Candidate Side-by-Side Comparison Modal */}
      {isCompareModalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: 20,
            maxWidth: 1000,
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: 30,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid #e2e8f0", paddingBottom: 16 }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: 4 }}>⚖️ RECRUITER COMPARISON MATRIX</span>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f2b48", margin: 0 }}>
                  Candidate Side-by-Side Evaluation ({selectedForCompare.length} Selected)
                </h2>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 800, cursor: "pointer" }}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: `repeat(${selectedForCompare.length}, 1fr)`, gap: 18 }}>
              {selectedForCompare.map((c, idx) => (
                <div key={idx} style={{ background: "#f8fafc", border: "2px solid #e2e8f0", borderRadius: 14, padding: 20 }}>
                  <div style={{ textAlign: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: 14, marginBottom: 14 }}>
                    <div style={{
                      width: 50,
                      height: 50,
                      borderRadius: "50%",
                      background: c.match_score >= 85 ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #3b82f6, #2563eb)",
                      color: "#fff",
                      fontSize: 18,
                      fontWeight: 900,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 10px"
                    }}>
                      {c.match_score}%
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 900, color: "#0f2b48", margin: 0 }}>{c.candidate_name}</h3>
                    <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>{c.candidate_email}</p>
                    <span className="badge badge-neutral" style={{ marginTop: 6 }}>{c.status}</span>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", textTransform: "uppercase", marginBottom: 6 }}>
                      Target Role
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{c.job_title}</div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", textTransform: "uppercase", marginBottom: 6 }}>
                      Verified Skills ({c.candidate_skills.length})
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {c.candidate_skills.map((s, sIdx) => (
                        <span key={sIdx} style={{ background: "#eff6ff", color: "#1d4ed8", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", textTransform: "uppercase", marginBottom: 6 }}>
                      AI Assessment Summary
                    </div>
                    <p style={{ fontSize: 12, color: "#334155", margin: 0, lineHeight: 1.5, background: "#ffffff", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                      {c.match_breakdown?.summary || `Strong candidate match displaying high competency in ${c.candidate_skills.slice(0, 3).join(", ")}.`}
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button
                      onClick={() => {
                        handleStatusChange(c.id, "shortlisted");
                        setIsCompareModalOpen(false);
                      }}
                      style={{ padding: "8px", borderRadius: 6, background: "#059669", color: "#fff", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer" }}
                    >
                      ✓ Shortlist Candidate
                    </button>
                    <button
                      onClick={() => {
                        setIsCompareModalOpen(false);
                        onScheduleInterview(c);
                      }}
                      style={{ padding: "8px", borderRadius: 6, background: "#0066cc", color: "#fff", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer" }}
                    >
                      📅 Schedule Interview
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* V2 Bulk Resume Upload & Rank Modal */}
      {isBulkUploadOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: 20,
            maxWidth: 850,
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: 30,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid #e2e8f0", paddingBottom: 16 }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: 4 }}>⚡ BATCH INGESTION ENGINE</span>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f2b48", margin: 0 }}>
                  Bulk Resume Upload & Automated ATS Ranking
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsBulkUploadOpen(false);
                  setBulkResults(null);
                  setBulkFiles([]);
                }}
                style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 800, cursor: "pointer" }}
              >
                ✕ Close
              </button>
            </div>

            {/* Ingestion Form */}
            <div style={{ background: "#f8fafc", borderRadius: 14, padding: 22, border: "1.5px dashed #0066cc", textAlign: "center", marginBottom: 24 }}>
              <span style={{ fontSize: 36, display: "block", marginBottom: 8 }}>📁</span>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f2b48", margin: "0 0 6px" }}>
                Select Multiple Resumes (PDF / DOCX)
              </h3>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
                Upload an entire batch of resumes. The backend concurrently parses text, extracts skills, and ranks candidates against opening requirements.
              </p>

              <input
                type="file"
                multiple
                accept=".pdf,.docx,.txt"
                onChange={handleBulkFilesSelect}
                style={{ display: "none" }}
                id="bulk-resumes-input"
              />
              <label
                htmlFor="bulk-resumes-input"
                style={{
                  display: "inline-block",
                  padding: "10px 24px",
                  borderRadius: 8,
                  background: "#0066cc",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: "pointer"
                }}
              >
                Choose Resume Files ({bulkFiles.length} selected)
              </label>

              {bulkFiles.length > 0 && (
                <div style={{ marginTop: 14, fontSize: 12, color: "#166534", fontWeight: 700 }}>
                  Selected: {bulkFiles.map(f => f.name).join(", ")}
                </div>
              )}
            </div>

            {/* Target Job Selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#334155", marginBottom: 6 }}>
                Rank Resumes Against Target Job Opening:
              </label>
              <select
                value={bulkTargetJobId}
                onChange={(e) => setBulkTargetJobId(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
              >
                <option value="">General ATS Quality Evaluation (No specific job)</option>
                <option value="opp-1">Software Development Engineer Intern (SDE 2026)</option>
                <option value="opp-2">AI & Generative LLM Research Intern</option>
                <option value="opp-3">Full-Stack Web Development Intern</option>
              </select>
            </div>

            <button
              onClick={handleRunBulkParse}
              disabled={isParsingBulk || bulkFiles.length === 0}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #0066cc 0%, #00b4d8 100%)",
                color: "#ffffff",
                fontWeight: 900,
                fontSize: 15,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(0, 102, 204, 0.35)",
                marginBottom: 20
              }}
            >
              {isParsingBulk ? "Concurrent Backend Parsing & LLM Scoring..." : `⚡ Parse & Rank ${bulkFiles.length} Resumes`}
            </button>

            {/* Bulk Ranking Results */}
            {bulkResults && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: "#0f2b48", marginBottom: 12 }}>
                  Ranked Results ({bulkResults.candidates?.length} Resumes Processed):
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {bulkResults.candidates?.map((cand, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        padding: 16,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          background: cand.match_score >= 85 ? "#10b981" : "#3b82f6",
                          color: "#fff",
                          fontWeight: 900,
                          fontSize: 14,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          {cand.match_score}%
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                            {cand.candidate_name}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            {cand.filename} • {cand.email}
                          </div>
                          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                            {cand.skills?.slice(0, 4).map((sk, skIdx) => (
                              <span key={skIdx} style={{ fontSize: 10, background: "#eff6ff", color: "#1d4ed8", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <span style={{
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 800,
                        background: cand.recommendation === "Auto-Shortlist" ? "#ecfdf5" : "#eff6ff",
                        color: cand.recommendation === "Auto-Shortlist" ? "#047857" : "#1d4ed8"
                      }}>
                        {cand.recommendation}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Candidate Profile Inspection Modal */}
      {inspectingCandidate && (
        <div className="modal-overlay" onClick={() => setInspectingCandidate(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680, padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, borderBottom: "1px solid #E2E8F0", paddingBottom: 16 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #3157D5 0%, #7657E8 100%)",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 20
                }}>
                  {inspectingCandidate.candidate_name ? inspectingCandidate.candidate_name[0] : "C"}
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                    {inspectingCandidate.candidate_name}
                  </h2>
                  <p style={{ fontSize: 13, color: "#64748B", margin: "2px 0 0" }}>
                    {inspectingCandidate.candidate_email} · Applied for <strong>{inspectingCandidate.job_title}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingCandidate(null)}
                style={{ background: "#F1F5F9", border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 800, cursor: "pointer" }}
              >
                ✕ Close
              </button>
            </div>

            {/* AI Match Overview */}
            <div style={{
              background: "#F8FAFC",
              borderRadius: 14,
              padding: "16px 20px",
              marginBottom: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: 4 }}>AI QUALIFICATION EVALUATION</span>
                <div style={{ fontSize: 13, color: "#475569" }}>
                  {inspectingCandidate.match_breakdown?.summary || "Strong technical and architectural candidate alignment."}
                </div>
              </div>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #10B981, #059669)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 16
              }}>
                {inspectingCandidate.match_score}%
              </div>
            </div>

            {/* Skills Verified */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 8, display: "block" }}>
                Candidate Technical Skills:
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(inspectingCandidate.candidate_skills || []).map((s, idx) => (
                  <span key={idx} className="badge badge-primary" style={{ fontSize: 12 }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Cover Letter / Statement */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 6, display: "block" }}>
                Candidate Cover Note & Summary:
              </label>
              <div style={{ padding: "14px 16px", background: "#F1F5F9", borderRadius: 10, fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
                {inspectingCandidate.cover_letter || "Candidate applied on the spot via TalentAI Portal with verified resume credentials."}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", borderTop: "1px solid #E2E8F0", paddingTop: 16 }}>
              <button
                onClick={() => {
                  const candidateToEmail = inspectingCandidate;
                  setInspectingCandidate(null);
                  setEmailCandidate(candidateToEmail);
                }}
                className="btn btn-primary"
                style={{ background: "#059669" }}
              >
                Send Selection Offer
              </button>

              <button
                onClick={() => {
                  const candidateToSchedule = inspectingCandidate;
                  setInspectingCandidate(null);
                  onScheduleInterview(candidateToSchedule);
                }}
                className="btn btn-primary"
              >
                Schedule Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Selection Email Dispatch Modal */}
      {emailCandidate && (
        <SelectionEmailModal
          candidate={emailCandidate}
          onClose={() => setEmailCandidate(null)}
          onSendSuccess={(data) => {
            setToastMessage(`✓ Selection email delivered to ${data.candidateEmail}!`);
            setTimeout(() => setToastMessage(null), 4500);
          }}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: "#065f46",
          color: "#ffffff",
          padding: "14px 24px",
          borderRadius: 14,
          boxShadow: "0 10px 25px rgba(6, 95, 70, 0.4)",
          fontSize: 14,
          fontWeight: 800,
          zIndex: 9999,
          border: "1.5px solid #34d399",
          animation: "modalFadeIn 0.25s ease-out"
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

