import { useEffect, useState } from "react";
import DonutGauge from "../components/DonutGauge";
import RecommendationTile from "../components/RecommendationTile";
import { fetchGauges, fetchRecs } from "../api";
import { Link, useLocation } from "react-router-dom";

const GAUGE_LABELS = {
  en: { health: "Health", water: "Water", soil: "Soil" },
  ar: { health: "الصحة", water: "الماء", soil: "التربة" },
};

const TASKS = {
  en: [
    "Open pump (tomato) - 10m",
    "Shade peppers at noon",
    "Spray potato (late blight)",
  ],
  ar: [
    "افتح المضخة (طماطم) - 10 دقائق",
    "ظلل الفلفل وقت الظهر",
    "رش البطاطس (لفحة متأخرة)",
  ],
};

export default function Dashboard() {
  const [gauges, setGauges] = useState([]);
  const [recs, setRecs] = useState([]);
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");
  const location = useLocation();

  useEffect(() => {
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

  const load = async () => {
    const g = await fetchGauges();
    const r = await fetchRecs();
    setGauges(g);
    setRecs(r);
  };

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:4000/auth/logout", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
    } catch (_) {
    } finally {
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  };

  const toggleLang = () => {
    const next = lang === "en" ? "ar" : "en";
    setLang(next);
    localStorage.setItem("lang", next);
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
          <Link to="/dashboard" className={location.pathname === "/dashboard" ? "active" : ""}>
            {lang === "ar" ? "الصفحة الرئيسية" : "Dashboard"}
          </Link>
          <Link to="/farms" className={location.pathname === "/farms" ? "active" : ""}>
            {lang === "ar" ? "المحاصيل" : "Crops"}
          </Link>
          <Link to="/settings" className={location.pathname === "/settings" ? "active" : ""}>
            {lang === "ar" ? "الإعدادات" : "Settings"}
          </Link>
        </nav>

        <div className="sidebar-bottom">
          {user && (
            <div className="user-info">
              <img
                src={user.photos?.[0]?.value || "/img/default-user.png"}
                alt="User"
                className="user-avatar"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/img/default-user.png";
                }}
              />
              <span>{user.displayName || user.email}</span>
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
          <button className="lang-btn" onClick={toggleLang}>
            {lang === "ar" ? "اللغة: العربية" : "Language: English"}
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="top">
          <input
            className="search"
            placeholder={lang === "ar" ? "ابحث عن المحاصيل والتنبيهات" : "Search farms and alerts"}
          />
          <button className="btn" onClick={load}>
            {lang === "ar" ? "تحديث" : "Refresh"}
          </button>
        </div>

        <section className="cards">
          {gauges.map((g) => {
            const title =
              GAUGE_LABELS[lang]?.[g.id] ||
              GAUGE_LABELS[lang]?.[g.label?.toLowerCase?.()] ||
              g.label;

            return (
              <div className="card" key={g.id}>
                <div className="card-head">
                  <div className="card-title">{title}</div>
                  <select className="chip">
                    <option>{lang === "ar" ? "يومي" : "Daily"}</option>
                    <option>{lang === "ar" ? "أسبوعي" : "Weekly"}</option>
                  </select>
                </div>
                <div className="card-body center">
                  <DonutGauge value={g.value} />
                </div>
              </div>
            );
          })}

          <div className="card wide">
            <div className="card-head">
              <div className="card-title">
                {lang === "ar" ? "التوصيات" : "Recommendations"}
              </div>
            </div>
            <div className="recs">
              {recs.map((r) => (
                <RecommendationTile key={r.id} {...r} lang={lang} />
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title">
                {lang === "ar" ? "مهام اليوم" : "Today&apos;s Tasks"}
              </div>
            </div>
            <ul className="list">
              {TASKS[lang].map((text, index) => {
                const colorClass = index === 0 ? "green" : index === 1 ? "yellow" : "red";
                return (
                  <li key={index}>
                    <span className={`dot ${colorClass}`} /> {text}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
