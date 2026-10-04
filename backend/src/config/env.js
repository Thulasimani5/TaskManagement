// src/config/env.js
// ① Loads .env file (must be the FIRST import in index.js)
// ② Validates required variables — throws early to prevent silent failures.

import dotenv from "dotenv";
dotenv.config();

const required = ["MONGO_URI", "JWT_SECRET"];

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
});

export const ENV = {
  PORT:           process.env.PORT           || 5000,
  NODE_ENV:       process.env.NODE_ENV       || "development",
  MONGO_URI:      process.env.MONGO_URI,
  JWT_SECRET:     process.env.JWT_SECRET,
  CLIENT_ORIGIN:  process.env.CLIENT_ORIGIN,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d"
};
