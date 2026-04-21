import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", required: true, index: true },
    sensorReading: { type: mongoose.Schema.Types.ObjectId, ref: "SensorReading" },
    type: { type: String, required: true },
    sensorType: { type: String, required: true },
    measuredValue: { type: Number, required: true },
    thresholdMin: { type: Number },
    thresholdMax: { type: Number },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["Open", "Acknowledged", "Closed"],
      default: "Open",
      index: true,
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
    },
    dedupeKey: { type: String, index: true },
    read: { type: Boolean, default: false },
    acknowledgedAt: { type: Date },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

const Alert = mongoose.model("Alert", alertSchema);

export default Alert;
