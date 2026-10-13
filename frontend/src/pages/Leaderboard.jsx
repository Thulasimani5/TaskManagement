import React, { useState, useEffect } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  FiAward,
  FiZap,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiInfo,
  FiChevronDown,
  FiChevronUp,
  FiStar,
  FiTarget,
  FiTrendingUp
} from "react-icons/fi";
import "../styles/leaderboard-cosmic.css";

const Leaderboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ users: [], leads: [] });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("all-time");
  const [showFormula, setShowFormula] = useState(false);
  const [activeSector, setActiveSector] = useState("users"); // 'users', 'leads', 'all'

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/leaderboard?timeframe=${timeframe}`);
        if (Array.isArray(res.data)) {
          setData({ users: res.data, leads: [] });
        } else {
          setData(res.data || { users: [], leads: [] });
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [timeframe]);

  if (loading) {
    return (
      <div className="pp-dashboard-loading">
        <div className="pp-orbit-loader" />
        <p>Loading galactic stage...</p>
      </div>
    );
  }

  // Active list based on selected sector tab
  let activeList = [];
  if (activeSector === "users") {
    activeList = data.users || [];
  } else if (activeSector === "leads") {
    activeList = data.leads || [];
  } else {
    activeList = [...(data.users || []), ...(data.leads || [])].sort(
      (a, b) => b.productivityScore - a.productivityScore
    );
  }

  const top3 = activeList.slice(0, 3);
  const rest = activeList.slice(3);

  // Compute current authenticated user rank and score
  const allUsersCombined = [...(data.users || []), ...(data.leads || [])];
  const myIndex = allUsersCombined.findIndex(
    (u) =>
      u._id?.toString() === user?.id?.toString() ||
      u._id?.toString() === user?._id?.toString() ||
      u.name === user?.name
  );
  const myRank = myIndex !== -1 ? myIndex + 1 : 1;
  const myScore = myIndex !== -1 ? allUsersCombined[myIndex].productivityScore : 0;
  const totalCount = allUsersCombined.length || 1;

  // Podium order: [Rank 2 (Left), Rank 1 (Center), Rank 3 (Right)]
  const p1 = top3[0] || null;
  const p2 = top3[1] || null;
  const p3 = top3[2] || null;

  return (
    <div className="pp-stage-leaderboard">
      {/* 3D Stage Volumetric Lighting */}
      <div className="pp-stage-lighting">
        <div className="pp-spotlight-beam-left" />
        <div className="pp-spotlight-beam-center" />
        <div className="pp-spotlight-beam-right" />
      </div>

      {/* Header & Controls */}
      <div className="pp-stage-header">
        <div className="pp-stage-title-wrap">
          <h1>
            <FiAward style={{ color: "#d946ef" }} /> Leaderboard
          </h1>
          <p>Compete in galactic missions and earn productivity score.</p>
        </div>

        <div className="pp-stage-controls">
          {/* Scoring Formula Toggle */}
          <button
            className="pp-formula-trigger-btn"
            onClick={() => setShowFormula(!showFormula)}
            title="View Scoring Engine Rules"
          >
            <FiInfo style={{ color: "#00f5d4" }} />
            <span>Scoring Rules</span>
            {showFormula ? <FiChevronUp /> : <FiChevronDown />}
          </button>

          {/* Timeframe Pill Selector */}
          <div className="pp-stage-timeframe-pills">
            {["weekly", "monthly", "all-time"].map((tf) => (
              <button
                key={tf}
                className={`pp-stage-timeframe-btn ${timeframe === tf ? "active" : ""}`}
                onClick={() => setTimeframe(tf)}
              >
                {tf.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expandable Scoring Formula HUD */}
      {showFormula && (
        <div className="pp-formula-hud-box">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#00f5d4", fontWeight: 800, fontSize: "14px", textTransform: "uppercase" }}>
            <FiTarget /> Multi-Factor Scoring Engine Architecture
          </div>
          <div className="pp-formula-hud-grid">
            <div className="pp-formula-hud-col priority">
              <div className="pp-formula-col-title">🎯 Priority Weights</div>
              <div className="pp-formula-col-desc">
                • <strong>Completed:</strong> Critical +40 | High +30 | Med +20 | Low +10<br />
                • <strong>In Progress:</strong> Critical +12 | High +9 | Med +6 | Low +3
              </div>
            </div>
            <div className="pp-formula-hud-col deadline">
              <div className="pp-formula-col-title">⏱️ Deadline Adherence</div>
              <div className="pp-formula-col-desc">
                • <strong>On-Time:</strong> +15 pts bonus<br />
                • <strong>Overdue Complete:</strong> -10 pts penalty<br />
                • <strong>Overdue In-Progress:</strong> -5 pts penalty
              </div>
            </div>
            <div className="pp-formula-hud-col quality">
              <div className="pp-formula-col-title">⚠️ Quality Revision Minus Marks</div>
              <div className="pp-formula-col-desc">
                • <strong>Penalty:</strong> -10 minus marks deducted per revision requested by assigner.
              </div>
            </div>
            <div className="pp-formula-hud-col streak">
              <div className="pp-formula-col-title">🔥 On-Time Streak</div>
              <div className="pp-formula-col-desc">
                • Consecutive completed missions delivered on or before deadline.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sector Tabs (Voyager Explorers / Team Leads / All) */}
      <div className="pp-stage-tabs">
        <button
          className={`pp-stage-tab ${activeSector === "users" ? "active" : ""}`}
          onClick={() => setActiveSector("users")}
        >
          <span>Voyager Explorers</span>
          <span className="pp-stage-tab-badge">{data.users?.length || 0}</span>
        </button>

        {data.leads?.length > 0 && (
          <button
            className={`pp-stage-tab ${activeSector === "leads" ? "active" : ""}`}
            onClick={() => setActiveSector("leads")}
          >
            <span>Team Leads</span>
            <span className="pp-stage-tab-badge">{data.leads?.length || 0}</span>
          </button>
        )}

        {data.leads?.length > 0 && (
          <button
            className={`pp-stage-tab ${activeSector === "all" ? "active" : ""}`}
            onClick={() => setActiveSector("all")}
          >
            <span>All Voyagers</span>
            <span className="pp-stage-tab-badge">{(data.users?.length || 0) + (data.leads?.length || 0)}</span>
          </button>
        )}
      </div>

      {/* =====================================================================
          THE 3D ISOMETRIC PODIUM (Matches 2X.wtf UI exactly!)
          ===================================================================== */}
      {top3.length > 0 && (
        <div className="pp-3d-podium-container">
          {/* Rank 2 (Left, Coral / Rose Pink-Red Pillar) */}
          {p2 && (
            <div className="pp-3d-pedestal rank-2">
              <div className="pp-pedestal-head">
                <div className="pp-pedestal-crown-icon">👑</div>
                <div className="pp-pedestal-avatar-orb">
                  {p2.name?.charAt(0) || "?"}
                </div>
                <div className="pp-pedestal-user-name">{p2.name}</div>
                <div className="pp-pedestal-user-role">{p2.role || "Explorer"}</div>
              </div>

              <div className="pp-3d-pillar">
                <div className="pp-pillar-num-label">2nd</div>
                <div className="pp-pillar-badge">
                  <FiStar style={{ color: "#fecdd3" }} />
                  <span>{p2.productivityScore || 0} PTS</span>
                </div>
                <div className="pp-pillar-metrics">
                  <span className="pp-pillar-chip">
                    <FiZap /> {p2.streak || 0} Streak
                  </span>
                  <span className="pp-pillar-chip">
                    <FiCheckCircle /> {p2.completedTasks || 0} Done
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Rank 1 (Center, Neon Magenta / Purple Pillar) */}
          {p1 && (
            <div className="pp-3d-pedestal rank-1">
              <div className="pp-pedestal-head">
                <div className="pp-pedestal-crown-icon">👑</div>
                <div className="pp-pedestal-avatar-orb">
                  {p1.name?.charAt(0) || "?"}
                </div>
                <div className="pp-pedestal-user-name">{p1.name}</div>
                <div className="pp-pedestal-user-role">{p1.role || "Champion"}</div>
              </div>

              <div className="pp-3d-pillar">
                <div className="pp-pillar-num-label">1st</div>
                <div className="pp-pillar-badge">
                  <FiStar style={{ color: "#f5d0fe" }} />
                  <span>{p1.productivityScore || 0} PTS</span>
                </div>
                <div className="pp-pillar-metrics">
                  <span className="pp-pillar-chip">
                    <FiZap /> {p1.streak || 0} Streak
                  </span>
                  <span className="pp-pillar-chip">
                    <FiCheckCircle /> {p1.completedTasks || 0} Done
                  </span>
                  {p1.revisionCount > 0 && (
                    <span className="pp-pillar-chip" style={{ color: "#fecdd3" }}>
                      -{p1.revisionPenalties || p1.revisionCount * 10} pts
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Rank 3 (Right, Radiant Golden Amber Pillar) */}
          {p3 && (
            <div className="pp-3d-pedestal rank-3">
              <div className="pp-pedestal-head">
                <div className="pp-pedestal-crown-icon">👑</div>
                <div className="pp-pedestal-avatar-orb">
                  {p3.name?.charAt(0) || "?"}
                </div>
                <div className="pp-pedestal-user-name">{p3.name}</div>
                <div className="pp-pedestal-user-role">{p3.role || "Explorer"}</div>
              </div>

              <div className="pp-3d-pillar">
                <div className="pp-pillar-num-label">3rd</div>
                <div className="pp-pillar-badge">
                  <FiStar style={{ color: "#fef3c7" }} />
                  <span>{p3.productivityScore || 0} PTS</span>
                </div>
                <div className="pp-pillar-metrics">
                  <span className="pp-pillar-chip">
                    <FiZap /> {p3.streak || 0} Streak
                  </span>
                  <span className="pp-pillar-chip">
                    <FiCheckCircle /> {p3.completedTasks || 0} Done
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Achievement Status Strip (Exact 2X.wtf match) */}
      <div className="pp-user-status-strip">
        <span>You achieved success today and are ranked <strong>#{myRank}</strong> out of <strong>{totalCount}</strong> voyagers</span>
        <span className="pp-user-status-pill">
          <FiStar /> {myScore} PTS
        </span>
      </div>

      {/* =====================================================================
          RANKING TABLE (Matches 2X.wtf bottom table design)
          ===================================================================== */}
      <div className="pp-ranking-table-section">
        <div className="pp-table-header-bar">
          <div className="pp-table-title">
            <FiTrendingUp style={{ color: "#d946ef" }} /> Voyager Mission Rankings
          </div>
        </div>

        {/* Table Column Titles */}
        <div className="pp-table-cols-head">
          <span>Rank</span>
          <span>Voyager</span>
          <span>Missions</span>
          <span>Revisions</span>
          <span>Streak</span>
          <span style={{ textAlign: "right", paddingRight: "10px" }}>Score</span>
        </div>

        {/* Table Rows (All or Rank 4+) */}
        <div className="pp-table-body">
          {activeList.map((player, index) => {
            const rankNum = index + 1;
            const hasPenalty = player?.revisionCount > 0;

            return (
              <div key={player?._id || `row-${index}`} className="pp-table-row">
                <span className="pp-row-rank-num">#{rankNum}</span>

                <div className="pp-row-user-cell">
                  <div className="pp-row-user-avatar">
                    {player?.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <div className="pp-row-user-name">{player?.name || "Unknown Voyager"}</div>
                    <div className="pp-row-user-role">{player?.role || "Explorer"}</div>
                  </div>
                </div>

                <div className="pp-row-missions-cell">
                  <span style={{ color: "#10b981" }}>{player?.completedTasks || 0} done</span>
                  <span style={{ opacity: 0.4 }}>•</span>
                  <span style={{ color: "#00f5d4" }}>{player?.inProgressTasks || 0} active</span>
                </div>

                <div className={`pp-row-revisions-cell ${hasPenalty ? "has-penalty" : "no-penalty"}`}>
                  {hasPenalty ? (
                    <span>-{player.revisionPenalties || player.revisionCount * 10} pts ({player.revisionCount} rev)</span>
                  ) : (
                    <span>0 rev</span>
                  )}
                </div>

                <div className="pp-row-streak-cell">
                  <FiZap /> {player?.streak || 0}
                </div>

                <div className="pp-row-score-cell">
                  {player?.productivityScore || 0} PTS
                </div>
              </div>
            );
          })}

          {activeList.length === 0 && (
            <div className="pp-table-empty">
              No voyagers detected in this ranking sector.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
