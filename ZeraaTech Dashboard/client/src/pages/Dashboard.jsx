import { useEffect, useState } from "react";
import DonutGauge from "../components/DonutGauge";
import RecommendationTile from "../components/RecommendationTile";
import { fetchGauges, fetchRecs } from "../api";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [gauges, setGauges] = useState([]);
  const [recs, setRecs] = useState([]);
  const [user, setUser] = useState(null);

  // Bootstrap auth: prefer localStorage, else try server session
  useEffect(() => {
    const local = localStorage.getItem("user");
    if (local) {
      setUser({ email: local });
      load();
      return;
    }

    fetch("http://localhost:4000/auth/current-user", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (data && (data.email || data.displayName)) {
          setUser(data);
          localStorage.setItem("user", data.email || data.displayName);
          load();
        } else {
          window.location.href = "/login";
        }
      })
      .catch(() => {
        window.location.href = "/login";
      });
  }, []);

  // Load gauge and recommendation data
  const load = async () => {
    const g = await fetchGauges();
    const r = await fetchRecs();
    setGauges(g);
    setRecs(r);
  };

  // Logout clears both local storage and server session
  const handleLogout = async () => {
    try {
      await fetch("http://localhost:4000/auth/logout", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
    } catch (_) {
      // Ignore network/CORS issues; we'll still clear client state
    } finally {
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  };

  return (
    <div className="wrap">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo" />
          <span style={{ fontWeight: "600", fontSize: "1.1em", marginLeft: "6px" }}>
            ZeraaTech
          </span>
        </div>

        <nav className="menu">
          <Link to="/dashboard" className="active">
            Dashboard
          </Link>
          <Link to="/farms">Farms</Link>
          <Link to="/settings">Settings</Link>
        </nav>

        <div className="sidebar-bottom">
          {user && (
            <div className="user-info">
              <img
                src={user.photos?.[0]?.value || "/img/default-user.png"}
                alt="User"
                className="user-avatar"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/img/default-user.png"; }}
              />
              <span>{user.displayName || user.email}</span>
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <main className="main">
        <div className="top">
          <input className="search" placeholder="Search…" />
          <button className="btn" onClick={load}>Refresh</button>
        </div>

        <section className="cards">
          {gauges.map((g) => (
            <div className="card" key={g.id}>
              <div className="card-head">
                <div className="card-title">{g.label}</div>
                <select className="chip">
                  <option>Daily</option>
                  <option>Weekly</option>
                </select>
              </div>
              <div className="card-body center">
                <DonutGauge value={g.value} />
              </div>
            </div>
          ))}

          <div className="card wide">
            <div className="card-head">
              <div className="card-title">Recommendations</div>
            </div>
            <div className="recs">
              {recs.map((r) => (
                <RecommendationTile key={r.id} {...r} />
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title">Today’s Tasks</div>
            </div>
            <ul className="list">
              <li>
                <span className="dot green" /> Open pump (tomato) – 10m
              </li>
              <li>
                <span className="dot yellow" /> Shade peppers at noon
              </li>
              <li>
                <span className="dot red" /> Spray potato (late blight)
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
