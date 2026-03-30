import React, { useEffect, useState } from "react";
import "./Auth.css";
import { syncDocumentLanguage } from "../i18n";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]     = useState("");
  const [otp, setOtp]               = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [step, setStep]             = useState("credentials"); // "credentials" | "otp"
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [lang]                      = useState(localStorage.getItem("lang") || "en");

  useEffect(() => {
    syncDocumentLanguage(lang);
  }, [lang]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!identifier || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      if (data.status === "otp_required") {
        setMaskedPhone(data.phone || "your phone");
        setStep("otp");
        return;
      }

      // No OTP needed (no phone on account) — logged in directly
      localStorage.setItem("user", data.email);
      window.location.href = "/dashboard";
    } catch {
      setError("Could not contact server.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier, otp }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "OTP verification failed");
        return;
      }

      localStorage.setItem("user", data.email);
      window.location.href = "/dashboard";
    } catch {
      setError("Could not contact server.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setOtp("");
    setError("");
    setStep("credentials");
  };

  return (
    <div className="auth-container login-bg" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="auth-box">

        <h1>ZeraaTech 🌿</h1>

        {step === "credentials" ? (
          <>
            <p>Welcome back — log in to your account</p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleLogin}>
              <input
                className="auth-input"
                type="text"
                placeholder="Email or phone number"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
              />
              <input
                className="auth-input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="submit"
                className="auth-btn-primary login-btn"
                disabled={loading}
              >
                {loading ? "Logging in…" : "Log In"}
              </button>
            </form>

            <div className="auth-divider">or</div>

            <button
              className="auth-btn-google"
              onClick={() => { window.location.href = "http://localhost:4000/auth/google"; }}
            >
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google"
                style={{ width: 18 }}
              />
              Sign in with Google
            </button>

            <div className="auth-footer">
              Don't have an account? <a href="/signup">Sign up</a>
            </div>
          </>
        ) : (
          <>
            <p>Enter the 6-digit code sent to your phone</p>
            <div className="otp-hint">
              Sent to <strong>{maskedPhone}</strong>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleVerifyOtp}>
              <input
                className="auth-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                autoFocus
                required
              />
              <button
                type="submit"
                className="auth-btn-primary login-btn"
                disabled={loading}
              >
                {loading ? "Verifying…" : "Verify OTP"}
              </button>
            </form>

            <div className="auth-footer" style={{ marginTop: 14 }}>
              Didn't receive it?{" "}
              <button className="auth-btn-ghost" onClick={handleResend}>
                Resend code
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
