import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

const STORAGE_KEY_USER = "recruit_ai_user";
const STORAGE_KEY_TOKEN = "recruit_ai_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name === "Alex Rivera" || parsed.name?.toLowerCase().includes("alex")) {
          parsed.name = "Sumii";
          parsed.email = "sumii@example.com";
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(parsed));
        } else if (parsed.name === "Sarah Jenkins" || parsed.name?.toLowerCase().includes("sarah")) {
          parsed.name = "Summya";
          parsed.email = "summya.recruiter@cognitiveflow.com";
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(parsed));
        } else if (parsed.name === "Marcus Vance" || parsed.name === "Platform Administrator" || parsed.name?.toLowerCase().includes("marcus")) {
          parsed.name = "Nashu";
          parsed.email = "nashu.admin@recruitmentportal.com";
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(parsed));
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_TOKEN) || null;
  });

  useEffect(() => {
    if (token) {
      api.setAuthToken(token);
    }
  }, [token]);

  const login = async (credentials) => {
    const res = await api.login(credentials);
    if (res && res.token) {
      setUser(res);
      setToken(res.token);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(res));
      localStorage.setItem(STORAGE_KEY_TOKEN, res.token);
      api.setAuthToken(res.token);
      return res;
    }
    throw new Error("Login failed: missing token");
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res && res.token) {
      setUser(res);
      setToken(res.token);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(res));
      localStorage.setItem(STORAGE_KEY_TOKEN, res.token);
      api.setAuthToken(res.token);
      return res;
    }
    return res;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    api.setAuthToken(null);
  };

  const switchDemoRole = (role) => {
    let demoUser;
    if (role === "admin" || role === "recruiter") {
      demoUser = {
        id: "admin-1",
        name: "Admin (Hiring Authority)",
        email: "admin@recruitmentportal.com",
        phone: "+15550001111",
        role: "admin",
        company_name: "Recruitment Portal Central",
        skills: ["Candidate Applications Review", "Interview Scheduling", "Selection Approval", "Job Management"],
        token: `jwt-secure-token-${Date.now()}`
      };
    } else {
      demoUser = {
        id: "candidate-1",
        name: "Sumii",
        email: "sumii@example.com",
        phone: "+15554445555",
        role: "candidate",
        skills: ["Python", "FastAPI", "React", "TypeScript", "Docker", "Data Structures"],
        token: `jwt-secure-token-${Date.now()}`
      };
    }
    setUser(demoUser);
    setToken(demoUser.token);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(demoUser));
    localStorage.setItem(STORAGE_KEY_TOKEN, demoUser.token);
    api.setAuthToken(demoUser.token);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
      switchDemoRole,
      setUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
