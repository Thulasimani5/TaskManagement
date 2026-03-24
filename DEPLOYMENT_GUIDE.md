# Deployment Guide (Vercel-only)

This guide explains how to deploy both your **Frontend** and **Backend** on Vercel.

## 1. Backend Deployment (Vercel)

1.  **Go to Vercel**: [vercel.com/new](https://vercel.com/new).
2.  **Import Project**: Select your GitHub repository.
3.  **Project Name**: Set it to something like `task-management-api`.
4.  **Root Directory**: Set this to **`backend`**.
5.  **Environment Variables**:
    - `MONGO_URI`: Your MongoDB Atlas connection string.
    - `JWT_SECRET`: A random secret string.
    - `CLIENT_ORIGIN`: Your **Frontend Vercel URL** (e.g., `https://task-management.vercel.app`).
6.  **Deploy**: Click **Deploy**.

## 2. Frontend Deployment (Vercel)

1.  **Import Project**: Import your GitHub repository again as a *new* project.
2.  **Project Name**: Set it to `task-management-app`.
3.  **Root Directory**: Set this to **`frontend`**.
4.  **Environment Variables**:
    - `VITE_API_URL`: Your **Backend Vercel URL** (e.g., `https://task-management-api.vercel.app`).
5.  **Deploy**: Click **Deploy**.

## 3. Post-Deployment
- Ensure the `CLIENT_ORIGIN` in the Backend settings exactly matches the Frontend URL.
- Ensure the `VITE_API_URL` in the Frontend settings exactly matches the Backend URL.

---
**Note**: Since these are serverless functions, the backend will "spin down" when not in use, making it very cost-effective!
