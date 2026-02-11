import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Sidebar = () => {
  const { user } = useAuth();

  return (
    <aside className="pp-sidebar glassy-surface">
      <div className="pp-sidebar-brand">
        <span className="pp-orbit-dot" />
        <span className="pp-sidebar-title">Pulse Navigator</span>
      </div>

      <nav className="pp-sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `pp-nav-link ${isActive ? "active" : ""}`
          }
        >
          <span className="pp-nav-dot" />
          Overview
        </NavLink>

        <NavLink
          to="/tasks"
          className={({ isActive }) =>
            `pp-nav-link ${isActive ? "active" : ""}`
          }
        >
          <span className="pp-nav-dot" />
          Task Flow
        </NavLink>

        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `pp-nav-link ${isActive ? "active" : ""}`
          }
        >
          <span className="pp-nav-dot" />
          Progress Pulse &amp; Deadline Radar
        </NavLink>

        {user && (user.role === "admin" || user.role === "lead") && (
          <NavLink
            to="/team"
            className={({ isActive }) =>
              `pp-nav-link ${isActive ? "active" : ""}`
            }
          >
            <span className="pp-nav-dot" />
            Team Directory
          </NavLink>
        )}
      </nav>

      {user && (user.role === "admin" || user.role === "lead") && (
        <div className="pp-sidebar-footer">
          <p className="pp-sidebar-caption">Leadership Orbit</p>
          <p className="pp-sidebar-helper">
            You can assign and orchestrate tasks across your constellation.
          </p>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

