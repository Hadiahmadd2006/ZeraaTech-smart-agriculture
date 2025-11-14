import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { applyTheme } from "../theme";

const DEFAULT_SETTINGS = [
  {
    id: "language",
    group: "General",
    label: "Interface language",
    description: "Used for labels, hints and messages.",
    type: "select",
    options: ["English", "Arabic"],
    defaultValue: "English",
  },
  {
    id: "theme",
    group: "General",
    label: "Theme",
    description: "Choose the look that feels best for you.",
    type: "select",
    options: ["Light", "Dark"],
    defaultValue: "Light",
  },
  {
    id: "notifications-irrigation",
    group: "Notifications",
    label: "Irrigation alerts",
    description: "Get a reminder when a crop is too dry.",
    type: "boolean",
    defaultValue: true,
  },
  {
    id: "notifications-disease",
    group: "Notifications",
    label: "Disease risk alerts",
    description: "Be notified when conditions favour disease.",
    type: "boolean",
    defaultValue: true,
  },
  {
    id: "moisture-threshold",
    group: "Irrigation",
    label: "Default moisture target",
    description: "Used when you do not set a specific target per crop.",
    type: "number",
    unit: "%",
    min: 20,
    max: 90,
    defaultValue: 60,
  },
];

function loadStoredSettings() {
  try {
    return JSON.parse(localStorage.getItem("zeraaSettings") || "{}");
  } catch {
    return {};
  }
}

export default function Settings() {
  const [settings, setSettings] = useState(() => {
    const stored = loadStoredSettings();
    return DEFAULT_SETTINGS.map((setting) => ({
      ...setting,
      value:
        stored[setting.id] !== undefined ? stored[setting.id] : setting.defaultValue,
    }));
  });
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");
  const location = useLocation();

  useEffect(() => {
    const local = localStorage.getItem("user");
    if (local) {
      setUser({ email: local });
      return;
    }

    fetch("http://localhost:4000/auth/current-user", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (data && (data.email || data.displayName)) {
          setUser(data);
          localStorage.setItem("user", data.email || data.displayName);
        } else {
          window.location.href = "/login";
        }
      })
      .catch(() => {
        window.location.href = "/login";
      });
  }, []);

  // Keep lang and theme in sync with saved settings on first load.
  useEffect(() => {
    const stored = loadStoredSettings();
    if (stored.language === "Arabic") {
      setLang("ar");
      localStorage.setItem("lang", "ar");
    } else if (stored.language === "English") {
      setLang("en");
      localStorage.setItem("lang", "en");
    }

    if (stored.theme === "Dark" || stored.theme === "Light") {
      applyTheme(stored.theme);
      localStorage.setItem("theme", stored.theme);
    }
  }, []);

  const persistSettings = (nextSettings) => {
    const toStore = {};
    nextSettings.forEach((s) => {
      toStore[s.id] = s.value;
    });
    try {
      localStorage.setItem("zeraaSettings", JSON.stringify(toStore));
    } catch {
      // ignore
    }
  };

  const handleChange = (id, value) => {
    setSettings((prev) => {
      const updated = prev.map((setting) =>
        setting.id === id ? { ...setting, value } : setting
      );
      persistSettings(updated);
      return updated;
    });

    if (id === "language") {
      const nextLang = value === "Arabic" ? "ar" : "en";
      setLang(nextLang);
      localStorage.setItem("lang", nextLang);
    }

    if (id === "theme") {
      applyTheme(value);
      localStorage.setItem("theme", value);
    }
  };

  const handleReset = () => {
    const reset = DEFAULT_SETTINGS.map((setting) => ({
      ...setting,
      value: setting.defaultValue,
    }));
    setSettings(reset);
    persistSettings(reset);
    applyTheme("Light");
    localStorage.setItem("theme", "Light");
    setLang("en");
    localStorage.setItem("lang", "en");
  };

  const renderControl = (setting) => {
    if (setting.type === "select") {
      return (
        <select
          value={setting.value}
          onChange={(e) => handleChange(setting.id, e.target.value)}
          style={{
            width: "100%",
            padding: 8,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            marginTop: 4,
          }}
        >
          {setting.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (setting.type === "boolean") {
      return (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            marginTop: 6,
          }}
        >
          <input
            type="checkbox"
            checked={Boolean(setting.value)}
            onChange={(e) => handleChange(setting.id, e.target.checked)}
          />
          {setting.description}
        </label>
      );
    }

    if (setting.type === "number") {
      return (
        <div style={{ marginTop: 4 }}>
          <input
            type="number"
            min={setting.min}
            max={setting.max}
            value={setting.value}
            onChange={(e) => {
              const numeric = Number(e.target.value);
              if (Number.isNaN(numeric)) return;
              handleChange(setting.id, numeric);
            }}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          />
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
            Recommended between {setting.min}
            {setting.unit} and {setting.max}
            {setting.unit}.
          </div>
        </div>
      );
    }

    return null;
  };

  const groups = Array.from(new Set(settings.map((s) => s.group)));

  const toggleLang = () => {
    const next = lang === "en" ? "ar" : "en";
    setLang(next);
    localStorage.setItem("lang", next);

    const label = next === "ar" ? "Arabic" : "English";
    setSettings((prev) => {
      const updated = prev.map((setting) =>
        setting.id === "language" ? { ...setting, value: label } : setting
      );
      persistSettings(updated);
      return updated;
    });
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
          <button
            className="logout-btn"
            onClick={() => {
              fetch("http://localhost:4000/auth/logout", {
                method: "GET",
                credentials: "include",
                headers: { Accept: "application/json" },
              }).finally(() => {
                localStorage.removeItem("user");
                window.location.href = "/login";
              });
            }}
          >
            Logout
          </button>
          <button className="lang-btn" onClick={toggleLang}>
            {lang === "ar" ? "اللغة: العربية" : "Language: English"}
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="top">
          <h2>{lang === "ar" ? "الإعدادات" : "Settings"}</h2>
          <button className="btn" onClick={handleReset}>
            {lang === "ar" ? "العودة للوضع الافتراضي" : "Reset to defaults"}
          </button>
        </div>

        <section className="cards">
          {groups.map((group) => (
            <div className="card" key={group}>
              <div className="card-head">
                <div className="card-title">{group}</div>
              </div>
              <div className="card-body">
                <div style={{ display: "grid", gap: 12 }}>
                  {settings
                    .filter((s) => s.group === group)
                    .map((setting) => (
                      <div key={setting.id}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{setting.label}</div>
                        {setting.type !== "boolean" && setting.description && (
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                            {setting.description}
                          </div>
                        )}
                        {renderControl(setting)}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
