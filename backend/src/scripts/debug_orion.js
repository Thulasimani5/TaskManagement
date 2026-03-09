
import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/User.js";
import { Task } from "../models/Task.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI;

const debugOrion = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        const orion = await User.findOne({ name: /Orion/i });
        if (!orion) {
            console.log("User Orion not found");
            process.exit(0);
        }
        console.log(`Found User: ${orion.name} (${orion._id})`);

        const tasks = await Task.find({ assignedTo: orion._id });
        console.log(`Total tasks for Orion: ${tasks.length}`);
        tasks.forEach(t => {
            console.log(`- ${t.title} | Status: ${t.status} | UpdatedAt: ${t.updatedAt}`);
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

debugOrion();
