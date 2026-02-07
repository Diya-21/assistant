import { useState } from "react";
import PageContainer from "../components/PageContainer";
import { learnTopic } from "../api/backend";

export default function LearningAgent() {
  const [topic, setTopic] = useState("");
  const [stages, setStages] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAsk(stage) {
    if (!topic.trim()) {
      setError("Please enter a topic");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const data = await learnTopic(topic, stage);
      
      if (data.content && data.content.includes("⚠️")) {
        setError(data.content);
      } else {
        setStages(prev => [...prev, data]);
        setScore(null);
        setQuizAnswers({});
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to connect to backend. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  }

  function submitQuiz() {
    const quizStage = stages.find(s => s.stage === "QUIZ");
    if (!quizStage?.questions) return;

    let correct = 0;
    quizStage.questions.forEach((q) => {
      if (quizAnswers[q.id] === q.answer) {
        correct++;
      }
    });

    const percent = Math.round((correct / quizStage.questions.length) * 100);
    setScore({ correct, total: quizStage.questions.length, percent });
  }

  function resetAgent() {
    setTopic("");
    setStages([]);
    setQuizAnswers({});
    setScore(null);
    setError("");
  }

  const quizStage = stages.find(s => s.stage === "QUIZ");

  return (
    <PageContainer title="📘 Learning Agent" subtitle="Step-by-step learning from your syllabus">
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        
        {/* Error Display */}
        {error && (
          <div style={{
            padding: "1rem",
            marginBottom: "1rem",
            backgroundColor: "#fee",
            border: "1px solid #fcc",
            borderRadius: "8px",
            color: "#c33"
          }}>
            <strong>⚠️ Error:</strong>
            <pre style={{ whiteSpace: "pre-wrap", marginTop: "0.5rem" }}>{error}</pre>
          </div>
        )}

        {/* Input Section */}
        {stages.length === 0 && (
          <div className="card" style={{ padding: "2rem", marginBottom: "1rem" }}>
            <h3 style={{ marginBottom: "1rem" }}>What do you want to learn?</h3>
            <input
              style={{
                width: "100%",
                padding: "0.75rem",
                fontSize: "1rem",
                borderRadius: "6px",
                border: "2px solid #ddd",
                marginBottom: "1rem"
              }}
              placeholder="e.g. Big Data Analytics, Machine Learning, RNN, LSTM"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !loading && handleAsk("explain")}
              disabled={loading}
            />
            <button 
              onClick={() => handleAsk("explain")} 
              disabled={loading || !topic.trim()}
              style={{
                padding: "0.75rem 2rem",
                fontSize: "1rem",
                cursor: (loading || !topic.trim()) ? "not-allowed" : "pointer",
                opacity: (loading || !topic.trim()) ? 0.6 : 1
              }}
            >
              {loading ? "⏳ Loading..." : "📚 Start Learning"}
            </button>
          </div>
        )}

        {/* Topic Header */}
        {stages.length > 0 && (
          <div style={{
            padding: "1rem 1.5rem",
            marginBottom: "1.5rem",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
          }}>
            <h2 style={{ margin: 0, color: "white", fontSize: "1.5rem" }}>📖 Learning: {topic}</h2>
            <button 
              onClick={resetAgent} 
              style={{ 
                padding: "0.5rem 1.25rem",
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "white",
                border: "2px solid rgba(255,255,255,0.3)",
                borderRadius: "20px",
                cursor: "pointer",
                fontWeight: "600",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "rgba(255,255,255,0.3)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "rgba(255,255,255,0.2)";
              }}
            >
              🔄 New Topic
            </button>
          </div>
        )}

        {/* Render All Stages */}
        {stages.map((stage, idx) => {
          if (stage.stage === "QUIZ") return null;

          return (
            <div key={idx} className="card" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
              <h3 style={{ marginBottom: "1rem", color: "#667eea" }}>
                {stage.stage === "EXPLAIN" && "📘 Simple Explanation"}
                {stage.stage === "DEEP" && "🔬 Deep Explanation"}
                {stage.stage === "REFERENCES" && "📺 Learning Resources"}
              </h3>
              
              <pre style={{
                whiteSpace: "pre-wrap",
                lineHeight: "1.6",
                maxHeight: "500px",
                overflowY: "auto",
                padding: "1rem",
                backgroundColor: "#f9f9f9",
                borderRadius: "6px",
                fontFamily: "inherit",
                marginBottom: 0
              }}>
                {stage.content}
              </pre>
            </div>
          );
        })}

        {/* Action Buttons */}
        {stages.length > 0 && !quizStage && (
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h4 style={{ marginBottom: "1rem" }}>What would you like to do next?</h4>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {!stages.find(s => s.stage === "DEEP") && (
                <button onClick={() => handleAsk("deep")} disabled={loading}>
                  🔍 Explain Deeper
                </button>
              )}
              {!stages.find(s => s.stage === "REFERENCES") && (
                <button onClick={() => handleAsk("references")} disabled={loading}>
                  📺 Get References
                </button>
              )}
              <button onClick={() => handleAsk("quiz")} disabled={loading}>
                🧠 Take Quiz
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{
            padding: "2rem",
            textAlign: "center",
            backgroundColor: "#f0f8ff",
            borderRadius: "8px",
            margin: "1rem 0"
          }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>
            <p>AI is thinking... This may take up to 30 seconds.</p>
          </div>
        )}

        {/* ✨ BEAUTIFUL QUIZ UI ✨ */}
        {quizStage?.questions && (
          <div style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "16px",
            padding: "2.5rem",
            marginBottom: "1rem",
            boxShadow: "0 10px 40px rgba(102, 126, 234, 0.4)"
          }}>
            {/* Quiz Header */}
            <div style={{
              textAlign: "center",
              marginBottom: "2.5rem"
            }}>
              <div style={{
                display: "inline-block",
                backgroundColor: "rgba(255,255,255,0.2)",
                padding: "0.5rem 1.5rem",
                borderRadius: "25px",
                marginBottom: "1rem"
              }}>
                <span style={{ color: "white", fontSize: "0.9rem", fontWeight: "600" }}>
                  📝 KNOWLEDGE CHECK
                </span>
              </div>
              <h2 style={{
                fontSize: "2rem",
                margin: "0 0 0.5rem 0",
                fontWeight: "700",
                color: "white"
              }}>
                Test Your Understanding
              </h2>
              <p style={{
                fontSize: "1rem",
                opacity: 0.9,
                margin: 0,
                color: "white"
              }}>
                {quizStage.questions.length} questions about {topic}
              </p>
            </div>

            {/* Questions */}
            {quizStage.questions.map((q, idx) => {
              const showResult = score !== null;
              const userAnswer = quizAnswers[q.id];
              const isCorrect = userAnswer === q.answer;
              
              return (
                <div 
                  key={q.id || idx}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    padding: "2rem",
                    marginBottom: idx === quizStage.questions.length - 1 ? "2rem" : "1.5rem",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.07)"
                  }}
                >
                  {/* Question Header */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "1.25rem",
                    gap: "1rem"
                  }}>
                    {/* Question Number Circle */}
                    <div style={{
                      minWidth: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: showResult && isCorrect ? "linear-gradient(135deg, #10b981, #059669)" :
                                  showResult && !isCorrect && userAnswer !== undefined ? "linear-gradient(135deg, #ef4444, #dc2626)" :
                                  "linear-gradient(135deg, #667eea, #764ba2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "700",
                      fontSize: "1.25rem",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
                    }}>
                      {showResult && isCorrect ? "✓" : 
                       showResult && !isCorrect && userAnswer !== undefined ? "✗" : 
                       idx + 1}
                    </div>

                    {/* Question Text */}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        color: "#9ca3af",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        marginBottom: "0.25rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}>
                        Question {idx + 1} of {quizStage.questions.length}
                      </div>
                      <h4 style={{
                        fontSize: "1.15rem",
                        margin: 0,
                        color: "#1f2937",
                        lineHeight: "1.5",
                        fontWeight: "600"
                      }}>
                        {q.question}
                      </h4>
                    </div>
                  </div>

                  {/* Options Grid */}
                  <div style={{ 
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: "0.75rem"
                  }}>
                    {q.options.map((opt, optIdx) => {
                      const isSelected = quizAnswers[q.id] === optIdx;
                      const isCorrectOption = q.answer === optIdx;
                      const showCorrect = showResult && isCorrectOption;
                      const showWrong = showResult && isSelected && !isCorrectOption;
                      const optionLetter = String.fromCharCode(65 + optIdx);

                      return (
                        <button
                          key={optIdx}
                          onClick={() => !showResult && setQuizAnswers({ ...quizAnswers, [q.id]: optIdx })}
                          disabled={showResult}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "1rem 1.25rem",
                            borderRadius: "10px",
                            cursor: showResult ? "default" : "pointer",
                            backgroundColor: 
                              showCorrect ? "#d1fae5" :
                              showWrong ? "#fee2e2" :
                              isSelected ? "#e0e7ff" : "#f9fafb",
                            border: `2.5px solid ${
                              showCorrect ? "#10b981" :
                              showWrong ? "#ef4444" :
                              isSelected ? "#667eea" : "#e5e7eb"
                            }`,
                            transition: "all 0.2s ease",
                            transform: isSelected && !showResult ? "translateX(4px)" : "none",
                            textAlign: "left",
                            width: "100%",
                            position: "relative"
                          }}
                        >
                          {/* Option Letter Badge */}
                          <div style={{
                            minWidth: "40px",
                            height: "40px",
                            borderRadius: "8px",
                            backgroundColor: 
                              showCorrect ? "#10b981" :
                              showWrong ? "#ef4444" :
                              isSelected ? "#667eea" : "#e5e7eb",
                            color: (isSelected || showCorrect || showWrong) ? "white" : "#6b7280",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "700",
                            fontSize: "1rem",
                            marginRight: "1rem",
                            transition: "all 0.2s ease",
                            flexShrink: 0
                          }}>
                            {optionLetter}
                          </div>

                          {/* Option Text */}
                          <span style={{
                            flex: 1,
                            color: "#374151",
                            fontSize: "1rem",
                            lineHeight: "1.5",
                            fontWeight: isSelected ? "600" : "400"
                          }}>
                            {opt}
                          </span>

                          {/* Check/Cross Icon */}
                          {(showCorrect || showWrong) && (
                            <div style={{
                              marginLeft: "1rem",
                              fontSize: "1.5rem",
                              flexShrink: 0
                            }}>
                              {showCorrect ? "✓" : "✗"}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Submit/Results Section */}
            {!score ? (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1rem"
              }}>
                {/* Progress Bar */}
                <div style={{
                  width: "100%",
                  maxWidth: "400px",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: "25px",
                  padding: "0.5rem",
                  marginBottom: "0.5rem"
                }}>
                  <div style={{
                    width: `${(Object.keys(quizAnswers).length / quizStage.questions.length) * 100}%`,
                    height: "8px",
                    backgroundColor: "white",
                    borderRadius: "25px",
                    transition: "width 0.3s ease"
                  }} />
                </div>

                {/* Progress Text */}
                <div style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "25px",
                  color: "white",
                  fontSize: "0.95rem",
                  fontWeight: "600"
                }}>
                  {Object.keys(quizAnswers).length} / {quizStage.questions.length} answered
                </div>

                {/* Submit Button */}
                <button
                  onClick={submitQuiz}
                  disabled={Object.keys(quizAnswers).length !== quizStage.questions.length}
                  style={{
                    padding: "1rem 3rem",
                    fontSize: "1.15rem",
                    fontWeight: "700",
                    backgroundColor: Object.keys(quizAnswers).length === quizStage.questions.length ? "white" : "rgba(255,255,255,0.3)",
                    color: Object.keys(quizAnswers).length === quizStage.questions.length ? "#667eea" : "rgba(255,255,255,0.6)",
                    border: "none",
                    borderRadius: "30px",
                    cursor: Object.keys(quizAnswers).length === quizStage.questions.length ? "pointer" : "not-allowed",
                    boxShadow: Object.keys(quizAnswers).length === quizStage.questions.length ? "0 4px 15px rgba(0,0,0,0.2)" : "none",
                    transition: "all 0.3s ease",
                    transform: "scale(1)"
                  }}
                  onMouseEnter={(e) => {
                    if (Object.keys(quizAnswers).length === quizStage.questions.length) {
                      e.target.style.transform = "scale(1.05)";
                      e.target.style.boxShadow = "0 6px 20px rgba(0,0,0,0.3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "scale(1)";
                    e.target.style.boxShadow = Object.keys(quizAnswers).length === quizStage.questions.length ? "0 4px 15px rgba(0,0,0,0.2)" : "none";
                  }}
                >
                  Submit Quiz →
                </button>
              </div>
            ) : (
              <div>
                {/* Score Card */}
                <div style={{
                  backgroundColor: "white",
                  borderRadius: "16px",
                  padding: "3rem 2rem",
                  textAlign: "center",
                  marginBottom: "1.5rem",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.07)"
                }}>
                  {/* Score Circle */}
                  <div style={{
                    width: "140px",
                    height: "140px",
                    margin: "0 auto 1.5rem",
                    borderRadius: "50%",
                    background: score.percent >= 80 ? "linear-gradient(135deg, #10b981, #059669)" :
                                score.percent >= 60 ? "linear-gradient(135deg, #f59e0b, #d97706)" :
                                "linear-gradient(135deg, #ef4444, #dc2626)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                    color: "white"
                  }}>
                    <div style={{ fontSize: "3rem", fontWeight: "800" }}>
                      {score.percent}%
                    </div>
                    <div style={{ fontSize: "0.85rem", opacity: 0.9, fontWeight: "600" }}>
                      SCORE
                    </div>
                  </div>

                  {/* Result Message */}
                  <h3 style={{
                    fontSize: "1.75rem",
                    fontWeight: "700",
                    color: "#1f2937",
                    margin: "0 0 0.5rem 0"
                  }}>
                    {score.percent === 100 && "Perfect Score! 🎉"}
                    {score.percent >= 80 && score.percent < 100 && "Great Job! 🌟"}
                    {score.percent >= 60 && score.percent < 80 && "Good Effort! 👍"}
                    {score.percent < 60 && "Keep Learning! 📚"}
                  </h3>

                  <p style={{
                    fontSize: "1.15rem",
                    color: "#6b7280",
                    margin: "0 0 1rem 0"
                  }}>
                    You got <strong style={{ color: "#667eea" }}>{score.correct}</strong> out of <strong>{score.total}</strong> correct
                  </p>

                  <p style={{
                    fontSize: "1rem",
                    color: "#9ca3af",
                    margin: 0,
                    lineHeight: "1.6"
                  }}>
                    {score.percent === 100 && "Outstanding! You've mastered this topic completely!"}
                    {score.percent >= 80 && score.percent < 100 && "You have a strong understanding of this material!"}
                    {score.percent >= 60 && score.percent < 80 && "Review the explanations above and try again!"}
                    {score.percent < 60 && "Don't worry! Review the material and take the quiz again."}
                  </p>
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "center",
                  flexWrap: "wrap"
                }}>
                  <button
                    onClick={() => {
                      setStages(stages.filter(s => s.stage !== "QUIZ"));
                      setQuizAnswers({});
                      setScore(null);
                      handleAsk("quiz");
                    }}
                    style={{
                      padding: "1rem 2rem",
                      fontSize: "1rem",
                      fontWeight: "600",
                      backgroundColor: "white",
                      color: "#667eea",
                      border: "none",
                      borderRadius: "25px",
                      cursor: "pointer",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow = "0 6px 12px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
                    }}
                  >
                    🔄 Retake Quiz
                  </button>
                  <button
                    onClick={resetAgent}
                    style={{
                      padding: "1rem 2rem",
                      fontSize: "1rem",
                      fontWeight: "600",
                      backgroundColor: "white",
                      color: "#667eea",
                      border: "none",
                      borderRadius: "25px",
                      cursor: "pointer",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow = "0 6px 12px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
                    }}
                  >
                    📚 New Topic
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}