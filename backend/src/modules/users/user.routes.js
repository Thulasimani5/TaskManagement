// Same endpoint as original userRoutes.js -- no URL changes.
import express from "express";
import { getAllUsers } from "./user.controller.js";
import { protect, authorizeRoles } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, authorizeRoles("admin", "lead"), getAllUsers);

export default router;
