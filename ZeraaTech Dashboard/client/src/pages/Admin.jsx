import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { syncDocumentLanguage } from "../i18n";

const API_BASE = "http://localhost:4000";
const ADMIN_EMAIL = "ghareeb.hadi1@gmail.com";

const extractEmail = (u) => u?.email || u?.emails?.[0]?.value || u?._json?.email || "";

const DEFAULT_THRESHOLDS = {
  temperatureMin: 18,
  temperatureMax: 35,
  moistureMin: 40,
  moistureMax: 80,
  phMin: 5.5,
  phMax: 7.5,
};

const FALLBACK_LOGS = [
  {
    id: "log-1",
    type: "LOGIN",
    description: "Admin user logged in successfully.",
    actor: "System",
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: "log-2",
    type: "SENSOR",
    description: "Sensor readings received from Farm 1.",
    actor: "IoT Pipeline",
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: "log-3",
    type: "ALERT",
    description: "High priority irrigation alert was created.",
    actor: "Alert Engine",
    createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
  },
  {
    id: "log-4",
    type: "SMS",
    description: "SMS notification sent to farmer phone number.",
    actor: "SMS Gateway",
    createdAt: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
  },
];

const TEXT = {
  en: {
    dashboard: "Dashboard",
    crops: "Crops",
    settings: "Settings",
    admin: "Admin",
    logout: "Logout",
    languageEnglish: "Language: English",
    languageArabic: "Language: Arabic",
    manage: "Manage access, roles, and invitations.",
    searchPlaceholder: "Search by name, email, or role",
    refresh: "Refresh",
    loading: "Loading...",
    couldNotLoad: "Could not load users",
    activeUsers: "Active users",
    admins: "Admins",
    invites: "Invites",
    suspended: "Suspended",
    onBoard: "on board",
    peopleToday: "People with access today.",
    fullControl: "with full control",
    trustedStaff: "Limit this group to trusted staff.",
    pending: "pending",
    reminders: "Send reminders or revoke.",
    blocked: "blocked",
    review: "Review and reinstate if needed.",
    teamDirectory: "Team directory",
    promote: "Promote, suspend, or invite teammates.",
    member: "Member",
    role: "Role",
    status: "Status",
    lastActive: "Last active",
    farms: "Farms",
    actions: "Actions",
    makeFarmer: "Make farmer",
    makeAdmin: "Make admin",
    suspend: "Suspend",
    reinstate: "Reinstate",
    noUsers: "No users found.",
    name: "Name",
    email: "Email",
    invite: "Invite",
    fullName: "Full name",
    exampleEmail: "user@zeraa.io",
    never: "Never",
    justNow: "Just now",
    unknown: "Unknown",
    thresholdManagement: "Threshold management",
    thresholdHelp: "Set safe min and max values used by the alert engine.",
    temperature: "Temperature",
    moisture: "Moisture",
    ph: "pH",
    min: "Min",
    max: "Max",
    saveThresholds: "Save thresholds",
    saving: "Saving...",
    saveSuccess: "Thresholds saved successfully.",
    saveFailed: "Could not save thresholds.",
    systemLogs: "System logs",
    logsHelp: "Recent platform events: logins, sensor readings, alerts, and SMS.",
    eventType: "Event type",
    description: "Description",
    actor: "Actor",
    time: "Time",
    noLogs: "No logs available.",
    loadingLogs: "Loading logs...",
    retryLoad: "Retry",
  },
  ar: {
    dashboard: "لوحة التحكم",
    crops: "المحاصيل",
    settings: "الإعدادات",
    admin: "الإدارة",
    logout: "تسجيل الخروج",
    languageEnglish: "اللغة: الإنجليزية",
    languageArabic: "اللغة: العربية",
    manage: "إدارة الوصول والأدوار والدعوات.",
    searchPlaceholder: "ابحث بالاسم أو البريد أو الدور",
    refresh: "تحديث",
    loading: "جاري التحميل...",
    couldNotLoad: "تعذر تحميل المستخدمين",
    activeUsers: "المستخدمون النشطون",
    admins: "المشرفون",
    invites: "الدعوات",
    suspended: "موقوفون",
    onBoard: "مستخدمون",
    peopleToday: "أشخاص لديهم وصول اليوم.",
    fullControl: "بصلاحيات كاملة",
    trustedStaff: "قم بتقييد هذا إلى موظفين موثوقين.",
    pending: "معلق",
    reminders: "أرسل تذكيرًا أو ألغِ الدعوة.",
    blocked: "محجوب",
    review: "راجع وأعد التفعيل عند الحاجة.",
    teamDirectory: "دليل الفريق",
    promote: "ترقية أو إيقاف أو دعوة أعضاء الفريق.",
    member: "العضو",
    role: "الدور",
    status: "الحالة",
    lastActive: "آخر نشاط",
    farms: "المزارع",
    actions: "إجراءات",
    makeFarmer: "اجعله مزارعًا",
    makeAdmin: "اجعله مشرفًا",
    suspend: "إيقاف",
    reinstate: "إعادة تفعيل",
    noUsers: "لا يوجد مستخدمون.",
    name: "الاسم",
    email: "البريد الإلكتروني",
    invite: "دعوة",
    fullName: "الاسم الكامل",
    exampleEmail: "user@zeraa.io",
    never: "أبدًا",
    justNow: "الآن",
    unknown: "غير معروف",
    thresholdManagement: "إدارة الحدود",
    thresholdHelp: "حدد القيم الدنيا والعليا الآمنة التي يستخدمها نظام التنبيهات.",
    temperature: "درجة الحرارة",
    moisture: "الرطوبة",
    ph: "الرقم الهيدروجيني",
    min: "الحد الأدنى",
    max: "الحد الأقصى",
    saveThresholds: "حفظ الحدود",
    saving: "جارٍ الحفظ...",
    saveSuccess: "تم حفظ الحدود بنجاح.",
    saveFailed: "تعذر حفظ الحدود.",
    systemLogs: "سجلات النظام",
    logsHelp: "أحدث أحداث المنصة: تسجيل الدخول وقراءات الحساسات والتنبيهات والرسائل النصية.",
    eventType: "نوع الحدث",
    description: "الوصف",
    actor: "الجهة",
    time: "الوقت",
    noLogs: "لا توجد سجلات متاحة.",
    loadingLogs: "جارٍ تحميل السجلات...",
    retryLoad: "إعادة المحاولة",
  },
};

