
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Task } from "../models/Task.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI;
const ORION_ID = "6986ddaa7283dc318a9c3fa4";

const verifyOrionReport = async () => {
    try {
        await mongoose.connect(MONGO_URI, { dbName: "purplepulse" });

        const now = new Date();
        const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days

        const pipeline = [
            {
                $match: {
                    assignedTo: new mongoose.Types.ObjectId(ORION_ID),
                    $or: [
                        { updatedAt: { $gte: since } },
                        { status: { $ne: "completed" } }
                    ]
                }
            },
            {
                $facet: {
                    total: [{ $count: "count" }],
                    byStatus: [
                        { $group: { _id: "$status", count: { $sum: 1 } } }
                    ]
                }
            }
        ];

        const result = await Task.aggregate(pipeline);
        const data = result[0];
        const total = data.total[0] ? data.total[0].count : 0;

        const byStatus = { todo: 0, in_progress: 0, completed: 0 };
        data.byStatus.forEach(item => {
            byStatus[item._id] = item.count;
        });

        let output = `--- ORION REPORT VERIFICATION ---\n`;
        output += `Total Count in Pulse: ${total} (Expected: 4)\n`;
        output += `By Status: ${JSON.stringify(byStatus)}\n`;
        output += `Specifically:\n`;
        output += `- Todo: ${byStatus.todo} (Expected: 2)\n`;
        output += `- In Progress: ${byStatus.in_progress} (Expected: 1)\n`;
        output += `- Completed: ${byStatus.completed} (Expected: 1)\n`;

        fs.writeFileSync(path.join(process.cwd(), "orion_verification.txt"), output);
        process.exit(0);
    } catch (error) {
        fs.writeFileSync(path.join(process.cwd(), "orion_verification_error.txt"), error.stack);
        process.exit(1);
    }
};

verifyOrionReport();
