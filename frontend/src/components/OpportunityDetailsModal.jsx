import React, { useEffect, useState } from "react";
import {
  CloseIcon,
  BriefcaseIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
  SparklesIcon,
  ArrowUpRightIcon
} from "./Icons";

export default function OpportunityDetailsModal({
  opportunity,
  onClose,
  onApply,
  onToggleSave,
  isSaved = false,
  isApplied = false
}) {
  const [copied, setCopied] = useState(false);

  // Close on Escape key press and prevent background scrolling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    // Save previous overflow style and lock body scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!opportunity) return null;

  const isCompetitionOrHackathon =
    opportunity.category === "hackathon" ||
    opportunity.category === "competition" ||
    (opportunity.type && (opportunity.type.toLowerCase().includes("hackathon") || opportunity.type.toLowerCase().includes("competition")));

  const handleShare = async () => {
    const shareUrl = window.location.origin + window.location.pathname + `?oppId=${opportunity.id || opportunity._id}`;
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (err) {
        console.warn("Clipboard copy error:", err);
      }
    }
  };

  const getCategoryTheme = () => {
    switch ((opportunity.category || "").toLowerCase()) {
      case "internship":
        return {
          pill: "🎓 Internship & PPO",
          bg: "#EFF6FF",
          color: "#1D4ED8",
          border: "#BFDBFE",
          headerGrad: "linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)",
          accentColor: "#1D4ED8"
        };
      case "hackathon":
        return {
          pill: "⚡ Hackathon & Sprint",
          bg: "#F5F3FF",
          color: "#7C3AED",
          border: "#DDD6FE",
          headerGrad: "linear-gradient(135deg, #4C1D95 0%, #7C3AED 100%)",
          accentColor: "#7C3AED"
        };
      case "competition":
        return {
          pill: "🏆 Championship & Challenge",
          bg: "#FEF3C7",
          color: "#D97706",
          border: "#FDE68A",
          headerGrad: "linear-gradient(135deg, #78350F 0%, #D97706 100%)",
          accentColor: "#D97706"
        };
      default:
        return {
          pill: "💼 Full-Time Job",
          bg: "#ECFDF5",
          color: "#059669",
          border: "#A7F3D0",
          headerGrad: "linear-gradient(135deg, #0F2B48 0%, #1E3A8A 100%)",
          accentColor: "#2563EB"
        };
    }
  };

  const theme = getCategoryTheme();

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.72)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
        overflowY: "auto"
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFFFFF",
          borderRadius: 20,
          maxWidth: 780,
          width: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px rgba(15, 23, 42, 0.4)",
          border: "1px solid #E2E8F0",
          overflow: "hidden",
          animation: "modalEnter 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {/* 1. Modal Top Banner Header */}
        <div
          style={{
            background: theme.headerGrad,
            color: "#FFFFFF",
            padding: "24px 28px",
            position: "relative",
            flexShrink: 0
          }}
        >
          {/* Close X Button in top-right */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "rgba(255, 255, 255, 0.18)",
              border: "none",
              color: "#FFFFFF",
              borderRadius: "50%",
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 700,
              transition: "background 0.15s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.18)";
            }}
          >
            ✕
          </button>

          {/* Category Pill & Partner Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <span
              style={{
                background: "rgba(255, 255, 255, 0.22)",
                backdropFilter: "blur(4px)",
                color: "#FFFFFF",
                fontSize: 11.5,
                fontWeight: 800,
                padding: "3px 10px",
                borderRadius: 20,
                border: "1px solid rgba(255, 255, 255, 0.3)"
              }}
            >
              {theme.pill}
            </span>

            {opportunity.verified_partner && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  background: "#ECFDF5",
                  color: "#065F46",
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "3px 10px",
                  borderRadius: 20
                }}
              >
                <CheckCircleIcon size={12} color="#059669" /> Verified Partner
              </span>
            )}

            <span style={{ fontSize: 11.5, color: "#E2E8F0", opacity: 0.9 }}>
              ⏳ {opportunity.deadline_days_left || 4} days left to apply
            </span>
          </div>

          {/* Title & Organization Header */}
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: opportunity.company_logo_color || "#3B82F6",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 20,
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
              }}
            >
              {opportunity.company ? opportunity.company[0].toUpperCase() : "O"}
            </div>

            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.25, margin: "0 0 4px", color: "#FFFFFF" }}>
                {opportunity.title}
              </h2>
              <div style={{ fontSize: 13.5, color: "#E2E8F0", fontWeight: 600 }}>
                {opportunity.company} · <span style={{ opacity: 0.85 }}>{opportunity.department || "Technology"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Scrollable Modal Body Content */}
        <div
          style={{
            padding: "24px 28px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            flexGrow: 1
          }}
        >
          {/* Key Opportunity Highlights Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
              background: "#F8FAFC",
              padding: "16px",
              borderRadius: 14,
              border: "1px solid #E2E8F0"
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                {isCompetitionOrHackathon ? "Prize Pool / Rewards" : "Stipend / CTC"}
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#1D4ED8", marginTop: 2 }}>
                {opportunity.stipend_or_salary || opportunity.salary_range || "Competitive"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                Location & Mode
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                <MapPinIcon size={14} color="#64748B" />
                {opportunity.location || "Remote"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                Duration / Commitment
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                ⏱️ {opportunity.duration || (isCompetitionOrHackathon ? "Multi-Round Event" : "Full-Time")}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                Applicants / Registered
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                👥 {opportunity.applicants_count || 120} candidates
              </div>
            </div>
          </div>

          {/* Section: Overview & Description */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>
              {isCompetitionOrHackathon ? "Event Overview & Challenge" : "Opportunity Overview"}
            </h4>
            <p style={{ fontSize: 13.5, color: "#334155", lineHeight: 1.65, margin: 0 }}>
              {opportunity.description || "Join our team to solve impactful challenges, build production systems, and accelerate your engineering journey."}
            </p>
          </div>

          {/* Section: Eligibility Criteria */}
          {opportunity.eligibility && (
            <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: "12px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#1E40AF", marginBottom: 4, textTransform: "uppercase" }}>
                🎓 Eligibility Criteria
              </div>
              <div style={{ fontSize: 13, color: "#1E3A8A", lineHeight: 1.5 }}>
                {opportunity.eligibility}
              </div>
            </div>
          )}

          {/* Section: Required Skills */}
          {opportunity.skills && opportunity.skills.length > 0 && (
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>
                Required Technologies & Skills
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {opportunity.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: "#FFFFFF",
                      border: "1.5px solid #CBD5E1",
                      color: "#1E293B",
                      padding: "4px 10px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section: Responsibilities / Guidelines */}
          {opportunity.requirements && opportunity.requirements.length > 0 && (
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>
                {isCompetitionOrHackathon ? "Rules, Guidelines & Deliverables" : "Key Responsibilities & Requirements"}
              </h4>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
                {opportunity.requirements.map((req, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Section: Assessment Rounds or Hackathon Stages */}
          {opportunity.interview_rounds && opportunity.interview_rounds.length > 0 && (
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>
                {isCompetitionOrHackathon ? "Event Rounds & Evaluation Stages" : "Verified Hiring Assessment Rounds"}
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {opportunity.interview_rounds.map((round, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 12.5,
                      color: "#334155",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}
                  >
                    <span style={{ color: "#2563EB", fontWeight: 800 }}>#{idx + 1}</span>
                    <span>{round}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Benefits & Perks */}
          {opportunity.benefits && opportunity.benefits.length > 0 && (
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>
                {isCompetitionOrHackathon ? "Prizes, Rewards & Certificates" : "Benefits & Perks"}
              </h4>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
                {opportunity.benefits.map((b, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 3. Modal Sticky Action Footer (Apply, Save, Share, Close) */}
        <div
          style={{
            borderTop: "1px solid #E2E8F0",
            padding: "16px 28px",
            background: "#F8FAFC",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            flexShrink: 0
          }}
        >
          {/* Left Actions: Save and Share */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {onToggleSave && (
              <button
                type="button"
                onClick={() => onToggleSave(opportunity)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "1px solid #CBD5E1",
                  background: isSaved ? "#FEF2F2" : "#FFFFFF",
                  color: isSaved ? "#DC2626" : "#334155",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                <span>{isSaved ? "❤️" : "🤍"}</span>
                <span>{isSaved ? "Saved" : "Save"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleShare}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 10,
                border: "1px solid #CBD5E1",
                background: "#FFFFFF",
                color: "#334155",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer"
              }}
              title="Copy share link"
            >
              <span>🔗</span>
              <span>{copied ? "Link Copied!" : "Share"}</span>
            </button>
          </div>

          {/* Right Actions: Close & Apply Now */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 18px",
                borderRadius: 10,
                border: "1px solid #CBD5E1",
                background: "#FFFFFF",
                color: "#475569",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onApply) onApply(opportunity);
              }}
              disabled={isApplied}
              style={{
                padding: "10px 24px",
                borderRadius: 10,
                border: "none",
                background: isApplied ? "#94A3B8" : "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
                color: "#FFFFFF",
                fontSize: 13.5,
                fontWeight: 800,
                cursor: isApplied ? "default" : "pointer",
                boxShadow: isApplied ? "none" : "0 4px 14px rgba(29, 78, 216, 0.35)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <span>{isApplied ? "✓ Already Applied" : (isCompetitionOrHackathon ? "⚡ Register Now" : "⚡ Apply Now")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
