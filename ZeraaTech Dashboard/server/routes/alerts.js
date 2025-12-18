import { Router } from "express";
import Alert from "../models/Alert.js";
import Farm from "../models/Farm.js";
import { attachAppUser, requireAuth } from "../middleware/auth.js";

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
    const { farmId, status, limit } = req.query;
    const parsedLimit = Math.min(Number(limit) || 50, 500);

    const query = {};
    if (status) query.status = status;

    if (farmId) {
      const ok = await canAccessFarm(req.appUser, farmId);
      if (!ok) return res.status(403).json({ message: "Forbidden" });
      query.farm = farmId;
    } else if (req.appUser.role !== "admin") {
      const farms = await Farm.find({ owner: req.appUser._id }).select("_id");
      query.farm = { $in: farms.map((f) => f._id) };
    }

    const alerts = await Alert.find(query).sort({ createdAt: -1 }).limit(parsedLimit);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: "Failed to load alerts", error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { farm: farmId, type, message } = req.body || {};
    if (!farmId || !type || !message) {
      return res.status(400).json({ message: "farm, type, and message are required" });
    }

    const ok = await canAccessFarm(req.appUser, farmId);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    const alert = await Alert.create(req.body);
    res.status(201).json(alert);
  } catch (err) {
    res.status(400).json({ message: "Failed to create alert", error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: "Alert not found" });

    const ok = await canAccessFarm(req.appUser, alert.farm);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    Object.assign(alert, req.body);
    await alert.save();
    res.json(alert);
  } catch (err) {
    res.status(400).json({ message: "Failed to update alert", error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: "Alert not found" });

    const ok = await canAccessFarm(req.appUser, alert.farm);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    await Alert.deleteOne({ _id: alert._id });
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ message: "Failed to delete alert", error: err.message });
  }
});

export default router;

