import express from "express";
import { getLeaderboard } from "../controllers/leaderboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Leaderboard requires authentication
router.get("/", protect, getLeaderboard);

export default router;
