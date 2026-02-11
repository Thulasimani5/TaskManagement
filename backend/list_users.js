
import mongoose from "mongoose";
import { User } from "./src/models/User.js";

const MONGO_URI = "mongodb+srv://thulasimanidcb23_db_user:12345@cluster0.z4h78gw.mongodb.net/?appName=Cluster0";

async function listUsers() {
    try {
        await mongoose.connect(MONGO_URI, { dbName: "purplepulse" });
        console.log("Connected to MongoDB.\n");

        const users = await User.find({}, "name email role");

        // console.log("--- User Registry ---");
        // console.log(JSON.stringify(users, null, 2));
        fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
        console.log("Users written to users.json");

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

listUsers();
