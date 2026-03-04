import { useState, useEffect } from "react";
import { getUserHistory } from "../api/backend";
import { useAppContext } from "../context/AppContext";

export default function History() {
    const { student } = useAppContext();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        loadHistory();
    }, []);

    async function loadHistory() {
        setLoading(true);
        try {
            const data = await getUserHistory();
            setHistory(data.history || []);
        } catch (err) {
            console.error("Error loading history:", err);
        } finally {
            setLoading(false);
        }
    }

    const filteredHistory = filter === "all"
        ? history
        : history.filter(item => item.type === filter);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString();
    };

    const getIcon = (type) => {
        switch (type) {
            case 'search': return '🔍';
            case 'chat': return '💬';
            case 'lab': return '🧪';
            case 'learning': return '📚';
            case 'project': return '💡';
            case 'research': return '🔬';
            case 'tech_stack': return '🛠️';
            default: return '📄';
        }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>📜 Your Activity History</h1>
                <p style={styles.subtitle}>Relive your learning journey, {student?.name}</p>
            </header>

            <div style={styles.filters}>
                {['all', 'search', 'chat', 'learning', 'lab', 'project', 'research', 'tech_stack'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{ ...styles.filterBtn, ...(filter === f ? styles.activeFilter : {}) }}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={styles.loading}>
                    <div style={styles.spinner}></div>
                    <p>Loading history...</p>
                </div>
            ) : filteredHistory.length > 0 ? (
                <div style={styles.historyList}>
                    {filteredHistory.map((item, index) => (
                        <div key={item.id || index} style={styles.historyCard}>
                            <div style={styles.cardHeader}>
                                <span style={styles.typeIcon}>{getIcon(item.type)}</span>
                                <span style={styles.typeLabel}>{item.type.toUpperCase()}</span>
                                <span style={styles.timestamp}>{formatDate(item.timestamp)}</span>
                            </div>
                            <div style={styles.cardBody}>
                                <h3 style={styles.query}>{item.query}</h3>
                                {item.topic && <div style={styles.topicBadge}>{item.topic}</div>}
                                {item.response && (
                                    <div style={styles.response}>
                                        {item.response.length > 300
                                            ? item.response.substring(0, 300) + "..."
                                            : item.response}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={styles.empty}>
                    <div style={styles.emptyIcon}>🕳️</div>
                    <h3>No history found</h3>
                    <p>Start interacting with the assistant to see your history here!</p>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "'Inter', sans-serif",
    },
    header: {
        textAlign: "center",
        marginBottom: "40px",
    },
    title: {
        fontSize: "2.5rem",
        fontWeight: "800",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        marginBottom: "10px",
    },
    subtitle: {
        color: "#6b7280",
        fontSize: "1.1rem",
    },
    filters: {
        display: "flex",
        gap: "10px",
        justifyContent: "center",
        flexWrap: "wrap",
        marginBottom: "30px",
    },
    filterBtn: {
        padding: "8px 16px",
        borderRadius: "20px",
        border: "1px solid #e5e7eb",
        background: "white",
        color: "#374151",
        fontSize: "0.9rem",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s",
    },
    activeFilter: {
        background: "#667eea",
        color: "white",
        borderColor: "#667eea",
    },
    historyList: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    historyCard: {
        background: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(10px)",
        borderRadius: "20px",
        padding: "24px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
        border: "1px solid rgba(229, 231, 235, 0.5)",
        transition: "transform 0.2s, box-shadow 0.2s",
        marginBottom: "16px",
    },
    cardHeader: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "16px",
        paddingBottom: "12px",
        borderBottom: "1px solid #f3f4f6",
    },
    typeIcon: {
        fontSize: "1.4rem",
        background: "linear-gradient(135deg, #f3f4f6, #e5e7eb)",
        width: "40px",
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "10px",
    },
    typeLabel: {
        fontSize: "0.7rem",
        fontWeight: "800",
        color: "#6b7280",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
    },
    timestamp: {
        marginLeft: "auto",
        fontSize: "0.8rem",
        color: "#9ca3af",
        fontWeight: "500",
    },
    cardBody: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    query: {
        margin: 0,
        fontSize: "1.2rem",
        color: "#111827",
        fontWeight: "700",
    },
    topicBadge: {
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: "20px",
        background: "rgba(102, 126, 234, 0.1)",
        color: "#4f46e5",
        fontSize: "0.75rem",
        fontWeight: "700",
        alignSelf: "flex-start",
    },
    response: {
        color: "#4b5563",
        fontSize: "0.95rem",
        lineHeight: "1.6",
        background: "#f8fafc",
        padding: "16px",
        borderRadius: "12px",
        marginTop: "4px",
        border: "1px solid #f1f5f9",
    },
    loading: {
        textAlign: "center",
        padding: "60px",
    },
    spinner: {
        width: "40px",
        height: "40px",
        border: "3px solid #e5e7eb",
        borderTopColor: "#667eea",
        borderRadius: "50%",
        margin: "0 auto 20px",
        animation: "spin 1s linear infinite",
    },
    empty: {
        textAlign: "center",
        padding: "60px",
        color: "#9ca3af",
    },
    emptyIcon: {
        fontSize: "4rem",
        marginBottom: "20px",
    },
};
