import { useState } from "react";
import { getProjectIdeas, getProjectDetail } from "../api/backend";
import ReactMarkdown from "react-markdown";

export default function ProjectAssistant() {
    const [subjects, setSubjects] = useState("");
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectDetail, setProjectDetail] = useState(null);
    const [detailStage, setDetailStage] = useState("detailed");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reasoningTrace, setReasoningTrace] = useState([]);

    const handleGetIdeas = async () => {
        if (!subjects.trim()) return;

        setLoading(true);
        setError(null);
        setProjects([]);
        setSelectedProject(null);
        setProjectDetail(null);

        try {
            const result = await getProjectIdeas(subjects);

            if (result.stage === "ERROR") {
                setError(result.content);
            } else if (result.projects) {
                setProjects(result.projects);
                setReasoningTrace(result.reasoning_trace || []);
            } else if (result.content) {
                // Fallback if JSON parsing failed on backend
                setProjectDetail({ content: result.content });
            }
        } catch (err) {
            setError("Failed to get project ideas. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProject = async (project) => {
        setSelectedProject(project);
        setProjectDetail(null);
        setLoading(true);

        try {
            const result = await getProjectDetail(project.title, detailStage);
            setProjectDetail(result);
        } catch (err) {
            setError("Failed to get project details.");
        } finally {
            setLoading(false);
        }
    };

    const handleChangeStage = async (stage) => {
        if (!selectedProject) return;

        setDetailStage(stage);
        setLoading(true);

        try {
            const result = await getProjectDetail(selectedProject.title, stage);
            setProjectDetail(result);
        } catch (err) {
            setError("Failed to get project details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>💡 Project Assistant</h1>
                <p style={styles.subtitle}>
                    Get innovative project ideas based on your syllabus topics
                </p>
            </div>

            {/* Input Section */}
            <div style={styles.inputSection}>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Enter your subjects (comma-separated)</label>
                    <input
                        type="text"
                        value={subjects}
                        onChange={(e) => setSubjects(e.target.value)}
                        placeholder="e.g., Machine Learning, Data Structures, Computer Networks"
                        style={styles.input}
                        onKeyPress={(e) => e.key === "Enter" && handleGetIdeas()}
                    />
                </div>
                <button
                    onClick={handleGetIdeas}
                    disabled={loading || !subjects.trim()}
                    style={styles.primaryBtn}
                >
                    {loading ? "⏳ Generating..." : "🚀 Generate Project Ideas"}
                </button>
            </div>

            {/* Error Display */}
            {error && <div style={styles.error}>{error}</div>}

            {/* Reasoning Trace */}
            {reasoningTrace.length > 0 && (
                <div style={styles.traceBox}>
                    <h4 style={styles.traceTitle}>🧠 AI Reasoning</h4>
                    {reasoningTrace.map((step, i) => (
                        <div key={i} style={styles.traceStep}>{step}</div>
                    ))}
                </div>
            )}

            {/* Projects Grid */}
            {projects.length > 0 && (
                <div style={styles.projectsSection}>
                    <h2 style={styles.sectionTitle}>📋 Project Ideas</h2>
                    <div style={styles.projectsGrid}>
                        {projects.map((project, index) => (
                            <div
                                key={index}
                                style={{
                                    ...styles.projectCard,
                                    ...(selectedProject?.id === project.id ? styles.projectCardSelected : {})
                                }}
                                onClick={() => handleSelectProject(project)}
                            >
                                <div style={styles.projectHeader}>
                                    <span style={styles.projectNumber}>#{project.id}</span>
                                    <span style={{
                                        ...styles.difficultyBadge,
                                        background: getDifficultyColor(project.difficulty)
                                    }}>
                                        {project.difficulty}
                                    </span>
                                </div>
                                <h3 style={styles.projectTitle}>{project.title}</h3>
                                <p style={styles.projectDesc}>{project.description}</p>
                                <div style={styles.subjectsUsed}>
                                    {project.subjects_used?.map((subject, i) => (
                                        <span key={i} style={styles.subjectTag}>{subject}</span>
                                    ))}
                                </div>
                                {project.innovation && (
                                    <div style={styles.innovation}>
                                        <strong>✨ Innovation:</strong> {project.innovation}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Project Detail Panel */}
            {selectedProject && (
                <div style={styles.detailPanel}>
                    <div style={styles.detailHeader}>
                        <h2 style={styles.detailTitle}>📌 {selectedProject.title}</h2>
                        <div style={styles.stageTabs}>
                            {["detailed", "roadmap", "concepts"].map((stage) => (
                                <button
                                    key={stage}
                                    onClick={() => handleChangeStage(stage)}
                                    style={{
                                        ...styles.stageTab,
                                        ...(detailStage === stage ? styles.stageTabActive : {})
                                    }}
                                >
                                    {stage === "detailed" && "📋 Details"}
                                    {stage === "roadmap" && "🗺️ Roadmap"}
                                    {stage === "concepts" && "📚 Concepts"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div style={styles.loadingBox}>
                            <div style={styles.spinner}></div>
                            <p>Loading {detailStage} information...</p>
                        </div>
                    ) : projectDetail?.content ? (
                        <div style={styles.detailContent}>
                            <ReactMarkdown>{projectDetail.content}</ReactMarkdown>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}

function getDifficultyColor(difficulty) {
    switch (difficulty?.toLowerCase()) {
        case "easy": return "linear-gradient(135deg, #4ade80, #22c55e)";
        case "medium": return "linear-gradient(135deg, #fbbf24, #f59e0b)";
        case "hard": return "linear-gradient(135deg, #f87171, #ef4444)";
        default: return "linear-gradient(135deg, #94a3b8, #64748b)";
    }
}

const styles = {
    container: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 20px",
    },
    header: {
        textAlign: "center",
        marginBottom: "40px",
    },
    title: {
        fontSize: "2.5rem",
        fontWeight: "700",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        marginBottom: "10px",
    },
    subtitle: {
        color: "#64748b",
        fontSize: "1.1rem",
    },
    inputSection: {
        background: "white",
        padding: "30px",
        borderRadius: "20px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
        marginBottom: "30px",
    },
    inputGroup: {
        marginBottom: "20px",
    },
    label: {
        display: "block",
        marginBottom: "8px",
        fontWeight: "600",
        color: "#374151",
    },
    input: {
        width: "100%",
        padding: "16px 20px",
        fontSize: "1rem",
        border: "2px solid #e5e7eb",
        borderRadius: "12px",
        outline: "none",
        transition: "border-color 0.2s",
        boxSizing: "border-box",
    },
    primaryBtn: {
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        color: "white",
        padding: "16px 32px",
        border: "none",
        borderRadius: "12px",
        fontSize: "1rem",
        fontWeight: "600",
        cursor: "pointer",
        width: "100%",
        transition: "transform 0.2s, box-shadow 0.2s",
    },
    error: {
        background: "linear-gradient(135deg, #fee2e2, #fecaca)",
        color: "#991b1b",
        padding: "16px 20px",
        borderRadius: "12px",
        marginBottom: "20px",
    },
    traceBox: {
        background: "rgba(102, 126, 234, 0.1)",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "30px",
    },
    traceTitle: {
        margin: "0 0 12px 0",
        color: "#667eea",
    },
    traceStep: {
        padding: "6px 0",
        color: "#4b5563",
        fontSize: "0.9rem",
    },
    projectsSection: {
        marginBottom: "40px",
    },
    sectionTitle: {
        fontSize: "1.5rem",
        fontWeight: "700",
        marginBottom: "20px",
        color: "#1f2937",
    },
    projectsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
        gap: "20px",
    },
    projectCard: {
        background: "white",
        padding: "24px",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
        border: "2px solid transparent",
    },
    projectCardSelected: {
        borderColor: "#667eea",
        boxShadow: "0 8px 30px rgba(102, 126, 234, 0.2)",
    },
    projectHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "12px",
    },
    projectNumber: {
        color: "#9ca3af",
        fontSize: "0.9rem",
        fontWeight: "600",
    },
    difficultyBadge: {
        padding: "4px 12px",
        borderRadius: "20px",
        color: "white",
        fontSize: "0.8rem",
        fontWeight: "600",
    },
    projectTitle: {
        fontSize: "1.2rem",
        fontWeight: "700",
        color: "#1f2937",
        marginBottom: "8px",
    },
    projectDesc: {
        color: "#6b7280",
        fontSize: "0.95rem",
        lineHeight: "1.5",
        marginBottom: "12px",
    },
    subjectsUsed: {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        marginBottom: "12px",
    },
    subjectTag: {
        background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)",
        color: "#4338ca",
        padding: "4px 10px",
        borderRadius: "6px",
        fontSize: "0.8rem",
        fontWeight: "500",
    },
    innovation: {
        fontSize: "0.85rem",
        color: "#059669",
        background: "#ecfdf5",
        padding: "8px 12px",
        borderRadius: "8px",
    },
    detailPanel: {
        background: "white",
        borderRadius: "20px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
        overflow: "hidden",
    },
    detailHeader: {
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        padding: "24px 30px",
        color: "white",
    },
    detailTitle: {
        margin: "0 0 16px 0",
        fontSize: "1.4rem",
    },
    stageTabs: {
        display: "flex",
        gap: "10px",
    },
    stageTab: {
        background: "rgba(255,255,255,0.2)",
        color: "white",
        border: "none",
        padding: "10px 20px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "0.9rem",
        fontWeight: "500",
        transition: "background 0.2s",
    },
    stageTabActive: {
        background: "white",
        color: "#667eea",
    },
    detailContent: {
        padding: "30px",
        lineHeight: "1.8",
        color: "#374151",
    },
    loadingBox: {
        padding: "60px",
        textAlign: "center",
        color: "#6b7280",
    },
    spinner: {
        width: "40px",
        height: "40px",
        border: "4px solid #e5e7eb",
        borderTopColor: "#667eea",
        borderRadius: "50%",
        margin: "0 auto 20px",
        animation: "spin 1s linear infinite",
    },
};
