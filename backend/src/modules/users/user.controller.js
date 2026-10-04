// Thin HTTP adapter for user endpoints.
import { getAllUsersService } from "./user.service.js";

export const getAllUsers = async (req, res, next) => {
  try { res.json(await getAllUsersService()); }
  catch (err) { next(err); }
};
