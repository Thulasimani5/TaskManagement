
import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/User.js";
import { Task } from "../models/Task.js";
import path from "path";
import { fileURLToPath } from "url";

// Config dotev
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("MONGO_URI not found in .env");
    process.exit(1);
}

const sampleTitles = [
    "Fix Critical Bug in Login",
    "Design Home Page Hero Section",
    "Optimize Database Queries",
    "Write API Documentation",
    "Conduct User Interviews",
    "Setup CI/CD Pipeline",
    "Refactor Legacy Codebase",
    "Implement Dark Mode",
    "Create Marketing Email Template",
    "Audit Security Vulnerabilities"
];

const priorities = ["low", "medium", "high", "critical"];
const statuses = ["todo", "in_progress", "completed"];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const payload = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        const users = await User.find();
        if (users.length === 0) {
            console.log("No users found. Please register some users first.");
            process.exit(1);
        }

        const tasks = [];
        for (let i = 0; i < 20; i++) {
            const randomUser = getRandomElement(users);
            const randomCreator = getRandomElement(users);

            tasks.push({
                title: getRandomElement(sampleTitles) + ` ${Math.floor(Math.random() * 100)}`,
                description: "This is a strictly generated task for testing purposes.",
                priority: getRandomElement(priorities),
                status: getRandomElement(statuses),
                deadline: new Date(Date.now() + Math.random() * 10 * 24 * 60 * 60 * 1000), // Next 10 days
                assignedTo: randomUser._id,
                createdBy: randomCreator._id
            });
        }

        await Task.insertMany(tasks);
        console.log(`Successfully seeded ${tasks.length} tasks!`);

        process.exit(0);

    } catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
};

payload();
