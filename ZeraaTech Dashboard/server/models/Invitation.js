import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    email:     { type: String, required: true, lowercase: true },
    name:      { type: String },
    role:      { type: String, default: "farmer" },
    token:     { type: String, required: true, unique: true, index: true },
    status:    { type: String, enum: ["pending", "accepted", "denied"], default: "pending" },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

const Invitation = mongoose.model("Invitation", invitationSchema, "invitations");
export default Invitation;
