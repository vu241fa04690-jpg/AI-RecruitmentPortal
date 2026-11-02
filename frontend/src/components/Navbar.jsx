import React, { useState, useEffect } from "react";
import {
  SparklesIcon,
  BriefcaseIcon,
  FileTextIcon,
  CalendarIcon,
  UsersIcon,
  BrainIcon,
  PlusIcon,
  ShieldLockIcon,
  LogOutIcon
} from "./Icons";
import { api } from "../services/api";

export default function Navbar({
  activeTab,
  setActiveTab,
  user,
  userRole,
  setUserRole,
  backendStatus,
  onOpenPostJob,
  onOpenAuth,
  onLogout
}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifs();
      const intv = setInterval(loadNotifs, 15000);
      return () => clearInterval(intv);
    }
  }, [user]);

  const loadNotifs = async () => {
    try {
      const res = await api.getNotifications();
      if (res?.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unread_count || 0);
      }
    } catch {}
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };
  return (
    <header style={{
      background: "linear-gradient(180deg, #0f2b48 0%, #0a1f36 100%)",
      color: "#ffffff",
      position: "sticky",
      top: 0,
      zIndex: 100,
      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 4px 20px rgba(10, 31, 54, 0.35)"
    }}>
      {/* Tier 1: Brand & Utility Bar */}
      <div style={{
        maxWidth: 1400,
        margin: "0 auto",
        padding: "10px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
      }}>
        {/* Brand: Recruitment Portal */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", flexShrink: 0 }}
          onClick={() => setActiveTab(userRole === "recruiter" ? "recruiter-dashboard" : userRole === "admin" ? "admin-dashboard" : "jobs")}
        >
          <div style={{
            background: "linear-gradient(135deg, #0066cc 0%, #00b4d8 100%)",
            width: 38,
            height: 38,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 16px rgba(0, 180, 216, 0.45)"
          }}>
            <SparklesIcon size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 19, fontWeight: 900, letterSpacing: -0.5, color: "#ffffff" }}>
                Recruitment<span style={{ color: "#38bdf8" }}>Portal</span>
              </span>
              <span style={{
                background: "linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(0, 102, 204, 0.25))",
                color: "#38bdf8",
                fontSize: 10,
                fontWeight: 800,
                padding: "2px 7px",
                borderRadius: 5,
                border: "1px solid rgba(56, 189, 248, 0.35)",
                letterSpacing: 0.5
              }}>
                AI HUB
              </span>
            </div>
            <p style={{ fontSize: 11, color: "#93c5fd", lineHeight: 1, margin: "2px 0 0" }}>Jobs, Internships & Multi-Round Interviews</p>
          </div>
        </div>

        {/* Right Section: Status, Role Switcher & Auth */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          {/* Live System Indicator */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(0, 0, 0, 0.28)",
            padding: "5px 12px",
            borderRadius: 20,
            fontSize: 11,
            color: backendStatus.connected ? "#4ade80" : "#fbbf24",
            border: "1px solid rgba(255, 255, 255, 0.12)"
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: backendStatus.connected ? "#4ade80" : "#fbbf24",
              boxShadow: backendStatus.connected ? "0 0 8px #4ade80" : "0 0 8px #fbbf24"
            }} />
            <span style={{ fontWeight: 700 }}>{backendStatus.connected ? "FastAPI Live" : "FastAPI Ready"}</span>
          </div>

          {/* Authenticated Role Security Badge */}
          {user && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: (userRole === "admin" || userRole === "recruiter")
                ? "linear-gradient(135deg, rgba(121, 40, 202, 0.4), rgba(0, 102, 204, 0.4))"
                : "rgba(255, 255, 255, 0.12)",
              border: (userRole === "admin" || userRole === "recruiter")
                ? "1px solid #c084fc"
                : "1px solid rgba(255, 255, 255, 0.2)",
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 11.5,
              fontWeight: 800,
              color: (userRole === "admin" || userRole === "recruiter") ? "#e9d5ff" : "#bae6fd"
            }}>
              <span>{(userRole === "admin" || userRole === "recruiter") ? "🛡️ Admin (Hiring Authority)" : "🎓 Candidate"}</span>
            </div>
          )}

          {/* In-App Notifications Bell */}
          {user && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                title="Notifications"
                style={{
                  background: showNotifMenu ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.12)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  borderRadius: 10,
                  padding: "6px 10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  position: "relative"
                }}
              >
                <span style={{ fontSize: 16 }}>🔔</span>
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    background: "#ef4444",
                    color: "#ffffff",
                    borderRadius: "50%",
                    fontSize: 10,
                    fontWeight: 900,
                    width: 17,
                    height: 17,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid #0f2b48"
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popup Dropdown */}
              {showNotifMenu && (
                <div style={{
                  position: "absolute",
                  right: 0,
                  top: "120%",
                  width: 320,
                  background: "#ffffff",
                  color: "#0f2b48",
                  borderRadius: 14,
                  boxShadow: "0 12px 35px rgba(0,0,0,0.25)",
                  border: "1px solid #e2e8f0",
                  zIndex: 9999,
                  overflow: "hidden"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                    <span style={{ fontSize: 13, fontWeight: 800 }}>In-App Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        style={{ border: "none", background: "none", color: "#0066cc", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: 280, overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: 12 }}>
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          style={{
                            padding: "10px 14px",
                            borderBottom: "1px solid #f8fafc",
                            background: n.read ? "#ffffff" : "#f0fdf4",
                            cursor: "pointer"
                          }}
                          onClick={() => {
                            if (n.link) setActiveTab(n.link.replace("/", ""));
                            setShowNotifMenu(false);
                          }}
                        >
                          <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a", marginBottom: 2 }}>
                            {n.title}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.4 }}>
                            {n.message}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Account / Auth */}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                onClick={onOpenAuth}
                title="Account Details"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(255, 255, 255, 0.12)",
                  padding: "4px 12px",
                  borderRadius: 20,
                  cursor: "pointer",
                  border: "1px solid rgba(255, 255, 255, 0.15)"
                }}
              >
                <div style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "#ffffff",
                  color: "#0f2b48",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 12
                }}>
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#ffffff" }}>{user.name}</div>
              </div>

              <button
                onClick={onLogout}
                title="Sign Out"
                style={{
                  background: "rgba(239, 68, 68, 0.22)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  color: "#fca5a5",
                  borderRadius: 8,
                  padding: "6px 9px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <LogOutIcon size={14} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                className="btn"
                onClick={() => onOpenAuth("login")}
                style={{
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  background: "rgba(255, 255, 255, 0.12)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  borderRadius: 8
                }}
              >
                Sign In
              </button>
              <button
                className="btn"
                onClick={() => onOpenAuth("register")}
                style={{
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #0066cc 0%, #00b4d8 100%)",
                  color: "#ffffff",
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0, 102, 204, 0.4)",
                  border: "none"
                }}
              >
                Sign Up Free
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tier 2: Navigation Tabs Strip */}
      <div style={{
        maxWidth: 1400,
        margin: "0 auto",
        padding: "6px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        overflowX: "auto",
        whiteSpace: "nowrap",
        gap: 8,
        scrollbarWidth: "none"
      }}>
        <nav style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {userRole === "candidate" && (
            <>
              <button
                className="btn"
                onClick={() => setActiveTab("jobs")}
                style={{
                  background: activeTab === "jobs" ? "rgba(255, 255, 255, 0.22)" : "transparent",
                  color: "#ffffff",
                  padding: "6px 13px",
                  fontSize: 13,
                  fontWeight: activeTab === "jobs" ? 800 : 600,
                  borderRadius: 8,
                  border: activeTab === "jobs" ? "1px solid rgba(255, 255, 255, 0.35)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                💼 Explore Jobs
              </button>
              <button
                className="btn"
                onClick={() => setActiveTab("internships")}
                style={{
                  background: activeTab === "internships" ? "rgba(255, 255, 255, 0.22)" : "transparent",
                  color: "#ffffff",
                  padding: "6px 13px",
                  fontSize: 13,
                  fontWeight: activeTab === "internships" ? 800 : 600,
                  borderRadius: 8,
                  border: activeTab === "internships" ? "1px solid rgba(255, 255, 255, 0.35)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                🎓 Internships & PPO
              </button>
              <button
                className="btn"
                onClick={() => setActiveTab("matcher")}
                style={{
                  background: activeTab === "matcher" ? "rgba(255, 255, 255, 0.22)" : "transparent",
                  color: "#ffffff",
                  padding: "6px 13px",
                  fontSize: 13,
                  fontWeight: activeTab === "matcher" ? 800 : 600,
                  borderRadius: 8,
                  border: activeTab === "matcher" ? "1px solid rgba(255, 255, 255, 0.35)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                📄 ATS Scanner
              </button>
              <button
                className="btn"
                onClick={() => setActiveTab("builder")}
                style={{
                  background: activeTab === "builder" ? "rgba(255, 255, 255, 0.22)" : "transparent",
                  color: "#ffffff",
                  padding: "6px 13px",
                  fontSize: 13,
                  fontWeight: activeTab === "builder" ? 800 : 600,
                  borderRadius: 8,
                  border: activeTab === "builder" ? "1px solid rgba(255, 255, 255, 0.35)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                📝 Resume Builder
              </button>
              <button
                className="btn"
                onClick={() => setActiveTab("interviews")}
                style={{
                  background: activeTab === "interviews" ? "rgba(255, 255, 255, 0.22)" : "transparent",
                  color: "#ffffff",
                  padding: "6px 13px",
                  fontSize: 13,
                  fontWeight: activeTab === "interviews" ? 800 : 600,
                  borderRadius: 8,
                  border: activeTab === "interviews" ? "1px solid rgba(255, 255, 255, 0.35)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                🎯 Assessment Rounds
              </button>
              <button
                className="btn"
                onClick={() => setActiveTab("applications")}
                style={{
                  background: activeTab === "applications" ? "rgba(255, 255, 255, 0.22)" : "transparent",
                  color: "#ffffff",
                  padding: "6px 13px",
                  fontSize: 13,
                  fontWeight: activeTab === "applications" ? 800 : 600,
                  borderRadius: 8,
                  border: activeTab === "applications" ? "1px solid rgba(255, 255, 255, 0.35)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                📋 Applications
              </button>
              <button
                className="btn"
                onClick={() => setActiveTab("prep")}
                style={{
                  background: activeTab === "prep" ? "rgba(255, 255, 255, 0.22)" : "transparent",
                  color: "#ffffff",
                  padding: "6px 13px",
                  fontSize: 13,
                  fontWeight: activeTab === "prep" ? 800 : 600,
                  borderRadius: 8,
                  border: activeTab === "prep" ? "1px solid rgba(255, 255, 255, 0.35)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                💡 Mock Practice
              </button>
            </>
          )}

          {(userRole === "admin" || userRole === "recruiter") && (
            <>
              <button
                className="btn"
                onClick={() => setActiveTab("recruiter-dashboard")}
                style={{
                  background: activeTab === "recruiter-dashboard" ? "rgba(255, 255, 255, 0.22)" : "transparent",
                  color: "#ffffff",
                  padding: "6px 14px",
                  fontSize: 13,
                  fontWeight: 800,
                  borderRadius: 8,
                  border: activeTab === "recruiter-dashboard" ? "1px solid rgba(255, 255, 255, 0.35)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <UsersIcon size={16} /> 📋 Candidate Applications & Requests
              </button>
              <button
                className="btn"
                onClick={() => setActiveTab("jobs")}
                style={{
                  background: activeTab === "jobs" ? "rgba(255, 255, 255, 0.22)" : "transparent",
                  color: "#ffffff",
                  padding: "6px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  borderRadius: 8,
                  border: activeTab === "jobs" ? "1px solid rgba(255, 255, 255, 0.35)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <BriefcaseIcon size={16} /> Manage Openings
              </button>
              <button
                className="btn"
                onClick={() => setActiveTab("interviews")}
                style={{
                  background: activeTab === "interviews" ? "rgba(255, 255, 255, 0.22)" : "transparent",
                  color: "#ffffff",
                  padding: "6px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  borderRadius: 8,
                  border: activeTab === "interviews" ? "1px solid rgba(255, 255, 255, 0.35)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <CalendarIcon size={16} /> Assessment & Rounds
              </button>
              <button
                className="btn"
                onClick={() => setActiveTab("admin-dashboard")}
                style={{
                  background: activeTab === "admin-dashboard" ? "rgba(255, 255, 255, 0.22)" : "transparent",
                  color: "#ffffff",
                  padding: "6px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  borderRadius: 8,
                  border: activeTab === "admin-dashboard" ? "1px solid rgba(255, 255, 255, 0.35)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <ShieldLockIcon size={16} /> Selection Emails & Governance
              </button>
              <button
                className="btn"
                onClick={onOpenPostJob}
                style={{
                  background: "linear-gradient(135deg, #0066cc 0%, #00b4d8 100%)",
                  color: "#ffffff",
                  padding: "6px 16px",
                  marginLeft: 10,
                  borderRadius: 8,
                  fontWeight: 800,
                  fontSize: 12.5,
                  boxShadow: "0 4px 12px rgba(0, 102, 204, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <PlusIcon size={15} /> Post New Opportunity
              </button>
            </>
          )}
        </nav>

        {/* Unstop partner badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11.5,
          color: "#93c5fd",
          fontWeight: 600,
          paddingLeft: 12
        }}>
          <span>✦ 22 Live Opportunities (Software, Business & Hardware)</span>
        </div>
      </div>
    </header>
  );
}
