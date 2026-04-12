import React, { useState } from 'react';

/**
 * SyllabusVerification Panel
 * ==========================
 * This component VISUALLY PROVES that the AI answer is derived from the syllabus.
 * It shows:
 * - Verification status (verified/not verified)
 * - Confidence percentage
 * - Matched topics from syllabus
 * - Source pages
 * - The complete RAG pipeline steps
 * 
 * THIS IS THE KEY DIFFERENTIATOR FROM ChatGPT.
 */
export default function SyllabusVerification({ verification }) {
    const [expanded, setExpanded] = useState(false);

    if (!verification) return null;

    const {
        is_syllabus_verified,
        confidence,
        matched_topics = [],
        matched_unit,
        source_pages = [],
        matched_keywords = [],
        verification_status,
        pipeline_steps = []
    } = verification;

    const statusColor = is_syllabus_verified
        ? { bg: "#ecfdf5", border: "#10b981", text: "#065f46", badge: "#10b981" }
        : { bg: "#fef3c7", border: "#f59e0b", text: "#92400e", badge: "#f59e0b" };

    return (
        <div style={{
            marginBottom: "1rem",
            borderRadius: "14px",
            border: `2px solid ${statusColor.border}`,
            background: statusColor.bg,
            overflow: "hidden"
        }}>
            {/* Header — Always visible */}
            <div
                onClick={() => setExpanded(!expanded)}
                style={{
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    userSelect: "none"
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{
                        padding: "3px 10px",
                        background: statusColor.badge,
                        color: "white",
                        borderRadius: "8px",
                        fontSize: "0.75rem",
                        fontWeight: "800",
                        letterSpacing: "0.05em"
                    }}>
                        {is_syllabus_verified ? "SYLLABUS VERIFIED" : "LOW MATCH"}
                    </span>
                    <span style={{ fontSize: "0.85rem", fontWeight: "700", color: statusColor.text }}>
                        {confidence}% Syllabus Match
                    </span>
                    {matched_unit && matched_unit !== "General" && (
                        <span style={{
                            padding: "2px 8px",
                            background: "white",
                            border: `1px solid ${statusColor.border}`,
                            borderRadius: "6px",
                            fontSize: "0.7rem",
                            fontWeight: "700",
                            color: statusColor.text
                        }}>
                            {matched_unit}
                        </span>
                    )}
                </div>
                <span style={{ fontSize: "0.8rem", color: statusColor.text }}>
                    {expanded ? "▲ Hide Details" : "▼ Show Pipeline"}
                </span>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div style={{
                    padding: "0 16px 16px",
                    borderTop: `1px solid ${statusColor.border}33`
                }}>
                    {/* RAG Pipeline Steps */}
                    <div style={{ marginBottom: "12px" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: "800", color: statusColor.text, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            🔄 RAG Pipeline Steps
                        </div>
                        {pipeline_steps.map((step, idx) => (
                            <div key={idx} style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "8px",
                                padding: "6px 0",
                                fontSize: "0.8rem",
                                color: statusColor.text,
                                borderBottom: idx < pipeline_steps.length - 1 ? `1px dashed ${statusColor.border}33` : "none"
                            }}>
                                <span style={{ fontWeight: "800", minWidth: "20px" }}>{step.status}</span>
                                <span style={{ fontWeight: "700", minWidth: "130px" }}>{step.name}</span>
                                <span style={{ opacity: 0.8 }}>{step.detail}</span>
                            </div>
                        ))}
                    </div>

                    {/* Matched Topics */}
                    {matched_topics.length > 0 && (
                        <div style={{ marginBottom: "10px" }}>
                            <div style={{ fontSize: "0.75rem", fontWeight: "800", color: statusColor.text, marginBottom: "6px" }}>
                                📚 Matched Syllabus Topics:
                            </div>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                {matched_topics.slice(0, 8).map((topic, idx) => (
                                    <span key={idx} style={{
                                        padding: "3px 10px",
                                        background: "white",
                                        border: `1px solid ${statusColor.border}`,
                                        borderRadius: "6px",
                                        fontSize: "0.72rem",
                                        fontWeight: "600",
                                        color: statusColor.text
                                    }}>
                                        {topic}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Source Pages */}
                    {source_pages.length > 0 && (
                        <div style={{ fontSize: "0.75rem", color: statusColor.text }}>
                            <strong>📄 Source Pages:</strong> {source_pages.join(", ")}
                        </div>
                    )}

                    {/* Matched Keywords */}
                    {matched_keywords.length > 0 && (
                        <div style={{ fontSize: "0.75rem", color: statusColor.text, marginTop: "4px" }}>
                            <strong>🔑 Keywords Matched:</strong> {matched_keywords.join(", ")}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
