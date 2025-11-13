import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "./config/passport.js";
import dotenv from "dotenv";
import mongoose from "mongoose";

import gauges from "./routes/gauges.js";
import recommendations from "./routes/recommendations.js";
import authRoutes from "./routes/auth.js";
import cropsRoutes from "./routes/crops.js";
import settingsRoutes from "./routes/settings.js";

dotenv.config();

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/gauges", gauges);
app.use("/api/recommendations", recommendations);
app.use("/api/crops", cropsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/auth", authRoutes);

app.listen(4000, () => console.log("Server running at http://localhost:4000"));
