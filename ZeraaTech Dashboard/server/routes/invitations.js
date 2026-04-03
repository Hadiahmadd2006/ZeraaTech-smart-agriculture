import { Router } from "express";
import crypto from "crypto";
import Invitation from "../models/Invitation.js";
import User from "../models/User.js";
import { sendInvitationEmail } from "../utils/email.js";
import { attachAppUser, requireAdmin, requireAuth } from "../middleware/auth.js";

const router = Router();

// POST /api/invitations — admin sends an invite
router.post("/", requireAuth, attachAppUser, requireAdmin, async (req, res) => {
  const { email, name, role } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const normalizedEmail = email.toLowerCase().trim();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  try {
    // Cancel any existing pending invite for this email
    await Invitation.deleteMany({ email: normalizedEmail, status: "pending" });

    const invitation = await Invitation.create({
      email: normalizedEmail,
      name,
      role: role === "admin" ? "admin" : "farmer",
      token,
      expiresAt,
      invitedBy: req.appUser._id,
    });

    // Pre-create the user as Pending so the admin can see them in the team list
    await User.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $setOnInsert: { email: normalizedEmail },
        $set: {
          displayName: name || normalizedEmail,
          role: invitation.role,
          status: "Pending",
        },
      },
      { upsert: true }
    );

    await sendInvitationEmail({
      toEmail: normalizedEmail,
      toName: name,
      role: invitation.role,
      token,
    });

    return res.status(201).json({ message: "Invitation sent", invitation });
  } catch (err) {
    console.error("[invitations] Error:", err.message);
    return res.status(500).json({ message: "Failed to send invitation", error: err.message });
  }
});

// GET /api/invitations/respond/:token?action=accept|deny
router.get("/respond/:token", async (req, res) => {
  const { token } = req.params;
  const action = req.query.action;

  if (!["accept", "deny"].includes(action)) {
    return res.status(400).json({ message: "Invalid action" });
  }

  try {
    const invitation = await Invitation.findOne({ token, status: "pending" });

    if (!invitation) {
      return res.redirect(
        `${process.env.CLIENT_URL || "http://localhost:3000"}/invite/invalid`
      );
    }

    if (new Date() > invitation.expiresAt) {
      await Invitation.findByIdAndUpdate(invitation._id, { status: "denied" });
      return res.redirect(
        `${process.env.CLIENT_URL || "http://localhost:3000"}/invite/expired`
      );
    }

    invitation.status = action === "accept" ? "accepted" : "denied";
    await invitation.save();

    const newStatus = action === "accept" ? "Active" : "Suspended";
    await User.findOneAndUpdate(
      { email: invitation.email },
      { $set: { status: newStatus } }
    );

    if (action === "accept") {
      return res.redirect(
        `${process.env.CLIENT_URL || "http://localhost:3000"}/invite/${token}?action=accept&done=1`
      );
    }
    return res.redirect(
      `${process.env.CLIENT_URL || "http://localhost:3000"}/invite/${token}?action=deny&done=1`
    );
  } catch (err) {
    console.error("[invitations] Respond error:", err.message);
    return res.status(500).json({ message: "Failed to process response" });
  }
});

// GET /api/invitations/:token — fetch invite details for the landing page
router.get("/:token", async (req, res) => {
  try {
    const invitation = await Invitation.findOne({ token: req.params.token }).lean();
    if (!invitation) return res.status(404).json({ message: "Invitation not found" });
    return res.json({
      email: invitation.email,
      name: invitation.name,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch invitation" });
  }
});

export default router;
