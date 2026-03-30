import { Router } from "express";
import Farm from "../models/Farm.js";
import SensorReading from "../models/SensorReading.js";
import { attachAppUser, requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, attachAppUser);

const FLASK_URL = process.env.ML_SERVICE_URL || "http://localhost:5000";
const FLASK_TIMEOUT_MS = 4000;

// Simple in-memory cache: { key -> { data, expiresAt } }
const cache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

function fromCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data;
}
function toCache(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ── Flask call with abort-based timeout ───────────────────────────────────────
async function callFlaskCropPredict(sensorData) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FLASK_TIMEOUT_MS);
  try {
    const res = await fetch(`${FLASK_URL}/predict-crop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sensorData),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Flask returned HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// ── Derive irrigation recommendations from sensor data ────────────────────────
function buildIrrigationRecommendations(farm, cropName, sensor) {
  const moisture = sensor?.moisture ?? null;
  const TARGET_MOISTURE = 60;

  let priority = "Low";
  let durationMin = 0;
  let reason = "Soil moisture is within an acceptable range.";

  if (moisture !== null) {
    const deficit = TARGET_MOISTURE - moisture;
    if (deficit > 20) {
      priority = "High";
      durationMin = Math.round(deficit / 3);
      reason = `Soil moisture is critically low at ${moisture.toFixed(1)}% — well below the ${TARGET_MOISTURE}% target.`;
    } else if (deficit > 8) {
      priority = "Medium";
      durationMin = Math.round(deficit / 4);
      reason = `Soil moisture (${moisture.toFixed(1)}%) is trending below the ${TARGET_MOISTURE}% target.`;
    } else if (deficit > 0) {
      priority = "Low";
      reason = `Moisture is slightly below target (${moisture.toFixed(1)}%). Monitor and recheck in 4 hours.`;
    } else {
      reason = `Moisture is at ${moisture.toFixed(1)}% — meeting or exceeding the ${TARGET_MOISTURE}% target.`;
    }
  }

  return [
    {
      id: `irr-${farm._id}`,
      farm: farm.name || "Farm",
      crop: cropName,
      priority,
      moistureNow: moisture !== null ? Math.round(moisture) : null,
      targetMoisture: TARGET_MOISTURE,
      recommendedDurationMin: durationMin,
      reason,
    },
  ];
}

// ── Derive disease risk scores from humidity and temperature ──────────────────
function buildDiseaseRiskScores(farm, cropName, sensor) {
  const humidity = sensor?.humidity ?? null;
  const temp = sensor?.temperature ?? null;
  const risks = [];

  if (humidity !== null && temp !== null) {
    // High humidity + mild temperature → fungal risk
    if (humidity > 75 && temp > 15 && temp < 28) {
      const score = Math.min(100, Math.round(((humidity - 75) / 25) * 60 + 40));
      const level = score >= 70 ? "High" : score >= 50 ? "Medium" : "Low";
      risks.push({
        id: `risk-fungal-${farm._id}`,
        farm: farm.name || "Farm",
        crop: cropName,
        disease: "Fungal infection (general)",
        score,
        level,
        drivers: [
          `Humidity at ${humidity.toFixed(1)}% (threshold: 75%)`,
          `Temperature ${temp.toFixed(1)}°C is favourable for spore germination`,
        ],
      });
    }

    // Very high humidity → powdery mildew risk
    if (humidity > 85) {
      const score = Math.min(100, Math.round(((humidity - 85) / 15) * 50 + 50));
      const level = score >= 70 ? "High" : "Medium";
      risks.push({
        id: `risk-mildew-${farm._id}`,
        farm: farm.name || "Farm",
        crop: cropName,
        disease: "Powdery mildew",
        score,
        level,
        drivers: [
          `Very high humidity: ${humidity.toFixed(1)}%`,
          "Reduced airflow conditions may accelerate spread",
        ],
      });
    }
  }

  if (risks.length === 0) {
    risks.push({
      id: `risk-low-${farm._id}`,
      farm: farm.name || "Farm",
      crop: cropName,
      disease: "No significant risk detected",
      score: 10,
      level: "Low",
      drivers: ["Current sensor conditions are within safe range"],
    });
  }

  return risks;
}

// ── Build prioritised alert list from irrigation + disease signals ─────────────
function buildPrioritizedAlerts(farm, irrigationRecs, diseaseRisks) {
  const alerts = [];

  for (const rec of irrigationRecs) {
    if (rec.priority === "High" || rec.priority === "Medium") {
      alerts.push({
        id: `alert-irr-${farm._id}`,
        title: rec.priority === "High" ? "Urgent irrigation required" : "Irrigation recommended",
        farm: farm.name || "Farm",
        severity: rec.priority,
        score: rec.priority === "High" ? 90 : 65,
        reason: rec.reason,
        suggestedAction: rec.recommendedDurationMin > 0
          ? `Run irrigation for ${rec.recommendedDurationMin} minutes.`
          : "Monitor moisture and re-evaluate in 2 hours.",
      });
    }
  }

  for (const risk of diseaseRisks) {
    if (risk.level === "High" || risk.level === "Medium") {
      alerts.push({
        id: `alert-disease-${farm._id}-${risk.disease.replace(/\s+/g, "-")}`,
        title: `${risk.disease} risk elevated`,
        farm: farm.name || "Farm",
        severity: risk.level,
        score: risk.score,
        reason: risk.drivers.join("; "),
        suggestedAction:
          "Inspect the crop canopy and consider applying a preventive fungicide.",
      });
    }
  }

  return alerts.sort((a, b) => b.score - a.score);
}

// ── GET /api/ai-insights?farmId=<id> ──────────────────────────────────────────
router.get("/", async (req, res) => {
  const { farmId } = req.query;
  const cacheKey = `ai:${farmId || "all"}:${req.appUser._id}`;

  const cached = fromCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    // 1. Resolve the target farm
    let farm = null;
    if (farmId) {
      const q = req.appUser.role === "admin"
        ? { _id: farmId }
        : { _id: farmId, owner: req.appUser._id };
      farm = await Farm.findOne(q);
      if (!farm) return res.status(404).json({ message: "Farm not found" });
    } else {
      const q = req.appUser.role === "admin" ? {} : { owner: req.appUser._id };
      farm = await Farm.findOne(q).sort({ createdAt: -1 });
    }

    const targetFarm = farm || { _id: "default", name: "Your Farm" };

    // 2. Latest sensor reading for this farm
    const farmFilter = farm ? { farm: farm._id } : {};
    const sensor = await SensorReading.findOne(farmFilter).sort({ recordedAt: -1 }).lean();

    const sensorPayload = {
      moisture:    sensor?.moisture    ?? null,
      temperature: sensor?.temperature ?? null,
      humidity:    sensor?.humidity    ?? null,
      ph:          sensor?.ph          ?? null,
    };

    // 3. Ask Flask which crop best fits current conditions
    let cropName = "Tomato"; // safe default
    try {
      const flaskResult = await callFlaskCropPredict(sensorPayload);
      cropName = flaskResult?.recommended_crop || cropName;
    } catch (flaskErr) {
      console.warn("[ai-insights] Flask unavailable:", flaskErr.message);
      // Heuristic fallback so we still return useful data
      if (sensorPayload.moisture !== null && sensorPayload.moisture > 70) cropName = "Rice";
      else if (sensorPayload.temperature !== null && sensorPayload.temperature < 18) cropName = "Wheat";
    }

    // 4. Derive actionable insights from real sensor values
    const irrigationRecs  = buildIrrigationRecommendations(targetFarm, cropName, sensor);
    const diseaseRisks    = buildDiseaseRiskScores(targetFarm, cropName, sensor);
    const prioritizedAlerts = buildPrioritizedAlerts(targetFarm, irrigationRecs, diseaseRisks);

    const payload = {
      generatedAt: new Date().toISOString(),
      recommendedCrop: cropName,
      irrigationRecommendations: irrigationRecs,
      diseaseRiskScores: diseaseRisks,
      prioritizedAlerts,
      sensorSnapshot: sensor
        ? {
            moisture:    sensor.moisture,
            temperature: sensor.temperature,
            humidity:    sensor.humidity,
            ph:          sensor.ph,
            recordedAt:  sensor.recordedAt,
          }
        : null,
    };

    toCache(cacheKey, payload);
    return res.json(payload);
  } catch (err) {
    console.error("[ai-insights] Error:", err.message);
    return res.status(500).json({ message: "Failed to generate AI insights", error: err.message });
  }
});

export default router;
