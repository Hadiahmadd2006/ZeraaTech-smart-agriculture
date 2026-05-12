import React, { useEffect, useState, useRef } from "react";
import { getTreatmentAdvice } from "../api";

const T_TEXT = {
  en: {
    title: "Treatment Advisor",
    healthy: "Healthy",
    moderate: "Moderate Stress",
    high_stress: "High Stress",
    confidence: "Confidence",
    loading: "Analyzing treatment plan...",
    error: "Failed to get treatment advice.",
    no_data: "Waiting for sensor data...",
  },
  ar: {
    title: "مستشار العلاج",
    healthy: "صحي",
    moderate: "إجهاد متوسط",
    high_stress: "إجهاد عالي",
    confidence: "الثقة",
    loading: "جاري تحليل خطة العلاج...",
    error: "فشل في الحصول على نصيحة العلاج.",
    no_data: "في انتظار بيانات المستشعر...",
  },
};

export default function TreatmentAdvisorCard({ sensors, lang }) {
  const [adviceData, setAdviceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Use a ref to always access the latest sensors inside the interval
  const sensorsRef = useRef(sensors);
  useEffect(() => {
    sensorsRef.current = sensors;
  }, [sensors]);

  const t = (key) => T_TEXT[lang]?.[key] || T_TEXT.en[key] || key;

  const fetchAdvice = async () => {
    const currentSensors = sensorsRef.current;
    if (!currentSensors || Object.keys(currentSensors).length === 0) return;
    
    setLoading(true);
    setError("");
    try {
      const data = {
        moisture: currentSensors.moisture || 50,
        temperature: currentSensors.temperature || 25,
        humidity: currentSensors.humidity || 50,
        pH: currentSensors.ph || 6.5,
        lang: lang,
      };
      
      const res = await getTreatmentAdvice(data);
      setAdviceData(res);
    } catch (err) {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch when sensors are available
    if (sensors && Object.keys(sensors).length > 0) {
      fetchAdvice();
    }
    
    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchAdvice();
    }, 30000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, sensors]); // Re-run if language or sensors change

  const getStatusBadgeClass = (status) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("healthy") || s.includes("صحي")) return "tag tag-green";
    if (s.includes("moderate") || s.includes("متوسط")) return "tag tag-amber";
    return "tag tag-red";
  };

  const getTranslatedStatus = (status) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("healthy")) return t("healthy");
    if (s.includes("moderate")) return t("moderate");
    if (s.includes("high stress")) return t("high_stress");
    return status; // fallback
  };

  return (
    <div className="card wide">
      <div className="card-head">
        <div className="card-title" style={{ textAlign: "start", flex: 1 }}>{t("title")}</div>
      </div>
      <div className="card-body">
        {!sensors || Object.keys(sensors).length === 0 ? (
          <div className="muted">{t("no_data")}</div>
        ) : loading && !adviceData ? (
          <div className="muted">{t("loading")}</div>
        ) : error ? (
          <div style={{ color: "red", fontSize: 13 }}>{error}</div>
        ) : adviceData ? (
          <div style={{ border: "1px dashed var(--line)", borderRadius: 10, padding: 15 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <span className={getStatusBadgeClass(adviceData.status)}>
                {getTranslatedStatus(adviceData.status)}
              </span>
              <span style={{ fontSize: 12, padding: "4px 8px", borderRadius: 999, background: "var(--panel-2)", fontWeight: 600 }}>
                {t("confidence")}: {Math.round((adviceData.confidence || 0) * 100)}%
              </span>
            </div>
            <div style={{ fontSize: 14, lineHeight: "1.5" }}>
              {adviceData.advice}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
