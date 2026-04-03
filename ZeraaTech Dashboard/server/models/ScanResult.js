import mongoose from "mongoose";

const scanResultSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    label: { type: String, required: true },
    confidence: { type: Number },
    treatment_en: { type: String },
    treatment_ar: { type: String },
    top3: { type: mongoose.Schema.Types.Mixed },
    imageThumbnail: { type: String },
    mock: { type: Boolean, default: false },
    scannedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

const ScanResult = mongoose.model("ScanResult", scanResultSchema, "scan_results");

export default ScanResult;
