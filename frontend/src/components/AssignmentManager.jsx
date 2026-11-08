import React, { useState, useEffect } from "react";
import { api } from "../services/api";

export default function AssignmentManager({ userRole = "candidate", userEmail = "", onSelectJob }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submissionsList, setSubmissionsList] = useState([]);
  const [evaluatingSub, setEvaluatingSub] = useState(null);

  // Candidate Submission State
  const [githubLink, setGithubLink] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  // Recruiter Create Assignment State
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("coding");
  const [newDescription, setNewDescription] = useState("");
  const [newInstructions, setNewInstructions] = useState("");
  const [newDeadline, setNewDeadline] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]);
  const [newTotalMarks, setNewTotalMarks] = useState(100);
  const [newPassingMarks, setNewPassingMarks] = useState(60);
  const [creating, setCreating] = useState(false);

  // Recruiter Evaluation State
  const [evalMarks, setEvalMarks] = useState(85);
  const [evalFeedback, setEvalFeedback] = useState("");
  const [evalStatus, setEvalStatus] = useState("approved");
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, [userRole]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.listAssignments();
      setAssignments(res.assignments || []);
    } catch (err) {
      console.warn("Error loading assignments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSubmit = (asgn) => {
    setSelectedAssignment(asgn);
    setGithubLink(asgn.my_submission?.github_link || "");
    setProjectLink(asgn.my_submission?.project_link || "");
    setSubmissionNotes(asgn.my_submission?.submission_notes || "");
    setSubmitError("");
    setSubmitSuccess("");
    setShowSubmitModal(true);
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    try {
      setSubmitting(true);
      setSubmitError("");
      await api.submitAssignment(selectedAssignment._id, {
        assignment_id: selectedAssignment._id,
        github_link: githubLink,
        project_link: projectLink,
        submission_notes: submissionNotes,
        submitted_files: ["Project_Artifacts.pdf"]
      });
      setSubmitSuccess("Assignment successfully submitted for recruiter review!");
      setTimeout(() => {
        setShowSubmitModal(false);
        loadAssignments();
      }, 1500);
    } catch (err) {
      setSubmitError(err.message || "Failed to submit assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      await api.createAssignment({
        title: newTitle,
        type: newType,
        description: newDescription,
        instructions: newInstructions,
        deadline: newDeadline,
        total_marks: parseInt(newTotalMarks, 10),
        passing_marks: parseInt(newPassingMarks, 10),
        evaluation_criteria: [
          "Code Quality & Modularity",
          "Edge Case Handling & Test Coverage",
          "Architectural Design & Readability",
          "Completeness of Requirements"
        ]
      });
      setShowCreateModal(false);
      setNewTitle("");
      setNewDescription("");
      loadAssignments();
    } catch (err) {
      alert(err.message || "Could not create assignment");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenReview = async (asgn) => {
    setSelectedAssignment(asgn);
    try {
      const res = await api.listAssignmentSubmissions(asgn._id);
      setSubmissionsList(res.submissions || []);
      setShowReviewModal(true);
    } catch (err) {
      alert("Error loading submissions");
    }
  };

  const handleOpenEvaluate = (sub) => {
    setEvaluatingSub(sub);
    setEvalMarks(sub.marks_awarded || 85);
    setEvalFeedback(sub.feedback || "Solid implementation. Clean modular structure and comprehensive test coverage.");
    setEvalStatus(sub.status === "submitted" ? "approved" : sub.status);
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    if (!evaluatingSub) return;
    try {
      setEvaluating(true);
      await api.evaluateAssignmentSubmission(evaluatingSub._id, {
        marks_awarded: parseInt(evalMarks, 10),
        feedback: evalFeedback,
        status: evalStatus
      });
      alert("Evaluation saved successfully!");
      setEvaluatingSub(null);
      // Reload submissions
      if (selectedAssignment) {
        const res = await api.listAssignmentSubmissions(selectedAssignment._id);
        setSubmissionsList(res.submissions || []);
      }
      loadAssignments();
    } catch (err) {
      alert(err.message || "Error submitting evaluation");
    } finally {
      setEvaluating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>✓ Approved</span>;
      case "rejected":
        return <span style={{ background: "#fee2e2", color: "#991b1b", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>✕ Rejected</span>;
      case "resubmission_requested":
        return <span style={{ background: "#fef3c7", color: "#92400e", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>⚠️ Resubmit Requested</span>;
      case "submitted":
        return <span style={{ background: "#e0e7ff", color: "#4338ca", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>⏳ Under Review</span>;
      default:
        return <span style={{ background: "#f1f5f9", color: "#475569", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>● Pending Submission</span>;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Banner & Actions */}
      <div style={{
        background: "linear-gradient(135deg, #172554, #3157D5)",
        color: "#fff",
        borderRadius: "16px",
        padding: "24px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "800", margin: "0 0 6px" }}>
            {userRole === "candidate" ? "My Practical & Technical Assignments" : "Assignment & Project Assessment Hub"}
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>
            {userRole === "candidate"
              ? "Complete coding tasks, project assignments, and upload your GitHub repos for direct recruiter evaluation."
              : "Create coding challenges, evaluate submissions, assign marks, and request revisions with automated grading workflows."}
          </p>
        </div>

        {userRole !== "candidate" && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "12px 22px",
              fontWeight: "700",
              fontSize: "14px",
              cursor: "pointer",
              boxShadow: "0 6px 16px rgba(16, 185, 129, 0.35)",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span>+</span> Create New Assignment
          </button>
        )}
      </div>

      {/* Assignment Cards Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
          Loading active assignments...
        </div>
      ) : assignments.length === 0 ? (
        <div style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "48px 24px",
          textAlign: "center",
          border: "1px dashed #cbd5e1"
        }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>📁</div>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>No Assignments Found</h3>
          <p style={{ fontSize: "13px", color: "#64748b", maxWidth: "400px", margin: "0 auto" }}>
            {userRole === "candidate"
              ? "You do not have any pending assignments currently assigned to your account."
              : "No assignments have been posted yet. Click '+ Create New Assignment' to post your first task."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "20px" }}>
          {assignments.map((asgn) => {
            const mySub = asgn.my_submission;
            return (
              <div
                key={asgn._id}
                style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  padding: "22px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <span style={{
                      background: "#e0e7ff",
                      color: "#3157D5",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "700",
                      textTransform: "uppercase"
                    }}>
                      {asgn.type}
                    </span>
                    {userRole === "candidate" ? (
                      getStatusBadge(mySub?.status || "pending")
                    ) : (
                      <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                        Max: {asgn.total_marks} pts
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px" }}>
                    {asgn.title}
                  </h3>
                  <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 16px", lineHeight: "1.5" }}>
                    {asgn.description}
                  </p>

                  <div style={{ fontSize: "12px", color: "#64748b", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
                    <div><strong>Target Role:</strong> {asgn.job_title || "General Engineering"}</div>
                    <div><strong>Deadline:</strong> <span style={{ color: "#ef4444", fontWeight: "600" }}>{asgn.deadline}</span></div>
                    <div><strong>Passing Marks:</strong> {asgn.passing_marks} / {asgn.total_marks}</div>
                  </div>

                  {/* Feedback Card if Evaluated */}
                  {mySub && mySub.marks_awarded !== null && (
                    <div style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "12px",
                      marginBottom: "16px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a" }}>Recruiter Evaluation</span>
                        <strong style={{ color: mySub.marks_awarded >= asgn.passing_marks ? "#10b981" : "#ef4444" }}>
                          {mySub.marks_awarded} / {asgn.total_marks} pts
                        </strong>
                      </div>
                      <p style={{ fontSize: "12px", color: "#475569", margin: 0, fontStyle: "italic" }}>
                        "{mySub.feedback}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div style={{ paddingTop: "14px", borderTop: "1px solid #f1f5f9", display: "flex", gap: "10px" }}>
                  {userRole === "candidate" ? (
                    mySub && mySub.status === "approved" ? (
                      <button
                        disabled
                        style={{
                          flex: 1,
                          background: "#ecfdf5",
                          color: "#059669",
                          border: "none",
                          borderRadius: "8px",
                          padding: "10px",
                          fontWeight: "700",
                          fontSize: "13px"
                        }}
                      >
                        ✓ Assignment Approved
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenSubmit(asgn)}
                        style={{
                          flex: 1,
                          background: "#3157D5",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "10px",
                          fontWeight: "700",
                          fontSize: "13px",
                          cursor: "pointer"
                        }}
                      >
                        {mySub ? "Update / Resubmit ➔" : "Submit Solution ➔"}
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => handleOpenReview(asgn)}
                      style={{
                        flex: 1,
                        background: "#3157D5",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        padding: "10px",
                        fontWeight: "700",
                        fontSize: "13px",
                        cursor: "pointer"
                      }}
                    >
                      Review Submissions ➔
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Candidate Submit Modal */}
      {showSubmitModal && selectedAssignment && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "540px",
            maxWidth: "90vw",
            padding: "28px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px" }}>
              Submit: {selectedAssignment.title}
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>
              Provide your GitHub repository link, live demo deployment, and implementation notes.
            </p>

            {submitError && (
              <div style={{ background: "#fef2f2", color: "#991b1b", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
                ⚠️ {submitError}
              </div>
            )}
            {submitSuccess && (
              <div style={{ background: "#ecfdf5", color: "#065f46", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
                ✓ {submitSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitAssignment} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  GitHub Repository Link *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://github.com/your-username/project-repo"
                  value={githubLink}
                  onChange={(e) => setGithubLink(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Live Demo / Hosted Project URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://your-demo-app.onrender.com"
                  value={projectLink}
                  onChange={(e) => setProjectLink(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Submission Notes & Architecture Explanation
                </label>
                <textarea
                  rows={4}
                  placeholder="Explain your approach, architectural patterns used, and instructions to run..."
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  style={{ background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", padding: "10px 18px", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ background: "#3157D5", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 22px", fontWeight: "700", fontSize: "13px", cursor: submitting ? "wait" : "pointer" }}
                >
                  {submitting ? "Submitting..." : "Confirm Submission"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recruiter Create Assignment Modal */}
      {showCreateModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "580px",
            maxWidth: "90vw",
            padding: "28px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px" }}>
              Create New Candidate Assignment
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>
              Define instructions, evaluation criteria, passing benchmarks, and submission deadlines.
            </p>

            <form onSubmit={handleCreateAssignment} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>Assignment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asynchronous Microservice with FastAPI & Redis"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>Assignment Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  >
                    <option value="coding">Coding Challenge</option>
                    <option value="project">Full-Stack Project</option>
                    <option value="technical">System Design Spec</option>
                    <option value="aptitude">Aptitude & Logic</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>Deadline Date</label>
                  <input
                    type="date"
                    required
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>Total Marks</label>
                  <input
                    type="number"
                    value={newTotalMarks}
                    onChange={(e) => setNewTotalMarks(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>Passing Marks</label>
                  <input
                    type="number"
                    value={newPassingMarks}
                    onChange={(e) => setNewPassingMarks(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Overview of the task and deliverables..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", padding: "10px 18px", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 22px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}
                >
                  {creating ? "Creating..." : "Publish Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recruiter Review Submissions Modal */}
      {showReviewModal && selectedAssignment && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "740px",
            maxWidth: "92vw",
            maxHeight: "85vh",
            padding: "28px",
            overflowY: "auto",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                  Submissions: {selectedAssignment.title}
                </h3>
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  {submissionsList.length} candidate(s) submitted
                </span>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                style={{ background: "transparent", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            {submissionsList.length === 0 ? (
              <p style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>No candidate submissions received yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {submissionsList.map((sub) => (
                  <div
                    key={sub._id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "16px",
                      background: "#f8fafc"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div>
                        <strong>{sub.candidate_name}</strong> ({sub.candidate_email})
                        {sub.is_late && <span style={{ marginLeft: "8px", color: "#ef4444", fontSize: "11px", fontWeight: "700" }}>⚠️ Late Submission</span>}
                      </div>
                      {getStatusBadge(sub.status)}
                    </div>

                    <div style={{ fontSize: "13px", color: "#475569", marginBottom: "10px" }}>
                      <div><strong>GitHub:</strong> <a href={sub.github_link} target="_blank" rel="noreferrer" style={{ color: "#3157D5" }}>{sub.github_link}</a></div>
                      {sub.project_link && <div><strong>Demo:</strong> <a href={sub.project_link} target="_blank" rel="noreferrer" style={{ color: "#3157D5" }}>{sub.project_link}</a></div>}
                      {sub.submission_notes && <div style={{ marginTop: "4px" }}><strong>Notes:</strong> {sub.submission_notes}</div>}
                    </div>

                    {sub.marks_awarded !== null && (
                      <div style={{ fontSize: "12px", color: "#166534", background: "#dcfce7", padding: "6px 12px", borderRadius: "6px", marginBottom: "10px" }}>
                        Score: <strong>{sub.marks_awarded} pts</strong> • Feedback: {sub.feedback}
                      </div>
                    )}

                    <button
                      onClick={() => handleOpenEvaluate(sub)}
                      style={{
                        background: "#3157D5",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 16px",
                        fontWeight: "700",
                        fontSize: "12px",
                        cursor: "pointer"
                      }}
                    >
                      Score & Evaluate Submission ➔
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recruiter Evaluation Sub-Modal */}
      {evaluatingSub && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(15, 23, 42, 0.7)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "480px",
            maxWidth: "90vw",
            padding: "26px",
            boxShadow: "0 24px 48px rgba(0,0,0,0.25)"
          }}>
            <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px" }}>
              Evaluate: {evaluatingSub.candidate_name}
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px" }}>
              Assign marks and provide constructive feedback for the candidate.
            </p>

            <form onSubmit={handleSubmitEvaluation} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Marks Awarded (out of {selectedAssignment?.total_marks || 100})
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={selectedAssignment?.total_marks || 100}
                  value={evalMarks}
                  onChange={(e) => setEvalMarks(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Evaluation Verdict
                </label>
                <select
                  value={evalStatus}
                  onChange={(e) => setEvalStatus(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                >
                  <option value="approved">Approve & Advance Candidate</option>
                  <option value="resubmission_requested">Request Resubmission (Revisions needed)</option>
                  <option value="rejected">Reject Submission</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Detailed Technical Feedback
                </label>
                <textarea
                  rows={4}
                  required
                  value={evalFeedback}
                  onChange={(e) => setEvalFeedback(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setEvaluatingSub(null)}
                  style={{ background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", padding: "10px 18px", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={evaluating}
                  style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 22px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}
                >
                  {evaluating ? "Saving..." : "Save Evaluation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
