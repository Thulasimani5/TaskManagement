import React from "react";
import TeamList from "../components/TeamList.jsx";
import "../styles/global.css";

const TeamDirectory = () => {
    return (
        <div className="pp-page-container">
            <div className="pp-section-header">
                <div>
                    <h2>Team Directory</h2>
                    <p>Access and manage your team of Conductors and Specialists.</p>
                </div>
            </div>
            <div className="pp-directory-wrapper">
                <TeamList />
            </div>
        </div>
    );
};

export default TeamDirectory;
