// Business logic for report summaries.
import { aggregateTaskReport } from "./report.repository.js";

const processAggregationResult = (result) => {
  const data  = result[0];
  const total = data.total[0] ? data.total[0].count : 0;

  const byStatus = { todo: 0, in_progress: 0, completed: 0 };
  data.byStatus.forEach((item) => { byStatus[item._id] = item.count; });

  const byPriority = { low: 0, medium: 0, high: 0, critical: 0 };
  data.byPriority.forEach((item) => { byPriority[item._id] = item.count; });

  const completed      = byStatus.completed || 0;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  return { total, completed, completionRate, byStatus, byPriority };
};

const resolveUserId = (user, query) => {
  const isPersonal = query.scope === "personal";
  return user.role === "user" || isPersonal ? user._id : null;
};

export const getDailySummaryService = async (user, query) => {
  const since = new Date();
  since.setDate(since.getDate() - 1);
  const userId = resolveUserId(user, query);
  const result = await aggregateTaskReport(since, userId);
  return { range: "daily", since, ...processAggregationResult(result) };
};

export const getWeeklySummaryService = async (user, query) => {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const userId = resolveUserId(user, query);
  const result = await aggregateTaskReport(since, userId);
  return { range: "weekly", since, ...processAggregationResult(result) };
};
