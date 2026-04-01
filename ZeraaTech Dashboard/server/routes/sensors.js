import { Router } from "express";
import SensorReading from "../models/SensorReading.js";
import Farm from "../models/Farm.js";
import IngestionLog from "../models/IngestionLog.js";
import { attachAppUser, requireAuth } from "../middleware/auth.js";
import { checkThresholdsAndCreateAlerts } from "../services/alertEngine.js";
import { validateSensorPayload } from "../utils/sensorValidation.js";

const router = Router();

router.use(requireAuth, attachAppUser);

async function canAccessFarm(appUser, farmId) {
  if (appUser.role === "admin") return true;
  const farm = await Farm.findById(farmId).select("_id owner");
  if (!farm) return false;
  return String(farm.owner) === String(appUser._id);
}

router.get("/", async (req, res) => {
  try {
    const { farmId, limit } = req.query;
    const parsedLimit = Math.min(Number(limit) || 50, 500);

    const query = {};
    if (farmId) {
      const ok = await canAccessFarm(req.appUser, farmId);
      if (!ok) return res.status(403).json({ message: "Forbidden" });
      query.farm = farmId;
    } else if (req.appUser.role !== "admin") {
      const farms = await Farm.find({ owner: req.appUser._id }).select("_id");
      query.farm = { $in: farms.map((f) => f._id) };
    }

    const readings = await SensorReading.find(query)
      .sort({ recordedAt: -1 })
      .limit(parsedLimit);
    res.json(readings);
  } catch (err) {
    res.status(500).json({ message: "Failed to load sensor readings", error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { farm: farmId } = req.body || {};
    if (!farmId) return res.status(400).json({ message: "farm is required" });

    const ok = await canAccessFarm(req.appUser, farmId);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    const reading = await SensorReading.create(req.body);
    checkThresholdsAndCreateAlerts(reading).catch((err) =>
      console.error("[AlertEngine] Error:", err.message)
    );
    res.status(201).json(reading);
  } catch (err) {
    res.status(400).json({ message: "Failed to create sensor reading", error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const reading = await SensorReading.findById(req.params.id);
    if (!reading) return res.status(404).json({ message: "Sensor reading not found" });

    const ok = await canAccessFarm(req.appUser, reading.farm);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    await SensorReading.deleteOne({ _id: reading._id });
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ message: "Failed to delete sensor reading", error: err.message });
  }
});

// ── IoT device ingestion endpoint ─────────────────────────────────────────────
// Called by the ESP32 with header: x-api-key: <IOT_API_KEY>
// No session auth required — uses API key instead
router.post("/ingest", async (req, res) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== process.env.IOT_API_KEY) {
    return res.status(401).json({ message: "Invalid or missing API key" });
  }

  const payload = req.body || {};

  const log = await IngestionLog.create({
    deviceId: payload.deviceId,
    payload,
    status: "received",
    ipAddress: req.ip,
  }).catch(() => null);

  const validation = validateSensorPayload(payload);
  if (!validation.isValid) {
    if (log) await IngestionLog.findByIdAndUpdate(log._id, {
      status: "rejected",
      errorMessage: validation.errors.join(", "),
    });
    return res.status(400).json({ message: "Invalid sensor payload", errors: validation.errors });
  }

  try {
    const deviceTimestamp = payload.timestamp ? new Date(payload.timestamp) : null;
    const recordedAt =
      deviceTimestamp && !Number.isNaN(deviceTimestamp.getTime())
        ? deviceTimestamp
        : new Date();

    const reading = await SensorReading.create({
      farm: payload.farm,
      deviceId: payload.deviceId,
      moisture: payload.moisture,
      temperature: payload.temperature,
      humidity: payload.humidity,
      light: payload.light,
      ph: payload.ph,
      rainfall: payload.rainfall,
      source: "iot",
      recordedAt,
      deviceTimestamp,
      ingestionMeta: { rawTimestamp: payload.timestamp },
    });

    if (log) await IngestionLog.findByIdAndUpdate(log._id, { status: "saved" });

    checkThresholdsAndCreateAlerts(reading).catch((err) =>
      console.error("[AlertEngine] IoT ingest error:", err.message)
    );

    res.status(201).json({ message: "Sensor payload ingested successfully", reading });
  } catch (err) {
    if (log) await IngestionLog.findByIdAndUpdate(log._id, {
      status: "rejected",
      errorMessage: err.message,
    });
    res.status(500).json({ message: "Failed to ingest sensor payload", error: err.message });
  }
});

export default router;

