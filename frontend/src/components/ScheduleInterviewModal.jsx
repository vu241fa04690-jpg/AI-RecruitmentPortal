import React, { useState } from "react";
import { CloseIcon, CalendarIcon, VideoIcon } from "./Icons";
import { api } from "../services/api";

export default function ScheduleInterviewModal({ application, onClose, onSuccess }) {
  const [scheduledDate, setScheduledDate] = useState("Tomorrow, 2:30 PM EST");
  const [round, setRound] = useState("Technical Screening & System Design");
  const [duration, setDuration] = useState(45);
  const [meetingLink, setMeetingLink] = useState("https://meet.google.com/rec-interviews");
  const [interviewer, setInterviewer] = useState("Summya (Tech Lead & Engineering Mentor)");
  const [notes, setNotes] = useState("Review candidate's FastAPI background and system scalability concepts.");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newInterview = await api.scheduleInterview({
        application_id: application.id,
        job_id: application.job_id,
        job_title: application.job_title,
        candidate_name: application.candidate_name,
        candidate_email: application.candidate_email,
        scheduled_date: scheduledDate,
        round,
        duration_minutes: Number(duration),
        meeting_link: meetingLink,
        interviewer,
        notes
      });
      if (onSuccess) onSuccess(newInterview);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Schedule Interview Round</h2>
            <p style={{ fontSize: 13, color: "#64748b" }}>Candidate: {application.candidate_name}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b" }}>
            <CloseIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
              Interview Date & Time
            </label>
            <input
              type="text"
              required
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              placeholder="e.g. Wednesday Nov 5, 2:00 PM EST"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Interview Round
              </label>
              <select
                value={round}
                onChange={(e) => setRound(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
              >
                <option value="Initial Screening">Initial Screening</option>
                <option value="Technical Screening & System Design">Technical & System Design</option>
                <option value="Live Coding Session">Live Coding Session</option>
                <option value="Hiring Manager & Culture">Hiring Manager & Culture</option>
                <option value="Final Executive Round">Final Executive Round</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Duration (minutes)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
              Video Meeting Link
            </label>
            <input
              type="text"
              required
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
              Assigned Interviewer
            </label>
            <input
              type="text"
              required
              value={interviewer}
              onChange={(e) => setInterviewer(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
              Preparation Notes / Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Scheduling..." : "Confirm & Send Calendar Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

