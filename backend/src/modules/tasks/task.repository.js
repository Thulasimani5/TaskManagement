// All Mongoose queries for tasks.
import { Task } from "./task.model.js";
import { User } from "../auth/auth.model.js";

export const findTasks = (filter) =>
  Task.find(filter)
    .populate("assignedTo", "name email role")
    .populate("createdBy",  "name email role")
    .sort({ deadline: 1 });

export const findTaskById = (id) =>
  Task.findById(id)
    .populate("assignedTo", "name email role")
    .populate("createdBy",  "name email role");

export const insertTask = async (data) => {
  const task = await Task.create(data);
  await task.populate("assignedTo", "name email");
  return task;
};

export const saveTask   = (task) => task.save();
export const removeTask = (task) => task.deleteOne();

/** Resolve a user by display name (case-insensitive exact match) */
export const findUserByName = (name) =>
  User.findOne({ name: { $regex: new RegExp("^" + name.trim() + "$", "i") } });

/** Upcoming deadline tasks for a user (within next 24h, not completed) */
export const findUpcomingDeadlineTasks = (userId, now, tomorrow) =>
  Task.find({
    assignedTo: userId,
    status:     { $ne: "completed" },
    deadline:   { $gte: now, $lte: tomorrow }
  }).select("title deadline status");

/** Tasks newly assigned to a user (created in the last 24h) */
export const findRecentlyAssignedTasks = (userId, since) =>
  Task.find({
    assignedTo: userId,
    createdAt:  { $gte: since }
  }).select("title createdAt");
