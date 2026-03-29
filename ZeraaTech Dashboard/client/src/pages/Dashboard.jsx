import { useEffect, useState } from "react";
import DonutGauge from "../components/DonutGauge";
import RecommendationTile from "../components/RecommendationTile";
import { fetchAIInsights, fetchGauges, fetchRecs } from "../api";
import { Link, useLocation } from "react-router-dom";
import { syncDocumentLanguage } from "../i18n";

const GAUGE_LABELS = {
  en: { health: "Health", water: "Water", soil: "Soil" },
  ar: { health: "الصحة", water: "المياه", soil: "التربة" },
};

const TASKS = {
  en: ["Open pump (tomato) - 10m", "Shade peppers at noon", "Spray potato (late blight)"],
  ar: ["تشغيل المضخة (طماطم) - 10 دقائق", "تظليل الفلفل عند الظهر", "رش البطاطس (اللفحة المتأخرة)"],
};

const AI_TEXT = {
  en: {
    irrigationRecommendations: "Irrigation Recommendations",
    diseaseRiskScoring: "Disease Risk Scoring",
    smartAlertPrioritization: "Smart Alert Prioritization",
    riskScore: "Risk score",
    action: "Action",
    confidence: "Priority score",
    target: "Target",
  },
  ar: {
    irrigationRecommendations: "توصيات الري",
    diseaseRiskScoring: "تقييم مخاطر الأمراض",
    smartAlertPrioritization: "ترتيب التنبيهات الذكي",
    riskScore: "درجة الخطر",
    action: "الإجراء",
    confidence: "درجة الأولوية",
    target: "الهدف",
  },
};

const ADMIN_EMAIL = "ghareeb.hadi1@gmail.com";
const extractEmail = (u) => u?.email || u?.emails?.[0]?.value || u?._json?.email || "";

