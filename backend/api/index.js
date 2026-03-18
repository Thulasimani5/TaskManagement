import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "../src/config/db.js";
import authRoutes from "../src/routes/authRoutes.js";
import taskRoutes from "../src/routes/taskRoutes.js";
import reportRoutes from "../src/routes/reportRoutes.js";
import userRoutes from "../src/routes/userRoutes.js";
import leaderboardRoutes from "../src/routes/leaderboardRoutes.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS — on a single URL deployment, frontend and backend share the same origin,
// so we allow same-origin + any CLIENT_ORIGIN env var set for custom domains.
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.CLIENT_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "PurplePulse Backend" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Unexpected server error." });
});

// Connect to DB and export app for Vercel serverless
connectDB().catch((err) => console.error("DB connection failed:", err));

export default app;
