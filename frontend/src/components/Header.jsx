import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useSearch } from "../context/SearchContext.jsx";
import { api } from "../services/api";
import { FiSearch, FiMoon, FiSun, FiBell, FiAlertCircle, FiCheckCircle } from "react-icons/fi";

const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { searchQuery, setSearchQuery } = useSearch();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const res = await api.get("/tasks/notifications");
          setNotifications(res.data);
        } catch (err) {
          console.error("Failed to fetch notifications");
        }
      };
      fetchNotifications();

      // Poll every 5 minutes
      const interval = setInterval(fetchNotifications, 300000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="pp-header glassy-surface">
      <div className="pp-header-left">
        <div className="pp-logo-mark">PP</div>
        <div>
          <h1 className="pp-header-title">PurplePulse</h1>
          <p className="pp-header-subtitle">Digital Task Monitoring Dashboard</p>
        </div>

        {user && (
          <div className="pp-search-container">
            <FiSearch className="pp-search-icon" />
            <input
              type="text"
              placeholder="Search missions..."
              className="pp-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="pp-header-right">
        <button className="pp-btn-icon" onClick={toggleTheme} title="Toggle Theme">
          {theme === "light" ? <FiMoon /> : <FiSun />}
        </button>

        {user && (
          <div className="pp-notification-wrapper" ref={dropdownRef}>
            <button
              className="pp-btn-icon pp-notification-btn"
              onClick={() => setShowDropdown(!showDropdown)}
              title="Notifications"
            >
              <FiBell />
              {notifications.length > 0 && (
                <span className="pp-notification-badge">{notifications.length}</span>
              )}
            </button>

            {showDropdown && (
              <div className="pp-notification-dropdown glassy-surface pp-animate-slide-up">
                <div className="pp-dropdown-header">
                  <h4>Notifications</h4>
                  {notifications.length > 0 && <span className="pp-badge-count">{notifications.length} new</span>}
                </div>
                <div className="pp-dropdown-list">
                  {notifications.length > 0 ? (
                    notifications.map((note) => (
                      <div key={note.id} className={`pp-notification-item ${note.type}`}>
                        <div className="pp-note-icon">
                          {note.type === 'deadline' ? <FiAlertCircle /> : <FiCheckCircle />}
                        </div>
                        <div className="pp-note-content">
                          <p className="pp-note-msg">{note.message}</p>
                          <span className="pp-note-time">
                            {new Date(note.time).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="pp-notification-empty">
                      <p>All caught up! No new alerts.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {user && (
          <>
            <div className="pp-user-meta">
              <span className="pp-user-name">{user.name}</span>
              <span className={`pp-role-pill role-${user.role}`}>
                {user.role === "admin"
                  ? "Admin Conductor"
                  : user.role === "lead"
                    ? "Team Lead Nebula"
                    : "Task Voyager"}
              </span>
            </div>
            <button className="pp-btn-outline" onClick={logout}>
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;

