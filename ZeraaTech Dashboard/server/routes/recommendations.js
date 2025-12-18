import { Router } from "express";
import Recommendation from "../models/Recommendation.js";

const router = Router();

async function ensureSeedData() {
  const count = await Recommendation.countDocuments();
  if (count > 0) return;

  await Recommendation.insertMany([
    { plant: "Tomato", img: "/img/tomato.jpg", status: "water", hint: "10m" },
    { plant: "Potato", img: "/img/potato.jpg", status: "spray", hint: "today" },
    { plant: "Pepper", img: "/img/pepper.jpg", status: "good", hint: "" },
    { plant: "Wheat", img: "/img/wheat.jpg", status: "shade", hint: "noon" },
  ]);
}

router.get("/", async (_req, res) => {
  try {
    await ensureSeedData();
    const recs = await Recommendation.find().sort({ createdAt: 1 }).lean();
    res.json(
      recs.map((r, index) => ({
        id: index + 1,
        plant: r.plant,
        img: r.img,
        status: r.status,
        hint: r.hint || "",
      }))
    );
  } catch (err) {
    res.status(500).json({ message: "Failed to load recommendations", error: err.message });
  }
});

export default router;
