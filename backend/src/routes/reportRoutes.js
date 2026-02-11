import express from "express";
import {
  getDailySummary,
  getWeeklySummary
} from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/daily", getDailySummary);
router.get("/weekly", getWeeklySummary);

export default router;

