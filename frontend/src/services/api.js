import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api"
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("pp_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

export const api = {
  get: (url, config) => axiosInstance.get(url, config),
  post: (url, data, config) => axiosInstance.post(url, data, config),
  put: (url, data, config) => axiosInstance.put(url, data, config),
  delete: (url, config) => axiosInstance.delete(url, config),

  login: (credentials) => axiosInstance.post("/auth/login", credentials),
  register: (userData) => axiosInstance.post("/auth/register", userData),

  getTasks: () => axiosInstance.get("/tasks"),
  createTask: (taskData) => axiosInstance.post("/tasks", taskData),
  updateTask: (id, updates) => axiosInstance.put(`/tasks/${id}`, updates),
  deleteTask: (id) => axiosInstance.delete(`/tasks/${id}`),

  getUsers: () => axiosInstance.get("/users"),
};

export default api;
