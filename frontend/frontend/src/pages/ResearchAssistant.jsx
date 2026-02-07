import { useState } from "react";
import { researchTopic, searchPapers } from "../api/backend";
import ReactMarkdown from "react-markdown";

export default function ResearchAssistant() {
    const [topic, setTopic] = useState("");
    const [includePapers, setIncludePapers] = useState(true);
    const [research, setResearch] = useState(null);
    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("explanation");
    const [reasoningTrace, setReasoningTrace] = useState([]);

    const handleResearch = async () => {
        if (!topic.trim()) return;

        setLoading(true);
        setError(null);
        setResearch(null);
        setPapers([]);

        try {
            const result = await researchTopic(topic, includePapers);

            if (result.stage === "ERROR") {
                setError(result.content);
            } else {
                setResearch(result);
                setPapers(result.papers || []);
                setReasoningTrace(result.reasoning_trace || []);
            }
        } catch (err) {
            setError("Research failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearchPapers = async () => {
        if (!topic.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const result = await searchPapers(topic);
            setPapers(result.papers || []);
        } catch (err) {
            setError("Paper search failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>🔬 Research Assistant</h1>
                <p style={styles.subtitle}>
                    Deep dive into topics with academic papers and detailed explanations
                </p>
            </div>

            {/* Search Section */}
            <div style={styles.searchSection}>
                <div style={styles.searchBox}>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Enter a topic to research (e.g., Neural Networks, Blockchain, MapReduce)"
                        style={styles.searchInput}
                        onKeyPress={(e) => e.key === "Enter" && handleResearch()}
                    />
                    <button
                        onClick={handleResearch}
                        disabled={loading || !topic.trim()}
                        style={styles.searchBtn}
                    >
                        {loading ? "⏳" : "🔍"}
                    </button>
                </div>

                <div style={styles.options}>
                    <label style={styles.checkbox}>
                        <input
                            type="checkbox"
                            checked={includePapers}
                            onChange={(e) => setIncludePapers(e.target.checked)}
                        />
                        <span>Include academic papers (arXiv, Semantic Scholar)</span>
                    </label>
                </div>
            </div>

            {/* Error Display */}
            {error && <div style={styles.error}>{error}</div>}

            {/* Loading State */}
            {loading && (
                <div style={styles.loadingBox}>
                    <div style={styles.spinner}></div>
                    <p style={styles.loadingText}>Researching "{topic}"...</p>
                    <p style={styles.loadingSubtext}>
                        Searching syllabus and academic databases
                    </p>
                </div>
            )}

            {/* Results */}
            {research && !loading && (
                <div style={styles.resultsContainer}>
                    {/* Sources Info */}
                    <div style={styles.sourcesInfo}>
                        <span style={styles.sourceTag}>
                            📚 Syllabus: {research.sources?.syllabus ? "✓" : "✗"}
                        </span>
                        <span style={styles.sourceTag}>
                            📄 arXiv: {research.sources?.arxiv || 0} papers
                        </span>
                        <span style={styles.sourceTag}>
                            🔗 Semantic Scholar: {research.sources?.semantic_scholar || 0} papers
                        </span>
                    </div>

                    {/* Tab Navigation */}
                    <div style={styles.tabNav}>
                        {[
                            { id: "explanation", label: "📖 Explanation", icon: "📖" },
                            { id: "papers", label: `📄 Papers (${papers.length})`, icon: "📄" },
                            { id: "directions", label: "🎯 Research Directions", icon: "🎯" },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    ...styles.tabBtn,
                                    ...(activeTab === tab.id ? styles.tabBtnActive : {}),
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div style={styles.tabContent}>
                        {activeTab === "explanation" && (
                            <div style={styles.markdownContent}>
                                <ReactMarkdown>{research.explanation}</ReactMarkdown>
                            </div>
                        )}

                        {activeTab === "papers" && (
                            <div style={styles.papersGrid}>
                                {papers.length === 0 ? (
                                    <div style={styles.noPapers}>
                                        <p>No papers found. Try a different search term.</p>
                                        <button onClick={handleSearchPapers} style={styles.retryBtn}>
                                            🔄 Search Papers Only
                                        </button>
                                    </div>
                                ) : (
                                    papers.map((paper, index) => (
                                        <div key={index} style={styles.paperCard}>
                                            <div style={styles.paperSource}>
                                                <span style={styles.sourceLabel}>{paper.source}</span>
                                                {paper.citations > 0 && (
                                                    <span style={styles.citations}>
                                                        📊 {paper.citations} citations
                                                    </span>
                                                )}
                                            </div>
                                            <h3 style={styles.paperTitle}>{paper.title}</h3>
                                            <p style={styles.paperAuthors}>
                                                {paper.authors?.join(", ")}
                                                {paper.year && ` (${paper.year})`}
                                                {paper.published && ` • ${paper.published}`}
                                            </p>
                                            {paper.abstract && (
                                                <p style={styles.paperAbstract}>{paper.abstract}</p>
                                            )}
                                            {paper.url && (
                                                <a
                                                    href={paper.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={styles.paperLink}
                                                >
                                                    📎 View Paper →
                                                </a>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === "directions" && (
                            <div style={styles.markdownContent}>
                                <ReactMarkdown>{research.research_directions}</ReactMarkdown>
                            </div>
                        )}
                    </div>

                    {/* Reasoning Trace (Collapsible) */}
                    {reasoningTrace.length > 0 && (
                        <details style={styles.traceDetails}>
                            <summary style={styles.traceSummary}>
                                🧠 View AI Reasoning ({reasoningTrace.length} steps)
                            </summary>
                            <div style={styles.traceContent}>
                                {reasoningTrace.map((step, i) => (
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
        background: "linear-gradient(135deg, #06b6d4, #0891b2)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        marginBottom: "10px",
    },
    subtitle: {
        color: "#64748b",
        fontSize: "1.1rem",
    },
    searchSection: {
        background: "white",
        padding: "30px",
        borderRadius: "20px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
        marginBottom: "30px",
    },
    searchBox: {
        display: "flex",
        gap: "12px",
    },
    searchInput: {
        flex: 1,
        padding: "18px 24px",
        fontSize: "1.1rem",
        border: "2px solid #e5e7eb",
        borderRadius: "16px",
        outline: "none",
        transition: "border-color 0.2s",
    },
    searchBtn: {
        width: "60px",
        height: "60px",
        background: "linear-gradient(135deg, #06b6d4, #0891b2)",
        color: "white",
        border: "none",
        borderRadius: "16px",
        fontSize: "1.5rem",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    options: {
        marginTop: "16px",
    },
    checkbox: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        color: "#6b7280",
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
        borderTopColor: "#06b6d4",
        borderRadius: "50%",
        margin: "0 auto 20px",
        animation: "spin 1s linear infinite",
    },
    loadingText: {
        fontSize: "1.2rem",
        fontWeight: "600",
        color: "#1f2937",
        margin: "0 0 8px 0",
    },
    loadingSubtext: {
        color: "#6b7280",
        margin: 0,
    },
    resultsContainer: {
        background: "white",
        borderRadius: "20px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
        overflow: "hidden",
    },
    sourcesInfo: {
        display: "flex",
        gap: "16px",
        padding: "20px 30px",
        background: "linear-gradient(135deg, #f0fdfa, #ccfbf1)",
        borderBottom: "1px solid #99f6e4",
        flexWrap: "wrap",
    },
    sourceTag: {
        background: "white",
        padding: "8px 16px",
        borderRadius: "20px",
        fontSize: "0.9rem",
        fontWeight: "500",
        color: "#0d9488",
    },
    tabNav: {
        display: "flex",
        gap: "8px",
        padding: "20px 30px",
        borderBottom: "1px solid #e5e7eb",
        background: "#fafafa",
    },
    tabBtn: {
        padding: "12px 24px",
        border: "none",
        borderRadius: "10px",
        background: "transparent",
        color: "#6b7280",
        fontSize: "0.95rem",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s",
    },
    tabBtnActive: {
        background: "linear-gradient(135deg, #06b6d4, #0891b2)",
        color: "white",
    },
    tabContent: {
        padding: "30px",
        minHeight: "400px",
    },
    markdownContent: {
        lineHeight: "1.8",
        color: "#374151",
    },
    papersGrid: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    paperCard: {
        padding: "24px",
        background: "#f8fafc",
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
    },
    paperSource: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "12px",
    },
    sourceLabel: {
        background: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
        color: "#1e40af",
        padding: "4px 12px",
        borderRadius: "6px",
        fontSize: "0.8rem",
        fontWeight: "600",
    },
    citations: {
        color: "#059669",
        fontSize: "0.85rem",
        fontWeight: "500",
    },
    paperTitle: {
        fontSize: "1.1rem",
        fontWeight: "700",
        color: "#1f2937",
        marginBottom: "8px",
        lineHeight: "1.4",
    },
    paperAuthors: {
        color: "#6b7280",
        fontSize: "0.9rem",
        marginBottom: "12px",
    },
    paperAbstract: {
        color: "#4b5563",
        fontSize: "0.9rem",
        lineHeight: "1.6",
        marginBottom: "12px",
    },
    paperLink: {
        color: "#0891b2",
        fontWeight: "600",
        textDecoration: "none",
        fontSize: "0.9rem",
    },
    noPapers: {
        textAlign: "center",
        padding: "40px",
        color: "#6b7280",
    },
    retryBtn: {
        marginTop: "16px",
        padding: "12px 24px",
        background: "linear-gradient(135deg, #06b6d4, #0891b2)",
        color: "white",
        border: "none",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "600",
    },
    traceDetails: {
        margin: "20px 30px 30px",
        background: "#f0fdfa",
        borderRadius: "12px",
        overflow: "hidden",
    },
    traceSummary: {
        padding: "16px 20px",
        cursor: "pointer",
        fontWeight: "600",
        color: "#0d9488",
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
