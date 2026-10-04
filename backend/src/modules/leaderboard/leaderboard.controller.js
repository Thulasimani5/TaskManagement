// Thin HTTP adapter for leaderboard endpoint.
import { getLeaderboardService } from "./leaderboard.service.js";

export const getLeaderboard = async (req, res, next) => {
  try {
    const data = await getLeaderboardService(req.query.timeframe, req.user.role);
    res.json(data);
  } catch (err) { next(err); }
};
