import { useEffect, useState } from "react";
import api from "../services/api";
import { useSearch } from "../context/SearchContext.jsx";
import "../styles/global.css";

const TeamList = () => {
    const [users, setUsers] = useState([]);
    const { searchQuery } = useSearch();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await api.getUsers();
                setUsers(data);
            } catch (err) {
                setError("Failed to load team.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) return <div className="pp-team-loading">Loading Team...</div>;
    if (error) return <div className="pp-team-error">{error}</div>;

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const leads = filteredUsers.filter((u) => u.role === "lead" || u.role === "admin");
    const members = filteredUsers.filter((u) => u.role === "user");

    const getRoleEmoji = (role) => {
        switch (role) {
            case "admin": return "👑";
            case "lead": return "🎭";
            case "user": return "🚀";
            default: return "👤";
        }
    };

    const TeamGroup = ({ title, groupUsers }) => (
        <div className="pp-team-group">
            <h4>{title}</h4>
            <div className={`pp-team-grid ${groupUsers.length === 0 ? "empty" : ""}`}>
                {groupUsers.length === 0 ? (
                    <p className="pp-muted">No members in this group yet.</p>
                ) : (
                    groupUsers.map((user) => (
                        <div key={user._id} className="pp-team-card">
                            <div className={`pp-card-avatar role-${user.role}`}>
                                {user.name.charAt(0)}
                            </div>
                            <h5 className="pp-card-name">{user.name}</h5>
                            <div className="pp-card-role">
                                <span>{getRoleEmoji(user.role)}</span>
                                {user.role}
                            </div>
                            <div className="pp-card-email">{user.email}</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className="pp-team-container">
            <div className="pp-team-header">
                <h3>Team Directory</h3>
            </div>

            <TeamGroup title="Conductors (Leads & Admins)" groupUsers={leads} />
            <TeamGroup title="Mission Specialists" groupUsers={members} />
        </div>
    );
};

export default TeamList;
