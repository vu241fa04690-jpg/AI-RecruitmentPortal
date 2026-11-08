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
  const [showUserMenu, setShowUserMenu] = useState(false);

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

  const isRecruiterOrAdmin = userRole === "admin" || userRole === "recruiter";

  return (
    <header style={{
      background: "#172554", /* Deep Navy */
      color: "#FFFFFF",
      position: "sticky",
      top: 0,
      zIndex: 100,
      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
      boxShadow: "0 4px 20px rgba(15, 23, 42, 0.25)"
    }}>
      {/* Tier 1: Main Header & Brand Bar */}
      <div style={{
        maxWidth: 1320,
        margin: "0 auto",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16
      }}>
        {/* TalentAI Brand Logo */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", flexShrink: 0 }}
          onClick={() => setActiveTab(user ? (isRecruiterOrAdmin ? "recruiter-dashboard" : "candidate-dashboard") : "landing")}
        >
          <div style={{
            background: "linear-gradient(135deg, #3157D5 0%, #7657E8 100%)",
            width: 40,
            height: 40,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(118, 87, 232, 0.45)"
          }}>
            <SparklesIcon size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 21, fontWeight: 900, letterSpacing: -0.6, color: "#FFFFFF", fontFamily: "'Poppins', sans-serif" }}>
                Talent<span style={{ color: "#7657E8" }}>AI</span>
              </span>
              <span style={{
                background: "linear-gradient(135deg, rgba(118, 87, 232, 0.25), rgba(49, 87, 213, 0.35))",
                color: "#A78BFA",
                fontSize: 10,
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: 6,
                border: "1px solid rgba(167, 139, 250, 0.35)",
                letterSpacing: 0.5
              }}>
                PRO V2
              </span>
            </div>
            <p style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1, margin: "2px 0 0", fontWeight: 500 }}>
              Discover Talent. Build Futures.
            </p>
          </div>
        </div>

        {/* Global Navigation Links (For Visitors or Quick Switch) */}
        {!user && (
          <nav style={{ display: "flex", alignItems: "center", gap: 24 }} className="hide-on-mobile">
            <button
              onClick={() => setActiveTab("landing")}
              style={{
                background: "none",
                color: activeTab === "landing" ? "#FFFFFF" : "#94A3B8",
                fontWeight: activeTab === "landing" ? 700 : 500,
                fontSize: 14,
                borderBottom: activeTab === "landing" ? "2px solid #3157D5" : "2px solid transparent",
                padding: "6px 2px"
              }}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab("jobs")}
              style={{
                background: "none",
                color: activeTab === "jobs" ? "#FFFFFF" : "#94A3B8",
                fontWeight: activeTab === "jobs" ? 700 : 500,
                fontSize: 14,
                borderBottom: activeTab === "jobs" ? "2px solid #3157D5" : "2px solid transparent",
                padding: "6px 2px"
              }}
            >
              Find Jobs
            </button>
            <button
              onClick={() => setActiveTab("matcher")}
              style={{
                background: "none",
                color: activeTab === "matcher" ? "#FFFFFF" : "#94A3B8",
                fontWeight: activeTab === "matcher" ? 700 : 500,
                fontSize: 14,
                padding: "6px 2px"
              }}
            >
              AI Resume Matcher
            </button>
            <button
              onClick={() => setActiveTab("prep")}
              style={{
                background: "none",
                color: activeTab === "prep" ? "#FFFFFF" : "#94A3B8",
                fontWeight: activeTab === "prep" ? 700 : 500,
                fontSize: 14,
                padding: "6px 2px"
              }}
            >
              Interview Prep
            </button>
          </nav>
        )}

        {/* Right Section: System Indicator, Notifications & Auth */}
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
            color: backendStatus?.connected ? "#34D399" : "#FBBF24",
            border: "1px solid rgba(255, 255, 255, 0.12)"
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: backendStatus?.connected ? "#10B981" : "#F59E0B",
              boxShadow: backendStatus?.connected ? "0 0 8px #10B981" : "0 0 8px #F59E0B"
            }} />
            <span style={{ fontWeight: 700 }}>{backendStatus?.connected ? "FastAPI Live" : "FastAPI Ready"}</span>
          </div>

          {/* User Notifications */}
          {user && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                title="Notifications"
                style={{
                  background: showNotifMenu ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  color: "#FFFFFF",
                  borderRadius: 10,
                  padding: "7px 11px",
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
                    background: "#EF4444",
                    color: "#FFFFFF",
                    borderRadius: "50%",
                    fontSize: 10,
                    fontWeight: 900,
                    width: 17,
                    height: 17,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid #172554"
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
                  top: "125%",
                  width: 320,
                  background: "#FFFFFF",
                  color: "#0F172A",
                  borderRadius: 14,
                  boxShadow: "0 12px 35px rgba(0,0,0,0.25)",
                  border: "1px solid #E2E8F0",
                  zIndex: 9999,
                  overflow: "hidden"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #F1F5F9", background: "#F8FAFC" }}>
                    <span style={{ fontSize: 13, fontWeight: 800 }}>In-App Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        style={{ border: "none", background: "none", color: "#3157D5", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: 280, overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "20px", textAlign: "center", color: "#64748B", fontSize: 12 }}>
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          style={{
                            padding: "10px 14px",
                            borderBottom: "1px solid #F8FAFC",
                            background: n.read ? "#FFFFFF" : "#F0FDF4"
                          }}
                        >
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>{n.title}</div>
                          <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>{n.message}</div>
                          <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile / Action Buttons */}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  borderRadius: 24,
                  padding: "4px 12px 4px 6px",
                  color: "#FFFFFF"
                }}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: isRecruiterOrAdmin ? "linear-gradient(135deg, #7657E8 0%, #3157D5 100%)" : "#3157D5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 13
                }}>
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.2 }}>{user.name || "User"}</div>
                  <div style={{ fontSize: 10, color: "#94A3B8", lineHeight: 1 }}>
                    {isRecruiterOrAdmin ? "Admin / Recruiter" : "Candidate"}
                  </div>
                </div>
              </button>

              {/* Direct Portal Switcher for Testing/Evaluators */}
              {userRole === "candidate" ? (
                <button
                  onClick={() => setUserRole("admin")}
                  style={{
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    background: "rgba(118, 87, 232, 0.28)",
                    color: "#c4b5fd",
                    border: "1px solid rgba(167, 139, 250, 0.5)",
                    borderRadius: 8,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5
                  }}
                  title="Switch to Admin & Recruiter Management Portal"
                >
                  <span>🛡️</span>
                  <span className="hide-on-mobile">Admin Portal</span>
                </button>
              ) : (
                <button
                  onClick={() => setUserRole("candidate")}
                  style={{
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    background: "rgba(59, 130, 246, 0.2)",
                    color: "#93c5fd",
                    border: "1px solid rgba(147, 197, 253, 0.4)",
                    borderRadius: 8,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5
                  }}
                  title="Switch to Candidate Portal"
                >
                  <span>🎓</span>
                  <span className="hide-on-mobile">Candidate View</span>
                </button>
              )}

              <button
                onClick={onLogout}
                title="Log Out"
                className="btn btn-secondary"
                style={{ padding: "6px 12px", fontSize: 12, borderRadius: 10, background: "rgba(255, 255, 255, 0.1)", color: "#FFFFFF", border: "1px solid rgba(255, 255, 255, 0.15)" }}
              >
                <LogOutIcon size={14} color="#FFFFFF" />
                <span className="hide-on-mobile">Logout</span>
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => onOpenAuth("admin")}
                style={{
                  padding: "7px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  background: "rgba(118, 87, 232, 0.25)",
                  color: "#c4b5fd",
                  border: "1px solid rgba(167, 139, 250, 0.5)",
                  borderRadius: 8,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
                title="Log in to the Recruiter & Admin Management Portal"
              >
                <span>🛡️</span>
                <span>Admin Portal</span>
              </button>
              <button
                onClick={() => onOpenAuth("login")}
                className="btn btn-secondary"
                style={{ padding: "8px 16px", fontSize: 13, background: "transparent", color: "#FFFFFF", border: "1px solid rgba(255, 255, 255, 0.3)" }}
              >
                Login
              </button>
              <button
                onClick={() => onOpenAuth("register")}
                className="btn btn-primary"
                style={{ padding: "8px 18px", fontSize: 13 }}
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tier 2: Role-Specific Navigation Strip (Only shown when user is authenticated) */}
      {user && (
      <div style={{
        background: "rgba(15, 23, 42, 0.55)",
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        padding: "0 24px",
        overflowX: "auto"
      }}>
        <div style={{
          maxWidth: 1320,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: 4
        }}>
          {/* Candidate Tabs */}
          {userRole === "candidate" && (
            <>
              <button
                onClick={() => setActiveTab("candidate-dashboard")}
                style={{
                  background: activeTab === "candidate-dashboard" ? "rgba(49, 87, 213, 0.25)" : "transparent",
                  color: activeTab === "candidate-dashboard" ? "#60A5FA" : "#CBD5E1",
                  borderBottom: activeTab === "candidate-dashboard" ? "2.5px solid #3157D5" : "2.5px solid transparent",
                  padding: "11px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  whiteSpace: "nowrap"
                }}
              >
                <BrainIcon size={16} color={activeTab === "candidate-dashboard" ? "#60A5FA" : "#94A3B8"} />
                Candidate Dashboard
              </button>

              <button
                onClick={() => setActiveTab("jobs")}
                style={{
                  background: activeTab === "jobs" ? "rgba(49, 87, 213, 0.25)" : "transparent",
                  color: activeTab === "jobs" ? "#60A5FA" : "#CBD5E1",
                  borderBottom: activeTab === "jobs" ? "2.5px solid #3157D5" : "2.5px solid transparent",
                  padding: "11px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  whiteSpace: "nowrap"
                }}
              >
                <BriefcaseIcon size={16} color={activeTab === "jobs" ? "#60A5FA" : "#94A3B8"} />
                Find Jobs & Internships
              </button>

              <button
                onClick={() => setActiveTab("matcher")}
                style={{
                  background: activeTab === "matcher" ? "rgba(49, 87, 213, 0.25)" : "transparent",
                  color: activeTab === "matcher" ? "#60A5FA" : "#CBD5E1",
                  borderBottom: activeTab === "matcher" ? "2.5px solid #3157D5" : "2.5px solid transparent",
                  padding: "11px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  whiteSpace: "nowrap"
                }}
              >
                <SparklesIcon size={16} color={activeTab === "matcher" ? "#60A5FA" : "#94A3B8"} />
                AI Resume Matcher
              </button>

              <button
                onClick={() => setActiveTab("builder")}
                style={{
                  background: activeTab === "builder" ? "rgba(49, 87, 213, 0.25)" : "transparent",
                  color: activeTab === "builder" ? "#60A5FA" : "#CBD5E1",
                  borderBottom: activeTab === "builder" ? "2.5px solid #3157D5" : "2.5px solid transparent",
                  padding: "11px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  whiteSpace: "nowrap"
                }}
              >
                <FileTextIcon size={16} color={activeTab === "builder" ? "#60A5FA" : "#94A3B8"} />
                ATS Resume Builder
              </button>

              <button
                onClick={() => setActiveTab("applications")}
                style={{
                  background: activeTab === "applications" ? "rgba(49, 87, 213, 0.25)" : "transparent",
                  color: activeTab === "applications" ? "#60A5FA" : "#CBD5E1",
                  borderBottom: activeTab === "applications" ? "2.5px solid #3157D5" : "2.5px solid transparent",
                  padding: "11px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  whiteSpace: "nowrap"
                }}
              >
                <span style={{ fontSize: 14 }}>📋</span>
                My Applications
              </button>

              <button
                onClick={() => setActiveTab("interviews")}
                style={{
                  background: activeTab === "interviews" ? "rgba(49, 87, 213, 0.25)" : "transparent",
                  color: activeTab === "interviews" ? "#60A5FA" : "#CBD5E1",
                  borderBottom: activeTab === "interviews" ? "2.5px solid #3157D5" : "2.5px solid transparent",
                  padding: "11px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  whiteSpace: "nowrap"
                }}
              >
                <CalendarIcon size={16} color={activeTab === "interviews" ? "#60A5FA" : "#94A3B8"} />
                Scheduled Interviews
              </button>

              <button
                onClick={() => setActiveTab("prep")}
                style={{
                  background: activeTab === "prep" ? "rgba(49, 87, 213, 0.25)" : "transparent",
                  color: activeTab === "prep" ? "#60A5FA" : "#CBD5E1",
                  borderBottom: activeTab === "prep" ? "2.5px solid #3157D5" : "2.5px solid transparent",
                  padding: "11px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  whiteSpace: "nowrap"
                }}
              >
                <span style={{ fontSize: 14 }}>🎙️</span>
                AI Interview Prep
              </button>
            </>
          )}

          {/* Recruiter / Admin Tabs */}
          {isRecruiterOrAdmin && (
            <>
              <button
                onClick={() => setActiveTab("recruiter-dashboard")}
                style={{
                  background: activeTab === "recruiter-dashboard" ? "rgba(118, 87, 232, 0.3)" : "transparent",
                  color: activeTab === "recruiter-dashboard" ? "#C4B5FD" : "#CBD5E1",
                  borderBottom: activeTab === "recruiter-dashboard" ? "2.5px solid #7657E8" : "2.5px solid transparent",
                  padding: "11px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  whiteSpace: "nowrap"
                }}
              >
                <UsersIcon size={16} color={activeTab === "recruiter-dashboard" ? "#C4B5FD" : "#94A3B8"} />
                Recruiter Hub & AI Ranking
              </button>

              <button
                onClick={() => setActiveTab("jobs")}
                style={{
                  background: activeTab === "jobs" ? "rgba(118, 87, 232, 0.3)" : "transparent",
                  color: activeTab === "jobs" ? "#C4B5FD" : "#CBD5E1",
                  borderBottom: activeTab === "jobs" ? "2.5px solid #7657E8" : "2.5px solid transparent",
                  padding: "11px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  whiteSpace: "nowrap"
                }}
              >
                <BriefcaseIcon size={16} color={activeTab === "jobs" ? "#C4B5FD" : "#94A3B8"} />
                All Jobs Catalog
              </button>

              <button
                onClick={onOpenPostJob}
                style={{
                  background: "linear-gradient(135deg, #3157D5 0%, #7657E8 100%)",
                  color: "#FFFFFF",
                  padding: "7px 16px",
                  fontSize: 12.5,
                  fontWeight: 800,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginLeft: "auto",
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 8px rgba(49, 87, 213, 0.3)"
                }}
              >
                <PlusIcon size={15} color="#FFFFFF" />
                Post New Job
              </button>

              {userRole === "admin" && (
                <button
                  onClick={() => setActiveTab("admin-dashboard")}
                  style={{
                    background: activeTab === "admin-dashboard" ? "rgba(118, 87, 232, 0.3)" : "transparent",
                    color: activeTab === "admin-dashboard" ? "#C4B5FD" : "#CBD5E1",
                    borderBottom: activeTab === "admin-dashboard" ? "2.5px solid #7657E8" : "2.5px solid transparent",
                    padding: "11px 16px",
                    fontSize: 13,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    whiteSpace: "nowrap"
                  }}
                >
                  <ShieldLockIcon size={16} color={activeTab === "admin-dashboard" ? "#C4B5FD" : "#94A3B8"} />
                  Platform Admin
                </button>
              )}
            </>
          )}
        </div>
      </div>
      )}
    </header>
  );
}
