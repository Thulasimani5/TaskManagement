// Business logic for task operations.
// All role-based rules and database coordination live here.

import {
  findTasks,
  findTaskById,
  insertTask,
  saveTask,
  removeTask,
  findUserByName,
  findUpcomingDeadlineTasks,
  findRecentlyAssignedTasks
} from "./task.repository.js";

// ── Create ─────────────────────────────────────────────────────────────────
export const createTaskService = async (body, requestingUser) => {
  const { title, description, priority, status, deadline, assignedTo, assignedToName } = body;

  if (!title || !deadline) {
    const err = new Error("Title and deadline are required."); err.status = 400; throw err;
  }

  let targetUserId = assignedTo;

  if (assignedToName) {
    const user = await findUserByName(assignedToName);
    if (!user) {
      const err = new Error(`User '${assignedToName.trim()}' not found.`); err.status = 404; throw err;
    }
    targetUserId = user._id;
  }

  if (!targetUserId) {
    const err = new Error("Assigned user is required (ID or Name)."); err.status = 400; throw err;
  }

  return insertTask({
    title, description, priority, status, deadline,
    assignedTo: targetUserId,
    createdBy: requestingUser._id
  });
};

// ── Read (list) ─────────────────────────────────────────────────────────────
export const getTasksService = (query, requestingUser) => {
  const { status, priority, type } = query;
  const filter = {};

  if (status)   filter.status   = status;
  if (priority) filter.priority = priority;

  if (requestingUser.role === "user") {
    filter.assignedTo = requestingUser._id;
  } else {
    if (type === "assigned_to_me") {
      filter.assignedTo = requestingUser._id;
    } else if (type === "assigned_by_me") {
      filter.createdBy  = requestingUser._id;
      filter.assignedTo = { $ne: requestingUser._id };
    }
  }

  return findTasks(filter);
};

// ── Read (single) ───────────────────────────────────────────────────────────
export const getTaskByIdService = async (id, requestingUser) => {
  const task = await findTaskById(id);
  if (!task) { const err = new Error("Task not found."); err.status = 404; throw err; }

  if (
    requestingUser.role === "user" &&
    task.assignedTo._id.toString() !== requestingUser._id.toString()
  ) {
    const err = new Error("Forbidden: cannot view this task."); err.status = 403; throw err;
  }

  return task;
};

// ── Update ──────────────────────────────────────────────────────────────────
export const updateTaskService = async (id, body, requestingUser) => {
  const task = await findTaskById(id);
  if (!task) { const err = new Error("Task not found."); err.status = 404; throw err; }

  const isOwner =
    task.assignedTo._id.toString() === requestingUser._id.toString() ||
    task.createdBy._id.toString()  === requestingUser._id.toString();

  if (requestingUser.role === "user") {
    if (!isOwner) {
      const err = new Error("Forbidden: cannot update this task."); err.status = 403; throw err;
    }
    if (!body.status) {
      const err = new Error("Status is required for user updates."); err.status = 400; throw err;
    }
    task.status = body.status;
  } else {
    const { title, description, priority, status, deadline, assignedTo } = body;
    if (title       !== undefined) task.title       = title;
    if (description !== undefined) task.description = description;
    if (priority    !== undefined) task.priority    = priority;
    if (status      !== undefined) task.status      = status;
    if (deadline    !== undefined) task.deadline    = deadline;
    if (assignedTo  !== undefined) task.assignedTo  = assignedTo;
  }

  return saveTask(task);
};

// ── Delete ──────────────────────────────────────────────────────────────────
export const deleteTaskService = async (id) => {
  const task = await findTaskById(id);
  if (!task) { const err = new Error("Task not found."); err.status = 404; throw err; }
  await removeTask(task);
  return { message: "Task removed." };
};

// ── Notifications ──────────────────────────────────────────────────────────
export const getNotificationsService = async (requestingUser) => {
  const now      = new Date();
  const tomorrow = new Date(); tomorrow.setDate(now.getDate() + 1);
  const yesterday = new Date(); yesterday.setDate(now.getDate() - 1);

  const [criticalTasks, newTasks] = await Promise.all([
    findUpcomingDeadlineTasks(requestingUser._id, now, tomorrow),
    findRecentlyAssignedTasks(requestingUser._id, yesterday)
  ]);

  const notifications = [
    ...criticalTasks.map((t) => ({
      id: t._id, type: "deadline",
      message: `Task "${t.title}" is due soon`, time: t.deadline
    })),
    ...newTasks.map((t) => ({
      id: t._id, type: "new",
      message: `New mission assigned: "${t.title}"`, time: t.createdAt
    }))
  ];

  notifications.sort((a, b) => new Date(b.time) - new Date(a.time));
  return notifications;
};
