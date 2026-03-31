import { fallbackGauges, fallbackRecs, fallbackCrops } from "./data";

const API_BASE = "http://localhost:4000";

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

async function safeJson(res, errorMessage) {
  if (!res.ok) {
    let message = errorMessage;
    try {
      const data = await res.json();
      message = data?.message || data?.error || message;
    } catch (_) {}
    throw new Error(message);
  }
  return res.json();
}

function withFarmId(url, farmId) {
  if (!farmId) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}farmId=${encodeURIComponent(farmId)}`;
}

export async function fetchFarms() {
  try {
    const res = await fetch(`${API_BASE}/api/dashboard/farms`, {
      credentials: "include",
    });
    return await safeJson(res, "Failed to fetch farms");
  } catch (err) {
    console.warn("Could not fetch farms, using fallback farms:", err.message);
    return [
      { _id: "farm1", name: "Farm 1" },
      { _id: "farm2", name: "Farm 2" },
    ];
  }
}

export async function fetchGauges(farmId) {
  try {
    const dashboardUrl = withFarmId(`${API_BASE}/api/dashboard/latest`, farmId);
    const res = await fetch(dashboardUrl, { credentials: "include" });
    return await safeJson(res, "Failed to fetch gauges");
  } catch (err) {
    console.warn("Using fallback gauges:", err.message);
    return fallbackGauges;
  }
}

export async function fetchRecs(farmId) {
  try {
    const primaryUrl = withFarmId(`${API_BASE}/api/recommendations`, farmId);
    const res = await fetch(primaryUrl, { credentials: "include" });
    const data = await safeJson(res, "Failed to fetch recommendations");
    return Array.isArray(data) ? data : data?.recommendations || fallbackRecs;
  } catch (err) {
    console.warn("Using fallback recommendations:", err.message);
    return fallbackRecs;
  }
}

export async function fetchSensors(farmId) {
  try {
    const res = await fetch(withFarmId(`${API_BASE}/api/sensors`, farmId), {
      credentials: "include",
    });
    return await safeJson(res, "Failed to fetch sensor data");
  } catch (err) {
    console.warn("Could not fetch sensor data:", err.message);
    return null;
  }
}

export async function fetchCrops() {
  try {
    const res = await fetch(`${API_BASE}/api/crops`, { credentials: "include" });
    return await safeJson(res, "Failed to fetch crops");
  } catch (err) {
    console.warn("Could not fetch crops, using fallback crops:", err.message);
    return fallbackCrops;
  }
}

export async function fetchSettings() {
  try {
    const res = await fetch(`${API_BASE}/api/settings`, { credentials: "include" });
    return await safeJson(res, "Failed to fetch settings");
  } catch (err) {
    console.warn("Could not fetch settings:", err.message);
    return [];
  }
}

export async function fetchAIInsights(farmId) {
  try {
    const res = await fetch(withFarmId(`${API_BASE}/api/ai-insights`, farmId), {
      credentials: "include",
    });
    const data = await safeJson(res, "Failed to fetch AI insights");
    return {
      generatedAt: data?.generatedAt || new Date().toISOString(),
      irrigationRecommendations: data?.irrigationRecommendations || [],
      diseaseRiskScores: data?.diseaseRiskScores || [],
      prioritizedAlerts: data?.prioritizedAlerts || [],
    };
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

export async function detectDisease(imageBase64) {
  const res = await fetch(`${API_BASE}/api/disease-detect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ image: imageBase64 }),
  });
  return safeJson(res, "Disease detection failed");
}

export async function updateSetting(key, value) {
  try {
    const res = await fetch(`${API_BASE}/api/settings/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ value }),
    });
    return await safeJson(res, "Failed to update setting");
  } catch (err) {
    console.warn("Could not update setting:", err.message);
    throw err;
  }
}
