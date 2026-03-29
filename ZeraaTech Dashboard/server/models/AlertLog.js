import mongoose from "mongoose";

const alertLogSchema = new mongoose.Schema(
  {
    alert: { type: mongoose.Schema.Types.ObjectId, ref: "Alert", required: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", required: true },
    recipient: { type: String, required: true },
    channel: { type: String, default: "sms" },
    language: { type: String, enum: ["en", "ar", "both"], default: "both" },
    messageBody: { type: String, required: true },
    deliveryStatus: {
      type: String,
      enum: ["queued", "sent", "delivered", "failed", "rate_limited"],
      default: "queued",
    },
    provider: { type: String, default: "twilio" },
    providerMessageSid: { type: String },
    errorMessage: { type: String },
    severity: { type: String },
    sensorType: { type: String },
  },
  { timestamps: true }
);

const AlertLog = mongoose.model("AlertLog", alertLogSchema);

export default AlertLog;