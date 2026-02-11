import { useState, useRef, useEffect } from "react";
import { learnTopic, deepResearch, followUpChat } from "../api/backend";
import ReactMarkdown from "react-markdown";

export default function LearningAgent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [useDeepResearch, setUseDeepResearch] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentTopic, setCurrentTopic] = useState("");

  // Quiz states
  const [quizResults, setQuizResults] = useState({}); // { [msgIndex]: { [qId]: selectedIndex } }
  const [quizScores, setQuizScores] = useState({}); // { [msgIndex]: { score, total } }

  // Multimodal states
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll logic
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Load history
  useEffect(() => {
    try {
      const saved = localStorage.getItem("chat_history");
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) { console.error("History load error", e); }
  }, []);

  // Save history
  useEffect(() => {
    try { localStorage.setItem("chat_history", JSON.stringify(history)); }
    catch (e) { console.error("History save error", e); }
  }, [history]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSend(customMsg = null, isDeep = null) {
    const userMsg = customMsg || input.trim();
    if (!userMsg && !uploadedFile) return;

    setInput("");
    setLoading(true);
    const deepToUse = isDeep !== null ? isDeep : useDeepResearch;

    const newUserMsg = {
      role: "user",
      content: userMsg || (uploadedFile ? `Analyzed file: ${uploadedFile.name}` : ""),
      timestamp: new Date().toISOString(),
      file: uploadedFile ? { name: uploadedFile.name } : null
    };

    const isFollowUp = messages.length > 0;
    const newMessages = [...messages, newUserMsg];
    setMessages(newMessages);

    try {
      let data;
      if (isFollowUp) {
        const contextStr = messages.map(m => `${m.role === "user" ? "Student" : "AI"}: ${m.content.substring(0, 300)}`).join("\n");
        data = await followUpChat(currentTopic || userMsg, userMsg, contextStr, "chat");
      } else if (deepToUse) {
        setCurrentTopic(userMsg);
        data = await deepResearch(userMsg);
      } else {
        setCurrentTopic(userMsg);
        data = await learnTopic(userMsg, "explain");
      }

      const assistantMsg = {
        role: "assistant",
        content: data.content || "No response received.",
        timestamp: new Date().toISOString(),
        meta: (data.stage === "DEEP_RESEARCH" && data.reasoning_trace) ? {
          type: "deep_research",
          iterations: data.iterations,
          sources: data.sources_used,
          subQueries: data.sub_queries,
          trace: data.reasoning_trace
        } : null
      };

      setMessages([...newMessages, assistantMsg]);

      // Save to history on first message
      if (!isFollowUp) {
        const entry = {
          id: Date.now(),
          topic: userMsg || (uploadedFile ? uploadedFile.name : "Untitled"),
          type: deepToUse ? "deep_research" : "learn",
          timestamp: new Date().toISOString(),
          messages: [...newMessages, assistantMsg]
        };
        setHistory(prev => [entry, ...prev].slice(0, 50));
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Error connecting to server.", timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
      setUploadedFile(null);
      inputRef.current?.focus();
    }
  }

  async function handleQuickAction(mode) {
    if (loading) return;
    const labels = { summary: "📝 Generate Summary", diagram: "📊 Generate Diagram", agentic: "🧠 Deep Research", videos: "🎥 Video Resources", quiz: "📝 Take Quiz" };
    setLoading(true);
    const actionMsg = { role: "user", content: labels[mode] || mode, timestamp: new Date().toISOString(), isAction: true };
    const newMsgs = [...messages, actionMsg];
    setMessages(newMsgs);

    try {
      const contextStr = messages.map(m => `${m.role === "user" ? "Student" : "AI"}: ${m.content.substring(0, 300)}`).join("\n");
      const data = await followUpChat(currentTopic || "this topic", labels[mode], contextStr, mode);

      let meta = null;
      if (data.stage === "DEEP_RESEARCH" && data.reasoning_trace) {
        meta = { type: "deep_research", iterations: data.iterations, sources: data.sources_used, subQueries: data.sub_queries, trace: data.reasoning_trace };
      } else if (data.stage === "QUIZ" && data.questions) {
        meta = { type: "quiz", questions: data.questions };
      }

      setMessages([...newMsgs, { role: "assistant", content: data.content || (data.stage === "QUIZ" ? "Got it! Here is a quiz for you:" : ""), timestamp: new Date().toISOString(), meta }]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); inputRef.current?.focus(); }
  }

  function handleQuizAnswer(msgIndex, qId, optionIndex) {
    if (quizScores[msgIndex]) return;
    setQuizResults(prev => ({ ...prev, [msgIndex]: { ...(prev[msgIndex] || {}), [qId]: optionIndex } }));
  }

  function submitThreadQuiz(msgIndex, questions) {
    const answers = quizResults[msgIndex] || {};
    let correct = 0;
    questions.forEach(q => { if (answers[q.id] === q.answer) correct++; });
    setQuizScores(prev => ({ ...prev, [msgIndex]: { score: correct, total: questions.length } }));
  }

  function startNewChat() {
    setMessages([]); setCurrentTopic(""); setInput(""); setUploadedFile(null); inputRef.current?.focus();
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) setUploadedFile(file);
  };

  function toggleSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in your browser.");
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      if (window.recognition) window.recognition.stop();
    } else {
      setIsRecording(true);
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      window.recognition = recognition;
      recognition.start();
    }
  }

  return (
    <div style={styles.page}>
      {/* Sidebar */}
      <div style={{ ...styles.sidebar, transform: showHistory ? "translateX(0)" : "translateX(-100%)" }}>
        <div style={styles.sidebarHeader}>
          <h3 style={styles.sidebarTitle}>📜 Chat History</h3>
          <button onClick={() => setShowHistory(false)} style={styles.sidebarClose}>✕</button>
        </div>
        <button onClick={startNewChat} style={styles.newChatSidebarBtn}>+ New Chat</button>
        <div style={styles.historyList}>
          {history.map(entry => (
            <div key={entry.id} style={styles.historyItem} onClick={() => { setMessages(entry.messages); setCurrentTopic(entry.topic); setShowHistory(false); }}>
              <span style={styles.historyTopic}>{entry.topic}</span>
              <button onClick={(e) => { e.stopPropagation(); setHistory(prev => prev.filter(h => h.id !== entry.id)); }} style={styles.historyDeleteBtn}>×</button>
            </div>
          ))}
        </div>
      </div>
      {showHistory && <div style={styles.overlay} onClick={() => setShowHistory(false)} />}

      <div style={styles.mainArea}>
        <div style={styles.topBar}>
          <div style={styles.topBarLeft}><button onClick={() => setShowHistory(true)} style={styles.menuBtn}>☰</button><h2 style={styles.topBarTitle}>📚 Learning Agent</h2></div>
          <div style={styles.topBarRight}>
            <div onClick={() => setUseDeepResearch(!useDeepResearch)} style={{ ...styles.deepToggle, background: useDeepResearch ? "linear-gradient(135deg, #667eea, #764ba2)" : "#e5e7eb" }}>
              <div style={{ ...styles.deepToggleKnob, transform: useDeepResearch ? "translateX(24px)" : "translateX(0)" }} />
            </div>
            <span style={{ ...styles.deepToggleLabel, color: useDeepResearch ? "#667eea" : "#9ca3af" }}>🧠 Deep Research</span>
            <button onClick={startNewChat} style={styles.newChatBtn}>+ New Chat</button>
          </div>
        </div>

        <div style={styles.chatArea}>
          {messages.length === 0 ? (
            <div style={styles.welcome}>
              <div style={styles.welcomeIcon}>🎓</div>
              <h2 style={styles.welcomeTitle}>What would you like to learn today?</h2>
              <p style={styles.welcomeSubtitle}>Enter any topic, ask a voice question, or upload your syllabus PDF.</p>
              <div style={styles.welcomeActions}>
                <button onClick={() => handleSend("Explain Large Language Models", false)} style={styles.startBtn}>🚀 Start Learning</button>
                <button onClick={() => handleSend("Advanced Research on Quantum Computing", true)} style={styles.startDeepBtn}>🧠 Deep Research</button>
              </div>
              <div style={styles.suggestions}>
                {["Explain CNNs", "How does Kafka work?", "Syllabus Overview"].map(s => (
                  <button key={s} style={styles.suggestionBtn} onClick={() => setInput(s)}>{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <div style={styles.messagesContainer}>
              {messages.map((msg, idx) => (
                <div key={idx} style={{ ...styles.messageRow, justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ ...styles.messageBubble, ...(msg.role === "user" ? styles.userBubble : styles.assistantBubble) }}>
                    <div style={styles.msgHeader}><span style={styles.msgRole}>{msg.role === "user" ? "🧑 You" : "🤖 AI Assistant"}</span></div>

                    {msg.meta?.type === "deep_research" && (
                      <div style={styles.metaBar}>
                        <span style={styles.metaChip}>🔄 {msg.meta.iterations} iterations</span>
                        <span style={styles.metaChip}>📚 {msg.meta.sources} sources</span>
                      </div>
                    )}

                    <div style={styles.msgContent}><ReactMarkdown>{msg.content}</ReactMarkdown></div>

                    {msg.meta?.type === "quiz" && (
                      <div style={styles.quizInThread}>
                        {msg.meta.questions.map((q, qIndex) => (
                          <div key={q.id} style={{ marginBottom: "15px" }}>
                            <p style={{ fontWeight: "700", marginBottom: "8px" }}>{qIndex + 1}. {q.question}</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {q.options.map((opt, oIdx) => (
                                <button key={oIdx} onClick={() => handleQuizAnswer(idx, q.id, oIdx)} disabled={!!quizScores[idx]}
                                  style={{ ...styles.quizOptionBtn, ...(quizResults[idx]?.[q.id] === oIdx ? styles.quizOptionSelected : {}), ...(quizScores[idx] && q.answer === oIdx ? styles.quizOptionCorrect : {}), ...(quizScores[idx] && quizResults[idx]?.[q.id] === oIdx && q.answer !== oIdx ? styles.quizOptionWrong : {}) }}>
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                        {!quizScores[idx] ? (
                          <button onClick={() => submitThreadQuiz(idx, msg.meta.questions)} style={styles.quizSubmitBtn}>Submit Quiz</button>
                        ) : (
                          <>
                            <div style={styles.scoreResult}>🎯 Final Score: {quizScores[idx].score}/{quizScores[idx].total}</div>
                            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                              <button onClick={() => handleSend("What is the next topic I should learn after this?", false)} style={styles.postQuizBtn}>🚀 Next Topic</button>
                              <button onClick={() => handleQuickAction("summary")} style={{ ...styles.postQuizBtn, background: "#f8fafc", color: "#6366f1", border: "1px solid #6366f1" }}>📝 Review Summary</button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {msg.role === "assistant" && !loading && (
                      <div style={styles.actionBar}>
                        <button onClick={() => handleQuickAction("summary")} style={styles.actionBtn}>📝 Generate Summary</button>
                        <button onClick={() => handleQuickAction("diagram")} style={styles.actionBtn}>📊 Generate Diagram</button>
                        <button onClick={() => handleQuickAction("videos")} style={styles.actionBtn}>🎥 Video Resources</button>
                        <button onClick={() => handleQuickAction("quiz")} style={styles.actionBtn}>📝 Take Quiz</button>
                      </div>
                    )}

                    {msg.role === "assistant" && !loading && idx === (messages.length - 1) && (
                      <div style={styles.nextSteps}>
                        <p style={styles.nextStepsTitle}>🚀 Master this topic further:</p>
                        <div style={styles.tabGrid}>
                          <div style={styles.tabBadge}>🧪 Labs</div>
                          <div style={styles.tabBadge}>🏗️ Projects</div>
                          <div style={styles.tabBadge}>🛠️ Tech Stack</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && <div style={styles.messageRow}><div style={{ ...styles.messageBubble, ...styles.assistantBubble }}>Thinking...</div></div>}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        <div style={styles.inputBar}>
          {uploadedFile && <div style={styles.fileLabel}>📎 {uploadedFile.name} <button onClick={() => setUploadedFile(null)}>✕</button></div>}
          <div style={styles.inputFlex}>
            <button onClick={() => fileInputRef.current.click()} style={{ ...styles.iconBtn, fontSize: "1.4rem" }}>📎</button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
            <button onClick={toggleSpeech} style={{ ...styles.iconBtn, color: isRecording ? "red" : "#6b7280" }}>{isRecording ? "🔴" : "🎙️"}</button>
            <input ref={inputRef} style={styles.chatInput} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Ask a follow-up or try a quick action..." />
            <button onClick={() => handleSend()} style={styles.circleSend}>➤</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display: "flex", height: "100vh", background: "#f8fafc", color: "#1e293b", fontFamily: "'Inter', sans-serif" },
  sidebar: { position: "fixed", left: 0, top: 0, width: "280px", height: "100vh", background: "#0f172a", color: "white", zIndex: 1000, transition: "transform 0.3s ease", padding: "20px", display: "flex", flexDirection: "column" },
  sidebarHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  sidebarTitle: { margin: 0, fontSize: "1.1rem" },
  sidebarClose: { background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "1.2rem" },
  newChatSidebarBtn: { padding: "12px", borderRadius: "10px", background: "#334155", color: "white", border: "none", cursor: "pointer", marginBottom: "20px", fontWeight: "600" },
  historyList: { flex: 1, overflowY: "auto" },
  historyItem: { padding: "10px", borderRadius: "8px", background: "#1e293b", marginBottom: "8px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" },
  historyTopic: { fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  historyDeleteBtn: { background: "none", border: "none", color: "#94a3b8", cursor: "pointer" },
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", zIndex: 900 },
  mainArea: { flex: 1, display: "flex", flexDirection: "column", position: "relative", width: "100%" },
  topBar: { padding: "12px 24px", background: "white", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" },
  topBarLeft: { display: "flex", alignItems: "center", gap: "10px" },
  menuBtn: { background: "white", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "6px 12px", cursor: "pointer" },
  topBarTitle: { margin: 0, fontSize: "1.2rem", fontWeight: "800" },
  topBarRight: { display: "flex", alignItems: "center", gap: "16px" },
  deepToggle: { width: "48px", height: "24px", borderRadius: "12px", cursor: "pointer", position: "relative" },
  deepToggleKnob: { position: "absolute", top: "2px", left: "2px", width: "20px", height: "20px", borderRadius: "50%", background: "white", transition: "transform 0.2s ease" },
  deepToggleLabel: { fontSize: "0.9rem", fontWeight: "700" },
  newChatBtn: { padding: "8px 16px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", border: "none", cursor: "pointer", fontWeight: "600" },
  chatArea: { flex: 1, overflowY: "auto", padding: "24px" },
  welcome: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", color: "#475569" },
  welcomeIcon: { fontSize: "4rem", marginBottom: "20px" },
  welcomeTitle: { fontSize: "2rem", fontWeight: "800", marginBottom: "12px", color: "#1e293b" },
  welcomeSubtitle: { fontSize: "1.1rem", marginBottom: "32px", maxWidth: "500px" },
  welcomeActions: { display: "flex", gap: "16px", marginBottom: "40px" },
  startBtn: { padding: "14px 28px", borderRadius: "14px", background: "#10b981", color: "white", border: "none", fontWeight: "700", cursor: "pointer" },
  startDeepBtn: { padding: "14px 28px", borderRadius: "14px", background: "#6366f1", color: "white", border: "none", fontWeight: "700", cursor: "pointer" },
  suggestions: { display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" },
  suggestionBtn: { padding: "10px 20px", borderRadius: "12px", background: "white", border: "1px solid #e2e8f0", cursor: "pointer", fontSize: "0.9rem", color: "#64748b" },
  messagesContainer: { display: "flex", flexDirection: "column", gap: "24px", maxWidth: "850px", margin: "0 auto" },
  messageRow: { display: "flex", width: "100%" },
  messageBubble: { maxWidth: "85%", padding: "18px 22px", borderRadius: "20px", position: "relative", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" },
  userBubble: { background: "#4f46e5", color: "white", borderBottomRightRadius: "4px" },
  assistantBubble: { background: "white", color: "#1e293b", border: "1px solid #e2e8f0", borderBottomLeftRadius: "4px" },
  msgHeader: { marginBottom: "8px" },
  msgRole: { fontSize: "0.8rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em" },
  msgContent: { fontSize: "1rem", lineHeight: "1.6" },
  metaBar: { display: "flex", gap: "10px", marginBottom: "12px" },
  metaChip: { padding: "4px 10px", background: "#eef2ff", borderRadius: "8px", fontSize: "0.75rem", color: "#4f46e5", fontWeight: "700" },
  actionBar: { display: "flex", gap: "10px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #f1f5f9", flexWrap: "wrap" },
  actionBtn: { padding: "8px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600", color: "#475569" },
  nextSteps: { marginTop: "20px", padding: "16px", background: "#f8fafc", borderRadius: "16px", border: "1px dashed #cbd5e1" },
  nextStepsTitle: { margin: "0 0 12px", fontSize: "0.9rem", fontWeight: "800", color: "#1e293b" },
  tabGrid: { display: "flex", gap: "10px", flexWrap: "wrap" },
  tabBadge: { padding: "6px 16px", background: "white", border: "1px solid #e2e8f0", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "700", color: "#64748b" },
  quizInThread: { background: "#eff6ff", padding: "20px", borderRadius: "18px", marginTop: "16px", border: "1px solid #dbeafe" },
  quizOptionBtn: { padding: "10px 14px", borderRadius: "10px", background: "white", border: "1px solid #dbeafe", textAlign: "left", cursor: "pointer", fontSize: "0.95rem", color: "#1e293b" },
  quizOptionSelected: { borderColor: "#4f46e5", background: "#f5f3ff" },
  quizOptionCorrect: { background: "#dcfce7", borderColor: "#22c55e", color: "#166534" },
  quizOptionWrong: { background: "#fee2e2", borderColor: "#ef4444", color: "#991b1b" },
  quizSubmitBtn: { width: "100%", padding: "12px", background: "#4f46e5", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "700", marginTop: "10px" },
  scoreResult: { textAlign: "center", fontSize: "1.1rem", fontWeight: "800", color: "#1e40af", padding: "10px" },
  postQuizBtn: { flex: 1, padding: "10px", borderRadius: "10px", background: "#4f46e5", color: "white", border: "none", cursor: "pointer", fontWeight: "700", fontSize: "0.85rem", transition: "all 0.2s" },
  inputBar: { padding: "20px 24px", background: "white", borderTop: "1px solid #e2e8f0" },
  fileLabel: { display: "flex", alignItems: "center", gap: "10px", background: "#f1f5f9", padding: "6px 12px", borderRadius: "10px", marginBottom: "12px", width: "fit-content", fontSize: "0.85rem", fontWeight: "600" },
  inputFlex: { display: "flex", gap: "12px", alignItems: "center", maxWidth: "900px", margin: "0 auto" },
  iconBtn: { background: "none", border: "none", fontSize: "1.8rem", cursor: "pointer", outline: "none", color: "#64748b" },
  chatInput: { flex: 1, padding: "14px 20px", borderRadius: "15px", border: "2px solid #e2e8f0", fontSize: "1rem", outline: "none", transition: "border-color 0.2s" },
  circleSend: { width: "48px", height: "48px", borderRadius: "50%", background: "#4f46e5", color: "white", border: "none", fontSize: "1.5rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }
};