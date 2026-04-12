import React from 'react';

/**
 * Bloom's Taxonomy Badge
 * Shows the cognitive level of the student's question.
 * This is a UNIQUE feature — no AI chatbot does this.
 */
export default function BloomsBadge({ blooms }) {
    if (!blooms || !blooms.level) return null;

    const levelColors = {
        "Remember": { bg: "#eef2ff", border: "#6366f1", text: "#4338ca" },
        "Understand": { bg: "#f3e8ff", border: "#8b5cf6", text: "#6d28d9" },
        "Apply": { bg: "#eff6ff", border: "#3b82f6", text: "#1d4ed8" },
        "Analyze": { bg: "#fffbeb", border: "#f59e0b", text: "#b45309" },
        "Evaluate": { bg: "#fef2f2", border: "#ef4444", text: "#b91c1c" },
        "Create": { bg: "#ecfdf5", border: "#10b981", text: "#047857" },
    };

    const colors = levelColors[blooms.level] || levelColors["Understand"];

    // Progress bar showing levels 1 through 6
    const levels = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];
    const currentIdx = levels.indexOf(blooms.level);

    return (
        <div style={{
            marginBottom: "1rem",
            padding: "1rem 1.25rem",
            background: colors.bg,
            border: `2px solid ${colors.border}`,
            borderRadius: "12px",
        }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.25rem" }}>{blooms.emoji}</span>
                    <span style={{ fontWeight: "800", color: colors.text, fontSize: "0.9rem" }}>
                        Bloom's Level: {blooms.level}
                    </span>
                </div>
                <span style={{
                    fontSize: "0.7rem",
                    padding: "2px 8px",
                    background: colors.border,
                    color: "white",
                    borderRadius: "10px",
                    fontWeight: "700"
                }}>
                    Level {blooms.level_number}/6
                </span>
            </div>

            {/* Level Progress Bar */}
            <div style={{ display: "flex", gap: "3px", marginBottom: "0.5rem" }}>
                {levels.map((lvl, idx) => (
                    <div
                        key={lvl}
                        title={lvl}
                        style={{
                            flex: 1,
                            height: "6px",
                            borderRadius: "3px",
                            background: idx <= currentIdx ? colors.border : "#e5e7eb",
                            transition: "all 0.3s ease"
                        }}
                    />
                ))}
            </div>

            {/* Description */}
            <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.8rem", color: colors.text, lineHeight: "1.4" }}>
                {blooms.description}
            </p>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b", fontStyle: "italic" }}>
                {blooms.study_tip}
            </p>
        </div>
    );
}
