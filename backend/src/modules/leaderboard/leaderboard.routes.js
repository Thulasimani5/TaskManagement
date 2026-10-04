// Same endpoint as original leaderboardRoutes.js -- no URL changes.
import express from "express";
import { getLeaderboard } from "./leaderboard.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getLeaderboard);

export default router;