export default function Dashboard() {
  const [gauges, setGauges] = useState([]);
  const [recs, setRecs] = useState([]);
  const [aiInsights, setAiInsights] = useState({
    irrigationRecommendations: [],
    diseaseRiskScores: [],
    prioritizedAlerts: [],
  });
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");
  const location = useLocation();

  useEffect(() => {
    syncDocumentLanguage(lang);
  }, [lang]);

  useEffect(() => {
    fetch("http://localhost:4000/auth/current-user", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (data && (data.email || data.displayName)) {
          setUser(data);
          const email = extractEmail(data);
          localStorage.setItem("user", email || data.displayName);
          load();
        } else {
          window.location.href = "/login";
        }
      })
      .catch(() => {
        window.location.href = "/login";
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    const [g, r, ai] = await Promise.all([fetchGauges(), fetchRecs(), fetchAIInsights()]);
    setGauges(g);
    setRecs(r);
    setAiInsights({
      irrigationRecommendations: ai?.irrigationRecommendations || [],
      diseaseRiskScores: ai?.diseaseRiskScores || [],
      prioritizedAlerts: ai?.prioritizedAlerts || [],
    });
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

  const userEmail = (extractEmail(user) || localStorage.getItem("user") || "").toLowerCase();
  const isAdmin = userEmail === ADMIN_EMAIL.toLowerCase();
  const t = (key) => AI_TEXT[lang]?.[key] || AI_TEXT.en[key] || key;

  const tagClassByLevel = (level) => {
    const value = String(level || "").toLowerCase();
    if (value === "high") return "tag tag-red";
    if (value === "medium") return "tag tag-amber";
    return "tag tag-green";
  };

  return (
    <div className="wrap" dir={lang === "ar" ? "rtl" : "ltr"}>
      <aside className="sidebar">
        <div className="brand">
          <div className="logo" />
          <span style={{ fontWeight: "600", fontSize: "1.1em", marginLeft: "6px" }}>
            ZeraaTech
          </span>
        </div>

        <nav className="menu">
          <Link to="/dashboard" className={location.pathname === "/dashboard" ? "active" : ""}>
            {lang === "ar" ? "لوحة التحكم" : "Dashboard"}
          </Link>
          <Link to="/farms" className={location.pathname === "/farms" ? "active" : ""}>
            {lang === "ar" ? "المحاصيل" : "Crops"}
          </Link>
          <Link to="/settings" className={location.pathname === "/settings" ? "active" : ""}>
            {lang === "ar" ? "الإعدادات" : "Settings"}
          </Link>
          {isAdmin && (
            <Link to="/admin" className={location.pathname === "/admin" ? "active" : ""}>
              {lang === "ar" ? "الإدارة" : "Admin"}
            </Link>
          )}
        </nav>

        <div className="sidebar-bottom">
          {user && (
            <div className="user-info">
              <img
                src={user.photo || "/img/default-user.png"}
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
            placeholder={lang === "ar" ? "ابحث في المزارع والتنبيهات" : "Search farms and alerts"}
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
              <div className="card-title">{lang === "ar" ? "التوصيات" : "Recommendations"}</div>
            </div>
            <div className="recs">
              {recs.map((r) => (
                <RecommendationTile
                  key={r.id}
                  {...r}
                  lang={lang}
                  to={`/crop/${encodeURIComponent(String(r.plant || "").toLowerCase())}`}
                />
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title">{lang === "ar" ? "مهام اليوم" : "Today's Tasks"}</div>
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

          <div className="card">
            <div className="card-head">
              <div className="card-title">{t("irrigationRecommendations")}</div>
            </div>
            <div className="card-body">
              <div style={{ display: "grid", gap: 10 }}>
                {aiInsights.irrigationRecommendations.slice(0, 3).map((item) => (
                  <div key={item.id} style={{ border: "1px dashed var(--line)", borderRadius: 10, padding: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ fontWeight: 700 }}>{item.farm}</div>
                      <span className={tagClassByLevel(item.priority)}>{item.priority}</span>
                    </div>
                    <div className="muted" style={{ marginTop: 4 }}>
                      {item.crop} • {item.moistureNow}% / {t("target")} {item.targetMoisture}%
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13 }}>
                      {item.recommendedDurationMin > 0
                        ? `${lang === "ar" ? "تشغيل الري" : "Irrigate"}: ${item.recommendedDurationMin}m`
                        : lang === "ar"
                        ? "لا حاجة لري فوري"
                        : "No immediate irrigation needed"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title">{t("diseaseRiskScoring")}</div>
            </div>
            <div className="card-body">
              <div style={{ display: "grid", gap: 10 }}>
                {aiInsights.diseaseRiskScores.slice(0, 3).map((risk) => (
                  <div key={risk.id} style={{ border: "1px dashed var(--line)", borderRadius: 10, padding: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ fontWeight: 700 }}>
                        {risk.crop} - {risk.disease}
                      </div>
                      <span className={tagClassByLevel(risk.level)}>{risk.level}</span>
                    </div>
                    <div className="muted" style={{ marginTop: 4 }}>
                      {risk.farm}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13 }}>
                      {t("riskScore")}: {risk.score}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card wide">
            <div className="card-head">
              <div className="card-title">{t("smartAlertPrioritization")}</div>
            </div>
            <div className="card-body">
              <div style={{ display: "grid", gap: 10 }}>
                {aiInsights.prioritizedAlerts.slice(0, 4).map((alert) => (
                  <div key={alert.id} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                      <div style={{ fontWeight: 700 }}>{alert.title}</div>
                      <span className={tagClassByLevel(alert.severity)}>{alert.severity}</span>
                    </div>
                    <div className="muted" style={{ marginTop: 4 }}>
                      {alert.farm}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13 }}>{alert.reason}</div>
                    <div style={{ marginTop: 6, fontSize: 13 }}>
                      <strong>{t("action")}:</strong> {alert.suggestedAction}
                    </div>
                    <div className="muted" style={{ marginTop: 4 }}>
                      {t("confidence")}: {alert.score}/100
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
