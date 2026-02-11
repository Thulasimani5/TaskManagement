import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Task } from "../models/Task.js";
import { createTask } from "../controllers/taskController.js";
import fs from "fs";
import path from "path";

// We can't easily call controller directly without mocking req/res, so we will reimplement the logic 
// or just use a pure script logic that mimics the controller exactly.

dotenv.config();

const debugAssignment = async () => {
    try {
        let logBuffer = "";
        const log = (msg) => { console.log(msg); logBuffer += msg + "\n"; };
        const error = (msg) => { console.error(msg); logBuffer += "ERROR: " + msg + "\n"; };

        await connectDB();
        log("Connected to DB");

        // 1. Find the users
        const lead = await User.findOne({ name: "Test Lead" });
        const userOrion = await User.findOne({ name: "User Orion" }); // Try fuzzy match if exact fails?

        if (!lead) error("Could not find Test Lead");
        if (!userOrion) {
            log("Could not find 'User Orion' exact match. Trying case insensitive...");
            const fuzzy = await User.findOne({ name: { $regex: new RegExp("^User Orion$", "i") } });
            if (fuzzy) log(`Found via fuzzy: ${fuzzy.name}`);
            else error("Could not find User Orion at all");
        }

        if (lead && userOrion) {
            log(`Found Lead: ${lead.name} (${lead._id})`);
            log(`Found Target: ${userOrion.name} (${userOrion._id})`);

            // 2. Simulate the controller logic for resolving name
            const assignedToName = "User Orion";
            const assignedToNameTrimmed = assignedToName.trim();

            log(`Attempting to find user with regex: ^${assignedToNameTrimmed}$`);

            const foundUser = await User.findOne({
                name: { $regex: new RegExp(`^${assignedToNameTrimmed}$`, "i") }
            });

            if (foundUser) {
                log("SUCCESS: User found by name via Regex.");
                if (foundUser._id.toString() === userOrion._id.toString()) {
                    log("ID Match verified.");
                } else {
                    error("ID Mismatch!");
                }
            } else {
                error("FAILURE: User NOT found by name via Regex.");
            }

            // 3. Check for trailing space issue
            const nameWithSpace = "User Orion ";
            log(`Testing with trailing space: '${nameWithSpace}'`);
            const foundSpace = await User.findOne({
                name: { $regex: new RegExp(`^${nameWithSpace.trim()}$`, "i") }
            });
            log(`Result after trim: ${foundSpace ? "Found" : "Not Found"}`);
        }

        fs.writeFileSync(path.join(process.cwd(), "debug_result.txt"), logBuffer);
        console.log("Written to debug_result.txt");

    } catch (err) {
        console.error("Debug error:", err);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

debugAssignment();
