import React from 'react';

const KnowledgeSuggestions = ({ suggestions, onSelect }) => {
    if (!suggestions || suggestions.length === 0) return null;

    return (
        <div style={styles.container}>
            <h4 style={styles.title}>💡 Ready to go deeper? Try these:</h4>
            <div style={styles.badgeContainer}>
                {suggestions.map((topic, i) => (
                    <button
                        key={i}
                        onClick={() => onSelect(topic)}
                        style={styles.suggestionBadge}
                    >
                        {topic}
                    </button>
                ))}
            </div>
        </div>
    );
};

const styles = {
    container: {
        marginTop: '1.2rem',
        padding: '1rem',
        borderRadius: '12px',
        background: 'rgba(99, 102, 241, 0.05)',
        border: '1px dashed rgba(99, 102, 241, 0.3)',
    },
    title: {
        margin: '0 0 0.8rem 0',
        fontSize: '0.85rem',
        color: '#4f46e5',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    badgeContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
    },
    suggestionBadge: {
        padding: '6px 14px',
        borderRadius: '20px',
        background: 'white',
        border: '1px solid #e2e8f0',
        color: '#475569',
        fontSize: '0.85rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        ':hover': {
            borderColor: '#4f46e5',
            color: '#4f46e5',
            transform: 'translateY(-1px)',
        }
    }
};

export default KnowledgeSuggestions;
