import mongoose from "mongoose";

const sensorReadingSchema = new mongoose.Schema(
  {
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", required: true, index: true },
    moisture: { type: Number },
    temperature: { type: Number },
    humidity: { type: Number },
    light: { type: Number },
    ph: { type: Number },
    source: { type: String, default: "manual" },
    recordedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

const SensorReading = mongoose.model("SensorReading", sensorReadingSchema, "sensor_readings");

export default SensorReading;
