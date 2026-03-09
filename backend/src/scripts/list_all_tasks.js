
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI;

const listAllTasks = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        const tasks = await Task.find().populate('assignedTo', 'name');
        const users = await User.find({}, 'name');

        let output = "--- ALL TASKS ---\n";
        tasks.forEach(t => {
            output += `Title: ${t.title} | AssignedTo: ${t.assignedTo ? t.assignedTo.name : 'Unassigned'} (${t.assignedTo ? t.assignedTo._id : ''}) | Status: ${t.status}\n`;
        });

        output += "\n--- ALL USERS ---\n";
        users.forEach(u => {
            output += `Name: ${u.name} | ID: ${u._id}\n`;
        });

        fs.writeFileSync(path.join(process.cwd(), "all_tasks_debug.txt"), output);
        process.exit(0);
    } catch (error) {
        fs.writeFileSync(path.join(process.cwd(), "all_tasks_error.txt"), error.stack);
        process.exit(1);
    }
};

listAllTasks();
