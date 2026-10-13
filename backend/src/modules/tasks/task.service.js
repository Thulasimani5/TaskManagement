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
  const { title, description, priority, status = "todo", deadline, assignedTo, assignedToName } = body;

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

  const now = new Date();
  return insertTask({
    title, description, priority, status, deadline,
    assignedTo: targetUserId,
    createdBy: requestingUser._id,
    inProgressAt: status === "in_progress" ? now : null,
    completedAt:  (status === "completed" || status === "in_review" || status === "finished") ? now : null,
    reviewedAt:   status === "finished" ? now : null,
    finishedAt:   status === "finished" ? now : null,
    reviewedBy:   status === "finished" ? requestingUser._id : null,
    statusHistory: [
      {
        status,
        changedAt: now,
        changedBy: requestingUser._id
      }
    ]
  });
};

// ── Read (list) ─────────────────────────────────────────────────────────────
export const getTasksService = (query, requestingUser) => {
  const { status, priority, type } = query;
  const filter = {};

  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  if (requestingUser.role === "user") {
    filter.assignedTo = requestingUser._id;
  } else if (requestingUser.role === "lead") {
    if (type === "assigned_to_me") {
      filter.assignedTo = requestingUser._id;
    } else if (type === "assigned_by_me") {
      filter.createdBy = requestingUser._id;
      filter.assignedTo = { $ne: requestingUser._id };
    } else {
      // Lead sees only their assigned tasks (createdBy) and their own tasks (assignedTo)
      filter.$or = [
        { createdBy: requestingUser._id },
        { assignedTo: requestingUser._id }
      ];
    }
  } else {
    // Admin: sees all tasks unless specific filter query is passed
    if (type === "assigned_to_me") {
      filter.assignedTo = requestingUser._id;
    } else if (type === "assigned_by_me") {
      filter.createdBy = requestingUser._id;
      filter.assignedTo = { $ne: requestingUser._id };
    }
  }

  return findTasks(filter);
};

// ── Read (single) ───────────────────────────────────────────────────────────
export const getTaskByIdService = async (id, requestingUser) => {
  const task = await findTaskById(id);
  if (!task) { const err = new Error("Task not found."); err.status = 404; throw err; }

  if (requestingUser.role === "user") {
    if (task.assignedTo._id.toString() !== requestingUser._id.toString()) {
      const err = new Error("Forbidden: cannot view this task."); err.status = 403; throw err;
    }
  } else if (requestingUser.role === "lead") {
    const isOwner =
      task.assignedTo._id.toString() === requestingUser._id.toString() ||
      task.createdBy._id.toString() === requestingUser._id.toString();
    if (!isOwner) {
      const err = new Error("Forbidden: cannot view this task."); err.status = 403; throw err;
    }
  }

  return task;
};

