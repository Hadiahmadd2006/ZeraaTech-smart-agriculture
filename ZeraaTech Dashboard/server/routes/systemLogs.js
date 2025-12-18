import { Router } from "express";
import SystemLog from "../models/SystemLog.js";
import { attachAppUser, requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, attachAppUser, requireAdmin);

router.get("/", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const logs = await SystemLog.find().sort({ createdAt: -1 }).limit(limit);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Failed to load logs", error: err.message });
  }
});

export default router;

