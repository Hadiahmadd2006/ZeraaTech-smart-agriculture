import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { syncDocumentLanguage } from "../i18n";

const API_BASE = "http://localhost:4000";

const STATUS_TEXT = {
  en: { good: "Good", dry: "Needs water", wet: "Too wet" },
  ar: { good: "جيد", dry: "يحتاج ماء", wet: "رطب جدًا" },
};

const STATUS_COLOR = { good: "#22c55e", dry: "#ef4444", wet: "#0ea5e9" };

const CROP_NAMES = {
  Tomato: { en: "Tomato", ar: "طماطم" },
  Potato: { en: "Potato", ar: "بطاطس" },
  Pepper: { en: "Pepper", ar: "فلفل" },
  Wheat: { en: "Wheat", ar: "قمح" },
};

const ADMIN_EMAIL = "ghareeb.hadi1@gmail.com";
const extractEmail = (u) => u?.email || u?.emails?.[0]?.value || u?._json?.email || "";

export default function Farms() {
  const [crops, setCrops] = useState([]);
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");
  const [showAdd, setShowAdd] = useState(false);
  const [newFarm, setNewFarm] = useState({
    name: "",
    location: "",
    crop: "Tomato",
    areaHectares: 1,
    moisture: 60,
    pumpStatus: "Auto",
  });
  const location = useLocation();
  const adminEmail = ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    syncDocumentLanguage(lang);
  }, [lang]);

  useEffect(() => {
    fetch(`${API_BASE}/auth/current-user`, { credentials: "include" })
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
    try {
      const res = await fetch(`${API_BASE}/api/farms`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load farms");
      const data = await res.json();
      setCrops(data);
    } catch (_) {
      const res = await fetch(`${API_BASE}/api/crops`, { credentials: "include" });
      const data = await res.json().catch(() => []);
      setCrops(data);
    }
  };

  const toggleLang = () => {
    const next = lang === "en" ? "ar" : "en";
    setLang(next);
    localStorage.setItem("lang", next);
  };

  const userEmail = (extractEmail(user) || localStorage.getItem("user") || "").toLowerCase();
  const isAdmin = userEmail === adminEmail;

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
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

  const handleCreateFarm = async (e) => {
    e.preventDefault();
    if (!newFarm.name.trim() || !newFarm.location.trim()) return;

    const payload = {
      ...newFarm,
      areaHectares: Number(newFarm.areaHectares),
      moisture: Number(newFarm.moisture),
      status: "Active",
    };

    try {
      const res = await fetch(`${API_BASE}/api/farms`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Failed to create farm");
        return;
      }

      setNewFarm({
        name: "",
        location: "",
        crop: "Tomato",
        areaHectares: 1,
        moisture: 60,
        pumpStatus: "Auto",
      });
      setShowAdd(false);
      load();
    } catch (_) {
      alert("Could not contact server.");
    }
  };

  const handleDeleteFarm = async (id) => {
    if (!id) return;
    if (!window.confirm(lang === "ar" ? "حذف هذه المزرعة؟" : "Delete this farm?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/farms/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Failed to delete farm");
        return;
      }
      load();
    } catch (_) {
      alert("Could not contact server.");
    }
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
          <h2>{lang === "ar" ? "حالة المحاصيل" : "Crop status"}</h2>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn" onClick={load}>
              {lang === "ar" ? "تحديث" : "Refresh"}
            </button>
            <button className="btn" onClick={() => setShowAdd((v) => !v)}>
              {lang === "ar" ? "إضافة مزرعة" : "Add farm"}
            </button>
          </div>
        </div>

        {showAdd && (
          <section className="card" style={{ marginTop: 14 }}>
            <div className="card-head">
              <div className="card-title">{lang === "ar" ? "مزرعة جديدة" : "New farm"}</div>
            </div>
            <div className="card-body">
              <form className="inline-form" onSubmit={handleCreateFarm}>
                <div style={{ flex: 2 }}>
                  <label className="muted">{lang === "ar" ? "الاسم" : "Name"}</label>
                  <input
                    value={newFarm.name}
                    onChange={(e) => setNewFarm((p) => ({ ...p, name: e.target.value }))}
                    placeholder={lang === "ar" ? "اسم المزرعة" : "Farm name"}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <label className="muted">{lang === "ar" ? "الموقع" : "Location"}</label>
                  <input
                    value={newFarm.location}
                    onChange={(e) => setNewFarm((p) => ({ ...p, location: e.target.value }))}
                    placeholder={lang === "ar" ? "الموقع" : "Location"}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="muted">{lang === "ar" ? "المحصول" : "Crop"}</label>
                  <select
                    value={newFarm.crop}
                    onChange={(e) => setNewFarm((p) => ({ ...p, crop: e.target.value }))}
                  >
                    <option value="Tomato">Tomato</option>
                    <option value="Potato">Potato</option>
                    <option value="Pepper">Pepper</option>
                    <option value="Wheat">Wheat</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="muted">{lang === "ar" ? "المساحة (هكتار)" : "Area (ha)"}</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newFarm.areaHectares}
                    onChange={(e) => setNewFarm((p) => ({ ...p, areaHectares: e.target.value }))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="muted">{lang === "ar" ? "رطوبة التربة %" : "Soil moisture %"}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newFarm.moisture}
                    onChange={(e) => setNewFarm((p) => ({ ...p, moisture: e.target.value }))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="muted">{lang === "ar" ? "المضخة" : "Pump"}</label>
                  <select
                    value={newFarm.pumpStatus}
                    onChange={(e) => setNewFarm((p) => ({ ...p, pumpStatus: e.target.value }))}
                  >
                    <option value="Auto">Auto</option>
                    <option value="Manual">Manual</option>
                    <option value="Scheduled">Scheduled</option>
                  </select>
                </div>
                <div style={{ alignSelf: "flex-end" }}>
                  <button className="btn" type="submit">
                    {lang === "ar" ? "حفظ" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        <section className="cards">
          {crops.map((crop) => {
            const key = crop._id || crop.id || crop.name;
            const cropNameMap = CROP_NAMES[crop.crop];
            const cropName = cropNameMap ? cropNameMap[lang] || cropNameMap.en : crop.crop;

            const moisture = typeof crop.moisture === "number" ? crop.moisture : 0;
            let statusKey = "good";
            if (moisture < 40) statusKey = "dry";
            else if (moisture > 70) statusKey = "wet";

            const statusText = STATUS_TEXT[lang][statusKey];
            const color = STATUS_COLOR[statusKey];

            return (
              <div className="card" key={key}>
                <div className="card-head">
                  <div className="card-title">{cropName}</div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span>{crop.location}</span>
                    {crop._id ? (
                      <button className="action-btn ghost" onClick={() => handleDeleteFarm(crop._id)}>
                        {lang === "ar" ? "حذف" : "Delete"}
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="card-body">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "999px",
                        background: color,
                        display: "inline-block",
                      }}
                    />
                    <span style={{ fontWeight: 600 }}>{statusText}</span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>
                    {lang === "ar"
                      ? "إذا كانت النقطة حمراء، اسقِ هذا المحصول الآن."
                      : "If the dot is red, water this crop now."}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
