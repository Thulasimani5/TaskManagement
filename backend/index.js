// index.js — Server entry point for Render/local.
// IMPORTANT: dotenv must be loaded via --env-file or inline import
// BEFORE any other module is parsed. In ESM, all `import` statements
// are hoisted, so a top-level `dotenv.config()` runs AFTER imports.
// Fix: use a dedicated dotenv bootstrap import as the very first import.

import "./src/config/env.js";        // ← validates env vars early
import { connectDB } from "./src/config/db.js";
import createApp     from "./src/app.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`✅ PurplePulse backend running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
