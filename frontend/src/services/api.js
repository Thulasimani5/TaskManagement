import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api"
});

// Attach JWT automatically
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("pp_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Simple error logging
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can add centralized error handling here if needed
    console.error("API Error:", error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

// API methods
export const api = {
  // Pass-through for custom calls if needed
  get: (url, config) => axiosInstance.get(url, config),
  post: (url, data, config) => axiosInstance.post(url, data, config),
  put: (url, data, config) => axiosInstance.put(url, data, config),
  delete: (url, config) => axiosInstance.delete(url, config),

  // Auth endpoints
  login: (credentials) => axiosInstance.post("/auth/login", credentials),
  register: (userData) => axiosInstance.post("/auth/register", userData),

  // Task endpoints
  getTasks: () => axiosInstance.get("/tasks"),
  createTask: (taskData) => axiosInstance.post("/tasks", taskData),
  updateTask: (id, updates) => axiosInstance.put(`/tasks/${id}`, updates),
  deleteTask: (id) => axiosInstance.delete(`/tasks/${id}`),

  // User endpoints
  getUsers: () => axiosInstance.get("/users"),
};

export default api;
