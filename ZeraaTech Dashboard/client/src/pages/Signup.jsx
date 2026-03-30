import React, { useEffect, useState } from "react";
import "./Auth.css";
import { syncDocumentLanguage } from "../i18n";

export default function Signup() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail]             = useState("");
  const [phone, setPhone]             = useState("");
  const [password, setPassword]       = useState("");
  const [confirm, setConfirm]         = useState("");
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");
  const [loading, setLoading]         = useState(false);
  const [lang]                        = useState(localStorage.getItem("lang") || "en");

  useEffect(() => {
    syncDocumentLanguage(lang);
  }, [lang]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!displayName || !email || !password) {
      setError("Name, email, and password are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, phone: phone || undefined, displayName }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || `Signup failed (${res.status})`);
        return;
      }

      setSuccess("Account created! Redirecting to login…");
      setTimeout(() => { window.location.href = "/login"; }, 1800);
    } catch {
      setError("Could not contact server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container signup-bg" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="auth-box">

        <h1>Join ZeraaTech 🌱</h1>
        <p>Create your account to get started</p>

        {error   && <div className="auth-error">{error}</div>}
        {success && <div className="auth-info">{success}</div>}

        <form onSubmit={handleSignup}>
          <div className="input-label">Full name</div>
          <input
            className="auth-input"
            type="text"
            placeholder="Your full name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />

          <div className="input-label">Email address</div>
          <input
            className="auth-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <div className="input-label">
            Phone number <span style={{ color: "#aaa", fontWeight: 400 }}>(optional — needed for SMS alerts &amp; OTP login)</span>
          </div>
          <input
            className="auth-input"
            type="tel"
            placeholder="+20 1xx xxxx xxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div className="input-row">
            <div style={{ flex: 1 }}>
              <div className="input-label">Password</div>
              <input
                className="auth-input"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="input-label">Confirm password</div>
              <input
                className="auth-input"
                type="password"
                placeholder="Repeat password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-btn-primary signup-btn"
            disabled={loading}
            style={{ marginTop: 16 }}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <a href="/login">Log in</a>
        </div>
      </div>
    </div>
  );
}
