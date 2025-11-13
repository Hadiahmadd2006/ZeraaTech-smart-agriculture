import React, { useState } from "react";
import "./Auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleGoogleLogin = () => {
    window.open("http://localhost:4000/auth/google", "_self");
  };

  const handleEmailLogin = (e) => {
    e.preventDefault();
    if (email && password) {
      localStorage.setItem("user", email);
      window.location.href = "/dashboard";
    } else {
      alert("Please fill in both fields.");
    }
  };

  return (
    <div className="auth-container">
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
          Don’t have an account? <a href="/signup">Sign up</a>
        </p>
      </div>
    </div>
  );
}