import express from "express";

const router = express.Router();
const FLASK_URL = process.env.ML_SERVICE_URL || "http://localhost:5173";

router.post("/", async (req, res) => {
  const { moisture, temperature, humidity, pH, lang } = req.body;

  try {
    const response = await fetch(`${FLASK_URL}/predict-treatment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moisture, temperature, humidity, pH, lang }),
    });

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error("Error proxying to Flask treatment advisor:", error);
    return res.status(500).json({ error: "Failed to connect to AI service" });
  }
});

export default router;
