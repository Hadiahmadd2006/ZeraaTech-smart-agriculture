import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", required: true, index: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["Open", "Acknowledged", "Closed"],
      default: "Open",
      index: true,
    },
    severity: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

const Alert = mongoose.model("Alert", alertSchema);

export default Alert;

