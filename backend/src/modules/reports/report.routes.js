// Same endpoints as original reportRoutes.js -- no URL changes.
import express from "express";
import { getDailySummary, getWeeklySummary } from "./report.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();
router.use(protect);

router.get("/daily",  getDailySummary);
router.get("/weekly", getWeeklySummary);

export default router;
