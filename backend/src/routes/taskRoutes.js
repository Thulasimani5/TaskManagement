import express from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getNotifications
} from "../controllers/taskController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// All task routes require authentication
router.use(protect);

router
  .route("/")
  .get(getTasks)
  .post(authorizeRoles("admin", "lead"), createTask);

router.get("/notifications", getNotifications);

router
  .route("/:id")
  .get(getTaskById)
  .put(updateTask)
  .delete(authorizeRoles("admin", "lead"), deleteTask);

export default router;

