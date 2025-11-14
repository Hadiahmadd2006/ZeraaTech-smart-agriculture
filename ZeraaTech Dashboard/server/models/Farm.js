import mongoose from "mongoose";

const farmSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    crop: { type: String, required: true },
    areaHectares: { type: Number, required: true },
    moisture: { type: Number, required: true },
    status: { type: String, required: true },
    pumpStatus: { type: String, required: true },
  },
  { timestamps: true }
);

const Farm = mongoose.model("Farm", farmSchema);

export default Farm;

