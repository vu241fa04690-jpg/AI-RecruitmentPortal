import React, { useState, useEffect } from "react";
import {
  SparklesIcon,
  BriefcaseIcon,
  FileTextIcon,
  CalendarIcon,
  UsersIcon,
  BrainIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowUpRightIcon,
  ShieldLockIcon,
  AlertCircleIcon
} from "../components/Icons";
import { api, INITIAL_MOCK_JOBS } from "../services/api";

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
  const [loading, setLoading] = useState(true);

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
    let isMounted = true;
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [appsRes, jobsRes, savedRes] = await Promise.all([
          api.getApplications({ candidate_email: user?.email, candidate_id: user?.id }),
          api.getJobs({}),
          api.getSavedJobs().catch(() => [])
        ]);

        if (isMounted) {
          const userApps = Array.isArray(appsRes)
            ? appsRes.filter(a => a.candidate_email && user?.email && a.candidate_email.toLowerCase() === user.email.toLowerCase())
            : [];
          setApplications(userApps);

          if (Array.isArray(jobsRes) && jobsRes.length > 0) {
            setAllJobs(jobsRes);
          } else {
            setAllJobs(INITIAL_MOCK_JOBS);
          }

          if (Array.isArray(savedRes)) {
            setSavedJobs(savedRes);
          }
        }
      } catch (err) {
        console.warn("Dashboard sync warning:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadDashboardData();
    return () => { isMounted = false; };
  }, [user?.email, user?.id]);

  // Dynamic statistics
  const totalAppsCount = applications.length;
  const shortlistedCount = applications.filter(a => ["shortlisted", "interview_scheduled", "accepted"].includes(a.status)).length;
  const interviewsCount = applications.filter(a => a.status === "interview_scheduled").length;
  const selectedCount = applications.filter(a => a.status === "accepted").length;

  // Profile completion score calculator
  const calculateProfileScore = () => {
    let score = 0;
    if (profileData.fullName) score += 15;
    if (profileData.email) score += 15;
    if (profileData.phone) score += 10;
    if (profileData.college && profileData.degree) score += 20;
    if (profileData.skills.length >= 3) score += 20;
    if (profileData.resumeUploaded) score += 20;
    return Math.min(100, score);
  };

  const profileScore = calculateProfileScore();

  // AI Recommended Jobs: score candidates against active jobs
  const recommendedJobs = allJobs.slice(0, 4).map((job, idx) => {
    const candidateSkills = profileData.skills || [];
    const matched = (job.skills || []).filter(s =>
      candidateSkills.some(cs => cs.toLowerCase() === s.toLowerCase())
    );
    const matchScore = Math.min(98, Math.max(72, Math.round((matched.length / Math.max(1, job.skills.length)) * 100) + 15));
    return {
      ...job,
      aiMatchScore: matchScore,
      matchedSkills: matched
    };
  }).sort((a, b) => b.aiMatchScore - a.aiMatchScore);

  const handleRemoveResume = () => {
    setProfileData(prev => ({ ...prev, resumeUploaded: false, resumeName: "" }));
    showToast("Resume removed. Upload an updated resume to recalculate match scores.");
  };

  const handleFakeResumeUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileData(prev => ({
        ...prev,
        resumeUploaded: true,
        resumeName: file.name
      }));
      showToast(`✓ Uploaded "${file.name}"! AI parsing completed.`);
    }
  };

  const handleUnsaveJob = async (jobId) => {
    await api.unsaveJob(jobId);
    setSavedJobs(prev => prev.filter(j => j.id !== jobId));
    showToast("Job removed from saved bookmarks.");
  };

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
            <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
              {profileData.fullName}
            </h4>
            <p style={{ fontSize: 11, color: "#64748B", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
              {profileData.email}
            </p>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 14 }}>
          {[
            { id: "overview", label: "Overview", icon: "📊" },
            { id: "profile", label: "My Profile", icon: "👤" },
            { id: "resume", label: "My Resume", icon: "📄" },
            { id: "jobs", label: "Find Jobs", icon: "💼", onClick: onNavigateJobs },
            { id: "recommended", label: "Recommended Jobs", icon: "⭐" },
            { id: "saved", label: "Saved Jobs", icon: "❤️" },
            { id: "applications", label: "My Applications", icon: "📋", onClick: onNavigateApplications },
            { id: "career_assistant", label: "AI Career Assistant", icon: "🤖", onClick: onNavigateMatcher },
            { id: "prep", label: "Interview Prep", icon: "🎙️", onClick: onNavigatePrep },
            { id: "interviews", label: "My Interviews", icon: "📅", onClick: onNavigateInterviews },
            { id: "builder", label: "ATS Resume Builder", icon: "✏️", onClick: onNavigateBuilder }
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
                  fontSize: 13.5,
                  fontWeight: isSelected ? 800 : 600,
                  color: isSelected ? "#3157D5" : "#475569",
                  background: isSelected ? "#EEF2FF" : "transparent",
                  textAlign: "left",
                  width: "100%",
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
              width: "100%"
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
          padding: "30px 34px",
          color: "#FFFFFF",
          marginBottom: 26,
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
              marginBottom: 10,
              textTransform: "uppercase"
            }}>
              <span>⚡ CANDIDATE HUB</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>
              Welcome Back, {profileData.fullName}! 👋
            </h1>
            <p style={{ fontSize: 14, color: "#E0E7FF", maxWidth: 540, lineHeight: 1.5 }}>
              Your profile is matched with {recommendedJobs.length} top tech openings today. Check your active applications and upcoming assessments below.
            </p>
          </div>

          {/* Quick Action Button */}
          <button
            onClick={onNavigateJobs}
            className="btn btn-primary"
            style={{
              background: "#FFFFFF",
              color: "#172554",
              fontWeight: 800,
              padding: "12px 22px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)"
            }}
          >
            Explore Open Jobs →
          </button>
        </div>

        {/* 4 OVERVIEW STATISTIC CARDS */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 18,
          marginBottom: 26
        }}>
          <div className="card" style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#64748B" }}>Total Applications</span>
              <span style={{ fontSize: 20 }}>📋</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#0F172A", marginTop: 8 }}>
              {totalAppsCount}
            </div>
            <div style={{ fontSize: 11.5, color: "#3157D5", fontWeight: 700, marginTop: 4 }}>
              Active in pipeline
            </div>
          </div>

          <div className="card" style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#64748B" }}>Shortlisted</span>
              <span style={{ fontSize: 20 }}>★</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#7657E8", marginTop: 8 }}>
              {shortlistedCount}
            </div>
            <div style={{ fontSize: 11.5, color: "#7657E8", fontWeight: 700, marginTop: 4 }}>
              Review rounds cleared
            </div>
          </div>

          <div className="card" style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#64748B" }}>Interviews Scheduled</span>
              <span style={{ fontSize: 20 }}>📅</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#10B981", marginTop: 8 }}>
              {interviewsCount}
            </div>
            <div style={{ fontSize: 11.5, color: "#10B981", fontWeight: 700, marginTop: 4 }}>
              Technical rounds live
            </div>
          </div>

          <div className="card" style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#64748B" }}>Offers / Selected</span>
              <span style={{ fontSize: 20 }}>🏆</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#F59E0B", marginTop: 8 }}>
              {selectedCount}
            </div>
            <div style={{ fontSize: 11.5, color: "#F59E0B", fontWeight: 700, marginTop: 4 }}>
              Pre-Placement Offers
            </div>
          </div>
        </div>

        {/* SECTION SWITCHER: OVERVIEW */}
        {activeSection === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
            {/* Left Column: Recommended Jobs & Application Tracking */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* A. Recommended Jobs */}
              <div className="card" style={{ padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>
                      AI-Recommended Jobs
                    </h3>
                    <p style={{ fontSize: 12.5, color: "#64748B" }}>
                      Matched to your skills ({profileData.skills.slice(0, 3).join(", ")})
                    </p>
                  </div>
                  <button
                    onClick={onNavigateJobs}
                    style={{ border: "none", background: "none", color: "#3157D5", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    View All →
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {recommendedJobs.map((job) => (
                    <div
                      key={job.id}
                      style={{
                        padding: "16px 18px",
                        borderRadius: 14,
                        border: "1px solid #E2E8F0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                        background: "#F8FAFC"
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14.5, fontWeight: 800, color: "#0F172A" }}>{job.title}</span>
                          <span className="badge badge-success" style={{ fontSize: 11 }}>
                            {job.aiMatchScore}% Match
                          </span>
                        </div>
                        <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 3 }}>
                          {job.company} · {job.location} · <strong style={{ color: "#0F172A" }}>{job.stipend_or_salary}</strong>
                        </div>
                      </div>

                      <button
                        onClick={onNavigateJobs}
                        className="btn btn-primary"
                        style={{ padding: "7px 16px", fontSize: 12.5 }}
                      >
                        Apply Now
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* B. Real-time Application Tracking */}
              <div className="card" style={{ padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>
                    Recent Application Tracking
                  </h3>
                  <button
                    onClick={onNavigateApplications}
                    style={{ border: "none", background: "none", color: "#3157D5", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    View Full Tracker →
                  </button>
                </div>

                {applications.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 16px", color: "#64748B", fontSize: 13 }}>
                    You haven't submitted any job applications yet.
                    <div style={{ marginTop: 12 }}>
                      <button onClick={onNavigateJobs} className="btn btn-primary" style={{ padding: "8px 18px", fontSize: 13 }}>
                        Browse Openings & Apply
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {applications.slice(0, 3).map((app) => (
                      <div
                        key={app.id}
                        style={{
                          padding: "14px 16px",
                          borderRadius: 12,
                          border: "1px solid #E2E8F0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>{app.job_title}</div>
                          <div style={{ fontSize: 12, color: "#64748B" }}>{app.company} · Applied: {new Date(app.applied_at).toLocaleDateString()}</div>
                        </div>
                        <span className="badge badge-primary">
                          {app.status === "interview_scheduled" ? "Assessment Live" : app.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Profile Completion, AI Insights, Upcoming Interviews */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* C. Profile Completion Circular Progress */}
              <div className="card" style={{ padding: "24px", textAlign: "center" }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 16 }}>
                  Profile Readiness Score
                </h3>

                {/* Circular indicator representation */}
                <div style={{
                  width: 110,
                  height: 110,
                  borderRadius: "50%",
                  background: `conic-gradient(#3157D5 ${profileScore * 3.6}deg, #E2E8F0 0deg)`,
                  margin: "0 auto 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 16px rgba(49, 87, 213, 0.2)"
                }}>
                  <div style={{
                    width: 86,
                    height: 86,
                    borderRadius: "50%",
                    background: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column"
                  }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: "#3157D5" }}>{profileScore}%</span>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Complete</span>
                  </div>
                </div>

                <p style={{ fontSize: 12.5, color: "#64748B", marginBottom: 14 }}>
                  {profileScore >= 90 ? "Your profile is fully optimized for top recruiter discovery!" : "Complete education & skills to boost recruiter shortlists."}
                </p>

                <button
                  onClick={() => setActiveSection("profile")}
                  className="btn btn-secondary"
                  style={{ width: "100%", padding: "8px 14px", fontSize: 13 }}
                >
                  Edit Profile & Skills
                </button>
              </div>

              {/* D. AI Career Insights */}
              <div className="card" style={{ padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <SparklesIcon size={18} color="#7657E8" />
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
                    AI Career Recommendations
                  </h3>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5, color: "#475569" }}>
                  <div style={{ padding: "10px 12px", background: "#F8FAFC", borderRadius: 10, borderLeft: "3px solid #3157D5" }}>
                    💡 <strong>Skill Tip:</strong> Adding <em>Docker & Kubernetes</em> to your resume will boost Full-Stack match rates by <strong>+18%</strong>.
                  </div>
                  <div style={{ padding: "10px 12px", background: "#F8FAFC", borderRadius: 10, borderLeft: "3px solid #7657E8" }}>
                    🎙️ <strong>Interview Prep:</strong> Practice Round 2 STAR answers for System Architecture in our AI Simulator.
                  </div>
                </div>

                <button
                  onClick={onNavigatePrep}
                  className="btn btn-outline-primary"
                  style={{ width: "100%", marginTop: 14, padding: "8px 12px", fontSize: 12.5 }}
                >
                  Launch Mock Interview Prep →
                </button>
              </div>

              {/* E. Upcoming Interviews */}
              <div className="card" style={{ padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <CalendarIcon size={18} color="#10B981" />
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
                    Upcoming Interview Rounds
                  </h3>
                </div>

                {interviewsCount === 0 ? (
                  <div style={{ fontSize: 12.5, color: "#64748B", textAlign: "center", padding: "12px 0" }}>
                    No interviews scheduled yet. Keep applying to active roles!
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ padding: "10px 12px", background: "#ECFDF5", borderRadius: 10, border: "1px solid #A7F3D0" }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#065F46" }}>Round 2: Technical Live Coding</div>
                      <div style={{ fontSize: 11.5, color: "#047857", marginTop: 2 }}>CognitiveFlow Technologies · Tomorrow, 2:00 PM EST</div>
                      <a
                        href="https://meet.google.com"
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: "inline-block", marginTop: 8, fontSize: 12, fontWeight: 700, color: "#3157D5" }}
                      >
                        Join Meeting Link →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SECTION SWITCHER: MY RESUME */}
        {activeSection === "resume" && (
          <div className="card" style={{ padding: "32px" }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>
              Manage Candidate Resume
            </h2>
            <p style={{ color: "#64748B", fontSize: 14, marginBottom: 24 }}>
              Upload, view, or replace your primary resume used for 1-click ATS applications.
            </p>

            {profileData.resumeUploaded ? (
              <div style={{
                padding: "24px",
                border: "2px dashed #3157D5",
                borderRadius: 16,
                background: "#EEF2FF",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ fontSize: 32 }}>📄</div>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>{profileData.resumeName}</h4>
                    <p style={{ fontSize: 12, color: "#3157D5", fontWeight: 600 }}>Active Primary Resume · Verified ATS Format</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={onNavigateBuilder} className="btn btn-secondary" style={{ padding: "8px 16px", fontSize: 13 }}>
                    Edit in ATS Builder
                  </button>
                  <button onClick={handleRemoveResume} className="btn btn-secondary" style={{ padding: "8px 16px", fontSize: 13, color: "#EF4444" }}>
                    Delete Resume
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                padding: "40px 24px",
                border: "2px dashed #CBD5E1",
                borderRadius: 16,
                textAlign: "center"
              }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📤</div>
                <h4 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>
                  Upload Your Resume (PDF or DOCX)
                </h4>
                <p style={{ fontSize: 13, color: "#64748B", maxWidth: 440, margin: "0 auto 20px" }}>
                  Upload your existing resume to automatically parse technical skills, experience, and calculate role match percentages.
                </p>

                <label className="btn btn-primary" style={{ padding: "10px 22px", cursor: "pointer" }}>
                  Choose Resume File
                  <input type="file" accept=".pdf,.docx" onChange={handleFakeResumeUpload} style={{ display: "none" }} />
                </label>
              </div>
            )}
          </div>
        )}

        {/* SECTION SWITCHER: SAVED JOBS */}
        {activeSection === "saved" && (
          <div className="card" style={{ padding: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>
                  Bookmarked / Saved Jobs ({savedJobs.length})
                </h2>
                <p style={{ color: "#64748B", fontSize: 13.5 }}>
                  Positions you've saved to apply for later.
                </p>
              </div>
              <button onClick={onNavigateJobs} className="btn btn-primary" style={{ padding: "8px 16px", fontSize: 13 }}>
                Find More Jobs
              </button>
            </div>

            {savedJobs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 16px", color: "#64748B" }}>
                <span style={{ fontSize: 32 }}>❤️</span>
                <p style={{ fontSize: 14, marginTop: 12 }}>You have no saved jobs yet.</p>
                <button onClick={onNavigateJobs} className="btn btn-secondary" style={{ marginTop: 14, padding: "8px 18px", fontSize: 13 }}>
                  Browse Job Board
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {savedJobs.map((job) => (
                  <div
                    key={job.id}
                    style={{
                      padding: "18px 20px",
                      borderRadius: 14,
                      border: "1px solid #E2E8F0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>{job.title}</h4>
                      <p style={{ fontSize: 13, color: "#64748B" }}>{job.company} · {job.location} · <strong>{job.stipend_or_salary}</strong></p>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={onNavigateJobs} className="btn btn-primary" style={{ padding: "7px 16px", fontSize: 12.5 }}>
                        Apply Now
                      </button>
                      <button onClick={() => handleUnsaveJob(job.id)} className="btn btn-secondary" style={{ padding: "7px 12px", fontSize: 12.5, color: "#EF4444" }}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION SWITCHER: MY PROFILE */}
        {activeSection === "profile" && (
          <div className="card" style={{ padding: "32px" }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>
              Candidate Profile & Education Details
            </h2>
            <p style={{ color: "#64748B", fontSize: 13.5, marginBottom: 24 }}>
              Keep your contact and academic background current for recruiter shortlists.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); showToast("Profile updated successfully!"); }} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", marginBottom: 6, display: "block" }}>Full Name</label>
                  <input
                    type="text"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 13.5 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", marginBottom: 6, display: "block" }}>Email Address</label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #E2E8F0", background: "#F1F5F9", fontSize: 13.5, color: "#64748B" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", marginBottom: 6, display: "block" }}>University / College</label>
                  <input
                    type="text"
                    value={profileData.college}
                    onChange={(e) => setProfileData({ ...profileData, college: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 13.5 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", marginBottom: 6, display: "block" }}>Degree & Graduation Year</label>
                  <input
                    type="text"
                    value={`${profileData.degree} (${profileData.graduationYear})`}
                    onChange={(e) => setProfileData({ ...profileData, degree: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 13.5 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", marginBottom: 6, display: "block" }}>
                  Technical Skills (Comma separated)
                </label>
                <input
                  type="text"
                  value={profileData.skills.join(", ")}
                  onChange={(e) => setProfileData({ ...profileData, skills: e.target.value.split(",").map(s => s.trim()) })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 13.5 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", marginBottom: 6, display: "block" }}>Professional Bio</label>
                <textarea
                  rows={3}
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 13.5 }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start", padding: "10px 24px" }}>
                Save Profile Changes
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
