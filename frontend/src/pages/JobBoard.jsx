import React, { useState, useEffect, useMemo } from "react";
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
import OpportunityDetailsModal from "../components/OpportunityDetailsModal";

export default function JobBoard({
  initialCategory = "all",
  initialFilter = null,
  onApplyJob,
  onSelectJobForMatcher,
  user,
  onRequireAuth
}) {
  const [allJobsRaw, setAllJobsRaw] = useState(() => INITIAL_MOCK_JOBS || []);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [domainFilter, setDomainFilter] = useState("all");
  const [workplaceFilter, setWorkplaceFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [salaryFilter, setSalaryFilter] = useState("all");
  const [selectedSkill, setSelectedSkill] = useState("all");
  const [search, setSearch] = useState(initialFilter?.query || "");
  const [locationSearch, setLocationSearch] = useState(initialFilter?.location || "");
  const [sortBy, setSortBy] = useState("latest");
  const [loading, setLoading] = useState(false);

  // Saved / Bookmark job IDs set
  const [savedJobIds, setSavedJobIds] = useState(new Set());

  // Opportunity Details Modal & On-the-spot Apply State
  const [modalOpportunity, setModalOpportunity] = useState(null);
  const [appliedJobIds, setAppliedJobIds] = useState(() => {
    if (user?.email?.toLowerCase() === "sumii@example.com") {
      return new Set(["opp-1"]);
    }
    return new Set();
  });
  const [spotApplyingId, setSpotApplyingId] = useState(null);
  const [spotToast, setSpotToast] = useState(null);

  useEffect(() => {
    setCategoryFilter(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    if (initialFilter?.query) setSearch(initialFilter.query);
    if (initialFilter?.location) setLocationSearch(initialFilter.location);
    if (initialFilter?.category) setCategoryFilter(initialFilter.category);
  }, [initialFilter]);

  // Sync applied & saved jobs specific to candidate account
  useEffect(() => {
    let isMounted = true;
    const syncUserData = async () => {
      if (!user?.email) {
        setAppliedJobIds(new Set());
        setSavedJobIds(new Set());
        return;
      }
      try {
        const [apps, saved] = await Promise.all([
          api.getApplications({ candidate_email: user.email.toLowerCase(), candidate_id: user.id }),
          api.getSavedJobs().catch(() => [])
        ]);

        if (isMounted) {
          if (Array.isArray(apps)) {
            const userAppliedIds = new Set(
              apps
                .filter(a => (a.candidate_email && a.candidate_email.toLowerCase() === user.email.toLowerCase()) || (user.id && a.candidate_id === user.id))
                .map(a => a.job_id)
            );
            setAppliedJobIds(userAppliedIds);
          }

          if (Array.isArray(saved)) {
            setSavedJobIds(new Set(saved.map(j => j.id)));
          }
        }
      } catch (err) {
        console.warn("Could not sync candidate applications:", err);
      }
    };
    syncUserData();
    return () => { isMounted = false; };
  }, [user?.email, user?.id]);

  // Load all jobs from backend
  useEffect(() => {
    let isMounted = true;
    const fetchAllJobs = async () => {
      setLoading(true);
      try {
        const rawList = await api.getJobs({});
        if (isMounted && rawList && rawList.length > 0) {
          setAllJobsRaw(rawList);
          // Keep selectedTopJob null by default so user sees full job stream immediately
        }
      } catch (err) {
        console.error("Failed to fetch jobs catalog:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllJobs();
    return () => { isMounted = false; };
  }, []);

  const handleToggleSave = async (job, e) => {
    if (e) e.stopPropagation();
    if (!user) {
      if (onRequireAuth) onRequireAuth("login", job);
      return;
    }

    const isSaved = savedJobIds.has(job.id);
    if (isSaved) {
      await api.unsaveJob(job.id);
      setSavedJobIds(prev => {
        const next = new Set(prev);
        next.delete(job.id);
        return next;
      });
      setSpotToast(`Removed "${job.title}" from saved bookmarks.`);
    } else {
      await api.saveJob(job.id);
      setSavedJobIds(prev => new Set([...prev, job.id]));
      setSpotToast(`❤️ Saved "${job.title}" to bookmarks!`);
    }
    setTimeout(() => setSpotToast(null), 3000);
  };

  // Instant in-memory filtering: 0ms latency
  const filteredJobs = useMemo(() => {
    let list = allJobsRaw || [];

    if (domainFilter !== "all") {
      list = list.filter(j => (j.domain || "software").toLowerCase() === domainFilter.toLowerCase());
    }
    if (categoryFilter !== "all") {
      list = list.filter(j => (j.category || "job").toLowerCase() === categoryFilter.toLowerCase());
    }
    if (workplaceFilter === "remote") {
      list = list.filter(j => j.location.toLowerCase().includes("remote"));
    } else if (workplaceFilter === "hybrid") {
      list = list.filter(j => j.location.toLowerCase().includes("hybrid") || j.location.toLowerCase().includes("onsite"));
    }

    if (experienceFilter !== "all") {
      if (experienceFilter === "fresher") {
        list = list.filter(j => /fresher|college|intern|entry/i.test(j.experience_level || ""));
      } else if (experienceFilter === "1-3") {
        list = list.filter(j => /1|2|3|junior/i.test(j.experience_level || ""));
      }
    }

    if (selectedSkill !== "all") {
      list = list.filter(j => j.skills && j.skills.some(s => s.toLowerCase() === selectedSkill.toLowerCase()));
    }

    if (locationSearch.trim()) {
      const loc = locationSearch.toLowerCase();
      list = list.filter(j => j.location.toLowerCase().includes(loc));
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

    if (sortBy === "applicants") {
      list = [...list].sort((a, b) => (b.applicants_count || 0) - (a.applicants_count || 0));
    }

    return list;
  }, [allJobsRaw, domainFilter, categoryFilter, workplaceFilter, experienceFilter, selectedSkill, search, locationSearch, sortBy]);

  const handleApplyOnTheSpot = async (job, e) => {
    if (e) e.stopPropagation();

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
        candidate_id: user?.id,
        candidate_name: user?.name || "Candidate",
        candidate_email: (user?.email || "").toLowerCase().trim(),
        candidate_skills: user?.skills || job.skills || ["Python", "FastAPI", "React"],
        cover_letter: "Applied directly on the spot via TalentAI Portal.",
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

  const handleOpenDetailsModal = (job) => {
    setModalOpportunity(job);
  };

  return (
    <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 24px 80px" }}>
      {/* Toast Alert */}
      {spotToast && (
        <div style={{
          position: "fixed",
          top: 90,
          right: 24,
          background: "#172554",
          color: "#FFFFFF",
          padding: "14px 22px",
          borderRadius: 14,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          zIndex: 9999,
          fontWeight: 700,
          fontSize: 13.5,
          border: "1.5px solid #3157D5",
          animation: "modalEnter 0.2s ease"
        }}>
          {spotToast}
        </div>
      )}

      {/* TOP SEARCH & SORT BAR */}
      <div className="card" style={{ padding: "18px 24px", marginBottom: 24, borderRadius: 18 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          {/* Main search box */}
          <div style={{
            flex: 1.8,
            minWidth: 260,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            padding: "8px 14px"
          }}>
            <SearchIcon size={18} color="#64748B" />
            <input
              type="text"
              placeholder="Search by role, company, or tech stack (e.g. FastAPI, SDE)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", border: "none", background: "transparent", outline: "none", fontSize: 13.5, color: "#0F172A" }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ border: "none", background: "none", color: "#94A3B8", fontSize: 13 }}>✕</button>
            )}
          </div>

          {/* Location input */}
          <div style={{
            flex: 1.2,
            minWidth: 200,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            padding: "8px 14px"
          }}>
            <MapPinIcon size={18} color="#64748B" />
            <input
              type="text"
              placeholder="Location or Remote..."
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              style={{ width: "100%", border: "none", background: "transparent", outline: "none", fontSize: 13.5, color: "#0F172A" }}
            />
          </div>

          {/* Sort By Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#64748B" }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid #CBD5E1",
                fontSize: 13,
                fontWeight: 600,
                color: "#0F172A",
                background: "#FFFFFF"
              }}
            >
              <option value="latest">Latest Verified Jobs</option>
              <option value="applicants">Most Applicants</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2-COLUMN LAYOUT: SIDEBAR + MAIN JOB STREAM */}
      <div style={{ display: "grid", gridTemplateColumns: "285px 1fr", gap: 28, alignItems: "start" }}>

        {/* LEFT FILTERS SIDEBAR */}
        <aside className="card" style={{ padding: "22px 20px", borderRadius: 18, position: "sticky", top: 110 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>Filters</h3>
            <button
              onClick={() => {
                setCategoryFilter("all");
                setDomainFilter("all");
                setWorkplaceFilter("all");
                setExperienceFilter("all");
                setSelectedSkill("all");
                setSearch("");
                setLocationSearch("");
              }}
              style={{ border: "none", background: "none", color: "#3157D5", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              Reset All
            </button>
          </div>

          {/* Filter 1: Domain Track */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", marginBottom: 8, display: "block" }}>
              Domain & Track
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { id: "all", label: "All Engineering Tracks" },
                { id: "software", label: "💻 Software, AI & Web" },
                { id: "business", label: "📈 Product & Growth" },
                { id: "design", label: "🎨 UI/UX & Design" },
                { id: "hardware", label: "🔌 Hardware & Robotics" }
              ].map(d => (
                <button
                  key={d.id}
                  onClick={() => setDomainFilter(d.id)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 8,
                    textAlign: "left",
                    fontSize: 12.5,
                    fontWeight: domainFilter === d.id ? 800 : 500,
                    background: domainFilter === d.id ? "#EEF2FF" : "transparent",
                    color: domainFilter === d.id ? "#1D4ED8" : "#475569",
                    border: "none"
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter 2: Opportunity Type (Unstop Categories) */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", marginBottom: 8, display: "block" }}>
              Opportunity Type
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { id: "all", label: "All Opportunities" },
                { id: "job", label: "💼 Full-Time Jobs" },
                { id: "internship", label: "🎓 Internships & PPO" },
                { id: "hackathon", label: "⚡ Hackathons & Coding" },
                { id: "competition", label: "🏆 Competitions" }
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(c.id)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 8,
                    textAlign: "left",
                    fontSize: 12.5,
                    fontWeight: categoryFilter === c.id ? 800 : 500,
                    background: categoryFilter === c.id ? "#EEF2FF" : "transparent",
                    color: categoryFilter === c.id ? "#1D4ED8" : "#475569",
                    border: "none"
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter 3: Workplace Arrangement */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", marginBottom: 8, display: "block" }}>
              Workplace Type
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { id: "all", label: "Any Workplace" },
                { id: "remote", label: "🌐 Remote Only" },
                { id: "hybrid", label: "🏢 Hybrid / Onsite" }
              ].map(w => (
                <button
                  key={w.id}
                  onClick={() => setWorkplaceFilter(w.id)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 8,
                    textAlign: "left",
                    fontSize: 12.5,
                    fontWeight: workplaceFilter === w.id ? 800 : 500,
                    background: workplaceFilter === w.id ? "#EEF2FF" : "transparent",
                    color: workplaceFilter === w.id ? "#3157D5" : "#475569",
                    border: "none"
                  }}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter 4: Quick Skills Filter Chips */}
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", marginBottom: 8, display: "block" }}>
              Popular Technologies
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["Python", "FastAPI", "React", "Docker", "Java", "MongoDB", "PyTorch"].map(s => {
                const isSelected = selectedSkill.toLowerCase() === s.toLowerCase();
                return (
                  <button
                    key={s}
                    onClick={() => setSelectedSkill(isSelected ? "all" : s)}
                    style={{
                      padding: "4px 9px",
                      borderRadius: 6,
                      fontSize: 11.5,
                      fontWeight: 700,
                      background: isSelected ? "#3157D5" : "#F1F5F9",
                      color: isSelected ? "#FFFFFF" : "#475569",
                      border: "none"
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* MAIN JOBS SECTION */}
        <main style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Job stream count header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 2px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
              Showing <span style={{ color: "#3157D5" }}>{filteredJobs.length}</span> Opportunities
            </div>
            <div style={{ fontSize: 12, color: "#64748B" }}>
              Updated real-time from TalentAI Cloud Database
            </div>
          </div>

          {/* JOB CARDS LIST */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[1, 2, 3].map(n => (
                <div key={n} className="card skeleton" style={{ height: 160, borderRadius: 16 }} />
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="card" style={{ padding: "60px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>
                No Jobs Found Matching Your Criteria
              </h3>
              <p style={{ fontSize: 13.5, color: "#64748B", maxWidth: 440, margin: "0 auto 18px" }}>
                Try adjusting your search keywords, workplace type, or resetting filters to explore all available engineering positions.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setLocationSearch("");
                  setCategoryFilter("all");
                  setDomainFilter("all");
                }}
                className="btn btn-primary"
                style={{ padding: "8px 20px" }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredJobs.map((job) => {
              const isApplied = appliedJobIds.has(job.id);
              const isSaved = savedJobIds.has(job.id);

              return (
                <div
                  key={job.id}
                  onClick={() => handleOpenDetailsModal(job)}
                  className="card card-hover"
                  style={{
                    padding: "22px 26px",
                    borderRadius: 16,
                    cursor: "pointer",
                    border: modalOpportunity?.id === job.id ? "1.5px solid #1D4ED8" : "1px solid #E2E8F0"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: job.company_logo_color || "#3157D5",
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        fontSize: 18
                      }}>
                        {job.company ? job.company[0] : "C"}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                            {job.title}
                          </h3>
                          {job.verified_partner && (
                            <span className="badge badge-success" style={{ fontSize: 10.5 }}>✓ Verified Partner</span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: "#1D4ED8", fontWeight: 700, marginTop: 2 }}>
                          {job.company} · <span style={{ color: "#64748B", fontWeight: 500 }}>{job.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bookmark & Apply Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        onClick={(e) => handleToggleSave(job, e)}
                        title={isSaved ? "Remove Bookmark" : "Save Job"}
                        style={{
                          background: isSaved ? "#FEE2E2" : "#F1F5F9",
                          border: "none",
                          borderRadius: 8,
                          padding: "6px 10px",
                          fontSize: 14,
                          cursor: "pointer"
                        }}
                      >
                        {isSaved ? "❤️" : "🤍"}
                      </button>

                      <button
                        onClick={(e) => handleApplyOnTheSpot(job, e)}
                        className={isApplied ? "btn btn-secondary" : "btn btn-primary"}
                        disabled={isApplied || spotApplyingId === job.id}
                        style={{ padding: "8px 18px", fontSize: 13 }}
                      >
                        {spotApplyingId === job.id ? "Applying..." : isApplied ? "✓ Applied" : "⚡ Apply on the Spot"}
                      </button>
                    </div>
                  </div>

                  {/* Badges strip */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "14px 0" }}>
                    <span className="badge badge-neutral">💰 {job.stipend_or_salary}</span>
                    <span className="badge badge-neutral">💼 {job.type}</span>
                    <span className="badge badge-neutral">⏳ {job.duration || "Permanent"}</span>
                    <span className="badge badge-neutral">👥 {job.applicants_count || 120} Applicants</span>
                  </div>

                  {/* Skills strip */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {(job.skills || []).slice(0, 5).map((sk, i) => (
                        <span key={i} style={{ background: "#EEF2FF", color: "#1D4ED8", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>
                          {sk}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetailsModal(job);
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        fontSize: 12.5,
                        color: "#1D4ED8",
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      <span>View Details & Requirements</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </main>
      </div>

      {/* Opportunity Details Popup Modal (Centered, Non-Pushing, Click-to-Open) */}
      {modalOpportunity && (
        <OpportunityDetailsModal
          opportunity={modalOpportunity}
          onClose={() => setModalOpportunity(null)}
          onApply={(job) => {
            if (onApplyJob) {
              onApplyJob(job);
            } else {
              handleApplyOnTheSpot(job);
            }
          }}
          onToggleSave={(job) => handleToggleSave(job)}
          isSaved={savedJobIds.has(modalOpportunity.id)}
          isApplied={appliedJobIds.has(modalOpportunity.id)}
        />
      )}
    </div>
  );
}
