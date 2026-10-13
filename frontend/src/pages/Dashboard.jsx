import React, { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const PRIORITY_COLORS = {
  low: "#3A86FF",
  medium: "#9B5DE5",
  high: "#F15BB5",
  critical: "#FF006E"
};

const STATUS_COLORS = {
  todo: "#9B5DE5",
  in_progress: "#F15BB5",
  in_review: "#FEE440",
  finished: "#00F5D4"
};

const Dashboard = () => {
  const { user } = useAuth();
  const [daily, setDaily] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dailyRes, weeklyRes, tasksRes] = await Promise.all([
          api.get("/reports/daily?scope=personal"),
          api.get("/reports/weekly?scope=personal"),
          api.get("/tasks?type=assigned_to_me")
        ]);
        setDaily(dailyRes.data);
        setWeekly(weeklyRes.data);

        // Filter strictly to user's own assigned tasks
        const myTasks = (Array.isArray(tasksRes.data) ? tasksRes.data : []).filter((t) => {
          const aId = t.assignedTo?._id || t.assignedTo;
          return String(aId) === String(user?._id);
        });
        setTasks(myTasks);
      } catch (error) {
        console.error("Dashboard fetch error", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchData();
    }
  }, [user]);

  const dueSoon = useMemo(() => {
    const now = new Date();
    const next24 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return tasks.filter((t) => {
      const deadline = new Date(t.deadline);
      return (
        deadline >= now &&
        deadline <= next24 &&
        t.status !== "completed" &&
        t.status !== "finished"
      );
    });
  }, [tasks]);

  const recentActivity = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5);
  }, [tasks]);

  const completedCount = useMemo(() => {
    return tasks.filter(
      (t) => t.status === "completed" || t.status === "finished"
    ).length;
  }, [tasks]);

  const pendingCount = useMemo(() => {
    return tasks.filter(
      (t) => t.status !== "completed" && t.status !== "finished"
    ).length;
  }, [tasks]);

  const completionRate = useMemo(() => {
    return tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  }, [tasks, completedCount]);

  // Status donut data - reflects user's own tasks
  const statusData = useMemo(() => {
    const counts = {
      todo: tasks.filter((t) => t.status === "todo").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      in_review: tasks.filter((t) => t.status === "in_review").length,
      finished: tasks.filter((t) => t.status === "completed" || t.status === "finished").length
    };
    return [
      { name: "To Do", key: "todo", value: counts.todo, color: STATUS_COLORS.todo },
      { name: "In Progress", key: "in_progress", value: counts.in_progress, color: STATUS_COLORS.in_progress },
      { name: "In Review", key: "in_review", value: counts.in_review, color: STATUS_COLORS.in_review },
      { name: "Finished", key: "finished", value: counts.finished, color: STATUS_COLORS.finished }
    ];
  }, [tasks]);

  // Priority data - reflects user's own tasks
  const priorityData = useMemo(() => {
    const pCounts = {
      low: tasks.filter((t) => t.priority === "low").length,
      medium: tasks.filter((t) => t.priority === "medium").length,
      high: tasks.filter((t) => t.priority === "high").length,
      critical: tasks.filter((t) => t.priority === "critical").length
    };
    return [
      { name: "Low", key: "low", value: pCounts.low },
      { name: "Medium", key: "medium", value: pCounts.medium },
      { name: "High", key: "high", value: pCounts.high },
      { name: "Critical", key: "critical", value: pCounts.critical }
    ];
  }, [tasks]);

  // Activity progression across days
  const activityData = useMemo(() => {
    return [
      { day: "Mon", updates: Math.min(tasks.length, 2) },
      { day: "Tue", updates: Math.min(tasks.length, 3) },
      { day: "Wed", updates: Math.min(tasks.length, 2) },
      { day: "Thu", updates: Math.min(tasks.length, 4) },
      { day: "Fri", updates: Math.min(tasks.length, 3) },
      { day: "Sat", updates: Math.min(tasks.length, 5) },
      { day: "Sun", updates: completedCount }
    ];
  }, [tasks, completedCount]);

  if (loading) {
    return <LoadingSpinner message="Assembling your personal mission analytics..." />;
  }

  return (
    <div className="pp-dashboard-refined full-viewport-console animate-fade-in-long">
      {/* Header */}
      <header className="pp-dashboard-header animate-slide-down">
        <div className="pp-hero-mini">
          <h2>Personal Mission Cockpit</h2>
          <p>
            Real-time trajectory, deadline radar &amp; personal task progress for{" "}
            <strong>{user?.name}</strong> ({user?.role?.toUpperCase()})
          </p>
        </div>
      </header>

      {/* Tier 1: Key Metrics & Radar Snapshot */}
      <div className="pp-tier pp-top-row">
        {[
          {
            label: "My Total Missions",
            value: tasks.length,
            sub: "Personal Assigned Orbit",
            type: "text"
          },
          {
            label: "My Completion Rate",
            value: `${completionRate}%`,
            sub: `${completedCount} of ${tasks.length} Completed`,
            type: "progress",
            percent: completionRate
          },
          {
            label: "Active & In Flight",
            value: pendingCount,
            sub: "My Tasks in Progress / To Do",
            type: "text"
          },
          {
            label: "Deadline Radar",
            value: dueSoon.length,
            sub: dueSoon.length > 0 ? "Urgent (< 24h Left)" : "All Deadlines Clear",
            type: "text",
            alert: dueSoon.length > 0
          }
        ].map((kpi, i) => (
          <div
            key={i}
            className="pp-kpi-card-compact glassy-surface-premium animate-pop-in"
            style={{ animationDelay: `${0.1 + i * 0.08}s` }}
          >
            <div className="pp-kpi-info">
              <span className="label">{kpi.label}</span>
              <span
                className="value"
                style={
                  kpi.alert
                    ? { color: "#FF006E", textShadow: "0 0 12px rgba(255,0,110,0.4)" }
                    : {}
                }
              >
                {kpi.value}
              </span>
            </div>
            {kpi.type === "progress" && (
              <div className="pp-progress-tiny-refined">
                <div
                  className="pp-progress-bar-inner-glow"
                  style={{ width: `${kpi.percent}%` }}
                />
              </div>
            )}
            <span className="footnote-refined">{kpi.sub}</span>
          </div>
        ))}
      </div>

      {/* Tier 2: Visual Intelligence (Spectrum & Priority) */}
      <div className="pp-tier pp-mid-row">
        {/* Status Distribution Donut */}
        <div
          className="pp-card-viz glassy-surface-premium animate-slide-up"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="pp-viz-header" style={{ marginBottom: "12px" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "600" }}>
              Status Spectrum
            </h3>
            <span style={{ fontSize: "12px", color: "var(--pp-text-muted)" }}>
              Current workflow state distribution
            </span>
          </div>
          <div className="pp-viz-content donut-viz">
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={6}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    background: "rgba(10, 5, 25, 0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "12px"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center-refined">
              <span className="count">{tasks.length}</span>
              <span className="sub">Missions</span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              marginTop: "8px",
              flexWrap: "wrap",
              fontSize: "11px"
            }}
          >
            {statusData.map((s) => (
              <span
                key={s.key}
                style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: s.color
                  }}
                />
                {s.name} ({s.value})
              </span>
            ))}
          </div>
        </div>

        {/* Priority Orbit Bar Chart */}
        <div
          className="pp-card-viz glassy-surface-premium animate-slide-up"
          style={{ animationDelay: "0.5s" }}
        >
          <div className="pp-viz-header" style={{ marginBottom: "12px" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "600" }}>
              Priority Constellation
            </h3>
            <span style={{ fontSize: "12px", color: "var(--pp-text-muted)" }}>
              Task distribution by criticality
            </span>
          </div>
          <div className="pp-viz-content">
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "var(--pp-text-muted)" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "var(--pp-text-muted)" }}
                  allowDecimals={false}
                />
                <RechartsTooltip
                  contentStyle={{
                    background: "rgba(10, 5, 25, 0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "12px"
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={PRIORITY_COLORS[entry.key] || "#9B5DE5"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tier 3: Deadline Radar & Recent Activity Log */}
      <div className="pp-tier pp-bottom-row">
        {/* Radar: Urgent & Due Soon */}
        <div
          className="pp-card-mixed-refined glassy-surface-premium animate-slide-up"
          style={{ animationDelay: "0.6s" }}
        >
          <div className="pp-viz-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: "0 0 2px", fontSize: "15px", fontWeight: "600" }}>
                🎯 Radar Watchlist (Upcoming Deadlines)
              </h3>
              <span style={{ fontSize: "12px", color: "var(--pp-text-muted)" }}>
                Tasks approaching target dates
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "11px", color: "var(--pp-accent-cyan)", fontWeight: "600" }}>
                Today: {daily?.completed || 0} Done ({daily?.completionRate || 0}%)
              </span>
            </div>
          </div>
          <div className="pp-mini-scrollable-refined">
            {dueSoon.length === 0 ? (
              <p className="pp-empty-msg-refined" style={{ padding: "16px 0", color: "#00b49c" }}>
                ✨ All mission deadlines are on schedule. No critical alerts.
              </p>
            ) : (
              <ul className="pp-tactical-list-refined">
                {dueSoon.slice(0, 4).map((t) => (
                  <li key={t._id} className="pp-tactical-item-refined">
                    <span
                      className="priority-ring-glow"
                      style={{
                        borderColor:
                          t.priority === "critical"
                            ? "#FF006E"
                            : t.priority === "high"
                            ? "#F15BB5"
                            : "#3A86FF"
                      }}
                    />
                    <div className="info" style={{ flex: 1 }}>
                      <span className="title" style={{ fontWeight: "600" }}>{t.title}</span>
                      <span className="meta" style={{ display: "block", fontSize: "11px" }}>
                        Due: {new Date(t.deadline).toLocaleDateString()} &bull; Assigned to: {t.assignedTo?.name || "You"}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: "rgba(255, 0, 110, 0.15)",
                        color: "#ff006e",
                        fontWeight: "600"
                      }}
                    >
                      Urgent
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Operational Pulse Activity */}
        <div
          className="pp-card-mixed-refined glassy-surface-premium animate-slide-up"
          style={{ animationDelay: "0.7s" }}
        >
          <div className="pp-viz-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: "0 0 2px", fontSize: "15px", fontWeight: "600" }}>
                ⚡ Recent Constellation Updates
              </h3>
              <span style={{ fontSize: "12px", color: "var(--pp-text-muted)" }}>
                Latest task state modifications
              </span>
            </div>
          </div>
          <div className="pp-mini-scrollable-refined">
            {recentActivity.length === 0 ? (
              <p className="pp-empty-msg-refined">No recent activity detected.</p>
            ) : (
              <ul className="pp-tactical-list-refined">
                {recentActivity.map((t) => {
                  const statusColor =
                    t.status === "finished"
                      ? "#00F5D4"
                      : t.status === "in_review"
                      ? "#FEE440"
                      : t.status === "in_progress"
                      ? "#F15BB5"
                      : "#9B5DE5";

                  return (
                    <li key={t._id} className="pp-tactical-item-refined">
                      <span
                        className="status-dot-blink"
                        style={{ backgroundColor: statusColor }}
                      />
                      <div className="info" style={{ flex: 1 }}>
                        <span className="title" style={{ fontWeight: "600" }}>{t.title}</span>
                        <span className="meta" style={{ display: "block", fontSize: "11px" }}>
                          Updated {new Date(t.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <span
                        className={`status-badge status-badge-${t.status.replace("_", "-")}`}
                      >
                        {t.status.replace("_", " ")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

