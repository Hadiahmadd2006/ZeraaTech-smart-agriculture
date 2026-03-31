import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { detectDisease } from "../api";
import { syncDocumentLanguage } from "../i18n";

const ADMIN_EMAIL = "ghareeb.hadi1@gmail.com";
const extractEmail = (u) => u?.email || u?.emails?.[0]?.value || u?._json?.email || "";

const T = {
  en: {
    title: "Disease Detection",
    dashboard: "Dashboard",
    crops: "Crops",
    settings: "Settings",
    admin: "Admin",
    logout: "Logout",
    language: "Language: English",
    dropzone: "Drag & drop a leaf photo here, or click to browse",
    scanning: "Scanning...",
    scanBtn: "Scan Image",
    noImage: "Please upload an image first.",
    result: "Detection Result",
    confidence: "Confidence",
    treatment: "Treatment",
    top3: "Top 3 Predictions",
    history: "Scan History",
    noHistory: "No scans yet.",
    healthy: "Healthy",
    diseased: "Diseased",
    mock: "Demo result (model not loaded)",
    clearHistory: "Clear History",
  },
  ar: {
    title: "كشف الأمراض",
    dashboard: "لوحة التحكم",
    crops: "المحاصيل",
    settings: "الإعدادات",
    admin: "الإدارة",
    logout: "تسجيل الخروج",
    language: "اللغة: العربية",
    dropzone: "اسحب وأفلت صورة ورقة هنا، أو انقر للتصفح",
    scanning: "جاري الفحص...",
    scanBtn: "فحص الصورة",
    noImage: "يرجى رفع صورة أولاً.",
    result: "نتيجة الكشف",
    confidence: "الثقة",
    treatment: "العلاج",
    top3: "أفضل 3 تنبؤات",
    history: "سجل الفحوصات",
    noHistory: "لا توجد فحوصات بعد.",
    healthy: "سليم",
    diseased: "مصاب",
    mock: "نتيجة تجريبية (النموذج غير محمّل)",
    clearHistory: "مسح السجل",
  },
};

function formatLabel(label) {
  return label.replace(/___/g, " — ").replace(/_/g, " ");
}

function isHealthy(label) {
  return String(label).toLowerCase().includes("healthy");
}

