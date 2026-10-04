// api/index.js — Vercel serverless entry point
// Delegates to the shared app factory so there is zero duplication.

import dotenv from "dotenv";
dotenv.config();

import createApp from "../src/app.js";
import { connectDB } from "../src/config/db.js";

// Connect once (Vercel may reuse the same lambda instance across requests)
connectDB().catch((err) => console.error("DB connection failed:", err));

const app = createApp();

export default app;

