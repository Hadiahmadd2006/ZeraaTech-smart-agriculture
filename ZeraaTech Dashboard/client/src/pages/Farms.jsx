import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchCrops } from "../api";

const STATUS_TEXT = {
  en: {
    good: "Good",
    dry: "Needs water",
    wet: "Too wet",
  },
  ar: {
    good: "جيد",
    dry: "يحتاج ماء",
    wet: "رطب جدًا",
  },
};

const STATUS_COLOR = {
  good: "#22c55e",
  dry: "#ef4444",
  wet: "#0ea5e9",
};

const CROP_NAMES = {
  Tomato: { en: "Tomato", ar: "طماطم" },
  Potato: { en: "Potato", ar: "بطاطس" },
  Pepper: { en: "Pepper", ar: "فلفل" },
  Wheat: { en: "Wheat", ar: "قمح" },
};

export default function Farms() {
  const [crops, setCrops] = useState([]);
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
    const data = await fetchCrops();
    setCrops(data);
  };

  const toggleLang = () => {
    const next = lang === "en" ? "ar" : "en";
    setLang(next);
    localStorage.setItem("lang", next);
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
          <h2>{lang === "ar" ? "حالة المحاصيل" : "Crop status"}</h2>
          <button className="btn" onClick={load}>
            {lang === "ar" ? "تحديث" : "Refresh"}
          </button>
        </div>

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
                  <span>{crop.location}</span>
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
                      ? "إذا كانت العلامة حمراء، اسقِ هذا المحصول الآن."
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
