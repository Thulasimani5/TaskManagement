import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api";
import { useSearch } from "../context/SearchContext.jsx";
import { HighlightText } from "../utils/HighlightText.jsx";

const STATUS_COLUMNS = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" }
];

const nextStatus = (status) => {
  if (status === "todo") return "in_progress";
  if (status === "in_progress") return "completed";
  return "completed";
};

const TaskBoard = () => {
  const { user } = useAuth();
  const { searchQuery } = useSearch();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("my_missions"); // 'my_missions' | 'team_missions'

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    deadline: "",
    assignedToName: ""
  });

  const isLeadOrAdmin = user?.role === "admin" || user?.role === "lead";

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let url = "/tasks";
      if (isLeadOrAdmin) {
        if (viewMode === "my_missions") {
          url += "?type=assigned_to_me";
        } else {
          url += "?type=assigned_by_me";
        }
      }

      const { data } = await api.get(url);
      setTasks(data);
    } catch (err) {
      console.error("Fetch tasks error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [viewMode]); // Refetch when viewMode changes

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks;
    const lowerQuery = searchQuery.toLowerCase();
    return tasks.filter(
      (t) =>
        (t.title && String(t.title).toLowerCase().includes(lowerQuery)) ||
        (t.description && String(t.description).toLowerCase().includes(lowerQuery))
    );
  }, [tasks, searchQuery]);

  const grouped = useMemo(() => {
    return STATUS_COLUMNS.reduce((acc, col) => {
      acc[col.key] = filteredTasks.filter((t) => t.status === col.key);
      return acc;
    }, {});
  }, [filteredTasks]);

  const handleAdvanceStatus = async (task) => {
    const targetStatus = nextStatus(task.status);
    if (targetStatus === task.status) return;

    try {
      await api.put(`/tasks/${task._id}`, { status: targetStatus });
      setTasks((prev) =>
        prev.map((t) =>
          t._id === task._id ? { ...t, status: targetStatus } : t
        )
      );
    } catch (err) {
      console.error("Update status error", err);
    }
  };

  const openCreate = () => {
    setForm({
      title: "",
      description: "",
      priority: "medium",
      status: "todo",
      deadline: "",
      deadline: "",
      assignedToName: "" // Default to empty for manual entry
    });
    setError("");
    setCreating(true);
  };

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      // If no name provided, default to current user
      const payload = { ...form };
      if (!payload.assignedToName) {
        payload.assignedTo = user._id;
      }

      const { data } = await api.post("/tasks", {
        ...payload,
        deadline: new Date(form.deadline)
      });
      setTasks((prev) => [...prev, data]);
      setCreating(false);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to create task. Check values."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task from the galaxy?")) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error("Delete task error", err);
    }
  };

  if (loading) {
    return (
      <div className="pp-dashboard-loading">
        <div className="pp-orbit-loader" />
        <p>Mapping your Task Flow...</p>
      </div>
    );
  }

  return (
    <div className={`pp-taskboard ${viewMode === 'team_missions' ? 'theme-team-missions' : ''}`}>
      <div className="pp-section-header">
        <div>
          <h2>Task Flow</h2>
          <p>Visual lane for every mission in your orbit.</p>
        </div>
        <div className="pp-header-actions">
          {isLeadOrAdmin && (
            <div className="pp-view-toggle">
              <button
                className={`pp-toggle-btn ${viewMode === "my_missions" ? "active" : ""}`}
                onClick={() => setViewMode("my_missions")}
              >
                My Missions
              </button>
              <button
                className={`pp-toggle-btn ${viewMode === "team_missions" ? "active" : ""}`}
                onClick={() => setViewMode("team_missions")}
              >
                Team Missions
              </button>
            </div>
          )}
          {isLeadOrAdmin && (
            <button className="pp-btn-primary" onClick={openCreate}>
              New Mission
            </button>
          )}
        </div>
      </div>

      <div className="pp-taskboard-grid">
        {STATUS_COLUMNS.map((column) => (
          <div key={column.key} className="pp-task-column glassy-surface">
            <div className="pp-task-column-header">
              <h3>{column.label}</h3>
              <span className={`pp-column-pill status-${column.key}`}>
                {grouped[column.key]?.length ?? 0}
              </span>
            </div>
            <div className="pp-task-column-body">
              {grouped[column.key]?.length === 0 ? (
                <p className="pp-muted">No tasks in this lane yet.</p>
              ) : (
                grouped[column.key].map((task) => (
                  <article key={task._id} className="pp-task-card">
                    <header className="pp-task-card-header">
                      <span
                        className={`pp-priority-dot priority-${task.priority}`}
                      />
                      <h4>
                        <HighlightText text={task.title} highlight={searchQuery} />
                      </h4>
                    </header>
                    {task.description && (
                      <p className="pp-task-description">
                        <HighlightText text={task.description} highlight={searchQuery} />
                      </p>
                    )}
                    <div className="pp-task-meta">
                      <span className="pp-task-deadline">
                        {new Date(task.deadline).toLocaleDateString()}
                      </span>
                      {task.assignedTo && (
                        <span className="pp-task-assignee">
                          {task.assignedTo.name || "Unassigned"}
                        </span>
                      )}
                    </div>
                    <div className="pp-task-actions">
                      {task.status !== "completed" && (
                        <button
                          className="pp-btn-ghost"
                          onClick={() => handleAdvanceStatus(task)}
                        >
                          Move to {nextStatus(task.status).replace("_", " ")}
                        </button>
                      )}
                      {isLeadOrAdmin && (
                        <button
                          className="pp-btn-icon"
                          onClick={() => handleDelete(task._id)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {creating && (
        <div className="pp-modal-backdrop" onClick={() => setCreating(false)}>
          <div
            className="pp-modal glassy-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Create New Mission</h3>
            <p className="pp-muted">
              Only Admin Conductors and Team Lead Nebulas can assign tasks.
            </p>
            {error && <div className="pp-alert pp-alert-error">{error}</div>}
            <form className="pp-modal-form" onSubmit={handleCreate}>
              <div className="pp-field">
                <label htmlFor="title">Title</label>
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="pp-field">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={3}
                />
              </div>
              <div className="pp-field-row">
                <div className="pp-field">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    name="priority"
                    value={form.priority}
                    onChange={handleFormChange}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="pp-field">
                  <label htmlFor="deadline">Deadline</label>
                  <input
                    id="deadline"
                    name="deadline"
                    type="datetime-local"
                    value={form.deadline}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>
              <div className="pp-field">
                <label htmlFor="assignedToName">
                  Assign To (User Name)
                </label>
                <input
                  id="assignedToName"
                  name="assignedToName"
                  value={form.assignedToName}
                  onChange={handleFormChange}
                  placeholder="Enter exact user name (e.g. User Orion)"
                  required
                />
                <small className="pp-muted">
                  Leave empty to assign to yourself ({user?.name}).
                </small>
              </div>
              <div className="pp-modal-actions">
                <button
                  type="button"
                  className="pp-btn-ghost"
                  onClick={() => setCreating(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pp-btn-primary"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
