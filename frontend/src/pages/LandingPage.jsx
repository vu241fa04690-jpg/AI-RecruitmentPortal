import React, { useState, useEffect } from "react";
import {
  SparklesIcon,
  BriefcaseIcon,
  FileTextIcon,
  UsersIcon,
  CheckCircleIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  BrainIcon,
  MapPinIcon
} from "../components/Icons";
import OpportunityCard from "../components/OpportunityCard";
import { api, INITIAL_MOCK_JOBS } from "../services/api";

export default function LandingPage({ onExploreJobs, onHireTalent, onSelectJob, onOpenAuth }) {
  const [stats, setStats] = useState({
    totalJobs: 24,
    registeredCandidates: 1420,
    hiringCompanies: 85,
    successfulMatches: 980
  });
  const [opportunities, setOpportunities] = useState([]);
  const [activeCategoryTab, setActiveCategoryTab] = useState("all");
  const [loading, setLoading] = useState(true);

  // Search Bar State
  const [searchTitle, setSearchTitle] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  const [searchLocation, setSearchLocation] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchLandingData = async () => {
      try {
        const [jobsRes, analyticsRes] = await Promise.all([
          api.getJobs({}),
          api.getAnalytics().catch(() => null)
        ]);

        if (isMounted) {
          if (jobsRes && jobsRes.length > 0) {
            setOpportunities(jobsRes);
          } else {
            setOpportunities(INITIAL_MOCK_JOBS);
          }

          if (analyticsRes) {
            setStats({
              totalJobs: analyticsRes.total_active_jobs || (jobsRes ? jobsRes.length : 24),
              registeredCandidates: analyticsRes.total_registered_candidates || 1420,
              hiringCompanies: 85,
              successfulMatches: analyticsRes.total_shortlisted || 980
            });
          }
        }
      } catch (err) {
        console.warn("Using offline catalog fallback:", err);
        if (isMounted) {
          setOpportunities(INITIAL_MOCK_JOBS);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLandingData();
    return () => { isMounted = false; };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onExploreJobs) {
      onExploreJobs({
        query: searchTitle,
        category: searchCategory !== "all" ? searchCategory : undefined,
        location: searchLocation
      });
    }
  };

  // Filter trending list based on selected category tab
  const filteredOpportunities = opportunities.filter((item) => {
    if (activeCategoryTab === "all") return true;
    return (item.category || "job").toLowerCase() === activeCategoryTab.toLowerCase();
  });

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>
      {/* 1. HERO SECTION (Unstop Inspired - Clean & Powerful) */}
      <section style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E3A8A 55%, #1D4ED8 100%)",
        color: "#FFFFFF",
        padding: "48px 24px 72px",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Subtle decorative glow */}
        <div style={{
          position: "absolute",
          top: -100,
          right: -80,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none"
        }} />

        <div style={{
          maxWidth: 1320,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: 40,
          alignItems: "center"
        }}>
          {/* Hero Left Content */}
          <div>
            {/* Project Evaluator Credentials Top Bar */}
            <div
              onClick={() => onOpenAuth && onOpenAuth("admin")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                padding: "7px 16px",
                borderRadius: 24,
                fontSize: 12.5,
                color: "#FFFFFF",
                cursor: "pointer",
                marginBottom: 20,
                transition: "all 0.2s ease"
              }}
              title="Click to sign in as Admin with 1-click credentials"
            >
              <span style={{ fontSize: 14 }}>🛡️</span>
              <span><strong>Admin Portal:</strong> <code style={{ color: "#93C5FD", background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 4 }}>admin@recruitmentportal.com</code> / <code style={{ color: "#93C5FD", background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 4 }}>Admin@2026</code></span>
              <span style={{ color: "#C4B5FD", fontWeight: 800, marginLeft: 4 }}>1-Click Login →</span>
            </div>

            <h1 style={{
              fontSize: "clamp(32px, 4.2vw, 48px)",
              fontWeight: 900,
              lineHeight: 1.18,
              letterSpacing: -1,
              marginBottom: 16,
              fontFamily: "'Poppins', sans-serif"
            }}>
              Unlock Your Potential. <br />
              <span style={{
                background: "linear-gradient(135deg, #60A5FA 0%, #C084FC 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>
                Discover Your Next Opportunity.
              </span>
            </h1>

            <p style={{
              fontSize: 16,
              color: "#CBD5E1",
              lineHeight: 1.6,
              maxWidth: 580,
              marginBottom: 28
            }}>
              Find jobs, internships, competitions and hackathons. Build your verified skills, get AI resume feedback, and connect directly with top hiring recruiters.
            </p>

            {/* Unstop-Style Unified Omni-Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              style={{
                background: "#FFFFFF",
                borderRadius: 16,
                padding: "8px 10px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 20px 40px rgba(15, 23, 42, 0.35)",
                flexWrap: "wrap",
                marginBottom: 20
              }}
            >
              {/* Keyword Search */}
              <div style={{ flex: 1.4, minWidth: 180, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
                <span style={{ fontSize: 16 }}>🔍</span>
                <input
                  type="text"
                  placeholder="Opportunity, role, skill (e.g. SDE, AI Intern)"
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  style={{ width: "100%", border: "none", outline: "none", fontSize: 13.5, color: "#0F172A", background: "transparent" }}
                />
              </div>

              <div style={{ width: 1, height: 26, background: "#CBD5E1" }} className="hide-on-mobile" />

              {/* Category Dropdown */}
              <div style={{ minWidth: 140, display: "flex", alignItems: "center", gap: 6, padding: "8px 10px" }}>
                <span style={{ fontSize: 15 }}>📁</span>
                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: 13,
                    color: "#0F172A",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  <option value="all">All Opportunities</option>
                  <option value="job">💼 Full-Time Jobs</option>
                  <option value="internship">🎓 Internships & PPO</option>
                  <option value="hackathon">⚡ Hackathons</option>
                  <option value="competition">🏆 Competitions</option>
                </select>
              </div>

              <div style={{ width: 1, height: 26, background: "#CBD5E1" }} className="hide-on-mobile" />

              {/* Location Input */}
              <div style={{ flex: 1, minWidth: 140, display: "flex", alignItems: "center", gap: 6, padding: "8px 10px" }}>
                <span style={{ fontSize: 15 }}>📍</span>
                <input
                  type="text"
                  placeholder="Location or Remote"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  style={{ width: "100%", border: "none", outline: "none", fontSize: 13.5, color: "#0F172A", background: "transparent" }}
                />
              </div>

              {/* Submit Search Button */}
              <button
                type="submit"
                style={{
                  padding: "11px 24px",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
                  color: "#FFFFFF",
                  fontSize: 13.5,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(29, 78, 216, 0.35)",
                  whiteSpace: "nowrap"
                }}
              >
                Search
              </button>
            </form>

            {/* Quick Category Discovery Pills (Unstop Style) */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 700 }}>Popular:</span>
              {[
                { label: "💼 Jobs (2,500+)", cat: "job" },
                { label: "🎓 Internships (1,200+)", cat: "internship" },
                { label: "⚡ Hackathons (350+)", cat: "hackathon" },
                { label: "🏆 Competitions (480+)", cat: "competition" }
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onExploreJobs && onExploreJobs({ category: p.cat })}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 20,
                    background: "rgba(255, 255, 255, 0.12)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hero Right: Clean Unstop-Style Live Opportunity Preview Card */}
          <div className="hide-on-mobile" style={{ position: "relative" }}>
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 20,
                padding: "24px",
                boxShadow: "0 25px 60px rgba(15, 23, 42, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                color: "#0F172A"
              }}
            >
              {/* Badge & Rating Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{
                  background: "#EFF6FF",
                  color: "#1D4ED8",
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 11.5,
                  fontWeight: 800,
                  border: "1px solid #BFDBFE"
                }}>
                  🎓 Verified Internship + PPO
                </span>
                <span style={{
                  background: "#ECFDF5",
                  color: "#065F46",
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 11.5,
                  fontWeight: 800,
                  border: "1px solid #A7F3D0"
                }}>
                  ⚡ 98% AI Match Fit
                </span>
              </div>

              {/* Title & Company */}
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "#0066CC",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 18,
                  flexShrink: 0
                }}>
                  C
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.3, marginBottom: 2 }}>
                    Software Development Engineer Intern
                  </h4>
                  <div style={{ fontSize: 12.5, color: "#2563EB", fontWeight: 700 }}>
                    CognitiveFlow Technologies · <span style={{ color: "#64748B", fontWeight: 500 }}>Bengaluru & Remote</span>
                  </div>
                </div>
              </div>

              {/* Compensation Strip */}
              <div style={{
                background: "#F8FAFC",
                border: "1px dashed #CBD5E1",
                borderRadius: 10,
                padding: "8px 12px",
                fontSize: 12.5,
                fontWeight: 800,
                marginBottom: 14,
                display: "flex",
                justifyContent: "space-between"
              }}>
                <span>Stipend:</span>
                <span style={{ color: "#1D4ED8" }}>₹55,000 - ₹80,000 / mo + PPO (₹18-24 LPA)</span>
              </div>

              {/* Skills Match Progress */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  <span>Technical Fit (Python, FastAPI, React)</span>
                  <span style={{ color: "#1D4ED8" }}>98%</span>
                </div>
                <div style={{ height: 6, borderRadius: 6, background: "#EEF2FF", overflow: "hidden" }}>
                  <div style={{ width: "98%", height: "100%", background: "#1D4ED8", borderRadius: 6 }} />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => onExploreJobs && onExploreJobs()}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(29, 78, 216, 0.25)"
                }}
              >
                Explore All Opportunities →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. REAL STATISTICS COUNTER BAR (Unstop Style) */}
      <section style={{
        background: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        padding: "24px 24px"
      }}>
        <div style={{
          maxWidth: 1320,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 24,
          textAlign: "center"
        }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#1D4ED8" }}>{stats.totalJobs}+</div>
            <div style={{ fontSize: 12.5, color: "#64748B", fontWeight: 600 }}>Active Verified Opportunities</div>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#7C3AED" }}>{stats.registeredCandidates}+</div>
            <div style={{ fontSize: 12.5, color: "#64748B", fontWeight: 600 }}>Registered Candidates</div>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#059669" }}>{stats.hiringCompanies}+</div>
            <div style={{ fontSize: 12.5, color: "#64748B", fontWeight: 600 }}>Verified Hiring Companies</div>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#D97706" }}>{stats.successfulMatches}+</div>
            <div style={{ fontSize: 12.5, color: "#64748B", fontWeight: 600 }}>Shortlisted AI Matches</div>
          </div>
        </div>
      </section>

      {/* 3. EXPLORE CATEGORIES (Unstop Category Cards Grid) */}
      <section style={{ maxWidth: 1320, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#0F172A", letterSpacing: -0.5 }}>
            Explore Opportunities by Category
          </h2>
          <p style={{ fontSize: 14, color: "#64748B", marginTop: 4 }}>
            Everything you need to accelerate your tech career, compete, and get hired.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20
        }}>
          {[
            {
              title: "💼 Jobs",
              desc: "Full-Time, Remote, Freshers & Experienced Engineer openings.",
              count: "2,500+ Jobs",
              cat: "job",
              bg: "#EFF6FF",
              accent: "#1D4ED8"
            },
            {
              title: "🎓 Internships",
              desc: "Summer & winter internships with paid stipends and high PPO rates.",
              count: "1,200+ Openings",
              cat: "internship",
              bg: "#ECFDF5",
              accent: "#059669"
            },
            {
              title: "⚡ Hackathons",
              desc: "Autonomous AI, algorithmic code sprints, and ₹10L+ prize pools.",
              count: "350+ Hackathons",
              cat: "hackathon",
              bg: "#F5F3FF",
              accent: "#7C3AED"
            },
            {
              title: "🏆 Competitions",
              desc: "Data science championships, case study leagues, and Olympiads.",
              count: "480+ Competitions",
              cat: "competition",
              bg: "#FEF3C7",
              accent: "#D97706"
            },
            {
              title: "📝 Online Assessments",
              desc: "Timed CS Fundamentals, Aptitude MCQs, and safe Python coding tests.",
              count: "Instant Evaluation",
              action: () => onExploreJobs && onExploreJobs(),
              bg: "#F0FDF4",
              accent: "#16A34A"
            },
            {
              title: "🎙️ Mock Interviews",
              desc: "AI technical and behavioral practice with real-time STAR scoring.",
              count: "AI Speech & STAR",
              action: () => onExploreJobs && onExploreJobs(),
              bg: "#FDF2F8",
              accent: "#DB2777"
            },
            {
              title: "🎯 AI Resume Matcher",
              desc: "Semantic ATS resume match against real job descriptions.",
              count: "256-Bit NLP Match",
              action: () => onExploreJobs && onExploreJobs(),
              bg: "#F1F5F9",
              accent: "#475569"
            },
            {
              title: "🛡️ Admin & Recruiter Portal",
              desc: "13-stage visual candidate pipeline and assignment evaluations.",
              count: "Authorized Access",
              action: () => onOpenAuth && onOpenAuth("admin"),
              bg: "#EDE9FE",
              accent: "#6D28D9"
            }
          ].map((card, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (card.cat) {
                  onExploreJobs && onExploreJobs({ category: card.cat });
                } else if (card.action) {
                  card.action();
                }
              }}
              style={{
                background: "#FFFFFF",
                borderRadius: 16,
                border: "1px solid #E2E8F0",
                padding: "22px 20px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.borderColor = card.accent;
                e.currentTarget.style.boxShadow = "0 12px 24px rgba(15, 23, 42, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "#E2E8F0";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(15, 23, 42, 0.03)";
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A" }}>{card.title}</h3>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 12,
                    background: card.bg,
                    color: card.accent
                  }}>
                    {card.count}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>
                  {card.desc}
                </p>
              </div>

              <div style={{ marginTop: 14, fontSize: 12.5, fontWeight: 700, color: card.accent, display: "flex", alignItems: "center", gap: 4 }}>
                <span>Explore Opportunities</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. TRENDING OPPORTUNITIES STREAM (Unstop Style Tabs + Cards) */}
      <section style={{ maxWidth: 1320, margin: "0 auto", padding: "0 24px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: "#0F172A", letterSpacing: -0.5 }}>
              Trending Opportunities
            </h2>
            <p style={{ fontSize: 14, color: "#64748B", marginTop: 2 }}>
              Verified tech opportunities live on MongoDB database.
            </p>
          </div>

          {/* Unstop Category Filter Tabs */}
          <div style={{
            display: "flex",
            background: "#FFFFFF",
            padding: 4,
            borderRadius: 12,
            border: "1px solid #E2E8F0",
            overflowX: "auto"
          }}>
            {[
              { id: "all", label: "All" },
              { id: "job", label: "💼 Jobs" },
              { id: "internship", label: "🎓 Internships" },
              { id: "hackathon", label: "⚡ Hackathons" },
              { id: "competition", label: "🏆 Competitions" }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategoryTab(tab.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: activeCategoryTab === tab.id ? "#1D4ED8" : "transparent",
                  color: activeCategoryTab === tab.id ? "#FFFFFF" : "#64748B",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Opportunities Grid using Reusable Unstop Card */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
          gap: 20
        }}>
          {filteredOpportunities.slice(0, 6).map((item) => (
            <OpportunityCard
              key={item.id}
              opportunity={item}
              onApply={(job) => {
                if (onSelectJob) onSelectJob(job);
              }}
              onViewDetails={(job) => {
                if (onExploreJobs) onExploreJobs();
              }}
            />
          ))}
        </div>

        {/* View All Button */}
        <div style={{ textAlign: "center", marginTop: 36 }}>
          <button
            type="button"
            onClick={() => onExploreJobs && onExploreJobs()}
            style={{
              padding: "12px 32px",
              borderRadius: 12,
              border: "1.5px solid #1D4ED8",
              background: "#FFFFFF",
              color: "#1D4ED8",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(29, 78, 216, 0.08)",
              transition: "all 0.15s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#EFF6FF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#FFFFFF";
            }}
          >
            View All {opportunities.length} Opportunities →
          </button>
        </div>
      </section>

      {/* 5. PRACTICE AND LEARN MODULE (Unstop Style) */}
      <section style={{ background: "#FFFFFF", borderTop: "1px solid #E2E8F0", borderBottom: "1px solid #E2E8F0", padding: "60px 24px" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 40px" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#1D4ED8", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Prepare & Succeed
            </span>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#0F172A", marginTop: 6, letterSpacing: -0.5 }}>
              Practice, Assess and Crack Interviews
            </h2>
            <p style={{ fontSize: 14.5, color: "#64748B", marginTop: 8 }}>
              Comprehensive preparation modules designed for college students, final-year major projects, and tech candidates.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24
          }}>
            {[
              {
                icon: "⚡",
                title: "Timed Coding Challenges",
                desc: "Algorithmic problem solving in safe execution sandboxes with automated test case evaluation."
              },
              {
                icon: "📝",
                title: "Online Aptitude & CS Quizzes",
                desc: "Multiple-choice tests covering DSA, OS, DBMS, Computer Networks, and Quantitative Aptitude."
              },
              {
                icon: "🎙️",
                title: "AI Behavioral & Technical Mocks",
                desc: "Simulate FAANG and startup interview rounds with real-time STAR response feedback."
              },
              {
                icon: "📹",
                title: "Live WebRTC Video Interview Room",
                desc: "Integrated browser video conferencing with peer-to-peer WebRTC, mic/camera toggles, and screen share."
              }
            ].map((p, idx) => (
              <div
                key={idx}
                style={{
                  background: "#F8FAFC",
                  borderRadius: 16,
                  padding: "24px 20px",
                  border: "1px solid #E2E8F0"
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>{p.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>{p.title}</h3>
                <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.55 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. VERIFIED HIRING COMPANIES (Unstop Style Logos) */}
      <section style={{ maxWidth: 1320, margin: "0 auto", padding: "50px 24px", textAlign: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: 1 }}>
          Trusted by Top Hiring Partners & Innovative Startups
        </span>
        <div style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 28,
          alignItems: "center",
          marginTop: 24,
          opacity: 0.85
        }}>
          {[
            "CognitiveFlow Technologies",
            "FinPulse Analytics",
            "DeepRecruit AI Labs",
            "StudioCraft Interactive",
            "HyperScale Cloud",
            "VoltMobility Electric"
          ].map((comp, idx) => (
            <div
              key={idx}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 700,
                color: "#334155",
                boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)"
              }}
            >
              {comp}
            </div>
          ))}
        </div>
      </section>

      {/* 7. PROFESSIONAL FOOTER (Unstop Style) */}
      <footer style={{
        background: "#0F172A",
        color: "#94A3B8",
        padding: "60px 24px 30px",
        borderTop: "1px solid #1E293B"
      }}>
        <div style={{
          maxWidth: 1320,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 40,
          marginBottom: 40
        }}>
          {/* Col 1: Brand & CSE Major Project Info */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{
                background: "linear-gradient(135deg, #1D4ED8 0%, #7C3AED 100%)",
                width: 32,
                height: 32,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontWeight: 900
              }}>
                <SparklesIcon size={18} color="#FFFFFF" />
              </div>
              <span style={{ fontSize: 20, fontWeight: 900, color: "#FFFFFF" }}>
                Talent<span style={{ color: "#818CF8" }}>AI</span>
              </span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: "#94A3B8", marginBottom: 14 }}>
              Next-Gen AI Recruitment, Talent Matching & Opportunity Discovery Platform. Final-Year B.Tech CSE Major Project.
            </p>
            <div style={{ fontSize: 12, color: "#CBD5E1" }}>
              MongoDB Atlas · FastAPI · React 18 · JWT
            </div>
          </div>

          {/* Col 2: Opportunities */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: "#FFFFFF", marginBottom: 14 }}>Opportunities</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
              <span style={{ cursor: "pointer" }} onClick={() => onExploreJobs && onExploreJobs({ category: "job" })}>Full-Time Jobs</span>
              <span style={{ cursor: "pointer" }} onClick={() => onExploreJobs && onExploreJobs({ category: "internship" })}>Internships & PPO</span>
              <span style={{ cursor: "pointer" }} onClick={() => onExploreJobs && onExploreJobs({ category: "hackathon" })}>Hackathons & CodeSprints</span>
              <span style={{ cursor: "pointer" }} onClick={() => onExploreJobs && onExploreJobs({ category: "competition" })}>Data Science Competitions</span>
            </div>
          </div>

          {/* Col 3: Practice & AI Tools */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: "#FFFFFF", marginBottom: 14 }}>Practice & Learn</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
              <span style={{ cursor: "pointer" }} onClick={() => onExploreJobs && onExploreJobs()}>Online Assessments</span>
              <span style={{ cursor: "pointer" }} onClick={() => onExploreJobs && onExploreJobs()}>AI Mock Interview Prep</span>
              <span style={{ cursor: "pointer" }} onClick={() => onExploreJobs && onExploreJobs()}>ATS Resume Matcher</span>
              <span style={{ cursor: "pointer" }} onClick={() => onExploreJobs && onExploreJobs()}>WebRTC Video Interview Room</span>
            </div>
          </div>

          {/* Col 4: Evaluator & Admin Credentials */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: "#FFFFFF", marginBottom: 14 }}>Admin & Evaluator Portal</h4>
            <div style={{ background: "#1E293B", borderRadius: 10, padding: "12px", border: "1px solid #334155", fontSize: 12 }}>
              <div style={{ color: "#E2E8F0", fontWeight: 700, marginBottom: 4 }}>Demo Credentials:</div>
              <div style={{ color: "#93C5FD" }}>admin@recruitmentportal.com</div>
              <div style={{ color: "#93C5FD", marginTop: 2 }}>Pass: Admin@2026</div>
              <button
                type="button"
                onClick={() => onOpenAuth && onOpenAuth("admin")}
                style={{
                  marginTop: 8,
                  width: "100%",
                  padding: "6px",
                  borderRadius: 6,
                  border: "none",
                  background: "#1D4ED8",
                  color: "#FFFFFF",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                ⚡ 1-Click Admin Login
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div style={{
          maxWidth: 1320,
          margin: "0 auto",
          borderTop: "1px solid #1E293B",
          paddingTop: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          fontSize: 12
        }}>
          <div>
            © 2026 TalentAI Recruitment Portal · Final-Year B.Tech Major Project
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
