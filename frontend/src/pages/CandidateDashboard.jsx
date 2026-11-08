import React, { useState, useEffect } from "react";
import { api, INITIAL_MOCK_JOBS } from "../services/api";
import AssignmentManager from "../components/AssignmentManager";
import AssessmentEngine from "../components/AssessmentEngine";
import VideoInterviewRoom from "../components/VideoInterviewRoom";

export default function CandidateDashboard({
  user,
  onNavigateJobs,
  onNavigateMatcher,
  onNavigateApplications,
  onNavigateInterviews,
  onNavigatePrep,
  onNavigateBuilder,
  onLogout
}) {
  const [activeSection, setActiveSection] = useState("overview");
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Interactive Sessions
  const [activeVideoRoom, setActiveVideoRoom] = useState(null);
  const [activeAssessmentId, setActiveAssessmentId] = useState(null);

  // Reschedule Modal
  const [rescheduleInt, setRescheduleInt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduling, setRescheduling] = useState(false);

  // Profile completion calculation state
  const [profileData, setProfileData] = useState({
    fullName: user?.name || "Candidate",
    email: user?.email || "candidate@example.com",
    phone: user?.phone || "+91 98765 43210",
    college: "National Institute of Technology (NIT)",
    degree: "B.Tech in Computer Science & Engineering",
    graduationYear: "2026",
    skills: user?.skills && user.skills.length > 0 ? user.skills : ["Python", "FastAPI", "React", "TypeScript", "Docker"],
    resumeUploaded: true,
    resumeName: "Candidate_ATS_Resume.pdf",
    certifications: ["AWS Certified Cloud Practitioner", "HackerRank 5-Star Problem Solving"],
    bio: "Passionate full-stack software engineer specializing in scalable Python APIs and responsive React applications."
  });

  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?.email]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [appsRes, jobsRes, savedRes, intRes, asmtRes] = await Promise.all([
        api.getApplications({ candidate_email: user?.email, candidate_id: user?.id }),
        api.getJobs({}),
        api.getSavedJobs().catch(() => []),
        api.getInterviews({ candidate_email: user?.email }).catch(() => []),
        api.listAssessments().catch(() => ({ assessments: [] }))
      ]);

      const userApps = Array.isArray(appsRes)
        ? appsRes.filter(a => a.candidate_email && user?.email && a.candidate_email.toLowerCase() === user.email.toLowerCase())
        : [];
      setApplications(userApps);

      if (Array.isArray(jobsRes) && jobsRes.length > 0) {
        setAllJobs(jobsRes);
      } else {
        setAllJobs(INITIAL_MOCK_JOBS);
      }

      if (Array.isArray(savedRes)) setSavedJobs(savedRes);
      if (Array.isArray(intRes)) setInterviews(intRes);
      if (asmtRes?.assessments) setAssessments(asmtRes.assessments);

    } catch (err) {
      console.warn("Failed to load candidate dashboard details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAttendance = async (intId) => {
    try {
      await api.confirmInterviewAttendance(intId);
      showToast("✓ Attendance confirmed! The hiring team has been notified.");
      loadDashboardData();
    } catch (err) {
      alert(err.message || "Could not confirm attendance");
    }
  };

  const handleRequestReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleInt) return;
    try {
      setRescheduling(true);
      await api.requestInterviewReschedule(rescheduleInt.id || rescheduleInt._id, rescheduleDate, rescheduleReason);
      showToast("✓ Reschedule request submitted to interviewer.");
      setRescheduleInt(null);
      setRescheduleDate("");
      setRescheduleReason("");
      loadDashboardData();
    } catch (err) {
      alert(err.message || "Could not submit reschedule request");
    } finally {
      setRescheduling(false);
    }
  };

  const handleWithdrawApp = async (appId) => {
    if (!window.confirm("Are you sure you want to withdraw this application? This action cannot be undone.")) return;
    try {
      await api.withdrawApplication(appId);
      showToast("✓ Application successfully withdrawn.");
      loadDashboardData();
    } catch (err) {
      alert(err.message || "Failed to withdraw application");
    }
  };

  const handleUnsaveJob = async (jobId) => {
    await api.unsaveJob(jobId);
    setSavedJobs(prev => prev.filter(j => j.id !== jobId));
    showToast("Job removed from saved bookmarks.");
  };

  // Compute profile readiness score
  const calculateProfileScore = () => {
    let score = 20;
    if (profileData.fullName) score += 10;
    if (profileData.email) score += 10;
    if (profileData.skills.length >= 3) score += 20;
    if (profileData.resumeUploaded) score += 20;
    if (profileData.college && profileData.degree) score += 10;
    if (profileData.certifications.length > 0) score += 10;
    return Math.min(score, 100);
  };

  const profileScore = calculateProfileScore();
  const totalAppsCount = applications.length;
  const shortlistedCount = applications.filter(a => a.status === "shortlisted" || a.status === "assignment_assigned").length;
  const interviewsCount = interviews.length;
  const selectedCount = applications.filter(a => a.status === "selected" || a.status === "hired").length;

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 20px 80px", display: "grid", gridTemplateColumns: "260px 1fr", gap: 28 }}>
      {/* Toast popup */}
      {toastMsg && (
        <div style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: "#0F172A",
          color: "#FFFFFF",
          padding: "12px 22px",
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          zIndex: 9999,
          fontSize: 13.5,
          fontWeight: 700,
          border: "1px solid #3157D5"
        }}>
          {toastMsg}
        </div>
      )}

      {/* Real WebRTC Video Call Overlay */}
      {activeVideoRoom && (
        <VideoInterviewRoom
          roomId={activeVideoRoom}
          userRole="candidate"
          userName={user?.name || "Candidate"}
          onExit={() => setActiveVideoRoom(null)}
        />
      )}

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="card" style={{ padding: "20px 14px", height: "fit-content", position: "sticky", top: 110 }}>
        {/* User Mini Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 10px 18px", borderBottom: "1px solid #E2E8F0" }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3157D5 0%, #7657E8 100%)",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: 18,
            boxShadow: "0 4px 12px rgba(49, 87, 213, 0.3)"
          }}>
            {profileData.fullName[0].toUpperCase()}
          </div>
          <div style={{ overflow: "hidden" }}>
            <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", margin: 0 }}>
              {profileData.fullName}
            </h4>
            <p style={{ fontSize: 11, color: "#64748B", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", margin: 0 }}>
              {profileData.email}
            </p>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 14 }}>
          {[
            { id: "overview", label: "Overview", icon: "📊" },
            { id: "assignments", label: "My Assignments", icon: "📁" },
            { id: "assessments", label: "Online Assessments", icon: "📝" },
            { id: "interviews_live", label: "Upcoming Interviews", icon: "📹" },
            { id: "results", label: "Interview Results", icon: "🏆" },
            { id: "applications", label: "My Applications", icon: "📋" },
            { id: "prep", label: "Interview Prep", icon: "🎙️", onClick: onNavigatePrep },
            { id: "career_assistant", label: "AI Career Assistant", icon: "🤖", onClick: onNavigateMatcher },
            { id: "saved", label: "Saved Jobs", icon: "❤️" },
            { id: "resume", label: "My Resume", icon: "📄" },
            { id: "profile", label: "Profile & Education", icon: "👤" }
          ].map((item) => {
            const isSelected = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                  } else {
                    setActiveSection(item.id);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: isSelected ? 800 : 600,
                  color: isSelected ? "#3157D5" : "#475569",
                  background: isSelected ? "#EEF2FF" : "transparent",
                  textAlign: "left",
                  width: "100%",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}

          <div style={{ height: 1, background: "#E2E8F0", margin: "10px 0" }} />

          <button
            onClick={onLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              color: "#EF4444",
              background: "transparent",
              textAlign: "left",
              width: "100%",
              border: "none",
              cursor: "pointer"
            }}
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <main>
        {/* Top Welcome Banner */}
        <div style={{
          background: "linear-gradient(135deg, #172554 0%, #3157D5 100%)",
          borderRadius: 22,
          padding: "26px 32px",
          color: "#FFFFFF",
          marginBottom: 24,
          boxShadow: "0 12px 32px rgba(49, 87, 213, 0.25)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20
        }}>
          <div>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255, 255, 255, 0.15)",
              padding: "4px 12px",
              borderRadius: 16,
              fontSize: 11.5,
              fontWeight: 800,
              marginBottom: 8,
              textTransform: "uppercase"
            }}>
              <span>⚡ TALENTAI CANDIDATE PORTAL</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
              Welcome back, {profileData.fullName.split(" ")[0]}!
            </h1>
            <p style={{ margin: 0, fontSize: 13.5, color: "rgba(255, 255, 255, 0.8)", maxWidth: 520, lineHeight: 1.5 }}>
              Track active applications, submit practical assignments, take timed assessments, and join live WebRTC interview rounds.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onNavigateJobs}
              style={{
                background: "#FFFFFF",
                color: "#172554",
                border: "none",
                borderRadius: 10,
                padding: "10px 18px",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer"
              }}
            >
              Browse 22+ Jobs
            </button>
            <button
              onClick={() => setActiveSection("assessments")}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                color: "#FFFFFF",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                borderRadius: 10,
                padding: "10px 18px",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer"
              }}
            >
              Take Online Assessment
            </button>
          </div>
        </div>

        {/* SECTION: OVERVIEW */}
        {activeSection === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              {[
                { label: "Total Applications", val: totalAppsCount, icon: "📋", color: "#3157D5", bg: "#EEF2FF" },
                { label: "Shortlisted Roles", val: shortlistedCount, icon: "⭐", color: "#7657E8", bg: "#F5F3FF" },
                { label: "Interviews Scheduled", val: interviewsCount, icon: "📹", color: "#0284C7", bg: "#F0F9FF" },
                { label: "Final Selections", val: selectedCount, icon: "🏆", color: "#10B981", bg: "#ECFDF5" }
              ].map((card, idx) => (
                <div key={idx} className="card" style={{ padding: "20px 22px", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: card.bg, color: card.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                    {card.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>{card.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", marginTop: 2 }}>{card.val}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Application Tracking & Readiness Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.9fr", gap: 24 }}>
              {/* Recent Applications */}
              <div className="card" style={{ padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                    Active Applications Tracking
                  </h3>
                  <button onClick={() => setActiveSection("applications")} style={{ border: "none", background: "none", color: "#3157D5", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    View All →
                  </button>
                </div>

                {applications.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px 16px", color: "#64748B", fontSize: 13 }}>
                    You have not submitted any applications yet.
                    <div style={{ marginTop: 12 }}>
                      <button onClick={onNavigateJobs} className="btn btn-primary" style={{ padding: "8px 18px", fontSize: 13 }}>
                        Browse Verified Openings
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {applications.slice(0, 3).map((app) => (
                      <div key={app.id} style={{ padding: "14px 16px", borderRadius: 12, border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>{app.job_title}</div>
                          <div style={{ fontSize: 12, color: "#64748B" }}>{app.company} · Applied: {new Date(app.applied_at).toLocaleDateString()}</div>
                        </div>
                        <span style={{ background: "#EEF2FF", color: "#3157D5", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>
                          {app.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Profile Readiness & Circular Score */}
              <div className="card" style={{ padding: "24px", textAlign: "center" }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 16, margin: 0 }}>
                  Profile Readiness Gauge
                </h3>
                <div style={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background: `conic-gradient(#3157D5 ${profileScore * 3.6}deg, #E2E8F0 0deg)`,
                  margin: "16px auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 16px rgba(49, 87, 213, 0.2)"
                }}>
                  <div style={{
                    width: 78,
                    height: 78,
                    borderRadius: "50%",
                    background: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column"
                  }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: "#3157D5" }}>{profileScore}%</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Ready</span>
                  </div>
                </div>
                <p style={{ fontSize: 12.5, color: "#64748B", margin: "0 0 14px" }}>
                  {profileScore >= 90 ? "Profile is fully optimized for top recruiter shortlists!" : "Complete all fields to boost your recruiter match rate."}
                </p>
                <button onClick={() => setActiveSection("profile")} className="btn btn-secondary" style={{ width: "100%", padding: "8px 14px", fontSize: 13 }}>
                  Update Profile Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: MY ASSIGNMENTS */}
        {activeSection === "assignments" && (
          <AssignmentManager userRole="candidate" userEmail={user?.email} onSelectJob={onNavigateJobs} />
        )}

        {/* SECTION: ONLINE ASSESSMENTS */}
        {activeSection === "assessments" && (
          <div>
            {activeAssessmentId ? (
              <AssessmentEngine
                assessmentId={activeAssessmentId}
                onFinish={() => {
                  setActiveAssessmentId(null);
                  loadDashboardData();
                }}
                onCancel={() => setActiveAssessmentId(null)}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="card" style={{ padding: "24px", background: "linear-gradient(135deg, #172554, #3157D5)", color: "#fff" }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>Online Automated Assessment System</h2>
                  <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
                    Take aptitude tests, technical quizzes, and live coding challenges with automated evaluation and instant scoring.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
                  {assessments.map((asmt) => (
                    <div key={asmt.id} className="card" style={{ padding: "22px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <span style={{ background: "#e0e7ff", color: "#3157D5", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
                            {asmt.category}
                          </span>
                          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                            ⏱️ {asmt.duration_minutes} mins
                          </span>
                        </div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>{asmt.title}</h3>
                        <p style={{ fontSize: 13, color: "#475569", margin: "0 0 16px", lineHeight: "1.5" }}>{asmt.description}</p>
                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
                          Passing Benchmark: <strong>{asmt.passing_score}%</strong> • Total Questions: {asmt.total_questions}
                        </div>

                        {asmt.latest_attempt && (
                          <div style={{ padding: "8px 12px", background: asmt.latest_attempt.passed ? "#dcfce7" : "#fee2e2", borderRadius: "8px", fontSize: "12px", marginBottom: "16px" }}>
                            Latest Score: <strong>{asmt.latest_attempt.score}%</strong> ({asmt.latest_attempt.passed ? "Passed" : "Needs Retake"})
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setActiveAssessmentId(asmt.id)}
                        className="btn btn-primary"
                        style={{ width: "100%", padding: "10px", fontSize: "13px" }}
                      >
                        {asmt.latest_attempt ? "Retake Assessment ➔" : "Start Timed Assessment ➔"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION: UPCOMING INTERVIEWS (Face-to-Face & Online Video) */}
        {activeSection === "interviews_live" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card" style={{ padding: "24px", background: "linear-gradient(135deg, #172554, #3157D5)", color: "#fff" }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>My Scheduled Interview Rounds</h2>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
                Confirm attendance, request rescheduling, and join live encrypted WebRTC video interview sessions.
              </p>
            </div>

            {interviews.length === 0 ? (
              <div className="card" style={{ padding: "48px 24px", textAlign: "center", color: "#64748b" }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>📅</div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>No Scheduled Interviews</h3>
                <p style={{ fontSize: "13px", maxWidth: "400px", margin: "0 auto" }}>
                  When recruiters shortlist your profile or assignments, scheduled interview slots will appear here with calendar links.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 20 }}>
                {interviews.map((int) => {
                  const isF2F = int.interview_type === "face_to_face";
                  return (
                    <div key={int.id} className="card" style={{ padding: "22px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                          <span style={{
                            background: isF2F ? "#ccfbf1" : "#e0e7ff",
                            color: isF2F ? "#0f766e" : "#3157D5",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "700"
                          }}>
                            {isF2F ? "🏢 IN-PERSON FACE-TO-FACE" : "📹 ENCRYPTED WEBRTC VIDEO"}
                          </span>
                          <span style={{
                            background: int.status === "confirmed" ? "#dcfce7" : (int.status === "reschedule_requested" ? "#fef3c7" : "#f1f5f9"),
                            color: int.status === "confirmed" ? "#166534" : (int.status === "reschedule_requested" ? "#92400e" : "#475569"),
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "700"
                          }}>
                            {int.status.replace("_", " ").toUpperCase()}
                          </span>
                        </div>

                        <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>{int.round}</h3>
                        <div style={{ fontSize: 13, color: "#3157D5", fontWeight: "600", marginBottom: 12 }}>{int.job_title}</div>

                        <div style={{ fontSize: 13, color: "#475569", display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                          <div><strong>Date & Time:</strong> {int.scheduled_date} ({int.duration_minutes} mins)</div>
                          <div><strong>Interviewer:</strong> {int.interviewer} ({int.interviewer_email || "Hiring Lead"})</div>
                          {isF2F ? (
                            <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                              <div><strong>Location:</strong> {int.company_location}</div>
                              <div style={{ marginTop: 2 }}><strong>Office Address:</strong> {int.office_address}</div>
                              <div style={{ marginTop: 2 }}><strong>Reception Phone:</strong> {int.contact_phone}</div>
                            </div>
                          ) : (
                            <div><strong>Room ID:</strong> <code>{int.meeting_room_id}</code></div>
                          )}
                          {int.instructions && (
                            <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>
                              Note: {int.instructions}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ paddingTop: 14, borderTop: "1px solid #f1f5f9", display: "flex", gap: 10 }}>
                        {!isF2F ? (
                          <button
                            onClick={() => setActiveVideoRoom(int.meeting_room_id || "room-default")}
                            className="btn btn-primary"
                            style={{ flex: 1, padding: "10px", fontSize: "13px" }}
                          >
                            📹 Join Live Video Room
                          </button>
                        ) : (
                          int.status !== "confirmed" ? (
                            <button
                              onClick={() => handleConfirmAttendance(int.id)}
                              className="btn btn-primary"
                              style={{ flex: 1, padding: "10px", fontSize: "13px" }}
                            >
                              ✓ Confirm Attendance
                            </button>
                          ) : (
                            <button disabled style={{ flex: 1, background: "#ecfdf5", color: "#166534", border: "none", borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: "700" }}>
                              ✓ Attendance Confirmed
                            </button>
                          )
                        )}

                        <button
                          onClick={() => {
                            setRescheduleInt(int);
                            setRescheduleDate("");
                            setRescheduleReason("");
                          }}
                          className="btn btn-secondary"
                          style={{ padding: "10px 14px", fontSize: "13px" }}
                        >
                          Request Reschedule
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SECTION: INTERVIEW RESULTS & EVALUATIONS */}
        {activeSection === "results" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card" style={{ padding: "24px", background: "linear-gradient(135deg, #172554, #3157D5)", color: "#fff" }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>Formal Interview Results & Evaluations</h2>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
                View detailed feedback, 6-criteria score cards, and hiring outcomes recorded by engineering interviewers.
              </p>
            </div>

            {interviews.filter(i => i.evaluation).length === 0 ? (
              <div className="card" style={{ padding: "48px 24px", textAlign: "center", color: "#64748b" }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>🏆</div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>No Evaluations Completed Yet</h3>
                <p style={{ fontSize: "13px", maxWidth: "420px", margin: "0 auto" }}>
                  After your scheduled interviews conclude, the hiring committee's formal evaluations and recommendations will be displayed here.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {interviews.filter(i => i.evaluation).map((int) => {
                  const ev = int.evaluation;
                  return (
                    <div key={int.id} className="card" style={{ padding: "24px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                        <div>
                          <span style={{ background: "#e0e7ff", color: "#3157D5", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>
                            VERIFIED EVALUATION
                          </span>
                          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "6px 0 2px" }}>{int.round}</h3>
                          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{int.job_title} • Evaluated by: {ev.evaluated_by}</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 28, fontWeight: 900, color: ev.composite_score >= 70 ? "#10b981" : "#ef4444" }}>
                            {ev.composite_score}%
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                            {ev.recommendation.replace("_", " ")}
                          </span>
                        </div>
                      </div>

                      {/* Criteria Scores Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 18 }}>
                        {[
                          { name: "Technical Knowledge", val: ev.technical_knowledge },
                          { name: "Communication Skills", val: ev.communication_skills },
                          { name: "Problem Solving", val: ev.problem_solving },
                          { name: "Practical Experience", val: ev.practical_knowledge },
                          { name: "Project Explanation", val: ev.project_explanation },
                          { name: "Role Suitability", val: ev.role_suitability }
                        ].map((c, cIdx) => (
                          <div key={cIdx} style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{c.name}</div>
                            <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>{c.val} / 10</div>
                          </div>
                        ))}
                      </div>

                      {ev.detailed_comments && (
                        <div style={{ background: "#f1f5f9", padding: "12px 16px", borderRadius: "8px", fontSize: "13px", color: "#334155" }}>
                          <strong>Interviewer Feedback:</strong> "{ev.detailed_comments}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SECTION: MY APPLICATIONS (With Withdraw Action) */}
        {activeSection === "applications" && (
          <div className="card" style={{ padding: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                  My Submitted Applications ({applications.length})
                </h2>
                <p style={{ color: "#64748B", fontSize: 13.5, margin: "4px 0 0" }}>
                  Monitor your recruitment stages, view match breakdowns, and manage submissions.
                </p>
              </div>
              <button onClick={onNavigateJobs} className="btn btn-primary" style={{ padding: "8px 16px", fontSize: 13 }}>
                Apply to More Jobs
              </button>
            </div>

            {applications.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 16px", color: "#64748B" }}>
                <span style={{ fontSize: 32 }}>📋</span>
                <p style={{ fontSize: 14, marginTop: 12 }}>You have no active applications.</p>
                <button onClick={onNavigateJobs} className="btn btn-secondary" style={{ marginTop: 14, padding: "8px 18px", fontSize: 13 }}>
                  Browse Job Board
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {applications.map((app) => (
                  <div
                    key={app.id}
                    style={{
                      padding: "20px 24px",
                      borderRadius: 14,
                      border: "1px solid #E2E8F0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 16
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <h4 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: 0 }}>{app.job_title}</h4>
                        <span style={{
                          background: app.status === "withdrawn" ? "#f1f5f9" : "#EEF2FF",
                          color: app.status === "withdrawn" ? "#64748b" : "#3157D5",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700"
                        }}>
                          {app.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>
                        {app.company} · Applied: {new Date(app.applied_at).toLocaleDateString()} · AI Match: <strong>{app.match_score}%</strong>
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      {app.status !== "withdrawn" && (
                        <button
                          onClick={() => handleWithdrawApp(app.id)}
                          style={{
                            background: "transparent",
                            border: "1px solid #fca5a5",
                            color: "#ef4444",
                            borderRadius: "8px",
                            padding: "8px 14px",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer"
                          }}
                        >
                          Withdraw Application
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION: MY RESUME */}
        {activeSection === "resume" && (
          <div className="card" style={{ padding: "32px" }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>
              Manage Candidate Resume
            </h2>
            <p style={{ color: "#64748B", fontSize: 14, marginBottom: 24 }}>
              Upload, view, or replace your primary resume used for 1-click ATS applications.
            </p>
            <div style={{
              padding: "24px",
              border: "2px dashed #3157D5",
              borderRadius: 16,
              background: "#EEF2FF",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>{profileData.resumeName}</h4>
                <p style={{ fontSize: 12, color: "#3157D5", fontWeight: 600, margin: 0 }}>Active Primary Resume · Verified ATS Format</p>
              </div>
              <button onClick={onNavigateBuilder} className="btn btn-primary" style={{ padding: "8px 16px", fontSize: 13 }}>
                Open ATS Builder
              </button>
            </div>
          </div>
        )}

        {/* SECTION: SAVED JOBS */}
        {activeSection === "saved" && (
          <div className="card" style={{ padding: "32px" }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 16 }}>Saved Bookmarks ({savedJobs.length})</h2>
            {savedJobs.length === 0 ? (
              <p style={{ color: "#64748b" }}>You haven't saved any jobs yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {savedJobs.map(j => (
                  <div key={j.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{j.title}</h4>
                      <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{j.company} • {j.location}</p>
                    </div>
                    <button onClick={() => handleUnsaveJob(j.id)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION: PROFILE & EDUCATION */}
        {activeSection === "profile" && (
          <div className="card" style={{ padding: "32px" }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>Candidate Profile & Education</h2>
            <form onSubmit={(e) => { e.preventDefault(); showToast("Profile saved!"); }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 4 }}>Full Name</label>
                  <input type="text" value={profileData.fullName} onChange={e => setProfileData({ ...profileData, fullName: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #cbd5e1" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 4 }}>Email</label>
                  <input type="email" disabled value={profileData.email} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f1f5f9" }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 4 }}>Skills (Comma Separated)</label>
                <input type="text" value={profileData.skills.join(", ")} onChange={e => setProfileData({ ...profileData, skills: e.target.value.split(",").map(s => s.trim()) })} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #cbd5e1" }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start", padding: "10px 20px" }}>Save Profile</button>
            </form>
          </div>
        )}
      </main>

      {/* Reschedule Request Modal */}
      {rescheduleInt && (
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
          <div style={{ background: "#fff", borderRadius: 16, width: 480, maxWidth: "90vw", padding: 26 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px" }}>Request Reschedule</h3>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>{rescheduleInt.round} with {rescheduleInt.interviewer}</p>
            <form onSubmit={handleRequestReschedule} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>Preferred Date & Time *</label>
                <input type="text" required placeholder="e.g. Next Thursday, 3:00 PM EST" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #cbd5e1" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>Reason for Rescheduling *</label>
                <textarea rows={3} required placeholder="Explain scheduling conflict..." value={rescheduleReason} onChange={e => setRescheduleReason(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #cbd5e1" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setRescheduleInt(null)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={rescheduling} style={{ background: "#3157D5", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 700, cursor: "pointer" }}>{rescheduling ? "Sending..." : "Submit Request"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
