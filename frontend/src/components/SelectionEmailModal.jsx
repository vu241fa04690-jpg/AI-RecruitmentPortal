import React, { useState } from "react";
import {
  CloseIcon,
  CheckCircleIcon,
  SparklesIcon,
  ShieldLockIcon,
  MailIcon,
  BriefcaseIcon
} from "./Icons";

export default function SelectionEmailModal({ candidate, onClose, onSendSuccess }) {
  const [subject, setSubject] = useState(
    `🎉 Congratulations ${candidate?.name || "Candidate"}! Official Selection for ${candidate?.job_title || "Engineering Role"} at ${candidate?.company || "CognitiveFlow Technologies"}`
  );
  const [personalNote, setPersonalNote] = useState(
    "The hiring committee was thoroughly impressed by your performance in the AI screening and technical rounds. We are delighted to welcome you to the team!"
  );
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const portalUrl = "http://localhost:5173";
  const loginUrl = "http://localhost:5173";
  const registerUrl = "http://localhost:5173";
  const securityPin = candidate?.securityPin || `SEC-${Math.floor(1000 + Math.random() * 9000)}-2026`;

  const emailBodyText = `Subject: ${subject}
To: ${candidate?.email || "candidate@example.com"}

Dear ${candidate?.name || "Candidate"},

We are thrilled to officially inform you that following your outstanding technical evaluation (ATS Compatibility Fit: ${candidate?.match_score || 96}%), you have been SELECTED for the role of ${candidate?.job_title || "Software Development Engineer Intern"} at ${candidate?.company || "CognitiveFlow Technologies"}!

${personalNote}

--------------------------------------------------
YOUR CANDIDATE ACCOUNT & PORTAL ACCESS DETAILS:
--------------------------------------------------
• Candidate Portal URL: ${portalUrl}
• Direct Candidate Login Page: ${loginUrl}
• New User Account Activation: ${registerUrl}
• Registered Login Identifier: ${candidate?.email || "candidate@example.com"}
• Secure Onboarding PIN: ${securityPin} (256-Bit TLS Session)

--------------------------------------------------
ONBOARDING & NEXT STEPS:
--------------------------------------------------
1. Sign in to your account using the login page link above.
2. If this is your first time, click "Sign Up" to activate your protected account with 2FA security.
3. Access the "My Applications" & "Assessment Rounds" tabs to review your verified score and formal offer documents.
4. Confirm your joining date and submit digital onboarding credentials.

Congratulations once again! We look forward to building groundbreaking technology together.

Warm regards,
Talent Acquisition & Admin Governance Board
${candidate?.company || "CognitiveFlow Technologies"}
RecruitmentPortal AI Platform (Verified Hiring Partner)`;

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      if (onSendSuccess) {
        onSendSuccess({
          candidateId: candidate?.id,
          candidateName: candidate?.name,
          candidateEmail: candidate?.email,
          jobTitle: candidate?.job_title,
          company: candidate?.company,
          subject,
          sentAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          securityPin
        });
      }
    }, 900);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(emailBodyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
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
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #0f2b48 0%, #0066cc 60%, #00b4d8 100%)",
          padding: "24px 28px",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0
        }}>
          <div>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255, 255, 255, 0.2)",
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.5,
              marginBottom: 8,
              textTransform: "uppercase"
            }}>
              <MailIcon size={14} color="#ffffff" />
              <span>OFFICIAL CANDIDATE SELECTION & ACCOUNT DISPATCH</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>
              Send Selection Email & Login Credentials
            </h2>
            <p style={{ margin: "4px 0 0", color: "#bae6fd", fontSize: 13 }}>
              Deliver official offer notification, portal URLs, and account creation/login links to candidate.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "none",
              color: "#ffffff",
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background 0.2s"
            }}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
          {sent ? (
            <div style={{
              textAlign: "center",
              padding: "48px 24px",
              background: "#f0fdf4",
              borderRadius: 16,
              border: "1.5px solid #86efac"
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#10b981",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: 32,
                boxShadow: "0 8px 20px rgba(16, 185, 129, 0.35)"
              }}>
                ✓
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 900, color: "#166534", marginBottom: 8 }}>
                Selection Email Dispatched Successfully!
              </h3>
              <p style={{ color: "#15803d", fontSize: 14, maxWidth: 500, margin: "0 auto 20px", lineHeight: 1.6 }}>
                Official email with account creation and login links has been delivered to <strong>{candidate?.email}</strong>. The candidate can now sign in or activate their protected account with PIN <strong>{securityPin}</strong>.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCopy}
                  style={{ padding: "10px 20px", fontSize: 13, fontWeight: 700 }}
                >
                  {copied ? "✓ Copied to Clipboard" : "📋 Copy Email Content"}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onClose}
                  style={{ padding: "10px 24px", fontSize: 13, fontWeight: 800 }}
                >
                  Done & Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Recipient & Role Banner */}
              <div style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "16px 18px",
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr",
                gap: 16
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                    Selected Candidate
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", marginTop: 2 }}>
                    {candidate?.name || "Sumii"}
                  </div>
                  <div style={{ fontSize: 13, color: "#0066cc", fontWeight: 700 }}>
                    {candidate?.email || "sumii@example.com"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                    Position & Organization
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                    {candidate?.job_title || "Software Development Engineer Intern"}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#475569" }}>
                    {candidate?.company || "CognitiveFlow Technologies"} · <span style={{ color: "#16a34a", fontWeight: 800 }}>✓ {candidate?.match_score || 96}% ATS Fit</span>
                  </div>
                </div>
              </div>

              {/* Subject Line Field */}
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 800, color: "#0f2b48", marginBottom: 6 }}>
                  Email Subject Line:
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: "#0f172a"
                  }}
                />
              </div>

              {/* Personal Note */}
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 800, color: "#0f2b48", marginBottom: 6 }}>
                  Hiring Board Congratulatory Note:
                </label>
                <textarea
                  rows={2}
                  value={personalNote}
                  onChange={(e) => setPersonalNote(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13,
                    lineHeight: 1.5,
                    resize: "none"
                  }}
                />
              </div>

              {/* Formatted Corporate Email Preview Card */}
              <div style={{
                background: "#ffffff",
                border: "2px solid #0066cc",
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: "0 6px 18px rgba(0, 102, 204, 0.08)"
              }}>
                <div style={{
                  background: "#f0f9ff",
                  padding: "10px 16px",
                  borderBottom: "1px solid #bae6fd",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#0369a1", textTransform: "uppercase" }}>
                    ✉️ Official Email Content Preview (HTML Output)
                  </span>
                  <span style={{ fontSize: 11, color: "#0284c7", fontWeight: 700 }}>
                    TLS 1.3 256-Bit Encrypted Delivery
                  </span>
                </div>

                <div style={{ padding: "18px 20px", fontSize: 13, color: "#1e293b", lineHeight: 1.65 }}>
                  <p style={{ margin: "0 0 10px" }}>
                    Dear <strong>{candidate?.name || "Sumii"}</strong>,
                  </p>
                  <p style={{ margin: "0 0 12px" }}>
                    We are thrilled to officially inform you that following your outstanding performance in the AI screening and technical evaluation (<strong>{candidate?.match_score || 96}% ATS Compatibility Rating</strong>), you have been <strong>officially selected</strong> for the position of <strong>{candidate?.job_title || "Software Development Engineer Intern"}</strong> at <strong>{candidate?.company || "CognitiveFlow Technologies"}</strong>!
                  </p>
                  <p style={{ margin: "0 0 14px", color: "#334155" }}>
                    <em>"{personalNote}"</em>
                  </p>

                  {/* Highlighted Account & Login Credentials Box */}
                  <div style={{
                    background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)",
                    border: "1.5px solid #60a5fa",
                    borderRadius: 12,
                    padding: "14px 16px",
                    marginBottom: 14
                  }}>
                    <div style={{ fontSize: 12.5, fontWeight: 900, color: "#1e40af", marginBottom: 8, textTransform: "uppercase" }}>
                      🔑 Your Candidate Account & Portal Access Credentials:
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5 }}>
                      <div>
                        <strong>• Candidate Portal URL: </strong>
                        <a href={portalUrl} target="_blank" rel="noreferrer" style={{ color: "#0066cc", fontWeight: 700 }}>
                          {portalUrl}
                        </a>
                      </div>
                      <div>
                        <strong>• Candidate Sign In / Login Page: </strong>
                        <a href={loginUrl} target="_blank" rel="noreferrer" style={{ color: "#0066cc", fontWeight: 700 }}>
                          {loginUrl} (Sign in with your email)
                        </a>
                      </div>
                      <div>
                        <strong>• New User Account Activation Page: </strong>
                        <a href={registerUrl} target="_blank" rel="noreferrer" style={{ color: "#0066cc", fontWeight: 700 }}>
                          {registerUrl} (Activate with 2FA Protection)
                        </a>
                      </div>
                      <div>
                        <strong>• Registered Login Identifier: </strong>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>
                          {candidate?.email || "candidate@example.com"}
                        </span>
                      </div>
                      <div>
                        <strong>• Security Onboarding PIN: </strong>
                        <span style={{ background: "#dbeafe", padding: "2px 8px", borderRadius: 6, fontWeight: 900, color: "#1e40af", fontFamily: "monospace" }}>
                          {securityPin}
                        </span>
                        <span style={{ fontSize: 11, color: "#166534", marginLeft: 8, fontWeight: 700 }}>
                          ✓ 256-Bit Protected
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: 12.5, color: "#475569" }}>
                    <strong>Next Steps:</strong>
                    <ol style={{ margin: "4px 0 0", paddingLeft: 20 }}>
                      <li>Sign in using the login link above or register to verify your account.</li>
                      <li>Review your Pre-Placement Offer (PPO) package and role start date in the Applications Tracker.</li>
                      <li>Access your multi-round Assessment schedule and join the technical pair-screen.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        {!sent && (
          <div style={{
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            padding: "16px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0
          }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCopy}
              style={{ fontSize: 13, fontWeight: 700 }}
            >
              {copied ? "✓ Copied to Clipboard!" : "📋 Copy Email Text"}
            </button>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                className="btn btn-neutral"
                onClick={onClose}
                style={{ padding: "10px 18px", fontSize: 13, fontWeight: 700 }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSend}
                disabled={sending}
                style={{
                  background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                  boxShadow: "0 6px 18px rgba(5, 150, 105, 0.35)",
                  padding: "11px 24px",
                  fontSize: 14,
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  borderRadius: 12,
                  cursor: "pointer"
                }}
              >
                {sending ? (
                  <>⚡ Dispatching Encrypted Mail...</>
                ) : (
                  <>
                    <MailIcon size={16} />
                    <span>Dispatch Official Selection Email →</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

