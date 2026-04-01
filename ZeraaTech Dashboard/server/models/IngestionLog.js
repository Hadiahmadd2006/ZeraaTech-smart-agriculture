import mongoose from "mongoose";

const ingestionLogSchema = new mongoose.Schema(
  {
    deviceId: { type: String },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    status: { type: String, enum: ["received", "validated", "rejected", "saved"], default: "received" },
    errorMessage: { type: String },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

const IngestionLog = mongoose.model("IngestionLog", ingestionLogSchema, "ingestion_logs");

export default IngestionLog;