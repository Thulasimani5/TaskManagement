import React from 'react';

export const HighlightText = ({ text, highlight, className = "" }) => {
    if (!highlight || !text) {
        return <span className={className}>{text}</span>;
    }

    // Ensure inputs are strings
    const strText = String(text);
    const strHighlight = String(highlight);

    // Escape special regex characters to prevent crashes
    const safeHighlight = strHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = strText.split(new RegExp(`(${safeHighlight})`, 'gi'));

    return (
        <span className={className}>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <span key={i} className="pp-highlight">{part}</span>
                ) : (
                    part
                )
            )}
        </span>
    );
};
