import mongoose from "mongoose";

const systemLogSchema = new mongoose.Schema(
  {
    level: { type: String, enum: ["info", "warn", "error"], default: "info", index: true },
    message: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const SystemLog = mongoose.model("SystemLog", systemLogSchema, "system_logs");

export default SystemLog;
