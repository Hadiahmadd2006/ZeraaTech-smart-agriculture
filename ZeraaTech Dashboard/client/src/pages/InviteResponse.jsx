import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

const API_BASE = "http://localhost:4000";

export default function InviteResponse() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const action = searchParams.get("action");
  const done   = searchParams.get("done");

  const [invite, setInvite]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus]   = useState(""); // "accepted" | "denied" | "invalid" | "expired"

  useEffect(() => {
    if (token === "invalid") { setStatus("invalid"); setLoading(false); return; }
    if (token === "expired") { setStatus("expired"); setLoading(false); return; }

    fetch(`${API_BASE}/api/invitations/${token}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data) => {
        setInvite(data);
        if (data.status === "accepted") setStatus("accepted");
        if (data.status === "denied")   setStatus("denied");
        if (done && action)             setStatus(action === "accept" ? "accepted" : "denied");
      })
      .catch(() => setStatus("invalid"))
      .finally(() => setLoading(false));
  }, [token, action, done]);

  const respond = (act) => {
    window.location.href = `${API_BASE}/api/invitations/respond/${token}?action=${act}`;
  };

  if (loading) {
    return (
      <div style={wrap}>
        <div style={card}>
          <p style={{ color: "#6b7280" }}>Loading invitation…</p>
        </div>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div style={wrap}>
        <div style={card}>
          <h2 style={{ color: "#ef4444" }}>Invalid Invitation</h2>
          <p style={{ color: "#6b7280" }}>This invitation link is invalid or has already been used.</p>
        </div>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div style={wrap}>
        <div style={card}>
          <h2 style={{ color: "#f59e0b" }}>Invitation Expired</h2>
          <p style={{ color: "#6b7280" }}>This invitation has expired. Ask the admin to send a new one.</p>
        </div>
      </div>
    );
  }

  if (status === "accepted") {
    return (
      <div style={wrap}>
        <div style={card}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h2 style={{ color: "#16a34a" }}>Invitation Accepted</h2>
          <p style={{ color: "#6b7280", marginBottom: 24 }}>
            Your account is now active. Sign in with the Google account linked to <strong>{invite?.email}</strong>.
          </p>
          <a href="http://localhost:4000/auth/google" style={btnAccept}>
            Sign in with Google
          </a>
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div style={wrap}>
        <div style={card}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
          <h2 style={{ color: "#ef4444" }}>Invitation Declined</h2>
          <p style={{ color: "#6b7280" }}>You have declined this invitation.</p>
        </div>
      </div>
    );
  }

  // Pending — show accept / deny buttons
  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ marginBottom: 16 }}>
          <span style={{ background: "#dcfce7", color: "#16a34a", padding: "4px 12px", borderRadius: 99, fontSize: 13, fontWeight: 600 }}>
            ZeraaTech
          </span>
        </div>
        <h2 style={{ marginBottom: 8 }}>You've been invited</h2>
        {invite && (
          <p style={{ color: "#6b7280", marginBottom: 24 }}>
            Join <strong>ZeraaTech Smart Agriculture</strong> as a{" "}
            <strong>{invite.role === "admin" ? "Admin" : "Farmer"}</strong>.
            {invite.email && <><br /><span style={{ fontSize: 13 }}>Account: {invite.email}</span></>}
          </p>
        )}
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={() => respond("accept")} style={btnAccept}>Accept</button>
          <button onClick={() => respond("deny")}   style={btnDeny}>Deny</button>
        </div>
      </div>
    </div>
  );
}

const wrap = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f9fafb",
};

const card = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: "48px 40px",
  textAlign: "center",
  maxWidth: 440,
  width: "100%",
  boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
};

const btnAccept = {
  background: "#16a34a", color: "#fff", border: "none",
  padding: "12px 32px", borderRadius: 8, fontSize: 15,
  fontWeight: 600, cursor: "pointer",
};

const btnDeny = {
  background: "#ef4444", color: "#fff", border: "none",
  padding: "12px 32px", borderRadius: 8, fontSize: 15,
  fontWeight: 600, cursor: "pointer",
};
