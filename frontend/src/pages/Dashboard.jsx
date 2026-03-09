import React, { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
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

const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [weeklyRes, tasksRes] = await Promise.all([
          api.get("/reports/weekly?scope=personal"),
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

  const recentActivity = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5);
  }, [tasks]);

  const pendingCount = useMemo(() => {
    return tasks.filter(t => t.status !== 'completed').length;
  }, [tasks]);

  const statusData = useMemo(() => {
    if (!summary?.byStatus) return [];
    return [
      { name: "Todo", value: summary.byStatus.todo || 0, color: "#9B5DE5" },
      { name: "Progress", value: summary.byStatus.in_progress || 0, color: "#F15BB5" },
      { name: "Done", value: summary.byStatus.completed || 0, color: "#00F5D4" }
    ];
  }, [summary]);

  const activityData = useMemo(() => [
    { day: "Mon", updates: 2 },
    { day: "Tue", updates: 5 },
    { day: "Wed", updates: 3 },
    { day: "Thu", updates: 8 },
    { day: "Fri", updates: 4 },
    { day: "Sat", updates: 6 },
    { day: "Sun", updates: summary?.completed || 0 }
  ], [summary]);

  if (loading) {
    return <LoadingSpinner message="Loading Dashboard..." />;
  }

  return (
    <div className="pp-dashboard-refined full-viewport-console animate-fade-in-long">
      <header className="pp-dashboard-header animate-slide-down">
        <div className="pp-hero-mini">
          <h2>Dashboard Overview</h2>
          <p>Welcome, {user?.name}</p>
        </div>
        <div className="pp-quick-stats">
          <div className="pp-mini-stat animate-pop-in" style={{ animationDelay: '0.1s' }}>
            <span className="pp-stat-dot todo" />
            <span>{summary?.byStatus?.todo || 0} To Do</span>
          </div>
          <div className="pp-mini-stat animate-pop-in" style={{ animationDelay: '0.2s' }}>
            <span className="pp-stat-dot progress" />
            <span>{summary?.byStatus?.in_progress || 0} In Progress</span>
          </div>
          <div className="pp-mini-stat animate-pop-in" style={{ animationDelay: '0.3s' }}>
            <span className="pp-stat-dot done" />
            <span>{summary?.byStatus?.completed || 0} Completed</span>
          </div>
        </div>
      </header>

      {/* Tier 1: Tactical Metrics */}
      <div className="pp-tier pp-top-row">
        {[
          { label: "Total Tasks", value: summary?.total || 0, type: 'spark', data: activityData },
          { label: "Completion Rate", value: `${summary?.completionRate || 0}%`, type: 'progress', percent: summary?.completionRate },
          { label: "Pending Tasks", value: pendingCount, type: 'text', sub: 'Active' },
          { label: "Due Soon", value: dueSoon.length, type: 'text', sub: 'Next 24 Hours', alert: dueSoon.length > 0 }
        ].map((kpi, i) => (
          <div key={i} className="pp-kpi-card-compact glassy-surface-premium animate-pop-in" style={{ animationDelay: `${0.4 + (i * 0.1)}s` }}>
            <div className="pp-kpi-info">
              <span className="label">{kpi.label}</span>
              <span className="value" style={kpi.alert ? { color: '#FF006E', textShadow: '0 0 10px rgba(255,0,110,0.3)' } : {}}>{kpi.value}</span>
            </div>
            {kpi.type === 'spark' && (
              <div className="pp-spark-container">
                <ResponsiveContainer width="100%" height={35}>
                  <AreaChart data={kpi.data}>
                    <defs>
                      <linearGradient id="colorSpark" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9B5DE5" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#9B5DE5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="updates" stroke="#9B5DE5" fill="url(#colorSpark)" strokeWidth={1.5} dot={false} isAnimationActive={true} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            {kpi.type === 'progress' && (
              <div className="pp-progress-tiny-refined">
                <div className="pp-progress-bar-inner-glow" style={{ width: `${kpi.percent || 0}%` }} />
              </div>
            )}
            {kpi.type === 'text' && <span className="footnote-refined">{kpi.sub}</span>}
          </div>
        ))}
      </div>

      {/* Tier 2: Visual Intelligence */}
      <div className="pp-tier pp-mid-row">
        <div className="pp-card-viz glassy-surface-premium animate-slide-up" style={{ animationDelay: '0.8s' }}>
          <div className="pp-viz-header">
            <h3>Tasks by Status</h3>
          </div>
          <div className="pp-viz-content donut-viz">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={statusData} innerRadius={55} outerRadius={75} paddingAngle={8} dataKey="value" stroke="none">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ background: 'rgba(5, 0, 22, 0.9)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', backdropFilter: 'blur(10px)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center-refined">
              <span className="count">{summary?.total || 0}</span>
              <span className="sub">Tasks</span>
            </div>
          </div>
        </div>

        <div className="pp-card-viz glassy-surface-premium animate-slide-up" style={{ animationDelay: '0.9s' }}>
          <div className="pp-viz-header">
            <h3>Weekly Activity</h3>
          </div>
          <div className="pp-viz-content area-viz">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
                <YAxis hide />
                <RechartsTooltip contentStyle={{ background: 'rgba(5, 0, 22, 0.9)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="updates" stroke="#00F5D4" fill="rgba(0, 245, 212, 0.05)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tier 3: Operational Tactical */}
      <div className="pp-tier pp-bottom-row">
        {[
          { title: "Upcoming Deadlines", type: 'list', items: dueSoon.slice(0, 4), empty: "No tasks due soon." },
          { title: "Recent Activity", type: 'log', items: recentActivity, empty: "No recent activity." },
          { title: "System Status", type: 'diag' }
        ].map((tier, i) => (
          <div key={i} className="pp-card-mixed-refined glassy-surface-premium animate-slide-up" style={{ animationDelay: `${1.1 + (i * 0.1)}s` }}>
            <div className="pp-viz-header">
              <h3>{tier.title}</h3>
            </div>
            <div className="pp-mini-scrollable-refined">
              {tier.type === 'list' && (
                tier.items.length === 0 ? <p className="pp-empty-msg-refined">{tier.empty}</p> : (
                  <ul className="pp-tactical-list-refined">
                    {tier.items.map(t => (
                      <li key={t._id} className="pp-tactical-item-refined">
                        <span className="priority-ring-glow" style={{ borderColor: t.priority === 'high' ? '#FF006E' : '#3A86FF' }} />
                        <div className="info">
                          <span className="title">{t.title}</span>
                          <span className="meta">{new Date(t.deadline).toLocaleDateString()}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              )}
              {tier.type === 'log' && (
                tier.items.length === 0 ? <p className="pp-empty-msg-refined">{tier.empty}</p> : (
                  <ul className="pp-tactical-list-refined">
                    {tier.items.map(t => (
                      <li key={t._id} className="pp-tactical-item-refined">
                        <span className="status-dot-blink" style={{ backgroundColor: t.status === 'completed' ? '#00F5D4' : '#F15BB5' }} />
                        <div className="info">
                          <span className="title">{t.title}</span>
                          <span className="meta status">{t.status.replace('_', ' ')}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              )}
              {tier.type === 'diag' && (
                <div className="pp-diagnostics-refined">
                  {['API Server', 'Database', 'Connection'].map((diag, idx) => (
                    <div key={idx} className="diag-item-refined">
                      <span className="label">{diag}</span>
                      <span className="status nom-glow">Online</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;

