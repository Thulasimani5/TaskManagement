import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/User.js";
import { Task } from "../models/Task.js";

dotenv.config();

const runTest = async () => {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGO_URI, { dbName: "purplepulse" });
    console.log("Connected.");

    // 1. Create Lead User
    const email = `lead_test_${Date.now()}@example.com`;
    const password = "password123";
    console.log(`Creating lead user: ${email}`);
    
    const user = await User.create({
      name: "Test Lead",
      email,
      password,
      role: "lead"
    });
    console.log("User created with ID:", user._id);

    // Verify User Persistence
    const foundUser = await User.findById(user._id);
    if (!foundUser) {
        throw new Error("CRITICAL: User was created but not found in DB immediately after!");
    }
    console.log("User persistence verified.");

    // 2. Create Task as Lead
    console.log("Creating task for lead...");
    const taskData = {
      title: "Test Task from Script",
      description: "This is a test task to verify DB storage.",
      priority: "high",
      status: "todo",
      deadline: new Date(),
      assignedTo: user._id, // Assign to self
      createdBy: user._id
    };

    const task = await Task.create(taskData);
    console.log("Task created with ID:", task._id);

    // 3. Verify Task Persistence
    const foundTask = await Task.findById(task._id);
    if (!foundTask) {
        throw new Error("CRITICAL: Task was created but not found in DB immediately after!");
    }
    console.log("Task persistence verified successfully.");
    console.log("Task details:", foundTask.toObject());

    console.log("TEST PASSED: Data is being stored.");

  } catch (error) {
    console.error("TEST FAILED:", error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
};

runTest();
