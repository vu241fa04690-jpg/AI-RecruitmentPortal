import React, { useState, useEffect } from "react";
import {
  SearchIcon,
  MapPinIcon,
  BriefcaseIcon,
  DollarSignIcon,
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon,
  UsersIcon,
  ArrowUpRightIcon
} from "../components/Icons";
import { api, INITIAL_MOCK_JOBS } from "../services/api";

export default function JobBoard({
  initialCategory = "all",
  onApplyJob,
  onSelectJobForMatcher,
  user,
  onRequireAuth
}) {
  const [allJobsRaw, setAllJobsRaw] = useState(() => INITIAL_MOCK_JOBS || []);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [domainFilter, setDomainFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  // Top Details View & On-the-spot Apply State
  const [selectedTopJob, setSelectedTopJob] = useState(() => (INITIAL_MOCK_JOBS && INITIAL_MOCK_JOBS.length > 0 ? INITIAL_MOCK_JOBS[0] : null));
  const [appliedJobIds, setAppliedJobIds] = useState(new Set(["opp-1"]));
  const [spotApplyingId, setSpotApplyingId] = useState(null);
  const [spotToast, setSpotToast] = useState(null);

  useEffect(() => {
    setCategoryFilter(initialCategory);
  }, [initialCategory]);

  // Load all jobs once on mount with safety
  useEffect(() => {
    let isMounted = true;
    const fetchAllJobs = async () => {
      try {
        const rawList = await api.getJobs({});
        if (isMounted && rawList && rawList.length > 0) {
          setAllJobsRaw(rawList);
          if (!selectedTopJob) {
            setSelectedTopJob(rawList[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch jobs catalog:", err);
      }
    };

    fetchAllJobs();
    return () => { isMounted = false; };
  }, []);

  const reloadJobs = async () => {
    setLoading(true);
    try {
      const rawList = await api.getJobs({});
      setAllJobsRaw(rawList || []);
    } catch (err) {
      console.error("Failed to reload jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Instant in-memory filtering: 0ms latency when switching tabs
  const jobs = React.useMemo(() => {
    let list = allJobsRaw || [];
    if (domainFilter !== "all") {
      list = list.filter(j => (j.domain || "software").toLowerCase() === domainFilter.toLowerCase());
    }
    if (categoryFilter !== "all") {
      list = list.filter(j => (j.category || "job").toLowerCase() === categoryFilter.toLowerCase());
    }
    if (locationFilter === "remote") {
      list = list.filter(j => j.location.toLowerCase().includes("remote"));
    } else if (locationFilter === "hybrid") {
      list = list.filter(j => j.location.toLowerCase().includes("hybrid") || j.location.toLowerCase().includes("onsite"));
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(j =>
        j.title.toLowerCase().includes(s) ||
        j.company.toLowerCase().includes(s) ||
        (j.department && j.department.toLowerCase().includes(s)) ||
        (j.skills && j.skills.some(sk => sk.toLowerCase().includes(s)))
      );
    }
    return list;
  }, [allJobsRaw, domainFilter, categoryFilter, locationFilter, search]);

  const softwareCount = allJobsRaw.filter(j => (j.domain || "software") === "software").length;
  const businessCount = allJobsRaw.filter(j => j.domain === "business").length;
  const hardwareCount = allJobsRaw.filter(j => j.domain === "hardware").length;
  const internshipCount = allJobsRaw.filter(j => j.category === "internship").length;
  const jobCount = allJobsRaw.filter(j => j.category === "job").length;

  // On-the-spot 1-click application opening details form
  const handleApplyOnTheSpot = async (job, e) => {
    if (e) e.stopPropagation();

    // If user is not authenticated, redirect immediately to Signup / Sign In page!
    if (!user) {
      if (onRequireAuth) {
        onRequireAuth("register", job);
      } else if (onApplyJob) {
        onApplyJob(job);
      }
      return;
    }

    if (onApplyJob) {
      onApplyJob(job);
      return;
    }

    if (appliedJobIds.has(job.id)) {
      setSpotToast(`You have already applied to ${job.company} (${job.title})!`);
      setTimeout(() => setSpotToast(null), 3500);
      return;
    }
    setSpotApplyingId(job.id);
    try {
      const res = await api.submitApplication({
        job_id: job.id,
        candidate_name: user?.name || "Candidate",
        candidate_email: user?.email || "candidate@example.com",
        candidate_skills: user?.skills || job.skills || ["Python", "FastAPI", "React"],
        cover_letter: "Applied directly on the spot via Recruitment Portal AI Hub.",
        resume_name: "Candidate_Resume.pdf"
      });
      setAppliedJobIds(prev => new Set([...prev, job.id]));
      setSpotToast(`🎉 Applied on the spot to ${job.company} (${job.title})! AI Match Score: ${res?.match_score || 96}%`);
      setTimeout(() => setSpotToast(null), 4500);
    } catch (err) {
      console.error("On-the-spot apply failed:", err);
    } finally {
      setSpotApplyingId(null);
    }
  };

  const handleSelectJobForTop = (job) => {
    setSelectedTopJob(job);
    const topElem = document.getElementById("top-job-details-section");
    if (topElem) {
      topElem.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 350, behavior: "smooth" });
    }
  };

  return (
    <div style={{ maxWidth: 1340, margin: "0 auto", padding: "28px 24px 60px" }}>
      {/* On-the-spot Toast Notification */}
      {spotToast && (
        <div style={{
          position: "fixed",
          top: 80,
          right: 24,
          background: "linear-gradient(135deg, #065f46 0%, #047857 100%)",
          color: "#ffffff",
          padding: "14px 22px",
          borderRadius: 14,
          boxShadow: "0 10px 30px rgba(6, 95, 70, 0.4)",
          fontSize: 14,
          fontWeight: 800,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: 10,
          border: "1px solid #34d399",
          animation: "modalFadeIn 0.22s ease-out"
        }}>
          <span>⚡</span>
          <span>{spotToast}</span>
        </div>
      )}

      {/* Recruitment Portal Hero Banner */}
      <div style={{
        background: "linear-gradient(135deg, #0f2b48 0%, #0066cc 60%, #00b4d8 100%)",
        borderRadius: 22,
        padding: "38px 34px",
        color: "#ffffff",
        boxShadow: "0 12px 36px -6px rgba(0, 102, 204, 0.35)",
        marginBottom: 28,
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Subtle decorative glow */}
        <div style={{
          position: "absolute",
          right: -40,
          top: -40,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)",
          pointerEvents: "none"
        }} />

        <div style={{ maxWidth: 860, position: "relative", zIndex: 2 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255, 255, 255, 0.16)",
            padding: "6px 16px",
            borderRadius: 24,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            marginBottom: 14,
            border: "1px solid rgba(255, 255, 255, 0.25)"
          }}>
            ⚡ RECRUITMENT PORTAL • CAREER & INTERNSHIP HUB
          </div>

          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: -0.9, marginBottom: 12, lineHeight: 1.2 }}>
            Discover Engineering Jobs, Internships & Multi-Round Assessments
          </h1>
          <p style={{ fontSize: 16, color: "#e0f2fe", marginBottom: 26, lineHeight: 1.55 }}>
            Apply for verified tech openings, summer & winter internships with Pre-Placement Offers (PPO), and test your resume with our instant AI ATS diagnostic.
          </p>

          {/* Unstop Search Box */}
          <div style={{
            background: "#ffffff",
            borderRadius: 14,
            padding: "6px 8px 6px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.2)"
          }}>
            <SearchIcon size={20} color="#64748b" />
            <input
              type="text"
              placeholder="Search by role, company, or technology (e.g. Internship, React, Python)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                width: "100%",
                fontSize: 15,
                color: "#0f172a",
                fontWeight: 500
              }}
            />
            <button
              className="btn btn-primary"
              onClick={reloadJobs}
              style={{ padding: "10px 24px", borderRadius: 10, background: "#1c4980" }}
            >
              Find Opportunities
            </button>
          </div>
        </div>
      </div>

      {/* Unstop Quick Filter Pills with Dynamic Counts Across Software, Business, Hardware */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
        <button
          className={`filter-pill ${categoryFilter === "all" && domainFilter === "all" ? "filter-pill-active" : ""}`}
          onClick={() => { setCategoryFilter("all"); setDomainFilter("all"); }}
        >
          <span>🔥 All Opportunities</span>
          <span style={{
            background: categoryFilter === "all" && domainFilter === "all" ? "rgba(255, 255, 255, 0.25)" : "#e2e8f0",
            color: categoryFilter === "all" && domainFilter === "all" ? "#ffffff" : "#475569",
            borderRadius: 12,
            padding: "2px 8px",
            fontSize: 11,
            fontWeight: 800
          }}>{allJobsRaw.length || 22}</span>
        </button>

        {/* Domain Filters */}
        <button
          className={`filter-pill ${domainFilter === "software" ? "filter-pill-active" : ""}`}
          onClick={() => setDomainFilter(domainFilter === "software" ? "all" : "software")}
        >
          <span>💻 Software & AI</span>
          <span style={{
            background: domainFilter === "software" ? "rgba(255, 255, 255, 0.25)" : "#e0f2fe",
            color: domainFilter === "software" ? "#ffffff" : "#0369a1",
            borderRadius: 12,
            padding: "2px 8px",
            fontSize: 11,
            fontWeight: 800
          }}>{softwareCount || 11}</span>
        </button>

        <button
          className={`filter-pill ${domainFilter === "business" ? "filter-pill-active" : ""}`}
          onClick={() => setDomainFilter(domainFilter === "business" ? "all" : "business")}
        >
          <span>💼 Business & Finance</span>
          <span style={{
            background: domainFilter === "business" ? "rgba(255, 255, 255, 0.25)" : "#ccfbf1",
            color: domainFilter === "business" ? "#ffffff" : "#0f766e",
            borderRadius: 12,
            padding: "2px 8px",
            fontSize: 11,
            fontWeight: 800
          }}>{businessCount || 6}</span>
        </button>

        <button
          className={`filter-pill ${domainFilter === "hardware" ? "filter-pill-active" : ""}`}
          onClick={() => setDomainFilter(domainFilter === "hardware" ? "all" : "hardware")}
        >
          <span>🔌 Hardware & Embedded</span>
          <span style={{
            background: domainFilter === "hardware" ? "rgba(255, 255, 255, 0.25)" : "#ffedd5",
            color: domainFilter === "hardware" ? "#ffffff" : "#c2410c",
            borderRadius: 12,
            padding: "2px 8px",
            fontSize: 11,
            fontWeight: 800
          }}>{hardwareCount || 5}</span>
        </button>

        {/* Opportunity Types */}
        <button
          className={`filter-pill ${categoryFilter === "internship" ? "filter-pill-active" : ""}`}
          onClick={() => setCategoryFilter(categoryFilter === "internship" ? "all" : "internship")}
        >
          <span>🎓 Internships & PPO</span>
          <span style={{
            background: categoryFilter === "internship" ? "rgba(255, 255, 255, 0.25)" : "#fef3c7",
            color: categoryFilter === "internship" ? "#ffffff" : "#b45309",
            borderRadius: 12,
            padding: "2px 8px",
            fontSize: 11,
            fontWeight: 800
          }}>{internshipCount || 12}</span>
        </button>

        <button
          className={`filter-pill ${categoryFilter === "job" ? "filter-pill-active" : ""}`}
          onClick={() => setCategoryFilter(categoryFilter === "job" ? "all" : "job")}
        >
          <span>👔 Full-Time Jobs</span>
          <span style={{
            background: categoryFilter === "job" ? "rgba(255, 255, 255, 0.25)" : "#f3e8ff",
            color: categoryFilter === "job" ? "#ffffff" : "#7e22ce",
            borderRadius: 12,
            padding: "2px 8px",
            fontSize: 11,
            fontWeight: 800
          }}>{jobCount || 10}</span>
        </button>

        <button
          className={`filter-pill ${locationFilter === "remote" ? "filter-pill-active" : ""}`}
          onClick={() => setLocationFilter(locationFilter === "remote" ? "all" : "remote")}
        >
          <span>💻 Remote Only</span>
        </button>

        <button
          className={`filter-pill ${locationFilter === "hybrid" ? "filter-pill-active" : ""}`}
          onClick={() => setLocationFilter(locationFilter === "hybrid" ? "all" : "hybrid")}
        >
          <span>🏢 Hybrid / Onsite</span>
        </button>
      </div>

      {/* Main Container */}
      <div style={{ maxWidth: 1160, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* TOP DETAILS VIEW: Displays Full Opportunity Information at the Top Only */}
        {selectedTopJob && (
          <div
            id="top-job-details-section"
            style={{
              background: "#ffffff",
              borderRadius: 22,
              padding: "28px 32px",
              border: "2px solid #0066cc",
              boxShadow: "0 14px 40px rgba(0, 102, 204, 0.18)",
              marginBottom: 16,
              animation: "modalFadeIn 0.25s ease-out"
            }}
          >
            {/* Top Bar Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: selectedTopJob.company_logo_color || "#0f2b48",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 22,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)"
                }}>
                  {selectedTopJob.company ? selectedTopJob.company[0] : "O"}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span className="badge" style={{
                      background: selectedTopJob.domain === "business" ? "#f0fdfa" : selectedTopJob.domain === "hardware" ? "#fff7ed" : "#f0f9ff",
                      color: selectedTopJob.domain === "business" ? "#0f766e" : selectedTopJob.domain === "hardware" ? "#c2410c" : "#0369a1",
                      border: "1px solid currentColor"
                    }}>
                      {selectedTopJob.domain === "business" ? "💼 Business & Finance" : selectedTopJob.domain === "hardware" ? "🔌 Hardware & Embedded" : "💻 Software & AI"}
                    </span>
                    <span className={selectedTopJob.category === "internship" ? "badge badge-internship" : "badge badge-info"}>
                      {selectedTopJob.category === "internship" ? `🎓 Internship • ${selectedTopJob.duration || "3-6 Mos"}` : "👔 Full-Time"}
                    </span>
                    {selectedTopJob.verified_partner && (
                      <span className="badge badge-verified">✓ Verified Partner</span>
                    )}
                  </div>
                  <h2 style={{ fontSize: 24, fontWeight: 900, color: "#0f2b48", lineHeight: 1.25, margin: 0 }}>
                    {selectedTopJob.title}
                  </h2>
                  <div style={{ fontSize: 14, color: "#0073e6", fontWeight: 700, marginTop: 2 }}>
                    {selectedTopJob.company} · <span style={{ color: "#64748b", fontWeight: 500 }}>{selectedTopJob.department}</span>
                  </div>
                </div>
              </div>

              {/* Close Top View Button */}
              <button
                type="button"
                onClick={() => setSelectedTopJob(null)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: 34,
                  height: 34,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  fontWeight: 800,
                  fontSize: 16,
                  cursor: "pointer"
                }}
                title="Close Top Details"
              >
                ✕
              </button>
            </div>

            {/* Highlights row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
              background: "#f8fafc",
              padding: "12px 18px",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              marginBottom: 18
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 800, color: "#15803d" }}>
                <DollarSignIcon size={16} />
                <span>{selectedTopJob.stipend_or_salary || selectedTopJob.salary_range}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569", fontWeight: 600 }}>
                <MapPinIcon size={15} />
                <span>{selectedTopJob.location}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#0066cc", fontWeight: 700 }}>
                <UsersIcon size={15} />
                <span>{selectedTopJob.applicants_count || 240} Applicants</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#dc2626", fontWeight: 700, marginLeft: "auto" }}>
                <span>⏳ Closes in {selectedTopJob.deadline_days_left || 5} days</span>
              </div>
            </div>

            {/* Top Multi-Round Interview Assessment Roadmap */}
            <div style={{
              background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
              borderRadius: 14,
              padding: "16px 20px",
              border: "1px solid #bbf7d0",
              marginBottom: 18
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#166534", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                📋 Selection & Interview Roadmap ({selectedTopJob.interview_rounds?.length || 3} Rounds)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                {(selectedTopJob.interview_rounds || [
                  "Round 1: Online Technical Assessment & Aptitude",
                  "Round 2: Live Architecture & Coding Screen",
                  "Round 3: Leadership & Cultural Fitment"
                ]).map((round, idx) => (
                  <div key={idx} style={{
                    background: "#ffffff",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #dcfce7",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                  }}>
                    <span style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "#166534",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 800,
                      flexShrink: 0
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b", lineHeight: 1.4 }}>{round}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Description & Requirements Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18, marginBottom: 20 }}>
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: "#0f2b48", textTransform: "uppercase", marginBottom: 6 }}>
                  About the Opportunity
                </h4>
                <p style={{ fontSize: 13.5, color: "#334155", lineHeight: 1.65, margin: 0 }}>
                  {selectedTopJob.description}
                </p>
                {selectedTopJob.eligibility && (
                  <div style={{ marginTop: 10, fontSize: 12.5, color: "#475569" }}>
                    <strong style={{ color: "#0f2b48" }}>Eligibility:</strong> {selectedTopJob.eligibility}
                  </div>
                )}
              </div>

              <div style={{ background: "#f8fafc", padding: "16px 18px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <h4 style={{ fontSize: 12.5, fontWeight: 800, color: "#0f2b48", textTransform: "uppercase", marginBottom: 8 }}>
                  ✓ Key Requirements & Benefits
                </h4>
                <ul style={{ paddingLeft: 18, fontSize: 13, color: "#475569", lineHeight: 1.65, margin: 0 }}>
                  {selectedTopJob.requirements?.slice(0, 3).map((req, rIdx) => (
                    <li key={rIdx}>{req}</li>
                  ))}
                  {selectedTopJob.benefits?.slice(0, 2).map((ben, bIdx) => (
                    <li key={`b-${bIdx}`} style={{ color: "#0369a1", fontWeight: 600 }}>🎁 {ben}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Primary Action Buttons at Top Only */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              background: "#f0f9ff",
              padding: "16px 20px",
              borderRadius: 14,
              border: "1px solid #bae6fd"
            }}>
              <div style={{ fontSize: 13.5, color: "#0369a1" }}>
                <strong style={{ color: "#0f2b48" }}>Candidate: Sumii</strong> · Ready to apply on the spot with 1-click.
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onSelectJobForMatcher(selectedTopJob)}
                  style={{ fontSize: 12.5, padding: "10px 18px", fontWeight: 700 }}
                >
                  <SparklesIcon size={14} color="#0073e6" /> Check ATS Score
                </button>

                {appliedJobIds.has(selectedTopJob.id) ? (
                  <button
                    type="button"
                    disabled
                    style={{
                      background: "#ecfdf5",
                      color: "#047857",
                      border: "1.5px solid #a7f3d0",
                      padding: "10px 24px",
                      borderRadius: 10,
                      fontWeight: 800,
                      fontSize: 13.5,
                      cursor: "default"
                    }}
                  >
                    ✓ Applied on the Spot (96% Match)
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={(e) => handleApplyOnTheSpot(selectedTopJob, e)}
                    disabled={spotApplyingId === selectedTopJob.id}
                    style={{
                      fontSize: 14,
                      padding: "10px 28px",
                      fontWeight: 900,
                      background: "linear-gradient(135deg, #0066cc 0%, #00b4d8 100%)",
                      boxShadow: "0 4px 16px rgba(0, 102, 204, 0.4)"
                    }}
                  >
                    {spotApplyingId === selectedTopJob.id ? "Applying on the Spot..." : "⚡ Apply Now on the Spot →"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Section Heading */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1c4980" }}>
            {domainFilter === "software" ? "Software & AI Engineering Roles" : domainFilter === "business" ? "Business, Strategy & Finance Roles" : domainFilter === "hardware" ? "Hardware, VLSI & Embedded Roles" : categoryFilter === "internship" ? "Featured Internships & PPO" : categoryFilter === "job" ? "Full-Time Career Positions" : "Live Hiring Opportunities"} ({jobs.length})
          </h2>
          <span style={{ fontSize: 13, color: "#5a6a85" }}>Live Catalog • Click any role to view details at the top</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "#64748b" }}>Loading opportunities...</div>
        ) : jobs.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 48, borderRadius: 16 }}>
            <p style={{ color: "#64748b", fontSize: 16, marginBottom: 16 }}>No opportunities match your current filter combination.</p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setDomainFilter("all");
                setCategoryFilter("all");
                setLocationFilter("all");
                setSearch("");
              }}
              style={{ padding: "8px 20px", fontWeight: 700 }}
            >
              🔄 Reset Filters to View All {allJobsRaw.length || 22} Opportunities
            </button>
          </div>
        ) : (
          jobs.map((job) => {
            const isSelectedAtTop = selectedTopJob?.id === job.id;
            const isApplied = appliedJobIds.has(job.id);
            const isApplying = spotApplyingId === job.id;

            return (
              <div
                key={job.id}
                className="card card-hover"
                style={{
                  cursor: "pointer",
                  border: isSelectedAtTop ? "2px solid #0066cc" : "1px solid #e2e8f0",
                  boxShadow: isSelectedAtTop ? "0 10px 28px rgba(0, 102, 204, 0.16)" : undefined,
                  padding: "22px 26px",
                  transition: "all 0.22s ease",
                  background: isSelectedAtTop ? "#f8fafc" : "#ffffff"
                }}
                onClick={() => handleSelectJobForTop(job)}
              >
                {/* Top Badge Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {/* Domain Tag */}
                    {job.domain === "business" ? (
                      <span className="badge" style={{ background: "#f0fdfa", color: "#0f766e", border: "1px solid #99f6e4" }}>
                        💼 Business & Finance
                      </span>
                    ) : job.domain === "hardware" ? (
                      <span className="badge" style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>
                        🔌 Hardware & Embedded
                      </span>
                    ) : (
                      <span className="badge" style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" }}>
                        💻 Software & AI
                      </span>
                    )}

                    {job.category === "internship" ? (
                      <span className="badge badge-internship">🎓 Internship • {job.duration || "3-6 Mos"}</span>
                    ) : (
                      <span className="badge badge-info">👔 Full-Time</span>
                    )}

                    {job.verified_partner && (
                      <span className="badge badge-verified">✓ Verified Partner</span>
                    )}

                    {isSelectedAtTop && (
                      <span className="badge badge-primary" style={{ background: "#0066cc", color: "#ffffff" }}>
                        ★ Viewing Details at Top
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#dc2626", fontWeight: 700 }}>
                    <span>⏳ Closes in {job.deadline_days_left || 5} days</span>
                  </div>
                </div>

                {/* Company & Title Header (Unstop Style) */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 14 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: job.company_logo_color || "#1c4980",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: 18,
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)"
                  }}>
                    {job.company ? job.company[0] : "O"}
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 3, lineHeight: 1.3 }}>
                      {job.title}
                    </h3>
                    <div style={{ fontSize: 14, color: "#0073e6", fontWeight: 700 }}>
                      {job.company} · <span style={{ color: "#64748b", fontWeight: 500 }}>{job.department}</span>
                    </div>
                  </div>
                </div>

                {/* Unstop Highlights Badges (Stipend, Location, Applicants) */}
                <div style={{
                  background: "linear-gradient(135deg, #f8fafc 0%, #f0fdf4 100%)",
                  borderRadius: 12,
                  padding: "12px 16px",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 14,
                  border: "1px solid #dcfce7"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800, color: "#15803d" }}>
                    <DollarSignIcon size={16} />
                    <span>{job.stipend_or_salary || job.salary_range}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569", fontWeight: 600 }}>
                    <MapPinIcon size={15} />
                    <span>{job.location}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#0066cc", fontWeight: 700 }}>
                    <UsersIcon size={15} />
                    <span>{job.applicants_count || 240} Applicants</span>
                  </div>
                </div>

                {/* Eligibility Tag */}
                {job.eligibility && (
                  <div style={{ fontSize: 12.5, color: "#475569", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontWeight: 800, color: "#1c4980" }}>Eligibility:</span>
                    <span>{job.eligibility}</span>
                  </div>
                )}

                {/* Skills tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                  {job.skills.map((skill, idx) => (
                    <span key={idx} className="badge badge-neutral" style={{ fontSize: 11, background: "#edf2f7" }}>
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Card Footer Actions */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTop: "1px solid #f1f5f9",
                  paddingTop: 12,
                  flexWrap: "wrap",
                  gap: 10
                }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectJobForMatcher(job);
                    }}
                    style={{ fontSize: 12, padding: "8px 14px", fontWeight: 700 }}
                  >
                    <SparklesIcon size={14} color="#0073e6" /> Upload Resume & Check ATS Score
                  </button>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectJobForTop(job);
                      }}
                      style={{
                        fontSize: 12.5,
                        padding: "8px 14px",
                        fontWeight: 700,
                        background: isSelectedAtTop ? "#0066cc" : "#f1f5f9",
                        color: isSelectedAtTop ? "#ffffff" : "#0f2b48",
                        border: isSelectedAtTop ? "1px solid #0066cc" : "1px solid #cbd5e1",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      <span>{isSelectedAtTop ? "Viewing at Top ✓" : "Show Details at Top ▴"}</span>
                    </button>

                    {isApplied ? (
                      <button
                        type="button"
                        disabled
                        style={{
                          fontSize: 13,
                          padding: "8px 20px",
                          fontWeight: 800,
                          background: "#ecfdf5",
                          color: "#047857",
                          border: "1px solid #a7f3d0",
                          borderRadius: 8,
                          cursor: "default"
                        }}
                      >
                        ✓ Applied
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={(e) => handleApplyOnTheSpot(job, e)}
                        disabled={isApplying}
                        style={{
                          fontSize: 13,
                          padding: "8px 22px",
                          fontWeight: 800,
                          boxShadow: "0 4px 12px rgba(0, 102, 204, 0.35)",
                          background: "linear-gradient(135deg, #0066cc 0%, #00b4d8 100%)"
                        }}
                      >
                        {isApplying ? "Applying..." : "⚡ Apply Now on the Spot →"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
