# PurplePulse Task Management

PurplePulse is a digital task monitoring dashboard.

## Structure

- `backend/`: Node.js/Express server (Connects to MongoDB)
- `frontend/`: React/Vite dashboard

## Deployment on Render

### Backend (Web Service)
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Frontend (Static Site)
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

## Environment Variables

### Frontend
- `VITE_API_URL`: URL of your deployed backend (e.g., `https://your-backend.onrender.com/api`)
