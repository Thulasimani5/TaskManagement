import { Task } from "../models/Task.js";
import { User } from "../models/User.js";

// Create task (Admin/Lead)
// Create task (Admin/Lead)
export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      status,
      deadline,
      assignedTo,
      assignedToName
    } = req.body;

    if (!title || !deadline) {
      return res.status(400).json({
        message: "Title and deadline are required."
      });
    }

    let targetUserId = assignedTo;

    // Resolve name to ID if provided
    if (assignedToName) {
      const nameToFind = assignedToName.trim();
      const user = await User.findOne({
        name: { $regex: new RegExp(`^${nameToFind}$`, "i") }
      });
      if (!user) {
        return res
          .status(404)
          .json({ message: `User '${nameToFind}' not found.` });
      }
      targetUserId = user._id;
    }

    if (!targetUserId) {
      return res.status(400).json({
        message: "Assigned user is required (ID or Name)."
      });
    }

    const task = await Task.create({
      title,
      description,
      priority,
      status,
      deadline,
      assignedTo: targetUserId,
      createdBy: req.user._id
    });

    // Populate assignedTo for immediate frontend display
    await task.populate("assignedTo", "name email");

    res.status(201).json(task);
  } catch (error) {
    console.error("Create task error:", error.message);
    res.status(500).json({ message: "Server error creating task." });
  }
};

// Get tasks - role-aware
export const getTasks = async (req, res) => {
  try {
    const { status, priority } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // Users can see only their tasks
    if (req.user.role === "user") {
      filter.assignedTo = req.user._id;
    } else {
      // Admin/Lead can see all, or filter by type
      const { type } = req.query;
      if (type === "assigned_to_me") {
        filter.assignedTo = req.user._id;
      } else if (type === "assigned_by_me") {
        filter.createdBy = req.user._id;
        // Strict separation: Team Missions should not include tasks assigned to oneself
        // because those are already in "My Missions"
        filter.assignedTo = { $ne: req.user._id };
      }
    }

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role")
      .sort({ deadline: 1 });

    res.json(tasks);
  } catch (error) {
    console.error("Get tasks error:", error.message);
    res.status(500).json({ message: "Server error fetching tasks." });
  }
};

// Get single task (with role-based access)
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role");

    if (!task) return res.status(404).json({ message: "Task not found." });

    // Users can only view their own tasks
    if (
      req.user.role === "user" &&
      task.assignedTo._id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Forbidden: cannot view this task." });
    }

    res.json(task);
  } catch (error) {
    console.error("Get task by id error:", error.message);
    res.status(500).json({ message: "Server error fetching task." });
  }
};

// Update task (Admin/Lead can update any; User can only update their own status)
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found." });

    const isOwner =
      task.assignedTo.toString() === req.user._id.toString() ||
      task.createdBy.toString() === req.user._id.toString();

    if (req.user.role === "user") {
      if (!isOwner) {
        return res
          .status(403)
          .json({ message: "Forbidden: cannot update this task." });
      }
      // Users can only update status
      const { status } = req.body;
      if (!status) {
        return res
          .status(400)
          .json({ message: "Status is required for user updates." });
      }
      task.status = status;
    } else {
      // Admin/Lead: full update except creator
      const { title, description, priority, status, deadline, assignedTo } =
        req.body;
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (priority !== undefined) task.priority = priority;
      if (status !== undefined) task.status = status;
      if (deadline !== undefined) task.deadline = deadline;
      if (assignedTo !== undefined) task.assignedTo = assignedTo;
    }

    const updated = await task.save();
    res.json(updated);
  } catch (error) {
    console.error("Update task error:", error.message);
    res.status(500).json({ message: "Server error updating task." });
  }
};

// Delete task (Admin/Lead only)
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found." });

    await task.deleteOne();
    res.json({ message: "Task removed." });
  } catch (error) {
    console.error("Delete task error:", error.message);
    res.status(500).json({ message: "Server error deleting task." });
  }
};

// Get user notifications (deadlines & new assignments)
export const getNotifications = async (req, res) => {
  try {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    // 1. Approaching Deadlines (Due within 24h, not completed)
    const criticalTasks = await Task.find({
      assignedTo: req.user._id,
      status: { $ne: "completed" },
      deadline: { $gte: now, $lte: tomorrow }
    }).select("title deadline status");

    // 2. New Assignments (Created in last 24h)
    const newTasks = await Task.find({
      assignedTo: req.user._id,
      createdAt: { $gte: yesterday }
    }).select("title createdAt");

    const notifications = [
      ...criticalTasks.map((t) => ({
        id: t._id,
        type: "deadline",
        message: `Task "${t.title}" is due soon`,
        time: t.deadline
      })),
      ...newTasks.map((t) => ({
        id: t._id,
        type: "new",
        message: `New mission assigned: "${t.title}"`,
        time: t.createdAt
      }))
    ];

    // Sort by time (most recent/urgent first)
    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error.message);
    res.status(500).json({ message: "Server error fetching notifications." });
  }
};
