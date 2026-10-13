import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api";
import { useSearch } from "../context/SearchContext.jsx";
import { HighlightText } from "../utils/HighlightText.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import {
  FiCheckCircle,
  FiClock,
  FiMessageSquare,
  FiUser,
  FiCalendar,
  FiSend,
  FiRotateCcw,
  FiAward,
  FiCheck,
  FiArchive,
  FiRefreshCw
} from "react-icons/fi";

/* ── Timeline Action Configurations ───────────────────────────────────────── */
const ACTION_CONFIG = {
  submitted_for_review: {
    label: "Submitted for Review",
    icon: <FiSend size={13} />,
    color: "#fee440",
    bgColor: "rgba(254, 228, 64, 0.12)"
  },
  revision_requested: {
    label: "Revision Requested",
    icon: <FiRotateCcw size={13} />,
    color: "#f15bb5",
    bgColor: "rgba(241, 91, 181, 0.12)"
  },
  approved: {
    label: "Approved & Completed",
    icon: <FiAward size={13} />,
    color: "#00f5d4",
    bgColor: "rgba(0, 245, 212, 0.12)"
  }
};

/* ── Timeline Component ───────────────────────────────────────────────────── */
const ReviewTimeline = ({ history }) => {
  if (!history || history.length === 0) return null;

  return (
    <div className="pp-review-timeline">
      <div className="pp-timeline-header">
        <FiClock size={13} />
        <span>Review History Audit Trail ({history.length} event{history.length !== 1 ? "s" : ""})</span>
      </div>
      <div className="pp-timeline-track">
        {history.map((entry, idx) => {
          const cfg = ACTION_CONFIG[entry.action] || ACTION_CONFIG.submitted_for_review;
          const isLast = idx === history.length - 1;
          return (
            <div key={idx} className={`pp-timeline-entry ${isLast ? "is-latest" : ""}`}>
              <div className="pp-timeline-dot-col">
                <div
                  className="pp-timeline-dot"
                  style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.color}55` }}
                />
                {!isLast && <div className="pp-timeline-connector" />}
              </div>
              <div className="pp-timeline-content" style={{ background: cfg.bgColor }}>
                <div className="pp-timeline-content-header">
                  <span className="pp-timeline-action-label" style={{ color: cfg.color }}>
                    {cfg.icon} {cfg.label}
                  </span>
                  <span className="pp-timeline-date">
                    {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
                <div className="pp-timeline-by">
                  <FiUser size={11} />
                  {entry.reviewedBy?.name || "System"}
                </div>
                {entry.feedback && (
                  <p className="pp-timeline-feedback">"{entry.feedback}"</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Main Component ───────────────────────────────────────────────────────── */
const TaskReviews = () => {
  const { user } = useAuth();
  const { searchQuery } = useSearch();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("waiting"); // 'waiting' | 'history'
  const [historyFilter, setHistoryFilter] = useState("all"); // 'all' | 'in_progress' | 'completed'
  const [feedbackMap, setFeedbackMap] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  const isLeadOrAdmin = user?.role === "admin" || user?.role === "lead";

  const fetchTasks = async () => {
    try {
      const { data } = await api.get("/tasks");
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch review tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleFeedbackChange = (taskId, text) => {
    setFeedbackMap((prev) => ({ ...prev, [taskId]: text }));
  };

  const handleCompleteReview = async (task) => {
    const feedback = feedbackMap[task._id] || task.reviewFeedback || "";
    setSubmittingId(task._id);
    try {
      const payload = { status: "completed", reviewFeedback: feedback };
      const { data } = await api.put(`/tasks/${task._id}`, payload);
      setTasks((prev) => prev.map((t) => (t._id === task._id ? data : t)));
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to complete review.");
      console.error("Complete review error:", err);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRequestRevision = async (task) => {
    const feedback = feedbackMap[task._id] || "";
    if (!feedback.trim()) {
      alert("Please provide review feedback explaining what needs revision.");
      return;
    }
    setSubmittingId(task._id);
    try {
      const payload = { status: "in_progress", reviewFeedback: feedback };
      const { data } = await api.put(`/tasks/${task._id}`, payload);
      setTasks((prev) => prev.map((t) => (t._id === task._id ? data : t)));
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to request revisions.");
      console.error("Request revision error:", err);
    } finally {
      setSubmittingId(null);
    }
  };

  /* ── Search filtering helper ───────────────────────────────────────────── */
  const filterBySearch = (list) => {
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.assignedTo?.name?.toLowerCase().includes(q)
    );
  };

  const isTaskSelfAssigned = (t) => {
    const aId = t.assignedTo?._id || t.assignedTo;
    const cId = t.createdBy?._id || t.createdBy;
    return Boolean(aId && cId && String(aId) === String(cId));
  };

  /* ── Role-based scoping: Admin sees all, Lead sees assigned & own tasks ── */
  const scopedTasks = useMemo(() => {
    if (!tasks || !user) return [];
    if (user.role === "admin") return tasks;

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

  /* ── Tab 1: Tasks Waiting for Review ───────────────────────────────────── */
  const pendingTasks = useMemo(
    () =>
      filterBySearch(
        scopedTasks.filter((t) => t.status === "in_review" && !isTaskSelfAssigned(t))
      ),
    [scopedTasks, searchQuery]
  );

  /* ── Tab 2: Review History (Tasks with review records or completion) ───── */
  const allHistoryTasks = useMemo(
    () =>
      scopedTasks.filter(
        (t) =>
          t.status === "completed" ||
          t.status === "finished" ||
          (t.reviewHistory && t.reviewHistory.length > 0) ||
          t.reviewFeedback ||
          t.reviewedAt
      ),
    [scopedTasks]
  );

  /* ── Separate: In Progress (Under Revision) vs Completed ───────────────── */
  const historyInProgressTasks = useMemo(
    () =>
      filterBySearch(
        allHistoryTasks.filter(
          (t) =>
            t.status === "in_progress" &&
            (t.reviewFeedback || (t.reviewHistory && t.reviewHistory.some((h) => h.action === "revision_requested")))
        )
      ),
    [allHistoryTasks, searchQuery]
  );

  const historyCompletedTasks = useMemo(
    () =>
      filterBySearch(
        allHistoryTasks.filter(
          (t) => t.status === "completed" || t.status === "finished"
        )
      ),
    [allHistoryTasks, searchQuery]
  );

  if (loading) {
    return <LoadingSpinner message="Loading review cockpit..." />;
  }

  /* ── Card Renderer: In Progress (Under Revision) ───────────────────────── */
  const renderInProgressHistoryCard = (task) => (
    <div key={task._id} className="pp-review-card glassy-surface-premium is-revised">
      {/* Header */}
      <div className="pp-review-card-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className={`pp-priority-dot priority-${task.priority}`} />
          <h3 className="pp-review-title">
            <HighlightText text={task.title} highlight={searchQuery} />
          </h3>
        </div>
        <span className="status-badge status-badge-in-progress" style={{ borderColor: "rgba(241, 91, 181, 0.4)" }}>
          In Progress &bull; Revision Requested
        </span>
      </div>

      {/* Description */}
      {task.description && (
        <p className="pp-review-desc">
          <HighlightText text={task.description} highlight={searchQuery} />
        </p>
      )}

      {/* Metadata Pills */}
      <div className="pp-review-meta-row">
        <span className="pp-meta-pill">
          <FiUser size={13} />
          <strong>Assignee:</strong> {task.assignedTo?.name || "Unassigned"}
        </span>
        <span className="pp-meta-pill">
          <strong>Assigner:</strong> {task.createdBy?.name || "System"}
        </span>
        <span className="pp-meta-pill">
          <FiCalendar size={13} />
          <strong>Deadline:</strong> {new Date(task.deadline).toLocaleDateString()}
        </span>
      </div>

      {/* Revision Remarks Callout */}
      {task.reviewFeedback && (
        <div className="pp-history-remarks-callout revision">
          <div className="pp-callout-header" style={{ color: "#f15bb5" }}>
            <FiRotateCcw size={13} />
            <span>Revision Instructions / Remarks</span>
          </div>
          <p className="pp-callout-quote">"{task.reviewFeedback}"</p>
        </div>
      )}

      {/* Audit Trail Timeline */}
      <ReviewTimeline history={task.reviewHistory} />
    </div>
  );

  /* ── Card Renderer: Completed & Certified ──────────────────────────────── */
  const renderCompletedHistoryCard = (task) => (
    <div key={task._id} className="pp-review-card glassy-surface-premium is-reviewed">
      {/* Header */}
      <div className="pp-review-card-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className={`pp-priority-dot priority-${task.priority}`} />
          <h3 className="pp-review-title">
            <HighlightText text={task.title} highlight={searchQuery} />
          </h3>
        </div>
        <span className="status-badge status-badge-completed">
          Completed &amp; Certified
        </span>
      </div>

      {/* Description */}
      {task.description && (
        <p className="pp-review-desc">
          <HighlightText text={task.description} highlight={searchQuery} />
        </p>
      )}

      {/* Metadata Pills */}
      <div className="pp-review-meta-row">
        <span className="pp-meta-pill">
          <FiUser size={13} />
          <strong>Assignee:</strong> {task.assignedTo?.name || "Unassigned"}
        </span>
        {task.reviewedBy && (
          <span className="pp-meta-pill" style={{ color: "#00f5d4", borderColor: "rgba(0, 245, 212, 0.3)" }}>
            <FiAward size={13} />
            <strong>Evaluator:</strong> {task.reviewedBy.name} ({task.reviewedBy.role || "Mentor"})
          </span>
        )}
        {task.reviewedAt && (
          <span className="pp-meta-pill">
            <FiCalendar size={13} />
            <strong>Evaluated On:</strong> {new Date(task.reviewedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Final Remarks Callout */}
      {task.reviewFeedback ? (
        <div className="pp-history-remarks-callout">
          <div className="pp-callout-header">
            <FiMessageSquare size={13} color="var(--pp-accent-cyan)" />
            <span>Final Evaluation Remarks</span>
          </div>
          <p className="pp-callout-quote">"{task.reviewFeedback}"</p>
        </div>
      ) : (
        <div className="pp-history-remarks-callout approved-silent">
          <FiCheckCircle size={14} color="#00f5d4" />
          <span>Certified and approved with standard criteria.</span>
        </div>
      )}

      {/* Audit Trail Timeline */}
      <ReviewTimeline history={task.reviewHistory} />
    </div>
  );

  return (
    <div className="pp-reviews-page animate-fade-in-long">
      {/* Page Header */}
      <div className="pp-section-header">
        <div>
          <h2>Reviews &amp; Approvals</h2>
          <p>
            {user?.role === "admin"
              ? "All organization missions awaiting evaluation, revision management, and certified review history."
              : user?.role === "lead"
              ? "Evaluate missions assigned by you and track your own missions undergoing review."
              : "Track your missions currently in review and review feedback given by mentors."}
          </p>
        </div>
      </div>

      {/* ═══ Segmented Tab Bar ═══ */}
      <div className="pp-review-tabs-container glassy-surface">
        <div className="pp-review-tabs-bar">
          <button
            type="button"
            className={`pp-review-tab-btn ${activeTab === "waiting" ? "active" : ""}`}
            onClick={() => setActiveTab("waiting")}
          >
            <FiClock size={16} />
            <span>Tasks Waiting for Review</span>
            <span className={`pp-tab-counter-badge pending ${pendingTasks.length > 0 ? "has-items" : ""}`}>
              {pendingTasks.length}
            </span>
          </button>

          <button
            type="button"
            className={`pp-review-tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <FiArchive size={16} />
            <span>Review History</span>
            <span className="pp-tab-counter-badge history">
              {allHistoryTasks.length}
            </span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: TASKS WAITING FOR REVIEW                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "waiting" && (
        <div className="pp-review-tab-content animate-fade-in">
          {/* Quick Stats Strip */}
          <div className="pp-review-stats-strip">
            <div className="pp-stat-pill">
              <span className="pp-stat-pill-label">⏳ Awaiting Evaluation</span>
              <span className="pp-stat-pill-val" style={{ color: "#fee440" }}>
                {pendingTasks.length}
              </span>
            </div>
            <div className="pp-stat-pill">
              <span className="pp-stat-pill-label">⚡ High/Critical Priority</span>
              <span className="pp-stat-pill-val" style={{ color: "#ff006e" }}>
                {pendingTasks.filter((t) => t.priority === "high" || t.priority === "critical").length}
              </span>
            </div>
            <div className="pp-stat-pill">
              <span className="pp-stat-pill-label">👥 Pending Assignees</span>
              <span className="pp-stat-pill-val" style={{ color: "#00f5d4" }}>
                {new Set(pendingTasks.map((t) => t.assignedTo?._id || t.assignedTo)).size}
              </span>
            </div>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="pp-card glassy-surface pp-review-empty-state">
              <p style={{ fontSize: "36px", margin: "0 0 10px" }}>🎉</p>
              <h4>No Tasks Waiting for Review!</h4>
              <p className="pp-muted">
                All submitted missions have been evaluated. When team members submit tasks from Task Flow, they will appear here ready for evaluation.
              </p>
            </div>
          ) : (
            <div className="pp-review-grid">
              {pendingTasks.map((task) => {
                const isAssignerOrAdmin =
                  task.createdBy?._id === user?._id ||
                  task.createdBy === user?._id ||
                  isLeadOrAdmin;

                return (
                  <div
                    key={task._id}
                    className="pp-review-card glassy-surface-premium is-pending"
                  >
                    {/* Header */}
                    <div className="pp-review-card-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span className={`pp-priority-dot priority-${task.priority}`} />
                        <h3 className="pp-review-title">
                          <HighlightText text={task.title} highlight={searchQuery} />
                        </h3>
                      </div>
                      <span className="status-badge status-badge-in-review">
                        In Review
                      </span>
                    </div>

                    {/* Description */}
                    {task.description && (
                      <p className="pp-review-desc">
                        <HighlightText text={task.description} highlight={searchQuery} />
                      </p>
                    )}

                    {/* Metadata Pills */}
                    <div className="pp-review-meta-row">
                      <span className="pp-meta-pill">
                        <FiUser size={13} />
                        <strong>Assignee:</strong> {task.assignedTo?.name || "Unassigned"}
                      </span>
                      <span className="pp-meta-pill">
                        <strong>Assigner:</strong> {task.createdBy?.name || "System"}
                      </span>
                      <span className="pp-meta-pill">
                        <FiCalendar size={13} />
                        <strong>Deadline:</strong> {new Date(task.deadline).toLocaleDateString()}
                      </span>
                      {task.inProgressAt && (
                        <span className="pp-meta-pill">
                          <FiClock size={13} />
                          <strong>Started:</strong> {new Date(task.inProgressAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Preserved Past Review History (if this task had previous revision cycles) */}
                    <ReviewTimeline history={task.reviewHistory} />

                    {/* Mentor Evaluation Cockpit */}
                    <div className="pp-review-writeup-box">
                      <div className="pp-review-box-header">
                        <FiMessageSquare size={15} color="var(--pp-primary-soft)" />
                        <span style={{ fontWeight: "600", fontSize: "13px" }}>
                          Write Evaluation &amp; Certification Remarks
                        </span>
                      </div>

                      {isAssignerOrAdmin ? (
                        <div className="pp-review-input-zone">
                          <textarea
                            className="pp-review-textarea"
                            placeholder="Write constructive review feedback, commendations, or revision notes before completing..."
                            value={
                              feedbackMap[task._id] !== undefined
                                ? feedbackMap[task._id]
                                : task.reviewFeedback || ""
                            }
                            onChange={(e) => handleFeedbackChange(task._id, e.target.value)}
                            rows={3}
                          />
                          <div className="pp-review-actions-bar">
                            <button
                              type="button"
                              className="pp-btn-outline"
                              style={{ borderColor: "#f15bb5", color: "#f15bb5" }}
                              disabled={submittingId === task._id}
                              onClick={() => handleRequestRevision(task)}
                              title="Sends task back to In Progress with your remarks"
                            >
                              <FiRotateCcw size={14} style={{ marginRight: "5px" }} />
                              Request Revisions
                            </button>
                            <button
                              type="button"
                              className="pp-btn-finish"
                              disabled={submittingId === task._id}
                              onClick={() => handleCompleteReview(task)}
                              title="Approves and certifies this task as Completed"
                            >
                              <FiCheckCircle size={15} style={{ marginRight: "6px" }} />
                              {submittingId === task._id ? "Certifying..." : "Approve & Complete"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="pp-review-user-notice">
                          <span style={{ fontStyle: "italic", fontSize: "13px", color: "var(--pp-text-muted)" }}>
                            ⏳ Currently under review by{" "}
                            <strong>{task.createdBy?.name || "your mentor/admin"}</strong>. Remarks will display in Review History once evaluated.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: REVIEW HISTORY (SEPARATING IN PROGRESS & COMPLETED)          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "history" && (
        <div className="pp-review-tab-content animate-fade-in">
          {/* Sub-Filter Chips */}
          <div className="pp-history-toolbar">
            <div className="pp-history-filter-chips">
              <button
                type="button"
                className={`pp-filter-chip ${historyFilter === "all" ? "active" : ""}`}
                onClick={() => setHistoryFilter("all")}
              >
                All Review History ({allHistoryTasks.length})
              </button>
              <button
                type="button"
                className={`pp-filter-chip ${historyFilter === "in_progress" ? "active" : ""}`}
                onClick={() => setHistoryFilter("in_progress")}
              >
                <FiRotateCcw size={12} style={{ marginRight: "4px" }} />
                In Progress &bull; Under Revision ({historyInProgressTasks.length})
              </button>
              <button
                type="button"
                className={`pp-filter-chip ${historyFilter === "completed" ? "active" : ""}`}
                onClick={() => setHistoryFilter("completed")}
              >
                <FiCheck size={12} style={{ marginRight: "4px" }} />
                Completed &amp; Certified ({historyCompletedTasks.length})
              </button>
            </div>
          </div>

          {/* ── Section 1: In Progress (Under Revision) ── */}
          {(historyFilter === "all" || historyFilter === "in_progress") && (
            <div className="pp-review-section">
              <div className="pp-history-hero-header in-progress">
                <div className="pp-hero-header-left">
                  <div className="pp-hero-icon-box in-progress">
                    <FiRotateCcw size={22} color="#f15bb5" />
                  </div>
                  <div className="pp-hero-text-col">
                    <div className="pp-hero-badge-row">
                      <span className="pp-hero-tag in-progress">
                        <span className="pp-pulse-dot in-progress" />
                        ACTIVE REVISION CYCLES
                      </span>
                    </div>
                    <h3 className="pp-hero-title">In Progress &bull; Under Revision</h3>
                    <p className="pp-hero-desc">
                      Missions returned with feedback notes; currently being updated by assignees before re-submitting for review.
                    </p>
                  </div>
                </div>
                <div className="pp-hero-stat-card in-progress">
                  <span className="pp-hero-stat-num">{historyInProgressTasks.length}</span>
                  <span className="pp-hero-stat-label">In Revision</span>
                </div>
              </div>

              {historyInProgressTasks.length === 0 ? (
                <div className="pp-card glassy-surface pp-review-empty-state" style={{ padding: "28px 20px" }}>
                  <p style={{ fontSize: "28px", margin: "0 0 6px" }}>🎉</p>
                  <p className="pp-muted" style={{ margin: 0, fontWeight: "500" }}>
                    No missions are currently undergoing revisions. All revision cycles are clear!
                  </p>
                </div>
              ) : (
                <div className="pp-review-grid">
                  {historyInProgressTasks.map((task) => renderInProgressHistoryCard(task))}
                </div>
              )}
            </div>
          )}

          {/* ── Section 2: Completed & Certified ── */}
          {(historyFilter === "all" || historyFilter === "completed") && (
            <div className="pp-review-section">
              <div className="pp-history-hero-header completed">
                <div className="pp-hero-header-left">
                  <div className="pp-hero-icon-box completed">
                    <FiCheckCircle size={22} color="#00f5d4" />
                  </div>
                  <div className="pp-hero-text-col">
                    <div className="pp-hero-badge-row">
                      <span className="pp-hero-tag completed">
                        <FiAward size={12} style={{ marginRight: "4px" }} />
                        OFFICIALLY CERTIFIED
                      </span>
                    </div>
                    <h3 className="pp-hero-title">Completed &amp; Certified</h3>
                    <p className="pp-hero-desc">
                      Missions that met evaluation criteria, approved with mentor remarks and permanently certified.
                    </p>
                  </div>
                </div>
                <div className="pp-hero-stat-card completed">
                  <span className="pp-hero-stat-num">{historyCompletedTasks.length}</span>
                  <span className="pp-hero-stat-label">Certified Done</span>
                </div>
              </div>

              {historyCompletedTasks.length === 0 ? (
                <div className="pp-card glassy-surface pp-review-empty-state" style={{ padding: "28px 20px" }}>
                  <p style={{ fontSize: "28px", margin: "0 0 6px" }}>📋</p>
                  <p className="pp-muted" style={{ margin: 0, fontWeight: "500" }}>
                    No certified reviews recorded yet. Evaluated tasks will display here.
                  </p>
                </div>
              ) : (
                <div className="pp-review-grid">
                  {historyCompletedTasks.map((task) => renderCompletedHistoryCard(task))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskReviews;
