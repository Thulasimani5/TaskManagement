// src/app.js -- Express app factory (no server.listen here).
// Keeping app creation separate from startup makes testing possible.
import express from "express";
import path    from "path";
import { fileURLToPath } from "url";
import cors    from "cors";
import morgan  from "morgan";

import authRoutes        from "./modules/auth/auth.routes.js";
import taskRoutes        from "./modules/tasks/task.routes.js";
import reportRoutes      from "./modules/reports/report.routes.js";
import userRoutes        from "./modules/users/user.routes.js";
import leaderboardRoutes from "./modules/leaderboard/leaderboard.routes.js";
import { errorHandler }  from "./middleware/error.middleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const createApp = () => {
  const app = express();

  // ── Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── CORS
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    process.env.CLIENT_ORIGIN
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  }));

  // ── Request logging
  if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

  // ── Health check
  app.get("/api/health", (_req, res) => res.json({ status: "ok", app: "PurplePulse Backend" }));

  // ── Feature routers
  app.use("/api/auth",        authRoutes);
  app.use("/api/tasks",       taskRoutes);
  app.use("/api/reports",     reportRoutes);
  app.use("/api/users",       userRoutes);
  app.use("/api/leaderboard", leaderboardRoutes);

  // ── Serve frontend in production
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../../frontend/dist")));
    app.get("*", (_req, res) =>
      res.sendFile(path.resolve(__dirname, "../../frontend", "dist", "index.html"))
    );
  }

  // ── Central error handler (must be last)
  app.use(errorHandler);

  return app;
};

export default createApp;
