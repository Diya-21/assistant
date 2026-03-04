import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { getProgress, getAnalytics } from "../api/backend";

export default function Dashboard() {
    const { student, logout, syllabusUploaded, syllabusName } = useAppContext();
    const navigate = useNavigate();
    const [progress, setProgress] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProgress();
    }, []);

    async function loadProgress() {
        setLoading(true);
        try {
            const [progressData, analyticsData] = await Promise.all([
                getProgress(),
                getAnalytics(),
            ]);
            setProgress(progressData);
            setAnalytics(analyticsData);
        } catch (err) {
            console.error("Error loading progress:", err);
        } finally {
            setLoading(false);
        }
    }

    const hasActivity = progress && progress.total_activities > 0;
    const topicsCount = progress?.summary?.total_topics || 0;
    const quizzesCount = progress?.quizzes_taken || 0;
    const avgScore = progress?.average_score || 0;
    const streakDays = progress?.streak_days || 0;
    const achievements = progress?.achievements || [];
    const topics = progress?.topics || {};

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    if (loading) {
        return (
            <div style={styles.page}>
                <div style={styles.loadingBox}>
                    <div style={styles.spinner}></div>
                    <p style={{ color: "#6b7280" }}>Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            {/* Welcome Header */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <h1 style={styles.greeting}>
                        {getGreeting()}, <span style={styles.nameHighlight}>{student?.name}</span>! 👋
                    </h1>
                    <p style={styles.rollInfo}>Roll No: {student?.rollNo}</p>
                    {syllabusUploaded && (
                        <span style={styles.syllabusChip}>
                            📎 Active Syllabus: {syllabusName}
                        </span>
                    )}
                </div>
                <button onClick={handleLogout} style={styles.logoutBtn}>
                    🚪 Logout
                </button>
            </div>

            {/* Main Content */}
            {!hasActivity ? (
                /* ───── Empty State: Start Your Journey ───── */
                <div style={styles.emptyContainer}>
                    <div style={styles.emptyCard}>
                        <div style={styles.emptyIcon}>🚀</div>
                        <h2 style={styles.emptyTitle}>Start Your Learning Journey!</h2>
                        <p style={styles.emptyText}>
                            Welcome to your AI-powered learning companion! Begin by uploading
                            your syllabus, then explore interactive theory, virtual labs, and more.
                        </p>

                        <div style={styles.stepsList}>
                            <div style={styles.step}>
                                <div style={styles.stepNum}>1</div>
                                <div>
                                    <strong>Upload Syllabus</strong>
                                    <p style={styles.stepDesc}>Upload your course PDF to personalize learning</p>
                                </div>
                            </div>
                            <div style={styles.step}>
                                <div style={styles.stepNum}>2</div>
                                <div>
                                    <strong>Explore Topics</strong>
                                    <p style={styles.stepDesc}>Ask questions, get explanations, and take quizzes</p>
                                </div>
                            </div>
                            <div style={styles.step}>
                                <div style={styles.stepNum}>3</div>
                                <div>
                                    <strong>Track Progress</strong>
                                    <p style={styles.stepDesc}>Watch your knowledge grow and earn achievements</p>
                                </div>
                            </div>
                        </div>

                        <div style={styles.emptyActions}>
                            <button onClick={() => navigate("/upload")} style={styles.primaryBtn}>
                                📤 Upload Syllabus
                            </button>
                            <button onClick={() => navigate("/theory")} style={styles.secondaryBtn}>
                                📚 Start Learning
                            </button>
                        </div>
                    </div>

                    {/* Quick Access Cards */}
                    <div style={styles.quickAccessGrid}>
                        {quickLinks.map((link) => (
                            <div
                                key={link.path}
                                onClick={() => navigate(link.path)}
                                style={styles.quickCard}
                            >
                                <span style={styles.quickIcon}>{link.icon}</span>
                                <span style={styles.quickLabel}>{link.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* ───── Active State: Progress Dashboard ───── */
                <div style={styles.dashboardContainer}>
                    {/* Stats Cards */}
                    <div style={styles.statsGrid}>
                        <StatCard icon="📚" value={topicsCount} label="Topics Studied" color="#667eea" />
                        <StatCard icon="🧠" value={quizzesCount} label="Quizzes Taken" color="#f59e0b" />
                        <StatCard icon="📊" value={`${avgScore}%`} label="Avg Score" color="#10b981" />
                        <StatCard icon="🔥" value={streakDays} label="Day Streak" color="#ef4444" />
                    </div>

                    {/* Main Content Grid */}
                    <div style={styles.contentGrid}>
                        {/* Recent Topics */}
                        <div style={styles.card}>
                            <h3 style={styles.cardTitle}>📖 Recent Topics</h3>
                            {Object.entries(topics).length > 0 ? (
                                <div style={styles.topicsList}>
                                    {Object.entries(topics).slice(0, 5).map(([name, data]) => (
                                        <div key={name} style={styles.topicRow}>
                                            <div style={styles.topicInfo}>
                                                <span style={styles.topicName}>{name}</span>
                                                <span style={{
                                                    ...styles.masteryBadge,
                                                    background: data.mastery_level >= 75 ? "#d1fae5" :
                                                        data.mastery_level >= 50 ? "#fef3c7" : "#e0e7ff",
                                                    color: data.mastery_level >= 75 ? "#065f46" :
                                                        data.mastery_level >= 50 ? "#92400e" : "#4338ca",
                                                }}>
                                                    {data.mastery_level}%
                                                </span>
                                            </div>
                                            <div style={styles.progressBar}>
                                                <div style={{
                                                    ...styles.progressFill,
                                                    width: `${data.mastery_level}%`,
                                                    background: data.mastery_level >= 75 ? "#10b981" :
                                                        data.mastery_level >= 50 ? "#f59e0b" : "#667eea",
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={styles.emptyMsg}>Start studying to see your topics here!</p>
                            )}
                            <button
                                onClick={() => navigate("/progress")}
                                style={styles.viewAllBtn}
                            >
                                View Full Progress →
                            </button>
                        </div>

                        {/* Achievements */}
                        <div style={styles.card}>
                            <h3 style={styles.cardTitle}>🏆 Achievements</h3>
                            {achievements.length > 0 ? (
                                <div style={styles.achievementsList}>
                                    {achievements.map((id) => {
                                        const info = getAchievementInfo(id);
                                        return (
                                            <div key={id} style={styles.achievementItem}>
                                                <span style={styles.achievementIcon}>{info.icon}</span>
                                                <div>
                                                    <strong>{info.title}</strong>
                                                    <p style={styles.achievementDesc}>{info.desc}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={styles.noAchievements}>
                                    <span style={{ fontSize: "2.5rem" }}>🔒</span>
                                    <p>Keep learning to unlock achievements!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div style={styles.quickActionsSection}>
                        <h3 style={styles.sectionTitle}>⚡ Quick Actions</h3>
                        <div style={styles.quickAccessGrid}>
                            {quickLinks.map((link) => (
                                <div
                                    key={link.path}
                                    onClick={() => navigate(link.path)}
                                    style={styles.quickCard}
                                >
                                    <span style={styles.quickIcon}>{link.icon}</span>
                                    <span style={styles.quickLabel}>{link.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const quickLinks = [
    { icon: "📤", label: "Upload Syllabus", path: "/upload" },
    { icon: "📚", label: "Theory", path: "/theory" },
    { icon: "🧪", label: "Lab", path: "/lab" },
    { icon: "💡", label: "Projects", path: "/projects" },
    { icon: "🔬", label: "Research", path: "/research" },
    { icon: "🛠️", label: "Tech Stack", path: "/tech-stack" },
    { icon: "📜", label: "History", path: "/history" },
    { icon: "📊", label: "Full Progress", path: "/progress" },
];

function getAchievementInfo(id) {
    const achievements = {
        first_steps: { icon: "👶", title: "First Steps", desc: "Started your learning journey" },
        quiz_master: { icon: "🏆", title: "Quiz Master", desc: "Scored 80%+ on 5 quizzes" },
        explorer: { icon: "🗺️", title: "Explorer", desc: "Studied 5 different topics" },
        perfectionist: { icon: "💯", title: "Perfectionist", desc: "Got 100% on a quiz" },
        streak_week: { icon: "🔥", title: "On Fire", desc: "7-day learning streak" },
        deep_diver: { icon: "🔬", title: "Deep Diver", desc: "Deep explanations for 10 topics" },
    };
    return achievements[id] || { icon: "⭐", title: id, desc: "Unlocked!" };
}

function StatCard({ icon, value, label, color }) {
    return (
        <div style={styles.statCard}>
            <div style={{ ...styles.statIconBg, background: `${color}15` }}>
                <span style={{ fontSize: "1.5rem" }}>{icon}</span>
            </div>
            <div style={{ ...styles.statValue, color }}>{value}</div>
            <div style={styles.statLabel}>{label}</div>
        </div>
    );
}

const styles = {
    page: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "30px 20px",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
    },
    loadingBox: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
    },
    spinner: {
        width: "44px",
        height: "44px",
        border: "4px solid #e5e7eb",
        borderTopColor: "#667eea",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "36px",
        flexWrap: "wrap",
        gap: "16px",
    },
    headerLeft: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    greeting: {
        fontSize: "1.8rem",
        fontWeight: "700",
        color: "#1f2937",
        margin: 0,
    },
    nameHighlight: {
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    },
    rollInfo: {
        color: "#6b7280",
        fontSize: "0.95rem",
        margin: 0,
    },
    syllabusChip: {
        display: "inline-block",
        padding: "4px 14px",
        borderRadius: "20px",
        background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
        color: "#065f46",
        fontSize: "0.8rem",
        fontWeight: "600",
        border: "1px solid #a7f3d0",
        marginTop: "4px",
    },
    logoutBtn: {
        padding: "10px 20px",
        borderRadius: "10px",
        border: "1px solid #e5e7eb",
        background: "white",
        color: "#6b7280",
        fontSize: "0.9rem",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s",
    },

    /* ── Empty State ── */
    emptyContainer: {},
    emptyCard: {
        background: "white",
        borderRadius: "24px",
        padding: "48px 40px",
        textAlign: "center",
        boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
        marginBottom: "30px",
    },
    emptyIcon: {
        fontSize: "4rem",
        marginBottom: "16px",
    },
    emptyTitle: {
        fontSize: "1.8rem",
        fontWeight: "700",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        marginBottom: "12px",
    },
    emptyText: {
        color: "#6b7280",
        fontSize: "1.05rem",
        maxWidth: "500px",
        margin: "0 auto 32px",
        lineHeight: "1.6",
    },
    stepsList: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        maxWidth: "400px",
        margin: "0 auto 32px",
        textAlign: "left",
    },
    step: {
        display: "flex",
        gap: "16px",
        alignItems: "center",
    },
    stepNum: {
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "700",
        fontSize: "0.9rem",
        flexShrink: 0,
    },
    stepDesc: {
        color: "#6b7280",
        fontSize: "0.85rem",
        margin: "2px 0 0",
    },
    emptyActions: {
        display: "flex",
        gap: "16px",
        justifyContent: "center",
        flexWrap: "wrap",
    },
    primaryBtn: {
        padding: "14px 28px",
        borderRadius: "12px",
        border: "none",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        color: "white",
        fontSize: "1rem",
        fontWeight: "600",
        cursor: "pointer",
        boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)",
        textDecoration: "none",
    },
    secondaryBtn: {
        padding: "14px 28px",
        borderRadius: "12px",
        border: "2px solid #667eea",
        background: "transparent",
        color: "#667eea",
        fontSize: "1rem",
        fontWeight: "600",
        cursor: "pointer",
        textDecoration: "none",
    },

    /* ── Dashboard Active State ── */
    dashboardContainer: {},
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "20px",
        marginBottom: "30px",
    },
    statCard: {
        background: "white",
        padding: "24px",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        textAlign: "center",
    },
    statIconBg: {
        width: "48px",
        height: "48px",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 12px",
    },
    statValue: {
        fontSize: "1.8rem",
        fontWeight: "800",
        marginBottom: "4px",
    },
    statLabel: {
        color: "#6b7280",
        fontSize: "0.85rem",
        fontWeight: "500",
    },
    contentGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
        marginBottom: "30px",
    },
    card: {
        background: "white",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    },
    cardTitle: {
        fontSize: "1.15rem",
        fontWeight: "700",
        color: "#1f2937",
        margin: "0 0 16px 0",
    },
    topicsList: {
        display: "flex",
        flexDirection: "column",
        gap: "14px",
    },
    topicRow: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    topicInfo: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    topicName: {
        fontWeight: "600",
        color: "#374151",
        fontSize: "0.9rem",
    },
    masteryBadge: {
        padding: "2px 10px",
        borderRadius: "20px",
        fontSize: "0.75rem",
        fontWeight: "700",
    },
    progressBar: {
        height: "6px",
        background: "#f3f4f6",
        borderRadius: "3px",
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: "3px",
        transition: "width 1s ease",
    },
    emptyMsg: {
        color: "#9ca3af",
        fontSize: "0.9rem",
        textAlign: "center",
        padding: "20px 0",
    },
    viewAllBtn: {
        marginTop: "16px",
        background: "none",
        border: "none",
        color: "#667eea",
        fontWeight: "600",
        fontSize: "0.9rem",
        cursor: "pointer",
        padding: 0,
    },
    achievementsList: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    achievementItem: {
        display: "flex",
        gap: "12px",
        alignItems: "center",
    },
    achievementIcon: {
        fontSize: "1.5rem",
    },
    achievementDesc: {
        color: "#6b7280",
        fontSize: "0.8rem",
        margin: "2px 0 0",
    },
    noAchievements: {
        textAlign: "center",
        padding: "24px",
        color: "#9ca3af",
    },
    quickActionsSection: {
        marginTop: "10px",
    },
    sectionTitle: {
        fontSize: "1.2rem",
        fontWeight: "700",
        color: "#1f2937",
        marginBottom: "16px",
    },
    quickAccessGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: "14px",
    },
    quickCard: {
        background: "white",
        borderRadius: "14px",
        padding: "20px 16px",
        textAlign: "center",
        boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        border: "1px solid #f3f4f6",
    },
    quickIcon: {
        fontSize: "1.6rem",
    },
    quickLabel: {
        fontSize: "0.8rem",
        fontWeight: "600",
        color: "#374151",
    },
};
