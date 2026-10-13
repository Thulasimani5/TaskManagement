import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api";
import { useSearch } from "../context/SearchContext.jsx";
import { HighlightText } from "../utils/HighlightText.jsx";

const STATUS_COLUMNS = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" }
];

const getId = (val) => {
  if (!val) return "";
  if (typeof val === "object") return String(val._id || val.id || "");
  return String(val);
};

const checkIsSelfAssigned = (task, currentUser) => {
  const assignedToId = getId(task?.assignedTo);
  const createdById = getId(task?.createdBy);
  if (assignedToId && createdById && assignedToId === createdById) {
    return true;
  }
  if (currentUser?._id && assignedToId === String(currentUser._id) && (!createdById || createdById === String(currentUser._id))) {
    return true;
  }
  return false;
};

const nextStatus = (status, isSelfAssigned) => {
  if (status === "todo") return "in_progress";
  if (status === "in_progress") return isSelfAssigned ? "completed" : "in_review";
  return "completed";
};

/** Format a Date (or ISO string) to the value expected by datetime-local inputs */
const toDatetimeLocal = (dateVal) => {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d)) return "";
  // "YYYY-MM-DDTHH:MM" — what <input type="datetime-local"> expects
  return d.toISOString().slice(0, 16);
};

const TaskBoard = () => {
  const { user } = useAuth();
  const { searchQuery } = useSearch();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("all_missions");

  // ── Edit modal state ──────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    deadline: "",
    assignedToName: ""
  });

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
      if (viewMode === "my_missions") {
        url += "?type=assigned_to_me";
      } else if (viewMode === "team_missions") {
        url += "?type=assigned_by_me";
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
  }, [viewMode]);

  const roleFilteredTasks = useMemo(() => {
    if (!tasks || !user) return [];
    // Admin sees all tasks across the workflow
    if (user.role === "admin") return tasks;

    // Lead sees ONLY tasks assigned by them or their own tasks
    if (user.role === "lead") {
      return tasks.filter((t) => {
        const aId = t.assignedTo?._id || t.assignedTo;
        const cId = t.createdBy?._id || t.createdBy;
        return (
          String(aId) === String(user._id) ||
          String(cId) === String(user._id)
        );
      });
    }

    return tasks.filter((t) => {
      const aId = t.assignedTo?._id || t.assignedTo;
      return String(aId) === String(user._id);
    });
  }, [tasks, user]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return roleFilteredTasks;
    const lowerQuery = searchQuery.toLowerCase();
    return roleFilteredTasks.filter(
      (t) =>
        (t.title && String(t.title).toLowerCase().includes(lowerQuery)) ||
        (t.description && String(t.description).toLowerCase().includes(lowerQuery))
    );
  }, [roleFilteredTasks, searchQuery]);

  const grouped = useMemo(() => {
    return STATUS_COLUMNS.reduce((acc, col) => {
      acc[col.key] = filteredTasks.filter((t) => {
        if (col.key === "completed") {
          return t.status === "completed" || t.status === "finished";
        }
        if (col.key === "in_progress") {
          return t.status === "in_progress" || t.status === "in_review";
        }
        return t.status === col.key;
      });
      return acc;
    }, {});
  }, [filteredTasks]);

  const handleAdvanceStatus = async (task, customTarget) => {
    const isSelfAssigned = checkIsSelfAssigned(task, user);
    const targetStatus = customTarget || nextStatus(task.status, isSelfAssigned);
    if (targetStatus === task.status) return;

    try {
      const { data } = await api.put(`/tasks/${task._id}`, { status: targetStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? data : t))
      );
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update task status.");
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
      assignedToName: ""
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

  // ── Edit handlers ─────────────────────────────────────────────────────────
  const openEdit = (task) => {
    setEditingTaskId(task._id);
    setEditForm({
      title:          task.title       || "",
      description:    task.description || "",
      priority:       task.priority    || "medium",
      status:         task.status      || "todo",
      deadline:       toDatetimeLocal(task.deadline),
      assignedToName: task.assignedTo?.name || ""
    });
    setEditError("");
    setEditing(true);
  };

  const handleEditFormChange = (e) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setEditError("");
    try {
      const payload = {
        title:          editForm.title,
        description:    editForm.description,
        priority:       editForm.priority,
        status:         editForm.status,
        deadline:       new Date(editForm.deadline),
        assignedToName: editForm.assignedToName || undefined
      };
      const { data } = await api.put(`/tasks/${editingTaskId}`, payload);
      setTasks((prev) =>
        prev.map((t) => (t._id === editingTaskId ? data : t))
      );
      setEditing(false);
    } catch (err) {
      setEditError(
        err?.response?.data?.message || "Failed to update task. Check values."
      );
    } finally {
      setEditSaving(false);
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
                className={`pp-toggle-btn ${viewMode === "all_missions" ? "active" : ""}`}
                onClick={() => setViewMode("all_missions")}
              >
                {user?.role === "admin" ? "All Missions" : "All My & Assigned"}
              </button>
              <button
                className={`pp-toggle-btn ${viewMode === "my_missions" ? "active" : ""}`}
                onClick={() => setViewMode("my_missions")}
              >
                Assigned to Me
              </button>
              <button
                className={`pp-toggle-btn ${viewMode === "team_missions" ? "active" : ""}`}
                onClick={() => setViewMode("team_missions")}
              >
                Assigned by Me
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
                    {task.status === "in_progress" && task.reviewFeedback && (
                      <div className="pp-task-revision-banner">
                        <span className="pp-revision-tag">🔄 Revision Requested</span>
                        <span className="pp-revision-note">"{task.reviewFeedback}"</span>
                      </div>
                    )}
                    {(task.status === "completed" || task.status === "finished") && task.reviewFeedback && (
                      <div className="pp-review-remarks-badge" title="Mentor review remarks">
                        💬 "{task.reviewFeedback}"
                      </div>
                    )}
                    <div className="pp-task-meta">
                      <span className="pp-task-deadline" title="Deadline">
                        📅 {new Date(task.deadline).toLocaleDateString()}
                      </span>
                      {task.assignedTo && (
                        <span className="pp-task-assignee">
                          👤 {task.assignedTo.name || "Unassigned"}
                          {checkIsSelfAssigned(task, user) && (
                            <span className="pp-self-badge" title="Self-assigned (no review required)">
                              Self
                            </span>
                          )}
                        </span>
                      )}
                      {task.inProgressAt && (task.status === "in_progress" || task.status === "in_review") && (
                        <span className="pp-task-timestamp in-progress" title={`Moved to In Progress: ${new Date(task.inProgressAt).toLocaleString()}`}>
                          ⏱️ Started {new Date(task.inProgressAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                      {task.status === "in_review" && (
                        <span className="pp-task-timestamp in-review" title="Awaiting Assigner Review">
                          🔍 Under Review
                        </span>
                      )}
                      {task.status === "finished" && (
                        <span className="pp-task-timestamp finished" title={`Reviewed and Finished: ${task.finishedAt ? new Date(task.finishedAt).toLocaleString() : ''}`}>
                          ✨ Finished
                        </span>
                      )}
                    </div>
                    <div className="pp-task-actions">
                      {(() => {
                        const isAssigner =
                          task.createdBy?._id === user?._id ||
                          task.createdBy === user?._id ||
                          user?.role === "admin";

                        if (task.status === "todo") {
                          return (
                            <button
                              className="pp-btn-ghost"
                              onClick={() => handleAdvanceStatus(task, "in_progress")}
                            >
                              Start Progress →
                            </button>
                          );
                        }

                        if (task.status === "in_progress") {
                          const isSelfAssigned = checkIsSelfAssigned(task, user);

                          if (isSelfAssigned) {
                            return (
                              <button
                                className="pp-btn-finish"
                                onClick={() => handleAdvanceStatus(task, "completed")}
                                title="Move self-assigned mission directly to completed (skips review)"
                              >
                                Move to Complete →
                              </button>
                            );
                          }

                          return (
                            <button
                              className="pp-btn-ghost"
                              onClick={() => handleAdvanceStatus(task, "in_review")}
                            >
                              Submit for Review →
                            </button>
                          );
                        }

                        if (task.status === "in_review") {
                          return (
                            <Link
                              to="/reviews"
                              className="pp-btn-review-link"
                              title="Go to Reviews & Approvals to evaluate or track this task"
                            >
                              Reviews &amp; Approvals →
                            </Link>
                          );
                        }

                        return (
                          <span className="pp-finished-tag">
                            Completed & Verified
                          </span>
                        );
                      })()}

                      {isLeadOrAdmin && (
                        <button
                          className="pp-btn-icon"
                          title="Edit task"
                          onClick={() => openEdit(task)}
                        >
                          ✎
                        </button>
                      )}
                      {isLeadOrAdmin && (
                        <button
                          className="pp-btn-icon"
                          title="Delete task"
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

      {/* ── Edit Task Modal ─────────────────────────────────────────────── */}
      {editing && (
        <div className="pp-modal-backdrop" onClick={() => setEditing(false)}>
          <div
            className="pp-modal glassy-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Edit Mission</h3>
            <p className="pp-muted">
              Update any field below and save to apply changes.
            </p>
            {editError && <div className="pp-alert pp-alert-error">{editError}</div>}
            <form className="pp-modal-form" onSubmit={handleUpdate}>
              <div className="pp-field">
                <label htmlFor="edit-title">Title</label>
                <input
                  id="edit-title"
                  name="title"
                  value={editForm.title}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div className="pp-field">
                <label htmlFor="edit-description">Description</label>
                <textarea
                  id="edit-description"
                  name="description"
                  value={editForm.description}
                  onChange={handleEditFormChange}
                  rows={3}
                />
              </div>
              <div className="pp-field-row">
                <div className="pp-field">
                  <label htmlFor="edit-priority">Priority</label>
                  <select
                    id="edit-priority"
                    name="priority"
                    value={editForm.priority}
                    onChange={handleEditFormChange}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="pp-field">
                  <label htmlFor="edit-status">Status</label>
                  <select
                    id="edit-status"
                    name="status"
                    value={editForm.status}
                    onChange={handleEditFormChange}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="pp-field">
                <label htmlFor="edit-deadline">Deadline</label>
                <input
                  id="edit-deadline"
                  name="deadline"
                  type="datetime-local"
                  value={editForm.deadline}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div className="pp-field">
                <label htmlFor="edit-assignedToName">Assign To (User Name)</label>
                <input
                  id="edit-assignedToName"
                  name="assignedToName"
                  value={editForm.assignedToName}
                  onChange={handleEditFormChange}
                  placeholder="Enter exact user name"
                />
                <small className="pp-muted">
                  Leave blank to keep current assignee.
                </small>
              </div>
              <div className="pp-modal-actions">
                <button
                  type="button"
                  className="pp-btn-ghost"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pp-btn-primary"
                  disabled={editSaving}
                >
                  {editSaving ? "Saving..." : "Save Changes"}
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
