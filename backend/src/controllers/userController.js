import { User } from "../models/User.js";

// @desc    Get all users (for Admin/Lead directory)
// @route   GET /api/users
// @access  Private (Admin/Lead only)
export const getAllUsers = async (req, res) => {
    console.log("GET /api/users request received");
    try {
        // Fetch all users, selecting only necessary fields
        // Sort by role (leads first) then name
        const users = await User.find({}, "name email role")
            .sort({ role: 1, name: 1 });
        console.log(`Fetched ${users.length} users`);

        res.json(users);
    } catch (error) {
        console.error("Get users error:", error.message);
        res.status(500).json({ message: "Server error fetching users." });
    }
};
