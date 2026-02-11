import React from "react";

const LoadingSpinner = ({ message = "Loading..." }) => {
    return (
        <div className="pp-dashboard-loading">
            <div className="pp-orbit-loader" />
            <p>{message}</p>
        </div>
    );
};

export default LoadingSpinner;
