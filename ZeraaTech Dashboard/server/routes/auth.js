import express from "express";
import passport from "passport";
import User from "../models/User.js";
import { hashPassword, verifyPassword } from "../utils/passwords.js";
import { attachAppUser } from "../middleware/auth.js";
import { sendSms } from "../utils/sms.js";

const router = express.Router();

const DEFAULT_ADMIN_EMAIL = "ghareeb.hadi1@gmail.com";

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function findUserByIdentifier(identifier) {
  const normalized = String(identifier).trim().toLowerCase();
  return User.findOne({
    $or: [{ email: normalized }, { phone: normalized }],
  });
}

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
    res.redirect("http://localhost:3000/dashboard");
  }
);

router.post("/signup", async (req, res) => {
  try {
    const { email, password, phone, displayName } = req.body || {};
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
      displayName: displayName?.trim() || normalizedEmail.split("@")[0],
      phone: phone?.trim() || null,
      lastActiveAt: new Date(),
    });

    return res.status(201).json({ id: user._id, email: user.email, role: user.role });
  } catch (err) {
    return res.status(500).json({ message: "Signup failed", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) return res.status(400).json({ message: "Identifier and password required" });

    const user = await findUserByIdentifier(identifier);
    if (!user || !user.passwordHash) return res.status(401).json({ message: "Invalid credentials" });
    if (user.status === "Suspended") return res.status(403).json({ message: "Account suspended" });

    const ok = verifyPassword(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const adminEmail = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase();
    user.role = user.email.toLowerCase() === adminEmail ? "admin" : "farmer";

    // If user has no phone, skip OTP and log in directly
    if (!user.phone) {
      user.lastActiveAt = new Date();
      await user.save();
      return req.login({ appUserId: user._id.toString(), email: user.email }, (err) => {
        if (err) return res.status(500).json({ message: "Login session failed", error: err.message });
        req.session.userId = user._id.toString();
        return res.json({ id: user._id, email: user.email, role: user.role });
      });
    }

    // Generate and send OTP
    const otp = generateOtp();
    user.otpCode = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    const message = `Your ZeraaTech login code is: ${otp}. It expires in 10 minutes.\nرمز دخولك إلى ZeraaTech هو: ${otp}. ينتهي خلال 10 دقائق.`;

    const smsResult = await sendSms(user.phone, message);
    if (!smsResult.success) {
      console.warn("[OTP] SMS failed:", smsResult.error, "| OTP for dev:", otp);
    }

    return res.json({
      status: "otp_required",
      message: "OTP sent to your registered phone number",
      phone: user.phone.replace(/\d(?=\d{4})/g, "*"), // mask all but last 4 digits
    });
  } catch (err) {
    return res.status(500).json({ message: "Login failed", error: err.message });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { identifier, otp } = req.body || {};
    if (!identifier || !otp) return res.status(400).json({ message: "Identifier and OTP required" });

    const user = await findUserByIdentifier(identifier);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (user.status === "Suspended") return res.status(403).json({ message: "Account suspended" });

    if (!user.otpCode || !user.otpExpiresAt) {
      return res.status(400).json({ message: "No OTP requested. Please log in again." });
    }

    if (new Date() > user.otpExpiresAt) {
      user.otpCode = null;
      user.otpExpiresAt = null;
      await user.save();
      return res.status(400).json({ message: "OTP expired. Please log in again." });
    }

    if (String(otp).trim() !== user.otpCode) {
      return res.status(401).json({ message: "Incorrect OTP" });
    }

    // Clear OTP and create session
    user.otpCode = null;
    user.otpExpiresAt = null;
    user.lastActiveAt = new Date();
    await user.save();

    return req.login({ appUserId: user._id.toString(), email: user.email }, (err) => {
      if (err) return res.status(500).json({ message: "Login session failed", error: err.message });
      req.session.userId = user._id.toString();
      return res.json({ id: user._id, email: user.email, role: user.role });
    });
  } catch (err) {
    return res.status(500).json({ message: "OTP verification failed", error: err.message });
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
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        finish();
      });
      return;
    }

    res.clearCookie("connect.sid");
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
      photo: req.appUser.photo || null,
      role: req.appUser.role,
      status: req.appUser.status,
      language: req.appUser.language,
      phone: req.appUser.phone || null,
      isSuperAdmin,
    });
  });
});

export default router;
