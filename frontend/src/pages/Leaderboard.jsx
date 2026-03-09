import React, { useState, useEffect } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { FiAward, FiStar, FiTrendingUp, FiZap } from "react-icons/fi";

const RankingSection = ({ title, data, maxScore, delayOffset = 0 }) => {
  if (!data || data.length === 0) return null;

  const top3 = data.slice(0, 3);
  const rest = data.slice(3);

  const getRankIcon = (rank) => {
    if (rank === 0) return <FiAward className="rank-icon gold" />;
    if (rank === 1) return <FiAward className="rank-icon silver" />;
    if (rank === 2) return <FiAward className="rank-icon bronze" />;
    return null;
  };

  return (
    <div className="pp-ranking-sector">
      <h3 className="pp-sector-title">{title}</h3>
      
      {/* Top 3 Podium */}
      <div className="pp-podium">
        {top3.map((player, index) => (
          <div 
            key={player?._id || `${title}-${index}`} 
            className={`pp-podium-card rank-${index + 1} pp-animate-slide-up`}
            style={{ 
              animationDelay: `${(index + delayOffset) * 0.1}s`,
              opacity: 1 
            }}
          >
            <div className="pp-podium-rank">
              {getRankIcon(index)}
              <span className="rank-number">#{index + 1}</span>
            </div>
            
            <div className="pp-podium-avatar-wrapper">
              <div className="pp-podium-avatar">
                {player?.name?.charAt(0) || "?"}
              </div>
              <div className="pp-avatar-pulse"></div>
            </div>

            <h3 className="pp-podium-name">{player?.name || "Unknown Voyager"}</h3>
            <p className="pp-podium-role">{player?.role || "Explorer"}</p>
            
            <div className="pp-podium-stats">
              <div className="podium-stat">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiStar />
                  <span>Score</span>
                </div>
                <span>{player?.productivityScore || 0}</span>
              </div>
              <div className="podium-stat">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiZap />
                  <span>Streak</span>
                </div>
                <span>{player?.streak || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Remaining Rankings */}
      {rest.length > 0 && (
        <div className="pp-leaderboard-list">
          <div className="pp-list-header">
            <span>Rank</span>
            <span>Voyager</span>
            <span>Missions</span>
            <span>Score</span>
            <span>Streak</span>
          </div>
          <div className="pp-list-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {rest.map((player, index) => (
              <div key={player?._id || `${title}-rest-${index}`} className="pp-list-row pp-animate-slide-up" style={{ animationDelay: `${(index + 3 + delayOffset) * 0.05}s` }}>
                <span className="row-rank">#{index + 4}</span>
                <div className="row-user">
                  <div className="row-avatar">{player?.name?.charAt(0) || "?"}</div>
                  <div className="row-info" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span className="row-name">{player?.name || "Unknown Voyager"}</span>
                      <span className="row-role">{player?.role || "Explorer"}</span>
                    </div>
                    <div className="pp-row-progress-container">
                      <div 
                        className="pp-row-progress-bar" 
                        style={{ width: `${Math.max(10, (player?.productivityScore / maxScore) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <span className="row-completed">{player?.completedTasks || 0}</span>
                <span className="row-score">{player?.productivityScore || 0}</span>
                <span className="row-streak">
                  <FiTrendingUp /> {player?.streak || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Leaderboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ users: [], leads: [] });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("all-time");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/leaderboard?timeframe=${timeframe}`);
        // Handle both single array and object response for backward compatibility or direct access
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
        <p>Calculating galactic rankings...</p>
      </div>
    );
  }

  const allScores = [...(data.users || []), ...(data.leads || [])].map(u => u.productivityScore);
  const maxScore = allScores.length > 0 ? Math.max(...allScores) : 1;

  return (
    <div className="pp-leaderboard-page">
      <div className="pp-section-header">
        <div>
          <h2>Leaderboard Ranking</h2>
          <p>Elite Task Voyagers across the PurplePulse galaxy.</p>
        </div>
        <div className="pp-view-toggle">
          {["all-time", "monthly", "weekly"].map((tf) => (
            <button
              key={tf}
              className={`pp-toggle-btn ${timeframe === tf ? "active" : ""}`}
              onClick={() => setTimeframe(tf)}
            >
              {tf.replace("-", " ").toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="pp-leaderboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
        <RankingSection 
          title="Team Lead Rankings" 
          data={data.leads} 
          maxScore={maxScore} 
        />
        
        <RankingSection 
          title="User Rankings" 
          data={data.users} 
          maxScore={maxScore} 
          delayOffset={data.leads ? data.leads.length : 0}
        />

        {(!data.users || data.users.length === 0) && (!data.leads || data.leads.length === 0) && (
          <div className="pp-empty-msg glassy-surface" style={{ padding: '40px', borderRadius: '20px', textAlign: 'center' }}>
            No voyagers in this sector yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
