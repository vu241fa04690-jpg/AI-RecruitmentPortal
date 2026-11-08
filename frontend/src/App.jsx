import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import CandidateDashboard from "./pages/CandidateDashboard";
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
import { AuthProvider, useAuth } from "./context/AuthContext";
import { api } from "./services/api";

function MainApp() {
  const { user, logout, switchDemoRole } = useAuth();
  const [activeTab, setActiveTab] = useState(user ? "candidate-dashboard" : "landing");
  const [backendStatus, setBackendStatus] = useState({ connected: false });
  const [matcherTargetJob, setMatcherTargetJob] = useState(null);
  const [initialJobFilter, setInitialJobFilter] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Modals state
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

  // Update tab automatically on login/logout
  useEffect(() => {
    if (user) {
      if (user.role === "recruiter" || user.role === "admin") {
        setActiveTab("recruiter-dashboard");
      } else {
        setActiveTab("candidate-dashboard");
      }
    } else {
      setActiveTab("landing");
    }
  }, [user?.role]);

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
      setActiveTab("candidate-dashboard");
    }
    showToast(`Switched view to ${newRole.toUpperCase()} mode.`);
  };

  const handleRequireAuth = (mode = "register", targetJob = null) => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
    if (targetJob) {
      setApplyingJob(targetJob);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#F5F7FC" }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: "#172554",
          color: "#FFFFFF",
          padding: "12px 22px",
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(23, 37, 84, 0.3)",
          fontSize: 14,
          fontWeight: 700,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: 10,
          border: "1px solid #3157D5",
          animation: "modalEnter 0.2s ease"
        }}>
          <span style={{ color: "#7657E8" }}>⚡</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TalentAI Navigation Bar */}
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
          setActiveTab("landing");
          showToast("Signed out successfully.");
        }}
      />

      {/* Active Tab View */}
      <main style={{ flex: 1 }}>
        {/* 1. Stunning Landing Page */}
        {activeTab === "landing" && (
          <LandingPage
            onExploreJobs={(filter) => {
              if (filter) setInitialJobFilter(filter);
              setActiveTab("jobs");
            }}
            onHireTalent={() => {
              if (user && (user.role === "recruiter" || user.role === "admin")) {
                setActiveTab("recruiter-dashboard");
              } else {
                handleRequireAuth("register");
              }
            }}
            onSelectJob={(job) => {
              setMatcherTargetJob(job);
              if (!user) {
                handleRequireAuth("register", job);
              } else {
                setApplyingJob(job);
              }
            }}
            onOpenAuth={handleRequireAuth}
          />
        )}

        {/* 2. Unified Candidate Dashboard */}
        {activeTab === "candidate-dashboard" && (
          <CandidateDashboard
            user={user}
            onNavigateJobs={() => setActiveTab("jobs")}
            onNavigateMatcher={() => setActiveTab("matcher")}
            onNavigateApplications={() => setActiveTab("applications")}
            onNavigateInterviews={() => setActiveTab("interviews")}
            onNavigatePrep={() => setActiveTab("prep")}
            onNavigateBuilder={() => setActiveTab("builder")}
            onLogout={() => {
              logout();
              setActiveTab("landing");
            }}
          />
        )}

        {/* 3. Job Explorer & Search */}
        {activeTab === "jobs" && (
          <JobBoard
            initialCategory="all"
            initialFilter={initialJobFilter}
            user={user}
            onRequireAuth={handleRequireAuth}
            onApplyJob={(job) => {
              if (!user) {
                handleRequireAuth("register", job);
              } else {
                setApplyingJob(job);
              }
            }}
            onSelectJobForMatcher={handleSelectJobForMatcher}
          />
        )}

        {/* 4. AI Resume Matcher & ATS Scoring */}
        {activeTab === "matcher" && (
          <ResumeMatcher
            preselectedJob={matcherTargetJob}
            user={user}
            onRequireAuth={handleRequireAuth}
            onViewApplications={() => setActiveTab("applications")}
          />
        )}

        {/* 5. Candidate Applications Tracker */}
        {activeTab === "applications" && (
          <ApplicationsView
            user={user}
            onNavigateInterviews={() => setActiveTab("interviews")}
            onNavigateJobs={() => setActiveTab("jobs")}
          />
        )}

        {/* 6. Candidate Interview Schedules & Sandbox */}
        {activeTab === "interviews" && (
          <InterviewsView
            user={user}
          />
        )}

        {/* 7. AI Mock Interview Prep (Technical & HR) */}
        {activeTab === "prep" && (
          <InterviewPrep />
        )}

        {/* 8. ATS Resume Builder */}
        {activeTab === "builder" && (
          <ResumeBuilder user={user} onBackToJobs={() => setActiveTab("jobs")} />
        )}

        {/* 9. Recruiter Dashboard */}
        {activeTab === "recruiter-dashboard" && (
          (userRole === "admin" || userRole === "recruiter") ? (
            <RecruiterDashboard
              onOpenPostJob={() => setIsPostJobOpen(true)}
              onScheduleInterview={(app) => setSchedulingApp(app)}
            />
          ) : (
            <div style={{ maxWidth: 640, margin: "60px auto", padding: "40px", background: "#FFFFFF", borderRadius: 18, textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.06)", border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🛡️</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#172554", marginBottom: 8 }}>Restricted to Authorized Admin / Recruiter</h2>
              <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                Candidate applications, candidate requests, and pipeline management are strictly accessible only by the authorized platform administrator and hiring recruiter.
              </p>
              <button className="btn btn-primary" onClick={() => setActiveTab("jobs")} style={{ padding: "10px 24px" }}>
                Return to Live Opportunities
              </button>
            </div>
          )
        )}

        {/* 10. Platform Admin Dashboard */}
        {activeTab === "admin-dashboard" && (
          (userRole === "admin" || userRole === "recruiter") ? (
            <AdminDashboard />
          ) : (
            <div style={{ maxWidth: 640, margin: "60px auto", padding: "40px", background: "#FFFFFF", borderRadius: 18, textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.06)", border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🛡️</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#172554", marginBottom: 8 }}>Restricted to Authorized Admin</h2>
              <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                Selection email dispatch and platform governance are restricted to the default platform administrator.
              </p>
              <button className="btn btn-primary" onClick={() => setActiveTab("jobs")} style={{ padding: "10px 24px" }}>
                Return to Live Opportunities
              </button>
            </div>
          )
        )}
      </main>

      {/* Auth Modal (Pop-up when clicking login / apply from guest state) */}
      {isAuthModalOpen && (
        <AuthPage
          isFullScreen={false}
          defaultMode={authMode}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => {
            showToast("Authenticated successfully with 256-bit JWT session.");
            setIsAuthModalOpen(false);
          }}
          onContinueAsGuest={() => {
            setIsAuthModalOpen(false);
            showToast("Browsing TalentAI as guest.");
          }}
        />
      )}

      {/* Application Submission Modal */}
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

      {/* Recruiter Post Job Modal */}
      {isPostJobOpen && (
        <PostJobModal
          onClose={() => setIsPostJobOpen(false)}
          onSuccess={handlePostJobSuccess}
        />
      )}

      {/* Schedule Interview Modal */}
      {schedulingApp && (
        <ScheduleInterviewModal
          application={schedulingApp}
          onClose={() => setSchedulingApp(null)}
          onSuccess={handleScheduleSuccess}
        />
      )}
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
