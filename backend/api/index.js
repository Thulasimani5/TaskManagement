// api/index.js — Vercel serverless entry point.
// Delegates to the shared app factory so there is zero duplication.
// env.js is imported first so dotenv.config() runs before any other module.

import "../src/config/env.js";
import { connectDB } from "../src/config/db.js";
import createApp     from "../src/app.js";

// Connect once (Vercel may reuse the same lambda instance across requests)
connectDB().catch((err) => console.error("DB connection failed:", err));

const app = createApp();

export default app;
