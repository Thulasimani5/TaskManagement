import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectDB } from "../src/config/db.js";
import authRoutes from "../src/routes/authRoutes.js";
import taskRoutes from "../src/routes/taskRoutes.js";
import reportRoutes from "../src/routes/reportRoutes.js";
import userRoutes from "../src/routes/userRoutes.js";
import leaderboardRoutes from "../src/routes/leaderboardRoutes.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Basic middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: true, // This automatically allows whichever frontend URL is calling it
    credentials: true
  })
);

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

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
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Unexpected server error." });
});

// Connect to Database
await connectDB();

// Export for Vercel
export default app;
