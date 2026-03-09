
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
const ORION_ID = "6986ddaa7283dc318a9c3fa4";

const checkOrionTasks = async () => {
    try {
        await mongoose.connect(MONGO_URI, { dbName: "purplepulse" });
        console.log("Connected to MongoDB (purplepulse)");

        const tasks = await Task.find({ assignedTo: ORION_ID });
        let output = `--- TASKS FOR ORION (${ORION_ID}) ---\n`;
        output += `Total: ${tasks.length}\n`;
        tasks.forEach(t => {
            output += `Title: ${t.title} | Status: ${t.status} | UpdatedAt: ${t.updatedAt}\n`;
        });

        const now = new Date();
        output += `\nCurrent Time: ${now}\n`;
        output += `Weekly Since (7d): ${new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)}\n`;
        output += `Daily Since (24h): ${new Date(now.getTime() - 24 * 60 * 60 * 1000)}\n`;

        fs.writeFileSync(path.join(process.cwd(), "orion_tasks_fixed.txt"), output);
        process.exit(0);
    } catch (error) {
        fs.writeFileSync(path.join(process.cwd(), "orion_tasks_error.txt"), error.stack);
        process.exit(1);
    }
};

checkOrionTasks();
