import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const ADMIN_EMAIL = "ghareeb.hadi1@gmail.com";

const DEFAULT_TEAM = [
  { id: 1, name: "Laila Hassan", email: "laila@zeraa.io", role: "Admin", status: "Active", lastActive: "2h ago", farms: 5 },
  { id: 2, name: "Karim Mansour", email: "karim@zeraa.io", role: "Editor", status: "Active", lastActive: "12m ago", farms: 3 },
  { id: 3, name: "Noor Saeed", email: "noor@zeraa.io", role: "Viewer", status: "Pending", lastActive: "Invite sent", farms: 0 },
  { id: 4, name: "Sami Abdel", email: "sami@zeraa.io", role: "Editor", status: "Suspended", lastActive: "1d ago", farms: 2 },
];

const extractEmail = (u) =>
  u?.email || u?.emails?.[0]?.value || u?._json?.email || "";

export default function Admin() {
  const [team, setTeam] = useState(DEFAULT_TEAM);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Viewer" });
  const location = useLocation();

  const adminEmail = ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    fetch("http://localhost:4000/auth/current-user", { credentials: "include" })
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

  useEffect(() => {
    if (!user) return;
    if (userEmail && userEmail !== adminEmail) {
      window.location.href = "/dashboard";
    }
  }, [user, userEmail, adminEmail]);

  const isAdmin = userEmail === adminEmail;

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

  const setRole = (id, role) => {
    setTeam((prev) => prev.map((member) => (member.id === id ? { ...member, role } : member)));
  };

  const setStatus = (id, status) => {
    setTeam((prev) => prev.map((member) => (member.id === id ? { ...member, status } : member)));
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim()) return;
    const freshUser = {
      id: Date.now(),
      ...newUser,
      status: "Pending",
      lastActive: "Invite pending",
      farms: 0,
    };
    setTeam((prev) => [freshUser, ...prev]);
    setNewUser({ name: "", email: "", role: "Viewer" });
  };

  const renderMenuLink = (to, label) => (
    <Link to={to} className={location.pathname === to ? "active" : ""}>
      {label}
    </Link>
  );

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
          {renderMenuLink("/dashboard", "Dashboard")}
          {renderMenuLink("/farms", "Crops")}
          {renderMenuLink("/settings", "Settings")}
          {isAdmin && renderMenuLink("/admin", "Admin")}
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
            {lang === "ar" ? "Language: Arabic" : "Language: English"}
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="top">
          <div>
            <h2 style={{ margin: 0 }}>Admin</h2>
            <div className="muted">Manage access, roles, and invitations.</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              className="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or role"
            />
            <button className="btn" onClick={() => setTeam(DEFAULT_TEAM)}>
              Reset list
            </button>
          </div>
        </div>

        <section className="cards">
          <div className="card">
            <div className="card-head">
              <div className="card-title">Active users</div>
              <span className="tag tag-green">{stats.active}</span>
            </div>
            <div className="card-body">
              <div className="stat-value">{stats.active} on board</div>
              <div className="muted">People with access today.</div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title">Admins</div>
              <span className="tag tag-blue">{stats.admins}</span>
            </div>
            <div className="card-body">
              <div className="stat-value">{stats.admins} with full control</div>
              <div className="muted">Limit this group to trusted staff.</div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title">Invites</div>
              <span className="tag tag-amber">{stats.pending}</span>
            </div>
            <div className="card-body">
              <div className="stat-value">{stats.pending} pending</div>
              <div className="muted">Send reminders or revoke.</div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title">Suspended</div>
              <span className="tag tag-red">{stats.suspended}</span>
            </div>
            <div className="card-body">
              <div className="stat-value">{stats.suspended} blocked</div>
              <div className="muted">Review and reinstate if needed.</div>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Team directory</div>
              <div className="muted">Promote, suspend, or invite teammates.</div>
            </div>
          </div>
          <div className="card-body">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last active</th>
                    <th>Farms</th>
                    <th>Actions</th>
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
                          <button
                            className="action-btn"
                            onClick={() =>
                              setRole(member.id, member.role === "Admin" ? "Editor" : "Admin")
                            }
                          >
                            {member.role === "Admin" ? "Make editor" : "Make admin"}
                          </button>
                          <button
                            className="action-btn ghost"
                            onClick={() =>
                              setStatus(
                                member.id,
                                member.status === "Suspended" ? "Active" : "Suspended"
                              )
                            }
                          >
                            {member.status === "Suspended" ? "Reinstate" : "Suspend"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <form className="inline-form" onSubmit={handleAddUser}>
              <div style={{ flex: 2 }}>
                <label className="muted">Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Full name"
                />
              </div>
              <div style={{ flex: 2 }}>
                <label className="muted">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="user@zeraa.io"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="muted">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
                >
                  <option>Viewer</option>
                  <option>Editor</option>
                  <option>Admin</option>
                </select>
              </div>
              <div style={{ alignSelf: "flex-end" }}>
                <button className="btn" type="submit">
                  Invite
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
