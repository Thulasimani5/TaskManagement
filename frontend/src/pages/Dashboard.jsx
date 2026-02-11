import React, { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [weeklyRes, tasksRes] = await Promise.all([
          api.get("/reports/weekly"),
          api.get("/tasks")
        ]);
        setSummary(weeklyRes.data);
        setTasks(tasksRes.data);
      } catch (error) {
        console.error("Dashboard fetch error", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const dueSoon = useMemo(() => {
    const now = new Date();
    const next24 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return tasks.filter((t) => {
      const deadline = new Date(t.deadline);
      return deadline >= now && deadline <= next24 && t.status !== "completed";
    });
  }, [tasks]);

  if (loading) {
    return <LoadingSpinner message="Calibrating your PurplePulse..." />;
  }

  return (
    <div className="pp-dashboard">
      <section className="pp-section">
        <div className="pp-section-header">
          <h2>Mission Console</h2>
          <p>
            Welcome back, {user?.name}. Here’s the pulse of your task galaxy.
          </p>
        </div>

        <div className="pp-kpi-grid">
          <div className="pp-kpi-card glassy-surface">
            <p className="pp-kpi-label">Total Tasks</p>
            <p className="pp-kpi-value">{summary?.total ?? 0}</p>
          </div>
          <div className="pp-kpi-card glassy-surface">
            <p className="pp-kpi-label">Completed</p>
            <p className="pp-kpi-value pp-kpi-success">
              {summary?.completed ?? 0}
            </p>
          </div>
          <div className="pp-kpi-card glassy-surface">
            <p className="pp-kpi-label">Progress Pulse</p>
            <div className="pp-progress-bar">
              <div
                className="pp-progress-fill"
                style={{ width: `${summary?.completionRate ?? 0}%` }}
              />
            </div>
            <p className="pp-kpi-footnote">
              {summary?.completionRate ?? 0}% completion this week
            </p>
          </div>
        </div>
      </section>

      <section className="pp-section pp-section-split">
        <div className="pp-card glassy-surface">
          <div className="pp-section-header">
            <h3>Task Flow Snapshot</h3>
            <p>Quick view of where your work is orbiting.</p>
          </div>
          <div className="pp-flow-mini">
            <div>
              <span className="pp-pill status-todo" /> To Do:{" "}
              {summary?.byStatus?.todo ?? 0}
            </div>
            <div>
              <span className="pp-pill status-in-progress" /> In Progress:{" "}
              {summary?.byStatus?.in_progress ?? 0}
            </div>
            <div>
              <span className="pp-pill status-completed" /> Completed:{" "}
              {summary?.byStatus?.completed ?? 0}
            </div>
          </div>
        </div>

        <div className="pp-card glassy-surface">
          <div className="pp-section-header">
            <h3>Deadline Radar</h3>
            <p>Tasks within the next 24 hours.</p>
          </div>
          {dueSoon.length === 0 ? (
            <p className="pp-muted">No critical deadlines in the next orbit.</p>
          ) : (
            <ul className="pp-deadline-list">
              {dueSoon.map((task) => (
                <li key={task._id} className="pp-deadline-item">
                  <div>
                    <p className="pp-deadline-title">{task.title}</p>
                    <p className="pp-deadline-meta">
                      Due{" "}
                      {new Date(task.deadline).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <span className={`pp-status-chip status-${task.status}`}>
                    {task.status.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;

