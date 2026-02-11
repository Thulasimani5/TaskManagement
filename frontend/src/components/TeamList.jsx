import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/global.css";

const TeamList = () => {
    const [users, setUsers] = useState([]);
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

    const leads = users.filter((u) => u.role === "lead" || u.role === "admin");
    const members = users.filter((u) => u.role === "user");

    return (
        <div className="pp-team-panel glassy-surface">
            <div className="pp-team-header">
                <h3>Team Directory</h3>
            </div>

            <div className="pp-team-group">
                <h4>Conductors (Leads)</h4>
                <div className="pp-team-list">
                    {leads.map((user) => (
                        <div key={user._id} className="pp-team-member">
                            <div className={`pp-member-avatar role-${user.role}`}>
                                {user.name.charAt(0)}
                            </div>
                            <div className="pp-member-info">
                                <span className="pp-member-name">{user.name}</span>
                                <span className="pp-member-role">{user.role}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="pp-team-group">
                <h4>Mission Specialists</h4>
                <div className="pp-team-list">
                    {members.length === 0 ? (
                        <p className="pp-muted">No members yet.</p>
                    ) : (
                        members.map((user) => (
                            <div key={user._id} className="pp-team-member">
                                <div className="pp-member-avatar role-user">
                                    {user.name.charAt(0)}
                                </div>
                                <div className="pp-member-info">
                                    <span className="pp-member-name">{user.name}</span>
                                    <span className="pp-member-email">{user.email}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamList;
