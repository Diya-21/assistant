import { useState } from "react";
import { getTechStack, compareTech, explainTech, getCodeHelp } from "../api/backend";
import ReactMarkdown from "react-markdown";

export default function TechStackAssistant() {
    const [activeMode, setActiveMode] = useState("recommend");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    // Recommend state
    const [projectType, setProjectType] = useState("");
    const [requirements, setRequirements] = useState("");

    // Compare state
    const [tech1, setTech1] = useState("");
    const [tech2, setTech2] = useState("");
    const [compareContext, setCompareContext] = useState("");

    // Explain state
    const [concept, setConcept] = useState("");
    const [depth, setDepth] = useState("intermediate");

    // Code help state
    const [task, setTask] = useState("");
    const [technology, setTechnology] = useState("");

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            let response;

            switch (activeMode) {
                case "recommend":
                    if (!projectType.trim()) return setError("Please enter a project type");
                    response = await getTechStack(projectType, requirements);
                    break;
                case "compare":
                    if (!tech1.trim() || !tech2.trim()) return setError("Please enter both technologies");
                    response = await compareTech(tech1, tech2, compareContext);
                    break;
                case "explain":
                    if (!concept.trim()) return setError("Please enter a concept");
                    response = await explainTech(concept, depth);
                    break;
                case "code":
                    if (!task.trim() || !technology.trim()) return setError("Please enter task and technology");
                    response = await getCodeHelp(task, technology);
                    break;
                default:
                    return;
            }

            if (response.stage === "ERROR") {
                setError(response.content);
            } else {
                setResult(response);
            }
        } catch (err) {
            setError("Request failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const getResultContent = () => {
        if (!result) return null;
        return result.recommendations || result.comparison || result.explanation || result.guidance;
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>🛠️ Tech Stack Assistant</h1>
                <p style={styles.subtitle}>
                    Get recommendations, comparisons, and guidance for technologies
                </p>
            </div>

            {/* Mode Selector */}
            <div style={styles.modeSelector}>
                {[
                    { id: "recommend", label: "🎯 Recommend Stack", desc: "Get tech suggestions" },
                    { id: "compare", label: "⚖️ Compare", desc: "Compare technologies" },
                    { id: "explain", label: "📖 Explain", desc: "Learn concepts" },
                    { id: "code", label: "💻 Code Help", desc: "Get guidance" },
                ].map((mode) => (
                    <button
                        key={mode.id}
                        onClick={() => { setActiveMode(mode.id); setResult(null); }}
                        style={{
                            ...styles.modeBtn,
                            ...(activeMode === mode.id ? styles.modeBtnActive : {}),
                        }}
                    >
                        <span style={styles.modeBtnLabel}>{mode.label}</span>
                        <span style={styles.modeBtnDesc}>{mode.desc}</span>
                    </button>
                ))}
            </div>

            {/* Input Panel */}
            <div style={styles.inputPanel}>
                {activeMode === "recommend" && (
                    <>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Project Type</label>
                            <select
                                value={projectType}
                                onChange={(e) => setProjectType(e.target.value)}
                                style={styles.select}
                            >
                                <option value="">Select or type below...</option>
                                <option value="web_app">Web Application</option>
                                <option value="ml_project">Machine Learning Project</option>
                                <option value="mobile_app">Mobile App</option>
                                <option value="data_engineering">Data Engineering</option>
                                <option value="iot_project">IoT Project</option>
                                <option value="blockchain">Blockchain</option>
                            </select>
                            <input
                                type="text"
                                value={projectType}
                                onChange={(e) => setProjectType(e.target.value)}
                                placeholder="Or type custom project type"
                                style={{ ...styles.input, marginTop: "10px" }}
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Specific Requirements (optional)</label>
                            <textarea
                                value={requirements}
                                onChange={(e) => setRequirements(e.target.value)}
                                placeholder="e.g., real-time data, high scalability, beginner-friendly"
                                style={styles.textarea}
                                rows={3}
                            />
                        </div>
                    </>
                )}

                {activeMode === "compare" && (
                    <>
                        <div style={styles.compareRow}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Technology 1</label>
                                <input
                                    type="text"
                                    value={tech1}
                                    onChange={(e) => setTech1(e.target.value)}
                                    placeholder="e.g., React"
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.vsLabel}>VS</div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Technology 2</label>
                                <input
                                    type="text"
                                    value={tech2}
                                    onChange={(e) => setTech2(e.target.value)}
                                    placeholder="e.g., Vue.js"
                                    style={styles.input}
                                />
                            </div>
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Context (optional)</label>
                            <input
                                type="text"
                                value={compareContext}
                                onChange={(e) => setCompareContext(e.target.value)}
                                placeholder="e.g., for a small e-commerce site"
                                style={styles.input}
                            />
                        </div>
                    </>
                )}

                {activeMode === "explain" && (
                    <>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Concept to Explain</label>
                            <input
                                type="text"
                                value={concept}
                                onChange={(e) => setConcept(e.target.value)}
                                placeholder="e.g., REST API, Docker, Machine Learning"
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Depth Level</label>
                            <div style={styles.depthSelector}>
                                {["beginner", "intermediate", "advanced"].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setDepth(level)}
                                        style={{
                                            ...styles.depthBtn,
                                            ...(depth === level ? styles.depthBtnActive : {}),
                                        }}
                                    >
                                        {level.charAt(0).toUpperCase() + level.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {activeMode === "code" && (
                    <>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>What are you trying to do?</label>
                            <input
                                type="text"
                                value={task}
                                onChange={(e) => setTask(e.target.value)}
                                placeholder="e.g., implement user authentication"
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Technology/Framework</label>
                            <input
                                type="text"
                                value={technology}
                                onChange={(e) => setTechnology(e.target.value)}
                                placeholder="e.g., Node.js, React, Python"
                                style={styles.input}
                            />
                        </div>
                    </>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    style={styles.submitBtn}
                >
                    {loading ? "⏳ Processing..." : "🚀 Get Results"}
                </button>
            </div>

            {/* Error */}
            {error && <div style={styles.error}>{error}</div>}

            {/* Loading */}
            {loading && (
                <div style={styles.loadingBox}>
                    <div style={styles.spinner}></div>
                    <p>Analyzing and generating response...</p>
                </div>
            )}

            {/* Results */}
            {result && !loading && (
                <div style={styles.resultPanel}>
                    <div style={styles.resultHeader}>
                        <h2 style={styles.resultTitle}>
                            {activeMode === "recommend" && `🎯 Tech Stack for "${projectType}"`}
                            {activeMode === "compare" && `⚖️ ${tech1} vs ${tech2}`}
                            {activeMode === "explain" && `📖 ${concept}`}
                            {activeMode === "code" && `💻 ${task}`}
                        </h2>
                    </div>
                    <div style={styles.resultContent}>
                        <ReactMarkdown>{getResultContent()}</ReactMarkdown>
                    </div>

                    {/* Template info for recommend */}
                    {result.template && Object.keys(result.template).length > 0 && (
                        <div style={styles.templateBox}>
                            <h4 style={styles.templateTitle}>📋 Quick Reference</h4>
                            <div style={styles.templateGrid}>
                                {Object.entries(result.template).map(([category, options]) => (
                                    <div key={category} style={styles.templateCategory}>
                                        <span style={styles.templateLabel}>
                                            {category.replace(/_/g, " ")}
                                        </span>
                                        <div style={styles.templateOptions}>
                                            {options.map((opt, i) => (
                                                <span key={i} style={styles.templateTag}>{opt}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reasoning trace */}
                    {result.reasoning_trace && (
                        <details style={styles.traceDetails}>
                            <summary style={styles.traceSummary}>
                                🧠 View AI Reasoning
                            </summary>
                            <div style={styles.traceContent}>
                                {result.reasoning_trace.map((step, i) => (
                                    <div key={i} style={styles.traceStep}>{step}</div>
                                ))}
                            </div>
                        </details>
                    )}
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        maxWidth: "1100px",
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
        background: "linear-gradient(135deg, #f97316, #ea580c)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        marginBottom: "10px",
    },
    subtitle: {
        color: "#64748b",
        fontSize: "1.1rem",
    },
    modeSelector: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "30px",
    },
    modeBtn: {
        padding: "20px",
        background: "white",
        border: "2px solid #e5e7eb",
        borderRadius: "16px",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s",
    },
    modeBtnActive: {
        borderColor: "#f97316",
        background: "linear-gradient(135deg, #fff7ed, #ffedd5)",
        boxShadow: "0 4px 20px rgba(249, 115, 22, 0.15)",
    },
    modeBtnLabel: {
        display: "block",
        fontSize: "1.1rem",
        fontWeight: "700",
        color: "#1f2937",
        marginBottom: "4px",
    },
    modeBtnDesc: {
        fontSize: "0.85rem",
        color: "#6b7280",
    },
    inputPanel: {
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
        padding: "14px 18px",
        fontSize: "1rem",
        border: "2px solid #e5e7eb",
        borderRadius: "12px",
        outline: "none",
        boxSizing: "border-box",
    },
    select: {
        width: "100%",
        padding: "14px 18px",
        fontSize: "1rem",
        border: "2px solid #e5e7eb",
        borderRadius: "12px",
        outline: "none",
        background: "white",
        boxSizing: "border-box",
    },
    textarea: {
        width: "100%",
        padding: "14px 18px",
        fontSize: "1rem",
        border: "2px solid #e5e7eb",
        borderRadius: "12px",
        outline: "none",
        resize: "vertical",
        fontFamily: "inherit",
        boxSizing: "border-box",
    },
    compareRow: {
        display: "flex",
        alignItems: "flex-end",
        gap: "20px",
        marginBottom: "20px",
    },
    vsLabel: {
        fontSize: "1.2rem",
        fontWeight: "700",
        color: "#f97316",
        paddingBottom: "16px",
    },
    depthSelector: {
        display: "flex",
        gap: "10px",
    },
    depthBtn: {
        padding: "12px 24px",
        border: "2px solid #e5e7eb",
        borderRadius: "10px",
        background: "white",
        cursor: "pointer",
        fontWeight: "600",
        color: "#6b7280",
        transition: "all 0.2s",
    },
    depthBtnActive: {
        borderColor: "#f97316",
        background: "#fff7ed",
        color: "#ea580c",
    },
    submitBtn: {
        width: "100%",
        padding: "16px",
        background: "linear-gradient(135deg, #f97316, #ea580c)",
        color: "white",
        border: "none",
        borderRadius: "12px",
        fontSize: "1.1rem",
        fontWeight: "600",
        cursor: "pointer",
    },
    error: {
        background: "linear-gradient(135deg, #fee2e2, #fecaca)",
        color: "#991b1b",
        padding: "16px 20px",
        borderRadius: "12px",
        marginBottom: "20px",
    },
    loadingBox: {
        background: "white",
        padding: "60px",
        borderRadius: "20px",
        textAlign: "center",
        boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
    },
    spinner: {
        width: "50px",
        height: "50px",
        border: "4px solid #e5e7eb",
        borderTopColor: "#f97316",
        borderRadius: "50%",
        margin: "0 auto 20px",
        animation: "spin 1s linear infinite",
    },
    resultPanel: {
        background: "white",
        borderRadius: "20px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
        overflow: "hidden",
    },
    resultHeader: {
        background: "linear-gradient(135deg, #f97316, #ea580c)",
        padding: "24px 30px",
        color: "white",
    },
    resultTitle: {
        margin: 0,
        fontSize: "1.4rem",
    },
    resultContent: {
        padding: "30px",
        lineHeight: "1.8",
        color: "#374151",
    },
    templateBox: {
        margin: "0 30px 30px",
        padding: "20px",
        background: "#fffbeb",
        borderRadius: "12px",
        border: "1px solid #fcd34d",
    },
    templateTitle: {
        margin: "0 0 16px 0",
        color: "#b45309",
    },
    templateGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
    },
    templateCategory: {
        background: "white",
        padding: "12px",
        borderRadius: "8px",
    },
    templateLabel: {
        display: "block",
        fontWeight: "600",
        color: "#92400e",
        marginBottom: "8px",
        textTransform: "capitalize",
    },
    templateOptions: {
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
    },
    templateTag: {
        background: "#fef3c7",
        color: "#92400e",
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "0.8rem",
    },
    traceDetails: {
        margin: "0 30px 30px",
        background: "#fff7ed",
        borderRadius: "12px",
        overflow: "hidden",
    },
    traceSummary: {
        padding: "16px 20px",
        cursor: "pointer",
        fontWeight: "600",
        color: "#ea580c",
    },
    traceContent: {
        padding: "0 20px 20px",
    },
    traceStep: {
        padding: "6px 0",
        color: "#4b5563",
        fontSize: "0.9rem",
    },
};
