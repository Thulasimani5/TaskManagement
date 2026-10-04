// Thin HTTP adapter: parse req -> call service -> send res.
import { registerUser, loginUser } from "./auth.service.js";

export const register = async (req, res, next) => {
  try {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);
    res.json(result);
  } catch (err) { next(err); }
};

/** GET /api/auth/me -- user is already attached by protect middleware */
export const getMe = (req, res) => res.json({ user: req.user });
