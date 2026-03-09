
import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/User.js";
import path from "path";
import { fileURLToPath } from "url";

// Config dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI;

const indianNames = [
    "Aarav Sharma", "Aditya Patel", "Akash Gupta", "Ananya Iyer", "Arjun Reddy",
    "Bhavya Singh", "Chaitanya Rao", "Deepak Kumar", "Divya Nair", "Esha Joshi",
    "Gautam Menon", "Hema Malini", "Ishaan Kapoor", "Jaya Lakshmi", "Karan Malhotra",
    "Lavanya Deshmukh", "Madhav Prasad", "Meera Krishnan", "Naveen Raj", "Pooja Hegde",
    "Rahul Dravid", "Riya Sen", "Sanjay Dutt", "Sneha Patil", "Tarun Khanna",
    "Urvashi Rautela", "Vijay Kumar", "Yamini Reddy", "Zoya Akhtar", "Abhishek Bachchan",
    "Priyanka Chopra", "Ranveer Singh", "Deepika Padukone", "Ayushmann Khurrana", "Kiara Advani"
];

const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const rename = async () => {
    try {
        await mongoose.connect(MONGO_URI, { dbName: "purplepulse" });
        console.log("Connected to MongoDB (purplepulse)");

        const users = await User.find();
        console.log(`Found ${users.length} users to rename.`);

        const names = shuffle([...indianNames]);
        
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const newName = names[i % names.length];
            
            // Maintain original "Admin" or "Lead" flavor if it exists in the name, 
            // but the user said "change name as some indian name".
            // Let's just use the Indian names directly as requested.
            
            await User.findByIdAndUpdate(user._id, { name: newName });
            console.log(`Renamed: '${user.name}' -> '${newName}'`);
        }

        console.log("Renaming finished successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Renaming error:", error);
        process.exit(1);
    }
};

rename();
