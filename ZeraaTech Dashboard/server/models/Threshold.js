import mongoose from "mongoose";

const thresholdSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    group: { type: String, required: true, index: true },
    unit: { type: String, default: "" },
    min: { type: Number },
    max: { type: Number },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Threshold = mongoose.model("Threshold", thresholdSchema);

export default Threshold;

