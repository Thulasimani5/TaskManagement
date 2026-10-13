// Business logic for leaderboard scoring and role-based visibility.
import {
  findTasksForLeaderboard,
  findNonAdminUsers
} from "./leaderboard.repository.js";

/**
 * Scoring Configuration:
 * 1. Task Priority weights for COMPLETED tasks:
 *    - Critical: +40 pts
 *    - High:     +30 pts
 *    - Medium:   +20 pts
 *    - Low:      +10 pts
 *
 * 2. Task Priority weights for IN-PROGRESS tasks (active development credit):
 *    - Critical: +12 pts
 *    - High:     +9 pts
 *    - Medium:   +6 pts
 *    - Low:      +3 pts
 *
 * 3. Deadline Adherence:
 *    - On-Time Completion (completedAt <= deadline): +15 pts
 *    - Overdue Completion (completedAt > deadline):  -10 pts
 *    - Overdue In-Progress (now > deadline):         -5 pts
 *
 * 4. Revision Penalty (Quality minus marks):
 *    - Each revision requested in task review history: -10 pts
 */
export const SCORING_RULES = {
  COMPLETED_PRIORITY: {
    critical: 40,
    high: 30,
    medium: 20,
    low: 10
  },
  IN_PROGRESS_PRIORITY: {
    critical: 12,
    high: 9,
    medium: 6,
    low: 3
  },
  DEADLINE: {
    ON_TIME_BONUS: 15,
    OVERDUE_COMPLETED_PENALTY: 10,
    OVERDUE_IN_PROGRESS_PENALTY: 5
  },
  REVISION_REQUESTED_PENALTY: 10
};

const buildDateFilter = (timeframe) => {
  const now = new Date();
  if (timeframe === "monthly") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return { updatedAt: { $gte: startOfMonth } };
  }
  if (timeframe === "weekly") {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return { updatedAt: { $gte: startOfWeek } };
  }
  return {};
};

/**
 * Calculate streak: consecutive on-time completed tasks ordered by completion date
 */
const calculateStreak = (userTasks) => {
  const completedTasks = userTasks
    .filter((t) => t.status === "completed" || t.status === "finished")
    .sort((a, b) => {
      const dateA = new Date(a.completedAt || a.finishedAt || a.updatedAt || 0);
      const dateB = new Date(b.completedAt || b.finishedAt || b.updatedAt || 0);
      return dateB - dateA;
    });

  let streak = 0;
  for (const task of completedTasks) {
    const compDate = new Date(task.completedAt || task.finishedAt || task.updatedAt);
    const deadlineDate = new Date(task.deadline);
    if (compDate <= deadlineDate) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
};

export const getLeaderboardService = async (timeframe, requestingRole) => {
  const dateFilter = buildDateFilter(timeframe);

  const [allTasks, users] = await Promise.all([
    findTasksForLeaderboard(dateFilter),
    findNonAdminUsers()
  ]);

  const now = new Date();

  const fullLeaderboard = users
    .map((user) => {
      const userTasks = allTasks.filter(
        (t) => t.assignedTo && t.assignedTo.toString() === user._id.toString()
      );

      let totalPoints = 0;
      let completedCount = 0;
      let inProgressCount = 0;
      let onTimeCount = 0;
      let overdueCount = 0;
      let totalRevisions = 0;

      let baseCompletedPoints = 0;
      let baseInProgressPoints = 0;
      let totalDeadlineBonus = 0;
      let totalDeadlinePenalty = 0;

      for (const task of userTasks) {
        const isCompleted = task.status === "completed" || task.status === "finished";
        const isInProgress = task.status === "in_progress" || task.status === "in_review";
        const priority = (task.priority || "medium").toLowerCase();

        // 1. Revisions requested minus marks
        const revCount = Array.isArray(task.reviewHistory)
          ? task.reviewHistory.filter((r) => r.action === "revision_requested").length
          : 0;
        totalRevisions += revCount;
        const revisionDeduction = revCount * SCORING_RULES.REVISION_REQUESTED_PENALTY;

        let taskPoints = 0;

        if (isCompleted) {
          completedCount += 1;
          const basePts =
            SCORING_RULES.COMPLETED_PRIORITY[priority] ??
            SCORING_RULES.COMPLETED_PRIORITY.medium;
          baseCompletedPoints += basePts;

          const compDate = new Date(task.completedAt || task.finishedAt || task.updatedAt);
          const deadlineDate = new Date(task.deadline);
          const isOnTime = compDate <= deadlineDate;

          if (isOnTime) {
            onTimeCount += 1;
            totalDeadlineBonus += SCORING_RULES.DEADLINE.ON_TIME_BONUS;
            taskPoints = basePts + SCORING_RULES.DEADLINE.ON_TIME_BONUS - revisionDeduction;
          } else {
            overdueCount += 1;
            totalDeadlinePenalty += SCORING_RULES.DEADLINE.OVERDUE_COMPLETED_PENALTY;
            taskPoints = basePts - SCORING_RULES.DEADLINE.OVERDUE_COMPLETED_PENALTY - revisionDeduction;
          }
        } else if (isInProgress) {
          inProgressCount += 1;
          const basePts =
            SCORING_RULES.IN_PROGRESS_PRIORITY[priority] ??
            SCORING_RULES.IN_PROGRESS_PRIORITY.medium;
          baseInProgressPoints += basePts;

          const isOverdue = now > new Date(task.deadline);
          if (isOverdue) {
            overdueCount += 1;
            totalDeadlinePenalty += SCORING_RULES.DEADLINE.OVERDUE_IN_PROGRESS_PENALTY;
            taskPoints = basePts - SCORING_RULES.DEADLINE.OVERDUE_IN_PROGRESS_PENALTY - revisionDeduction;
          } else {
            taskPoints = basePts - revisionDeduction;
          }
        } else {
          // 'todo' tasks do not earn progress points yet
          taskPoints = -revisionDeduction;
        }

        totalPoints += taskPoints;
      }

      const productivityScore = Math.max(0, totalPoints);
      const streak = calculateStreak(userTasks);

      return {
        _id: user._id,
        name: user.name,
        role: user.role,
        completedTasks: completedCount,
        inProgressTasks: inProgressCount,
        totalMissions: userTasks.length,
        onTimeTasks: onTimeCount,
        overdueTasks: overdueCount,
        revisionCount: totalRevisions,
        revisionPenalties: totalRevisions * SCORING_RULES.REVISION_REQUESTED_PENALTY,
        productivityScore,
        streak,
        breakdown: {
          completedPoints: baseCompletedPoints,
          inProgressPoints: baseInProgressPoints,
          deadlineBonus: totalDeadlineBonus,
          deadlinePenalty: totalDeadlinePenalty,
          revisionPenalty: totalRevisions * SCORING_RULES.REVISION_REQUESTED_PENALTY
        }
      };
    })
    .sort((a, b) => b.productivityScore - a.productivityScore || b.completedTasks - a.completedTasks || b.streak - a.streak);

  const leads = fullLeaderboard.filter((u) => u.role === "lead");
  const regularUsers = fullLeaderboard.filter((u) => u.role === "user");

  return {
    leads,
    users: regularUsers,
    rules: SCORING_RULES
  };
};

