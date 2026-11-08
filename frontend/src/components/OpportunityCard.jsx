import React from "react";
import {
  BriefcaseIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
  SparklesIcon,
  ArrowUpRightIcon
} from "./Icons";

export default function OpportunityCard({
  opportunity,
  onApply,
  onViewDetails,
  onToggleSave,
  isSaved = false,
  isApplied = false
}) {
  if (!opportunity) return null;

  const getCategoryBadge = (cat = "job") => {
    switch (cat.toLowerCase()) {
      case "internship":
        return { label: "🎓 Internship", bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" };
      case "hackathon":
        return { label: "⚡ Hackathon", bg: "#F5F3FF", color: "#7C3AED", border: "#DDD6FE" };
      case "competition":
        return { label: "🏆 Competition", bg: "#FEF3C7", color: "#D97706", border: "#FDE68A" };
      default:
        return { label: "💼 Full-Time Job", bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" };
    }
  };

  const catStyle = getCategoryBadge(opportunity.category);

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 16,
        border: "1px solid #E2E8F0",
        padding: "20px 22px",
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 16,
        position: "relative"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 14px 30px -6px rgba(15, 23, 42, 0.1)";
        e.currentTarget.style.borderColor = "#93C5FD";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 10px rgba(15, 23, 42, 0.04)";
        e.currentTarget.style.borderColor = "#E2E8F0";
      }}
    >
      {/* Top Header: Logo, Title, Org & Bookmark */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            {/* Organization Logo Square */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: opportunity.company_logo_color || "#2563EB",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 18,
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
              }}
            >
              {opportunity.company ? opportunity.company[0].toUpperCase() : "O"}
            </div>

            {/* Title & Organization Name */}
            <div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#0F172A",
                  lineHeight: 1.3,
                  marginBottom: 4,
                  cursor: "pointer"
                }}
                onClick={() => onViewDetails && onViewDetails(opportunity)}
              >
                {opportunity.title}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569", fontWeight: 600 }}>
                <span>{opportunity.company}</span>
                {opportunity.verified_partner && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 2,
                      color: "#2563EB",
                      fontSize: 11.5,
                      fontWeight: 700
                    }}
                    title="Verified Hiring Partner"
                  >
                    <CheckCircleIcon size={13} color="#2563EB" /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bookmark Button */}
          {onToggleSave && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(opportunity);
              }}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 18,
                cursor: "pointer",
                padding: 4,
                color: isSaved ? "#EF4444" : "#94A3B8",
                transition: "transform 0.15s ease"
              }}
              title={isSaved ? "Saved" : "Save Opportunity"}
            >
              {isSaved ? "❤️" : "🤍"}
            </button>
          )}
        </div>

        {/* Category & Location Badges */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: 11.5,
              fontWeight: 700,
              background: catStyle.bg,
              color: catStyle.color,
              border: `1px solid ${catStyle.border}`
            }}
          >
            {catStyle.label}
          </span>

          <span
            style={{
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: 11.5,
              fontWeight: 600,
              background: "#F1F5F9",
              color: "#334155",
              display: "inline-flex",
              alignItems: "center",
              gap: 4
            }}
          >
            <MapPinIcon size={12} color="#64748B" />
            {opportunity.location || "Remote"}
          </span>

          {opportunity.duration && (
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 20,
                fontSize: 11.5,
                fontWeight: 600,
                background: "#F8FAFC",
                color: "#475569"
              }}
            >
              ⏱️ {opportunity.duration}
            </span>
          )}
        </div>

        {/* Stipend / Salary / Prize Pool Strip */}
        <div
          style={{
            background: "#F8FAFC",
            border: "1px dashed #CBD5E1",
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 13,
            fontWeight: 800,
            color: "#0F172A",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <span>
            {opportunity.category === "hackathon" || opportunity.category === "competition" ? "🏆 Prize Pool:" : "💰 Stipend / CTC:"}
          </span>
          <span style={{ color: "#1D4ED8" }}>
            {opportunity.stipend_or_salary || opportunity.salary_range || "Competitive"}
          </span>
        </div>

        {/* Skills Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {(opportunity.skills || []).slice(0, 4).map((skill, idx) => (
            <span
              key={idx}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                color: "#475569",
                borderRadius: 6,
                padding: "2px 8px",
                fontSize: 11,
                fontWeight: 600
              }}
            >
              {skill}
            </span>
          ))}
          {(opportunity.skills || []).length > 4 && (
            <span style={{ fontSize: 11, color: "#94A3B8", alignSelf: "center", fontWeight: 600 }}>
              +{(opportunity.skills || []).length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Bottom Footer: Stats & Apply Action */}
      <div
        style={{
          borderTop: "1px solid #F1F5F9",
          paddingTop: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11.5, color: "#64748B", fontWeight: 600 }}>
          <span>⏳ {opportunity.deadline_days_left || 4}d left</span>
          <span>👥 {opportunity.applicants_count || 120} applied</span>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => onViewDetails && onViewDetails(opportunity)}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: "1px solid #CBD5E1",
              background: "#FFFFFF",
              color: "#334155",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Details
          </button>

          <button
            type="button"
            onClick={() => onApply && onApply(opportunity)}
            disabled={isApplied}
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              border: "none",
              background: isApplied ? "#E2E8F0" : "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
              color: isApplied ? "#64748B" : "#FFFFFF",
              fontSize: 12,
              fontWeight: 800,
              cursor: isApplied ? "default" : "pointer",
              boxShadow: isApplied ? "none" : "0 2px 8px rgba(29, 78, 216, 0.25)"
            }}
          >
            {isApplied ? "✓ Applied" : "⚡ Apply Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
