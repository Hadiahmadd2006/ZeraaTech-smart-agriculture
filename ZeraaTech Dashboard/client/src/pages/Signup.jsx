import React, { useEffect, useState } from "react";
import "./Auth.css";
import { syncDocumentLanguage } from "../i18n";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lang] = useState(localStorage.getItem("lang") || "en");

  useEffect(() => {
    syncDocumentLanguage(lang);
  }, [lang]);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please fill in both fields.");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = await res.json().catch(() => ({}));
          alert(data.message || `Signup failed (${res.status})`);
        } else {
          const text = await res.text().catch(() => "");
          alert(text ? `Signup failed (${res.status}): ${text}` : `Signup failed (${res.status})`);
        }
        return;
      }

      alert(`Signup successful for ${email}. You can now log in.`);
      window.location.href = "/login";
    } catch (err) {
      alert("Could not contact server.");
    }
  };

  return (
    <div className="auth-container" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="auth-box">
        <h1>ZeraaTech</h1>
        <p>Create your account</p>

        <form onSubmit={handleSignup}>
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
            Sign Up
          </button>
        </form>

        <p className="signup-text">
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}
