import { useState, useRef } from "react";
import { uploadSyllabus } from "../api/backend";
import { useAppContext } from "../context/AppContext";

export default function UploadSyllabus() {
  const { setSyllabusUploaded, setSyllabusName } = useAppContext();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = async () => {
    if (!file) {
      setStatus("Please select a PDF file");
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const res = await uploadSyllabus(file);
      if (res.error) {
        setStatus(res.error);
        setIsSuccess(false);
      } else {
        setStatus(res.message || "Syllabus uploaded successfully!");
        setIsSuccess(true);
        setSyllabusUploaded(true);
        setSyllabusName(file.name);
      }
    } catch (err) {
      setStatus("Upload failed. Please try again.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        setStatus("");
      } else {
        setStatus("Please upload a PDF file only");
        setIsSuccess(false);
      }
    }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>📤 Upload Syllabus</h1>
        <p style={styles.subtitle}>
          Upload your course syllabus to enable AI-powered learning assistance
        </p>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        <div style={styles.uploadCard}>
          {/* Info Banner */}
          <div style={styles.infoBanner}>
            <span style={styles.infoIcon}>💡</span>
            <div>
              <strong>Why upload a syllabus?</strong>
              <p style={styles.infoText}>
                The AI uses your syllabus to provide accurate, course-specific answers,
                quizzes, and lab explanations tailored to your curriculum.
              </p>
            </div>
          </div>

          {/* Upload Zone */}
          <div
            style={{
              ...styles.dropZone,
              ...(dragActive ? styles.dropZoneActive : {}),
              ...(file ? styles.dropZoneWithFile : {}),
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              accept=".pdf"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={(e) => {
                setFile(e.target.files[0]);
                setStatus("");
              }}
            />

            {file ? (
              <div style={styles.filePreview}>
                <div style={styles.fileIconLarge}>📄</div>
                <div style={styles.fileName}>{file.name}</div>
                <div style={styles.fileSize}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setStatus("");
                    setIsSuccess(false);
                  }}
                  style={styles.removeBtn}
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <div style={styles.uploadIconLarge}>
                  {dragActive ? "📥" : "📁"}
                </div>
                <div style={styles.dropText}>
                  {dragActive
                    ? "Drop your PDF here"
                    : "Drag & drop your syllabus PDF"}
                </div>
                <div style={styles.dropHint}>or click to browse files</div>
                <div style={styles.supportedFormats}>
                  Supported format: PDF (Max 10MB)
                </div>
              </>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            style={{
              ...styles.uploadBtn,
              opacity: !file || loading ? 0.6 : 1,
              cursor: !file || loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <>
                <span style={styles.spinner}></span>
                Processing...
              </>
            ) : (
              <>
                <span>🚀</span>
                Upload Syllabus
              </>
            )}
          </button>

          {/* Status Message */}
          {status && (
            <div
              style={{
                ...styles.statusBox,
                ...(isSuccess ? styles.successBox : styles.errorBox),
              }}
            >
              <span>{isSuccess ? "✅" : "⚠️"}</span>
              <span>{status}</span>
            </div>
          )}

          {/* Success Next Steps */}
          {isSuccess && (
            <div style={styles.nextSteps}>
              <h3 style={styles.nextStepsTitle}>🎉 You're all set!</h3>
              <p>Now you can use these features:</p>
              <div style={styles.featureGrid}>
                <a href="/theory" style={styles.featureCard}>
                  <span style={styles.featureIcon}>📚</span>
                  <span>Theory Q&A</span>
                </a>
                <a href="/lab" style={styles.featureCard}>
                  <span style={styles.featureIcon}>🧪</span>
                  <span>Lab Agent</span>
                </a>
                <a href="/projects" style={styles.featureCard}>
                  <span style={styles.featureIcon}>💡</span>
                  <span>Projects</span>
                </a>
                <a href="/research" style={styles.featureCard}>
                  <span style={styles.featureIcon}>🔬</span>
                  <span>Research</span>
                </a>
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
    background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 50%, #c7d2fe 100%)",
  },
  header: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
  content: {
    maxWidth: "700px",
    margin: "0 auto",
    padding: "32px 24px",
  },
  uploadCard: {
    background: "white",
    borderRadius: "24px",
    padding: "32px",
    boxShadow: "0 20px 60px rgba(102, 126, 234, 0.12)",
  },
  infoBanner: {
    display: "flex",
    gap: "16px",
    padding: "16px 20px",
    background: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
    borderRadius: "12px",
    marginBottom: "24px",
  },
  infoIcon: { fontSize: "1.5rem" },
  infoText: {
    margin: "4px 0 0 0",
    fontSize: "0.9rem",
    color: "#4338ca",
  },
  dropZone: {
    border: "2px dashed #c7d2fe",
    borderRadius: "16px",
    padding: "48px 32px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s",
    background: "#fafaff",
    marginBottom: "24px",
  },
  dropZoneActive: {
    borderColor: "#667eea",
    background: "#eef2ff",
  },
  dropZoneWithFile: {
    borderColor: "#10b981",
    background: "#ecfdf5",
    borderStyle: "solid",
  },
  uploadIconLarge: {
    fontSize: "4rem",
    marginBottom: "16px",
  },
  dropText: {
    fontSize: "1.2rem",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "8px",
  },
  dropHint: {
    color: "#6b7280",
    marginBottom: "16px",
  },
  supportedFormats: {
    fontSize: "0.85rem",
    color: "#9ca3af",
  },
  filePreview: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  fileIconLarge: {
    fontSize: "3rem",
  },
  fileName: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#059669",
  },
  fileSize: {
    fontSize: "0.9rem",
    color: "#6b7280",
  },
  removeBtn: {
    marginTop: "8px",
    padding: "8px 16px",
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
  },
  uploadBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "18px",
    fontSize: "1.1rem",
    fontWeight: "600",
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    transition: "all 0.2s",
  },
  spinner: {
    width: "20px",
    height: "20px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    display: "inline-block",
  },
  statusBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px 20px",
    borderRadius: "12px",
    marginTop: "16px",
    fontWeight: "500",
  },
  successBox: {
    background: "#ecfdf5",
    color: "#065f46",
  },
  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  nextSteps: {
    marginTop: "24px",
    padding: "24px",
    background: "linear-gradient(135deg, #eef2ff, #e8f4f8)",
    borderRadius: "16px",
    textAlign: "center",
  },
  nextStepsTitle: {
    margin: "0 0 12px 0",
    color: "#4338ca",
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
    marginTop: "16px",
  },
  featureCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 18px",
    background: "white",
    borderRadius: "10px",
    textDecoration: "none",
    color: "#374151",
    fontWeight: "500",
    transition: "transform 0.2s, box-shadow 0.2s",
    boxShadow: "0 2px 8px rgba(102, 126, 234, 0.08)",
  },
  featureIcon: {
    fontSize: "1.3rem",
  },
};
