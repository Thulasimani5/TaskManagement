// src/app.js -- Express app factory (no server.listen here).
// Keeping app creation separate from startup makes testing possible.
import express from "express";
import cors    from "cors";
import morgan  from "morgan";

import authRoutes        from "./modules/auth/auth.routes.js";
import taskRoutes        from "./modules/tasks/task.routes.js";
import reportRoutes      from "./modules/reports/report.routes.js";
import userRoutes        from "./modules/users/user.routes.js";
import leaderboardRoutes from "./modules/leaderboard/leaderboard.routes.js";
import { errorHandler }  from "./middleware/error.middleware.js";

const createApp = () => {
  const app = express();

  // ── Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── CORS
  // CLIENT_ORIGIN accepts a comma-separated list, e.g.:
  //   https://task-management-pi-three-24.vercel.app,https://my-custom-domain.com
  // Set this in the Vercel dashboard → Settings → Environment Variables.
  const rawOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    ...(process.env.CLIENT_ORIGIN
      ? process.env.CLIENT_ORIGIN.split(",").map((o) => o.trim())
      : [])
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);

      // Explicit whitelist check
      if (rawOrigins.includes(origin)) return callback(null, true);

      // Allow any *.vercel.app origin (covers preview deployments)
      if (origin.endsWith(".vercel.app")) return callback(null, true);

      // In development, allow everything
      if (process.env.NODE_ENV !== "production") return callback(null, true);

      return callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));

  // Handle preflight OPTIONS requests for all routes
  app.options("*", cors());

  // ── Request logging (dev only)
  if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

  // ── Health check
  app.get("/api/health", (_req, res) =>
    res.json({ status: "ok", app: "PurplePulse Backend" })
  );

  // ── Feature routers
  app.use("/api/auth",        authRoutes);
  app.use("/api/tasks",       taskRoutes);
  app.use("/api/reports",     reportRoutes);
  app.use("/api/users",       userRoutes);
  app.use("/api/leaderboard", leaderboardRoutes);

  // ── API 404 handler (catches unmatched /api/* routes before the catch-all)
  app.use("/api/*", (_req, res) => {
    res.status(404).json({ message: "API endpoint not found." });
  });

  // ── Central error handler (must be last)
  app.use(errorHandler);

  return app;
};

export default createApp;
