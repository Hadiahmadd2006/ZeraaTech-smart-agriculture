import mongoose from "mongoose";

const sensorReadingSchema = new mongoose.Schema(
  {
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", required: true, index: true },
    deviceId: { type: String },
    moisture: { type: Number },
    temperature: { type: Number },
    humidity: { type: Number },
    light: { type: Number },
    ph: { type: Number },
    rainfall: { type: Number },
    source: { type: String, default: "manual" },
    recordedAt: { type: Date, default: Date.now, index: true },
    deviceTimestamp: { type: Date },
    ingestionMeta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

const SensorReading = mongoose.model("SensorReading", sensorReadingSchema, "sensor_readings");

export default SensorReading;
