// All database calls related to leaderboard data.
import { Task } from "../tasks/task.model.js";
import { User } from "../auth/auth.model.js";

/** Aggregate completed task counts per user, optionally filtered by date */
export const aggregateCompletedTasksPerUser = (dateFilter) =>
  Task.aggregate([
    { $match: { status: { $in: ["completed", "finished"] }, ...dateFilter } },
    { $group: { _id: "$assignedTo", completedCount: { $sum: 1 } } }
  ]);

/** Find all tasks with fields needed for advanced leaderboard score calculations */
export const findTasksForLeaderboard = (dateFilter = {}) =>
  Task.find(dateFilter)
    .select("title priority status deadline inProgressAt completedAt finishedAt reviewedAt reviewHistory assignedTo createdAt updatedAt")
    .lean();

/** Fetch all non-admin users */
export const findNonAdminUsers = () =>
  User.find({ role: { $ne: "admin" } }, "name role").lean();

