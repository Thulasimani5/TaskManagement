// Same endpoints as original taskRoutes.js -- no URL changes.
import express from "express";
import {
  createTask, getTasks, getTaskById,
  updateTask, deleteTask, getNotifications
} from "./task.controller.js";
import { protect, authorizeRoles } from "../../middleware/auth.middleware.js";

const router = express.Router();
router.use(protect);

router.route("/")
  .get(getTasks)
  .post(authorizeRoles("admin", "lead"), createTask);

router.get("/notifications", getNotifications);

router.route("/:id")
  .get(getTaskById)
  .put(updateTask)
  .delete(authorizeRoles("admin", "lead"), deleteTask);

export default router;
