import express from "express";
import { getAllUsers } from "../controllers/userController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all users - Admin & Lead only
router.get("/", protect, authorizeRoles("admin", "lead"), getAllUsers);

export default router;
