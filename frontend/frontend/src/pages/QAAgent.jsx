import { useState, useRef } from "react";
import { learnTopic, deepResearch } from "../api/backend";
import ReactMarkdown from "react-markdown";

export default function LearningAgent() {
  // Input states
  const [topic, setTopic] = useState("");
  const [inputMode, setInputMode] = useState("text"); // text, image, speech, pdf
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  // Response states
  const [response, setResponse] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deepResearchResult, setDeepResearchResult] = useState(null);
  const [deepLoading, setDeepLoading] = useState(false);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  // Handle speech recording (Web Speech API)
  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError("Speech recognition not supported in this browser. Try Chrome.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = (e) => {
      setIsRecording(false);
      setError(`Speech error: ${e.error}`);
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setTopic(transcript);
      setInputMode("text");
    };

    recognition.start();
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      // For now, we'll extract the filename as a topic hint
      setTopic(`Analyze content from: ${file.name}`);
    }
  };

  async function handleAsk(stage) {
    if (!topic.trim()) {
      setError("Please enter a topic or provide input");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await learnTopic(topic, stage);

      if (data.content && data.content.includes("⚠️")) {
        setError(data.content);
        setResponse(null);
      } else {
        setResponse(data);
        setScore(null);
        setQuizAnswers({});
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to connect. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  function submitQuiz() {
    if (!response?.questions) return;

    let correct = 0;
    response.questions.forEach((q) => {
      if (quizAnswers[q.id] === q.answer) correct++;
    });

    const percent = Math.round((correct / response.questions.length) * 100);
    setScore({ correct, total: response.questions.length, percent });
  }

  function resetAgent() {
    setTopic("");
    setResponse(null);
    setQuizAnswers({});
    setScore(null);
    setError("");
    setUploadedFile(null);
    setDeepResearchResult(null);
  }

  async function handleDeepResearch() {
    if (!topic.trim()) {
      setError("Please enter a topic first");
      return;
    }

    setDeepLoading(true);
    setError("");
    setDeepResearchResult(null);

    try {
      const data = await deepResearch(topic);

      if (data.stage === "ERROR") {
        setError(data.content);
      } else {
        setDeepResearchResult(data);
      }
    } catch (err) {
      console.error("Deep research error:", err);
      setError("Failed to run deep research. Make sure backend is running.");
    } finally {
      setDeepLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>📚 Learning Agent</h1>
        <p style={styles.subtitle}>
          Master any concept with AI-powered explanations, deep dives, and quizzes
        </p>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Error Display */}
        {error && (
          <div style={styles.errorBox}>
            <span style={styles.errorIcon}>⚠️</span>
            <div>
              <strong>Error</strong>
              <p style={{ margin: "4px 0 0 0" }}>{error}</p>
            </div>
            <button onClick={() => setError("")} style={styles.closeBtn}>×</button>
          </div>
        )}

        {/* Input Section */}
        {!response && (
          <div style={styles.inputSection}>
            <h2 style={styles.sectionTitle}>What would you like to learn?</h2>

            {/* Input Mode Tabs */}
            <div style={styles.inputModes}>
              {[
                { id: "text", icon: "✏️", label: "Text" },
                { id: "speech", icon: "🎤", label: "Speech" },
                { id: "image", icon: "🖼️", label: "Image" },
                { id: "pdf", icon: "📄", label: "PDF" },
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
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Neural Networks, MapReduce, Decision Trees..."
                  style={styles.textInput}
                  onKeyPress={(e) => e.key === "Enter" && !loading && handleAsk("explain")}
                />
              </div>
            )}

            {/* Speech Input */}
            {inputMode === "speech" && (
              <div style={styles.speechBox}>
                <button
                  onClick={startSpeechRecognition}
                  style={{
                    ...styles.speechBtn,
                    ...(isRecording ? styles.speechBtnActive : {}),
                  }}
                  disabled={isRecording}
                >
                  <span style={styles.micIcon}>{isRecording ? "🔴" : "🎤"}</span>
                  {isRecording ? "Listening..." : "Click to Speak"}
                </button>
                {topic && (
                  <div style={styles.transcriptBox}>
                    <strong>Recognized:</strong> {topic}
                  </div>
                )}
              </div>
            )}

            {/* Image Input */}
            {inputMode === "image" && (
              <div style={styles.uploadBox}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={styles.uploadBtn}
                >
                  <span style={styles.uploadIcon}>🖼️</span>
                  <span>Upload Image</span>
                  <span style={styles.uploadHint}>PNG, JPG, or screenshot</span>
                </button>
                {uploadedFile && (
                  <div style={styles.filePreview}>
                    <span>📎 {uploadedFile.name}</span>
                    <button onClick={() => setUploadedFile(null)} style={styles.removeBtn}>×</button>
                  </div>
                )}
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="What would you like to know about this image?"
                  style={{ ...styles.textInput, marginTop: "16px" }}
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
                  <span>Upload PDF</span>
                  <span style={styles.uploadHint}>Study material, notes, or textbook</span>
                </button>
                {uploadedFile && (
                  <div style={styles.filePreview}>
                    <span>📎 {uploadedFile.name}</span>
                    <button onClick={() => setUploadedFile(null)} style={styles.removeBtn}>×</button>
                  </div>
                )}
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="What topic should I explain from this PDF?"
                  style={{ ...styles.textInput, marginTop: "16px" }}
                />
              </div>
            )}

            {/* Buttons */}
            <div style={styles.buttonRow}>
              <button
                onClick={() => handleAsk("explain")}
                disabled={loading || deepLoading || !topic.trim()}
                style={{
                  ...styles.startBtn,
                  opacity: loading || deepLoading || !topic.trim() ? 0.6 : 1,
                  cursor: loading || deepLoading || !topic.trim() ? "not-allowed" : "pointer",
                }}
              >
                {loading ? (
                  <>
                    <span style={styles.spinner}></span>
                    Thinking...
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    Start Learning
                  </>
                )}
              </button>

              <button
                onClick={handleDeepResearch}
                disabled={loading || deepLoading || !topic.trim()}
                style={{
                  ...styles.deepResearchBtn,
                  opacity: loading || deepLoading || !topic.trim() ? 0.6 : 1,
                  cursor: loading || deepLoading || !topic.trim() ? "not-allowed" : "pointer",
                }}
              >
                {deepLoading ? (
                  <>
                    <span style={styles.spinner}></span>
                    Deep Researching...
                  </>
                ) : (
                  <>
                    <span>🧠</span>
                    Deep Research (Agentic RAG)
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && response === null && (
          <div style={styles.loadingBox}>
            <div style={styles.loadingSpinner}></div>
            <h3 style={styles.loadingTitle}>AI is preparing your lesson...</h3>
            <p style={styles.loadingText}>This may take 10-30 seconds</p>
          </div>
        )}

        {/* Deep Research Loading */}
        {deepLoading && (
          <div style={styles.loadingBox}>
            <div style={styles.loadingSpinner}></div>
            <h3 style={styles.loadingTitle}>🧠 Agentic RAG Processing...</h3>
            <p style={styles.loadingText}>Breaking question into sub-queries, searching multiple times, and self-evaluating...</p>
            <div style={styles.agenticSteps}>
              <div style={styles.agenticStep}>⚙️ Planning sub-queries...</div>
              <div style={styles.agenticStep}>🔍 Multi-query retrieval...</div>
              <div style={styles.agenticStep}>💭 Generating answer...</div>
              <div style={styles.agenticStep}>🔎 Self-evaluating...</div>
            </div>
          </div>
        )}

        {/* Deep Research Results */}
        {deepResearchResult && (
          <div style={styles.responseSection}>
            <div style={styles.topicHeader}>
              <div>
                <span style={styles.deepResearchLabel}>🧠 Agentic RAG</span>
                <h2 style={styles.topicTitle}>{topic}</h2>
              </div>
              <button onClick={resetAgent} style={styles.newTopicBtn}>
                🔄 New Topic
              </button>
            </div>

            {/* Agentic RAG Metadata */}
            <div style={styles.agenticMeta}>
              <div style={styles.metaItem}>
                <span style={styles.metaIcon}>🔄</span>
                <span>{deepResearchResult.iterations || 1} Iterations</span>
              </div>
              <div style={styles.metaItem}>
                <span style={styles.metaIcon}>📚</span>
                <span>{deepResearchResult.sources_used || 0} Sources Used</span>
              </div>
              <div style={styles.metaItem}>
                <span style={styles.metaIcon}>🔍</span>
                <span>{deepResearchResult.sub_queries?.length || 0} Sub-queries</span>
              </div>
            </div>

            {/* Sub-queries Used */}
            {deepResearchResult.sub_queries?.length > 0 && (
              <div style={styles.subQueriesBox}>
                <h4 style={styles.subQueriesTitle}>🔍 Sub-queries Generated</h4>
                <div style={styles.subQueriesList}>
                  {deepResearchResult.sub_queries.map((q, i) => (
                    <div key={i} style={styles.subQueryItem}>
                      <span style={styles.subQueryNum}>{i + 1}</span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reasoning Trace */}
            {deepResearchResult.reasoning_trace?.length > 0 && (
              <div style={styles.traceBox}>
                <h4 style={styles.traceTitle}>📋 Reasoning Trace</h4>
                <div style={styles.traceList}>
                  {deepResearchResult.reasoning_trace.map((step, i) => (
                    <div key={i} style={styles.traceStep}>
                      <div style={styles.traceDot}></div>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Answer */}
            <div style={styles.contentCard}>
              <h3 style={styles.cardHeader}>
                <span>📝</span> Deep Research Answer
              </h3>
              <div style={styles.markdownContent}>
                <ReactMarkdown>{deepResearchResult.content}</ReactMarkdown>
              </div>
            </div>

            {/* Action: Try normal learning */}
            <div style={styles.actionRow}>
              <button
                onClick={() => handleAsk("explain")}
                style={styles.actionBtn}
                disabled={loading}
              >
                📚 Also try Simple Learning
              </button>
              <button
                onClick={() => handleAsk("quiz")}
                style={styles.actionBtn}
                disabled={loading}
              >
                🧠 Take Quiz on this topic
              </button>
            </div>
          </div>
        )}

        {/* Response Section */}
        {response && (
          <div style={styles.responseSection}>
            {/* Topic Header */}
            <div style={styles.topicHeader}>
              <div>
                <span style={styles.topicLabel}>Learning</span>
                <h2 style={styles.topicTitle}>{topic}</h2>
              </div>
              <button onClick={resetAgent} style={styles.newTopicBtn}>
                🔄 New Topic
              </button>
            </div>

            {/* Stage Navigation */}
            <div style={styles.stageNav}>
              {[
                { stage: "explain", icon: "📖", label: "Simple", current: response.stage === "EXPLAIN" },
                { stage: "deep", icon: "🔬", label: "Deep Dive", current: response.stage === "DEEP" },
                { stage: "references", icon: "📚", label: "Resources", current: response.stage === "REFERENCES" },
                { stage: "quiz", icon: "🧠", label: "Quiz", current: response.stage === "QUIZ" },
              ].map((item) => (
                <button
                  key={item.stage}
                  onClick={() => handleAsk(item.stage)}
                  disabled={loading}
                  style={{
                    ...styles.stageBtn,
                    ...(item.current ? styles.stageBtnActive : {}),
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Content Display */}
            {response.content && response.stage !== "QUIZ" && (
              <div style={styles.contentBox}>
                <div style={styles.markdownContent}>
                  <ReactMarkdown>{response.content}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Quiz Display */}
            {response.stage === "QUIZ" && response.questions && (
              <div style={styles.quizSection}>
                <div style={styles.quizHeader}>
                  <h3>🧠 Knowledge Check</h3>
                  <span style={styles.questionCount}>
                    {response.questions.length} Questions
                  </span>
                </div>

                {response.questions.map((q, idx) => (
                  <div key={q.id} style={styles.questionCard}>
                    <div style={styles.questionNumber}>Q{idx + 1}</div>
                    <div style={styles.questionContent}>
                      <p style={styles.questionText}>{q.question}</p>
                      <div style={styles.optionsGrid}>
                        {q.options.map((opt, optIdx) => {
                          const isSelected = quizAnswers[q.id] === optIdx;
                          const isCorrect = q.answer === optIdx;
                          const showResult = score !== null;

                          return (
                            <div
                              key={optIdx}
                              onClick={() => !showResult && setQuizAnswers({ ...quizAnswers, [q.id]: optIdx })}
                              style={{
                                ...styles.optionBtn,
                                ...(isSelected ? styles.optionSelected : {}),
                                ...(showResult && isCorrect ? styles.optionCorrect : {}),
                                ...(showResult && isSelected && !isCorrect ? styles.optionWrong : {}),
                                cursor: showResult ? "default" : "pointer",
                              }}
                            >
                              <span style={styles.optionLetter}>
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{opt}</span>
                              {showResult && isCorrect && <span style={styles.checkMark}>✓</span>}
                              {showResult && isSelected && !isCorrect && <span style={styles.crossMark}>✗</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Quiz Submit / Score */}
                {!score ? (
                  <button
                    onClick={submitQuiz}
                    disabled={Object.keys(quizAnswers).length !== response.questions.length}
                    style={{
                      ...styles.submitBtn,
                      opacity: Object.keys(quizAnswers).length === response.questions.length ? 1 : 0.5,
                    }}
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <div style={styles.scoreCard}>
                    <div style={{
                      ...styles.scoreCircle,
                      background: score.percent >= 80
                        ? "linear-gradient(135deg, #10b981, #059669)"
                        : score.percent >= 50
                          ? "linear-gradient(135deg, #f59e0b, #d97706)"
                          : "linear-gradient(135deg, #ef4444, #dc2626)"
                    }}>
                      <span style={styles.scoreNumber}>{score.percent}%</span>
                    </div>
                    <div style={styles.scoreDetails}>
                      <h3 style={styles.scoreTitle}>
                        {score.percent === 100 ? "🎉 Perfect Score!" :
                          score.percent >= 80 ? "🌟 Great Job!" :
                            score.percent >= 50 ? "📚 Keep Learning!" :
                              "💪 Try Again!"}
                      </h3>
                      <p>You got {score.correct} out of {score.total} correct</p>
                      <div style={styles.scoreActions}>
                        <button onClick={() => handleAsk("quiz")} style={styles.retryBtn}>
                          🔄 Retake Quiz
                        </button>
                        <button onClick={() => handleAsk("deep")} style={styles.studyBtn}>
                          📖 Study More
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)",
    padding: "0",
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
    opacity: "0.9",
    margin: 0,
  },
  content: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "32px 24px",
  },
  errorBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    background: "linear-gradient(135deg, #fee2e2, #fecaca)",
    border: "1px solid #fca5a5",
    borderRadius: "12px",
    padding: "16px 20px",
    marginBottom: "24px",
  },
  errorIcon: { fontSize: "1.5rem" },
  closeBtn: {
    marginLeft: "auto",
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    color: "#991b1b",
  },
  inputSection: {
    background: "white",
    borderRadius: "24px",
    padding: "40px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
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
    flexWrap: "wrap",
  },
  modeBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    padding: "16px 24px",
    border: "2px solid #e5e7eb",
    borderRadius: "16px",
    background: "white",
    cursor: "pointer",
    transition: "all 0.2s",
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#6b7280",
  },
  modeBtnActive: {
    borderColor: "#667eea",
    background: "linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1))",
    color: "#667eea",
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
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  },
  speechBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
    marginBottom: "24px",
  },
  speechBtn: {
    width: "160px",
    height: "160px",
    borderRadius: "50%",
    border: "none",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "transform 0.2s, box-shadow 0.2s",
    boxShadow: "0 10px 40px rgba(102,126,234,0.3)",
  },
  speechBtnActive: {
    animation: "pulse 1s infinite",
    boxShadow: "0 0 0 20px rgba(102,126,234,0.2)",
  },
  micIcon: { fontSize: "3rem" },
  transcriptBox: {
    padding: "16px 24px",
    background: "#f3f4f6",
    borderRadius: "12px",
    width: "100%",
    textAlign: "center",
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
    transition: "all 0.2s",
  },
  uploadIcon: { fontSize: "3rem" },
  uploadHint: {
    fontSize: "0.85rem",
    color: "#9ca3af",
  },
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
    color: "#059669",
  },
  startBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    width: "100%",
    padding: "18px",
    fontSize: "1.1rem",
    fontWeight: "600",
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  spinner: {
    width: "20px",
    height: "20px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingBox: {
    background: "white",
    borderRadius: "24px",
    padding: "60px",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
  },
  loadingSpinner: {
    width: "60px",
    height: "60px",
    border: "4px solid #e5e7eb",
    borderTopColor: "#667eea",
    borderRadius: "50%",
    margin: "0 auto 24px",
    animation: "spin 1s linear infinite",
  },
  loadingTitle: {
    fontSize: "1.3rem",
    fontWeight: "600",
    margin: "0 0 8px 0",
  },
  loadingText: {
    color: "#6b7280",
    margin: 0,
  },
  responseSection: {
    background: "white",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
  },
  topicHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 32px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
  },
  topicLabel: {
    fontSize: "0.85rem",
    opacity: 0.8,
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  topicTitle: {
    fontSize: "1.5rem",
    fontWeight: "600",
    margin: "4px 0 0 0",
  },
  newTopicBtn: {
    padding: "10px 20px",
    background: "rgba(255,255,255,0.2)",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    fontWeight: "500",
  },
  stageNav: {
    display: "flex",
    gap: "8px",
    padding: "20px 32px",
    borderBottom: "1px solid #e5e7eb",
    background: "#fafafa",
    overflowX: "auto",
  },
  stageBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 20px",
    border: "none",
    borderRadius: "10px",
    background: "transparent",
    color: "#6b7280",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },
  stageBtnActive: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
  },
  contentBox: {
    padding: "32px",
  },
  markdownContent: {
    lineHeight: "1.8",
    fontSize: "1.05rem",
    color: "#374151",
  },
  quizSection: {
    padding: "32px",
  },
  quizHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  questionCount: {
    background: "#f3f4f6",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "0.9rem",
    color: "#6b7280",
  },
  questionCard: {
    display: "flex",
    gap: "20px",
    marginBottom: "24px",
    padding: "24px",
    background: "#f9fafb",
    borderRadius: "16px",
  },
  questionNumber: {
    width: "48px",
    height: "48px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    flexShrink: 0,
  },
  questionContent: { flex: 1 },
  questionText: {
    fontSize: "1.1rem",
    fontWeight: "500",
    marginBottom: "16px",
    color: "#1f2937",
  },
  optionsGrid: {
    display: "grid",
    gap: "10px",
  },
  optionBtn: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 18px",
    background: "white",
    border: "2px solid #e5e7eb",
    borderRadius: "10px",
    transition: "all 0.2s",
  },
  optionSelected: {
    borderColor: "#667eea",
    background: "rgba(102,126,234,0.1)",
  },
  optionCorrect: {
    borderColor: "#10b981",
    background: "#ecfdf5",
  },
  optionWrong: {
    borderColor: "#ef4444",
    background: "#fef2f2",
  },
  optionLetter: {
    width: "28px",
    height: "28px",
    background: "#e5e7eb",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    fontSize: "0.9rem",
  },
  checkMark: {
    marginLeft: "auto",
    color: "#10b981",
    fontWeight: "700",
  },
  crossMark: {
    marginLeft: "auto",
    color: "#ef4444",
    fontWeight: "700",
  },
  submitBtn: {
    width: "100%",
    padding: "16px",
    fontSize: "1.1rem",
    fontWeight: "600",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    cursor: "pointer",
  },
  scoreCard: {
    display: "flex",
    alignItems: "center",
    gap: "32px",
    padding: "32px",
    background: "#f9fafb",
    borderRadius: "16px",
    marginTop: "24px",
  },
  scoreCircle: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    flexShrink: 0,
  },
  scoreNumber: {
    fontSize: "2rem",
    fontWeight: "700",
  },
  scoreDetails: { flex: 1 },
  scoreTitle: {
    fontSize: "1.3rem",
    marginBottom: "8px",
  },
  scoreActions: {
    display: "flex",
    gap: "12px",
    marginTop: "16px",
  },
  retryBtn: {
    padding: "10px 20px",
    background: "#f3f4f6",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
  },
  studyBtn: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
  },
  // Deep Research Styles
  buttonRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  deepResearchBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    flex: 1,
    padding: "18px",
    fontSize: "1rem",
    fontWeight: "600",
    border: "2px solid #667eea",
    borderRadius: "16px",
    background: "linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1))",
    color: "#667eea",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  deepResearchLabel: {
    fontSize: "0.85rem",
    opacity: 0.9,
    textTransform: "uppercase",
    letterSpacing: "1px",
    background: "rgba(255,255,255,0.2)",
    padding: "4px 12px",
    borderRadius: "20px",
  },
  agenticSteps: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "20px",
    textAlign: "left",
    maxWidth: "400px",
    margin: "20px auto 0",
  },
  agenticStep: {
    padding: "10px 16px",
    background: "#f3f4f6",
    borderRadius: "8px",
    fontSize: "0.9rem",
    color: "#6b7280",
    animation: "fadeIn 0.5s ease-in",
  },
  agenticMeta: {
    display: "flex",
    gap: "16px",
    padding: "16px 32px",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    flexWrap: "wrap",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    background: "white",
    borderRadius: "20px",
    fontSize: "0.9rem",
    fontWeight: "500",
    border: "1px solid #e5e7eb",
  },
  metaIcon: {
    fontSize: "1.1rem",
  },
  subQueriesBox: {
    padding: "20px 32px",
    borderBottom: "1px solid #e5e7eb",
  },
  subQueriesTitle: {
    fontSize: "1rem",
    fontWeight: "600",
    marginBottom: "12px",
    color: "#374151",
  },
  subQueriesList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  subQueryItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 16px",
    background: "#eff6ff",
    borderRadius: "8px",
    border: "1px solid #bfdbfe",
  },
  subQueryNum: {
    width: "24px",
    height: "24px",
    background: "#3b82f6",
    color: "white",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.8rem",
    fontWeight: "700",
    flexShrink: 0,
  },
  traceBox: {
    padding: "20px 32px",
    borderBottom: "1px solid #e5e7eb",
    background: "#fefce8",
  },
  traceTitle: {
    fontSize: "1rem",
    fontWeight: "600",
    marginBottom: "12px",
    color: "#374151",
  },
  traceList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  traceStep: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 12px",
    fontSize: "0.9rem",
    color: "#4b5563",
  },
  traceDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#f59e0b",
    flexShrink: 0,
  },
  contentCard: {
    padding: "32px",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "1.2rem",
    fontWeight: "600",
    marginBottom: "16px",
    color: "#1f2937",
  },
  actionRow: {
    display: "flex",
    gap: "12px",
    padding: "20px 32px",
    borderTop: "1px solid #e5e7eb",
    background: "#f9fafb",
  },
  actionBtn: {
    flex: 1,
    padding: "14px 20px",
    background: "white",
    border: "2px solid #e5e7eb",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.95rem",
    transition: "all 0.2s",
  },
};