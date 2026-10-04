// All database calls related to leaderboard data.
import { Task } from "../tasks/task.model.js";
import { User } from "../auth/auth.model.js";

/** Aggregate completed task counts per user, optionally filtered by date */
export const aggregateCompletedTasksPerUser = (dateFilter) =>
  Task.aggregate([
    { $match: { status: "completed", ...dateFilter } },
    { $group: { _id: "$assignedTo", completedCount: { $sum: 1 } } }
  ]);

/** Fetch all non-admin users */
export const findNonAdminUsers = () =>
  User.find({ role: { $ne: "admin" } }, "name role");
