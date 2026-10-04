// Business logic for leaderboard scoring and role-based visibility.
import {
  aggregateCompletedTasksPerUser,
  findNonAdminUsers
} from "./leaderboard.repository.js";

const buildDateFilter = (timeframe) => {
  const now = new Date();
  if (timeframe === "monthly") {
    return { updatedAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } };
  }
  if (timeframe === "weekly") {
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    return { updatedAt: { $gte: startOfWeek } };
  }
  return {};
};

export const getLeaderboardService = async (timeframe, requestingRole) => {
  const dateFilter = buildDateFilter(timeframe);

  const [stats, users] = await Promise.all([
    aggregateCompletedTasksPerUser(dateFilter),
    findNonAdminUsers()
  ]);

  const fullLeaderboard = users
    .map((user) => {
      const userStat      = stats.find((s) => s._id.toString() === user._id.toString());
      const completedCount = userStat ? userStat.completedCount : 0;
      return {
        _id: user._id,
        name: user.name,
        role: user.role,
        completedTasks:    completedCount,
        productivityScore: completedCount * 10,
        streak: Math.max(0, Math.floor(Math.random() * 5)) // TODO: implement real streak
      };
    })
    .sort((a, b) => b.productivityScore - a.productivityScore);

  const leads        = fullLeaderboard.filter((u) => u.role === "lead");
  const regularUsers = fullLeaderboard.filter((u) => u.role === "user");

  if (requestingRole === "admin") return { leads, users: regularUsers };
  if (requestingRole === "lead")  return { leads };
  return { users: regularUsers };
};
