
import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Header from "./components/Header.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import TaskBoard from "./pages/TaskBoard.jsx";
import Reports from "./pages/Reports.jsx";
import TeamDirectory from "./pages/TeamDirectory.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import { SearchProvider } from "./context/SearchContext.jsx";

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
  return (
    <SearchProvider>
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

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </SearchProvider>
  );
};

export default App;
