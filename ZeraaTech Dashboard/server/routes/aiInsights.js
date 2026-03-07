import { Router } from "express";
import { attachAppUser, requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, attachAppUser);

function buildDummyInsights() {
  const now = new Date();
  const iso = now.toISOString();

  return {
    generatedAt: iso,
    irrigationRecommendations: [
      {
        id: "irr-1",
        farm: "Tomato field",
        crop: "Tomato",
        priority: "High",
        moistureNow: 34,
        targetMoisture: 60,
        recommendedDurationMin: 12,
        reason: "Soil moisture is below crop target and midday heat is increasing evapotranspiration.",
      },
      {
        id: "irr-2",
        farm: "Pepper house",
        crop: "Pepper",
        priority: "Medium",
        moistureNow: 46,
        targetMoisture: 58,
        recommendedDurationMin: 8,
        reason: "Moisture trend is falling over the last 6 hours.",
      },
      {
        id: "irr-3",
        farm: "Potato corner",
        crop: "Potato",
        priority: "Low",
        moistureNow: 55,
        targetMoisture: 58,
        recommendedDurationMin: 0,
        reason: "Current moisture is near target. Recheck in 4 hours.",
      },
    ],
    diseaseRiskScores: [
      {
        id: "risk-1",
        farm: "Potato corner",
        crop: "Potato",
        disease: "Late blight",
        score: 82,
        level: "High",
        drivers: ["High humidity > 85%", "Mild night temperature", "Leaf wetness proxy elevated"],
      },
      {
        id: "risk-2",
        farm: "Pepper house",
        crop: "Pepper",
        disease: "Powdery mildew",
        score: 57,
        level: "Medium",
        drivers: ["Humidity spikes in greenhouse", "Limited airflow windows"],
      },
      {
        id: "risk-3",
        farm: "Tomato field",
        crop: "Tomato",
        disease: "Early blight",
        score: 31,
        level: "Low",
        drivers: ["Dry canopy window", "Stable daytime temperatures"],
      },
    ],
    prioritizedAlerts: [
      {
        id: "alert-1",
        title: "Urgent irrigation needed",
        farm: "Tomato field",
        severity: "High",
        score: 95,
        reason: "Moisture critical and temperature rising.",
        suggestedAction: "Start pump in Auto mode for 12 minutes.",
      },
      {
        id: "alert-2",
        title: "High disease risk window",
        farm: "Potato corner",
        severity: "High",
        score: 88,
        reason: "Late blight model crossed intervention threshold.",
        suggestedAction: "Schedule preventive spray by evening and monitor humidity.",
      },
      {
        id: "alert-3",
        title: "Monitor greenhouse humidity",
        farm: "Pepper house",
        severity: "Medium",
        score: 64,
        reason: "Humidity pattern likely to increase mildew pressure.",
        suggestedAction: "Increase ventilation during peak humidity hours.",
      },
    ],
  };
}

router.get("/", (_req, res) => {
  res.json(buildDummyInsights());
});

export default router;
