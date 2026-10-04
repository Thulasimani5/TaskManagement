// All database calls related to user listing.
import { User } from "../auth/auth.model.js";

export const findAllUsers = () =>
  User.find({}, "name email role").sort({ role: 1, name: 1 });
