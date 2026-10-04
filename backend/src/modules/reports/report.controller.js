// Thin HTTP adapter for report endpoints.
import { getDailySummaryService, getWeeklySummaryService } from "./report.service.js";

export const getDailySummary = async (req, res, next) => {
  try { res.json(await getDailySummaryService(req.user, req.query)); }
  catch (err) { next(err); }
};

export const getWeeklySummary = async (req, res, next) => {
  try { res.json(await getWeeklySummaryService(req.user, req.query)); }
  catch (err) { next(err); }
};
