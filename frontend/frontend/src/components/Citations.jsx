import React, { useState } from 'react';

/**
 * Component to display syllabus citations with click-to-expand functionality
 */
export default function Citations({ citations }) {
    const [expandedIdx, setExpandedIdx] = useState(null);

    if (!citations || citations.length === 0) return null;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <span style={styles.icon}>📎</span>
                <h4 style={styles.title}>Syllabus Proof (Citations)</h4>
            </div>

            <p style={styles.subtitle}>
                Information verified from the following parts of your uploaded syllabus:
            </p>

            <div style={styles.list}>
                {citations.map((cite, idx) => (
                    <div
                        key={idx}
                        style={{
                            ...styles.citationCard,
                            borderLeft: `4px solid ${expandedIdx === idx ? '#667eea' : '#e5e7eb'}`
                        }}
                    >
                        <div
                            style={styles.citationHeader}
                            onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                        >
                            <div style={styles.meta}>
                                <span style={styles.sourceLabel}>📄 {cite.source || "Syllabus"}</span>
                                {cite.unit && (
                                    <span style={styles.unitLabel}>🏷️ {cite.unit}</span>
                                )}
                                <span style={styles.pageLabel}>Page {cite.page}</span>
                            </div>
                            <button style={styles.expandBtn}>
                                {expandedIdx === idx ? 'Collapse' : 'View Excerpt'}
                            </button>
                        </div>

                        {expandedIdx === idx && (
                            <div style={styles.excerptContainer}>
                                <div style={styles.excerptText}>
                                    "{cite.content}"
                                </div>
                                <div style={styles.verifiedBadge}>
                                    ✅ Verified Context
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

const styles = {
    container: {
        marginTop: '2rem',
        padding: '1.5rem',
        background: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '0.5rem',
    },
    icon: {
        fontSize: '1.25rem',
    },
    title: {
        margin: 0,
        fontSize: '1.1rem',
        fontWeight: '700',
        color: '#1e293b',
    },
    subtitle: {
        margin: '0 0 1rem 0',
        fontSize: '0.85rem',
        color: '#64748b',
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
    },
    citationCard: {
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
    },
    citationHeader: {
        padding: '0.75rem 1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
    },
    meta: {
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
    },
    sourceLabel: {
        fontSize: '0.85rem',
        fontWeight: '600',
        color: '#475569',
    },
    unitLabel: {
        fontSize: '0.75rem',
        padding: '2px 8px',
        background: '#eef2ff',
        borderRadius: '4px',
        color: '#6366f1',
        fontWeight: '700',
    },
    pageLabel: {
        fontSize: '0.75rem',
        padding: '2px 8px',
        background: '#f1f5f9',
        borderRadius: '4px',
        color: '#64748b',
        fontWeight: '600',
    },
    expandBtn: {
        fontSize: '0.75rem',
        background: 'transparent',
        border: 'none',
        color: '#667eea',
        fontWeight: '600',
        cursor: 'pointer',
        padding: '4px 8px',
    },
    excerptContainer: {
        padding: '1rem',
        background: '#fcfcfd',
        borderTop: '1px solid #f1f5f9',
    },
    excerptText: {
        fontSize: '0.9rem',
        lineHeight: '1.6',
        color: '#334155',
        fontStyle: 'italic',
        marginBottom: '0.75rem',
    },
    verifiedBadge: {
        display: 'inline-block',
        fontSize: '0.7rem',
        fontWeight: '700',
        color: '#059669',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
    }
};
