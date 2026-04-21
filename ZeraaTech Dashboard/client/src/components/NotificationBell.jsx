import React, { useState, useEffect, useRef } from "react";
import { fetchUnreadAlerts, markAlertsAsRead } from "../api";
import { io } from "socket.io-client";

export default function NotificationBell({ lang = "en" }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const loadAlerts = async () => {
    const data = await fetchUnreadAlerts();
    setUnreadCount(data.count || 0);
    setAlerts(data.latest || []);
  };

  useEffect(() => {
    loadAlerts();

    const socket = io("http://localhost:4000", { withCredentials: true });
    socket.on("new-sensor-reading", () => {
      // Just reload the alerts whenever a new reading arrives
      // The backend alertEngine will have already created the alert if there was a breach
      // We can add a slight delay to ensure DB write finishes for alerts
      setTimeout(loadAlerts, 500);
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async () => {
    const res = await markAlertsAsRead();
    if (res.success) {
      setUnreadCount(0);
      setAlerts([]);
      setIsOpen(false);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      loadAlerts();
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "Low":
        return "#4caf50"; // Green
      case "Medium":
        return "#ff9800"; // Orange
      case "High":
      case "Critical":
        return "#f44336"; // Red
      default:
        return "#9e9e9e"; // Grey
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-block", marginInlineEnd: "15px" }} ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          position: "relative",
          padding: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: "2px",
            right: "2px",
            backgroundColor: "#f44336",
            color: "white",
            borderRadius: "50%",
            width: "18px",
            height: "18px",
            fontSize: "10px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: "absolute",
          top: "40px",
          right: lang === "en" ? "0" : "auto",
          left: lang === "ar" ? "0" : "auto",
          width: "320px",
          backgroundColor: "var(--card-bg, #fff)",
          border: "1px solid var(--border-color, #e0e0e0)",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: 1000,
          overflow: "hidden",
        }}>
          <div style={{ 
            padding: "12px 16px", 
            borderBottom: "1px solid var(--border-color, #e0e0e0)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <h4 style={{ margin: 0, fontSize: "16px", color: "var(--text-color, #333)" }}>
              {lang === "ar" ? "التنبيهات" : "Alerts"}
            </h4>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAsRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "#0066cc",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                {lang === "ar" ? "تحديد الكل كمقروء" : "Mark all as read"}
              </button>
            )}
          </div>
          
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {alerts.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted, #777)", fontSize: "14px" }}>
                {lang === "ar" ? "لا توجد تنبيهات غير مقروءة" : "No unread alerts"}
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert._id} style={{ 
                  padding: "12px 16px", 
                  borderBottom: "1px solid var(--border-color, #f0f0f0)",
                  borderLeft: lang === "en" ? `4px solid ${getSeverityColor(alert.severity)}` : "none",
                  borderRight: lang === "ar" ? `4px solid ${getSeverityColor(alert.severity)}` : "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px"
                }}>
                  <div style={{ fontSize: "14px", color: "var(--text-color, #333)", fontWeight: "500" }}>
                    {alert.message}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted, #777)", display: "flex", justifyContent: "space-between" }}>
                    <span>{alert.severity}</span>
                    <span>{new Date(alert.createdAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
