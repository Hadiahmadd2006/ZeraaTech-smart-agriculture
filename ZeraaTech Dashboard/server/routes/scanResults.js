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
    const baseFilter = req.appUser.role === "admin" ? {} : { user: req.appUser._id };
    const filter = {
      ...baseFilter,
      label: { $exists: true, $ne: null, $ne: "" },
      confidence: { $exists: true, $ne: null, $type: "number" },
    };
    const scans = await ScanResult.find(filter).sort({ scannedAt: -1 }).limit(20).lean();
    return res.json(scans);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch scans", error: err.message });
  }
});

// DELETE /api/scan-results — clear user's history (admin clears all)
router.delete("/", async (req, res) => {
  try {
    const filter = req.appUser.role === "admin" ? {} : { user: req.appUser._id };
    const result = await ScanResult.deleteMany(filter);
    return res.json({ deleted: result.deletedCount });
  } catch (err) {
    return res.status(500).json({ message: "Failed to clear scans", error: err.message });
  }
});

// DELETE /api/scan-results/corrupt — purge entries missing label/confidence
router.delete("/corrupt", async (req, res) => {
  try {
    const baseFilter = req.appUser.role === "admin" ? {} : { user: req.appUser._id };
    const result = await ScanResult.deleteMany({
      ...baseFilter,
      $or: [
        { label: { $in: [null, ""] } },
        { label: { $exists: false } },
        { confidence: { $exists: false } },
        { confidence: null },
        { confidence: { $not: { $type: "number" } } },
      ],
    });
    return res.json({ deleted: result.deletedCount });
  } catch (err) {
    return res.status(500).json({ message: "Failed to purge corrupt scans", error: err.message });
  }
});

export default router;
