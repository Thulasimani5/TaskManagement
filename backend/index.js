import dotenv from "dotenv";
dotenv.config();

import createApp from "./src/app.js";
import { connectDB } from "./src/config/db.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`PurplePulse backend running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
