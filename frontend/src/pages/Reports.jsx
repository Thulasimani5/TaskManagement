import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from "recharts";
import { api } from "../services/api.js";

const STATUS_COLORS = {
  todo: "#9B5DE5",
  in_progress: "#F15BB5",
  completed: "#00F5D4"
};

const PRIORITY_COLORS = {
  low: "#3A86FF",
  medium: "#9B5DE5",
  high: "#F15BB5",
  critical: "#FF006E"
};

const Reports = () => {
  const [daily, setDaily] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [dailyRes, weeklyRes] = await Promise.all([
          api.get("/reports/daily"),
          api.get("/reports/weekly")
        ]);
        setDaily(dailyRes.data);
        setWeekly(weeklyRes.data);
      } catch (err) {
        console.error("Report fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="pp-reports">
        <div className="pp-section-header">
          <div className="pp-skeleton" style={{ width: '200px', height: '32px', marginBottom: '8px' }} />
          <div className="pp-skeleton" style={{ width: '300px', height: '16px' }} />
        </div>
        <section className="pp-section pp-section-split">
          <div className="pp-card glassy-surface">
            <div className="pp-skeleton pp-skeleton-card" />
          </div>
          <div className="pp-card glassy-surface">
            <div className="pp-skeleton pp-skeleton-card" />
          </div>
        </section>
      </div>
    );
  }

  const statusData =
    weekly &&
    Object.entries(weekly.byStatus || {}).map(([status, value]) => ({
      status,
      value
    }));

  const priorityData =
    weekly &&
    Object.entries(weekly.byPriority || {}).map(([priority, value]) => ({
      name: priority,
      value
    }));

  return (
    <div className="pp-reports">
      <div className="pp-section-header">
        <div>
          <h2>Progress Pulse</h2>
          <p>Visual analytics across your recent task constellations.</p>
        </div>
      </div>

      <section className="pp-section pp-section-split">
        <div className="pp-card glassy-surface pp-animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h3>Weekly Status Spectrum</h3>
          <p className="pp-muted">
            Distribution of tasks by status over the last 7 days.
          </p>
          <div className="pp-chart-wrapper">
            {statusData && statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={statusData}>
                  <defs>
                    <linearGradient id="colorTodo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9B5DE5" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#9B5DE5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F15BB5" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#F15BB5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00F5D4" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#00F5D4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis
                    dataKey="status"
                    stroke="var(--pp-text-muted)"
                    tick={{ fill: 'var(--pp-text-muted)', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val.replace('_', ' ')}
                  />
                  <YAxis
                    stroke="var(--pp-text-muted)"
                    tick={{ fill: 'var(--pp-text-muted)', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(5, 0, 22, 0.8)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={1500}>
                    {statusData.map((entry, index) => {
                      let fillId = "colorTodo";
                      if (entry.status === 'in_progress') fillId = "colorInProgress";
                      if (entry.status === 'completed') fillId = "colorCompleted";
                      return <Cell key={`cell-${index}`} fill={`url(#${fillId})`} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="pp-muted">No data for this window yet.</p>
            )}
          </div>
        </div>

        <div className="pp-card glassy-surface pp-animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <h3>Priority Orbit</h3>
          <p className="pp-muted">
            How your tasks are weighted across priority levels.
          </p>
          <div className="pp-chart-wrapper">
            {priorityData && priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <defs>
                    {Object.entries(PRIORITY_COLORS).map(([key, color]) => (
                      <linearGradient id={`grad-${key}`} key={key} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={1} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    dataKey="value"
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    stroke="none"
                    animationDuration={1500}
                    animationBegin={200}
                  >
                    {priorityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#grad-${entry.name})`}
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(5, 0, 22, 0.8)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px'
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="pp-muted">No priority breakdown available.</p>
            )}
          </div>
        </div>
      </section>

      <section className="pp-section">
        <div className="pp-card glassy-surface pp-animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <div className="pp-section-header">
            <div>
              <h3>Deadline Radar</h3>
              <p className="pp-muted">
                Compare today&apos;s movement with this week&apos;s trajectory.
              </p>
            </div>
          </div>
          <div className="pp-deadline-radar">
            <div>
              <p className="pp-kpi-label">Today&apos;s Completions</p>
              <p className="pp-kpi-value pp-kpi-success">
                {daily?.completed ?? 0}
              </p>
              <p className="pp-kpi-footnote">
                {daily?.completionRate ?? 0}% of today&apos;s active tasks
              </p>
            </div>
            <div>
              <p className="pp-kpi-label">Weekly Completions</p>
              <p className="pp-kpi-value pp-kpi-success">
                {weekly?.completed ?? 0}
              </p>
              <p className="pp-kpi-footnote">
                {weekly?.completionRate ?? 0}% across the last 7 days
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Reports;

