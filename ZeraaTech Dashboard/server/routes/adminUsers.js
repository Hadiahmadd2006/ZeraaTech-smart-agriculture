import { Router } from "express";
import User from "../models/User.js";
import Farm from "../models/Farm.js";
import SystemLog from "../models/SystemLog.js";
import { attachAppUser, requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, attachAppUser, requireAdmin);

function isSuperAdmin(appUser) {
  const adminEmail = (process.env.ADMIN_EMAIL || "ghareeb.hadi1@gmail.com").toLowerCase();
  return (appUser?.email || "").toLowerCase() === adminEmail;
}

router.get("/", async (_req, res) => {
  try {
    const query = isSuperAdmin(_req.appUser) ? {} : { role: "farmer" };
    const users = await User.find(query).sort({ createdAt: -1 }).lean();
    const farms = await Farm.aggregate([
      { $match: { owner: { $ne: null } } },
      { $group: { _id: "$owner", count: { $sum: 1 } } },
    ]);
    const farmCounts = new Map(farms.map((f) => [String(f._id), f.count]));

    res.json(
      users.map((u) => ({
        id: u._id,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        status: u.status,
        lastActiveAt: u.lastActiveAt,
        farms: farmCounts.get(String(u._id)) || 0,
        createdAt: u.createdAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: "Failed to load users", error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { email, displayName, role, status } = req.body || {};
    if (!email) return res.status(400).json({ message: "email is required" });
    const normalizedEmail = String(email).trim().toLowerCase();

    if (role === "admin" && !isSuperAdmin(req.appUser)) {
      return res.status(403).json({ message: "Only the super admin can create admins" });
    }

    const user = await User.create({
      email: normalizedEmail,
      displayName: displayName || normalizedEmail.split("@")[0],
      role: role === "admin" ? "admin" : "farmer",
      status: status || "Pending",
      lastActiveAt: null,
    });

    await SystemLog.create({
      level: "info",
      message: "Admin created user",
      meta: { userId: user._id, email: user.email },
      user: req.appUser._id,
    });

    res.status(201).json({
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
    });
  } catch (err) {
    if (String(err.message || "").includes("duplicate key")) {
      return res.status(409).json({ message: "Email already exists" });
    }
    res.status(400).json({ message: "Failed to create user", error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });

    const requesterIsSuper = isSuperAdmin(req.appUser);

    if (!requesterIsSuper && target.role === "admin") {
      return res.status(403).json({ message: "Only the super admin can modify admins" });
    }

    const updates = {};
    if (req.body?.displayName !== undefined) updates.displayName = req.body.displayName;
    if (req.body?.status !== undefined) updates.status = req.body.status;
    if (req.body?.role !== undefined) {
      if (req.body.role === "admin" && !requesterIsSuper) {
        return res.status(403).json({ message: "Only the super admin can assign admin role" });
      }
      updates.role = req.body.role;
    }
    if (req.body?.language !== undefined) updates.language = req.body.language;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });

    await SystemLog.create({
      level: "info",
      message: "Admin updated user",
      meta: { userId: user._id, updates },
      user: req.appUser._id,
    });

    res.json({
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      language: user.language,
      lastActiveAt: user.lastActiveAt,
    });
  } catch (err) {
    res.status(400).json({ message: "Failed to update user", error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!isSuperAdmin(req.appUser) && user.role === "admin") {
      return res.status(403).json({ message: "Only the super admin can delete admins" });
    }

    await User.deleteOne({ _id: user._id });
    await Farm.updateMany({ owner: user._id }, { $unset: { owner: "" } });

    await SystemLog.create({
      level: "warn",
      message: "Admin deleted user",
      meta: { userId: user._id, email: user.email },
      user: req.appUser._id,
    });

    res.status(204).end();
  } catch (err) {
    res.status(400).json({ message: "Failed to delete user", error: err.message });
  }
});

export default router;
