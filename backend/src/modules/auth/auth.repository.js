// All database calls related to user lookup and creation.
import { User } from "./auth.model.js";

export const findUserByEmail = (email) => User.findOne({ email });

export const findUserById   = (id)    => User.findById(id).select("-password");

export const createUser = ({ name, email, password, role }) =>
  User.create({ name, email, password, role });
