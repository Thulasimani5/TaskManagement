import { Task } from "../models/Task.js";

// Helper to build aggregation pipeline
const getReportPipeline = (since, userId) => {
  const matchStage = {
    updatedAt: { $gte: since }
  };

  if (userId) {
    matchStage.assignedTo = userId;
  }

  return [
    { $match: matchStage },
    {
      $facet: {
        total: [{ $count: "count" }],
        byStatus: [
          { $group: { _id: "$status", count: { $sum: 1 } } }
        ],
        byPriority: [
          { $group: { _id: "$priority", count: { $sum: 1 } } }
        ]
      }
    }
  ];
};

const processAggregationResult = (result) => {
  const data = result[0];
  const total = data.total[0] ? data.total[0].count : 0;

  const byStatus = { todo: 0, in_progress: 0, completed: 0 };
  data.byStatus.forEach(item => {
    byStatus[item._id] = item.count;
  });

  const byPriority = { low: 0, medium: 0, high: 0, critical: 0 };
  data.byPriority.forEach(item => {
    byPriority[item._id] = item.count;
  });

  const completed = byStatus.completed || 0;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  return { total, completed, completionRate, byStatus, byPriority };
};

// Daily summary (last 24h)
export const getDailySummary = async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 1);

    // Check if user role is 'user' OR if scope is explicitly 'personal'
    const isPersonal = req.query.scope === 'personal';
    const userId = (req.user.role === 'user' || isPersonal) ? req.user._id : null;

    const result = await Task.aggregate(getReportPipeline(since, userId));
    const summary = processAggregationResult(result);

    res.json({ range: "daily", since, ...summary });
  } catch (error) {
    console.error("Daily summary error:", error.message);
    res.status(500).json({ message: "Server error building daily summary." });
  }
};

// Weekly summary (last 7 days)
export const getWeeklySummary = async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const isPersonal = req.query.scope === 'personal';
    const userId = (req.user.role === 'user' || isPersonal) ? req.user._id : null;

    const result = await Task.aggregate(getReportPipeline(since, userId));
    const summary = processAggregationResult(result);

    res.json({ range: "weekly", since, ...summary });
  } catch (error) {
    console.error("Weekly summary error:", error.message);
    res.status(500).json({ message: "Server error building weekly summary." });
  }
};