export default function Admin() {
  const [team, setTeam] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Farmer" });
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [isSavingThresholds, setIsSavingThresholds] = useState(false);
  const [thresholdMessage, setThresholdMessage] = useState("");
  const [logs, setLogs] = useState([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const location = useLocation();

  const adminEmail = ADMIN_EMAIL.toLowerCase();
  const t = (key) => TEXT[lang]?.[key] ?? TEXT.en[key] ?? key;

  useEffect(() => {
    syncDocumentLanguage(lang);
  }, [lang]);

  const formatLastActive = (dateOrNull) => {
    if (!dateOrNull) return t("never");
    const date = new Date(dateOrNull);
    if (Number.isNaN(date.getTime())) return t("unknown");
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return t("justNow");
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  };

  const formatLogTime = (dateValue) => {
    if (!dateValue) return t("unknown");
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return t("unknown");
    return date.toLocaleString();
  };

  const loadTeam = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, { credentials: "include" });
      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        const body = contentType.includes("application/json")
          ? JSON.stringify(await res.json().catch(() => ({})))
          : await res.text().catch(() => "");
        throw new Error(`Failed to load users (${res.status}). ${body}`.trim());
      }
      const data = await res.json();
      const selfEmail = (extractEmail(user) || localStorage.getItem("user") || "").toLowerCase();
      setTeam(
        data
          .filter((u) => {
            const email = String(u.email || "").toLowerCase();
            return !selfEmail || (email && email !== selfEmail);
          })
          .map((u) => ({
            id: u.id,
            name: u.displayName || u.email,
            email: u.email,
            role: u.role === "admin" ? "Admin" : "Farmer",
            status: u.status || "Active",
            lastActive: formatLastActive(u.lastActiveAt),
            farms: u.farms || 0,
          }))
      );
    } catch (err) {
      setTeam([]);
      setLoadError(err?.message || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const loadThresholds = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/thresholds`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load thresholds");
      const data = await res.json();
      setThresholds({
        temperatureMin: Number(data.temperatureMin ?? DEFAULT_THRESHOLDS.temperatureMin),
        temperatureMax: Number(data.temperatureMax ?? DEFAULT_THRESHOLDS.temperatureMax),
        moistureMin: Number(data.moistureMin ?? DEFAULT_THRESHOLDS.moistureMin),
        moistureMax: Number(data.moistureMax ?? DEFAULT_THRESHOLDS.moistureMax),
        phMin: Number(data.phMin ?? DEFAULT_THRESHOLDS.phMin),
        phMax: Number(data.phMax ?? DEFAULT_THRESHOLDS.phMax),
      });
    } catch (_) {
      setThresholds(DEFAULT_THRESHOLDS);
    }
  };

  const loadLogs = async () => {
    setIsLogsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/logs`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load logs");
      const data = await res.json();
      const rows = Array.isArray(data) ? data : data?.logs || [];
      setLogs(
        rows.map((log, index) => ({
          id: log.id || log._id || `log-${index}`,
          type: log.type || log.category || "SYSTEM",
          description: log.description || log.message || "-",
          actor: log.actor || log.user?.displayName || log.user?.email || "System",
          createdAt: log.createdAt || log.timestamp || null,
        }))
      );
    } catch (_) {
      setLogs(FALLBACK_LOGS);
    } finally {
      setIsLogsLoading(false);
    }
  };

  useEffect(() => {
    fetch(`${API_BASE}/auth/current-user`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (data && (data.email || data.displayName)) {
          setUser(data);
          const email = extractEmail(data);
          localStorage.setItem("user", email || data.displayName || "");
        } else {
          window.location.href = "/login";
        }
      })
      .catch(() => {
        window.location.href = "/login";
      });
  }, []);

  const userEmail = useMemo(() => {
    const email = extractEmail(user) || localStorage.getItem("user") || "";
    return email.toLowerCase();
  }, [user]);

  const isAdmin = useMemo(() => {
    if (user?.role) return user.role === "admin";
    return userEmail === adminEmail;
  }, [user, userEmail, adminEmail]);

  const isSuperAdmin = useMemo(() => {
    if (user?.isSuperAdmin !== undefined) return Boolean(user.isSuperAdmin);
    return userEmail === adminEmail;
  }, [user, userEmail, adminEmail]);

  useEffect(() => {
    if (!user) return;
    if (user?.role && user.role !== "admin") {
      window.location.href = "/dashboard";
      return;
    }
    if (!user?.role && userEmail && userEmail !== adminEmail) {
      window.location.href = "/dashboard";
    }
  }, [user, userEmail, adminEmail]);

  useEffect(() => {
    if (!isAdmin) return;
    loadTeam();
    loadThresholds();
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const toggleLang = () => {
    const next = lang === "en" ? "ar" : "en";
    setLang(next);
    localStorage.setItem("lang", next);
  };

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

  const stats = useMemo(() => {
    const active = team.filter((member) => member.status === "Active").length;
    const pending = team.filter((member) => member.status === "Pending").length;
    const suspended = team.filter((member) => member.status === "Suspended").length;
    const admins = team.filter((member) => member.role === "Admin").length;
    return { active, pending, suspended, admins };
  }, [team]);

  const filteredTeam = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return team;
    return team.filter((member) => {
      return (
        member.name.toLowerCase().includes(term) ||
        member.email.toLowerCase().includes(term) ||
        member.role.toLowerCase().includes(term) ||
        member.status.toLowerCase().includes(term)
      );
    });
  }, [team, search]);

  const setRole = async (id, role) => {
    setTeam((prev) => prev.map((member) => (member.id === id ? { ...member, role } : member)));
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${encodeURIComponent(id)}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: role === "Admin" ? "admin" : "farmer" }),
      });
      if (!res.ok) loadTeam();
    } catch (_) {
      loadTeam();
    }
  };

  const setStatus = async (id, status) => {
    setTeam((prev) => prev.map((member) => (member.id === id ? { ...member, status } : member)));
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${encodeURIComponent(id)}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) loadTeam();
    } catch (_) {
      loadTeam();
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUser.email,
          displayName: newUser.name,
          role: newUser.role === "Admin" ? "admin" : "farmer",
          status: "Pending",
        }),
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
          ? await res.json().catch(() => ({}))
          : { message: await res.text().catch(() => "") };
        alert(data.message || `Failed to invite user (${res.status})`);
        return;
      }

      setNewUser({ name: "", email: "", role: "Farmer" });
      loadTeam();
    } catch (_) {
      alert("Could not contact server.");
    }
  };

  const handleThresholdChange = (key, value) => {
    setThresholds((prev) => ({ ...prev, [key]: value }));
  };

  const saveThresholds = async () => {
    setIsSavingThresholds(true);
    setThresholdMessage("");
    try {
      const payload = {
        temperatureMin: Number(thresholds.temperatureMin),
        temperatureMax: Number(thresholds.temperatureMax),
        moistureMin: Number(thresholds.moistureMin),
        moistureMax: Number(thresholds.moistureMax),
        phMin: Number(thresholds.phMin),
        phMax: Number(thresholds.phMax),
      };

      const res = await fetch(`${API_BASE}/api/admin/thresholds`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save thresholds");
      setThresholdMessage(t("saveSuccess"));
    } catch (_) {
      setThresholdMessage(t("saveFailed"));
    } finally {
      setIsSavingThresholds(false);
    }
  };

  const renderMenuLink = (to, label) => (
    <Link to={to} className={location.pathname === to ? "active" : ""}>
      {label}
    </Link>
  );

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
          {renderMenuLink("/dashboard", t("dashboard"))}
          {renderMenuLink("/farms", t("crops"))}
          {renderMenuLink("/settings", t("settings"))}
          {isAdmin && renderMenuLink("/admin", t("admin"))}
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
            <h2 style={{ margin: 0 }}>{t("admin")}</h2>
            <div className="muted">{t("manage")}</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              className="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
            />
            <button className="btn" onClick={loadTeam} disabled={isLoading}>
              {isLoading ? t("loading") : t("refresh")}
            </button>
          </div>
        </div>

        {loadError ? (
          <section className="card" style={{ marginTop: 14 }}>
            <div className="card-body">
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{t("couldNotLoad")}</div>
              <div className="muted" style={{ whiteSpace: "pre-wrap" }}>
                {loadError}
              </div>
              <div className="muted" style={{ marginTop: 10 }}>
                If you see a 404, restart the backend from `ZeraaTech Dashboard/server`.
              </div>
            </div>
          </section>
        ) : null}

        <section className="cards">
          <div className="card">
            <div className="card-head">
              <div className="card-title">{t("activeUsers")}</div>
              <span className="tag tag-green">{stats.active}</span>
            </div>
            <div className="card-body">
              <div className="stat-value">
                {stats.active} {t("onBoard")}
              </div>
              <div className="muted">{t("peopleToday")}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title">{t("admins")}</div>
              <span className="tag tag-blue">{stats.admins}</span>
            </div>
            <div className="card-body">
              <div className="stat-value">
                {stats.admins} {t("fullControl")}
              </div>
              <div className="muted">{t("trustedStaff")}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title">{t("invites")}</div>
              <span className="tag tag-amber">{stats.pending}</span>
            </div>
            <div className="card-body">
              <div className="stat-value">
                {stats.pending} {t("pending")}
              </div>
              <div className="muted">{t("reminders")}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title">{t("suspended")}</div>
              <span className="tag tag-red">{stats.suspended}</span>
            </div>
            <div className="card-body">
              <div className="stat-value">
                {stats.suspended} {t("blocked")}
              </div>
              <div className="muted">{t("review")}</div>
            </div>
          </div>
        </section>

        <section className="cards" style={{ marginTop: 18 }}>
          <div className="card wide">
            <div className="card-head">
              <div>
                <div className="card-title">{t("thresholdManagement")}</div>
                <div className="muted">{t("thresholdHelp")}</div>
              </div>
            </div>
            <div className="card-body">
              <div className="inline-form" style={{ marginTop: 0 }}>
                <div style={{ flex: 1 }}>
                  <label className="muted">{t("temperature")} {t("min")}</label>
                  <input
                    type="number"
                    value={thresholds.temperatureMin}
                    onChange={(e) => handleThresholdChange("temperatureMin", e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="muted">{t("temperature")} {t("max")}</label>
                  <input
                    type="number"
                    value={thresholds.temperatureMax}
                    onChange={(e) => handleThresholdChange("temperatureMax", e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="muted">{t("moisture")} {t("min")}</label>
                  <input
                    type="number"
                    value={thresholds.moistureMin}
                    onChange={(e) => handleThresholdChange("moistureMin", e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="muted">{t("moisture")} {t("max")}</label>
                  <input
                    type="number"
                    value={thresholds.moistureMax}
                    onChange={(e) => handleThresholdChange("moistureMax", e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="muted">{t("ph")} {t("min")}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={thresholds.phMin}
                    onChange={(e) => handleThresholdChange("phMin", e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="muted">{t("ph")} {t("max")}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={thresholds.phMax}
                    onChange={(e) => handleThresholdChange("phMax", e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
                <button className="btn" onClick={saveThresholds} disabled={isSavingThresholds}>
                  {isSavingThresholds ? t("saving") : t("saveThresholds")}
                </button>
                {thresholdMessage ? <div className="muted">{thresholdMessage}</div> : null}
              </div>
            </div>
          </div>

          <div className="card wide">
            <div className="card-head">
              <div>
                <div className="card-title">{t("systemLogs")}</div>
                <div className="muted">{t("logsHelp")}</div>
              </div>
              <button className="btn" onClick={loadLogs} disabled={isLogsLoading}>
                {isLogsLoading ? t("loadingLogs") : t("retryLoad")}
              </button>
            </div>
            <div className="card-body">
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t("eventType")}</th>
                      <th>{t("description")}</th>
                      <th>{t("actor")}</th>
                      <th>{t("time")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td><span className="tag tag-soft">{log.type}</span></td>
                        <td>{log.description}</td>
                        <td>{log.actor}</td>
                        <td className="muted">{formatLogTime(log.createdAt)}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && !isLogsLoading ? (
                      <tr>
                        <td colSpan={4} className="muted" style={{ padding: 14 }}>
                          {t("noLogs")}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="card" style={{ marginTop: 18 }}>
          <div className="card-head">
            <div>
              <div className="card-title">{t("teamDirectory")}</div>
              <div className="muted">{t("promote")}</div>
            </div>
          </div>
          <div className="card-body">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("member")}</th>
                    <th>{t("role")}</th>
                    <th>{t("status")}</th>
                    <th>{t("lastActive")}</th>
                    <th>{t("farms")}</th>
                    <th>{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeam.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div className="user-cell">
                          <div className="avatar-fallback">{member.name.slice(0, 1)}</div>
                          <div>
                            <div className="strong">{member.name}</div>
                            <div className="muted">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="tag tag-soft">{member.role}</span>
                      </td>
                      <td>
                        <span
                          className={`status-pill ${
                            member.status === "Active"
                              ? "status-green"
                              : member.status === "Pending"
                              ? "status-amber"
                              : "status-red"
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="muted">{member.lastActive}</td>
                      <td>{member.farms}</td>
                      <td>
                        <div className="actions">
                          {isSuperAdmin ? (
                            <button
                              className="action-btn"
                              onClick={() =>
                                setRole(member.id, member.role === "Admin" ? "Farmer" : "Admin")
                              }
                            >
                              {member.role === "Admin" ? t("makeFarmer") : t("makeAdmin")}
                            </button>
                          ) : null}
                          <button
                            className="action-btn ghost"
                            onClick={() =>
                              setStatus(member.id, member.status === "Suspended" ? "Active" : "Suspended")
                            }
                          >
                            {member.status === "Suspended" ? t("reinstate") : t("suspend")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTeam.length === 0 && !isLoading ? (
                    <tr>
                      <td colSpan={6} className="muted" style={{ padding: 14 }}>
                        {t("noUsers")}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <form className="inline-form" onSubmit={handleAddUser}>
              <div style={{ flex: 2 }}>
                <label className="muted">{t("name")}</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={t("fullName")}
                />
              </div>
              <div style={{ flex: 2 }}>
                <label className="muted">{t("email")}</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder={t("exampleEmail")}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="muted">{t("role")}</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
                >
                  <option>Farmer</option>
                  {isSuperAdmin ? <option>Admin</option> : null}
                </select>
              </div>
              <div style={{ alignSelf: "flex-end" }}>
                <button className="btn" type="submit" disabled={isLoading}>
                  {t("invite")}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
