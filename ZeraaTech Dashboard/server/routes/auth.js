import express from "express";
import passport from "passport";
import User from "../models/User.js";
import { hashPassword, verifyPassword } from "../utils/passwords.js";
import { attachAppUser } from "../middleware/auth.js";

const router = express.Router();

const DEFAULT_ADMIN_EMAIL = "ghareeb.hadi1@gmail.com";

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:3000/login",
  }),
  (req, res) => {
    // If login is successful, redirect to dashboard
    res.redirect("http://localhost:3000/dashboard");
  }
);

router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!normalizedEmail.includes("@")) return res.status(400).json({ message: "Invalid email" });
    if (String(password).length < 6) return res.status(400).json({ message: "Password too short" });

    const adminEmail = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase();
    const role = normalizedEmail === adminEmail ? "admin" : "farmer";

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const user = await User.create({
      email: normalizedEmail,
      passwordHash: hashPassword(String(password)),
      role,
      status: "Active",
      displayName: normalizedEmail.split("@")[0],
      lastActiveAt: new Date(),
    });

    return res.status(201).json({ id: user._id, email: user.email, role: user.role });
  } catch (err) {
    return res.status(500).json({ message: "Signup failed", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.passwordHash) return res.status(401).json({ message: "Invalid credentials" });
    if (user.status === "Suspended") return res.status(403).json({ message: "Account suspended" });

    const ok = verifyPassword(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const adminEmail = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase();
    user.role = normalizedEmail === adminEmail ? "admin" : "farmer";
    req.session.userId = user._id.toString();
    user.lastActiveAt = new Date();
    await user.save();

    return res.json({ id: user._id, email: user.email, role: user.role });
  } catch (err) {
    return res.status(500).json({ message: "Login failed", error: err.message });
  }
});

router.get("/logout", (req, res) => {
  req.logout(() => {
    const finish = () => {
      const accepts = req.get("accept") || "";
      const wantsJson = accepts.includes("application/json");
      if (wantsJson || req.xhr) {
        return res.status(204).end();
      }
      res.redirect("http://localhost:3000/login");
    };

    if (req.session) {
      req.session.destroy(() => finish());
      return;
    }

    finish();
  });
});

router.get("/current-user", (req, res) => {
  const isAuthenticated = Boolean(req.user) || Boolean(req.session?.userId);
  if (!isAuthenticated) return res.status(401).send({ message: "Not logged in" });

  return attachAppUser(req, res, () => {
    if (!req.appUser) return res.status(401).send({ message: "Not logged in" });
    if (req.appUser.status === "Suspended") {
      return res.status(403).send({ message: "Account suspended" });
    }

    const adminEmail = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase();
    const isSuperAdmin = req.appUser.email.toLowerCase() === adminEmail;

    return res.send({
      id: req.appUser._id,
      email: req.appUser.email,
      displayName: req.appUser.displayName || req.appUser.email,
      role: req.appUser.role,
      status: req.appUser.status,
      language: req.appUser.language,
      isSuperAdmin,
    });
  });
});

export default router;
