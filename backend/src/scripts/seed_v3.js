
import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/User.js";
import { Task } from "../models/Task.js";
import path from "path";
import { fileURLToPath } from "url";

// Config dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("MONGO_URI not found in .env");
    process.exit(1);
}

const leadsData = [
    { name: "Lead Alpha", email: "alpha@pp.com", role: "lead" },
    { name: "Lead Beta", email: "beta@pp.com", role: "lead" },
    { name: "Lead Gamma", email: "gamma@pp.com", role: "lead" },
    { name: "Lead Delta", email: "delta@pp.com", role: "lead" },
    { name: "Lead Epsilon", email: "epsilon@pp.com", role: "lead" }
];

const usersData = [
    { name: "User One", email: "user1@pp.com", role: "user" },
    { name: "User Two", email: "user2@pp.com", role: "user" },
    { name: "User Three", email: "user3@pp.com", role: "user" },
    { name: "User Four", email: "user4@pp.com", role: "user" },
    { name: "User Five", email: "user5@pp.com", role: "user" },
    { name: "User Six", email: "user6@pp.com", role: "user" },
    { name: "User Seven", email: "user7@pp.com", role: "user" },
    { name: "User Eight", email: "user8@pp.com", role: "user" },
    { name: "User Nine", email: "user9@pp.com", role: "user" },
    { name: "User Ten", email: "user10@pp.com", role: "user" }
];

const seed = async () => {
    try {
        await mongoose.connect(MONGO_URI, { dbName: "purplepulse" });
        console.log("Connected to MongoDB (purplepulse)");

        const createTaskFor = async (user, maxTasks) => {
            const count = Math.floor(Math.random() * maxTasks) + 1;
            const tasks = [];
            for (let i = 0; i < count; i++) {
                const date = new Date();
                date.setDate(date.getDate() - Math.floor(Math.random() * 7));
                
                tasks.push({
                    title: `Task ${i + 1} for ${user.name}`,
                    description: "Seeded task for leaderboard testing.",
                    status: "completed",
                    priority: "medium",
                    deadline: new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000),
                    assignedTo: user._id,
                    createdBy: user._id,
                    createdAt: date,
                    updatedAt: date
                });
            }
            await Task.insertMany(tasks, { timestamps: false });
            console.log(`Seeded ${count} tasks for ${user.name}`);
        };

        // Seed Leads
        for (const data of leadsData) {
            let user = await User.findOne({ email: data.email });
            if (!user) {
                user = await User.create({ ...data, password: "password123" });
                console.log(`Created Lead: ${data.name}`);
            }
            await createTaskFor(user, 4);
        }

        // Seed Users
        for (const data of usersData) {
            let user = await User.findOne({ email: data.email });
            if (!user) {
                user = await User.create({ ...data, password: "password123" });
                console.log(`Created User: ${data.name}`);
            }
            await createTaskFor(user, 6);
        }

        console.log("Seeding finished successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
};

seed();
