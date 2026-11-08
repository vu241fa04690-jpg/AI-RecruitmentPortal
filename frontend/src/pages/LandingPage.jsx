import React, { useState, useEffect } from "react";
import {
  SparklesIcon,
  BriefcaseIcon,
  FileTextIcon,
  UsersIcon,
  CheckCircleIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  BrainIcon
} from "../components/Icons";
import { api, INITIAL_MOCK_JOBS } from "../services/api";

export default function LandingPage({ onExploreJobs, onHireTalent, onSelectJob, onOpenAuth }) {
  const [stats, setStats] = useState({
    totalJobs: 24,
    registeredCandidates: 1420,
    hiringCompanies: 85,
    successfulMatches: 980
  });
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hero Search inputs
  const [searchTitle, setSearchTitle] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [searchSkill, setSearchSkill] = useState("");

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
            setFeaturedJobs(jobsRes.slice(0, 6));
          } else {
            setFeaturedJobs(INITIAL_MOCK_JOBS.slice(0, 6));
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
        console.warn("Using offline landing stats:", err);
        if (isMounted) {
          setFeaturedJobs(INITIAL_MOCK_JOBS.slice(0, 6));
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
        query: searchTitle || searchSkill,
        location: searchLocation
      });
    }
  };

  return (
    <div style={{ background: "#F5F7FC", minHeight: "100vh" }}>
      {/* 1. HERO SECTION */}
      <section style={{
        background: "linear-gradient(135deg, #172554 0%, #1E3A8A 50%, #3157D5 100%)",
        color: "#FFFFFF",
        padding: "70px 24px 90px",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Subtle background glow effect */}
        <div style={{
          position: "absolute",
          top: -120,
          right: -100,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(118, 87, 232, 0.3) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none"
        }} />

        <div style={{
          maxWidth: 1300,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1.15fr 0.85fr",
          gap: 48,
          alignItems: "center"
        }}>
          {/* Hero Left Content */}
          <div>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(8px)",
              padding: "6px 16px",
              borderRadius: 30,
              fontSize: 13,
              fontWeight: 700,
              color: "#A78BFA",
              marginBottom: 20,
              border: "1px solid rgba(255, 255, 255, 0.2)"
            }}>
              <SparklesIcon size={16} color="#A78BFA" />
              <span>NEXT-GEN AI RECRUITMENT & TALENT MATCHING</span>
            </div>

            <h1 style={{
              fontSize: "clamp(34px, 5vw, 54px)",
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: -1.2,
              marginBottom: 20,
              fontFamily: "'Poppins', sans-serif"
            }}>
              Find Your Dream Career with{" "}
              <span style={{
                background: "linear-gradient(135deg, #60A5FA 0%, #C084FC 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>
                AI-Powered
              </span>{" "}
              Recruitment
            </h1>

            <p style={{
              fontSize: 17,
              color: "#CBD5E1",
              lineHeight: 1.6,
              maxWidth: 580,
              marginBottom: 32
            }}>
              Connect with top companies, discover high-impact opportunities, and let intelligent semantic resume matching bring your career closer to guaranteed success.
            </p>

            {/* Call to action buttons */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 38 }}>
              <button
                onClick={() => onExploreJobs()}
                className="btn btn-primary"
                style={{
                  padding: "13px 28px",
                  fontSize: 15,
                  borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(49, 87, 213, 0.45)"
                }}
              >
                <BriefcaseIcon size={18} color="#FFFFFF" />
                Explore 2,500+ Jobs
              </button>

              <button
                onClick={() => onHireTalent()}
                className="btn btn-secondary"
                style={{
                  padding: "13px 26px",
                  fontSize: 15,
                  borderRadius: 12,
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#FFFFFF",
                  border: "1.5px solid rgba(255, 255, 255, 0.25)"
                }}
              >
                <UsersIcon size={18} color="#FFFFFF" />
                Hire Top Talent
              </button>
            </div>

            {/* Hero Interactive Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              style={{
                background: "#FFFFFF",
                borderRadius: 16,
                padding: "8px 10px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 18px 40px rgba(15, 23, 42, 0.35)",
                flexWrap: "wrap"
              }}
            >
              <div style={{ flex: 1, minWidth: 150, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
                <span style={{ fontSize: 16 }}>🔍</span>
                <input
                  type="text"
                  placeholder="Job title or role (e.g. FastAPI, SDE)"
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  style={{ width: "100%", border: "none", outline: "none", fontSize: 13.5, color: "#0F172A" }}
                />
              </div>

              <div style={{ width: 1, height: 28, background: "#E2E8F0" }} className="hide-on-mobile" />

              <div style={{ flex: 1, minWidth: 140, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
                <span style={{ fontSize: 16 }}>📍</span>
                <input
                  type="text"
                  placeholder="Location (e.g. Bengaluru, Remote)"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  style={{ width: "100%", border: "none", outline: "none", fontSize: 13.5, color: "#0F172A" }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: "11px 22px", borderRadius: 10, fontSize: 14, fontWeight: 700 }}
              >
                Search Jobs
              </button>
            </form>
          </div>

          {/* Hero Right Visuals / Graphic Cards */}
          <div style={{ position: "relative" }} className="hide-on-mobile">
            {/* Main Interactive Card */}
            <div className="card animate-float" style={{
              background: "#FFFFFF",
              borderRadius: 24,
              padding: "28px",
              boxShadow: "0 25px 60px rgba(15, 23, 42, 0.35)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              color: "#0F172A"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #3157D5 0%, #7657E8 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                    fontWeight: 900
                  }}>
                    AI
                  </div>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 800 }}>Semantic Match Engine</h4>
                    <p style={{ fontSize: 12, color: "#64748B" }}>Real-Time ATS Screening</p>
                  </div>
                </div>
                <span className="badge badge-success">✓ 96% Match</span>
              </div>

              {/* Progress bars inside card */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                  <span>Technical Skills Fit</span>
                  <span style={{ color: "#3157D5" }}>98%</span>
                </div>
                <div style={{ height: 8, borderRadius: 10, background: "#EEF2FF", overflow: "hidden" }}>
                  <div style={{ width: "98%", height: "100%", background: "#3157D5", borderRadius: 10 }} />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                  <span>Experience Compatibility</span>
                  <span style={{ color: "#7657E8" }}>94%</span>
                </div>
                <div style={{ height: 8, borderRadius: 10, background: "#F5F3FF", overflow: "hidden" }}>
                  <div style={{ width: "94%", height: "100%", background: "#7657E8", borderRadius: 10 }} />
                </div>
              </div>

              {/* Verified Badge pill */}
              <div style={{
                background: "#ECFDF5",
                border: "1px solid #A7F3D0",
                borderRadius: 12,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 12,
                color: "#065F46",
                fontWeight: 600
              }}>
                <CheckCircleIcon size={18} color="#10B981" />
                <span>Shortlisted for Round 2 Technical Assessment & Interview</span>
              </div>
            </div>

            {/* Small Floating Card 1: STAR Evaluation */}
            <div style={{
              position: "absolute",
              top: -24,
              left: -32,
              background: "#1E293B",
              color: "#FFFFFF",
              borderRadius: 16,
              padding: "12px 18px",
              boxShadow: "0 12px 30px rgba(0,0,0,0.3)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 12.5,
              fontWeight: 700,
              border: "1px solid rgba(255, 255, 255, 0.12)"
            }}>
              <span>🎙️</span>
              <span>AI Mock Interview Live STAR Scoring</span>
            </div>

            {/* Small Floating Card 2: 1-Click PPO */}
            <div style={{
              position: "absolute",
              bottom: -22,
              right: -15,
              background: "#FFFFFF",
              color: "#0F172A",
              borderRadius: 16,
              padding: "12px 18px",
              boxShadow: "0 14px 34px rgba(23, 37, 84, 0.18)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 12.5,
              fontWeight: 800,
              border: "1px solid #E2E8F0"
            }}>
              <span style={{ color: "#F59E0B" }}>🏆</span>
              <span>Pre-Placement Offers (PPO)</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. REAL STATISTICS COUNTERS SECTION */}
      <section style={{
        maxWidth: 1240,
        margin: "-40px auto 0",
        padding: "0 24px",
        position: "relative",
        zIndex: 10
      }}>
        <div className="card" style={{
          borderRadius: 20,
          padding: "32px 40px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 28,
          textAlign: "center",
          boxShadow: "0 16px 36px rgba(23, 37, 84, 0.08)",
          border: "1px solid #E2E8F0"
        }}>
          <div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#3157D5", fontFamily: "'Poppins', sans-serif" }}>
              {stats.totalJobs}+
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#64748B", marginTop: 4 }}>
              Active Verified Jobs
            </div>
          </div>

          <div style={{ borderLeft: "1px solid #F1F5F9" }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#7657E8", fontFamily: "'Poppins', sans-serif" }}>
              {stats.registeredCandidates}+
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#64748B", marginTop: 4 }}>
              Registered Candidates
            </div>
          </div>

          <div style={{ borderLeft: "1px solid #F1F5F9" }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#10B981", fontFamily: "'Poppins', sans-serif" }}>
              {stats.hiringCompanies}+
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#64748B", marginTop: 4 }}>
              Hiring Companies
            </div>
          </div>

          <div style={{ borderLeft: "1px solid #F1F5F9" }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#F59E0B", fontFamily: "'Poppins', sans-serif" }}>
              {stats.successfulMatches}+
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#64748B", marginTop: 4 }}>
              Successful AI Matches
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED JOBS SECTION */}
      <section style={{ maxWidth: 1240, margin: "70px auto 0", padding: "0 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
          <div>
            <span className="badge badge-primary" style={{ marginBottom: 8 }}>🔥 HANDPICKED OPENINGS</span>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0F172A" }}>
              Featured Jobs & Internships
            </h2>
            <p style={{ color: "#64748B", fontSize: 14, marginTop: 4 }}>
              Explore high-growth tech positions with Pre-Placement Offers (PPO) and direct recruiter review.
            </p>
          </div>

          <button
            onClick={() => onExploreJobs()}
            className="btn btn-outline-primary"
            style={{ fontSize: 13, fontWeight: 700, padding: "8px 18px" }}
          >
            View All Openings ({stats.totalJobs}) →
          </button>
        </div>

        {/* Job Cards Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
          gap: 22
        }}>
          {featuredJobs.map((job) => (
            <div
              key={job.id}
              className="card card-hover"
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: job.company_logo_color || "#3157D5",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 18
                    }}>
                      {job.company ? job.company[0] : "C"}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", lineHeight: 1.25 }}>
                        {job.title}
                      </h3>
                      <div style={{ fontSize: 13, color: "#3157D5", fontWeight: 700, marginTop: 2 }}>
                        {job.company}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Job metadata tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                  <span className="badge badge-neutral">📍 {job.location}</span>
                  <span className="badge badge-neutral">💼 {job.type}</span>
                  <span className="badge badge-neutral">⏳ {job.duration || "Permanent"}</span>
                </div>

                <div style={{ fontSize: 13, color: "#0F172A", fontWeight: 800, marginBottom: 14 }}>
                  💰 {job.stipend_or_salary || "₹50,000 - ₹80,000 / month"}
                </div>

                {/* Skills strip */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
                  {(job.skills || []).slice(0, 4).map((skill, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: "#EEF2FF",
                        color: "#3157D5",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 6
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                  {(job.skills || []).length > 4 && (
                    <span style={{ fontSize: 11, color: "#64748B", padding: "3px 4px" }}>
                      +{job.skills.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 10, paddingTop: 14, borderTop: "1px solid #F1F5F9" }}>
                <button
                  onClick={() => onSelectJob(job)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: "8px 12px", fontSize: 13 }}
                >
                  View Details
                </button>
                <button
                  onClick={() => onSelectJob(job)}
                  className="btn btn-primary"
                  style={{ flex: 1.2, padding: "8px 14px", fontSize: 13 }}
                >
                  ⚡ Apply with AI Match
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. WHY CHOOSE TALENTAI SECTION */}
      <section style={{ maxWidth: 1240, margin: "90px auto 0", padding: "0 24px" }}>
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 48px" }}>
          <span className="badge badge-accent" style={{ marginBottom: 10 }}>💡 THE TALENTAI ADVANTAGE</span>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: "#0F172A" }}>
            Why Leading Engineering Teams & Candidates Choose TalentAI
          </h2>
          <p style={{ color: "#64748B", fontSize: 15, marginTop: 8 }}>
            Eliminating traditional keyword-guessing. We combine semantic vector matching, real-time STAR evaluation, and transparent hiring pipelines.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 24
        }}>
          {/* Card 1 */}
          <div className="card" style={{ padding: "32px 26px" }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              background: "#EEF2FF",
              color: "#3157D5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20
            }}>
              <BrainIcon size={26} color="#3157D5" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 10 }}>
              AI Resume Matching
            </h3>
            <p style={{ color: "#64748B", fontSize: 13.5, lineHeight: 1.6 }}>
              Extracts education, experience, and deep skill trees from PDF and DOCX files to calculate genuine ATS compatibility with zero hallucinations.
            </p>
          </div>

          {/* Card 2 */}
          <div className="card" style={{ padding: "32px 26px" }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              background: "#F5F3FF",
              color: "#7657E8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20
            }}>
              <SparklesIcon size={26} color="#7657E8" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 10 }}>
              Smart Candidate Ranking
            </h3>
            <p style={{ color: "#64748B", fontSize: 13.5, lineHeight: 1.6 }}>
              Enables hiring managers to rank 1,000+ applicants side-by-side by technical depth, missing competencies, and cultural alignment.
            </p>
          </div>

          {/* Card 3 */}
          <div className="card" style={{ padding: "32px 26px" }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              background: "#ECFDF5",
              color: "#10B981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20
            }}>
              <CalendarIcon size={26} color="#10B981" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 10 }}>
              Live Interview Simulator
            </h3>
            <p style={{ color: "#64748B", fontSize: 13.5, lineHeight: 1.6 }}>
              Interactive voice and text mock interview prep across 10 engineering domains with instant STAR structured scoring and model answers.
            </p>
          </div>

          {/* Card 4 */}
          <div className="card" style={{ padding: "32px 26px" }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              background: "#FFFBEB",
              color: "#F59E0B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20
            }}>
              <FileTextIcon size={26} color="#F59E0B" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 10 }}>
              Transparent Tracking
            </h3>
            <p style={{ color: "#64748B", fontSize: 13.5, lineHeight: 1.6 }}>
              Every candidate tracks their hiring stages in real-time from application submission to technical assessment, interviews, and offer letters.
            </p>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS SECTION */}
      <section style={{ maxWidth: 1240, margin: "90px auto 0", padding: "0 24px" }}>
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 48px" }}>
          <span className="badge badge-primary" style={{ marginBottom: 10 }}>🚀 STEP-BY-STEP WORKFLOW</span>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: "#0F172A" }}>
            How TalentAI Works
          </h2>
          <p style={{ color: "#64748B", fontSize: 15, marginTop: 8 }}>
            Four streamlined steps to move from candidate profile creation to signed offer letter.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 24,
          position: "relative"
        }}>
          {[
            { step: "01", title: "Create Your Profile", desc: "Register as a Candidate or Recruiter with verified role permissions and contact details." },
            { step: "02", title: "Upload Your Resume", desc: "Upload PDF/DOCX or build an ATS-compliant resume with our live single-column builder." },
            { step: "03", title: "AI-Matched Roles", desc: "Our neural algorithms compare your skills with 2,500+ active roles and highlight missing keywords." },
            { step: "04", title: "Apply & Track Status", desc: "1-click apply, schedule technical coding rounds, and track your hiring progression in real-time." }
          ].map((item, idx) => (
            <div
              key={idx}
              className="card"
              style={{
                padding: "30px 24px",
                position: "relative",
                borderTop: "4px solid #3157D5"
              }}
            >
              <div style={{
                fontSize: 32,
                fontWeight: 900,
                color: "#E2E8F0",
                lineHeight: 1,
                marginBottom: 16,
                fontFamily: "'Poppins', sans-serif"
              }}>
                {item.step}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CALL TO ACTION FOOTER BANNER */}
      <section style={{ maxWidth: 1240, margin: "90px auto 0", padding: "0 24px" }}>
        <div style={{
          background: "linear-gradient(135deg, #172554 0%, #3157D5 100%)",
          borderRadius: 24,
          padding: "50px 40px",
          color: "#FFFFFF",
          textAlign: "center",
          boxShadow: "0 20px 40px rgba(49, 87, 213, 0.25)"
        }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12, fontFamily: "'Poppins', sans-serif" }}>
            Ready to Accelerate Your Career with TalentAI?
          </h2>
          <p style={{ fontSize: 16, color: "#E0E7FF", maxWidth: 600, margin: "0 auto 28px" }}>
            Join thousands of college students, recent graduates, and software engineers securing top positions today.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => onExploreJobs()}
              className="btn btn-secondary"
              style={{ padding: "12px 28px", fontSize: 14, fontWeight: 800 }}
            >
              Start Searching Jobs
            </button>
            <button
              onClick={() => onOpenAuth("register")}
              className="btn btn-accent"
              style={{ padding: "12px 28px", fontSize: 14, fontWeight: 800 }}
            >
              Create Free Account →
            </button>
          </div>
        </div>
      </section>

      {/* 7. PROFESSIONAL FOOTER */}
      <footer style={{
        background: "#0F172A",
        color: "#94A3B8",
        marginTop: 80,
        padding: "60px 24px 30px",
        borderTop: "1px solid #1E293B"
      }}>
        <div style={{
          maxWidth: 1240,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 40,
          marginBottom: 48
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{
                background: "linear-gradient(135deg, #3157D5 0%, #7657E8 100%)",
                width: 32,
                height: 32,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF"
              }}>
                <SparklesIcon size={18} color="#FFFFFF" />
              </div>
              <span style={{ fontSize: 20, fontWeight: 900, color: "#FFFFFF" }}>
                Talent<span style={{ color: "#7657E8" }}>AI</span>
              </span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: "#64748B" }}>
              Next-generation AI-powered recruitment, automated ATS diagnostics, candidate ranking, and multi-round interview platform.
            </p>
            <p style={{ fontSize: 12, color: "#475569", marginTop: 14 }}>
              Final-Year B.Tech CSE Major Project · 2026
            </p>
          </div>

          <div>
            <h4 style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Platform Features</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              <span style={{ cursor: "pointer" }} onClick={() => onExploreJobs()}>Find Jobs & Internships</span>
              <span style={{ cursor: "pointer" }} onClick={() => onExploreJobs()}>AI Resume Matcher</span>
              <span style={{ cursor: "pointer" }} onClick={() => onExploreJobs()}>ATS Resume Builder</span>
              <span style={{ cursor: "pointer" }} onClick={() => onExploreJobs()}>STAR Mock Interview Prep</span>
            </div>
          </div>

          <div>
            <h4 style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 700, marginBottom: 16 }}>For Recruiters</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              <span style={{ cursor: "pointer" }} onClick={onHireTalent}>Post New Opening</span>
              <span style={{ cursor: "pointer" }} onClick={onHireTalent}>Side-by-Side Candidate Ranking</span>
              <span style={{ cursor: "pointer" }} onClick={onHireTalent}>Bulk Resume Upload & Parsing</span>
              <span style={{ cursor: "pointer" }} onClick={onHireTalent}>Recruitment Funnel Analytics</span>
            </div>
          </div>

          <div>
            <h4 style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 700, marginBottom: 16 }}>System Architecture</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              <span>FastAPI (Python 3.11+)</span>
              <span>React 18 + Vite (SPA)</span>
              <span>MongoDB Atlas Cloud DB</span>
              <span>PyMuPDF & TF-IDF Vector NLP</span>
            </div>
          </div>
        </div>

        <div style={{
          maxWidth: 1240,
          margin: "0 auto",
          paddingTop: 24,
          borderTop: "1px solid #1E293B",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          fontSize: 12
        }}>
          <div>
            © {new Date().getFullYear()} TalentAI Inc. All rights reserved.
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

