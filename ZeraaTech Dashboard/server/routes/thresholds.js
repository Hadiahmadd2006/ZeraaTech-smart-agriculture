import { Router } from "express";
import Threshold from "../models/Threshold.js";
import { attachAppUser, requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

async function ensureSeedData() {
  const count = await Threshold.countDocuments();
  if (count > 0) return;

  await Threshold.insertMany([
    {
      key: "soilMoistureMin",
      label: "Min Soil Moisture %",
      group: "Irrigation",
      unit: "%",
      min: 0,
      max: 100,
      value: 40,
    },
    {
      key: "soilMoistureMax",
      label: "Max Soil Moisture %",
      group: "Irrigation",
      unit: "%",
      min: 0,
      max: 100,
      value: 75,
    },
  ]);
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

