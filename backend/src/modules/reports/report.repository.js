// All database calls related to report aggregations.
import mongoose from "mongoose";
import { Task } from "../tasks/task.model.js";

/** Build a faceted aggregation pipeline for task statistics */
const buildReportPipeline = (since, userId) => {
  const matchStage = {
    $or: [
      { updatedAt: { $gte: since } },
      { status: { $nin: ["completed", "finished"] } }
    ]
  };
  if (userId) {
    matchStage.assignedTo = new mongoose.Types.ObjectId(String(userId));
  }

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
