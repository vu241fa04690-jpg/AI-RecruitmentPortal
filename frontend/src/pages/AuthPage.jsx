import React, { useState } from "react";
import {
  SparklesIcon,
  MailIcon,
  PhoneIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  ShieldLockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  UsersIcon,
  BriefcaseIcon,
  CloseIcon,
  ArrowUpRightIcon
} from "../components/Icons";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export default function AuthPage({ isFullScreen = false, onClose, onSuccess, onContinueAsGuest, defaultMode = "login" }) {
  const { login, register, switchDemoRole } = useAuth();
  
  // View mode: "login" | "register" | "forgot"
  const [mode, setMode] = useState(defaultMode);
  
  // Login input type: "email" | "phone"
  const [loginMethod, setLoginMethod] = useState("email");
  const [loginPortalType, setLoginPortalType] = useState("candidate"); // "candidate" | "admin"

  // Form states
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("candidate");
  const [companyName, setCompanyName] = useState("");
  
  // Advanced Account Creation Security Options
  const [twoFactorMethod, setTwoFactorMethod] = useState("sms");
  const [require2FA, setRequire2FA] = useState(true);
  const [securityQuestion, setSecurityQuestion] = useState("first_school");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [enableAlerts, setEnableAlerts] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showSecurityOptions, setShowSecurityOptions] = useState(true);
  
  // Forgot password states
  const [forgotIdent, setForgotIdent] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");

  // Feedback states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Password strength logic
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "Empty", color: "#94a3b8" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-zA-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++;

    if (score <= 1) return { score: 25, label: "Weak", color: "#ef4444" };
    if (score === 2) return { score: 50, label: "Fair", color: "#f59e0b" };
    if (score === 3) return { score: 75, label: "Good", color: "#3b82f6" };
    return { score: 100, label: "Strong & Secure", color: "#10b981" };
  };

  const pwdStrength = getPasswordStrength(password);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const identifier = loginMethod === "email" ? email : phone;
      if (!identifier.trim()) {
        throw new Error(`Please enter your ${loginMethod === "email" ? "email address" : "phone number"}.`);
      }
      if (!password) {
        throw new Error("Please enter your password.");
      }

      await login({
        identifier: identifier.trim(),
        email: loginMethod === "email" ? identifier.trim() : undefined,
        phone: loginMethod === "phone" ? identifier.trim() : undefined,
        password
      });

      setSuccessMsg("Signed in successfully. Redirecting to platform...");
      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 500);
    } catch (err) {
      setErrorMsg(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (!name.trim()) throw new Error("Full name is required.");
      if (!email.trim()) throw new Error("Valid email address is required.");
      if (!phone.trim()) throw new Error("Phone number is required for 2FA security.");
      if (password.length < 8) throw new Error("Password must be at least 8 characters.");
      if (password !== confirmPassword) throw new Error("Passwords do not match. Please verify both password fields.");
      if (!agreeTerms) throw new Error("Please agree to the Security Policy & Terms of Service to create your account.");

      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role,
        company_name: role === "recruiter" ? companyName.trim() : undefined,
        security_options: {
          two_factor_method: twoFactorMethod,
          require_2fa: require2FA,
          security_question: securityQuestion,
          security_answer: securityAnswer.trim(),
          enable_device_alerts: enableAlerts
        }
      });

      setSuccessMsg("Account created with 256-bit encrypted credentials! Redirecting...");
      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 600);
    } catch (err) {
      setErrorMsg(err.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      if (!forgotIdent.trim()) throw new Error("Enter registered email or phone number.");
      const res = await api.forgotPassword(forgotIdent.trim());
      setOtpSent(true);
      setDemoOtp(res.demo_verification_code || "582914");
      setSuccessMsg(res.message || "OTP code dispatched.");
    } catch (err) {
      setErrorMsg(err.message || "Failed to dispatch recovery code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      if (!otpCode.trim()) throw new Error("Enter 6-digit verification code.");
      if (newPassword.length < 8) throw new Error("New password must be at least 8 characters.");
      await api.resetPassword({
        email_or_phone: forgotIdent.trim(),
        otp_code: otpCode.trim(),
        new_password: newPassword
      });
      setSuccessMsg("Password reset successfully! Please sign in with your new password.");
      setTimeout(() => {
        setMode("login");
        setOtpSent(false);
        setPassword("");
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message || "Reset failed. Verify code.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (demoRole) => {
    switchDemoRole(demoRole);
    setSuccessMsg(`Signed in as demo ${demoRole.toUpperCase()}!`);
    setTimeout(() => {
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    }, 400);
  };

  // Auth Card Inner Content
  const authCardContent = (
    <div
      style={{
        maxWidth: 500,
        width: "100%",
        background: "#ffffff",
        borderRadius: 20,
        boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
        border: "1px solid rgba(226, 232, 240, 0.9)",
        overflow: "hidden"
      }}
    >
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)",
        padding: "26px 24px 22px",
        color: "#ffffff",
        position: "relative"
      }}>
        {onClose && !isFullScreen && (
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              color: "#cbd5e1",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer"
            }}
          >
            <CloseIcon size={16} />
          </button>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{
            background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
            width: 36,
            height: 36,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 16px rgba(99, 102, 241, 0.6)"
          }}>
            <ShieldLockIcon size={20} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: 21, fontWeight: 900, letterSpacing: -0.6 }}>
              Talent<span style={{ color: "#7657E8" }}>AI</span> Access
            </h2>
            <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
              <span>Discover Talent. Build Futures.</span>
              <span>•</span>
              <span style={{ color: "#4ade80" }}>256-Bit JWT Protected</span>
            </div>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        {mode !== "forgot" ? (
          <div style={{
            display: "flex",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: 10,
            padding: 3,
            marginTop: 16
          }}>
            <button
              type="button"
              onClick={() => { setMode("login"); setErrorMsg(""); }}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 8,
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                background: mode === "login" ? "#ffffff" : "transparent",
                color: mode === "login" ? "#0f172a" : "#cbd5e1",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setErrorMsg(""); }}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 8,
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                background: mode === "register" ? "#ffffff" : "transparent",
                color: mode === "register" ? "#0f172a" : "#cbd5e1",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              Sign Up
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 14 }}>
            <button
              onClick={() => { setMode("login"); setErrorMsg(""); }}
              style={{
                background: "none",
                border: "none",
                color: "#38bdf8",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              ← Return to Sign In
            </button>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div style={{ padding: "24px 28px" }}>
        {errorMsg && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            <AlertCircleIcon size={16} color="#ef4444" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            color: "#047857",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            <CheckCircleIcon size={16} color="#10b981" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. SIGN IN TAB */}
        {mode === "login" && (
          <div>
            {/* Separate Portals: Candidate Login vs Dedicated Admin/Recruiter Portal */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              padding: 4,
              background: "#f1f5f9",
              borderRadius: 12,
              marginBottom: 16
            }}>
              <button
                type="button"
                onClick={() => {
                  setLoginPortalType("candidate");
                  setEmail("");
                  setPassword("");
                  setErrorMsg("");
                }}
                style={{
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: loginPortalType === "candidate" ? "#ffffff" : "transparent",
                  color: loginPortalType === "candidate" ? "#0f2b48" : "#64748b",
                  fontWeight: loginPortalType === "candidate" ? 800 : 600,
                  fontSize: 12.5,
                  cursor: "pointer",
                  boxShadow: loginPortalType === "candidate" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s ease"
                }}
              >
                🎓 Candidate Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginPortalType("admin");
                  setEmail("admin@recruitmentportal.com");
                  setPassword("Admin@2026");
                  setLoginMethod("email");
                  setErrorMsg("");
                }}
                style={{
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: loginPortalType === "admin" ? "linear-gradient(135deg, #0f2b48 0%, #0066cc 100%)" : "transparent",
                  color: loginPortalType === "admin" ? "#ffffff" : "#64748b",
                  fontWeight: loginPortalType === "admin" ? 800 : 600,
                  fontSize: 12.5,
                  cursor: "pointer",
                  boxShadow: loginPortalType === "admin" ? "0 2px 8px rgba(15,43,72,0.3)" : "none",
                  transition: "all 0.15s ease"
                }}
              >
                🛡️ Admin / Recruiter Portal
              </button>
            </div>

            {/* Dedicated Admin Portal Notice */}
            {loginPortalType === "admin" && (
              <div style={{
                background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)",
                border: "1.5px solid #0066cc",
                borderRadius: 12,
                padding: "12px 14px",
                marginBottom: 16
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#0f2b48", fontWeight: 800, fontSize: 13, marginBottom: 4 }}>
                  <span>🛡️</span>
                  <span>Sole Authorized Admin & Recruiter Login</span>
                </div>
                <div style={{ fontSize: 11.5, color: "#334155", lineHeight: 1.45 }}>
                  Only 1 verified Administrator account exists. Grants exclusive authority to view candidate requests, review applications, schedule interviews, and send selection letters.
                </div>
                <div style={{ marginTop: 8, padding: "6px 10px", background: "#ffffff", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 11.5, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
                  <span><strong>Email:</strong> admin@recruitmentportal.com</span>
                  <span><strong>Password:</strong> Admin@2026</span>
                </div>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
                {loginPortalType === "admin" ? "Admin Authentication:" : "Sign in using:"}
              </span>
              {loginPortalType !== "admin" && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setLoginMethod("email")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 10px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      border: loginMethod === "email" ? "1px solid #6366f1" : "1px solid #e2e8f0",
                      background: loginMethod === "email" ? "#eef2ff" : "#f8fafc",
                      color: loginMethod === "email" ? "#4f46e5" : "#64748b",
                      cursor: "pointer"
                    }}
                  >
                    <MailIcon size={13} /> Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod("phone")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 10px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      border: loginMethod === "phone" ? "1px solid #6366f1" : "1px solid #e2e8f0",
                      background: loginMethod === "phone" ? "#eef2ff" : "#f8fafc",
                      color: loginMethod === "phone" ? "#4f46e5" : "#64748b",
                      cursor: "pointer"
                    }}
                  >
                    <PhoneIcon size={13} /> Phone
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {loginMethod === "email" ? (
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Email Address
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      style={{
                        width: "100%",
                        padding: "11px 14px 11px 40px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 14,
                        outline: "none"
                      }}
                    />
                    <div style={{ position: "absolute", left: 14, top: 13, color: "#94a3b8" }}>
                      <MailIcon size={16} />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Phone Number
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 444-5555"
                      style={{
                        width: "100%",
                        padding: "11px 14px 11px 40px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 14,
                        outline: "none"
                      }}
                    />
                    <div style={{ position: "absolute", left: 14, top: 13, color: "#94a3b8" }}>
                      <PhoneIcon size={16} />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>Password</label>
                  <button
                    type="button"
                    onClick={() => { setMode("forgot"); setErrorMsg(""); }}
                    style={{ background: "none", border: "none", color: "#4f46e5", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    style={{
                      width: "100%",
                      padding: "11px 42px 11px 40px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                      outline: "none"
                    }}
                  />
                  <div style={{ position: "absolute", left: 14, top: 13, color: "#94a3b8" }}>
                    <LockIcon size={16} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: 10,
                      background: "none",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      padding: 4
                    }}
                  >
                    {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: "100%", padding: "12px", marginTop: 4, fontSize: 14 }}
              >
                {loading ? "Authenticating Session..." : "Secure Sign In"}
              </button>
            </form>
          </div>
        )}

        {/* 2. SIGN UP TAB */}
        {mode === "register" && (
          <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 10,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 10
            }}>
              <span style={{ fontSize: 20 }}>🎓</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#166534" }}>Candidate Registration Portal</div>
                <div style={{ fontSize: 11, color: "#15803d" }}>Public registration creates verified candidate profiles. (Admin / Recruiter privileges are restricted to the default hiring authority).</div>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sumii"
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@mail.com"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Phone
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                />
              </div>
            </div>

            {/* Passwords & Confirmation */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Password (min 8 chars)
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password"
                    style={{ width: "100%", padding: "9px 36px 9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", right: 8, top: 8, background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                  >
                    {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Confirm Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    style={{
                      width: "100%",
                      padding: "9px 36px 9px 12px",
                      borderRadius: 8,
                      border: confirmPassword && confirmPassword !== password ? "1.5px solid #ef4444" : "1px solid #cbd5e1",
                      fontSize: 13
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: "absolute", right: 8, top: 8, background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                  >
                    {showConfirmPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Strength & Match Status */}
            {password && (
              <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: pwdStrength.color, marginBottom: 4, fontWeight: 700 }}>
                  <span>Security Strength: {pwdStrength.label}</span>
                  {confirmPassword && (
                    <span style={{ color: password === confirmPassword ? "#15803d" : "#dc2626", fontWeight: 800 }}>
                      {password === confirmPassword ? "✓ Passwords Match" : "⚠️ Passwords Do Not Match"}
                    </span>
                  )}
                </div>
                <div style={{ height: 4, width: "100%", background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${pwdStrength.score}%`,
                    background: pwdStrength.color,
                    transition: "width 0.3s ease"
                  }} />
                </div>
              </div>
            )}

            {/* --- ADVANCED SECURITY & 2FA CONFIGURATION SECTION --- */}
            <div style={{
              background: "#f0fdf4",
              border: "1.5px solid #86efac",
              borderRadius: 12,
              padding: "14px 16px",
              marginTop: 4
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800, color: "#166534" }}>
                  <ShieldLockIcon size={16} color="#16a34a" />
                  <span>Account Security & Protection Options</span>
                </div>
                <span style={{ fontSize: 11, background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: 8, fontWeight: 800 }}>
                  256-Bit Encrypted
                </span>
              </div>

              {/* 1. Two-Factor Authentication (2FA) Method */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 800, color: "#166534", marginBottom: 6, textTransform: "uppercase" }}>
                  1. Multi-Factor Authentication (2FA) Method:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setTwoFactorMethod("sms")}
                    style={{
                      padding: "7px 6px",
                      borderRadius: 6,
                      border: twoFactorMethod === "sms" ? "1.5px solid #16a34a" : "1px solid #cbd5e1",
                      background: twoFactorMethod === "sms" ? "#ffffff" : "#f1f5f9",
                      color: twoFactorMethod === "sms" ? "#166534" : "#475569",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    📱 SMS OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => setTwoFactorMethod("email")}
                    style={{
                      padding: "7px 6px",
                      borderRadius: 6,
                      border: twoFactorMethod === "email" ? "1.5px solid #16a34a" : "1px solid #cbd5e1",
                      background: twoFactorMethod === "email" ? "#ffffff" : "#f1f5f9",
                      color: twoFactorMethod === "email" ? "#166534" : "#475569",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    📧 Email Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setTwoFactorMethod("app")}
                    style={{
                      padding: "7px 6px",
                      borderRadius: 6,
                      border: twoFactorMethod === "app" ? "1.5px solid #16a34a" : "1px solid #cbd5e1",
                      background: twoFactorMethod === "app" ? "#ffffff" : "#f1f5f9",
                      color: twoFactorMethod === "app" ? "#166534" : "#475569",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    🔑 Auth App (TOTP)
                  </button>
                </div>
              </div>

              {/* 2. Account Recovery Security Question */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 800, color: "#166534", marginBottom: 4, textTransform: "uppercase" }}>
                  2. Security Question (Account Recovery):
                </label>
                <select
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    fontSize: 12,
                    marginBottom: 6,
                    background: "#ffffff"
                  }}
                >
                  <option value="first_school">What was the name of your first school or college?</option>
                  <option value="mother_maiden">What is your mother's maiden name?</option>
                  <option value="birth_city">In what city or town were you born?</option>
                  <option value="first_pet">What was the name of your first pet?</option>
                  <option value="favorite_subject">What was your favorite subject in college?</option>
                </select>
                <input
                  type="text"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Your confidential security answer..."
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    fontSize: 12,
                    background: "#ffffff"
                  }}
                />
              </div>

              {/* 3. Security Policies & Checkboxes */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11.5, color: "#1e293b" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={require2FA}
                    onChange={(e) => setRequire2FA(e.target.checked)}
                  />
                  <span><strong>Require 2FA Verification</strong> on every new device login</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={enableAlerts}
                    onChange={(e) => setEnableAlerts(e.target.checked)}
                  />
                  <span>Send instant security alerts for unrecognized IP or device logins</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                  />
                  <span style={{ color: "#166534" }}>✓ <strong>256-Bit SSL/TLS Encryption</strong> enabled for all resume and profile data</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", marginTop: 4 }}>
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    required
                  />
                  <span style={{ color: "#334155" }}>I agree to the <strong>Platform Terms of Service</strong> and <strong>Data Privacy Policy</strong></span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: "100%", padding: "13px", marginTop: 6, fontSize: 14.5, fontWeight: 800 }}
            >
              {loading ? "Registering Secure Credentials..." : "Create Protected Account →"}
            </button>
          </form>
        )}

        {/* 3. FORGOT PASSWORD */}
        {mode === "forgot" && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                Recover Account Access
              </h3>
              <p style={{ fontSize: 13, color: "#64748b" }}>
                Enter your email address or phone number to receive a 6-digit verification code.
              </p>
            </div>

            {!otpSent ? (
              <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Email or Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotIdent}
                    onChange={(e) => setForgotIdent(e.target.value)}
                    placeholder="sumii@example.com or +15554445555"
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: "12px" }}>
                  {loading ? "Dispatching Code..." : "Send Verification Code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    6-Digit Security OTP
                  </label>
                  <input
                    type="text"
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter code"
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 16, letterSpacing: 2, textAlign: "center" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: "12px" }}>
                  {loading ? "Updating Password..." : "Confirm & Reset Password"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // If used as a full-screen landing page on project startup
  if (isFullScreen) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 20% 20%, #1e1b4b 0%, #0f172a 45%, #070a13 100%)",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Ambient Glows */}
        <div style={{
          position: "absolute",
          top: "5%",
          left: "5%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0, 102, 204, 0.22) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute",
          bottom: "5%",
          right: "5%",
          width: 550,
          height: 550,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(121, 40, 202, 0.2) 0%, transparent 70%)",
          filter: "blur(70px)",
          pointerEvents: "none"
        }} />

        {/* Top Minimal Header */}
        <header style={{
          padding: "20px 36px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(12px)",
          position: "relative",
          zIndex: 10
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              background: "linear-gradient(135deg, #0066cc 0%, #00b4d8 100%)",
              width: 40,
              height: 40,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(0, 102, 204, 0.6)"
            }}>
              <SparklesIcon size={22} color="#ffffff" />
            </div>
            <div>
              <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.6 }}>
                Talent<span style={{ color: "#7657E8" }}>AI</span>
              </span>
              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
                Discover Talent. Build Futures.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: "#cbd5e1",
              background: "rgba(255, 255, 255, 0.06)",
              padding: "6px 14px",
              borderRadius: 20,
              border: "1px solid rgba(255, 255, 255, 0.1)"
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }} />
              FastAPI Core Operational (:8000)
            </div>
            {onContinueAsGuest && (
              <button
                onClick={onContinueAsGuest}
                className="btn"
                style={{
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 800,
                  background: "rgba(255, 255, 255, 0.12)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  borderRadius: 10
                }}
              >
                Browse as Guest →
              </button>
            )}
          </div>
        </header>

        {/* Hero + Auth Split Grid */}
        <div style={{
          flex: 1,
          maxWidth: 1320,
          margin: "0 auto",
          width: "100%",
          padding: "44px 24px",
          display: "grid",
          gridTemplateColumns: "1.15fr 0.85fr",
          alignItems: "center",
          gap: 48,
          position: "relative",
          zIndex: 5
        }}>
          {/* Left Hero Overview */}
          <div>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(0, 102, 204, 0.18)",
              color: "#38bdf8",
              padding: "7px 16px",
              borderRadius: 24,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              marginBottom: 20,
              border: "1px solid rgba(56, 189, 248, 0.35)",
              boxShadow: "0 0 16px rgba(0, 102, 204, 0.2)"
            }}>
              <SparklesIcon size={16} /> 🚀 FAST-TRACK CAMPUS & TECH HIRING 2026
            </div>

            <h1 style={{ fontSize: 44, fontWeight: 900, lineHeight: 1.18, letterSpacing: -1, marginBottom: 16 }}>
              Next-Gen Tech Hiring & Internships Powered by <span style={{
                background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>Semantic AI</span>.
            </h1>

            <p style={{ fontSize: 16, color: "#94a3b8", lineHeight: 1.65, marginBottom: 28, maxWidth: 580 }}>
              Discover verified software internships with Pre-Placement Offers (PPOs) up to ₹36 LPA, explore top-tier full-time SDE roles, and instantly benchmark your resume against production job descriptions.
            </p>

            {/* 4 Dynamic Metric Stats Bar */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
              marginBottom: 28
            }}>
              <div style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 14,
                padding: "14px 12px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#38bdf8" }}>10+</div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>Curated Openings</div>
              </div>

              <div style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 14,
                padding: "14px 12px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#4ade80" }}>₹1.1L/mo</div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>Top Stipend</div>
              </div>

              <div style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 14,
                padding: "14px 12px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#c084fc" }}>95%</div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>AI ATS Match</div>
              </div>

              <div style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 14,
                padding: "14px 12px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#fbbf24" }}>100%</div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>PPO Eligible</div>
              </div>
            </div>

            {/* Interactive Live AI ATS Simulated Match Card */}
            <div style={{
              background: "rgba(15, 23, 42, 0.75)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              borderRadius: 18,
              padding: "18px 20px",
              marginBottom: 24,
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(16px)"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: 16
                  }}>
                    A
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>Aarav Sharma · B.Tech CS 2026</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>Target: Software Development Engineer Intern</div>
                  </div>
                </div>

                <div style={{
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid #10b981",
                  color: "#34d399",
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 800
                }}>
                  96% ATS Match ✨
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 11, background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", padding: "3px 8px", borderRadius: 6, fontWeight: 700 }}>✓ Python</span>
                <span style={{ fontSize: 11, background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", padding: "3px 8px", borderRadius: 6, fontWeight: 700 }}>✓ FastAPI</span>
                <span style={{ fontSize: 11, background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", padding: "3px 8px", borderRadius: 6, fontWeight: 700 }}>✓ React.js</span>
                <span style={{ fontSize: 11, background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", padding: "3px 8px", borderRadius: 6, fontWeight: 700 }}>✓ Data Structures</span>
                <span style={{ fontSize: 11, background: "rgba(16, 185, 129, 0.15)", color: "#34d399", padding: "3px 8px", borderRadius: 6, fontWeight: 700 }}>✓ Docker</span>
              </div>

              <div style={{ fontSize: 11, color: "#4ade80", display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
                <span>●</span> Shortlisted for Round 2: Technical DSA & Live Coding
              </div>
            </div>

            {onContinueAsGuest && (
              <div>
                <button
                  onClick={onContinueAsGuest}
                  style={{
                    background: "transparent",
                    color: "#94a3b8",
                    border: "none",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  Want to explore openings first? Browse catalog without sign in →
                </button>
              </div>
            )}
          </div>

          {/* Right Card: Full Login / Sign Up */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            {authCardContent}
          </div>
        </div>
      </div>
    );
  }

  // If used as a popup modal
  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
      {authCardContent}
    </div>
  );
}
