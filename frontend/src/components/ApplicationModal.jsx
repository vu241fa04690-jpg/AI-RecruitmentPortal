import React, { useState } from "react";
import {
  CloseIcon,
  SparklesIcon,
  CheckCircleIcon,
  MapPinIcon,
  DollarSignIcon,
  BriefcaseIcon,
  UsersIcon,
  FileTextIcon
} from "./Icons";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function ApplicationModal({ job, onClose, onSuccess, onViewApplications }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submittedApp, setSubmittedApp] = useState(null);

  // Resume data pre-filled if passed from Resume ATS Matcher
  const initialResumeData = job?.resumeData || {};
  const initialAtsScore = initialResumeData.match_score || 94;
  const initialResumeName = initialResumeData.resume_name || "Sumii_Resume.pdf";
  const initialSkills = initialResumeData.candidate_skills && initialResumeData.candidate_skills.length > 0
    ? initialResumeData.candidate_skills.join(", ")
    : (job?.skills ? job.skills.slice(0, 5).join(", ") : "Python, FastAPI, React, TypeScript, Docker");

  // Candidate Information Form State
  const [formData, setFormData] = useState({
    fullName: user?.name || "Candidate",
    email: user?.email || "",
    phone: user?.phone || "+91 98765 43210",
    city: "Bengaluru, India",
    college: "National Institute of Technology (NIT)",
    graduationYear: "2026",
    degree: "B.Tech in Computer Science & Engineering",
    experienceLevel: "Fresher / Final Year Student",
    skills: initialSkills,
    portfolioUrl: user?.email ? `https://github.com/${user.email.split("@")[0]}` : "https://github.com/candidate",
    coverNote: `I am passionate about ${job?.title || "this opportunity"} at ${job?.company || "your team"}. I have strong practical foundations in ${job?.skills ? job.skills.slice(0, 3).join(", ") : "software architecture"} and am eager to contribute to high-impact projects.`,
    resumeName: initialResumeName,
    atsScore: initialAtsScore
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitApplication = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const parsedSkills = formData.skills
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      const targetEmail = (formData.email || user?.email || "").toLowerCase().trim();

      const res = await api.submitApplication({
        job_id: job.id,
        candidate_id: user?.id,
        candidate_name: formData.fullName || user?.name || "Candidate",
        candidate_email: targetEmail,
        candidate_phone: formData.phone,
        candidate_college: formData.college,
        candidate_graduation_year: formData.graduationYear,
        candidate_degree: formData.degree,
        candidate_location: formData.city,
        experience_level: formData.experienceLevel,
        candidate_skills: parsedSkills,
        portfolio_url: formData.portfolioUrl,
        cover_letter: formData.coverNote,
        resume_name: formData.resumeName,
        match_score: formData.atsScore
      });

      setSubmittedApp(res);
      if (onSuccess) onSuccess(res);
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 780,
          width: "100%",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 22,
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(15, 23, 42, 0.4)",
          border: "2px solid #0066cc"
        }}
      >
        {/* Top Header - Job Details & Verified Partner Badge */}
        <div style={{
          padding: "20px 28px",
          background: "linear-gradient(135deg, #0f2b48 0%, #1c4980 100%)",
          color: "#ffffff",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexShrink: 0
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <span style={{
                background: "rgba(255, 255, 255, 0.2)",
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase"
              }}>
                {job.category === "internship" ? "🎓 INTERNSHIP & PPO" : "👔 FULL-TIME OPPORTUNITY"}
              </span>
              <span style={{ fontSize: 12, color: "#93c5fd" }}>✦ Verified Hiring Partner</span>
              <span className="badge badge-verified" style={{ background: "#059669", color: "#ffffff", fontSize: 11 }}>
                ★ {formData.atsScore}% ATS Match Verified
              </span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#ffffff", margin: "2px 0 4px", lineHeight: 1.25 }}>
              {job.title}
            </h2>
            <div style={{ fontSize: 13.5, color: "#bae6fd", fontWeight: 700 }}>
              {job.company} · <span style={{ color: "#cbd5e1", fontWeight: 500 }}>{job.department}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "none",
              color: "#ffffff",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0
            }}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "22px 28px", overflowY: "auto", flex: 1 }}>
          {submittedApp ? (
            /* Post-Submission Success Confirmation */
            <div style={{ textAlign: "center", padding: "24px 12px" }}>
              <div style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                boxShadow: "0 8px 24px rgba(16, 185, 129, 0.25)"
              }}>
                <CheckCircleIcon size={42} />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 900, color: "#0f2b48", marginBottom: 6 }}>
                Application Submitted Successfully!
              </h3>
              <p style={{ color: "#475569", fontSize: 14.5, maxWidth: 500, margin: "0 auto 20px" }}>
                Your candidate profile, attached resume, and verified ATS score have been delivered to the hiring team at <strong>{job.company}</strong>.
              </p>

              {/* Match Score & Confirmation Box */}
              <div style={{
                background: "#f0fdf4",
                border: "1.5px solid #86efac",
                borderRadius: 16,
                padding: "20px 24px",
                textAlign: "left",
                maxWidth: 580,
                margin: "0 auto 24px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#166534", textTransform: "uppercase" }}>
                      Application ID
                    </span>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#0f2b48" }}>
                      #{submittedApp.id || "app-" + Date.now().toString().slice(-4)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#166534", textTransform: "uppercase" }}>
                      ATS Rating
                    </span>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#059669" }}>
                      {submittedApp.match_score || formData.atsScore}%
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #bbf7d0", paddingTop: 10, fontSize: 13, color: "#166534", lineHeight: 1.5 }}>
                  <strong>Next Hiring Step:</strong> Your application has been fast-tracked into <em>Assessment & Screening Rounds</em>. Check the Assessment Rounds tab to practice the coding sandbox.
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "center", maxWidth: 460, margin: "0 auto" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  style={{ flex: 1, padding: "11px", fontWeight: 700 }}
                >
                  Close
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (onViewApplications) {
                      onViewApplications();
                    } else {
                      onClose();
                    }
                  }}
                  style={{
                    flex: 1.5,
                    padding: "11px 20px",
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #0066cc 0%, #00b4d8 100%)"
                  }}
                >
                  View in Applications Tracker →
                </button>
              </div>
            </div>
          ) : (
            /* Candidate Details Form to Fill Information */
            <form onSubmit={handleSubmitApplication} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Top Banner: Opportunity Stipend & ATS Fit */}
              <div style={{
                background: "linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)",
                border: "1.5px solid #bae6fd",
                borderRadius: 14,
                padding: "12px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800, color: "#15803d" }}>
                    <DollarSignIcon size={15} />
                    <span>{job.stipend_or_salary || job.salary_range}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569" }}>
                    <MapPinIcon size={14} />
                    <span>{job.location}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 800, color: "#0066cc" }}>
                  <SparklesIcon size={15} />
                  <span>Resume Attached: {formData.resumeName} ({formData.atsScore}% Score)</span>
                </div>
              </div>

              {/* Form Section 1: Personal Details (2 Columns) */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0f2b48", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                  👤 Candidate Personal Information:
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Sumii"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        fontWeight: 600
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="e.g. sumii@example.com"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        fontWeight: 600
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Phone / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="+91 98765 43210"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        fontWeight: 600
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Current City / Location *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Bengaluru / Hyderabad / Remote"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        fontWeight: 600
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Form Section 2: Education & Experience (2 Columns) */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0f2b48", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                  🎓 College & Academic Qualifications:
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.6fr", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      College / Institute Name *
                    </label>
                    <input
                      type="text"
                      name="college"
                      value={formData.college}
                      onChange={handleChange}
                      required
                      placeholder="e.g. National Institute of Technology (NIT)"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        fontWeight: 600
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Graduation Year *
                    </label>
                    <select
                      name="graduationYear"
                      value={formData.graduationYear}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        fontWeight: 600,
                        background: "#ffffff"
                      }}
                    >
                      <option value="2027">Batch 2027</option>
                      <option value="2026">Batch 2026</option>
                      <option value="2025">Batch 2025</option>
                      <option value="2024">Batch 2024</option>
                      <option value="2023">Batch 2023</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Degree & Branch *
                    </label>
                    <input
                      type="text"
                      name="degree"
                      value={formData.degree}
                      onChange={handleChange}
                      required
                      placeholder="e.g. B.Tech Computer Science, MCA, MBA"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        fontWeight: 600
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Experience Level *
                    </label>
                    <select
                      name="experienceLevel"
                      value={formData.experienceLevel}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        fontWeight: 600,
                        background: "#ffffff"
                      }}
                    >
                      <option value="Fresher / Final Year Student">Fresher / Final Year Student</option>
                      <option value="0 - 1 Years">0 - 1 Years Professional Experience</option>
                      <option value="1 - 3 Years">1 - 3 Years Experience</option>
                      <option value="3+ Years">3+ Years Experienced</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Section 3: Technical Skills & Portfolio */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0f2b48", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                  💻 Skills & Online Links:
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Key Technical Skills (Comma separated) *
                    </label>
                    <input
                      type="text"
                      name="skills"
                      value={formData.skills}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Python, FastAPI, React, Docker, SQL"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        fontWeight: 600
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      GitHub / Portfolio / LinkedIn URL
                    </label>
                    <input
                      type="url"
                      name="portfolioUrl"
                      value={formData.portfolioUrl}
                      onChange={handleChange}
                      placeholder="https://github.com/yourusername"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        fontWeight: 600
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Form Section 4: Cover Note / Why Hire You */}
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Cover Note / Pitch for Hiring Manager (Optional):
                </label>
                <textarea
                  name="coverNote"
                  rows={3}
                  value={formData.coverNote}
                  onChange={handleChange}
                  placeholder="Share a brief note about your passion and project accomplishments..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    lineHeight: 1.5,
                    resize: "vertical"
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{
                display: "flex",
                gap: 12,
                justifyContent: "flex-end",
                borderTop: "1px solid #e2e8f0",
                paddingTop: 16,
                marginTop: 4
              }}>
                <button
                  type="button"
                  className="btn"
                  onClick={onClose}
                  style={{ padding: "10px 20px", background: "#f1f5f9", color: "#475569", fontWeight: 700 }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{
                    padding: "11px 28px",
                    fontSize: 14,
                    fontWeight: 900,
                    background: "linear-gradient(135deg, #0066cc 0%, #00b4d8 100%)",
                    boxShadow: "0 4px 16px rgba(0, 102, 204, 0.4)"
                  }}
                >
                  {loading ? "Submitting Application..." : "⚡ Submit Application & Lock in ATS Score →"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
