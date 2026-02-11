import React, { Suspense } from "react";
import {
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation
} from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Header from "./components/Header.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LoadingSpinner from "./components/LoadingSpinner.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { SearchProvider } from "./context/SearchContext.jsx";

// Lazy load pages
const Login = React.lazy(() => import("./pages/Login.jsx"));
const Register = React.lazy(() => import("./pages/Register.jsx"));
const Dashboard = React.lazy(() => import("./pages/Dashboard.jsx"));
const TaskBoard = React.lazy(() => import("./pages/TaskBoard.jsx"));
const Reports = React.lazy(() => import("./pages/Reports.jsx"));
const TeamDirectory = React.lazy(() => import("./pages/TeamDirectory.jsx"));

const AppShell = () => {
  return (
    <div className="pp-shell">
      <Sidebar />
      <div className="pp-shell-main">
        <Header />
        <main className="pp-shell-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const App = () => {
  const { user } = useAuth();
  const location = useLocation();

  // If already logged in, redirect away from auth pages
  if (user && (location.pathname === "/login" || location.pathname === "/register")) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <SearchProvider>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tasks" element={<TaskBoard />} />
              <Route path="/team" element={<TeamDirectory />} />
              <Route path="/reports" element={<Reports />} />
            </Route>
          </Route>

          <Route
            path="*"
            element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
          />
        </Routes>
      </Suspense>
    </SearchProvider>
  );
};

export default App;

