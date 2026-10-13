// Task Mongoose schema -- identical to original models/Task.js.
import mongoose from "mongoose";

const PRIORITIES = ["low", "medium", "high", "critical"];
const STATUSES   = ["todo", "in_progress", "completed", "in_review", "finished"];
const REVIEW_ACTIONS = ["submitted_for_review", "revision_requested", "approved"];

const taskSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    priority:    { type: String, enum: PRIORITIES, default: "medium" },
    status:      { type: String, enum: STATUSES,   default: "todo" },
    deadline:    { type: Date, required: true },
    assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    inProgressAt: { type: Date, default: null },
    completedAt:  { type: Date, default: null },
    reviewedAt:   { type: Date, default: null },
    finishedAt:   { type: Date, default: null },
    reviewedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewFeedback: { type: String, default: "" },
    reviewHistory: [
      {
        action:    { type: String, enum: REVIEW_ACTIONS, required: true },
        feedback:  { type: String, default: "" },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    statusHistory: [
      {
        status: { type: String, enum: STATUSES, required: true },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
      }
    ]
  },
  { timestamps: true }
);

taskSchema.index({ assignedTo: 1, updatedAt: -1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ deadline: 1 });

export const Task = mongoose.model("Task", taskSchema);
export const TASK_PRIORITIES = PRIORITIES;
export const TASK_STATUSES   = STATUSES;

