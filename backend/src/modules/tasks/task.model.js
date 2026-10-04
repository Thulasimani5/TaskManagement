// Task Mongoose schema -- identical to original models/Task.js.
import mongoose from "mongoose";

const PRIORITIES = ["low", "medium", "high", "critical"];
const STATUSES   = ["todo", "in_progress", "completed"];

const taskSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    priority:    { type: String, enum: PRIORITIES, default: "medium" },
    status:      { type: String, enum: STATUSES,   default: "todo" },
    deadline:    { type: Date, required: true },
    assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

taskSchema.index({ assignedTo: 1, updatedAt: -1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ deadline: 1 });

export const Task = mongoose.model("Task", taskSchema);
export const TASK_PRIORITIES = PRIORITIES;
export const TASK_STATUSES   = STATUSES;
