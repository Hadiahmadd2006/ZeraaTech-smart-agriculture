import { Router } from "express";
import Threshold from "../models/Threshold.js";
import { attachAppUser, requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, attachAppUser, requireAdmin);

/**
 * Mapping between the flat Admin UI keys and the Threshold document keys
 * used by the alert engine.
 */
const KEY_MAP = {
  temperatureMin: { key: "temperatureMin", label: "Min Temperature", group: "Temperature", unit: "°C", defaultValue: 18 },
  temperatureMax: { key: "temperatureMax", label: "Max Temperature", group: "Temperature", unit: "°C", defaultValue: 35 },
  moistureMin:    { key: "soilMoistureMin", label: "Min Soil Moisture", group: "Moisture", unit: "%", defaultValue: 40 },
  moistureMax:    { key: "soilMoistureMax", label: "Max Soil Moisture", group: "Moisture", unit: "%", defaultValue: 80 },
  phMin:          { key: "phMin", label: "Min pH", group: "pH", unit: "pH", defaultValue: 5.5 },
  phMax:          { key: "phMax", label: "Max pH", group: "pH", unit: "pH", defaultValue: 7.5 },
};

// Reverse map: DB key → admin UI key
const REVERSE_MAP = Object.fromEntries(
  Object.entries(KEY_MAP).map(([adminKey, cfg]) => [cfg.key, adminKey])
);

async function ensureAllThresholds() {
  for (const [, cfg] of Object.entries(KEY_MAP)) {
    const exists = await Threshold.findOne({ key: cfg.key });
    if (!exists) {
      await Threshold.create({
        key: cfg.key,
        label: cfg.label,
        group: cfg.group,
        unit: cfg.unit,
        value: cfg.defaultValue,
      });
    }
  }
}

/**
 * GET /api/admin/thresholds
 * Returns a flat object: { temperatureMin, temperatureMax, moistureMin, ... }
 */
router.get("/", async (_req, res) => {
  try {
    await ensureAllThresholds();

    const dbKeys = Object.values(KEY_MAP).map((c) => c.key);
    const docs = await Threshold.find({ key: { $in: dbKeys } }).lean();

    const result = {};
    for (const doc of docs) {
      const adminKey = REVERSE_MAP[doc.key];
      if (adminKey) result[adminKey] = doc.value;
    }

    // Fill any missing keys with defaults
    for (const [adminKey, cfg] of Object.entries(KEY_MAP)) {
      if (result[adminKey] === undefined) result[adminKey] = cfg.defaultValue;
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to load thresholds", error: err.message });
  }
});

/**
 * PUT /api/admin/thresholds
 * Accepts a flat object and upserts each threshold document.
 * Body: { temperatureMin, temperatureMax, moistureMin, moistureMax, phMin, phMax }
 */
router.put("/", async (req, res) => {
  try {
    const body = req.body || {};
    const updates = [];

    for (const [adminKey, cfg] of Object.entries(KEY_MAP)) {
      const raw = body[adminKey];
      if (raw === undefined || raw === null || raw === "") continue;

      const value = Number(raw);
      if (Number.isNaN(value)) continue;

      updates.push(
        Threshold.findOneAndUpdate(
          { key: cfg.key },
          {
            $set: {
              key: cfg.key,
              label: cfg.label,
              group: cfg.group,
              unit: cfg.unit,
              value,
              updatedBy: req.appUser._id,
            },
          },
          { upsert: true, new: true }
        )
      );
    }

    await Promise.all(updates);

    // Return updated flat object
    const dbKeys = Object.values(KEY_MAP).map((c) => c.key);
    const docs = await Threshold.find({ key: { $in: dbKeys } }).lean();
    const result = {};
    for (const doc of docs) {
      const adminKey = REVERSE_MAP[doc.key];
      if (adminKey) result[adminKey] = doc.value;
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to save thresholds", error: err.message });
  }
});

export default router;
