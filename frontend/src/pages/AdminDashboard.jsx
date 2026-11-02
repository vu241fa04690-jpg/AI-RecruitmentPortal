import React, { useState, useEffect } from "react";
import {
  ShieldLockIcon,
  UsersIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckCircleIcon,
  SparklesIcon,
  MailIcon
} from "../components/Icons";
import { api } from "../services/api";
import SelectionEmailModal from "../components/SelectionEmailModal";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_jobs: 22,
    active_jobs: 22,
    total_applications: 6,
    scheduled_interviews: 3,
    average_match_score: 93.5
  });

  const [users, setUsers] = useState([
    {
      id: "user-101",
      name: "Sumii",
      email: "sumii@example.com",
      phone: "+15554445555",
      role: "candidate",
      status: "Active",
      verified: true,
      last_login: "Just now"
    },
    {
      id: "user-102",
      name: "Summya",
      email: "summya.recruiter@cognitiveflow.com",
      phone: "+15552223333",
      role: "recruiter",
      company: "CognitiveFlow Technologies",
      status: "Active",
      verified: true,
      last_login: "10 mins ago"
    },
    {
      id: "user-103",
      name: "Nashu",
      email: "nashu.admin@recruitmentportal.com",
      phone: "+15550001111",
      role: "admin",
      company: "Recruitment Portal Central",
      status: "Active",
      verified: true,
      last_login: "Just now"
    },
    {
      id: "user-104",
      name: "Priya Sharma",
      email: "priya.sharma@example.com",
      phone: "+15556667777",
      role: "candidate",
      status: "Active",
      verified: true,
      last_login: "2 hours ago"
    }
  ]);

  // Selected Candidates for Roles eligible for official account & login email dispatch
  const [selectedCandidates, setSelectedCandidates] = useState([
    {
      id: "cand-1",
      name: "Sumii",
      email: "sumii@example.com",
      phone: "+1 (555) 444-5555",
      job_title: "Software Development Engineer Intern (SDE Summer/Winter 2026)",
      company: "CognitiveFlow Technologies",
      match_score: 96,
      status: "Offer Extended",
      emailSent: false,
      emailSentAt: null,
      securityPin: "SEC-9842-SEL"
    },
    {
      id: "cand-2",
      name: "Aarav Sharma",
      email: "aarav.sharma@example.com",
      phone: "+91 98765 43210",
      job_title: "Software Development Engineer Intern (SDE Summer/Winter 2026)",
      company: "CognitiveFlow Technologies",
      match_score: 94,
      status: "Offer Extended",
      emailSent: true,
      emailSentAt: "Today, 10:45 AM",
      securityPin: "SEC-4129-SEL"
    },
    {
      id: "cand-3",
      name: "Priya Sharma",
      email: "priya.sharma@example.com",
      phone: "+1 (555) 666-7777",
      job_title: "AI & Generative LLM Research Intern",
      company: "DeepRecruit AI Labs",
      match_score: 91,
      status: "Shortlisted for Rounds",
      emailSent: false,
      emailSentAt: null,
      securityPin: "SEC-7731-SEL"
    },
    {
      id: "cand-4",
      name: "Vikram Reddy",
      email: "vikram.reddy@example.com",
      phone: "+91 98765 88990",
      job_title: "Embedded Systems & Firmware Engineering Intern",
      company: "SiliconEdge Micro Systems",
      match_score: 95,
      status: "Offer Extended",
      emailSent: false,
      emailSentAt: null,
      securityPin: "SEC-5520-SEL"
    },
    {
      id: "cand-5",
      name: "Ananya Sen",
      email: "ananya.sen@example.com",
      phone: "+91 98765 33445",
      job_title: "Business Analyst & Operations Strategy Associate",
      company: "Apex Global Consulting Group",
      match_score: 94,
      status: "Shortlisted for Rounds",
      emailSent: false,
      emailSentAt: null,
      securityPin: "SEC-3318-SEL"
    }
  ]);

  // Outbox Dispatched Email Logs
  const [emailDispatchLogs, setEmailDispatchLogs] = useState([
    {
      time: "10:45:12",
      candidateName: "Aarav Sharma",
      email: "aarav.sharma@example.com",
      role: "Software Development Engineer Intern",
      company: "CognitiveFlow Technologies",
      subject: "🎉 Congratulations Aarav Sharma! Official Selection for Software Development Engineer Intern",
      status: "Delivered (100%)",
      securityPin: "SEC-4129-SEL"
    }
  ]);

  // Active email dispatch modal
  const [activeModalCandidate, setActiveModalCandidate] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [auditLogs] = useState([
    { time: "14:55:12", event: "JWT Bearer Token issued for 256-bit user session", severity: "info", ip: "127.0.0.1" },
    { time: "14:52:04", event: "Brute-force sliding window rate-limiter verified clean", severity: "success", ip: "127.0.0.1" },
    { time: "14:48:30", event: "Security Headers enforced (X-Frame-Options: DENY, CSP)", severity: "success", ip: "internal" },
    { time: "14:35:10", event: "Password PBKDF2 salt & hash verification passed", severity: "info", ip: "127.0.0.1" }
  ]);

  useEffect(() => {
    api.getAnalytics().then(data => {
      if (data) setStats(data);
    });
  }, []);

  const toggleVerification = (userId) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, verified: !u.verified } : u));
  };

  const handleOpenEmailModal = (cand) => {
    setActiveModalCandidate(cand);
  };

  const handleEmailSentSuccess = (dispatchData) => {
    // Update candidate emailSent status
    setSelectedCandidates(prev => prev.map(c => {
      if (c.id === dispatchData.candidateId || c.email === dispatchData.candidateEmail) {
        return { ...c, emailSent: true, emailSentAt: `Today, ${dispatchData.sentAt}` };
      }
      return c;
    }));

    // Prepend to email dispatch log
    setEmailDispatchLogs(prev => [
      {
        time: dispatchData.sentAt,
        candidateName: dispatchData.candidateName,
        email: dispatchData.candidateEmail,
        role: dispatchData.jobTitle,
        company: dispatchData.company,
        subject: dispatchData.subject,
        status: "Delivered (100%)",
        securityPin: dispatchData.securityPin
      },
      ...prev
    ]);

    setToastMessage(`✓ Official selection email delivered to ${dispatchData.candidateEmail}!`);
    setTimeout(() => setToastMessage(null), 4500);
  };

  return (
    <div style={{ maxWidth: 1360, margin: "0 auto", padding: "32px 24px 60px" }}>
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

      {/* Top Banner (Unstop Navy Style) */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)",
        borderRadius: 22,
        padding: "32px 36px",
        color: "#ffffff",
        marginBottom: 32,
        border: "1.5px solid #4338ca",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 20,
        boxShadow: "0 12px 36px -6px rgba(15, 23, 42, 0.45)"
      }}>
        <div>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "#c084fc",
            fontWeight: 800,
            fontSize: 12,
            background: "rgba(192, 132, 252, 0.18)",
            padding: "4px 12px",
            borderRadius: 20,
            marginBottom: 10,
            textTransform: "uppercase"
          }}>
            <ShieldLockIcon size={15} /> ADMIN GOVERNANCE & CANDIDATE ONBOARDING
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: -0.6, marginBottom: 8, margin: "4px 0 8px" }}>
            Admin Security Operations & Candidate Selection Dispatch
          </h1>
          <p style={{ color: "#c7d2fe", fontSize: 14.5, maxWidth: 760, lineHeight: 1.55, margin: 0 }}>
            Dispatch official selection emails with login credentials and account creation links to selected candidates, verify corporate recruiters, and enforce zero-trust platform controls.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ background: "rgba(255, 255, 255, 0.08)", padding: "12px 18px", borderRadius: 12, border: "1px solid rgba(255, 255, 255, 0.15)" }}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>ENCRYPTION STATUS</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#4ade80", marginTop: 2 }}>HMAC-SHA256 JWT</div>
          </div>
          <div style={{ background: "rgba(255, 255, 255, 0.08)", padding: "12px 18px", borderRadius: 12, border: "1px solid rgba(255, 255, 255, 0.15)" }}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>DISPATCH SERVER</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#38bdf8", marginTop: 2 }}>SMTP / TLS 1.3 Live</div>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, marginBottom: 32 }}>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#eef2ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UsersIcon size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Registered Accounts</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{users.length}</div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BriefcaseIcon size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Active Job Postings</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{stats.active_jobs}</div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MailIcon size={22} color="#0066cc" />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Selected for Roles</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0066cc" }}>{selectedCandidates.length}</div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fdf4ff", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <SparklesIcon size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>AI Match Threshold</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#8b5cf6" }}>{stats.average_match_score}%</div>
          </div>
        </div>
      </div>

      {/* --- FEATURE 1: OFFICIAL CANDIDATE SELECTION & EMAIL DISPATCH CENTER --- */}
      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 32, border: "2px solid #0066cc", boxShadow: "0 10px 30px rgba(0, 102, 204, 0.12)" }}>
        <div style={{
          padding: "20px 24px",
          background: "linear-gradient(135deg, #0f2b48 0%, #0066cc 100%)",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12
        }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, background: "rgba(255,255,255,0.2)", padding: "3px 10px", borderRadius: 12, marginBottom: 4, textTransform: "uppercase" }}>
              <MailIcon size={13} color="#ffffff" />
              <span>OFFICIAL APPLICANT SELECTION & ONBOARDING DISPATCH</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>
              Candidates Selected for Roles — Send Account & Login Page Emails
            </h2>
            <p style={{ margin: "4px 0 0", color: "#bae6fd", fontSize: 13 }}>
              As Admin, click below to dispatch official selection letters with direct login URLs, account creation links, and security access PINs.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, background: "rgba(255, 255, 255, 0.18)", padding: "6px 14px", borderRadius: 10, fontWeight: 800 }}>
              {selectedCandidates.filter(c => c.emailSent).length} of {selectedCandidates.length} Emails Sent
            </span>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>
                <th style={{ padding: "14px 20px" }}>Selected Candidate</th>
                <th style={{ padding: "14px 20px" }}>Selected Role & Company</th>
                <th style={{ padding: "14px 20px" }}>AI Fit Score</th>
                <th style={{ padding: "14px 20px" }}>Hiring Stage</th>
                <th style={{ padding: "14px 20px" }}>Email Notification Status</th>
                <th style={{ padding: "14px 20px", textAlign: "right" }}>Admin Action</th>
              </tr>
            </thead>
            <tbody>
              {selectedCandidates.map((cand) => (
                <tr key={cand.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
                  {/* Candidate Info */}
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #0f2b48, #0066cc)",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        fontSize: 14
                      }}>
                        {cand.name[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: "#0f172a" }}>{cand.name}</div>
                        <div style={{ fontSize: 12, color: "#0066cc", fontWeight: 600 }}>{cand.email}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{cand.phone}</div>
                      </div>
                    </div>
                  </td>

                  {/* Role & Company */}
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ fontWeight: 700, color: "#1e293b", maxWidth: 280 }}>
                      {cand.job_title}
                    </div>
                    <div style={{ fontSize: 12, color: "#4f46e5", fontWeight: 700, marginTop: 2 }}>
                      {cand.company}
                    </div>
                  </td>

                  {/* Match Score */}
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#f0fdf4",
                      padding: "4px 10px",
                      borderRadius: 12,
                      border: "1px solid #86efac"
                    }}>
                      <span style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: "#10b981",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 900
                      }}>
                        ✓
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 900, color: "#15803d" }}>
                        {cand.match_score}% Match
                      </span>
                    </div>
                  </td>

                  {/* Hiring Stage Badge */}
                  <td style={{ padding: "16px 20px" }}>
                    <span className="badge badge-ppo" style={{ fontWeight: 800, fontSize: 11.5 }}>
                      🏆 {cand.status}
                    </span>
                  </td>

                  {/* Email Status */}
                  <td style={{ padding: "16px 20px" }}>
                    {cand.emailSent ? (
                      <div>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 11.5,
                          color: "#15803d",
                          fontWeight: 800,
                          background: "#dcfce7",
                          padding: "3px 10px",
                          borderRadius: 8
                        }}>
                          ✓ Dispatched
                        </span>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                          {cand.emailSentAt}
                        </div>
                      </div>
                    ) : (
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 11.5,
                        color: "#b45309",
                        fontWeight: 800,
                        background: "#fef3c7",
                        padding: "3px 10px",
                        borderRadius: 8
                      }}>
                        ⏳ Pending Dispatch
                      </span>
                    )}
                  </td>

                  {/* Action Button */}
                  <td style={{ padding: "16px 20px", textAlign: "right" }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleOpenEmailModal(cand)}
                      style={{
                        padding: "8px 16px",
                        fontSize: 12.5,
                        fontWeight: 800,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        background: cand.emailSent
                          ? "linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)"
                          : "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                        boxShadow: "0 4px 12px rgba(0, 102, 204, 0.25)"
                      }}
                    >
                      <MailIcon size={14} color="#ffffff" />
                      <span>{cand.emailSent ? "Resend Login Email" : "Send Selection & Login Email"}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- FEATURE 2: EMAIL DELIVERY OUTBOX & USER GOVERNANCE SPLIT --- */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24, marginBottom: 32 }}>
        {/* Dispatched Emails Delivery Stream */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MailIcon size={18} color="#0066cc" />
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Official Email Outbox & Delivery Log
              </h3>
            </div>
            <span style={{ fontSize: 11, background: "#dbeafe", color: "#1e40af", padding: "3px 10px", borderRadius: 8, fontWeight: 800 }}>
              TLS 1.3 Verified
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {emailDispatchLogs.map((log, idx) => (
              <div
                key={idx}
                style={{
                  background: "#f8fafc",
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 13.5 }}>
                      {log.candidateName} · <span style={{ color: "#0066cc" }}>{log.email}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#475569" }}>
                      Role: <strong>{log.role}</strong> ({log.company})
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11,
                    background: "#dcfce7",
                    color: "#15803d",
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: 6
                  }}>
                    ✓ {log.status}
                  </span>
                </div>

                <div style={{
                  fontSize: 12,
                  color: "#334155",
                  background: "#ffffff",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  marginBottom: 6
                }}>
                  <strong>Subject:</strong> {log.subject}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}>
                  <span>Security PIN: <code style={{ fontWeight: 700, color: "#0f2b48" }}>{log.securityPin}</code></span>
                  <span>Dispatched: {log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Audit Log */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <ShieldLockIcon size={18} color="#8b5cf6" />
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Live Security Event Stream
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {auditLogs.map((log, idx) => (
              <div key={idx} style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", marginBottom: 4 }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{log.time}</span>
                  <span style={{ background: log.severity === "success" ? "#ecfdf5" : "#eff6ff", color: log.severity === "success" ? "#047857" : "#1d4ed8", padding: "1px 6px", borderRadius: 4, fontWeight: 700, fontSize: 10 }}>
                    {log.ip}
                  </span>
                </div>
                <div style={{ color: "#1e293b", fontWeight: 600 }}>{log.event}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- FEATURE 3: USER ACCOUNTS & RECRUITER VERIFICATION TABLE --- */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>User Accounts & Verification</h2>
          <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>Control authentication credentials and organization verifications</p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                <th style={{ padding: "12px 18px" }}>User</th>
                <th style={{ padding: "12px 18px" }}>Contact (Email & Phone)</th>
                <th style={{ padding: "12px 18px" }}>Role</th>
                <th style={{ padding: "12px 18px" }}>Verification</th>
                <th style={{ padding: "12px 18px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{u.name}</div>
                    {u.company && <div style={{ fontSize: 11, color: "#0284c7" }}>{u.company}</div>}
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ color: "#334155" }}>{u.email}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{u.phone}</div>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <span className={`badge ${u.role === "recruiter" ? "badge-info" : u.role === "admin" ? "badge-warning" : "badge-primary"}`} style={{ fontSize: 11 }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    {u.verified ? (
                      <span style={{ color: "#10b981", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                        ✓ Verified
                      </span>
                    ) : (
                      <span style={{ color: "#f59e0b", fontWeight: 600, fontSize: 12 }}>
                        Pending
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "14px 18px", textAlign: "right" }}>
                    <button
                      onClick={() => toggleVerification(u.id)}
                      className="btn btn-secondary"
                      style={{ padding: "5px 12px", fontSize: 11.5, fontWeight: 700 }}
                    >
                      {u.verified ? "Revoke Access" : "Verify Recruiter"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Selection Email Dispatch Modal */}
      {activeModalCandidate && (
        <SelectionEmailModal
          candidate={activeModalCandidate}
          onClose={() => setActiveModalCandidate(null)}
          onSendSuccess={handleEmailSentSuccess}
        />
      )}
    </div>
  );
}
