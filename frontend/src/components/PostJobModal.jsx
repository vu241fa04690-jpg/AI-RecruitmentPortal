import React, { useState } from "react";
import { CloseIcon, SparklesIcon, PlusIcon } from "./Icons";
import { api } from "../services/api";

export default function PostJobModal({ onClose, onSuccess }) {
  const [title, setTitle] = useState("AI Solutions Architect");
  const [company, setCompany] = useState("CognitiveFlow Technologies");
  const [location, setLocation] = useState("Remote / San Francisco, CA");
  const [type, setType] = useState("Full-Time");
  const [experienceLevel, setExperienceLevel] = useState("Senior (5+ yrs)");
  const [salaryRange, setSalaryRange] = useState("$150,000 - $195,000");
  const [department, setDepartment] = useState("AI Architecture");
  const [skills, setSkills] = useState("Python, FastAPI, LangChain, PyTorch, Vector DB, AWS");
  const [description, setDescription] = useState(
    "Lead enterprise AI transformations, design resilient inference pipelines, and architect high-scale intelligent workflows."
  );
  const [requirements, setRequirements] = useState(
    "5+ years software architecture experience\nProven expertise deploying generative AI models to production\nHands-on proficiency with FastAPI, Python, and cloud infrastructure"
  );
  const [loadingAI, setLoadingAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleGenerateAI = async () => {
    if (!title) return;
    setLoadingAI(true);
    try {
      const skillsArray = skills.split(",").map(s => s.trim()).filter(Boolean);
      const res = await api.generateJobDescriptionAI({
        title,
        department,
        experience_level: experienceLevel,
        key_skills: skillsArray
      });
      if (res.description) setDescription(res.description);
      if (res.requirements && Array.isArray(res.requirements)) {
        setRequirements(res.requirements.join("\n"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const skillsArray = skills.split(",").map(s => s.trim()).filter(Boolean);
      const reqsArray = requirements.split("\n").map(r => r.trim()).filter(Boolean);
      const newJob = await api.createJob({
        title,
        company,
        location,
        type,
        experience_level: experienceLevel,
        salary_range: salaryRange,
        department,
        description,
        requirements: reqsArray,
        skills: skillsArray
      });
      if (onSuccess) onSuccess(newJob);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Create New Job Posting</h2>
            <p style={{ fontSize: 13, color: "#64748b" }}>Publish an open role to the platform with AI assistance</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b" }}>
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Job Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Company Name
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Location
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Employment Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Contract">Contract</option>
                <option value="Remote">Remote</option>
                <option value="Part-Time">Part-Time</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Salary Range
              </label>
              <input
                type="text"
                required
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
              Target Skills (comma separated)
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
            />
          </div>

          {/* AI Helper Banner */}
          <div style={{
            background: "#fdf4ff",
            border: "1px solid #f0abfc",
            borderRadius: 8,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <SparklesIcon size={18} color="#c026d3" />
              <span style={{ fontSize: 13, color: "#86198f", fontWeight: 500 }}>
                Need help drafting description & requirements? Let AI write it for you.
              </span>
            </div>
            <button
              type="button"
              className="btn btn-ai"
              onClick={handleGenerateAI}
              disabled={loadingAI}
              style={{ padding: "6px 12px", fontSize: 12 }}
            >
              {loadingAI ? "Generating..." : "Auto-Fill with AI"}
            </button>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
              Role Overview
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
              Requirements (one per line)
            </label>
            <textarea
              rows={3}
              required
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Publishing..." : "Publish Job Posting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

