import React, { useEffect, useState } from "react";
import "./Auth.css";
import { syncDocumentLanguage } from "../i18n";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lang] = useState(localStorage.getItem("lang") || "en");

  useEffect(() => {
    syncDocumentLanguage(lang);
  }, [lang]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please fill in both fields.");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Login failed");
        return;
      }

      const data = await res.json();
      localStorage.setItem("user", data.email);
      window.location.href = "/dashboard";
    } catch (err) {
      alert("Could not contact server.");
    }
  };

  return (
    <div className="auth-container" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="auth-box">
        <h1>ZeraaTech</h1>
        <p>Login to your account</p>

        <form onSubmit={handleEmailLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="google-btn">
            Login
          </button>
        </form>

        <p className="or-text">or</p>

        <button
          className="google-btn"
          onClick={() => {
            window.location.href = "http://localhost:4000/auth/google";
          }}
        >
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google"
            style={{ width: "20px", marginRight: "10px" }}
          />
          Sign in with Google
        </button>

        <p className="signup-text">
          Don't have an account? <a href="/signup">Sign up</a>
        </p>
      </div>
    </div>
  );
}
