import { Router } from "express";
import Farm from "../models/Farm.js";
import { attachAppUser, requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, attachAppUser);

router.get("/", async (req, res) => {
  try {
    const query = req.appUser.role === "admin" ? {} : { owner: req.appUser._id };
    const farms = await Farm.find(query).sort({ createdAt: -1 });
    res.json(farms);
  } catch (err) {
    res.status(500).json({ message: "Failed to load farms", error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id);
    if (!farm) return res.status(404).json({ message: "Farm not found" });

    if (req.appUser.role !== "admin" && String(farm.owner) !== String(req.appUser._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(farm);
  } catch (err) {
    res.status(400).json({ message: "Failed to load farm", error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const payload = { ...req.body };
    if (req.appUser.role !== "admin") payload.owner = req.appUser._id;
    const farm = await Farm.create(payload);
    res.status(201).json(farm);
  } catch (err) {
    res.status(400).json({ message: "Failed to create farm", error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id);
    if (!farm) return res.status(404).json({ message: "Farm not found" });

    if (req.appUser.role !== "admin" && String(farm.owner) !== String(req.appUser._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    Object.assign(farm, req.body);
    if (req.appUser.role !== "admin") farm.owner = req.appUser._id;
    await farm.save();
    res.json(farm);
  } catch (err) {
    res.status(400).json({ message: "Failed to update farm", error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id);
    if (!farm) return res.status(404).json({ message: "Farm not found" });

    if (req.appUser.role !== "admin" && String(farm.owner) !== String(req.appUser._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await Farm.deleteOne({ _id: farm._id });
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ message: "Failed to delete farm", error: err.message });
  }
});

export default router;

