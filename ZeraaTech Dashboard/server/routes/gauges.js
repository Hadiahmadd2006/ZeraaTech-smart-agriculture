import { Router } from "express";
const router = Router();

router.get("/", (_req, res) => {
  res.json([
    { id: "health", label: "Health", value: 82 },
    { id: "water",  label: "Water",  value: 45 },
    { id: "soil",   label: "Soil",   value: 67 }
  ]);
});

export default router;