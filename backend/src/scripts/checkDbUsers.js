
import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/User.js";
import path from "path";
import { fileURLToPath } from "url";

// Config dotev
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI;

const checkUsers = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        const users = await User.find({}, "name email role");
        console.log("--- EXISTING USERS ---");
        users.forEach(u => {
            console.log(`Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`);
        });
        console.log("----------------------");

        process.exit(0);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

checkUsers();
