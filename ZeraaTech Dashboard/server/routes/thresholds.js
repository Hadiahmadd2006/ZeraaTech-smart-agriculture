import { Router } from "express";
import Threshold from "../models/Threshold.js";
import { attachAppUser, requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

const SEED_THRESHOLDS = [
  { key: "soilMoistureMin",  label: "Min Soil Moisture %",  group: "Irrigation",   unit: "%",   min: 0,  max: 100, value: 40 },
  { key: "soilMoistureMax",  label: "Max Soil Moisture %",  group: "Irrigation",   unit: "%",   min: 0,  max: 100, value: 75 },
  { key: "temperatureMin",   label: "Min Temperature",       group: "Temperature",  unit: "°C",  min: -10, max: 60, value: 18 },
  { key: "temperatureMax",   label: "Max Temperature",       group: "Temperature",  unit: "°C",  min: -10, max: 60, value: 35 },
  { key: "humidityMin",      label: "Min Humidity %",        group: "Humidity",     unit: "%",   min: 0,  max: 100, value: 30 },
  { key: "humidityMax",      label: "Max Humidity %",        group: "Humidity",     unit: "%",   min: 0,  max: 100, value: 85 },
  { key: "phMin",            label: "Min pH",                group: "pH",           unit: "pH",  min: 0,  max: 14,  value: 5.5 },
  { key: "phMax",            label: "Max pH",                group: "pH",           unit: "pH",  min: 0,  max: 14,  value: 7.5 },
  { key: "lightMin",         label: "Min Light (lux)",       group: "Light",        unit: "lux", min: 0,  max: null, value: 1000 },
  { key: "lightMax",         label: "Max Light (lux)",       group: "Light",        unit: "lux", min: 0,  max: null, value: 80000 },
];

async function ensureSeedData() {
  for (const seed of SEED_THRESHOLDS) {
    const exists = await Threshold.findOne({ key: seed.key });
    if (!exists) {
      await Threshold.create(seed);
    }
  }
}

router.use(requireAuth, attachAppUser);

router.get("/", async (_req, res) => {
  try {
    await ensureSeedData();
    const thresholds = await Threshold.find().sort({ group: 1, key: 1 });
    res.json(thresholds);
  } catch (err) {
    res.status(500).json({ message: "Failed to load thresholds", error: err.message });
  }
});

router.put("/:key", requireAdmin, async (req, res) => {
  const { key } = req.params;
  const { value, min, max, unit, label, group } = req.body || {};

  try {
    const updated = await Threshold.findOneAndUpdate(
      { key },
      { value, min, max, unit, label, group, updatedBy: req.appUser._id },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Threshold not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update threshold", error: err.message });
  }
});

export default router;

