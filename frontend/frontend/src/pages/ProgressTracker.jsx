import { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { getProgress, getAnalytics, getRecommendations, getPerformance } from "../api/backend";

export default function ProgressTracker() {
  const { student } = useAppContext();
  const [progress, setProgress] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [progressData, recsData, analyticsData, performanceData] = await Promise.all([
        getProgress(),
        getRecommendations(),
        getAnalytics(),
        getPerformance()
      ]);
      setProgress(progressData);
      setRecommendations(recsData.recommendations || []);
      setAnalytics(analyticsData);
      setPerformance(performanceData);
    } catch (error) {
      console.error("Error loading progress:", error);
    } finally {
      setLoading(false);
    }
  }

  const topicsCount = progress?.summary?.total_topics || 0;
  const quizzesCount = progress?.quizzes_taken || 0;
  const avgScore = progress?.average_score || 0;
  const streakDays = progress?.streak_days || 0;
  const masteredCount = progress?.summary?.mastered_topics || 0;
  const topics = progress?.topics || {};
  const weakTopics = progress?.summary?.weak_topics || [];
  const totalActivities = progress?.total_activities || 0;

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>📊 Student Progress Dashboard</h1>
          <p style={styles.headerSubtitle}>Tracking your learning journey</p>
        </div>
        <div style={styles.content}>
          <div style={styles.loadingBox}>
            <div style={styles.loadingSpinner}></div>
            <p>Loading your progress data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.headerTitle}>📊 Student Progress Dashboard</h1>
            <p style={styles.headerSubtitle}>
              {student?.name} • {student?.rollNo} • {totalActivities > 0
                ? `${totalActivities} activities tracked`
                : "No activities yet — start learning!"
              }
            </p>
          </div>
          <div style={styles.headerStats}>
            <div style={styles.headerStatItem}>
              <span style={styles.headerStatValue}>{topicsCount}</span>
              <span style={styles.headerStatLabel}>Topics</span>
            </div>
            <div style={styles.headerStatDivider}></div>
            <div style={styles.headerStatItem}>
              <span style={styles.headerStatValue}>{quizzesCount}</span>
              <span style={styles.headerStatLabel}>Quizzes</span>
            </div>
            <div style={styles.headerStatDivider}></div>
            <div style={styles.headerStatItem}>
              <span style={styles.headerStatValue}>{avgScore}%</span>
              <span style={styles.headerStatLabel}>Avg Score</span>
            </div>
            <div style={styles.headerStatDivider}></div>
            <div style={styles.headerStatItem}>
              <span style={styles.headerStatValue}>{streakDays}</span>
              <span style={styles.headerStatLabel}>Streak</span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <StatCard icon="📚" value={topicsCount} label="Topics Studied" color="#667eea" detail={`${masteredCount} mastered`} />
          <StatCard icon="🧠" value={quizzesCount} label="Quizzes Taken" color="#f59e0b" detail="Keep practicing!" />
          <StatCard icon="📊" value={`${avgScore}%`} label="Average Score" color="#10b981" detail={avgScore >= 80 ? "Excellent!" : avgScore >= 60 ? "Good progress" : "Room to grow"} />
          <StatCard icon="⏱️" value={`${(totalActivities * 5) || 0}m`} label="Est. Study Time" color="#8b5cf6" detail="Based on activities" />
          <StatCard icon="🔥" value={streakDays} label="Day Streak" color="#ef4444" detail="Learn daily!" />
        </div>

        {/* Tabs */}
        <div style={styles.tabsContainer}>
          <div style={styles.tabs}>
            {[
              { id: "overview", icon: "📈", label: "Overview" },
              { id: "subjects", icon: "📚", label: "Subject Tracker" },
              { id: "attention", icon: "⚠️", label: "Needs Attention" },
              { id: "performance", icon: "🎯", label: "AI Analysis" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab.id ? styles.tabActive : {}),
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div style={styles.tabContent}>
          {activeTab === "overview" && (
            <OverviewTab
              progress={progress}
              recommendations={recommendations}
              analytics={analytics}
              topics={topics}
            />
          )}
          {activeTab === "subjects" && (
            <SubjectsTab topics={topics} />
          )}
          {activeTab === "attention" && (
            <AttentionTab
              weakTopics={weakTopics}
              performance={performance}
              topics={topics}
            />
          )}
          {activeTab === "performance" && (
            <PerformanceTab performance={performance} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────── Stat Card ─────────── */
function StatCard({ icon, value, label, color, detail }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIconBg, background: `${color}15` }}>
        <span style={{ fontSize: "1.5rem" }}>{icon}</span>
      </div>
      <div style={{ ...styles.statValue, color }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
      {detail && <div style={styles.statDetail}>{detail}</div>}
    </div>
  );
}

/* ─────────── Overview Tab ─────────── */
function OverviewTab({ progress, recommendations, analytics, topics }) {
  const topicEntries = Object.entries(topics);

  return (
    <div style={styles.overviewGrid}>
      {/* Left Column */}
      <div style={styles.overviewLeft}>
        {/* Mastery Distribution */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📈 Mastery Distribution</h3>
          {topicEntries.length > 0 ? (
            <MasteryChart data={analytics?.mastery_distribution} />
          ) : (
            <div style={styles.zeroState}>
              <span style={{ fontSize: "2rem" }}>📊</span>
              <p>Study topics to see your mastery distribution here. Your progress will be tracked automatically as you learn.</p>
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>💡 AI Recommendations</h3>
          {recommendations.length > 0 ? (
            <div style={styles.recList}>
              {recommendations.map((rec, i) => (
                <div key={i} style={styles.recItem}>
                  <div style={styles.recNumber}>{i + 1}</div>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.zeroState}>
              <span style={{ fontSize: "2rem" }}>💡</span>
              <p>Keep studying to get personalized AI recommendations based on your learning patterns.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column */}
      <div style={styles.overviewRight}>
        {/* Recent Topics */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🕐 Recent Topics</h3>
          {topicEntries.length > 0 ? (
            <div style={styles.recentList}>
              {topicEntries.slice(0, 6).map(([name, data]) => (
                <div key={name} style={styles.recentItem}>
                  <div style={styles.recentInfo}>
                    <span style={styles.recentName}>{name}</span>
                    <MasteryBadge level={data.mastery_level} small />
                  </div>
                  <div style={styles.recentBar}>
                    <div style={{
                      ...styles.recentProgress,
                      width: `${data.mastery_level}%`,
                      background: data.mastery_level >= 75 ? "#10b981" : data.mastery_level >= 50 ? "#f59e0b" : "#667eea",
                    }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.zeroState}>
              <span style={{ fontSize: "2rem" }}>📚</span>
              <p>Topics you study will appear here with mastery levels. Go to Theory or Lab to start!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

/* ─────────── Subjects Tab (Topic-wise details) ─────────── */
function SubjectsTab({ topics }) {
  const topicArray = Object.entries(topics);

  if (topicArray.length === 0) {
    return (
      <div style={styles.zeroStateCard}>
        <span style={{ fontSize: "3rem" }}>📚</span>
        <h3>No Topics Tracked Yet</h3>
        <p style={{ color: "#6b7280", maxWidth: "400px", margin: "0 auto" }}>
          As you study topics through the Theory page, Lab page, or take quizzes, each subject will be tracked here
          with detailed statistics including mastery level, quiz scores, and study activities.
        </p>
        <div style={styles.zeroFeatures}>
          <div style={styles.zeroFeature}><span>📊</span> Mastery tracking per topic</div>
          <div style={styles.zeroFeature}><span>📈</span> Quiz score history</div>
          <div style={styles.zeroFeature}><span>🎯</span> Activity breakdowns</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.topicsGrid}>
      {topicArray.map(([name, data]) => (
        <div key={name} style={styles.topicCard}>
          <div style={styles.topicHeader}>
            <h3 style={styles.topicName}>{name}</h3>
            <MasteryBadge level={data.mastery_level} />
          </div>

          {/* Progress Ring */}
          <div style={styles.progressRing}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="35" fill="none" stroke="#e5e7eb" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="35" fill="none"
                stroke={data.mastery_level >= 75 ? "#10b981" : data.mastery_level >= 50 ? "#f59e0b" : "#667eea"}
                strokeWidth="6"
                strokeDasharray={`${(data.mastery_level / 100) * 220} 220`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
              />
            </svg>
            <span style={styles.progressText}>{data.mastery_level}%</span>
          </div>

          {/* Activity Badges */}
          <div style={styles.activityBadges}>
            <ActivityBadge icon="📖" active={data.explained} label="Explained" />
            <ActivityBadge icon="🔬" active={data.deep_explained} label="Deep" />
            <ActivityBadge icon="🧠" active={data.quizzes?.length > 0} label={`${data.quizzes?.length || 0} Quiz`} />
          </div>

          {/* Quiz History */}
          {data.quizzes?.length > 0 && (
            <div style={styles.quizHistory}>
              <span style={styles.quizLabel}>Quiz Scores:</span>
              <div style={styles.quizScores}>
                {data.quizzes.slice(-5).map((q, i) => (
                  <span key={i} style={{
                    ...styles.quizScore,
                    background: q.percentage >= 80 ? "#d1fae5" : q.percentage >= 60 ? "#fef3c7" : "#fee2e2",
                    color: q.percentage >= 80 ? "#065f46" : q.percentage >= 60 ? "#92400e" : "#991b1b",
                  }}>
                    {q.percentage}%
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={styles.topicFooter}>
            <span style={styles.lastStudied}>
              Last: {new Date(data.last_studied || data.first_studied).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────── Attention Tab (Weak areas, focus topics) ─────────── */
function AttentionTab({ weakTopics, performance, topics }) {
  const topicEntries = Object.entries(topics);
  const lowMasteryTopics = topicEntries.filter(([, d]) => d.mastery_level < 50);
  const focusAreas = performance?.focus_areas || [];

  return (
    <div style={styles.attentionGrid}>
      {/* Score Alert */}
      <div style={{ ...styles.attentionCard, borderTop: "4px solid #ef4444" }}>
        <h3 style={styles.cardTitle}>📉 Low Scoring Topics</h3>
        {weakTopics.length > 0 ? (
          <div style={styles.attentionList}>
            {weakTopics.map((t, i) => (
              <div key={i} style={styles.attentionItem}>
                <div style={styles.attentionInfo}>
                  <span style={styles.attentionBullet}>⚠️</span>
                  <span style={styles.attentionName}>{t.topic}</span>
                </div>
                <div style={styles.attentionScore}>
                  <div style={styles.attentionBar}>
                    <div style={{ ...styles.attentionBarFill, width: `${t.average_score}%`, background: "#ef4444" }} />
                  </div>
                  <span style={{ color: "#ef4444", fontWeight: "700", minWidth: "40px" }}>{t.average_score}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.zeroState}>
            <span style={{ fontSize: "2rem" }}>👍</span>
            <p>{topicEntries.length > 0 ? "No weak topics detected! Keep it up." : "Take quizzes to track weak topics."}</p>
          </div>
        )}
      </div>

      {/* Low Mastery */}
      <div style={{ ...styles.attentionCard, borderTop: "4px solid #f59e0b" }}>
        <h3 style={styles.cardTitle}>🔻 Low Mastery Topics</h3>
        {lowMasteryTopics.length > 0 ? (
          <div style={styles.attentionList}>
            {lowMasteryTopics.map(([name, data]) => (
              <div key={name} style={styles.attentionItem}>
                <div style={styles.attentionInfo}>
                  <span style={styles.attentionBullet}>📖</span>
                  <span style={styles.attentionName}>{name}</span>
                </div>
                <div style={styles.attentionScore}>
                  <div style={styles.attentionBar}>
                    <div style={{ ...styles.attentionBarFill, width: `${data.mastery_level}%`, background: "#f59e0b" }} />
                  </div>
                  <span style={{ color: "#f59e0b", fontWeight: "700", minWidth: "40px" }}>{data.mastery_level}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.zeroState}>
            <span style={{ fontSize: "2rem" }}>✅</span>
            <p>{topicEntries.length > 0 ? "All topics above 50% mastery!" : "Study topics to track mastery levels."}</p>
          </div>
        )}
      </div>

      {/* AI Focus Areas */}
      <div style={{ ...styles.attentionCard, borderTop: "4px solid #667eea", gridColumn: "1 / -1" }}>
        <h3 style={styles.cardTitle}>🎯 AI-Suggested Focus Areas</h3>
        {focusAreas.length > 0 ? (
          <div style={styles.focusList}>
            {focusAreas.map((area, i) => (
              <div key={i} style={{
                ...styles.focusItem,
                borderLeft: `4px solid ${area.priority === "high" ? "#ef4444" : "#f59e0b"}`
              }}>
                <div style={styles.focusHeader}>
                  <span style={styles.focusTopic}>{area.topic}</span>
                  <span style={{
                    ...styles.priorityBadge,
                    background: area.priority === "high" ? "#fee2e2" : "#fef3c7",
                    color: area.priority === "high" ? "#dc2626" : "#d97706"
                  }}>
                    {area.priority.toUpperCase()}
                  </span>
                </div>
                <p style={styles.focusReason}>{area.reason}</p>
                <p style={styles.focusAction}>👉 {area.suggested_action}</p>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.zeroState}>
            <span style={{ fontSize: "2rem" }}>🤖</span>
            <p>The AI will analyze your performance patterns and suggest specific areas to focus on. Keep studying and taking quizzes to get personalized recommendations.</p>
          </div>
        )}
      </div>
    </div>
  );
}


/* ─────────── Performance Tab (AI Analysis) ─────────── */
function PerformanceTab({ performance }) {
  if (!performance || performance.status === "insufficient_data") {
    return (
      <div style={styles.zeroStateCard}>
        <div style={{ fontSize: "3rem" }}>📊</div>
        <h3>AI Performance Analysis</h3>
        <p style={{ color: "#6b7280", maxWidth: "500px", margin: "0 auto" }}>
          {performance?.message || "Study more topics and take quizzes to unlock AI-powered performance predictions, learning style analysis, and grade predictions."}
        </p>
        <div style={styles.zeroFeatures}>
          <div style={styles.zeroFeature}><span>🎯</span> Readiness Score</div>
          <div style={styles.zeroFeature}><span>📈</span> Grade Prediction</div>
          <div style={styles.zeroFeature}><span>🧠</span> Learning Style</div>
          <div style={styles.zeroFeature}><span>💪</span> Strong Topics</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.performanceGrid}>
      {/* Readiness */}
      <div style={styles.perfCard}>
        <h3 style={styles.cardTitle}>🎯 Overall Readiness</h3>
        <div style={styles.readinessCircle}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle cx="60" cy="60" r="54" fill="none"
              stroke={performance.predictions?.overall_readiness >= 70 ? "#10b981" : performance.predictions?.overall_readiness >= 50 ? "#f59e0b" : "#ef4444"}
              strokeWidth="8"
              strokeDasharray={`${(performance.predictions?.overall_readiness / 100) * 339} 339`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div style={styles.readinessText}>
            <span style={styles.readinessValue}>{performance.predictions?.overall_readiness || 0}%</span>
            <span style={styles.readinessLabel}>Ready</span>
          </div>
        </div>
        <div style={styles.perfDetails}>
          <div style={styles.perfRow}><span>Level:</span> <strong>{performance.predictions?.readiness_level}</strong></div>
          <div style={styles.perfRow}><span>Grade Prediction:</span> <strong style={{ color: "#667eea" }}>{performance.predictions?.exam_prediction?.grade_prediction}</strong></div>
          <div style={styles.perfRow}><span>Learning Style:</span> <strong>{performance.predictions?.learning_style}</strong></div>
        </div>
      </div>

      {/* Strong Topics */}
      <div style={styles.perfCard}>
        <h3 style={styles.cardTitle}>💪 Strong Topics</h3>
        {performance.strong_topics?.length > 0 ? (
          performance.strong_topics.map((t, i) => (
            <div key={i} style={styles.perfTopicRow}>
              <span>#{i + 1} {t.name}</span>
              <span style={{ color: "#10b981", fontWeight: "700" }}>{t.score}%</span>
            </div>
          ))
        ) : <p style={{ color: "#9ca3af" }}>Keep studying to identify strong areas.</p>}
      </div>

      {/* Weak Topics */}
      <div style={styles.perfCard}>
        <h3 style={styles.cardTitle}>⚠️ Weak Topics</h3>
        {performance.weak_topics?.length > 0 ? (
          performance.weak_topics.map((t, i) => (
            <div key={i} style={styles.perfTopicRow}>
              <span>⚠ {t.name}</span>
              <span style={{ color: "#ef4444", fontWeight: "700" }}>{t.score}%</span>
            </div>
          ))
        ) : <p style={{ color: "#9ca3af" }}>🎉 No weak areas detected!</p>}
      </div>

      {/* Improvement Potential */}
      <div style={styles.perfCard}>
        <h3 style={styles.cardTitle}>📈 Improvement Potential</h3>
        <div style={styles.improvementRow}>
          <div style={styles.improvementStat}>
            <span style={styles.improvementValue}>{performance.predictions?.improvement_potential?.current_average || 0}%</span>
            <span style={styles.improvementLabel}>Current Avg</span>
          </div>
          <span style={{ fontSize: "1.5rem", color: "#6b7280" }}>→</span>
          <div style={styles.improvementStat}>
            <span style={{ ...styles.improvementValue, color: "#10b981" }}>{performance.predictions?.improvement_potential?.potential_average || 0}%</span>
            <span style={styles.improvementLabel}>Potential</span>
          </div>
        </div>
        <div style={styles.quickWins}>
          ⚡ {performance.predictions?.improvement_potential?.quick_wins || 0} quick wins available!
        </div>
      </div>
    </div>
  );
}

/* ─────────── Helper Components ─────────── */
function MasteryBadge({ level, small }) {
  let color, label;
  if (level >= 75) { color = "#10b981"; label = "Mastered"; }
  else if (level >= 50) { color = "#f59e0b"; label = "Practicing"; }
  else if (level >= 25) { color = "#667eea"; label = "Learning"; }
  else { color = "#9ca3af"; label = "Beginner"; }

  return (
    <span style={{
      background: `${color}15`, color,
      padding: small ? "4px 10px" : "6px 14px",
      borderRadius: "20px",
      fontSize: small ? "0.75rem" : "0.85rem",
      fontWeight: "600",
    }}>
      {label}
    </span>
  );
}

function ActivityBadge({ icon, active, label }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem",
      background: active ? "#ecfdf5" : "#f9fafb",
      color: active ? "#065f46" : "#9ca3af",
      border: `1px solid ${active ? "#a7f3d0" : "#e5e7eb"}`,
    }}>
      {icon} {label}
    </span>
  );
}

function MasteryChart({ data }) {
  const total = Object.values(data || {}).reduce((sum, val) => sum + val, 0);
  const items = [
    { key: "mastered", label: "Mastered", color: "#10b981", value: data?.mastered || 0 },
    { key: "practicing", label: "Practicing", color: "#f59e0b", value: data?.practicing || 0 },
    { key: "learning", label: "Learning", color: "#667eea", value: data?.learning || 0 },
    { key: "beginner", label: "Beginner", color: "#9ca3af", value: data?.beginner || 0 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {items.map(item => {
        const pct = total > 0 ? (item.value / total * 100).toFixed(0) : 0;
        return (
          <div key={item.key}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: item.color, display: "inline-block" }}></span>
                {item.label}
              </span>
              <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>{item.value} ({pct}%)</span>
            </div>
            <div style={{ height: "6px", background: "#f3f4f6", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: item.color, borderRadius: "3px", transition: "width 1s" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────── Styles ─────────── */
const styles = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)" },
  header: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "40px 24px",
    color: "white",
  },
  headerContent: {
    maxWidth: "1200px", margin: "0 auto",
    display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px",
  },
  headerTitle: { fontSize: "2rem", fontWeight: "700", margin: 0 },
  headerSubtitle: { fontSize: "1rem", opacity: 0.9, marginTop: "4px" },
  headerStats: {
    display: "flex", alignItems: "center", gap: "20px",
    background: "rgba(255,255,255,0.15)", padding: "16px 24px", borderRadius: "16px",
  },
  headerStatItem: { textAlign: "center" },
  headerStatValue: { display: "block", fontSize: "1.5rem", fontWeight: "700" },
  headerStatLabel: { fontSize: "0.8rem", opacity: 0.8 },
  headerStatDivider: { width: "1px", height: "40px", background: "rgba(255,255,255,0.3)" },
  content: { maxWidth: "1200px", margin: "0 auto", padding: "24px" },
  loadingBox: { background: "white", borderRadius: "20px", padding: "60px", textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.08)" },
  loadingSpinner: { width: "60px", height: "60px", border: "4px solid #e5e7eb", borderTopColor: "#667eea", borderRadius: "50%", margin: "0 auto 24px", animation: "spin 1s linear infinite" },

  /* Stats */
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px", marginBottom: "28px" },
  statCard: { background: "white", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", textAlign: "center" },
  statIconBg: { width: "44px", height: "44px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" },
  statValue: { fontSize: "1.6rem", fontWeight: "800", marginBottom: "2px" },
  statLabel: { color: "#6b7280", fontSize: "0.8rem", fontWeight: "500" },
  statDetail: { color: "#9ca3af", fontSize: "0.7rem", marginTop: "4px" },

  /* Tabs */
  tabsContainer: { marginBottom: "24px" },
  tabs: { display: "flex", gap: "6px", flexWrap: "wrap", background: "white", padding: "6px", borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" },
  tab: {
    padding: "10px 18px", borderRadius: "10px", border: "none", background: "transparent",
    cursor: "pointer", fontWeight: "600", fontSize: "0.85rem", color: "#6b7280", transition: "all 0.2s",
  },
  tabActive: { background: "linear-gradient(135deg, #667eea, #764ba2)", color: "white" },
  tabContent: {},

  /* Cards */
  card: { background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" },
  cardTitle: { fontSize: "1.1rem", fontWeight: "700", color: "#1f2937", margin: "0 0 16px 0" },

  /* Overview grid */
  overviewGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" },
  overviewLeft: { display: "flex", flexDirection: "column", gap: "24px" },
  overviewRight: { display: "flex", flexDirection: "column", gap: "24px" },

  /* Zero state (non-intrusive) */
  zeroState: { textAlign: "center", padding: "20px 10px", color: "#6b7280", fontSize: "0.9rem" },
  zeroStateCard: { background: "white", borderRadius: "20px", padding: "48px", textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.06)" },
  zeroFeatures: { display: "flex", gap: "16px", justifyContent: "center", marginTop: "20px", flexWrap: "wrap" },
  zeroFeature: { display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", background: "#f8fafc", borderRadius: "8px", fontSize: "0.85rem", color: "#4b5563" },

  /* Recommendations */
  recList: { display: "flex", flexDirection: "column", gap: "10px" },
  recItem: { display: "flex", gap: "12px", alignItems: "flex-start", padding: "10px 14px", background: "#f8fafc", borderRadius: "10px", fontSize: "0.9rem" },
  recNumber: { width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg, #667eea, #764ba2)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.75rem", flexShrink: 0 },

  /* Recent list */
  recentList: { display: "flex", flexDirection: "column", gap: "12px" },
  recentItem: {},
  recentInfo: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" },
  recentName: { fontWeight: "600", fontSize: "0.9rem", color: "#374151" },
  recentBar: { height: "6px", background: "#f3f4f6", borderRadius: "3px", overflow: "hidden" },
  recentProgress: { height: "100%", borderRadius: "3px", transition: "width 1s ease" },

  /* Weak topics */
  weakItem: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6" },
  weakScore: { fontWeight: "700", color: "#ef4444" },
  weakHint: { color: "#6b7280", fontSize: "0.8rem", marginTop: "12px", fontStyle: "italic" },

  /* Subjects / Topics grid */
  topicsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" },
  topicCard: { background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" },
  topicHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  topicName: { fontSize: "1rem", fontWeight: "700", margin: 0, color: "#1f2937" },
  progressRing: { position: "relative", display: "flex", justifyContent: "center", alignItems: "center", margin: "16px 0" },
  progressText: { position: "absolute", fontSize: "1.1rem", fontWeight: "700", color: "#374151" },
  activityBadges: { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" },
  quizHistory: { borderTop: "1px solid #f3f4f6", paddingTop: "12px" },
  quizLabel: { fontSize: "0.8rem", color: "#6b7280", marginBottom: "6px", display: "block" },
  quizScores: { display: "flex", gap: "6px", flexWrap: "wrap" },
  quizScore: { padding: "2px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700" },
  topicFooter: { marginTop: "12px", paddingTop: "8px", borderTop: "1px solid #f3f4f6" },
  lastStudied: { fontSize: "0.75rem", color: "#9ca3af" },

  /* Attention tab */
  attentionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" },
  attentionCard: { background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" },
  attentionList: { display: "flex", flexDirection: "column", gap: "12px" },
  attentionItem: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" },
  attentionInfo: { display: "flex", alignItems: "center", gap: "8px", minWidth: "120px" },
  attentionBullet: { fontSize: "0.9rem" },
  attentionName: { fontWeight: "600", fontSize: "0.9rem", color: "#374151" },
  attentionScore: { display: "flex", alignItems: "center", gap: "8px", flex: 1 },
  attentionBar: { flex: 1, height: "6px", background: "#f3f4f6", borderRadius: "3px", overflow: "hidden" },
  attentionBarFill: { height: "100%", borderRadius: "3px", transition: "width 0.5s" },

  /* Focus areas */
  focusList: { display: "flex", flexDirection: "column", gap: "12px" },
  focusItem: { padding: "14px 18px", background: "#fafafa", borderRadius: "10px" },
  focusHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" },
  focusTopic: { fontWeight: "700", color: "#1f2937" },
  priorityBadge: { padding: "2px 10px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: "700" },
  focusReason: { color: "#6b7280", fontSize: "0.85rem", margin: "4px 0" },
  focusAction: { color: "#374151", fontSize: "0.85rem", fontWeight: "500", margin: 0 },



  /* Performance tab */
  performanceGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" },
  perfCard: { background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" },
  readinessCircle: { position: "relative", display: "flex", justifyContent: "center", alignItems: "center", margin: "16px 0" },
  readinessText: { position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" },
  readinessValue: { fontSize: "1.5rem", fontWeight: "800", color: "#1f2937" },
  readinessLabel: { fontSize: "0.8rem", color: "#6b7280" },
  perfDetails: { display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" },
  perfRow: { display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#6b7280" },
  perfTopicRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6", fontSize: "0.9rem" },
  improvementRow: { display: "flex", justifyContent: "center", alignItems: "center", gap: "24px", padding: "20px 0" },
  improvementStat: { textAlign: "center" },
  improvementValue: { display: "block", fontSize: "1.8rem", fontWeight: "800", color: "#1f2937" },
  improvementLabel: { fontSize: "0.8rem", color: "#6b7280" },
  quickWins: { textAlign: "center", padding: "10px", background: "#fef3c7", borderRadius: "10px", fontSize: "0.9rem", fontWeight: "600", color: "#92400e" },
};