// ── Helper to apply status transition, timestamps and review rules ──────────
const applyStatusChange = (task, newStatus, requestingUser, reviewFeedback) => {
  if (!newStatus || task.status === newStatus) return;

  const assignedToId = task.assignedTo?._id?.toString() || task.assignedTo?.toString();
  const createdById = task.createdBy?._id?.toString() || task.createdBy?.toString();
  const isSelfAssigned = Boolean(assignedToId && createdById && assignedToId === createdById);

  // Requirement: Self-assigned tasks must NOT pass through in_review status.
  // If attempting to move a self-assigned task to in_review, bypass review directly to completed.
  if (isSelfAssigned && newStatus === "in_review") {
    newStatus = "completed";
  }

  const isAssigner =
    task.createdBy?._id?.toString() === requestingUser._id.toString() ||
    task.createdBy?.toString() === requestingUser._id.toString();
  const isAdmin = requestingUser.role === "admin" || requestingUser.role === "lead";

  // Requirement: Every task in review needs to be reviewed by its mentor/assigner or admin and marked completed/finished
  if ((newStatus === "completed" || newStatus === "finished") && task.status === "in_review") {
    if (!isAssigner && !isAdmin && !isSelfAssigned) {
      const err = new Error("Only the assigner/mentor or admin can review and complete this task.");
      err.status = 403;
      throw err;
    }
  }

  // Requirement: Only assigner/admin can send a reviewed task back for revisions
  if (newStatus === "in_progress" && task.status === "in_review") {
    if (!isAssigner && !isAdmin) {
      const err = new Error("Only the assigner/mentor or admin can request revisions on this task.");
      err.status = 403;
      throw err;
    }
  }

  const now = new Date();
  const previousStatus = task.status;
  task.status = newStatus;

  // Ensure reviewHistory array exists
  if (!Array.isArray(task.reviewHistory)) {
    task.reviewHistory = [];
  }

  if (newStatus === "in_progress") {
    if (!task.inProgressAt) task.inProgressAt = now;
    // If coming back from in_review → revision requested
    if (previousStatus === "in_review") {
      task.reviewHistory.push({
        action: "revision_requested",
        feedback: reviewFeedback || "",
        reviewedBy: requestingUser._id,
        createdAt: now
      });
    }
    task.completedAt = null;
    task.finishedAt = null;
    task.reviewedAt = null;
    task.reviewedBy = null;
    if (reviewFeedback !== undefined) {
      task.reviewFeedback = reviewFeedback;
    }
  } else if (newStatus === "in_review") {
    if (!task.inProgressAt) task.inProgressAt = now;
    // Log the submission for review
    task.reviewHistory.push({
      action: "submitted_for_review",
      feedback: "",
      reviewedBy: requestingUser._id,
      createdAt: now
    });
  } else if (newStatus === "completed" || newStatus === "finished") {
    if (!task.inProgressAt) task.inProgressAt = now;
    task.completedAt = now;
    task.finishedAt = now;
    // Only set review fields if task actually was undergoing review
    if (previousStatus === "in_review") {
      task.reviewedAt = now;
      task.reviewedBy = requestingUser._id;
      if (reviewFeedback !== undefined) {
        task.reviewFeedback = reviewFeedback;
      }
      // Log the approval
      task.reviewHistory.push({
        action: "approved",
        feedback: reviewFeedback || "",
        reviewedBy: requestingUser._id,
        createdAt: now
      });
    }
  } else if (newStatus === "todo") {
    task.completedAt = null;
    task.finishedAt = null;
    task.reviewedAt = null;
    task.reviewedBy = null;
    task.reviewFeedback = "";
  }

  if (!Array.isArray(task.statusHistory)) {
    task.statusHistory = [];
  }

  task.statusHistory.push({
    status: newStatus,
    changedAt: now,
    changedBy: requestingUser._id
  });
};

// ── Update ──────────────────────────────────────────────────────────────────
export const updateTaskService = async (id, body, requestingUser) => {
  const task = await findTaskById(id);
  if (!task) { const err = new Error("Task not found."); err.status = 404; throw err; }

  const isAssignee =
    task.assignedTo._id.toString() === requestingUser._id.toString();
  const isAssigner =
    task.createdBy._id.toString() === requestingUser._id.toString();
  const isAdmin = requestingUser.role === "admin";

  if (requestingUser.role === "user") {
    if (!isAssignee && !isAssigner) {
      const err = new Error("Forbidden: cannot update this task."); err.status = 403; throw err;
    }
    if (!body.status) {
      const err = new Error("Status is required for user updates."); err.status = 400; throw err;
    }
    applyStatusChange(task, body.status, requestingUser, body.reviewFeedback);
  } else {
    const { title, description, priority, status, deadline, assignedTo, assignedToName, reviewFeedback } = body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (deadline !== undefined) task.deadline = deadline;
    if (reviewFeedback !== undefined) task.reviewFeedback = reviewFeedback;

    if (status !== undefined) {
      applyStatusChange(task, status, requestingUser, reviewFeedback);
    }

    // Resolve assignee by name (same logic as createTaskService)
    if (assignedToName) {
      const user = await findUserByName(assignedToName);
      if (!user) {
        const err = new Error(`User '${assignedToName.trim()}' not found.`); err.status = 404; throw err;
      }
      task.assignedTo = user._id;
    } else if (assignedTo !== undefined) {
      task.assignedTo = assignedTo;
    }
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
  const now = new Date();
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
