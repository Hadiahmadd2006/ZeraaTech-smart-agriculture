import { Router } from "express";
import Setting from "../models/Setting.js";

const router = Router();

async function ensureSeedData() {
  const count = await Setting.countDocuments();
  if (count > 0) return;

  const seed = [
    {
      key: "irrigationMode",
      label: "Irrigation Mode",
      value: "auto",
      group: "Irrigation",
    },
    {
      key: "soilMoistureMin",
      label: "Min Soil Moisture %",
      value: 40,
      group: "Irrigation",
    },
    {
      key: "soilMoistureMax",
      label: "Max Soil Moisture %",
      value: 75,
      group: "Irrigation",
    },
    {
      key: "alertChannel",
      label: "Alert Channel",
      value: "email",
      group: "Notifications",
    },
    {
      key: "language",
      label: "Language",
      value: "en",
      group: "General",
    },
  ];

  await Setting.insertMany(seed);
}

router.get("/", async (_req, res) => {
  try {
    await ensureSeedData();
    const settings = await Setting.find().sort({ group: 1, key: 1 });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Failed to load settings", error: err.message });
  }
});

router.put("/:key", async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  try {
    const updated = await Setting.findOneAndUpdate(
      { key },
      { value },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Setting not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update setting", error: err.message });
  }
});

export default router;

