// All database calls related to report aggregations.
import { Task } from "../tasks/task.model.js";

/** Build a faceted aggregation pipeline for task statistics */
const buildReportPipeline = (since, userId) => {
  const matchStage = {
    $or: [
      { updatedAt: { $gte: since } },
      { status: { $ne: "completed" } }
    ]
  };
  if (userId) matchStage.assignedTo = userId;

  return [
    { $match: matchStage },
    {
      $facet: {
        total:      [{ $count: "count" }],
        byStatus:   [{ $group: { _id: "$status",   count: { $sum: 1 } } }],
        byPriority: [{ $group: { _id: "$priority", count: { $sum: 1 } } }]
      }
    }
  ];
};

export const aggregateTaskReport = (since, userId) =>
  Task.aggregate(buildReportPipeline(since, userId));
