import { useEffect, useMemo, useState } from "react";
import DonutGauge from "../components/DonutGauge";
import RecommendationTile from "../components/RecommendationTile";
import { fetchAIInsights, fetchGauges, fetchRecs, fetchFarms, fetchSensors } from "../api";
import { Link, useLocation } from "react-router-dom";
import { syncDocumentLanguage } from "../i18n";
import TrendChart from "../components/TrendChart";

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
    dashboard: "Dashboard",
    crops: "Crops",
    settings: "Settings",
    admin: "Admin",
    refresh: "Refresh",
    recommendations: "Recommendations",
    todayTasks: "Today's Tasks",
    searchPlaceholder: "Search farms and alerts",
    selectFarm: "Select Farm",
    loading: "Loading dashboard...",
    refreshing: "Refreshing data...",
    retry: "Retry",
    logout: "Logout",
    language: "Language: English",
    noFarms: "No farms available",
    errorTitle: "Dashboard Error",
    errorHelp: "Please check if the backend server is running and try again.",
    daily: "Daily",
    weekly: "Weekly",
    trends24h: "24h Trends",
    noTrendData: "No trend data",
    noAlerts: "No alerts right now",
    score: "Score",
  },
  ar: {
    irrigationRecommendations: "توصيات الري",
    diseaseRiskScoring: "تقييم مخاطر الأمراض",
    smartAlertPrioritization: "ترتيب التنبيهات الذكي",
    riskScore: "درجة الخطر",
    action: "الإجراء",
    confidence: "درجة الأولوية",
    target: "الهدف",
    dashboard: "لوحة التحكم",
    crops: "المحاصيل",
    settings: "الإعدادات",
    admin: "الإدارة",
    refresh: "تحديث",
    recommendations: "التوصيات",
    todayTasks: "مهام اليوم",
    searchPlaceholder: "ابحث في المزارع والتنبيهات",
    selectFarm: "اختر المزرعة",
    loading: "جاري تحميل لوحة التحكم...",
    refreshing: "جاري تحديث البيانات...",
    retry: "إعادة المحاولة",
    logout: "تسجيل الخروج",
    language: "اللغة: العربية",
    noFarms: "لا توجد مزارع متاحة",
    errorTitle: "خطأ في لوحة التحكم",
    errorHelp: "تأكد من تشغيل الخادم الخلفي ثم حاول مرة أخرى.",
    daily: "يومي",
    weekly: "أسبوعي",
    trends24h: "اتجاهات 24 ساعة",
    noTrendData: "لا توجد بيانات اتجاهات",
    noAlerts: "لا توجد تنبيهات حالياً",
    score: "الدرجة",
  },
};

const ADMIN_EMAIL = "ghareeb.hadi1@gmail.com";
const extractEmail = (u) => u?.email || u?.emails?.[0]?.value || u?._json?.email || "";

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

function temperatureToScore(temp) {
  const value = Number(temp || 0);
  if (value >= 20 && value <= 30) return 100;
  if (value < 20) return clamp(100 - (20 - value) * 5);
  return clamp(100 - (value - 30) * 5);
}

function phToScore(ph) {
  const value = Number(ph || 0);
  const diff = Math.abs(value - 6.5);
  return clamp(100 - diff * 25);
}

function getSeverityColor(value) {
  if (value < 50) return "red";
  if (value < 75) return "yellow";
  return "green";
}
function getAlertPriorityValue(severity) {
  const value = String(severity || "").toLowerCase();

  if (value === "critical") return 4;
  if (value === "high") return 3;
  if (value === "medium") return 2;
  return 1;
}

const GAUGE_FALLBACK = [
  { id: "health", label: "Health", value: 82, severity: "green" },
  { id: "water",  label: "Water",  value: 45, severity: "yellow" },
  { id: "soil",   label: "Soil",   value: 67, severity: "green" },
];

function buildGaugeDataFromRaw(rawData) {
  const latest = rawData?.latest || rawData || {};
  if (!latest || (!latest.moisture && !latest.temperature && !latest.ph)) {
    return GAUGE_FALLBACK;
  }

  const health = Math.round(
    (clamp(latest.moisture) + temperatureToScore(latest.temperature) + phToScore(latest.ph)) / 3
  );

  const water = clamp(latest.moisture);
  const soil = clamp((Number(latest.ph || 0) / 14) * 100);

  return [
    {
      id: "health",
      label: "Health",
      value: health,
      severity: getSeverityColor(health),
    },
    {
      id: "water",
      label: "Water",
      value: water,
      severity: getSeverityColor(water),
    },
    {
      id: "soil",
      label: "Soil",
      value: soil,
      severity: getSeverityColor(soil),
    },
  ];
}

