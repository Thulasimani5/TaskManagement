
import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/User.js";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

// Config dotev
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("MONGO_URI not found in .env");
    process.exit(1);
}

const users = [
    {
        name: "Admin User",
        email: "admin@example.com",
        password: "password123",
        role: "admin"
    },
    {
        name: "Team Lead",
        email: "lead@example.com",
        password: "password123",
        role: "lead"
    },
    {
        name: "Regular User",
        email: "user@example.com",
        password: "password123",
        role: "user"
    },
    {
        name: "Another User",
        email: "user2@example.com",
        password: "password123",
        role: "user"
    }
];

const seedUsers = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        // Clear existing users? Maybe check if they exist first.
        // For simplicity, let's just create them if they don't exist.

        for (const user of users) {
            const exists = await User.findOne({ email: user.email });
            if (!exists) {
                await User.create(user);
                console.log(`Created user: ${user.email}`);
            } else {
                console.log(`User already exists: ${user.email}`);
            }
        }

        console.log("User seeding completed.");
        process.exit(0);

    } catch (error) {
        console.error("User seeding error:", error);
        process.exit(1);
    }
};

seedUsers();
