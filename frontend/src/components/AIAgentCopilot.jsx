import React, { useState, useEffect, useRef } from "react";
import { api } from "../services/api";

export default function AIAgentCopilot({ user = null, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "agent",
      text: `Hello ${user?.name || "there"}! I am your **TalentAI Autonomous Agent**.\n\nI can execute end-to-end recruitment tasks for you:\n• Find verified jobs matching your skills\n• Write tailored cover letters\n• Rewrite resume bullets with STAR metrics\n• Conduct mock interviews and score your answers\n• Check your live application statuses\n\nHow can I help you today?`,
      action: null,
      payload: null,
      prompts: [
        "Find remote software engineer jobs",
        "Generate a tailored cover letter",
        "Optimize my resume bullets for ATS",
        "Mock interview question for Python"
      ]
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputVal).trim();
    if (!query || loading) return;

    const userMsg = { role: "user", text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setLoading(true);

    try {
      // Build conversation history
      const history = messages.slice(-6).map((m) => ({
        role: m.role === "agent" ? "assistant" : "user",
        content: m.text
      }));

      const userContext = {
        name: user?.name || user?.full_name || "Candidate",
        email: user?.email || "",
        role: user?.role || "candidate",
        skills: user?.skills || ["Python", "FastAPI", "React", "MongoDB"],
        target_role: "Software Engineer"
      };

      const res = await api.chatWithAgent(query, history, userContext);

      const agentMsg = {
        role: "agent",
        text: res.reply || "Task completed successfully.",
        action: res.action_taken,
        tool: res.tool_used,
        payload: res.payload,
        prompts: res.suggested_prompts || []
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: `⚠️ I encountered an issue executing your request: ${err.message}. Please try asking in a different way or check your connection.`,
          action: null,
          payload: null,
          prompts: ["Find remote jobs", "Practice technical interview"]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed",
            bottom: "28px",
            right: "28px",
            zIndex: 9999,
            background: "linear-gradient(135deg, #3157D5, #7657E8)",
            color: "#ffffff",
            border: "none",
            borderRadius: "32px",
            padding: "14px 22px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 10px 30px rgba(49, 87, 213, 0.45)",
            cursor: "pointer",
            fontWeight: "700",
            fontSize: "14px",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
          className="talentai-agent-btn"
        >
          <span style={{ fontSize: "18px" }}>✨</span>
          <span>TalentAI Copilot</span>
          <span style={{
            background: "#10b981",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            boxShadow: "0 0 6px #10b981"
          }}></span>
        </button>
      )}

      {/* Floating Chat Drawer */}
      {isOpen && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "420px",
          height: "600px",
          maxHeight: "85vh",
          maxWidth: "calc(100vw - 32px)",
          background: "#ffffff",
          borderRadius: "20px",
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(0,0,0,0.06)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "talentaiPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          {/* Header */}
          <div style={{
            padding: "16px 20px",
            background: "linear-gradient(135deg, #172554, #3157D5)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px"
              }}>
                🤖
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>TalentAI Copilot</h4>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }}></span>
                  Autonomous Recruitment Engine Active
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={() => setMessages([{
                  role: "agent",
                  text: `Chat reset. What task can I assist you with now, ${user?.name || "there"}?`,
                  prompts: ["Find jobs", "Generate cover letter", "Mock interview"]
                }])}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.7)",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
                title="Clear conversation"
              >
                🔄
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  color: "#ffffff",
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div style={{
            flex: 1,
            padding: "16px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            background: "#F5F7FC"
          }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "90%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}
              >
                {/* Tool execution badge */}
                {m.action && (
                  <div style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "#4338ca",
                    background: "#e0e7ff",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    alignSelf: "flex-start",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    ⚡ Tool Executed: <code>{m.tool || m.action}</code>
                  </div>
                )}

                {/* Message Bubble */}
                <div style={{
                  background: m.role === "user" ? "#3157D5" : "#ffffff",
                  color: m.role === "user" ? "#ffffff" : "#172554",
                  padding: "12px 16px",
                  borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  boxShadow: m.role === "user" ? "0 4px 12px rgba(49, 87, 213, 0.25)" : "0 2px 8px rgba(0,0,0,0.04)",
                  fontSize: "13.5px",
                  lineHeight: "1.55",
                  whiteSpace: "pre-wrap"
                }}>
                  {m.text}
                </div>

                {/* Rendered Tool Payload: Cover Letter Card */}
                {m.payload?.cover_letter && (
                  <div style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "14px",
                    marginTop: "4px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.04)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#3157D5" }}>📄 Tailored Cover Letter</span>
                      <button
                        onClick={() => copyToClipboard(m.payload.cover_letter, i)}
                        style={{
                          background: copiedIndex === i ? "#10b981" : "#f1f5f9",
                          color: copiedIndex === i ? "#fff" : "#334155",
                          border: "none",
                          borderRadius: "6px",
                          padding: "4px 10px",
                          fontSize: "11px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        {copiedIndex === i ? "✓ Copied" : "📋 Copy Letter"}
                      </button>
                    </div>
                    <pre style={{
                      fontSize: "11.5px",
                      background: "#f8fafc",
                      padding: "10px",
                      borderRadius: "6px",
                      color: "#334155",
                      maxHeight: "140px",
                      overflowY: "auto",
                      whiteSpace: "pre-wrap",
                      fontFamily: "inherit",
                      margin: 0
                    }}>
                      {m.payload.cover_letter}
                    </pre>
                  </div>
                )}

                {/* Rendered Tool Payload: Jobs List */}
                {m.payload?.jobs && m.payload.jobs.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                    {m.payload.jobs.slice(0, 3).map((jb, jIdx) => (
                      <div key={jIdx} style={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        padding: "10px 12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>{jb.title}</div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{jb.company} • {jb.location} • <strong>{jb.salary}</strong></div>
                        </div>
                        <button
                          onClick={() => {
                            if (onNavigate) onNavigate("jobs");
                            setIsOpen(false);
                          }}
                          style={{
                            background: "#3157D5",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "6px 12px",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer"
                          }}
                        >
                          View Job
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rendered Tool Payload: Bullet Rewrites */}
                {m.payload?.bullet_rewrites?.recommendations && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                    {m.payload.bullet_rewrites.recommendations.map((rec, rIdx) => (
                      <div key={rIdx} style={{
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        padding: "8px 10px",
                        fontSize: "12px"
                      }}>
                        <div style={{ fontWeight: "700", color: "#4338ca", fontSize: "11px" }}>{rec.version} ({rec.star_format})</div>
                        <div style={{ color: "#1e293b", marginTop: "2px" }}>{rec.text}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Follow-up Prompts */}
                {m.prompts && m.prompts.length > 0 && i === messages.length - 1 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                    {m.prompts.map((p, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => handleSend(p)}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          color: "#3157D5",
                          borderRadius: "14px",
                          padding: "5px 11px",
                          fontSize: "11.5px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.15s"
                        }}
                      >
                        ⚡ {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "12px" }}>
                <span className="talentai-spin" style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid #3157D5", borderTopColor: "transparent", borderRadius: "50%" }}></span>
                TalentAI Agent is thinking and querying live database...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: "12px 16px",
              background: "#ffffff",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              gap: "8px"
            }}
          >
            <input
              type="text"
              placeholder="Ask anything (e.g. find jobs, rewrite bullet, practice interview)..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                padding: "10px 14px",
                fontSize: "13px",
                outline: "none"
              }}
            />
            <button
              type="submit"
              disabled={loading || !inputVal.trim()}
              style={{
                background: inputVal.trim() && !loading ? "linear-gradient(135deg, #3157D5, #7657E8)" : "#cbd5e1",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "0 16px",
                fontWeight: "700",
                fontSize: "13px",
                cursor: inputVal.trim() && !loading ? "pointer" : "not-allowed"
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}

