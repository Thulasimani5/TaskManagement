import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";

dotenv.config();

import fs from "fs";
import path from "path";

const listUsers = async () => {
    try {
        await connectDB();
        const users = await User.find({});

        let output = "--- Registered Users ---\n";
        users.forEach(u => {
            output += `Name: '${u.name}', Email: ${u.email}, Role: ${u.role}, ID: ${u._id}\n`;
        });
        output += "------------------------\n";

        fs.writeFileSync(path.join(process.cwd(), "users_dump.txt"), output);
        console.log("Users written to users_dump.txt");
    } catch (error) {
        console.error("Error listing users:", error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

listUsers();