export default function Dashboard() {
  const [gauges, setGauges] = useState([]);
  const [recs, setRecs] = useState([]);
  const [aiInsights, setAiInsights] = useState({
    irrigationRecommendations: [],
    diseaseRiskScores: [],
    prioritizedAlerts: [],
  });
  const [trendData, setTrendData] = useState([]);
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState("");
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const location = useLocation();

  useEffect(() => {
    syncDocumentLanguage(lang);
  }, [lang]);

  const t = (key) => AI_TEXT[lang]?.[key] || AI_TEXT.en[key] || key;

  const userEmail = (extractEmail(user) || localStorage.getItem("user") || "").toLowerCase();
  const isAdmin = userEmail === ADMIN_EMAIL.toLowerCase();

  const sortedAlerts = useMemo(() => {
  return [...(aiInsights.prioritizedAlerts || [])]
    .sort((a, b) => {
      const severityDiff =
        getAlertPriorityValue(b.severity) - getAlertPriorityValue(a.severity);

      if (severityDiff !== 0) return severityDiff;

      return Number(b.score || 0) - Number(a.score || 0);
    })
    .slice(0, 5);
}, [aiInsights.prioritizedAlerts]);

  const tagClassByLevel = (level) => {
  const value = String(level || "").toLowerCase();
  if (value === "critical") return "tag tag-red";
  if (value === "high") return "tag tag-red";
  if (value === "medium") return "tag tag-amber";
  return "tag tag-green";
  };

  const load = async (farmId = selectedFarm, isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [g, r, ai, sensors] = await Promise.all([
        fetchGauges(farmId),
        fetchRecs(farmId),
        fetchAIInsights(farmId),
        fetchSensors(farmId),
      ]);

      let gaugeData = [];

      if (Array.isArray(g)) {
        gaugeData = g;
      } else if (g && typeof g === "object") {
        gaugeData = buildGaugeDataFromRaw(g);
      }

      setGauges(gaugeData);
      setRecs(Array.isArray(r) ? r : []);
      setTrendData(Array.isArray(sensors) ? sensors : []);
      setAiInsights({
        irrigationRecommendations: ai?.irrigationRecommendations || [],
        diseaseRiskScores: ai?.diseaseRiskScores || [],
        prioritizedAlerts: ai?.prioritizedAlerts || [],
      });
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError(err?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadFarms = async () => {
    try {
      const data = await fetchFarms();
      const farmList = Array.isArray(data) ? data : [];
      setFarms(farmList);

      if (farmList.length > 0) {
        const initialFarmId = farmList[0]._id || farmList[0].id || "";
        setSelectedFarm(initialFarmId);
        return initialFarmId;
      }

      return "";
    } catch (err) {
      console.error("Failed to load farms:", err);
      setFarms([]);
      return "";
    }
  };

  useEffect(() => {
    fetch("http://localhost:4000/auth/current-user", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(async (data) => {
        if (data && (data.email || data.displayName)) {
          setUser(data);
          const email = extractEmail(data);
          localStorage.setItem("user", email || data.displayName);

          const farmId = await loadFarms();
          await load(farmId, false);
        } else {
          window.location.href = "/login";
        }
      })
      .catch(() => {
        window.location.href = "/login";
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedFarm) return;

    const interval = setInterval(() => {
      load(selectedFarm, true);
    }, 10000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFarm]);

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

  const handleFarmChange = async (e) => {
    const farmId = e.target.value;
    setSelectedFarm(farmId);
    await load(farmId, false);
  };

  const gaugeCards = useMemo(() => {
    return gauges.map((g) => {
      const title =
        GAUGE_LABELS[lang]?.[g.id] ||
        GAUGE_LABELS[lang]?.[g.label?.toLowerCase?.()] ||
        g.label;

      return (
        <div className="card" key={g.id}>
          <div className="card-head">
            <div className="card-title">{title}</div>
            <select className="chip" defaultValue={t("daily")}>
              <option>{t("daily")}</option>
              <option>{t("weekly")}</option>
            </select>
          </div>
          <div className="card-body center">
            <DonutGauge value={g.value} severity={g.severity} />
          </div>
        </div>
      );
    });
  }, [gauges, lang]);

  if (loading) {
    return (
      <div className="wrap" dir={lang === "ar" ? "rtl" : "ltr"}>
        <main className="main" style={{ padding: "40px" }}>
          <h2>{t("loading")}</h2>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wrap" dir={lang === "ar" ? "rtl" : "ltr"}>
        <main className="main" style={{ padding: "40px" }}>
          <h2>{t("errorTitle")}</h2>
          <p style={{ color: "red" }}>{error}</p>
          <p>{t("errorHelp")}</p>
          <button className="btn" onClick={() => load(selectedFarm, false)}>
            {t("retry")}
          </button>
        </main>
      </div>
    );
  }

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
            {t("dashboard")}
          </Link>
          <Link to="/farms" className={location.pathname === "/farms" ? "active" : ""}>
            {t("crops")}
          </Link>
          <Link to="/disease-detect" className={location.pathname === "/disease-detect" ? "active" : ""}>
            {lang === "ar" ? "كشف الأمراض" : "Disease Detection"}
          </Link>
          <Link to="/settings" className={location.pathname === "/settings" ? "active" : ""}>
            {t("settings")}
          </Link>
          {isAdmin && (
            <Link to="/admin" className={location.pathname === "/admin" ? "active" : ""}>
              {t("admin")}
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
            {t("logout")}
          </button>
          <button className="lang-btn" onClick={toggleLang}>
            {t("language")}
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="top">
          <input className="search" placeholder={t("searchPlaceholder")} />

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ fontSize: "14px" }}>{t("selectFarm")}:</label>
            <select className="chip" value={selectedFarm} onChange={handleFarmChange}>
              {farms.length === 0 ? (
                <option value="">{t("noFarms")}</option>
              ) : (
                farms.map((farm) => (
                  <option key={farm._id || farm.id} value={farm._id || farm.id}>
                    {farm.name || farm.title || "Farm"}
                  </option>
                ))
              )}
            </select>

            <button className="btn" onClick={() => load(selectedFarm, true)}>
              {refreshing ? t("refreshing") : t("refresh")}
            </button>
          </div>
        </div>

        <section className="cards">
          {gaugeCards}
          <div className="card wide">
            <div className="card-head">
             <div className="card-title">{t("trends24h")}</div>
           </div>
            <div className="card-body">
            {trendData.length > 0 ? (
  <TrendChart data={trendData} />
) : (
  <div className="muted">{t("noTrendData")}</div>
)}
           </div>
          </div>

          <div className="card wide">
            <div className="card-head">
              <div className="card-title">{t("recommendations")}</div>
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
              <div className="card-title">{t("todayTasks")}</div>
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
                  <div
                    key={item.id}
                    style={{ border: "1px dashed var(--line)", borderRadius: 10, padding: 10 }}
                  >
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
                  <div
                    key={risk.id}
                    style={{ border: "1px dashed var(--line)", borderRadius: 10, padding: 10 }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ fontWeight: 700 }}>
                        {risk.crop} - {risk.disease}
                      </div>
                      <span className={tagClassByLevel(risk.level)}>{risk.level}</span>
                    </div>
                    <div className="muted" style={{ marginTop: 4 }}>{risk.farm}</div>
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
    <div style={{ display: "grid", gap: 12 }}>
      {sortedAlerts.length > 0 ? (
        sortedAlerts.map((alert, index) => {
          const severity = String(alert.severity || "").toLowerCase();
          const isCritical = severity === "critical";
          const isHigh = severity === "high";

          return (
            <div
              key={alert.id || index}
              style={{
                border: isCritical
                  ? "2px solid #ef4444"
                  : isHigh
                  ? "1.5px solid #f97316"
                  : "1px solid var(--line)",
                borderRadius: 12,
                padding: 12,
                background: isCritical
                  ? "rgba(239,68,68,0.06)"
                  : isHigh
                  ? "rgba(249,115,22,0.05)"
                  : "transparent",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  #{index + 1} {alert.title}
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className={tagClassByLevel(alert.severity)}>
                    {alert.severity}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      padding: "4px 8px",
                      borderRadius: 999,
                      background: "var(--panel-2)",
                    }}
                  >
                    {t("score")}: {alert.score || 0}
                  </span>
                </div>
              </div>

              <div className="muted" style={{ marginTop: 6 }}>
                {alert.farm}
              </div>

              <div style={{ marginTop: 8, fontSize: 13 }}>
                {alert.reason}
              </div>

              <div style={{ marginTop: 8, fontSize: 13 }}>
                <strong>{t("action")}:</strong> {alert.suggestedAction}
              </div>
            </div>
          );
        })
      ) : (
        <div className="muted">{t("noAlerts")}</div>
      )}
    </div>
  </div>
</div>
        </section>
      </main>
    </div>
  );
}