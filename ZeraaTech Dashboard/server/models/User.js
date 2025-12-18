import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String },
    googleId: { type: String },
    displayName: { type: String },
    role: {
      type: String,
      enum: ["farmer", "admin"],
      default: "farmer",
      index: true,
    },
    status: {
      type: String,
      enum: ["Active", "Pending", "Suspended"],
      default: "Active",
      index: true,
    },
    language: { type: String, enum: ["en", "ar"], default: "en" },
    lastActiveAt: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
