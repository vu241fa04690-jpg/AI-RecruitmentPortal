import React, { useState } from "react";
import { CloseIcon, CalendarIcon, VideoIcon } from "./Icons";
import { api } from "../services/api";

export default function ScheduleInterviewModal({ application, onClose, onSuccess }) {
  const [scheduledDate, setScheduledDate] = useState("Tomorrow, 2:30 PM EST");
  const [round, setRound] = useState("Round 3: Technical Interview");
  const [duration, setDuration] = useState(45);
  const [interviewType, setInterviewType] = useState("online_video"); // 'online_video' | 'face_to_face'
  const [meetingRoomId, setMeetingRoomId] = useState(`room-${Math.random().toString(36).substring(2, 9)}`);
  const [companyLocation, setCompanyLocation] = useState("Corporate Innovation Center");
  const [officeAddress, setOfficeAddress] = useState("Level 4, Tech Innovation Tower, Sector 62, Cyber City (Reception)");
  const [interviewer, setInterviewer] = useState("Summya (Tech Lead & Engineering Mentor)");
  const [contactPhone, setContactPhone] = useState("+1 (555) 234-5678");
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
        interview_type: interviewType,
        meeting_room_id: meetingRoomId,
        meeting_link: `/video-interview/${meetingRoomId}`,
        company_location: companyLocation,
        office_address: officeAddress,
        contact_phone: contactPhone,
        interviewer,
        notes
      });
      if (onSuccess) onSuccess(newInterview);
      onClose();
    } catch (err) {
      alert(err.message || "Could not schedule interview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>Schedule Interview Round</h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>Candidate: {application.candidate_name} ({application.job_title})</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>
            <CloseIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Interview Type Selector */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8 }}>
              Interview Format *
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <button
                type="button"
                onClick={() => setInterviewType("online_video")}
                style={{
                  padding: "12px",
                  borderRadius: 10,
                  border: interviewType === "online_video" ? "2px solid #3157D5" : "1px solid #cbd5e1",
                  background: interviewType === "online_video" ? "#eff6ff" : "#fff",
                  color: interviewType === "online_video" ? "#1e40af" : "#334155",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8
                }}
              >
                <span>📹</span> Online Video Room (WebRTC)
              </button>

              <button
                type="button"
                onClick={() => setInterviewType("face_to_face")}
                style={{
                  padding: "12px",
                  borderRadius: 10,
                  border: interviewType === "face_to_face" ? "2px solid #3157D5" : "1px solid #cbd5e1",
                  background: interviewType === "face_to_face" ? "#eff6ff" : "#fff",
                  color: interviewType === "face_to_face" ? "#1e40af" : "#334155",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8
                }}
              >
                <span>🏢</span> In-Person Face-to-Face
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
              Interview Date & Time *
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
                Interview Round Pipeline
              </label>
              <select
                value={round}
                onChange={(e) => setRound(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
              >
                <option value="Round 1: Aptitude Assessment">Round 1: Aptitude Assessment</option>
                <option value="Round 2: Technical Assignment">Round 2: Technical Assignment</option>
                <option value="Round 3: Technical Interview">Round 3: Technical Interview</option>
                <option value="Round 4: Face-to-Face Interview">Round 4: Face-to-Face Interview</option>
                <option value="Round 5: HR Interview">Round 5: HR Interview</option>
                <option value="Round 6: Final Executive Round">Round 6: Final Executive Round</option>
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

          {/* Conditional inputs for Online Video vs Face to Face */}
          {interviewType === "online_video" ? (
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Encrypted WebRTC Room ID
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  required
                  value={meetingRoomId}
                  onChange={(e) => setMeetingRoomId(e.target.value)}
                  style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
                />
                <button
                  type="button"
                  onClick={() => setMeetingRoomId(`room-${Math.random().toString(36).substring(2, 9)}`)}
                  style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 8, padding: "0 12px", fontSize: 12, cursor: "pointer" }}
                >
                  Generate New
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Office Building & Location Name
                </label>
                <input
                  type="text"
                  required
                  value={companyLocation}
                  onChange={(e) => setCompanyLocation(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Exact Office Physical Address & Floor
                </label>
                <input
                  type="text"
                  required
                  value={officeAddress}
                  onChange={(e) => setOfficeAddress(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
                />
              </div>
            </>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
                Interviewer / Office Phone
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
              Candidate Instructions
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
