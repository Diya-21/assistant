import { useState, useEffect } from "react";
import { getProjectIdeas, getProjectDetail } from "../api/backend";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAppContext } from "../context/AppContext";
import { followUpChat } from "../api/backend";

export default function ProjectAssistant() {
    const { savePageState, getPageState } = useAppContext();
    const cached = getPageState("projects");

    const [subjects, setSubjects] = useState(cached?.subjects || "");
    const [projects, setProjects] = useState(cached?.projects || []);
    const [selectedProject, setSelectedProject] = useState(cached?.selectedProject || null);
    const [projectDetail, setProjectDetail] = useState(cached?.projectDetail || null);
    const [projectChat, setProjectChat] = useState(cached?.projectChat || {}); // { [projectTitle]: [messages] }
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [detailStage, setDetailStage] = useState("detailed");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    // Persist page state on changes
    useEffect(() => {
        if (projects.length > 0 || subjects) {
            savePageState("projects", { subjects, projects, selectedProject, projectDetail, projectChat });
        }
    }, [subjects, projects, selectedProject, projectDetail, projectChat]);


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
            } else if (result.projects && result.projects.length > 0) {
                setProjects(result.projects);
            } else if (result.content) {
                // Fallback if JSON parsing failed on backend but we got content
                setProjectDetail({ content: result.content });
                // We also set a dummy project to trigger the detail panel visibility
                setSelectedProject({ title: "Generated Projects (Markdown)", id: "txt" });
            } else {
                setError("No projects were generated. Please try again with different subjects.");
            }
        } catch (err) {
            setError("Failed to get project ideas. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleProjectChat = async () => {
        if (!chatInput.trim() || !selectedProject) return;

        const userMsg = { role: "user", content: chatInput, timestamp: new Date().toISOString() };
        const projectTitle = selectedProject.title;
        const currentMsgs = projectChat[projectTitle] || [];
        const newMsgs = [...currentMsgs, userMsg];

        setProjectChat(prev => ({ ...prev, [projectTitle]: newMsgs }));
        setChatInput("");
        setChatLoading(true);

        try {
            const contextStr = newMsgs.map(m => `${m.role === "user" ? "Student" : "Assistant"}: ${m.content}`).join("\n");
            const data = await followUpChat(projectTitle, userMsg.content, contextStr, "chat");

            const aiMsg = { role: "assistant", content: data.content, timestamp: new Date().toISOString() };
            setProjectChat(prev => ({ ...prev, [projectTitle]: [...newMsgs, aiMsg] }));
        } catch (err) {
            setError("Failed to get chat response.");
        } finally {
            setChatLoading(false);
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
                    <label style={styles.label}>Enter your subject or topic</label>
                    <input
                        type="text"
                        value={subjects}
                        onChange={(e) => setSubjects(e.target.value)}
                        placeholder="e.g., Machine Learning, AAI, Data Structures"
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


            {/* Projects Grid with Selection Prompt */}
            {projects.length > 0 && !selectedProject && (
                <div style={styles.projectsSection}>
                    <div style={styles.selectionPrompt}>
                        <div style={styles.selectionIcon}>🎯</div>
                        <h2 style={styles.sectionTitle}>Choose a Project to Continue With</h2>
                        <p style={{ color: "#64748b", margin: "0", fontSize: "1rem" }}>
                            We found {projects.length} project ideas based on your subjects. Select one to get a detailed breakdown, roadmap, and technical concepts.
                        </p>
                    </div>
                    <div style={styles.projectsGrid}>
                        {projects.map((project, index) => (
                            <div
                                key={index}
                                className="project-card"
                                style={{ position: "relative" }}
                            >
                                <div style={styles.cardHeader}>
                                    <span style={styles.projectNumber}>#{index + 1}</span>
                                    <span style={{
                                        ...styles.difficultyTag,
                                        background: getDifficultyColor(project.difficulty)
                                    }}>
                                        {project.difficulty || "Medium"}
                                    </span>
                                </div>
                                <h3 style={styles.projectTitle}>{project.title || "Untitled Project"}</h3>
                                <p style={styles.projectDesc}>{project.description || ""}</p>
                                <div style={styles.subjects}>
                                    {(project.subjects || project.subjects_used || []).map((subject, i) => (
                                        <span key={i} style={styles.subjectTag}>{subject}</span>
                                    ))}
                                </div>
                                {(project.innovation || project.innovation_factor) && (
                                    <div style={styles.innovation}>
                                        💡 {project.innovation || project.innovation_factor}
                                    </div>
                                )}
                                <button
                                    onClick={() => handleSelectProject(project)}
                                    style={styles.continueBtn}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = "translateY(-2px)";
                                        e.target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.4)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = "translateY(0)";
                                        e.target.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.25)";
                                    }}
                                >
                                    Continue with this →
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Selected Project Indicator (when viewing details) */}
            {projects.length > 0 && selectedProject && (
                <div style={{ marginBottom: "16px" }}>
                    <button
                        onClick={() => {
                            setSelectedProject(null);
                            setProjectDetail(null);
                            setDetailStage("detailed");
                        }}
                        style={styles.backBtn}
                    >
                        ← Back to Project Ideas
                    </button>
                </div>
            )}

            {/* Project Detail Panel */}
            {selectedProject && (
                <div style={styles.detailPanel}>
                    <div style={styles.detailHeader}>
                        <h2 style={styles.detailTitle}>📌 {selectedProject.title}</h2>
                        <p style={{ color: "rgba(255,255,255,0.8)", margin: "4px 0 16px", fontSize: "0.95rem" }}>
                            Explore the full details, implementation roadmap, and core concepts below.
                        </p>
                        <div style={styles.stageTabs}>
                            {[
                                { key: "detailed", icon: "📋", label: "Details" },
                                { key: "roadmap", icon: "🗺️", label: "Roadmap" },
                                { key: "concepts", icon: "📚", label: "Concepts" },
                                { key: "chat", icon: "💬", label: "Chat" },
                            ].map(({ key, icon, label }) => (
                                <button
                                    key={key}
                                    onClick={() => key === "chat" ? setDetailStage("chat") : handleChangeStage(key)}
                                    style={{
                                        ...styles.stageTab,
                                        ...(detailStage === key ? styles.stageTabActive : {})
                                    }}
                                >
                                    {icon} {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div style={styles.loadingBox}>
                            <div style={styles.spinner}></div>
                            <p>Loading {detailStage} information...</p>
                        </div>
                    ) : detailStage === "chat" ? (
                        <div style={styles.chatContainer}>
                            <div style={styles.chatMessages}>
                                {(projectChat[selectedProject.title] || []).length === 0 && (
                                    <div style={styles.aiBubble}>
                                        👋 Hi! I'm your project assistant. You can ask me anything about <strong>{selectedProject.title}</strong>. I can help with architecture, implementation steps, or explaining specific concepts!
                                    </div>
                                )}
                                {(projectChat[selectedProject.title] || []).map((msg, idx) => (
                                    <div key={idx} style={{ ...styles.msgBubble, ...(msg.role === "user" ? styles.userBubble : styles.aiBubble) }}>
                                        <div style={styles.msgRole}>{msg.role === "user" ? "👤 You" : "🤖 Assistant"}</div>
                                        <div className="msg-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>
                                    </div>
                                ))}
                                {chatLoading && <div style={styles.aiBubble}>...thinking</div>}
                            </div>
                            <div style={styles.chatInputRow}>
                                <input
                                    style={styles.chatInput}
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Ask anything about this project..."
                                    onKeyPress={(e) => e.key === "Enter" && handleProjectChat()}
                                />
                                <button onClick={handleProjectChat} disabled={chatLoading} style={styles.chatSendBtn}>
                                    {chatLoading ? "⏳" : "➤"}
                                </button>
                            </div>
                        </div>
                    ) : projectDetail?.content ? (
                        <div className="msg-content" style={styles.detailContent}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{projectDetail.content}</ReactMarkdown>
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
    selectionPrompt: {
        textAlign: "center",
        marginBottom: "30px",
        padding: "20px",
        background: "linear-gradient(135deg, #f0f4ff, #e8ecff)",
        borderRadius: "16px",
        border: "2px dashed #667eea",
    },
    selectionIcon: {
        fontSize: "2.5rem",
        marginBottom: "8px",
    },
    continueBtn: {
        width: "100%",
        marginTop: "16px",
        padding: "12px 20px",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        color: "white",
        border: "none",
        borderRadius: "10px",
        fontSize: "0.95rem",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: "0 4px 12px rgba(102, 126, 234, 0.25)",
    },
    backBtn: {
        padding: "10px 20px",
        background: "white",
        color: "#667eea",
        border: "2px solid #667eea",
        borderRadius: "10px",
        fontSize: "0.95rem",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s",
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
    cardHeader: {
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
    difficultyTag: {
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
    subjects: {
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
    chatContainer: {
        display: "flex",
        flexDirection: "column",
        height: "500px",
        background: "#f8fafc",
    },
    chatMessages: {
        flex: 1,
        overflowY: "auto",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    msgBubble: {
        padding: "12px 16px",
        borderRadius: "12px",
        maxWidth: "80%",
        fontSize: "0.95rem",
        lineHeight: "1.5",
    },
    userBubble: {
        alignSelf: "flex-end",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        color: "white",
    },
    aiBubble: {
        alignSelf: "flex-start",
        background: "white",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        color: "#1f2937",
    },
    msgRole: {
        fontSize: "0.75rem",
        fontWeight: "700",
        marginBottom: "4px",
        opacity: 0.8,
    },
    chatInputRow: {
        padding: "16px 20px",
        background: "white",
        borderTop: "1px solid #e5e7eb",
        display: "flex",
        gap: "12px",
    },
    chatInput: {
        flex: 1,
        padding: "12px 16px",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        outline: "none",
    },
    chatSendBtn: {
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        color: "white",
        border: "none",
        width: "44px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "700",
    },
};
