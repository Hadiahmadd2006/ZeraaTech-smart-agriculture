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
import farmsRoutes from "./routes/farms.js";
import sensorsRoutes from "./routes/sensors.js";
import adminUsersRoutes from "./routes/adminUsers.js";
import thresholdsRoutes from "./routes/thresholds.js";
import alertsRoutes from "./routes/alerts.js";
import alertLogsRoutes from "./routes/alertLogs.js";
import systemLogsRoutes from "./routes/systemLogs.js";
import aiInsightsRoutes from "./routes/aiInsights.js";
import diseaseDetectRoutes from "./routes/diseaseDetect.js";
import scanResultsRoutes from "./routes/scanResults.js";
import invitationsRoutes from "./routes/invitations.js";
import dashboardRoutes from "./routes/dashboard.js";
import adminThresholdsRoutes from "./routes/adminThresholds.js";

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
    methods: "GET,POST,PUT,PATCH,DELETE",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "zeraatech-dev-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/gauges", gauges);
app.use("/api/recommendations", recommendations);
app.use("/api/crops", cropsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/farms", farmsRoutes);
app.use("/api/sensors", sensorsRoutes);
app.use("/api/admin/users", adminUsersRoutes);
app.use("/api/admin/thresholds", adminThresholdsRoutes);
app.use("/api/admin/logs", systemLogsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/thresholds", thresholdsRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/alert-logs", alertLogsRoutes);
app.use("/api/system-logs", systemLogsRoutes);
app.use("/api/ai-insights", aiInsightsRoutes);
app.use("/api/disease-detect", diseaseDetectRoutes);
app.use("/api/scan-results", scanResultsRoutes);
app.use("/api/invitations", invitationsRoutes);
app.use("/auth", authRoutes);

app.listen(4000, () => console.log("Server running at http://localhost:4000"));
