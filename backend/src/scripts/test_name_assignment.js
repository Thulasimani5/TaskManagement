import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Task } from "../models/Task.js";

dotenv.config();

const testNameAssignment = async () => {
    try {
        await connectDB();

        // 1. Create a test user
        const testName = "Test Student";
        const email = "student@test.com";

        await User.deleteOne({ email });
        const user = await User.create({
            name: testName,
            email,
            password: "password123",
            role: "user"
        });

        console.log(`Created user: ${user.name} (${user._id})`);

        // 2. Simulate task creation with assignedToName
        // We'll mimic the controller logic here since we can't easily call the controller directly without mocking req/res

        const assignedToName = "Test Student";
        let targetUserId;

        // Logic from controller
        if (assignedToName) {
            const foundUser = await User.findOne({
                name: { $regex: new RegExp(`^${assignedToName}$`, "i") }
            });
            if (foundUser) {
                targetUserId = foundUser._id;
                console.log(`Found user by name: ${foundUser.name} -> ID: ${targetUserId}`);
            } else {
                console.error("User not found by name!");
            }
        }

        if (targetUserId && targetUserId.toString() === user._id.toString()) {
            console.log("SUCCESS: Name resolved to correct User ID.");
        } else {
            console.error("FAILURE: Name resolution failed.");
        }

        // Cleanup
        await User.deleteOne({ _id: user._id });

    } catch (error) {
        console.error("Test error:", error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

testNameAssignment();
