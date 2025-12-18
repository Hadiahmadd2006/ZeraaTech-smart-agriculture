import mongoose from "mongoose";

const recommendationSchema = new mongoose.Schema(
  {
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", index: true },
    plant: { type: String },
    img: { type: String },
    status: { type: String, default: "good" },
    hint: { type: String, default: "" },
    message: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Recommendation = mongoose.model("Recommendation", recommendationSchema);

export default Recommendation;

