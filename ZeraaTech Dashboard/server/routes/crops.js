import { Router } from "express";
import Farm from "../models/Farm.js";

const router = Router();

async function ensureSeedData() {
  const count = await Farm.countDocuments();
  if (count > 0) return;

  const seed = [
    {
      name: "Tomato field",
      location: "North side",
      crop: "Tomato",
      areaHectares: 2.5,
      moisture: 68,
      status: "Happy",
      pumpStatus: "Auto",
    },
    {
      name: "Pepper house",
      location: "Greenhouse A",
      crop: "Pepper",
      areaHectares: 1.2,
      moisture: 54,
      status: "Needs shade",
      pumpStatus: "Manual",
    },
    {
      name: "Potato corner",
      location: "South field",
      crop: "Potato",
      areaHectares: 3.1,
      moisture: 42,
      status: "Water soon",
      pumpStatus: "Scheduled",
    },
  ];

  await Farm.insertMany(seed);
}

router.get("/", async (_req, res) => {
  try {
    await ensureSeedData();
    const crops = await Farm.find().sort({ createdAt: 1 });
    res.json(crops);
  } catch (err) {
    res.status(500).json({ message: "Failed to load crops", error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const crop = await Farm.findById(req.params.id);
    if (!crop) return res.status(404).json({ message: "Crop not found" });
    res.json(crop);
  } catch (err) {
    res.status(400).json({ message: "Failed to load crop", error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const crop = await Farm.create(req.body);
    res.status(201).json(crop);
  } catch (err) {
    res.status(400).json({ message: "Failed to create crop", error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updated = await Farm.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Crop not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update crop", error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const existing = await Farm.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Crop not found" });
    await Farm.deleteOne({ _id: existing._id });
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ message: "Failed to delete crop", error: err.message });
  }
});

export default router;
