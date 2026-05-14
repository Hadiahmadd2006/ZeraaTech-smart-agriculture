import express from "express";

const router = express.Router();
const FLASK_URL = process.env.ML_SERVICE_URL || "http://localhost:5173";

const mockResponse = () => ({
  label: "Strawberry___healthy",
  confidence: 0.92,
  treatment_en: "Leaf appears healthy. Maintain regular watering and monitor for pests.",
  treatment_ar: "الورقة تبدو سليمة. حافظ على الري المنتظم وراقب الآفات.",
  mock: true,
});

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

    if (!response.ok) {
      const errBody = await response.text().catch(() => "<unreadable>");
      console.warn(`[disease-detect] Flask ${response.status}: ${errBody}`);
      return res.json(mockResponse());
    }

    const data = await response.json();
    if (!data || typeof data.confidence !== "number" || !data.label) {
      console.warn("[disease-detect] Invalid Flask payload, falling back to mock", data);
      return res.json(mockResponse());
    }
    return res.json(data);
  } catch (err) {
    console.warn("[disease-detect] Flask unreachable:", err.message);
    return res.json(mockResponse());
  }
});

export default router;
