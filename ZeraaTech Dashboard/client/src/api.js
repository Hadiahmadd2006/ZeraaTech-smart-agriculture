import { fallbackGauges, fallbackRecs, fallbackCrops } from "./data";

const fallbackAiInsights = {
  generatedAt: new Date().toISOString(),
  irrigationRecommendations: [
    {
      id: "irr-fallback-1",
      farm: "Tomato field",
      crop: "Tomato",
      priority: "High",
      moistureNow: 36,
      targetMoisture: 60,
      recommendedDurationMin: 10,
      reason: "Soil moisture is below target.",
    },
  ],
  diseaseRiskScores: [
    {
      id: "risk-fallback-1",
      farm: "Potato corner",
      crop: "Potato",
      disease: "Late blight",
      score: 78,
      level: "High",
      drivers: ["Humidity above threshold", "Favorable temperature window"],
    },
  ],
  prioritizedAlerts: [
    {
      id: "alert-fallback-1",
      title: "Irrigation attention required",
      farm: "Tomato field",
      severity: "High",
      score: 90,
      reason: "Low moisture and rising daytime heat.",
      suggestedAction: "Run pump for 10 minutes.",
    },
  ],
};

export async function fetchGauges() {
  try {
    const res = await fetch("http://localhost:4000/api/gauges", { credentials: "include" });
    if (!res.ok) throw new Error("No response from API");
    return await res.json();
  } catch (err) {
    console.warn("Using fallback gauges:", err.message);
    return fallbackGauges;
  }
}

export async function fetchRecs() {
  try {
    const res = await fetch("http://localhost:4000/api/recommendations", { credentials: "include" });
    if (!res.ok) throw new Error("No response from API");
    return await res.json();
  } catch (err) {
    console.warn("Using fallback recommendations:", err.message);
    return fallbackRecs;
  }
}

export async function fetchSensors() {
  try {
    const res = await fetch("http://localhost:4000/api/sensors", { credentials: "include" });
    if (!res.ok) throw new Error("No response from API");
    return await res.json();
  } catch (err) {
    console.warn("Could not fetch sensor data:", err.message);
    return null;
  }
}

export async function fetchCrops() {
  try {
    const res = await fetch("http://localhost:4000/api/crops", { credentials: "include" });
    if (!res.ok) throw new Error("No response from API");
    return await res.json();
  } catch (err) {
    console.warn("Could not fetch crops, using fallback crops:", err.message);
    return fallbackCrops;
  }
}

export async function fetchSettings() {
  try {
    const res = await fetch("http://localhost:4000/api/settings", { credentials: "include" });
    if (!res.ok) throw new Error("No response from API");
    return await res.json();
  } catch (err) {
    console.warn("Could not fetch settings:", err.message);
    return [];
  }
}

export async function fetchAIInsights() {
  try {
    const res = await fetch("http://localhost:4000/api/ai-insights", { credentials: "include" });
    if (!res.ok) throw new Error("No response from API");
    return await res.json();
  } catch (err) {
    console.warn("Could not fetch AI insights, using fallback:", err.message);
    return fallbackAiInsights;
  }
}

const normalizeCrop = (value) => String(value || "").trim().toLowerCase();

export async function fetchCropAIInsights(cropName) {
  const normalized = normalizeCrop(cropName);
  const [recs, ai] = await Promise.all([fetchRecs(), fetchAIInsights()]);

  const recommendation =
    recs.find((r) => normalizeCrop(r.plant) === normalized) ||
    recs.find((r) => normalizeCrop(r.plant).includes(normalized));

  const irrigationRecommendations = (ai?.irrigationRecommendations || []).filter(
    (item) =>
      normalizeCrop(item.crop) === normalized || normalizeCrop(item.farm).includes(normalized)
  );

  const diseaseRiskScores = (ai?.diseaseRiskScores || []).filter(
    (item) =>
      normalizeCrop(item.crop) === normalized || normalizeCrop(item.farm).includes(normalized)
  );

  const prioritizedAlerts = (ai?.prioritizedAlerts || []).filter((item) => {
    const haystack = `${item.title || ""} ${item.reason || ""} ${item.farm || ""}`.toLowerCase();
    return haystack.includes(normalized);
  });

  return {
    cropName: recommendation?.plant || cropName,
    recommendation: recommendation || null,
    irrigationRecommendations,
    diseaseRiskScores,
    prioritizedAlerts,
    generatedAt: ai?.generatedAt || new Date().toISOString(),
  };
}

export async function updateSetting(key, value) {
  try {
    const res = await fetch(`http://localhost:4000/api/settings/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ value }),
    });
    if (!res.ok) throw new Error("No response from API");
    return await res.json();
  } catch (err) {
    console.warn("Could not update setting:", err.message);
    throw err;
  }
}
