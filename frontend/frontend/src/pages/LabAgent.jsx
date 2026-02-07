import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";

const API_BASE = "http://localhost:8000";

export default function LabAgent() {
  const [experiment, setExperiment] = useState("");
  const [inputMode, setInputMode] = useState("text");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [stage, setStage] = useState("idle");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  const fileInputRef = useRef(null);

  const callLabAgent = async (step) => {
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("experiment", experiment);
      formData.append("step", step);

      const res = await fetch(`${API_BASE}/lab/`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      // Backend returns { stage, content } directly
      if (!data.content) {
        throw new Error(data.content || "No content received from backend");
      }

      // Check for error stage
      if (data.stage === "ERROR" || data.stage === "NOT_FOUND") {
        throw new Error(data.content);
      }

      const newContent = data.content;
      setContent(newContent);
      setStage(step);

      // Add to history
      setHistory(prev => [...prev, { stage: step, content: newContent }]);
    } catch (err) {
      setError(err.message || "Failed to fetch lab content");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      setExperiment(`Lab from: ${file.name}`);
    }
  };

  const resetLab = () => {
    setExperiment("");
    setStage("idle");
    setContent("");
    setHistory([]);
    setError("");
    setUploadedFile(null);
  };

  const stages = [
    { id: "explanation", icon: "📘", label: "What & Why", description: "Understanding the concept" },
    { id: "pseudocode", icon: "🧠", label: "Algorithm", description: "Pseudocode & logic" },
    { id: "viva", icon: "🎤", label: "Viva Prep", description: "Q&A preparation" },
  ];

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>🧪 Lab Agent</h1>
        <p style={styles.subtitle}>
          Master lab experiments with step-by-step explanations and viva preparation
        </p>
      </div>

      <div style={styles.mainContent}>
        {/* Sidebar - Stage Progress */}
        {stage !== "idle" && (
          <div style={styles.sidebar}>
            <h3 style={styles.sidebarTitle}>Lab Progress</h3>
            <div style={styles.stageList}>
              {stages.map((s, idx) => {
                const isCompleted = history.some(h => h.stage === s.id);
                const isCurrent = stage === s.id;
                return (
                  <div
                    key={s.id}
                    style={{
                      ...styles.stageItem,
                      ...(isCurrent ? styles.stageItemCurrent : {}),
                      ...(isCompleted && !isCurrent ? styles.stageItemCompleted : {}),
                    }}
                    onClick={() => isCompleted && setStage(s.id)}
                  >
                    <div style={{
                      ...styles.stageIcon,
                      ...(isCompleted ? styles.stageIconCompleted : {}),
                      ...(isCurrent ? styles.stageIconCurrent : {}),
                    }}>
                      {isCompleted ? "✓" : s.icon}
                    </div>
                    <div>
                      <div style={styles.stageLabel}>{s.label}</div>
                      <div style={styles.stageDesc}>{s.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={resetLab} style={styles.resetBtn}>
              🔄 New Experiment
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div style={styles.contentArea}>
          {/* Error Display */}
          {error && (
            <div style={styles.errorBox}>
              <span>⚠️</span>
              <span>{error}</span>
              <button onClick={() => setError("")} style={styles.closeBtn}>×</button>
            </div>
          )}

          {/* Input Section */}
          {stage === "idle" && (
            <div style={styles.inputSection}>
              <h2 style={styles.sectionTitle}>Enter Experiment Details</h2>

              {/* Input Mode Tabs */}
              <div style={styles.inputModes}>
                {[
                  { id: "text", icon: "✏️", label: "Text" },
                  { id: "pdf", icon: "📄", label: "Lab Manual" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setInputMode(mode.id)}
                    style={{
                      ...styles.modeBtn,
                      ...(inputMode === mode.id ? styles.modeBtnActive : {}),
                    }}
                  >
                    <span style={styles.modeIcon}>{mode.icon}</span>
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Text Input */}
              {inputMode === "text" && (
                <div style={styles.inputBox}>
                  <input
                    type="text"
                    value={experiment}
                    onChange={(e) => setExperiment(e.target.value)}
                    placeholder="e.g., BDA Exp 2: MapReduce Word Count, ML Exp 3: Decision Tree..."
                    style={styles.textInput}
                    onKeyPress={(e) => e.key === "Enter" && !loading && callLabAgent("explanation")}
                  />
                </div>
              )}

              {/* PDF Input */}
              {inputMode === "pdf" && (
                <div style={styles.uploadBox}>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    style={{ display: "none" }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={styles.uploadBtn}
                  >
                    <span style={styles.uploadIcon}>📄</span>
                    <span>Upload Lab Manual</span>
                    <span style={styles.uploadHint}>PDF format</span>
                  </button>
                  {uploadedFile && (
                    <div style={styles.filePreview}>
                      <span>📎 {uploadedFile.name}</span>
                      <button onClick={() => setUploadedFile(null)} style={styles.removeBtn}>×</button>
                    </div>
                  )}
                  <input
                    type="text"
                    value={experiment}
                    onChange={(e) => setExperiment(e.target.value)}
                    placeholder="Which experiment should I explain?"
                    style={{ ...styles.textInput, marginTop: "16px" }}
                  />
                </div>
              )}

              {/* Start Button */}
              <button
                onClick={() => callLabAgent("explanation")}
                disabled={loading || !experiment.trim()}
                style={{
                  ...styles.startBtn,
                  opacity: loading || !experiment.trim() ? 0.6 : 1,
                }}
              >
                {loading ? "⏳ Loading..." : "🚀 Start Lab Session"}
              </button>

              {/* Quick Examples */}
              <div style={styles.examples}>
                <p style={styles.examplesTitle}>Try these examples:</p>
                <div style={styles.exampleTags}>
                  {[
                    "MapReduce Word Count",
                    "Hadoop HDFS Setup",
                    "K-Means Clustering",
                    "Linear Regression",
                    "Decision Tree Classification"
                  ].map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setExperiment(ex)}
                      style={styles.exampleTag}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div style={styles.loadingBox}>
              <div style={styles.loadingSpinner}></div>
              <h3>Preparing lab content...</h3>
              <p style={styles.loadingText}>Analyzing experiment requirements</p>
            </div>
          )}

          {/* Content Display */}
          {stage !== "idle" && !loading && (
            <div style={styles.contentSection}>
              {/* Current Stage Header */}
              <div style={styles.stageHeader}>
                <div style={styles.stageHeaderIcon}>
                  {stages.find(s => s.id === stage)?.icon}
                </div>
                <div>
                  <h2 style={styles.stageHeaderTitle}>
                    {stages.find(s => s.id === stage)?.label}
                  </h2>
                  <p style={styles.stageHeaderExp}>{experiment}</p>
                </div>
              </div>

              {/* Content Box */}
              <div style={styles.contentBox}>
                <div style={styles.markdownContent}>
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              </div>

              {/* Navigation */}
              <div style={styles.navButtons}>
                {stage === "explanation" && (
                  <button
                    onClick={() => callLabAgent("pseudocode")}
                    disabled={loading}
                    style={styles.nextBtn}
                  >
                    <span>Continue to Algorithm</span>
                    <span>→</span>
                  </button>
                )}
                {stage === "pseudocode" && (
                  <>
                    <button
                      onClick={() => setStage("explanation")}
                      style={styles.backBtn}
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => callLabAgent("viva")}
                      disabled={loading}
                      style={styles.nextBtn}
                    >
                      <span>Prepare for Viva</span>
                      <span>→</span>
                    </button>
                  </>
                )}
                {stage === "viva" && (
                  <>
                    <button
                      onClick={() => setStage("pseudocode")}
                      style={styles.backBtn}
                    >
                      ← Back
                    </button>
                    <button
                      onClick={resetLab}
                      style={styles.completeBtn}
                    >
                      ✓ Complete Lab
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
  },
  header: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    padding: "48px 24px",
    textAlign: "center",
    color: "white",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "700",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "1.1rem",
    opacity: 0.9,
    margin: 0,
  },
  mainContent: {
    display: "flex",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "32px 24px",
    gap: "32px",
  },
  sidebar: {
    width: "280px",
    background: "white",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
    height: "fit-content",
    position: "sticky",
    top: "100px",
  },
  sidebarTitle: {
    fontSize: "1rem",
    fontWeight: "600",
    marginBottom: "20px",
    color: "#374151",
  },
  stageList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  stageItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px",
    borderRadius: "12px",
    background: "#f9fafb",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  stageItemCurrent: {
    background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.1))",
    border: "2px solid #10b981",
  },
  stageItemCompleted: {
    background: "#ecfdf5",
  },
  stageIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.2rem",
  },
  stageIconCurrent: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
  },
  stageIconCompleted: {
    background: "#10b981",
    color: "white",
  },
  stageLabel: {
    fontWeight: "600",
    fontSize: "0.95rem",
    color: "#1f2937",
  },
  stageDesc: {
    fontSize: "0.8rem",
    color: "#6b7280",
  },
  resetBtn: {
    width: "100%",
    marginTop: "20px",
    padding: "12px",
    background: "#f3f4f6",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "500",
  },
  contentArea: {
    flex: 1,
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#fee2e2",
    padding: "16px 20px",
    borderRadius: "12px",
    marginBottom: "24px",
    color: "#991b1b",
  },
  closeBtn: {
    marginLeft: "auto",
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
  },
  inputSection: {
    background: "white",
    borderRadius: "24px",
    padding: "40px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    fontWeight: "600",
    marginBottom: "24px",
    textAlign: "center",
    color: "#1f2937",
  },
  inputModes: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "32px",
  },
  modeBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    padding: "16px 32px",
    border: "2px solid #e5e7eb",
    borderRadius: "16px",
    background: "white",
    cursor: "pointer",
    transition: "all 0.2s",
    fontWeight: "600",
    color: "#6b7280",
  },
  modeBtnActive: {
    borderColor: "#10b981",
    background: "rgba(16,185,129,0.1)",
    color: "#10b981",
  },
  modeIcon: { fontSize: "1.5rem" },
  inputBox: { marginBottom: "24px" },
  textInput: {
    width: "100%",
    padding: "18px 24px",
    fontSize: "1.1rem",
    border: "2px solid #e5e7eb",
    borderRadius: "16px",
    outline: "none",
    boxSizing: "border-box",
  },
  uploadBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "24px",
  },
  uploadBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    padding: "40px 60px",
    border: "2px dashed #d1d5db",
    borderRadius: "16px",
    background: "#f9fafb",
    cursor: "pointer",
  },
  uploadIcon: { fontSize: "3rem" },
  uploadHint: { fontSize: "0.85rem", color: "#9ca3af" },
  filePreview: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "16px",
    padding: "12px 20px",
    background: "#ecfdf5",
    borderRadius: "8px",
    color: "#059669",
  },
  removeBtn: {
    background: "none",
    border: "none",
    fontSize: "1.2rem",
    cursor: "pointer",
  },
  startBtn: {
    width: "100%",
    padding: "18px",
    fontSize: "1.1rem",
    fontWeight: "600",
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    cursor: "pointer",
  },
  examples: {
    marginTop: "32px",
    textAlign: "center",
  },
  examplesTitle: {
    fontSize: "0.9rem",
    color: "#6b7280",
    marginBottom: "12px",
  },
  exampleTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    justifyContent: "center",
  },
  exampleTag: {
    padding: "8px 16px",
    background: "#f3f4f6",
    border: "none",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "0.85rem",
    color: "#4b5563",
    transition: "all 0.2s",
  },
  loadingBox: {
    background: "white",
    borderRadius: "24px",
    padding: "60px",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
  },
  loadingSpinner: {
    width: "60px",
    height: "60px",
    border: "4px solid #e5e7eb",
    borderTopColor: "#10b981",
    borderRadius: "50%",
    margin: "0 auto 24px",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    color: "#6b7280",
  },
  contentSection: {
    background: "white",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
  },
  stageHeader: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "24px 32px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
  },
  stageHeaderIcon: {
    width: "56px",
    height: "56px",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.8rem",
  },
  stageHeaderTitle: {
    fontSize: "1.4rem",
    fontWeight: "600",
    margin: 0,
  },
  stageHeaderExp: {
    margin: "4px 0 0 0",
    opacity: 0.9,
  },
  contentBox: {
    padding: "32px",
  },
  markdownContent: {
    lineHeight: "1.8",
    fontSize: "1.05rem",
    color: "#374151",
  },
  navButtons: {
    display: "flex",
    justifyContent: "space-between",
    padding: "24px 32px",
    borderTop: "1px solid #e5e7eb",
    background: "#fafafa",
  },
  backBtn: {
    padding: "14px 28px",
    background: "#f3f4f6",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "1rem",
  },
  nextBtn: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 28px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "1rem",
    marginLeft: "auto",
  },
  completeBtn: {
    padding: "14px 28px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "1rem",
  },
};
