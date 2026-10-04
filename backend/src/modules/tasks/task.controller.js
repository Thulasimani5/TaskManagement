// Thin HTTP adapter -- delegates all logic to task.service.js.
import {
  createTaskService,
  getTasksService,
  getTaskByIdService,
  updateTaskService,
  deleteTaskService,
  getNotificationsService
} from "./task.service.js";

export const createTask = async (req, res, next) => {
  try { res.status(201).json(await createTaskService(req.body, req.user)); }
  catch (err) { next(err); }
};

export const getTasks = async (req, res, next) => {
  try { res.json(await getTasksService(req.query, req.user)); }
  catch (err) { next(err); }
};

export const getTaskById = async (req, res, next) => {
  try { res.json(await getTaskByIdService(req.params.id, req.user)); }
  catch (err) { next(err); }
};

export const updateTask = async (req, res, next) => {
  try { res.json(await updateTaskService(req.params.id, req.body, req.user)); }
  catch (err) { next(err); }
};

export const deleteTask = async (req, res, next) => {
  try { res.json(await deleteTaskService(req.params.id)); }
  catch (err) { next(err); }
};

export const getNotifications = async (req, res, next) => {
  try { res.json(await getNotificationsService(req.user)); }
  catch (err) { next(err); }
};
