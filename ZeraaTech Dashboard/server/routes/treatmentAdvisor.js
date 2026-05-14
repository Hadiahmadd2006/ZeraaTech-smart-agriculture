import express from "express";

const router = express.Router();
const FLASK_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:2006";

const mockAdvice = (lang) => ({
  status: "healthy",
  confidence: 0.85,
  advice: lang === "ar"
    ? "النبات في حالة جيدة. حافظ على الري المنتظم ومراقبة الرطوبة."
    : "Plant is in good condition. Maintain regular watering and monitor humidity.",
  language: lang || "en",
  mock: true,
});

router.post("/", async (req, res) => {
  const { moisture, temperature, humidity, pH, lang } = req.body;

  try {
    const response = await fetch(`${FLASK_URL}/predict-treatment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moisture, temperature, humidity, pH, lang }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "<unreadable>");
      console.warn(`[treatment-advisor] Flask ${response.status}: ${errBody}`);
      return res.json(mockAdvice(lang));
    }

    const data = await response.json();
    if (!data || !data.status) {
      console.warn("[treatment-advisor] Invalid Flask payload, returning mock", data);
      return res.json(mockAdvice(lang));
    }
    return res.json(data);
  } catch (error) {
    console.warn("[treatment-advisor] Flask unreachable:", error.message);
    return res.json(mockAdvice(lang));
  }
});

export default router;
