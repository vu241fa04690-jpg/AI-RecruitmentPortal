import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import JobBoard from "./pages/JobBoard";
import ResumeMatcher from "./pages/ResumeMatcher";
import ApplicationsView from "./pages/ApplicationsView";
import InterviewsView from "./pages/InterviewsView";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import InterviewPrep from "./pages/InterviewPrep";
import ResumeBuilder from "./pages/ResumeBuilder";
import AuthPage from "./pages/AuthPage";
import ApplicationModal from "./components/ApplicationModal";
import PostJobModal from "./components/PostJobModal";
import ScheduleInterviewModal from "./components/ScheduleInterviewModal";
import AIAgentCopilot from "./components/AIAgentCopilot";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { api } from "./services/api";

function MainApp() {
  const { user, logout, switchDemoRole } = useAuth();
  const [activeTab, setActiveTab] = useState("jobs");
  const [backendStatus, setBackendStatus] = useState({ connected: false });
  const [matcherTargetJob, setMatcherTargetJob] = useState(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  // Modals state
  const [authConfig, setAuthConfig] = useState({ isOpen: false, mode: "login" });
  const [applyingJob, setApplyingJob] = useState(null);
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [schedulingApp, setSchedulingApp] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const userRole = user?.role || "candidate";

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    const status = await api.checkHealth();
    setBackendStatus(status);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApplySuccess = (newApp) => {
    showToast(`Application submitted with ${newApp.match_score}% AI Match rating!`);
  };

  const handlePostJobSuccess = (newJob) => {
    showToast(`Opportunity "${newJob.title}" posted successfully!`);
  };

  const handleScheduleSuccess = (newInt) => {
    showToast(`Interview scheduled for ${newInt.scheduled_date}!`);
  };

  const handleSelectJobForMatcher = (job) => {
    setMatcherTargetJob(job);
    setActiveTab("matcher");
  };

  const handleRoleChange = (newRole) => {
    switchDemoRole(newRole);
    if (newRole === "recruiter") {
      setActiveTab("recruiter-dashboard");
    } else if (newRole === "admin") {
      setActiveTab("admin-dashboard");
    } else {
      setActiveTab("jobs");
    }
    showToast(`Switched view to ${newRole.toUpperCase()} mode.`);
  };

  const handleRequireAuth = (mode = "login", targetJob = null) => {
    setAuthConfig({ isOpen: true, mode });
    if (targetJob) {
      setApplyingJob(targetJob);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f4f6fa" }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: "#1c4980",
          color: "#ffffff",
          padding: "12px 22px",
          borderRadius: 12,
          boxShadow: "0 10px 25px rgba(28, 73, 128, 0.4)",
          fontSize: 14,
          fontWeight: 700,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: 10,
          border: "1px solid #3b82f6"
        }}>
          <span style={{ color: "#38bdf8" }}>⚡</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Unstop Inspired Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        userRole={userRole}
        setUserRole={handleRoleChange}
        backendStatus={backendStatus}
        onOpenPostJob={() => {
          if (!user) {
            handleRequireAuth("login");
          } else {
            setIsPostJobOpen(true);
          }
        }}
        onOpenAuth={(mode = "login") => handleRequireAuth(mode)}
        onLogout={() => {
          logout();
          showToast("Signed out. Switched to guest mode.");
        }}
      />

      {/* Active Tab View */}
      <main style={{ flex: 1 }}>
        {activeTab === "jobs" && (
          <JobBoard
            initialCategory="all"
            user={user}
            onRequireAuth={(mode = "login") => handleRequireAuth(mode)}
            onApplyJob={(job) => setApplyingJob(job)}
            onSelectJobForMatcher={handleSelectJobForMatcher}
          />
        )}

        {activeTab === "internships" && (
          <JobBoard
            initialCategory="internship"
            user={user}
            onRequireAuth={(mode = "login") => handleRequireAuth(mode)}
            onApplyJob={(job) => setApplyingJob(job)}
            onSelectJobForMatcher={handleSelectJobForMatcher}
          />
        )}

        {activeTab === "matcher" && (
          <ResumeMatcher
            preselectedJob={matcherTargetJob}
            user={user}
            onRequireAuth={handleRequireAuth}
            onViewApplications={() => setActiveTab("applications")}
          />
        )}

        {activeTab === "applications" && (
          <ApplicationsView
            user={user}
            onNavigateInterviews={() => setActiveTab("interviews")}
            onNavigateJobs={() => setActiveTab("jobs")}
          />
        )}

        {activeTab === "interviews" && (
          <InterviewsView
            user={user}
          />
        )}

        {activeTab === "prep" && (
          <InterviewPrep />
        )}

        {activeTab === "builder" && (
          <ResumeBuilder user={user} onBackToJobs={() => setActiveTab("jobs")} />
        )}

        {activeTab === "recruiter-dashboard" && (
          (userRole === "admin" || userRole === "recruiter") ? (
            <RecruiterDashboard
              onOpenPostJob={() => setIsPostJobOpen(true)}
              onScheduleInterview={(app) => setSchedulingApp(app)}
            />
          ) : (
            <div style={{ maxWidth: 650, margin: "60px auto", padding: "40px", background: "#ffffff", borderRadius: 16, textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🛡️</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f2b48", marginBottom: 8 }}>Restricted to Authorized Admin</h2>
              <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                Candidate applications, candidate requests, and pipeline management are strictly accessible only by the sole platform administrator and hiring recruiter.
              </p>
              <button className="btn btn-primary" onClick={() => setActiveTab("jobs")} style={{ padding: "10px 24px", fontWeight: 800 }}>
                Return to Live Opportunities
              </button>
            </div>
          )
        )}

        {activeTab === "admin-dashboard" && (
          (userRole === "admin" || userRole === "recruiter") ? (
            <AdminDashboard />
          ) : (
            <div style={{ maxWidth: 650, margin: "60px auto", padding: "40px", background: "#ffffff", borderRadius: 16, textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🛡️</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f2b48", marginBottom: 8 }}>Restricted to Authorized Admin</h2>
              <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                Selection email dispatch and platform governance are restricted to the default platform administrator.
              </p>
              <button className="btn btn-primary" onClick={() => setActiveTab("jobs")} style={{ padding: "10px 24px", fontWeight: 800 }}>
                Return to Live Opportunities
              </button>
            </div>
          )
        )}
      </main>

      {/* Auth Modal (when triggered from inside guest browsing) */}
      {authConfig.isOpen && (
        <AuthPage
          isFullScreen={false}
          defaultMode={authConfig.mode}
          onClose={() => setAuthConfig({ isOpen: false, mode: "login" })}
          onSuccess={() => {
            showToast("Authenticated successfully with 256-bit JWT session.");
            setAuthConfig({ isOpen: false, mode: "login" });
          }}
        />
      )}

      {/* Modals */}
      {applyingJob && (
        <ApplicationModal
          job={applyingJob}
          onClose={() => setApplyingJob(null)}
          onSuccess={handleApplySuccess}
          onViewApplications={() => {
            setApplyingJob(null);
            setActiveTab("applications");
          }}
        />
      )}

      {isPostJobOpen && (
        <PostJobModal
          onClose={() => setIsPostJobOpen(false)}
          onSuccess={handlePostJobSuccess}
        />
      )}

      {schedulingApp && (
        <ScheduleInterviewModal
          application={schedulingApp}
          onClose={() => setSchedulingApp(null)}
          onSuccess={handleScheduleSuccess}
        />
      )}

      {/* AI Voice Copilot Agent */}
      <AIAgentCopilot user={user} onNavigate={(tab) => setActiveTab(tab)} />

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid #e2e8f0",
        background: "#ffffff",
        padding: "24px 0",
        marginTop: "auto"
      }}>
        <div style={{
          maxWidth: 1340,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 13,
          color: "#5a6a85",
          flexWrap: "wrap",
          gap: 12
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <strong>Recruitment Portal</strong> · Jobs, Internships, Assessment Rounds & AI Resume ATS
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#10b981", fontWeight: 700 }}>
              ✓ Verified Hiring Partners
            </span>
            <span>FastAPI Backend (:8000)</span>
            <span>React Vite Frontend (:5173)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
