import express from "express";

const router = express.Router();
const FLASK_URL = process.env.FLASK_URL || "http://localhost:5000";

router.post("/", async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: "No image provided" });
  }

  try {
    const response = await fetch(`${FLASK_URL}/detect-disease`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image }),
    });

    const data = await response.json();
    return res.json(data);
  } catch {
    return res.json({
      label: "Tomato___Early_blight",
      confidence: 0.87,
      treatment_en: "Apply copper-based fungicide and remove infected leaves.",
      treatment_ar: "استخدم مبيداً فطرياً نحاسياً وأزل الأوراق المصابة.",
      mock: true,
    });
  }
});

export default router;