export default function DiseaseDetect() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);
  const location = useLocation();

  useEffect(() => { syncDocumentLanguage(lang); }, [lang]);

  useEffect(() => {
    fetch("http://localhost:4000/auth/current-user", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (data && (data.email || data.displayName)) {
          setUser(data);
        } else {
          window.location.href = "/login";
        }
      })
      .catch(() => { window.location.href = "/login"; });
  }, []);

  const t = (key) => T[lang]?.[key] || T.en[key] || key;
  const userEmail = (extractEmail(user) || localStorage.getItem("user") || "").toLowerCase();
  const isAdmin = userEmail === ADMIN_EMAIL.toLowerCase();

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    setResult(null);
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }, [handleFile]);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const onScan = async () => {
    if (!imagePreview) { setError(t("noImage")); return; }
    setScanning(true);
    setError("");
    setResult(null);
    try {
      const base64 = imagePreview.includes(",") ? imagePreview.split(",")[1] : imagePreview;
      const data = await detectDisease(base64);
      setResult(data);
      setHistory((prev) => [
        { id: Date.now(), preview: imagePreview, label: data.label, confidence: data.confidence, ts: new Date() },
        ...prev,
      ].slice(0, 5));
    } catch (err) {
      setError(err.message || "Detection failed");
    } finally {
      setScanning(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:4000/auth/logout", { method: "GET", credentials: "include", headers: { Accept: "application/json" } });
    } catch (_) {}
    finally {
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
    <div className="wrap" dir={lang === "ar" ? "rtl" : "ltr"}>
      <aside className="sidebar">
        <div className="brand">
          <div className="logo" />
          <span style={{ fontWeight: "600", fontSize: "1.1em", marginLeft: "6px" }}>ZeraaTech</span>
        </div>

        <nav className="menu">
          <Link to="/dashboard" className={location.pathname === "/dashboard" ? "active" : ""}>{t("dashboard")}</Link>
          <Link to="/farms" className={location.pathname === "/farms" ? "active" : ""}>{t("crops")}</Link>
          <Link to="/disease-detect" className={location.pathname === "/disease-detect" ? "active" : ""}>{t("title")}</Link>
          <Link to="/settings" className={location.pathname === "/settings" ? "active" : ""}>{t("settings")}</Link>
          {isAdmin && (
            <Link to="/admin" className={location.pathname === "/admin" ? "active" : ""}>{t("admin")}</Link>
          )}
        </nav>

        <div className="sidebar-bottom">
          {user && (
            <div className="user-info">
              <img
                src={user.photo || "/img/default-user.png"}
                alt="User"
                className="user-avatar"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/img/default-user.png"; }}
              />
              <span>{user.displayName || user.email}</span>
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout}>{t("logout")}</button>
          <button className="lang-btn" onClick={toggleLang}>{t("language")}</button>
        </div>
      </aside>

      <main className="main" style={{ padding: "28px", maxWidth: 860, margin: "0 auto", width: "100%" }}>
        <h2 style={{ marginBottom: 24, fontWeight: 700 }}>{t("title")}</h2>

        {/* Upload zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          style={{
            border: `2px dashed ${dragging ? "var(--accent)" : "var(--line)"}`,
            borderRadius: 14,
            padding: "36px 24px",
            textAlign: "center",
            cursor: "pointer",
            background: dragging ? "rgba(37,99,235,0.05)" : "var(--panel)",
            transition: "all 0.2s",
            marginBottom: 24,
          }}
        >
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="preview"
              style={{ maxHeight: 220, maxWidth: "100%", borderRadius: 10, objectFit: "contain" }}
            />
          ) : (
            <p className="muted" style={{ margin: 0 }}>{t("dropzone")}</p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        <button
          className="btn"
          onClick={onScan}
          disabled={scanning || !imagePreview}
          style={{ marginBottom: 28, minWidth: 140 }}
        >
          {scanning ? t("scanning") : t("scanBtn")}
        </button>

        {error && <p style={{ color: "#ef4444", marginBottom: 16 }}>{error}</p>}

        {/* Result */}
        {result && (
          <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 14, padding: 24, marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{t("result")}</h3>
              {result.mock && <span className="tag tag-amber">{t("mock")}</span>}
            </div>

            {/* Top 3 */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontWeight: 600, marginBottom: 10 }}>{t("top3")}</p>
              {(result.top3 || [{ label: result.label, confidence: result.confidence }]).map((item, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 14 }}>
                    <span style={{ fontWeight: i === 0 ? 700 : 400 }}>
                      {formatLabel(item.label)}
                      {" "}
                      <span className={isHealthy(item.label) ? "tag tag-green" : "tag tag-red"} style={{ fontSize: 11 }}>
                        {isHealthy(item.label) ? t("healthy") : t("diseased")}
                      </span>
                    </span>
                    <span style={{ fontWeight: 600 }}>{(item.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div style={{ height: 8, background: "var(--line)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${(item.confidence * 100).toFixed(1)}%`,
                      background: i === 0 ? "var(--accent)" : "var(--line)",
                      borderRadius: 99,
                      transition: "width 0.6s ease",
                      filter: i === 0 ? "brightness(1.1)" : "none",
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Treatment */}
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
              <p style={{ fontWeight: 600, marginBottom: 10 }}>{t("treatment")}</p>
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ background: "var(--bg)", borderRadius: 10, padding: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--accent)", marginBottom: 6, display: "block" }}>EN</span>
                  <p style={{ margin: 0, fontSize: 14 }}>{result.treatment_en}</p>
                </div>
                <div style={{ background: "var(--bg)", borderRadius: 10, padding: 14 }} dir="rtl">
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--accent)", marginBottom: 6, display: "block" }}>AR</span>
                  <p style={{ margin: 0, fontSize: 14 }}>{result.treatment_ar}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 14, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>{t("history")}</h3>
            {history.length > 0 && (
              <button className="logout-btn" onClick={() => setHistory([])} style={{ padding: "4px 12px", fontSize: 12 }}>
                {t("clearHistory")}
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="muted">{t("noHistory")}</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {history.map((h) => (
                <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 14, border: "1px solid var(--line)", borderRadius: 10, padding: 12 }}>
                  <img src={h.preview} alt="scan" style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {formatLabel(h.label)}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {(h.confidence * 100).toFixed(1)}% · {h.ts.toLocaleTimeString()}
                    </div>
                  </div>
                  <span className={isHealthy(h.label) ? "tag tag-green" : "tag tag-red"} style={{ flexShrink: 0 }}>
                    {isHealthy(h.label) ? t("healthy") : t("diseased")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
