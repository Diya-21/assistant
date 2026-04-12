import { useState, useEffect } from "react";
import PageContainer from "../components/PageContainer";
import { getProgress, getAnalytics, getPerformance } from "../api/backend";
import { useAppContext } from "../context/AppContext";
import BloomsBadge from "../components/BloomsBadge";
import ReactMarkdown from "react-markdown";
import { useRef, useLayoutEffect } from "react";
import mermaid from "mermaid";

mermaid.initialize({
    startOnLoad: true,
    theme: "dark",
    securityLevel: "loose",
    fontFamily: "Fira Code, monospace",
});

const Mermaid = ({ chart }) => {
    const ref = useRef(null);
    useLayoutEffect(() => {
        if (ref.current && chart) {
            mermaid.contentLoaded();
            mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, chart).then(({ svg }) => {
                if (ref.current) ref.current.innerHTML = svg;
            }).catch(e => {
                console.error(e);
                if (ref.current) ref.current.innerText = "Error rendering map";
            });
        }
    }, [chart]);
    return <div ref={ref} style={{ width: "100%", display: "flex", justifyContent: "center" }} />;
};


export default function StudyMaterials() {
    const { student } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [performance, setPerformance] = useState(null);
    const [progress, setProgress] = useState(null);
    const [activeTab, setActiveTab] = useState("flashcards");

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [analyticsData, performanceData, progressData] = await Promise.all([
                getAnalytics(),
                getPerformance(),
                getProgress()
            ]);
            setAnalytics(analyticsData);
            setPerformance(performanceData);
            setProgress(progressData);
        } catch (error) {
            console.error("Error loading study materials:", error);
        } finally {
            setLoading(false);
        }
    }

    // Extract all flashcards from history/progress if possible
    // For now, we'll show a "Mock" set of cards if none exist, or explain how to get them
    const flashcards = [];
    // In a real app, we'd fetch saved flashcards from the backend
    // For this demo, let's look at the topicsstudied and show "Ready to Generate"

    if (loading) {
        return (
            <PageContainer title="📚 Study Materials" subtitle="Active Recall & Concept Mapping">
                <div style={{ textAlign: "center", padding: "100px" }}>
                    <div className="thinking-loader" style={{ width: "40px", height: "40px" }}></div>
                    <p>Analyzing your syllabus mastery...</p>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer title="📚 Study Materials" subtitle="The 'ABC' of Mastery: Active Recall, Bloom's, & Concept Maps">
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

                {/* Navigation Tabs */}
                <div style={styles.tabs}>
                    <button
                        style={{ ...styles.tab, ...(activeTab === "flashcards" ? styles.activeTab : {}) }}
                        onClick={() => setActiveTab("flashcards")}
                    >
                        📇 A: Active Recall (Flashcards)
                    </button>
                    <button
                        style={{ ...styles.tab, ...(activeTab === "blooms" ? styles.activeTab : {}) }}
                        onClick={() => setActiveTab("blooms")}
                    >
                        🧠 B: Bloom's Taxonomy
                    </button>
                    <button
                        style={{ ...styles.tab, ...(activeTab === "maps" ? styles.activeTab : {}) }}
                        onClick={() => setActiveTab("maps")}
                    >
                        🗺️ C: Concept Maps
                    </button>
                </div>

                {/* Content Area */}
                <div className="card" style={{ padding: "30px", minHeight: "500px" }}>

                    {activeTab === "flashcards" && (
                        <div className="animate-fade-in">
                            <h2 style={{ color: "#1e293b", marginBottom: "20px" }}>📇 Your Active Recall Deck</h2>
                            <p style={{ color: "#64748b", marginBottom: "30px" }}>
                                Flashcards are generated automatically during your theory sessions.
                                Below are the topics you've explored. Click to generate/view cards for that topic.
                            </p>

                            <div style={styles.grid}>
                                {Object.keys(progress?.topics || {}).length > 0 ? (
                                    Object.entries(progress.topics).map(([topic, data]) => (
                                        <div key={topic} style={styles.topicCard}>
                                            <div style={{ fontWeight: "700", fontSize: "1.1rem", marginBottom: "10px" }}>{topic}</div>
                                            <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "15px" }}>
                                                Mastery: {data.mastery_level}%
                                            </div>
                                            <button
                                                style={styles.actionBtn}
                                                onClick={() => window.location.href = `/theory?topic=${encodeURIComponent(topic)}`}
                                            >
                                                ⚡ Review Flashcards
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>
                                        <p>No topics studied yet. Start a theory session to generate flashcards!</p>
                                        <button onClick={() => window.location.href = "/theory"}>Go to Theory</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "blooms" && (
                        <div className="animate-fade-in">
                            <h2 style={{ color: "#1e293b", marginBottom: "20px" }}>🧠 Bloom's Taxonomy Breakdown</h2>
                            <p style={{ color: "#64748b", marginBottom: "30px" }}>
                                We track the COGNITIVE LEVEL of your questions. Are you just remembering, or are you creating?
                            </p>

                            <div style={styles.bloomsLayout}>
                                <div style={{ flex: 1 }}>
                                    <MasteryChart data={analytics?.mastery_distribution} />
                                </div>
                                <div style={{ flex: 1, padding: "20px", background: "#f8fafc", borderRadius: "16px" }}>
                                    <h4 style={{ marginBottom: "15px" }}>Why it matters:</h4>
                                    <ul style={{ fontSize: "0.9rem", color: "#334155", display: "flex", flexDirection: "column", gap: "10px" }}>
                                        <li><strong>Level 1-2 (Recall/Understand):</strong> Base knowledge. Good for MCQ exams.</li>
                                        <li><strong>Level 3-4 (Apply/Analyze):</strong> Engineering core. Good for Labs and Numericals.</li>
                                        <li><strong>Level 5-6 (Evaluate/Create):</strong> Expert level. Required for Final Year Projects.</li>
                                    </ul>
                                    <div style={{ marginTop: "20px" }}>
                                        <p style={{ fontSize: "0.85rem", fontStyle: "italic", color: "#6366f1" }}>
                                            AI Instruction: Try asking "Compare {Object.keys(progress?.topics || {})[0] || 'your topic'} with real-world applications" to reach Bloom's Level 4.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "maps" && (
                        <div className="animate-fade-in">
                            <h2 style={{ color: "#1e293b", marginBottom: "20px" }}>🗺️ Syllabus Concept Map</h2>
                            <p style={{ color: "#64748b", marginBottom: "30px" }}>
                                Visualizing the semantic relationships between the topics you've studied in the syllabus.
                            </p>

                            <div style={{
                                minHeight: "400px",
                                background: "#0f172a",
                                borderRadius: "20px",
                                padding: "20px",
                                overflow: "auto"
                            }}>
                                {Object.keys(progress?.topics || {}).length > 0 ? (
                                    <Mermaid chart={`
                                        graph TD
                                        Syllabus((Syllabus Root))
                                        ${Object.entries(progress.topics).map(([topic, data], idx) => {
                                        const id = `T${idx}`;
                                        const color = data.mastery_level > 80 ? "stroke:#10b981,stroke-width:4px" : "stroke:#6366f1";
                                        return `
                                            Syllabus --- ${id}[${topic}]
                                            style ${id} ${color}
                                            `;
                                    }).join("\n")}
                                    `} />
                                ) : (
                                    <div style={{ color: "#94a3b8", textAlign: "center", paddingTop: "150px" }}>
                                        <p>No map data available. Start studying to build your knowledge graph!</p>
                                    </div>
                                )}
                            </div>


                            <div style={{ marginTop: "30px" }}>
                                <h3>Mastery Heatmap</h3>
                                <div style={styles.heatmap}>
                                    {[...Array(24)].map((_, i) => {
                                        const topicNames = Object.keys(progress?.topics || {});
                                        const topic = topicNames[i % topicNames.length];
                                        const level = topic ? progress.topics[topic].mastery_level : 0;
                                        return (
                                            <div
                                                key={i}
                                                style={{
                                                    width: "30px",
                                                    height: "30px",
                                                    borderRadius: "4px",
                                                    background: level >= 80 ? "#10b981" : level >= 50 ? "#f59e0b" : level > 0 ? "#667eea" : "#e5e7eb",
                                                    cursor: "help"
                                                }}
                                                title={topic ? `${topic}: ${level}%` : "Unstudied Slot"}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </PageContainer>
    );
}

function MasteryChart({ data }) {
    const total = Object.values(data || {}).reduce((sum, val) => sum + val, 0);
    const items = [
        { key: "mastered", label: "Mastered (Create/Evaluate)", color: "#10b981", value: data?.mastered || 0 },
        { key: "practicing", label: "Practicing (Apply/Analyze)", color: "#f59e0b", value: data?.practicing || 0 },
        { key: "learning", label: "Learning (Understand)", color: "#667eea", value: data?.learning || 0 },
        { key: "beginner", label: "Beginner (Remember)", color: "#9ca3af", value: data?.beginner || 0 },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {items.map(item => {
                const pct = total > 0 ? (item.value / total * 100).toFixed(0) : 0;
                return (
                    <div key={item.key}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: "600" }}>
                                <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: item.color }}></span>
                                {item.label}
                            </span>
                            <span style={{ fontWeight: "700" }}>{item.value} Topics</span>
                        </div>
                        <div style={{ height: "10px", background: "#f1f5f9", borderRadius: "5px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: item.color, borderRadius: "5px", transition: "width 1s" }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

const styles = {
    tabs: {
        display: "flex",
        gap: "10px",
        marginBottom: "20px",
        background: "rgba(255,255,255,0.5)",
        padding: "10px",
        borderRadius: "20px",
        backdropFilter: "blur(10px)"
    },
    tab: {
        padding: "12px 24px",
        borderRadius: "14px",
        border: "1px solid transparent",
        background: "transparent",
        color: "#64748b",
        fontWeight: "700",
        cursor: "pointer",
        transition: "all 0.2s"
    },
    activeTab: {
        background: "white",
        color: "#6366f1",
        borderColor: "#e2e8f0",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "20px"
    },
    topicCard: {
        background: "#f8fafc",
        padding: "20px",
        borderRadius: "16px",
        border: "1px solid #e2e8f0"
    },
    actionBtn: {
        width: "100%",
        padding: "10px",
        fontSize: "0.85rem",
        background: "white",
        color: "#6366f1",
        border: "1px solid #6366f1",
        borderRadius: "10px"
    },
    bloomsLayout: {
        display: "flex",
        gap: "40px",
        flexWrap: "wrap"
    },
    heatmap: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        padding: "20px",
        background: "#f8fafc",
        borderRadius: "12px"
    }
};
