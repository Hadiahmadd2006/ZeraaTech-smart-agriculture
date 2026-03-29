import { Router } from "express";
import AlertLog from "../models/AlertLog.js";
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
    const { farmId, severity, startDate, endDate, page = 1, limit = 10 } = req.query;

    const query = {};

    if (farmId) {
      const ok = await canAccessFarm(req.appUser, farmId);
      if (!ok) return res.status(403).json({ message: "Forbidden" });
      query.farm = farmId;
    }

    if (severity) query.severity = severity;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const total = await AlertLog.countDocuments(query);
    const logs = await AlertLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      logs,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load alert logs", error: err.message });
  }
});

export default router;