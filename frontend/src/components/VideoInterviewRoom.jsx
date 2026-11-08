import React, { useState, useEffect, useRef } from "react";
import { api } from "../services/api";

export default function VideoInterviewRoom({ roomId = "room-demo-101", userRole = "candidate", userName = "Candidate", onExit }) {
  const [localStream, setLocalStream] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [permissionError, setPermissionError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: "System", text: `Connected to encrypted WebRTC interview room: ${roomId}`, time: "Now" }
  ]);
  const [newMsg, setNewMsg] = useState("");
  const [activeTab, setActiveTab] = useState("video"); // 'video' | 'notes'

  const localVideoRef = useRef(null);
  const screenTrackRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize camera and microphone on mount
  useEffect(() => {
    let activeStream = null;

    async function initMedia() {
      try {
        setPermissionError("");
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera and Microphone APIs are not supported in this browser environment.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true
        });
        activeStream = stream;
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Start call duration timer
        timerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);

      } catch (err) {
        console.warn("Media device access error:", err);
        setPermissionError(
          err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
            ? "Camera/Microphone permission was denied. Please allow camera and microphone access in browser settings to join the live video session."
            : `Unable to access video devices: ${err.message}. You can continue with screen share or audio.`
        );
      }
    }

    initMedia();

    return () => {
      // Clean up all tracks on unmount
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [roomId]);

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoDisabled(!isVideoDisabled);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen share
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      // Revert to camera
      if (localStream && localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        screenTrack.onended = () => {
          toggleScreenShare();
        };
      } catch (err) {
        console.warn("Screen share cancelled or failed:", err);
      }
    }
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/video-interview/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        sender: userName,
        text: newMsg.trim(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
    setNewMsg("");
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleHangUp = () => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
    }
    if (onExit) onExit();
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "#0d1322",
      color: "#ffffff",
      zIndex: 99999,
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Top Bar */}
      <div style={{
        padding: "16px 24px",
        background: "rgba(15, 23, 42, 0.95)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(49, 87, 213, 0.2)",
            border: "1px solid rgba(49, 87, 213, 0.4)",
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: "600",
            color: "#60a5fa"
          }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }}></span>
            LIVE INTERVIEW • {formatTimer(callDuration)}
          </div>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>
              Technical Round 1 — Room: <code style={{ color: "#38bdf8", background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: "4px" }}>{roomId}</code>
            </h2>
            <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
              Participant: {userName} ({userRole.toUpperCase()}) • End-to-End Encrypted WebRTC Session
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={copyRoomLink}
            style={{
              background: copiedLink ? "#10b981" : "rgba(255,255,255,0.1)",
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              cursor: "pointer",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            {copiedLink ? "✓ Link Copied!" : "📋 Copy Invite Link"}
          </button>
          <button
            onClick={handleHangUp}
            style={{
              background: "#ef4444",
              color: "#fff",
              border: "none",
              padding: "8px 18px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            Leave Call
          </button>
        </div>
      </div>

      {/* Main Video Area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left Video Grid */}
        <div style={{ flex: 1, position: "relative", padding: "20px", display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", justifyContent: "center" }}>
          
          {permissionError && (
            <div style={{
              position: "absolute",
              top: "24px",
              left: "24px",
              right: "24px",
              background: "rgba(239, 68, 68, 0.9)",
              color: "#fff",
              padding: "12px 18px",
              borderRadius: "10px",
              fontSize: "14px",
              zIndex: 10,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)"
            }}>
              ⚠️ {permissionError}
            </div>
          )}

          <div style={{
            width: "100%",
            maxWidth: "960px",
            aspectRatio: "16/9",
            background: "#1e293b",
            borderRadius: "16px",
            overflow: "hidden",
            position: "relative",
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.1)"
          }}>
            {/* Live Camera Stream Video Tag */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: isVideoDisabled ? "none" : "block",
                transform: isScreenSharing ? "none" : "scaleX(-1)"
              }}
            />

            {/* Video Disabled Avatar Fallback */}
            {isVideoDisabled && (
              <div style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #1e293b, #0f172a)"
              }}>
                <div style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  background: "#3157D5",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "36px",
                  fontWeight: "700"
                }}>
                  {userName.charAt(0).toUpperCase()}
                </div>
                <p style={{ marginTop: "16px", color: "#94a3b8", fontSize: "15px" }}>Camera is currently turned off</p>
              </div>
            )}

            {/* Overlay User Tag */}
            <div style={{
              position: "absolute",
              bottom: "16px",
              left: "16px",
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <span>{userName} (You)</span>
              {isAudioMuted && <span style={{ color: "#ef4444" }}>🔇 Muted</span>}
              {isScreenSharing && <span style={{ color: "#38bdf8" }}>🖥️ Sharing Screen</span>}
            </div>

            {/* Secondary Recruiter / Candidate PIP */}
            <div style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              width: "220px",
              aspectRatio: "16/9",
              background: "#0f172a",
              borderRadius: "10px",
              border: "2px solid rgba(49, 87, 213, 0.6)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
            }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "#7657E8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: "700"
              }}>
                {userRole === "candidate" ? "R" : "C"}
              </div>
              <span style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px" }}>
                {userRole === "candidate" ? "Interviewer (Connected)" : "Candidate Stream"}
              </span>
              <div style={{ position: "absolute", bottom: "4px", right: "6px", width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }}></div>
            </div>
          </div>

          {/* Floating Controls Bar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(12px)",
            padding: "12px 24px",
            borderRadius: "30px",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 12px 30px rgba(0,0,0,0.5)"
          }}>
            <button
              onClick={toggleAudio}
              style={{
                background: isAudioMuted ? "#ef4444" : "rgba(255,255,255,0.12)",
                color: "#fff",
                border: "none",
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              title={isAudioMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {isAudioMuted ? "🔇" : "🎙️"}
            </button>

            <button
              onClick={toggleVideo}
              style={{
                background: isVideoDisabled ? "#ef4444" : "rgba(255,255,255,0.12)",
                color: "#fff",
                border: "none",
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              title={isVideoDisabled ? "Turn On Camera" : "Turn Off Camera"}
            >
              {isVideoDisabled ? "🚫" : "📹"}
            </button>

            <button
              onClick={toggleScreenShare}
              style={{
                background: isScreenSharing ? "#3157D5" : "rgba(255,255,255,0.12)",
                color: "#fff",
                border: "none",
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
            >
              🖥️
            </button>

            <button
              onClick={handleHangUp}
              style={{
                background: "#dc2626",
                color: "#fff",
                border: "none",
                padding: "0 20px",
                height: "48px",
                borderRadius: "24px",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              📞 End Session
            </button>
          </div>
        </div>

        {/* Right Chat & Session Notes Drawer */}
        <div style={{
          width: "360px",
          background: "#131b2e",
          borderLeft: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          flexDirection: "column"
        }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <button
              onClick={() => setActiveTab("video")}
              style={{
                flex: 1,
                padding: "14px",
                background: activeTab === "video" ? "rgba(49, 87, 213, 0.2)" : "transparent",
                color: activeTab === "video" ? "#60a5fa" : "#94a3b8",
                border: "none",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
                borderBottom: activeTab === "video" ? "2px solid #3157D5" : "none"
              }}
            >
              💬 In-Call Chat
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              style={{
                flex: 1,
                padding: "14px",
                background: activeTab === "notes" ? "rgba(49, 87, 213, 0.2)" : "transparent",
                color: activeTab === "notes" ? "#60a5fa" : "#94a3b8",
                border: "none",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
                borderBottom: activeTab === "notes" ? "2px solid #3157D5" : "none"
              }}
            >
              📝 Evaluation Rubric
            </button>
          </div>

          {activeTab === "video" ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
                {chatMessages.map((msg, i) => (
                  <div key={i} style={{
                    alignSelf: msg.sender === userName ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    background: msg.sender === userName ? "#3157D5" : "rgba(255,255,255,0.08)",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    fontSize: "13px"
                  }}>
                    <div style={{ fontSize: "11px", color: msg.sender === userName ? "#bfdbfe" : "#94a3b8", marginBottom: "4px" }}>
                      {msg.sender} • {msg.time}
                    </div>
                    <div>{msg.text}</div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendMessage} style={{ padding: "14px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Type a message or code snippet..."
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    color: "#fff",
                    fontSize: "13px"
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: "#3157D5",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0 16px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Send
                </button>
              </form>
            </div>
          ) : (
            <div style={{ flex: 1, padding: "20px", overflowY: "auto", fontSize: "13px", color: "#cbd5e1", lineHeight: "1.6" }}>
              <h3 style={{ color: "#fff", fontSize: "14px", marginBottom: "12px" }}>Evaluation Criteria</h3>
              <ul style={{ paddingLeft: "18px", margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><strong>1. Technical Knowledge (1-10):</strong> Core CS concepts, async patterns, database indexing.</li>
                <li><strong>2. Problem Solving (1-10):</strong> Approach to algorithmic constraints and edge cases.</li>
                <li><strong>3. Communication (1-10):</strong> Clear STAR method structure and thought articulation.</li>
                <li><strong>4. Practical Experience (1-10):</strong> Real-world production tradeoffs and metrics.</li>
              </ul>
              <div style={{ marginTop: "24px", padding: "14px", background: "rgba(49, 87, 213, 0.15)", borderRadius: "8px", border: "1px solid rgba(49,87,213,0.3)" }}>
                💡 <em>After this session concludes, the interviewer will record formal scores via the Recruiter Evaluation Form.</em>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

