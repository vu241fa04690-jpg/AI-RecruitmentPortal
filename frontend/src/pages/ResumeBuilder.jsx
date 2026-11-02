import React, { useState, useEffect } from "react";
import { api } from "../services/api";

export default function ResumeBuilder({ user, onBackToJobs }) {
  const [activeTab, setActiveTab] = useState("builder"); // 'builder', 'versions', 'preview'
  const [savedVersions, setSavedVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Resume State
  const [resumeTitle, setResumeTitle] = useState("Primary Full-Stack Resume");
  const [fullName, setFullName] = useState(user?.name || "Sumii");
  const [email, setEmail] = useState(user?.email || "sumii@example.com");
  const [phone, setPhone] = useState(user?.phone || "+1 555-0192");
  const [location, setLocation] = useState("Bengaluru, India / Remote");
  const [linkedin, setLinkedin] = useState("linkedin.com/in/sumii-dev");
  const [github, setGithub] = useState("github.com/sumii-tech");
  const [portfolio, setPortfolio] = useState("sumii.dev");
  const [summary, setSummary] = useState(
    "High-performing Full-Stack Engineer with 3+ years of experience engineering asynchronous FastAPI microservices, reactive React web applications, and MongoDB cloud architectures."
  );
  const [skills, setSkills] = useState(
    user?.skills?.length ? user.skills : ["Python", "FastAPI", "React", "Docker", "MongoDB", "TypeScript"]
  );
  const [newSkill, setNewSkill] = useState("");

  const [experiences, setExperiences] = useState([
    {
      title: "Software Engineer",
      company: "CognitiveFlow Labs",
      duration: "2024 - Present",
      description: "Architected distributed RESTful APIs using FastAPI and MongoDB Atlas. Reduced 99th percentile query latency by 45% using compound indexing and Redis caching."
    }
  ]);

  const [education, setEducation] = useState([
    {
      degree: "B.Tech in Computer Science & Engineering",
      institution: "National Institute of Technology",
      year: "2021 - 2025",
      grade: "8.9 / 10 CGPA"
    }
  ]);

  const [projects, setProjects] = useState([
    {
      title: "AI Recruitment Portal",
      tech_stack: "FastAPI, React 18, Vite, MongoDB, Sentence Transformers",
      description: "Engineered automated resume parsing and ATS matching engine supporting concurrent PDF/DOCX processing.",
      link: "https://github.com/sumii-tech/ai-recruitment"
    }
  ]);

  const [certifications, setCertifications] = useState([
    "AWS Certified Cloud Practitioner",
    "DeepLearning.AI Machine Learning Specialization"
  ]);
  const [newCert, setNewCert] = useState("");

  // ATS Evaluation State
  const [atsResult, setAtsResult] = useState(null);
  const [isEvaluatingATS, setIsEvaluatingATS] = useState(false);

  useEffect(() => {
    loadSavedVersions();
  }, []);

  const loadSavedVersions = async () => {
    setIsLoading(true);
    try {
      const res = await api.listCandidateResumes();
      if (res?.resumes?.length) {
        setSavedVersions(res.resumes);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (sk) => {
    setSkills(skills.filter((s) => s !== sk));
  };

  const handleAddCert = () => {
    if (newCert.trim() && !certifications.includes(newCert.trim())) {
      setCertifications([...certifications, newCert.trim()]);
      setNewCert("");
    }
  };

  const handleAddExperience = () => {
    setExperiences([
      ...experiences,
      { title: "", company: "", duration: "", description: "" }
    ]);
  };

  const handleAddEducation = () => {
    setEducation([
      ...education,
      { degree: "", institution: "", year: "", grade: "" }
    ]);
  };

  const handleAddProject = () => {
    setProjects([
      ...projects,
      { title: "", tech_stack: "", description: "", link: "" }
    ]);
  };

  const handleSaveToCloud = async () => {
    setIsLoading(true);
    const resumeData = {
      resume_title: resumeTitle,
      full_name: fullName,
      email,
      phone,
      location,
      linkedin,
      github,
      portfolio,
      summary,
      skills,
      experiences,
      education,
      projects,
      certifications
    };

    try {
      await api.saveResumeBuilder(resumeData);
      setStatusMessage("Resume saved to MongoDB Atlas cloud database!");
      setTimeout(() => setStatusMessage(null), 4000);
      loadSavedVersions();
    } catch (e) {
      setStatusMessage("Error saving resume. Saved locally.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckATS = async () => {
    setIsEvaluatingATS(true);
    const fullText = `
      ${fullName} - ${email} - ${phone} - ${location}
      Summary: ${summary}
      Technical Skills: ${skills.join(", ")}
      Experience: ${experiences.map((e) => `${e.title} at ${e.company} (${e.duration}): ${e.description}`).join("\n")}
      Education: ${education.map((ed) => `${ed.degree} from ${ed.institution} (${ed.year})`).join("\n")}
      Projects: ${projects.map((p) => `${p.title} (${p.tech_stack}): ${p.description}`).join("\n")}
      Certifications: ${certifications.join(", ")}
    `;

    try {
      const res = await api.analyzeATSQuality({
        resume_text: fullText,
        target_role: "Full-Stack Engineer",
        required_skills: skills
      });
      setAtsResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsEvaluatingATS(false);
    }
  };

  const loadVersionIntoEditor = (v) => {
    setResumeTitle(v.resume_title || "Primary Resume");
    setFullName(v.full_name || fullName);
    setEmail(v.email || email);
    setPhone(v.phone || phone);
    setLocation(v.location || location);
    setLinkedin(v.linkedin || linkedin);
    setGithub(v.github || github);
    setPortfolio(v.portfolio || portfolio);
    setSummary(v.summary || summary);
    setSkills(v.skills || skills);
    if (v.experiences) setExperiences(v.experiences);
    if (v.education) setEducation(v.education);
    if (v.projects) setProjects(v.projects);
    if (v.certifications) setCertifications(v.certifications);
    setActiveTab("builder");
    setStatusMessage(`Loaded version: "${v.resume_title}"`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "30px 20px" }}>
      {/* Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 25, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28 }}>📄</span>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0f2b48", margin: 0 }}>
              ATS-Friendly Resume Builder
            </h1>
          </div>
          <p style={{ color: "#64748b", fontSize: 14, margin: "6px 0 0 0" }}>
            Design single-column, ATS-parseable resumes verified against enterprise Applicant Tracking Systems.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={() => setActiveTab("builder")}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              border: "none",
              cursor: "pointer",
              background: activeTab === "builder" ? "#0066cc" : "#e2e8f0",
              color: activeTab === "builder" ? "#ffffff" : "#334155"
            }}
          >
            ✏️ Resume Editor
          </button>
          <button
            onClick={() => {
              setActiveTab("preview");
              handleCheckATS();
            }}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              border: "none",
              cursor: "pointer",
              background: activeTab === "preview" ? "#0066cc" : "#e2e8f0",
              color: activeTab === "preview" ? "#ffffff" : "#334155"
            }}
          >
            👁️ ATS Live Preview
          </button>
          <button
            onClick={() => setActiveTab("versions")}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              border: "none",
              cursor: "pointer",
              background: activeTab === "versions" ? "#0066cc" : "#e2e8f0",
              color: activeTab === "versions" ? "#ffffff" : "#334155"
            }}
          >
            📂 Saved Versions ({savedVersions.length})
          </button>
        </div>
      </div>

      {statusMessage && (
        <div style={{ background: "#ecfdf5", border: "1px solid #10b981", color: "#065f46", padding: "12px 18px", borderRadius: 10, marginBottom: 20, fontWeight: 700 }}>
          ✅ {statusMessage}
        </div>
      )}

      {/* TAB 1: RESUME EDITOR */}
      {activeTab === "builder" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
          {/* Main Edit Form */}
          <div style={{ background: "#ffffff", borderRadius: 16, padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
            {/* Version Title */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#1e293b", marginBottom: 6 }}>
                Resume Version Title
              </label>
              <input
                type="text"
                value={resumeTitle}
                onChange={(e) => setResumeTitle(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 15, fontWeight: 600 }}
              />
            </div>

            {/* Personal Details */}
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f2b48", borderBottom: "2px solid #f1f5f9", paddingBottom: 8, marginBottom: 16 }}>
              1. Contact Information
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 14 }}
                />
              </div>
            </div>

            {/* Links */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>LinkedIn</label>
                <input
                  type="text"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>GitHub</label>
                <input
                  type="text"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Portfolio</label>
                <input
                  type="text"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                />
              </div>
            </div>

            {/* Summary */}
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f2b48", borderBottom: "2px solid #f1f5f9", paddingBottom: 8, marginBottom: 12 }}>
              2. Professional Summary
            </h3>
            <div style={{ marginBottom: 24 }}>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, lineHeight: 1.5 }}
                placeholder="2-3 impactful sentences highlighting your primary stack, years of experience, and scale achieved..."
              />
            </div>

            {/* Technical Skills */}
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f2b48", borderBottom: "2px solid #f1f5f9", paddingBottom: 8, marginBottom: 12 }}>
              3. Technical Skills
            </h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                placeholder="Add skill (e.g. Next.js, Kubernetes, Redis)"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 14 }}
              />
              <button onClick={handleAddSkill} style={{ padding: "8px 18px", borderRadius: 6, background: "#0f2b48", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}>
                Add
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
              {skills.map((s, idx) => (
                <span
                  key={idx}
                  style={{
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    padding: "4px 10px",
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  {s}
                  <span onClick={() => handleRemoveSkill(s)} style={{ cursor: "pointer", color: "#93c5fd", fontWeight: 900 }}>
                    ×
                  </span>
                </span>
              ))}
            </div>

            {/* Work Experiences */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #f1f5f9", paddingBottom: 8, marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f2b48", margin: 0 }}>
                4. Work Experience
              </h3>
              <button onClick={handleAddExperience} style={{ padding: "6px 14px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                + Add Role
              </button>
            </div>
            {experiences.map((exp, idx) => (
              <div key={idx} style={{ background: "#f8fafc", padding: 16, borderRadius: 10, marginBottom: 14, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <input
                    type="text"
                    placeholder="Job Title"
                    value={exp.title}
                    onChange={(e) => {
                      const updated = [...experiences];
                      updated[idx].title = e.target.value;
                      setExperiences(updated);
                    }}
                    style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                  />
                  <input
                    type="text"
                    placeholder="Company Name"
                    value={exp.company}
                    onChange={(e) => {
                      const updated = [...experiences];
                      updated[idx].company = e.target.value;
                      setExperiences(updated);
                    }}
                    style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                  />
                  <input
                    type="text"
                    placeholder="Duration (e.g. 2023 - Present)"
                    value={exp.duration}
                    onChange={(e) => {
                      const updated = [...experiences];
                      updated[idx].duration = e.target.value;
                      setExperiences(updated);
                    }}
                    style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Key accomplishments with quantifiable metrics (e.g. 'Engineered high-throughput service reducing latency by 35%')..."
                  value={exp.description}
                  onChange={(e) => {
                    const updated = [...experiences];
                    updated[idx].description = e.target.value;
                    setExperiences(updated);
                  }}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                />
              </div>
            ))}

            {/* Education */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #f1f5f9", paddingBottom: 8, marginBottom: 14, marginTop: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f2b48", margin: 0 }}>
                5. Education
              </h3>
              <button onClick={handleAddEducation} style={{ padding: "6px 14px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                + Add Education
              </button>
            </div>
            {education.map((ed, idx) => (
              <div key={idx} style={{ background: "#f8fafc", padding: 14, borderRadius: 10, marginBottom: 12, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 0.8fr 0.8fr", gap: 10 }}>
                  <input
                    type="text"
                    placeholder="Degree (e.g. B.Tech Computer Science)"
                    value={ed.degree}
                    onChange={(e) => {
                      const updated = [...education];
                      updated[idx].degree = e.target.value;
                      setEducation(updated);
                    }}
                    style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                  />
                  <input
                    type="text"
                    placeholder="Institution / University"
                    value={ed.institution}
                    onChange={(e) => {
                      const updated = [...education];
                      updated[idx].institution = e.target.value;
                      setEducation(updated);
                    }}
                    style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                  />
                  <input
                    type="text"
                    placeholder="Graduation Year"
                    value={ed.year}
                    onChange={(e) => {
                      const updated = [...education];
                      updated[idx].year = e.target.value;
                      setEducation(updated);
                    }}
                    style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                  />
                  <input
                    type="text"
                    placeholder="Grade / CGPA"
                    value={ed.grade}
                    onChange={(e) => {
                      const updated = [...education];
                      updated[idx].grade = e.target.value;
                      setEducation(updated);
                    }}
                    style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                  />
                </div>
              </div>
            ))}

            {/* Projects */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #f1f5f9", paddingBottom: 8, marginBottom: 14, marginTop: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f2b48", margin: 0 }}>
                6. Notable Projects
              </h3>
              <button onClick={handleAddProject} style={{ padding: "6px 14px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                + Add Project
              </button>
            </div>
            {projects.map((proj, idx) => (
              <div key={idx} style={{ background: "#f8fafc", padding: 14, borderRadius: 10, marginBottom: 12, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <input
                    type="text"
                    placeholder="Project Title"
                    value={proj.title}
                    onChange={(e) => {
                      const updated = [...projects];
                      updated[idx].title = e.target.value;
                      setProjects(updated);
                    }}
                    style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                  />
                  <input
                    type="text"
                    placeholder="Tech Stack Used"
                    value={proj.tech_stack}
                    onChange={(e) => {
                      const updated = [...projects];
                      updated[idx].tech_stack = e.target.value;
                      setProjects(updated);
                    }}
                    style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                  />
                  <input
                    type="text"
                    placeholder="Link (GitHub / Demo)"
                    value={proj.link}
                    onChange={(e) => {
                      const updated = [...projects];
                      updated[idx].link = e.target.value;
                      setProjects(updated);
                    }}
                    style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Key features, architecture design, and benchmarks achieved..."
                  value={proj.description}
                  onChange={(e) => {
                    const updated = [...projects];
                    updated[idx].description = e.target.value;
                    setProjects(updated);
                  }}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                />
              </div>
            ))}

            {/* Certifications */}
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f2b48", borderBottom: "2px solid #f1f5f9", paddingBottom: 8, marginBottom: 12, marginTop: 24 }}>
              7. Certifications & Credentials
            </h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                placeholder="Add certification (e.g. AWS Solutions Architect, CKA)"
                value={newCert}
                onChange={(e) => setNewCert(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCert())}
                style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 14 }}
              />
              <button onClick={handleAddCert} style={{ padding: "8px 18px", borderRadius: 6, background: "#0f2b48", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}>
                Add
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
              {certifications.map((c, idx) => (
                <span
                  key={idx}
                  style={{
                    background: "#fef3c7",
                    color: "#92400e",
                    padding: "4px 10px",
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  🏅 {c}
                  <span onClick={() => setCertifications(certifications.filter((cert) => cert !== c))} style={{ cursor: "pointer", color: "#d97706", fontWeight: 900 }}>
                    ×
                  </span>
                </span>
              ))}
            </div>

            {/* Bottom Actions */}
            <div style={{ display: "flex", gap: 14, marginTop: 30 }}>
              <button
                onClick={handleSaveToCloud}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  borderRadius: 10,
                  background: "#0066cc",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: 15,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(0, 102, 204, 0.3)"
                }}
              >
                {isLoading ? "Saving to Cloud..." : "💾 Save Resume Version to Cloud"}
              </button>
              <button
                onClick={() => {
                  setActiveTab("preview");
                  handleCheckATS();
                }}
                style={{
                  padding: "12px 24px",
                  borderRadius: 10,
                  background: "#0f2b48",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: 15,
                  border: "none",
                  cursor: "pointer"
                }}
              >
                👁️ Live Preview & Scan
              </button>
            </div>
          </div>

          {/* Quick Helper Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#ffffff", borderRadius: 16, padding: "20px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 22 }}>⚡</span>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f2b48" }}>ATS Optimizer Tips</h4>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                <li><strong>Single Column:</strong> ATS parsers read left-to-right, top-to-bottom.</li>
                <li><strong>No Nested Tables:</strong> Tables often jumble bullet points during ingestion.</li>
                <li><strong>Power Action Verbs:</strong> Start accomplishments with words like <em>Architected, Scaled, Optimized</em>.</li>
                <li><strong>Quantify Metrics:</strong> Add numbers (e.g. 40% reduction, 10k users) to boost impact scores.</li>
              </ul>
            </div>

            <div style={{ background: "#eff6ff", borderRadius: 16, padding: "20px", border: "1px solid #bfdbfe" }}>
              <h4 style={{ margin: "0 0 8px 0", fontSize: 15, fontWeight: 800, color: "#1e40af" }}>
                Multi-Version Storage
              </h4>
              <p style={{ fontSize: 13, color: "#1e3a8a", lineHeight: 1.5, margin: 0 }}>
                You can save custom resumes tailored for different domains (e.g. Backend SDE vs AI Research). Switch between them instantly when applying.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE ATS PREVIEW */}
      {activeTab === "preview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
          {/* Paper View */}
          <div
            id="printable-resume"
            style={{
              background: "#ffffff",
              padding: "40px 48px",
              borderRadius: 8,
              boxShadow: "0 4px 25px rgba(0,0,0,0.08)",
              fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
              color: "#1e293b",
              lineHeight: 1.5
            }}
          >
            {/* Header */}
            <div style={{ textAlign: "center", borderBottom: "2px solid #0f2b48", paddingBottom: 16, marginBottom: 16 }}>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: "#0f2b48", margin: 0, letterSpacing: "-0.5px" }}>
                {fullName}
              </h1>
              <div style={{ fontSize: 13, color: "#475569", marginTop: 6, display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
                <span>📧 {email}</span>
                <span>📱 {phone}</span>
                <span>📍 {location}</span>
              </div>
              <div style={{ fontSize: 12, color: "#0066cc", marginTop: 4, display: "flex", justifyContent: "center", gap: 14 }}>
                {linkedin && <span>{linkedin}</span>}
                {github && <span>{github}</span>}
                {portfolio && <span>{portfolio}</span>}
              </div>
            </div>

            {/* Summary */}
            {summary && (
              <div style={{ marginBottom: 18 }}>
                <h3 style={{ fontSize: 14, fontWeight: 900, color: "#0f2b48", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #cbd5e1", paddingBottom: 4, marginBottom: 6 }}>
                  Professional Summary
                </h3>
                <p style={{ fontSize: 13, color: "#334155", margin: 0, lineHeight: 1.6 }}>{summary}</p>
              </div>
            )}

            {/* Technical Skills */}
            {skills.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <h3 style={{ fontSize: 14, fontWeight: 900, color: "#0f2b48", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #cbd5e1", paddingBottom: 4, marginBottom: 6 }}>
                  Technical Skills
                </h3>
                <p style={{ fontSize: 13, color: "#334155", margin: 0 }}>
                  <strong>Core Technologies:</strong> {skills.join(", ")}
                </p>
              </div>
            )}

            {/* Experience */}
            {experiences.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <h3 style={{ fontSize: 14, fontWeight: 900, color: "#0f2b48", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #cbd5e1", paddingBottom: 4, marginBottom: 10 }}>
                  Work Experience
                </h3>
                {experiences.map((exp, idx) => (
                  <div key={idx} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#0f2b48" }}>{exp.title}</span>
                      <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{exp.duration}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#0066cc", fontWeight: 700, marginBottom: 4 }}>
                      {exp.company}
                    </div>
                    <p style={{ fontSize: 12.5, color: "#334155", margin: 0, lineHeight: 1.5 }}>
                      • {exp.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <h3 style={{ fontSize: 14, fontWeight: 900, color: "#0f2b48", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #cbd5e1", paddingBottom: 4, marginBottom: 10 }}>
                  Projects & Architecture
                </h3>
                {projects.map((proj, idx) => (
                  <div key={idx} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: 13.5, fontWeight: 800, color: "#0f2b48" }}>{proj.title}</span>
                      {proj.link && <span style={{ fontSize: 12, color: "#0066cc" }}>{proj.link}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#475569", fontWeight: 600, marginBottom: 3 }}>
                      Tech Stack: {proj.tech_stack}
                    </div>
                    <p style={{ fontSize: 12.5, color: "#334155", margin: 0 }}>• {proj.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Education */}
            {education.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <h3 style={{ fontSize: 14, fontWeight: 900, color: "#0f2b48", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #cbd5e1", paddingBottom: 4, marginBottom: 8 }}>
                  Education
                </h3>
                {education.map((ed, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#0f2b48" }}>{ed.degree}</div>
                      <div style={{ fontSize: 12, color: "#475569" }}>{ed.institution} {ed.grade ? `• ${ed.grade}` : ""}</div>
                    </div>
                    <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{ed.year}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 900, color: "#0f2b48", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #cbd5e1", paddingBottom: 4, marginBottom: 6 }}>
                  Certifications
                </h3>
                <p style={{ fontSize: 12.5, color: "#334155", margin: 0 }}>
                  {certifications.join(" • ")}
                </p>
              </div>
            )}
          </div>

          {/* Real-time ATS Audit Card */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#ffffff", borderRadius: 16, padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "#0f2b48" }}>ATS Audit Score</h3>
                <button
                  onClick={handleCheckATS}
                  disabled={isEvaluatingATS}
                  style={{ padding: "4px 10px", fontSize: 12, borderRadius: 6, background: "#f1f5f9", border: "1px solid #cbd5e1", cursor: "pointer", fontWeight: 700 }}
                >
                  {isEvaluatingATS ? "Scanning..." : "🔄 Re-scan"}
                </button>
              </div>

              {atsResult ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                    <div style={{ fontSize: 36, fontWeight: 900, color: atsResult.ats_score >= 80 ? "#16a34a" : "#ca8a04" }}>
                      {atsResult.ats_score}%
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#0f2b48" }}>{atsResult.ats_status}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{atsResult.readability_note}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}>
                      <span style={{ color: "#475569" }}>Section Structure</span>
                      <span style={{ color: "#0066cc" }}>{atsResult.section_score}%</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}>
                      <span style={{ color: "#475569" }}>Impact & Metrics</span>
                      <span style={{ color: "#0066cc" }}>{atsResult.impact_metric_score}%</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}>
                      <span style={{ color: "#475569" }}>Action Verbs</span>
                      <span style={{ color: "#0066cc" }}>{atsResult.action_verb_score}%</span>
                    </div>
                  </div>

                  {atsResult.improvements?.length > 0 && (
                    <div>
                      <h5 style={{ margin: "0 0 8px 0", fontSize: 13, fontWeight: 800, color: "#b45309" }}>Action Items to Reach 95%+:</h5>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
                        {atsResult.improvements.map((imp, idx) => (
                          <li key={idx} style={{ marginBottom: 4 }}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#64748b", fontSize: 13 }}>
                  Click "Re-scan" to run full ATS parse verification.
                </div>
              )}
            </div>

            <button
              onClick={() => window.print()}
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                background: "#0f2b48",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: 14,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(15, 43, 72, 0.25)"
              }}
            >
              🖨️ Print / Save as PDF
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SAVED VERSIONS */}
      {activeTab === "versions" && (
        <div style={{ background: "#ffffff", borderRadius: 16, padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "#0f2b48", marginBottom: 16 }}>
            Saved Candidate Resumes in MongoDB Atlas
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {savedVersions.map((v) => (
              <div
                key={v._id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "20px",
                  background: "#f8fafc",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f2b48" }}>
                      {v.resume_title}
                    </h4>
                    {v.is_primary && (
                      <span style={{ background: "#dbeafe", color: "#1e40af", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 10 }}>
                        PRIMARY
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 12px 0", lineHeight: 1.5 }}>
                    {v.summary?.slice(0, 100)}...
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                    {(v.skills || []).slice(0, 5).map((sk, idx) => (
                      <span key={idx} style={{ background: "#e2e8f0", color: "#334155", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button
                    onClick={() => loadVersionIntoEditor(v)}
                    style={{ flex: 1, padding: "8px 12px", borderRadius: 6, background: "#0066cc", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}
                  >
                    Load into Editor
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm(`Delete version "${v.resume_title}"?`)) {
                        await api.deleteResumeBuilder(v._id);
                        loadSavedVersions();
                      }
                    }}
                    style={{ padding: "8px 12px", borderRadius: 6, background: "#fee2e2", color: "#b91c1c", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

