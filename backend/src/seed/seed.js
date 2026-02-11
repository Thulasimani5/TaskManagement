import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Task } from "../models/Task.js";

dotenv.config();

const runSeed = async () => {
  try {
    await connectDB();

    await User.deleteMany({});
    await Task.deleteMany({});

    const admin = await User.create({
      name: "Admin Aurora",
      email: "admin@purplepulse.dev",
      password: "Admin@123",
      role: "admin"
    });

    const lead = await User.create({
      name: "Lead Lyra",
      email: "lead@purplepulse.dev",
      password: "Lead@123",
      role: "lead"
    });

    const user = await User.create({
      name: "User Orion",
      email: "user@purplepulse.dev",
      password: "User@123",
      role: "user"
    });

    const now = new Date();

    await Task.insertMany([
      {
        title: "Design Task Flow view",
        description: "Craft the main kanban-style Task Flow section.",
        priority: "high",
        status: "in_progress",
        deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        assignedTo: user._id,
        createdBy: lead._id
      },
      {
        title: "Wire up Progress Pulse chart",
        description: "Connect completion metrics to the dashboard chart.",
        priority: "medium",
        status: "todo",
        deadline: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
        assignedTo: user._id,
        createdBy: admin._id
      },
      {
        title: "Configure Deadline Radar alerts",
        description: "Highlight tasks within 24 hours of deadline.",
        priority: "critical",
        status: "todo",
        deadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        assignedTo: user._id,
        createdBy: lead._id
      }
    ]);

    console.log("Seed data created successfully.");
  } catch (error) {
    console.error("Seeding error:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

runSeed();

