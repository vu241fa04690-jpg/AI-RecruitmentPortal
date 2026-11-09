import React, { useState, useEffect, useRef } from "react";
import {
  SparklesIcon,
  CloseIcon,
  ArrowUpRightIcon
} from "./Icons";
import { api } from "../services/api";

export default function AIAgentCopilot({ user, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  const userName = user?.name || "Candidate";
  const userRole = user?.role || "candidate";

  const [messages, setMessages] = useState([
    {
      id: "m-1",
      sender: "agent",
      text: `Hello ${userName}! 👋 I am **TalentAI Voice Copilot**, your real-time recruitment and interview assistant.\n\nYou can **speak to me** using your microphone or type. Ask me to find jobs, conduct a mock interview, optimize your resume, or open your assessment rounds!`,
      spoken_text: `Hello ${userName}! I am TalentAI Voice Copilot. You can speak to me with your microphone or type. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        setInputText(currentTranscript);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Text-To-Speech function
  const speakText = (text) => {
    if (!isVoiceEnabled || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Stop any previous speech
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/•/g, "")
      .replace(/👉/g, "")
      .replace(/👋/g, "")
      .replace(/✨/g, "")
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.02;
    utterance.pitch = 1.0;
    utterance.lang = "en-US";

    // Select natural sounding voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha")));
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleListening = () => {
    stopSpeaking();
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          setTranscript("");
          recognitionRef.current.start();
        } catch (e) {
          console.warn("Could not start recognition:", e);
        }
      } else {
        alert("Speech Recognition is not supported by your browser. Please type your query.");
      }
    }
  };

  const handleSendMessage = async (textToSend = inputText) => {
    const text = textToSend.trim();
    if (!text) return;

    stopSpeaking();
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setTranscript("");
    setLoading(true);

    try {
      const res = await api.agentChat({
        message: text,
        user_name: userName,
        user_role: userRole
      });

      const agentReplyText = res.reply || "I am processing your recruitment request.";
      const spokenText = res.spoken_text || agentReplyText;

      const agentMsg = {
        id: `a-${Date.now()}`,
        sender: "agent",
        text: agentReplyText,
        spoken_text: spokenText,
        action: res.action,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, agentMsg]);

      // Speak answer if voice enabled
      if (isVoiceEnabled) {
        speakText(spokenText);
      }

      // Auto-trigger navigation if returned
      if (res.action?.type === "navigate" && onNavigate && res.action.tab) {
        setTimeout(() => {
          onNavigate(res.action.tab);
        }, 1200);
      }
    } catch (err) {
      console.error("AI Agent query failed:", err);
      const fallbackMsg = {
        id: `a-err-${Date.now()}`,
        sender: "agent",
        text: "I am ready to help you with job opportunities, mock interviews, and assessment rounds! What would you like to explore?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Widget Trigger Button (Bottom Right) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            stopSpeaking();
          }}
          title="Open AI Voice Copilot"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9000,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 22px",
            background: "linear-gradient(135deg, #7928ca 0%, #0066cc 100%)",
            color: "#ffffff",
            borderRadius: 30,
            border: "1.5px solid rgba(255, 255, 255, 0.35)",
            boxShadow: "0 10px 30px rgba(121, 40, 202, 0.45), 0 0 20px rgba(0, 102, 204, 0.4)",
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.25s ease",
            backdropFilter: "blur(10px)"
          }}
          className="card-hover animate-pulse-subtle"
        >
          <div style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "#ffffff",
            color: "#7928ca",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: 14
          }}>
            ✦
          </div>
          <span>TalentAI Copilot</span>
          <span style={{
            background: "#10b981",
            width: 8,
            height: 8,
            borderRadius: "50%",
            boxShadow: "0 0 8px #10b981"
          }} />
        </button>
      )}

      {/* Expandable Voice Copilot Modal / Window */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: "92vw",
            maxWidth: 420,
            height: "82vh",
            maxHeight: 640,
            background: "#ffffff",
            borderRadius: 22,
            boxShadow: "0 25px 60px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(0, 102, 204, 0.2)",
            display: "flex",
            flexDirection: "column",
            zIndex: 9999,
            overflow: "hidden",
            border: "2px solid #0066cc",
            animation: "modalFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #0f2b48 0%, #1c4980 60%, #7928ca 100%)",
            color: "#ffffff",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "linear-gradient(135deg, #7928ca, #00b4d8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 18,
                boxShadow: "0 0 14px rgba(121, 40, 202, 0.6)"
              }}>
                ✦
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: "#ffffff" }}>TalentAI Copilot</span>
                  <span style={{ fontSize: 10, background: "rgba(16, 185, 129, 0.2)", color: "#4ade80", padding: "1px 6px", borderRadius: 10, fontWeight: 800 }}>LIVE</span>
                </div>
                <div style={{ fontSize: 11, color: "#cbd5e1" }}>Voice-Powered Recruitment Agent</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {/* Voice Readout Toggle */}
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) stopSpeaking();
                  setIsVoiceEnabled(!isVoiceEnabled);
                }}
                title={isVoiceEnabled ? "Voice Readout Active (Click to Mute)" : "Voice Muted (Click to Enable)"}
                style={{
                  background: isVoiceEnabled ? "rgba(255, 255, 255, 0.2)" : "rgba(239, 68, 68, 0.2)",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14
                }}
              >
                {isVoiceEnabled ? "🔊" : "🔇"}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  if (isListening) recognitionRef.current?.stop();
                  setIsOpen(false);
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16
                }}
              >
                <CloseIcon size={16} />
              </button>
            </div>
          </div>

          {/* Voice Speaking / Listening Banner */}
          {(isListening || isSpeaking) && (
            <div style={{
              background: isListening ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" : "linear-gradient(135deg, #7928ca 0%, #0066cc 100%)",
              color: "#ffffff",
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="animate-pulse-subtle">
                  {isListening ? "🔴 Listening to your voice... Speak now" : "🔊 TalentAI Agent speaking..."}
                </span>
              </div>
              <button
                onClick={() => {
                  if (isListening) recognitionRef.current?.stop();
                  if (isSpeaking) stopSpeaking();
                }}
                style={{ background: "rgba(255, 255, 255, 0.25)", border: "none", color: "#ffffff", borderRadius: 4, padding: "2px 8px", fontSize: 11, cursor: "pointer", fontWeight: 700 }}
              >
                Stop
              </button>
            </div>
          )}

          {/* Message List */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            background: "#f8fafc"
          }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.sender === "user" ? "flex-end" : "flex-start"
                }}
              >
                <div style={{
                  maxWidth: "86%",
                  padding: "12px 16px",
                  borderRadius: msg.sender === "user" ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                  background: msg.sender === "user" ? "linear-gradient(135deg, #0066cc 0%, #0f2b48 100%)" : "#ffffff",
                  color: msg.sender === "user" ? "#ffffff" : "#0f2b48",
                  fontSize: 13,
                  lineHeight: 1.55,
                  boxShadow: msg.sender === "user" ? "0 4px 12px rgba(0, 102, 204, 0.2)" : "0 2px 8px rgba(0,0,0,0.06)",
                  border: msg.sender === "user" ? "none" : "1px solid #e2e8f0",
                  whiteSpace: "pre-line"
                }}>
                  {msg.text}

                  {/* Optional Voice Replay on Agent Message */}
                  {msg.sender === "agent" && msg.spoken_text && (
                    <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                      <button
                        onClick={() => speakText(msg.spoken_text)}
                        style={{
                          background: "#f1f5f9",
                          border: "1px solid #cbd5e1",
                          color: "#0066cc",
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 6,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        🔊 Listen
                      </button>

                      {msg.action?.tab && onNavigate && (
                        <button
                          onClick={() => onNavigate(msg.action.tab)}
                          style={{
                            background: "linear-gradient(135deg, #0066cc, #00b4d8)",
                            border: "none",
                            color: "#ffffff",
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "3px 10px",
                            borderRadius: 6,
                            cursor: "pointer"
                          }}
                        >
                          👉 Open {msg.action.tab.toUpperCase()}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 10, color: "#94a3b8", marginTop: 4, padding: "0 4px" }}>
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748b", fontSize: 12.5, padding: "8px 12px", background: "#ffffff", borderRadius: 12, width: "fit-content", border: "1px solid #e2e8f0" }}>
                <span className="animate-pulse-subtle">✦ Thinking & preparing response...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div style={{
            padding: "8px 14px",
            background: "#ffffff",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            gap: 6,
            overflowX: "auto",
            whiteSpace: "nowrap",
            scrollbarWidth: "none"
          }}>
            {[
              "🎙️ Conduct a mock interview",
              "💼 Find top SDE internships",
              "📄 How to get 95%+ ATS score?",
              "🎯 Show assessment rounds"
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(chip)}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: "#0f2b48",
                  padding: "4px 10px",
                  borderRadius: 14,
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  flexShrink: 0
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Box with Voice Mic Button */}
          <div style={{
            padding: "12px 14px",
            background: "#ffffff",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            {/* Microphone Button for Speech Recognition */}
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? "Listening... Click to stop" : "Speak with Voice (Speech Recognition)"}
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: isListening
                  ? "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)"
                  : "linear-gradient(135deg, #7928ca 0%, #0066cc 100%)",
                border: "none",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                cursor: "pointer",
                boxShadow: isListening ? "0 0 16px #ef4444" : "0 4px 12px rgba(121, 40, 202, 0.35)",
                flexShrink: 0
              }}
            >
              {isListening ? "🔴" : "🎙️"}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={isListening ? "Listening... Speak now..." : "Speak or type your question..."}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 24,
                border: "1px solid #cbd5e1",
                fontSize: 13,
                outline: "none"
              }}
            />

            {/* Send Button */}
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: inputText.trim() ? "#0066cc" : "#f1f5f9",
                color: inputText.trim() ? "#ffffff" : "#94a3b8",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: inputText.trim() ? "pointer" : "default",
                fontSize: 16,
                fontWeight: 800,
                flexShrink: 0
              }}
            >
              ➔
            </button>
          </div>
        </div>
      )}
    </>
  );
}

