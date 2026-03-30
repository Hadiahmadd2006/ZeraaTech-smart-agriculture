import { Router } from "express";
import Farm from "../models/Farm.js";
import SensorReading from "../models/SensorReading.js";
import { attachAppUser, requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, attachAppUser);

/**
 * GET /api/dashboard/farms
 * Returns the list of farms the current user has access to.
 * Admins see all farms; farmers see only their own.
 */
router.get("/farms", async (req, res) => {
  try {
    const query = req.appUser.role === "admin" ? {} : { owner: req.appUser._id };
    const farms = await Farm.find(query).sort({ createdAt: -1 }).select("_id name title location");
    res.json(farms);
  } catch (err) {
    res.status(500).json({ message: "Failed to load farms", error: err.message });
  }
});

/**
 * GET /api/dashboard/latest?farmId=<id>
 * Returns the most recent SensorReading for the given farm,
 * plus the last 24 hours of readings for the trend chart.
 * If no farmId is provided returns the most recent reading across
 * all farms the user owns.
 */
router.get("/latest", async (req, res) => {
  try {
    const { farmId } = req.query;

    // Build farm access query
    let farmIds;
    if (farmId) {
      if (req.appUser.role !== "admin") {
        const farm = await Farm.findOne({ _id: farmId, owner: req.appUser._id }).select("_id");
        if (!farm) return res.status(403).json({ message: "Forbidden" });
      }
      farmIds = [farmId];
    } else if (req.appUser.role === "admin") {
      const allFarms = await Farm.find().select("_id");
      farmIds = allFarms.map((f) => f._id);
    } else {
      const userFarms = await Farm.find({ owner: req.appUser._id }).select("_id");
      farmIds = userFarms.map((f) => f._id);
    }

    if (!farmIds || farmIds.length === 0) {
      return res.json({ latest: null, trend: [] });
    }

    // Latest single reading
    const latest = await SensorReading.findOne({ farm: { $in: farmIds } })
      .sort({ recordedAt: -1 })
      .lean();

    // Last 24 hours of readings for trend chart (max 100 points)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const trend = await SensorReading.find({
      farm: { $in: farmIds },
      recordedAt: { $gte: since },
    })
      .sort({ recordedAt: 1 })
      .limit(100)
      .lean();

    res.json({ latest: latest || null, trend });
  } catch (err) {
    res.status(500).json({ message: "Failed to load dashboard data", error: err.message });
  }
});

export default router;
