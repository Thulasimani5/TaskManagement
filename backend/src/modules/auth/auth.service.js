// Business logic for registration and login.
import jwt from "jsonwebtoken";
import { USER_ROLES } from "./auth.model.js";
import { findUserByEmail, createUser } from "./auth.repository.js";

const generateToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });

const buildUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
});

export const registerUser = async ({ name, email, password, role }) => {
  if (!name || !email || !password) {
    const err = new Error("Name, email and password are required.");
    err.status = 400; throw err;
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    const err = new Error("Email already registered.");
    err.status = 409; throw err;
  }

  const finalRole = role && USER_ROLES.includes(role) ? role : "user";
  const user = await createUser({ name, email, password, role: finalRole });
  const token = generateToken(user._id, user.role);
  return { token, user: buildUserPayload(user) };
};

export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    const err = new Error("Email and password are required.");
    err.status = 400; throw err;
  }

  const user = await findUserByEmail(email);
  if (!user || !(await user.matchPassword(password))) {
    const err = new Error("Invalid credentials.");
    err.status = 401; throw err;
  }

  const token = generateToken(user._id, user.role);
  return { token, user: buildUserPayload(user) };
};
