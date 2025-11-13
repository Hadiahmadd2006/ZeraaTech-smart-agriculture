import { Router } from "express";
const router = Router();

router.get("/", (_req, res) => {
  res.json([
    { id: 1, plant: "Tomato", img: "/img/tomato.jpg", status: "water", hint: "10m" },
    { id: 2, plant: "Potato", img: "/img/potato.jpg", status: "spray", hint: "today" },
    { id: 3, plant: "Pepper", img: "/img/pepper.jpg", status: "good",  hint: "" },
    { id: 4, plant: "Wheat",  img: "/img/wheat.jpg",  status: "shade", hint: "noon" }
  ]);
});

export default router;