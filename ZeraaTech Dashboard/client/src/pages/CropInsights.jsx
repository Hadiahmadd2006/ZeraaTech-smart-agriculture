import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import RecommendationTile from "../components/RecommendationTile";
import { fetchCropAIInsights } from "../api";
import { syncDocumentLanguage } from "../i18n";

const ADMIN_EMAIL = "ghareeb.hadi1@gmail.com";
const extractEmail = (u) => u?.email || u?.emails?.[0]?.value || u?._json?.email || "";

const TEXT = {
  en: {
    dashboard: "Dashboard",
    crops: "Crops",
    settings: "Settings",
    admin: "Admin",
    cropAiCenter: "Crop AI Center",
    generatedAt: "Generated at",
    irrigationRecommendations: "Irrigation Recommendations",
    diseaseRiskScoring: "Disease Risk Scoring",
    smartAlertPrioritization: "Smart Alert Prioritization",
    noIrrigation: "No irrigation recommendation right now.",
    noDisease: "No disease risk alerts right now.",
    noAlerts: "No smart alerts right now.",
    riskScore: "Risk score",
    action: "Action",
    confidence: "Priority score",
    target: "Target",
    backToDashboard: "Back to Dashboard",
    logout: "Logout",
    languageEnglish: "Language: English",
    languageArabic: "Language: Arabic",
  },
  ar: {
    dashboard: "لوحة التحكم",
    crops: "المحاصيل",
    settings: "الإعدادات",
    admin: "الإدارة",
    cropAiCenter: "مركز الذكاء للمحصول",
    generatedAt: "تم التوليد في",
    irrigationRecommendations: "توصيات الري",
    diseaseRiskScoring: "تقييم مخاطر الأمراض",
    smartAlertPrioritization: "ترتيب التنبيهات الذكي",
    noIrrigation: "لا توجد توصيات ري حالياً.",
    noDisease: "لا توجد مخاطر أمراض حالياً.",
    noAlerts: "لا توجد تنبيهات ذكية حالياً.",
    riskScore: "درجة الخطر",
    action: "الإجراء",
    confidence: "درجة الأولوية",
    target: "الهدف",
    backToDashboard: "العودة للوحة التحكم",
    logout: "تسجيل الخروج",
    languageEnglish: "اللغة: الإنجليزية",
    languageArabic: "اللغة: العربية",
  },
};

export default function CropInsights() {
  const { cropName } = useParams();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState({
    cropName: cropName || "",
    recommendation: null,
    irrigationRecommendations: [],
    diseaseRiskScores: [],
    prioritizedAlerts: [],
    generatedAt: "",
  });

  const t = (key) => TEXT[lang]?.[key] || TEXT.en[key] || key;

  useEffect(() => {
    syncDocumentLanguage(lang);
  }, [lang]);

  useEffect(() => {
    fetch("http://localhost:4000/auth/current-user", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((currentUser) => {
        if (!currentUser || (!currentUser.email && !currentUser.displayName)) {
          window.location.href = "/login";
          return;
        }
        setUser(currentUser);
        const email = extractEmail(currentUser);
        localStorage.setItem("user", email || currentUser.displayName);
        return load(cropName);
      })
      .catch(() => {
        window.location.href = "/login";
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cropName]);

  const load = async (selectedCrop) => {
    setIsLoading(true);
    const insights = await fetchCropAIInsights(selectedCrop || cropName);
    setData(insights);
    setIsLoading(false);
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

  const tagClassByLevel = (level) => {
    const value = String(level || "").toLowerCase();
    if (value === "high") return "tag tag-red";
    if (value === "medium") return "tag tag-amber";
    return "tag tag-green";
  };

  const generatedAtLabel = useMemo(() => {
    if (!data.generatedAt) return "";
    const dt = new Date(data.generatedAt);
    if (Number.isNaN(dt.getTime())) return data.generatedAt;
    return dt.toLocaleString();
  }, [data.generatedAt]);

  return (
    <div className="wrap" dir={lang === "ar" ? "rtl" : "ltr"}>
      <aside className="sidebar">
        <div className="brand">
          <div className="logo" />
          <span style={{ fontWeight: "600", fontSize: "1.1em", marginLeft: "6px" }}>ZeraaTech</span>
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
            {lang === "ar" ? t("languageArabic") : t("languageEnglish")}
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="top">
          <div>
            <h2 style={{ margin: 0 }}>
              {t("cropAiCenter")} - {data.cropName}
            </h2>
            <div className="muted">
              {t("generatedAt")}: {generatedAtLabel || "-"}
            </div>
          </div>
          <Link className="btn" to="/dashboard">
            {t("backToDashboard")}
          </Link>
        </div>

        {isLoading ? (
          <section className="cards">
            <div className="card">
              <div className="card-body">Loading...</div>
            </div>
          </section>
        ) : (
          <section className="cards" style={{ marginTop: 14 }}>
            <div className="card">
              <div className="card-head">
                <div className="card-title">Recommendation Snapshot</div>
              </div>
              <div className="card-body">
                {data.recommendation ? (
                  <RecommendationTile {...data.recommendation} lang={lang} />
                ) : (
                  <div className="muted">No recommendation available for this crop.</div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <div className="card-title">{t("irrigationRecommendations")}</div>
              </div>
              <div className="card-body">
                <div style={{ display: "grid", gap: 10 }}>
                  {data.irrigationRecommendations.length === 0 ? (
                    <div className="muted">{t("noIrrigation")}</div>
                  ) : (
                    data.irrigationRecommendations.map((item) => (
                      <div key={item.id} style={{ border: "1px dashed var(--line)", borderRadius: 10, padding: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <div style={{ fontWeight: 700 }}>{item.farm}</div>
                          <span className={tagClassByLevel(item.priority)}>{item.priority}</span>
                        </div>
                        <div className="muted" style={{ marginTop: 4 }}>
                          {item.crop} • {item.moistureNow}% / {t("target")} {item.targetMoisture}%
                        </div>
                        <div style={{ marginTop: 6, fontSize: 13 }}>{item.reason}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <div className="card-title">{t("diseaseRiskScoring")}</div>
              </div>
              <div className="card-body">
                <div style={{ display: "grid", gap: 10 }}>
                  {data.diseaseRiskScores.length === 0 ? (
                    <div className="muted">{t("noDisease")}</div>
                  ) : (
                    data.diseaseRiskScores.map((risk) => (
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
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="card wide">
              <div className="card-head">
                <div className="card-title">{t("smartAlertPrioritization")}</div>
              </div>
              <div className="card-body">
                <div style={{ display: "grid", gap: 10 }}>
                  {data.prioritizedAlerts.length === 0 ? (
                    <div className="muted">{t("noAlerts")}</div>
                  ) : (
                    data.prioritizedAlerts.map((alert) => (
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
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
