
import mongoose from "mongoose";
import { Task } from "./src/models/Task.js";
import { User } from "./src/models/User.js";

const MONGO_URI = "mongodb+srv://thulasimanidcb23_db_user:12345@cluster0.z4h78gw.mongodb.net/?appName=Cluster0";

async function verifyTaskSeparation() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        // Clean up test data if exists
        await Task.deleteMany({ title: /^VERIFY_/ });
        await User.deleteMany({ email: /^verify_/ });

        // Create unique timestamp for this run
        const ts = Date.now();

        // 1. Create Users
        const lyra = await User.create({
            name: `Lead Lyra ${ts}`,
            email: `verify_lyra_${ts}@example.com`,
            password: "password123",
            role: "lead"
        });
        const orion = await User.create({
            name: `User Orion ${ts}`,
            email: `verify_orion_${ts}@example.com`,
            password: "password123",
            role: "user"
        });
        const admin = await User.create({
            name: `Admin ${ts}`,
            email: `verify_admin_${ts}@example.com`,
            password: "password123",
            role: "admin"
        });

        console.log("Created test users.");

        // 2. Create Tasks
        const tasks = [
            // Task A: Admin -> Lyra (Should be in Lyra's "My Missions")
            { title: `VERIFY_Task_A_${ts}`, assignedTo: lyra._id, createdBy: admin._id, deadline: new Date() },
            // Task B: Lyra -> Lyra (Should be in Lyra's "My Missions")
            { title: `VERIFY_Task_B_${ts}`, assignedTo: lyra._id, createdBy: lyra._id, deadline: new Date() },
            // Task C: Lyra -> Orion (Should be in Lyra's "Team Missions")
            { title: `VERIFY_Task_C_${ts}`, assignedTo: orion._id, createdBy: lyra._id, deadline: new Date() },
            // Task D: Orion -> Orion (Should be in neither for Lyra's specific views, unless general admin view)
            { title: `VERIFY_Task_D_${ts}`, assignedTo: orion._id, createdBy: orion._id, deadline: new Date() }
        ];

        await Task.insertMany(tasks);
        console.log("Created test tasks.");

        // 3. Verify Logic

        // Simulate "My Missions" (assigned_to_me)
        const myMissionsFilter = { assignedTo: lyra._id };
        const myMissions = await Task.find(myMissionsFilter);
        console.log("\n--- My Missions (assigned_to_me) ---");
        console.log("Expected: Task A, Task B");
        console.log("Found:", myMissions.map(t => t.title));

        // Simulate "Team Missions" (assigned_by_me)
        const teamMissionsFilter = {
            createdBy: lyra._id,
            assignedTo: { $ne: lyra._id } // Strict separation logic
        };
        const teamMissions = await Task.find(teamMissionsFilter);
        console.log("\n--- Team Missions (assigned_by_me) ---");
        console.log("Expected: Task C only");
        console.log("Found:", teamMissions.map(t => t.title));

        // Cleanup
        await Task.deleteMany({ title: /^VERIFY_/ });
        await User.deleteMany({ email: /^verify_/ });
        console.log("\nCleanup complete.");

        await mongoose.disconnect();
    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
}

verifyTaskSeparation();
