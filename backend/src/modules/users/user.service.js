// Business logic for user management operations.
import { findAllUsers } from "./user.repository.js";

export const getAllUsersService = () => findAllUsers();
