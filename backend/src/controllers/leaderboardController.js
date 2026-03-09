import { Task } from "../models/Task.js";
import { User } from "../models/User.js";

/**
 * Get Leaderboard Data
 * Calculates productivity scores based on completed tasks.
 */
export const getLeaderboard = async (req, res) => {
  try {
    const { timeframe } = req.query; // 'all-time', 'monthly', 'weekly'
    let dateFilter = {};

    const now = new Date();
    if (timeframe === "monthly") {
      dateFilter = { updatedAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } };
    } else if (timeframe === "weekly") {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      dateFilter = { updatedAt: { $gte: startOfWeek } };
    }

    // Aggregate completed tasks per user
    const stats = await Task.aggregate([
      { 
        $match: { 
          status: "completed",
          ...dateFilter
        } 
      },
      {
        $group: {
          _id: "$assignedTo",
          completedCount: { $sum: 1 }
        }
      }
    ]);

    // Fetch all relevant users (exclude admins)
    const users = await User.find({ role: { $ne: "admin" } }, "name role");

    // Map stats to users and calculate scores
    const fullLeaderboard = users.map(user => {
      const userStat = stats.find(s => s._id.toString() === user._id.toString());
      const completedCount = userStat ? userStat.completedCount : 0;
      
      return {
        _id: user._id,
        name: user.name,
        role: user.role,
        completedTasks: completedCount,
        productivityScore: completedCount * 10,
        streak: Math.max(0, Math.floor(Math.random() * 5)) // Still mocking streak
      };
    });

    // Sort by score descending
    fullLeaderboard.sort((a, b) => b.productivityScore - a.productivityScore);

    const userRole = req.user.role;
    
    if (userRole === "admin") {
      // Admin sees both, separated
      const leads = fullLeaderboard.filter(u => u.role === "lead");
      const regularUsers = fullLeaderboard.filter(u => u.role === "user");
      return res.json({ leads, users: regularUsers });
    }

    if (userRole === "lead") {
      // Leads see only leads
      const leads = fullLeaderboard.filter(u => u.role === "lead");
      return res.json({ leads });
    }

    // Default for 'user' role: only see users
    const regularUsers = fullLeaderboard.filter(u => u.role === "user");
    res.json({ users: regularUsers });
  } catch (err) {
    console.error("Leaderboard Error:", err);
    res.status(500).json({ message: "Server error calculating leaderboard" });
  }
};
