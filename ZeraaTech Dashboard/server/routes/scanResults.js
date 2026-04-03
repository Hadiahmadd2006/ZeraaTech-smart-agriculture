import { Router } from "express";
import ScanResult from "../models/ScanResult.js";
import { attachAppUser, requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, attachAppUser);

// POST /api/scan-results — save a new scan
router.post("/", async (req, res) => {
  const { label, confidence, treatment_en, treatment_ar, top3, imageThumbnail, mock } = req.body;

  if (!label) return res.status(400).json({ message: "label is required" });

  try {
    const scan = await ScanResult.create({
      user: req.appUser._id,
      label,
      confidence,
      treatment_en,
      treatment_ar,
      top3,
      imageThumbnail,
      mock: Boolean(mock),
    });
    return res.status(201).json(scan);
  } catch (err) {
    return res.status(500).json({ message: "Failed to save scan", error: err.message });
  }
});

// GET /api/scan-results — list scans for the logged-in user (latest 20)
router.get("/", async (req, res) => {
  try {
    const filter = req.appUser.role === "admin" ? {} : { user: req.appUser._id };
    const scans = await ScanResult.find(filter).sort({ scannedAt: -1 }).limit(20).lean();
    return res.json(scans);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch scans", error: err.message });
  }
});

export default router;
