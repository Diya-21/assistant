import { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000";

// Generate a simple user ID
const getUserId = () => {
  let userId = localStorage.getItem('user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('user_id', userId);
  }
  return userId;
};

// API Functions
async function getProgress() {
  const res = await fetch(`${API_BASE}/progress/${getUserId()}`);
  return res.json();
}

async function getRecommendations() {
  const res = await fetch(`${API_BASE}/recommendations/${getUserId()}`);
  return res.json();
}

async function getAnalytics() {
  const res = await fetch(`${API_BASE}/analytics/${getUserId()}`);
  return res.json();
}

async function getPerformance() {
  const res = await fetch(`${API_BASE}/performance/${getUserId()}`);
  return res.json();
}

export default function ProgressTracker() {
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

  const getAchievementInfo = (id) => {
    const achievements = {
      first_steps: { icon: "👶", title: "First Steps", desc: "Started your learning journey", color: "#10b981" },
      quiz_master: { icon: "🏆", title: "Quiz Master", desc: "Scored 80%+ on 5 quizzes", color: "#f59e0b" },
      explorer: { icon: "🗺️", title: "Explorer", desc: "Studied 5 different topics", color: "#8b5cf6" },
      perfectionist: { icon: "💯", title: "Perfectionist", desc: "Got 100% on a quiz", color: "#ef4444" },
      streak_week: { icon: "🔥", title: "On Fire", desc: "7-day learning streak", color: "#f97316" },
      deep_diver: { icon: "🔬", title: "Deep Diver", desc: "Deep explanations for 10 topics", color: "#06b6d4" }
    };
    return achievements[id] || { icon: "⭐", title: id, desc: "Achievement unlocked!", color: "#6b7280" };
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>📊 Learning Progress</h1>
          <p style={styles.headerSubtitle}>Track your journey and achievements</p>
        </div>
        <div style={styles.content}>
          <div style={styles.loadingBox}>
            <div style={styles.loadingSpinner}></div>
            <p>Loading your progress...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!progress || progress.total_activities === 0) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>📊 Learning Progress</h1>
          <p style={styles.headerSubtitle}>Track your journey and achievements</p>
        </div>
        <div style={styles.content}>
          <EmptyState />
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
            <h1 style={styles.headerTitle}>📊 Learning Progress</h1>
            <p style={styles.headerSubtitle}>Track your journey and achievements</p>
          </div>
          <div style={styles.headerStats}>
            <div style={styles.headerStatItem}>
              <span style={styles.headerStatValue}>{progress.summary?.total_topics || 0}</span>
              <span style={styles.headerStatLabel}>Topics</span>
            </div>
            <div style={styles.headerStatDivider}></div>
            <div style={styles.headerStatItem}>
              <span style={styles.headerStatValue}>{progress.quizzes_taken || 0}</span>
              <span style={styles.headerStatLabel}>Quizzes</span>
            </div>
            <div style={styles.headerStatDivider}></div>
            <div style={styles.headerStatItem}>
              <span style={styles.headerStatValue}>{progress.average_score || 0}%</span>
              <span style={styles.headerStatLabel}>Avg Score</span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <StatCard
            icon="📚"
            value={progress.summary?.total_topics || 0}
            label="Topics Studied"
            color="#667eea"
            trend="+2 this week"
          />
          <StatCard
            icon="✅"
            value={progress.summary?.mastered_topics || 0}
            label="Mastered"
            color="#10b981"
            trend={`${Math.round((progress.summary?.mastered_topics / progress.summary?.total_topics) * 100) || 0}% complete`}
          />
          <StatCard
            icon="🧠"
            value={progress.quizzes_taken || 0}
            label="Quizzes Taken"
            color="#f59e0b"
            trend="Keep practicing!"
          />
          <StatCard
            icon="⏱️"
            value={`${(progress.total_activities * 5) || 0}m`}
            label="Study Time"
            color="#8b5cf6"
            trend="Estimated"
          />
        </div>

        {/* Tabs */}
        <div style={styles.tabsContainer}>
          <div style={styles.tabs}>
            {["overview", "performance", "topics", "achievements", "analytics"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab ? styles.tabActive : {}),
                }}
              >
                {tab === "overview" && "📈 "}
                {tab === "performance" && "🎯 "}
                {tab === "topics" && "📚 "}
                {tab === "achievements" && "🏆 "}
                {tab === "analytics" && "📊 "}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
            />
          )}

          {activeTab === "performance" && (
            <PerformanceTab performance={performance} />
          )}

          {activeTab === "topics" && (
            <TopicsTab topics={progress.topics} />
          )}

          {activeTab === "achievements" && (
            <AchievementsTab
              achievements={progress.achievements || []}
              getInfo={getAchievementInfo}
            />
          )}

          {activeTab === "analytics" && (
            <AnalyticsTab analytics={analytics} progress={progress} />
          )}
        </div>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div style={styles.emptyState}>
      <div style={styles.emptyIcon}>🎓</div>
      <h2 style={styles.emptyTitle}>Start Your Learning Journey!</h2>
      <p style={styles.emptyText}>
        Upload a syllabus and explore topics to track your progress here.
        Your achievements, quiz scores, and study time will be displayed.
      </p>
      <div style={styles.emptyActions}>
        <a href="/upload" style={styles.primaryBtn}>
          📤 Upload Syllabus
        </a>
        <a href="/theory" style={styles.secondaryBtn}>
          📚 Start Learning
        </a>
      </div>
      <div style={styles.emptyFeatures}>
        <div style={styles.emptyFeature}>
          <span style={styles.featureIcon}>📊</span>
          <span>Track Progress</span>
        </div>
        <div style={styles.emptyFeature}>
          <span style={styles.featureIcon}>🏆</span>
          <span>Earn Achievements</span>
        </div>
        <div style={styles.emptyFeature}>
          <span style={styles.featureIcon}>💡</span>
          <span>Get Recommendations</span>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, value, label, color, trend }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIconBg, background: `${color}15` }}>
        <span style={styles.statIcon}>{icon}</span>
      </div>
      <div style={styles.statInfo}>
        <div style={{ ...styles.statValue, color }}>{value}</div>
        <div style={styles.statLabel}>{label}</div>
        {trend && <div style={styles.statTrend}>{trend}</div>}
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ progress, recommendations, analytics }) {
  return (
    <div style={styles.overviewGrid}>
      {/* Left Column */}
      <div style={styles.overviewLeft}>
        {/* Recommendations */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>💡 Recommended for You</h3>
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
            <p style={styles.emptyMessage}>Keep learning to get personalized recommendations!</p>
          )}
        </div>

        {/* Mastery Distribution */}
        {analytics && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>📈 Learning Distribution</h3>
            <MasteryChart data={analytics.mastery_distribution} />
          </div>
        )}
      </div>

      {/* Right Column */}
      <div style={styles.overviewRight}>
        {/* Recent Activity */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🕐 Recent Topics</h3>
          <div style={styles.recentList}>
            {Object.entries(progress.topics || {}).slice(0, 5).map(([name, data]) => (
              <div key={name} style={styles.recentItem}>
                <div style={styles.recentInfo}>
                  <span style={styles.recentName}>{name}</span>
                  <MasteryBadge level={data.mastery_level} small />
                </div>
                <div style={styles.recentBar}>
                  <div
                    style={{
                      ...styles.recentProgress,
                      width: `${data.mastery_level}%`,
                      background: data.mastery_level >= 75 ? "#10b981" : data.mastery_level >= 50 ? "#f59e0b" : "#667eea",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Topics Alert */}
        {progress.summary?.weak_topics?.length > 0 && (
          <div style={styles.alertCard}>
            <h3 style={styles.alertTitle}>⚠️ Topics Needing Attention</h3>
            {progress.summary.weak_topics.map((topic, i) => (
              <div key={i} style={styles.weakItem}>
                <span>{topic.topic}</span>
                <span style={styles.weakScore}>{topic.average_score}%</span>
              </div>
            ))}
            <button style={styles.reviewBtn}>📚 Review Now</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Topics Tab
function TopicsTab({ topics }) {
  const topicArray = Object.entries(topics || {});

  if (topicArray.length === 0) {
    return (
      <div style={styles.emptyTab}>
        <p>No topics studied yet. Start learning to see your progress!</p>
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
              <circle
                cx="40"
                cy="40"
                r="35"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="6"
              />
              <circle
                cx="40"
                cy="40"
                r="35"
                fill="none"
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
                  <span
                    key={i}
                    style={{
                      ...styles.quizScore,
                      background: q.percentage >= 80 ? "#d1fae5" : q.percentage >= 60 ? "#fef3c7" : "#fee2e2",
                      color: q.percentage >= 80 ? "#065f46" : q.percentage >= 60 ? "#92400e" : "#991b1b",
                    }}
                  >
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

// Achievements Tab
function AchievementsTab({ achievements, getInfo }) {
  const allAchievements = ["first_steps", "quiz_master", "explorer", "perfectionist", "streak_week", "deep_diver"];

  return (
    <div style={styles.achievementsGrid}>
      {allAchievements.map(id => {
        const unlocked = achievements.includes(id);
        const info = getInfo(id);

        return (
          <div
            key={id}
            style={{
              ...styles.achievementCard,
              ...(unlocked ? styles.achievementUnlocked : styles.achievementLocked),
            }}
          >
            <div style={{
              ...styles.achievementIcon,
              background: unlocked ? `${info.color}20` : "#f3f4f6",
            }}>
              <span style={{ fontSize: "2.5rem" }}>{info.icon}</span>
            </div>
            <h3 style={styles.achievementTitle}>{info.title}</h3>
            <p style={styles.achievementDesc}>{info.desc}</p>
            {unlocked ? (
              <span style={{ ...styles.achievementBadge, background: info.color }}>
                ✓ Unlocked
              </span>
            ) : (
              <span style={styles.achievementBadgeLocked}>🔒 Locked</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Analytics Tab
function AnalyticsTab({ analytics, progress }) {
  if (!analytics) {
    return <div style={styles.emptyTab}>Loading analytics...</div>;
  }

  return (
    <div style={styles.analyticsGrid}>
      {/* Study Summary */}
      <div style={styles.analyticCard}>
        <h3 style={styles.cardTitle}>📊 Study Summary</h3>
        <div style={styles.summaryStats}>
          <div style={styles.summaryStat}>
            <span style={styles.summaryValue}>{analytics.total_study_time_minutes || 0}</span>
            <span style={styles.summaryLabel}>Minutes Studied</span>
          </div>
          <div style={styles.summaryStat}>
            <span style={styles.summaryValue}>{analytics.quiz_history?.length || 0}</span>
            <span style={styles.summaryLabel}>Total Quizzes</span>
          </div>
          <div style={styles.summaryStat}>
            <span style={styles.summaryValue}>{analytics.achievement_count || 0}</span>
            <span style={styles.summaryLabel}>Achievements</span>
          </div>
        </div>
      </div>

      {/* Mastery Distribution */}
      <div style={styles.analyticCard}>
        <h3 style={styles.cardTitle}>🎯 Mastery Levels</h3>
        <MasteryChart data={analytics.mastery_distribution} />
      </div>

      {/* Quiz Performance */}
      <div style={styles.analyticCard}>
        <h3 style={styles.cardTitle}>📝 Recent Quiz Performance</h3>
        {analytics.quiz_history?.length > 0 ? (
          <div style={styles.quizChart}>
            {analytics.quiz_history.slice(-7).map((quiz, i) => (
              <div key={i} style={styles.quizBar}>
                <div
                  style={{
                    ...styles.quizBarFill,
                    height: `${quiz.percentage}%`,
                    background: quiz.percentage >= 80 ? "#10b981" : quiz.percentage >= 60 ? "#f59e0b" : "#ef4444",
                  }}
                />
                <span style={styles.quizBarLabel}>{quiz.percentage}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.emptyMessage}>Take quizzes to see your performance chart!</p>
        )}
      </div>

      {/* Learning Streak */}
      <div style={styles.analyticCard}>
        <h3 style={styles.cardTitle}>🔥 Learning Streak</h3>
        <div style={styles.streakDisplay}>
          <div style={styles.streakNumber}>{progress.streak_days || 0}</div>
          <div style={styles.streakLabel}>Day Streak</div>
        </div>
        <div style={styles.streakCalendar}>
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              style={{
                ...styles.streakDay,
                background: i < (progress.streak_days || 0) ? "#10b981" : "#e5e7eb",
              }}
            />
          ))}
        </div>
        <p style={styles.streakTip}>Keep learning daily to maintain your streak!</p>
      </div>
    </div>
  );
}

// Performance Analysis Tab (ML-based)
function PerformanceTab({ performance }) {
  if (!performance || performance.status === "insufficient_data") {
    return (
      <div style={styles.emptyTab}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📊</div>
        <h3>Not enough data yet</h3>
        <p>{performance?.message || "Study more topics to get AI-powered performance predictions!"}</p>
      </div>
    );
  }

  return (
    <div style={styles.performanceGrid}>
      {/* Predictions Card */}
      <div style={styles.predictionCard}>
        <h3 style={styles.cardTitle}>🎯 Performance Predictions</h3>

        <div style={styles.predictionMain}>
          <div style={styles.readinessCircle}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke={performance.predictions?.overall_readiness >= 70 ? "#10b981" :
                  performance.predictions?.overall_readiness >= 50 ? "#f59e0b" : "#ef4444"}
                strokeWidth="8"
                strokeDasharray={`${(performance.predictions?.overall_readiness / 100) * 339} 339`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div style={styles.readinessText}>
              <span style={styles.readinessValue}>{performance.predictions?.overall_readiness || 0}%</span>
              <span style={styles.readinessLabel}>Readiness</span>
            </div>
          </div>

          <div style={styles.predictionDetails}>
            <div style={styles.predictionItem}>
              <span style={styles.predictionLabel}>Status</span>
              <span style={styles.predictionValue}>{performance.predictions?.readiness_level}</span>
            </div>
            <div style={styles.predictionItem}>
              <span style={styles.predictionLabel}>Predicted Grade</span>
              <span style={{ ...styles.predictionValue, color: "#667eea" }}>
                {performance.predictions?.exam_prediction?.grade_prediction}
              </span>
            </div>
            <div style={styles.predictionItem}>
              <span style={styles.predictionLabel}>Learning Style</span>
              <span style={styles.predictionValue}>{performance.predictions?.learning_style}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Strong Topics */}
      <div style={styles.strengthCard}>
        <h3 style={styles.cardTitle}>💪 Strong Topics</h3>
        {performance.strong_topics?.length > 0 ? (
          <div style={styles.topicList}>
            {performance.strong_topics.map((topic, i) => (
              <div key={i} style={styles.topicItem}>
                <div style={styles.topicInfo}>
                  <span style={styles.topicRank}>#{i + 1}</span>
                  <span style={styles.topicName}>{topic.name}</span>
                </div>
                <div style={styles.topicScore}>
                  <div style={{ ...styles.scoreBar, background: "#d1fae5" }}>
                    <div style={{ ...styles.scoreBarFill, width: `${topic.score}%`, background: "#10b981" }} />
                  </div>
                  <span style={{ color: "#10b981", fontWeight: "600" }}>{topic.score}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.emptyMessage}>Keep studying to build strong areas!</p>
        )}
      </div>

      {/* Weak Topics (Needs Attention) */}
      <div style={styles.weakCard}>
        <h3 style={styles.cardTitle}>⚠️ Needs Attention</h3>
        {performance.weak_topics?.length > 0 ? (
          <div style={styles.topicList}>
            {performance.weak_topics.map((topic, i) => (
              <div key={i} style={styles.weakTopicItem}>
                <div style={styles.topicInfo}>
                  <span style={{ ...styles.topicRank, background: "#fee2e2", color: "#dc2626" }}>!</span>
                  <span style={styles.topicName}>{topic.name}</span>
                </div>
                <div style={styles.topicScore}>
                  <div style={{ ...styles.scoreBar, background: "#fee2e2" }}>
                    <div style={{ ...styles.scoreBarFill, width: `${topic.score}%`, background: "#ef4444" }} />
                  </div>
                  <span style={{ color: "#ef4444", fontWeight: "600" }}>{topic.score}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.emptyMessage}>Great! No weak areas detected! 🎉</p>
        )}
      </div>

      {/* Focus Areas (Prioritized) */}
      <div style={styles.focusCard}>
        <h3 style={styles.cardTitle}>🎯 Focus Areas</h3>
        {performance.focus_areas?.length > 0 ? (
          <div style={styles.focusList}>
            {performance.focus_areas.map((area, i) => (
              <div
                key={i}
                style={{
                  ...styles.focusItem,
                  borderLeft: `4px solid ${area.priority === "high" ? "#ef4444" : "#f59e0b"}`
                }}
              >
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
          <p style={styles.emptyMessage}>No specific focus areas - you're doing great!</p>
        )}
      </div>

      {/* Recommendations */}
      <div style={styles.recsCard}>
        <h3 style={styles.cardTitle}>💡 AI Recommendations</h3>
        {performance.recommendations?.length > 0 ? (
          <div style={styles.recsList}>
            {performance.recommendations.map((rec, i) => (
              <div key={i} style={styles.recItem}>
                <span style={styles.recNumber}>{i + 1}</span>
                <span style={styles.recText}>{rec}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.emptyMessage}>Keep learning to get personalized recommendations!</p>
        )}
      </div>

      {/* Improvement Potential */}
      <div style={styles.improvementCard}>
        <h3 style={styles.cardTitle}>📈 Improvement Potential</h3>
        <div style={styles.improvementStats}>
          <div style={styles.improvementStat}>
            <span style={styles.improvementValue}>
              {performance.predictions?.improvement_potential?.current_average || 0}%
            </span>
            <span style={styles.improvementLabel}>Current Avg</span>
          </div>
          <div style={styles.improvementArrow}>→</div>
          <div style={styles.improvementStat}>
            <span style={{ ...styles.improvementValue, color: "#10b981" }}>
              {performance.predictions?.improvement_potential?.potential_average || 0}%
            </span>
            <span style={styles.improvementLabel}>Potential</span>
          </div>
        </div>
        <div style={styles.quickWins}>
          <span style={styles.quickWinsIcon}>⚡</span>
          <span>
            {performance.predictions?.improvement_potential?.quick_wins || 0} quick wins available!
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function MasteryBadge({ level, small }) {
  let color, label;

  if (level >= 75) {
    color = "#10b981";
    label = "Mastered";
  } else if (level >= 50) {
    color = "#f59e0b";
    label = "Practicing";
  } else if (level >= 25) {
    color = "#667eea";
    label = "Learning";
  } else {
    color = "#9ca3af";
    label = "Beginner";
  }

  return (
    <span style={{
      background: `${color}15`,
      color,
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
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "4px 10px",
      borderRadius: "6px",
      fontSize: "0.75rem",
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
    <div style={styles.masteryChart}>
      {items.map(item => {
        const percentage = total > 0 ? (item.value / total * 100).toFixed(0) : 0;

        return (
          <div key={item.key} style={styles.masteryItem}>
            <div style={styles.masteryHeader}>
              <span style={{ ...styles.masteryDot, background: item.color }}></span>
              <span style={styles.masteryLabel}>{item.label}</span>
              <span style={styles.masteryValue}>{item.value}</span>
            </div>
            <div style={styles.masteryBarBg}>
              <div style={{
                ...styles.masteryBarFill,
                width: `${percentage}%`,
                background: item.color,
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Styles
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
  },
  header: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "40px 24px",
    color: "white",
  },
  headerContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
  },
  headerTitle: {
    fontSize: "2rem",
    fontWeight: "700",
    margin: 0,
  },
  headerSubtitle: {
    fontSize: "1rem",
    opacity: 0.9,
    marginTop: "4px",
  },
  headerStats: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    background: "rgba(255,255,255,0.15)",
    padding: "16px 24px",
    borderRadius: "16px",
  },
  headerStatItem: {
    textAlign: "center",
  },
  headerStatValue: {
    display: "block",
    fontSize: "1.5rem",
    fontWeight: "700",
  },
  headerStatLabel: {
    fontSize: "0.8rem",
    opacity: 0.8,
  },
  headerStatDivider: {
    width: "1px",
    height: "40px",
    background: "rgba(255,255,255,0.3)",
  },
  content: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "24px",
  },
  loadingBox: {
    background: "white",
    borderRadius: "20px",
    padding: "60px",
    textAlign: "center",
    boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
  },
  loadingSpinner: {
    width: "50px",
    height: "50px",
    border: "4px solid #e5e7eb",
    borderTopColor: "#667eea",
    borderRadius: "50%",
    margin: "0 auto 20px",
    animation: "spin 1s linear infinite",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "24px",
  },
  statCard: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
  },
  statIconBg: {
    width: "56px",
    height: "56px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statIcon: {
    fontSize: "1.5rem",
  },
  statInfo: {},
  statValue: {
    fontSize: "1.75rem",
    fontWeight: "700",
  },
  statLabel: {
    fontSize: "0.9rem",
    color: "#6b7280",
  },
  statTrend: {
    fontSize: "0.75rem",
    color: "#9ca3af",
    marginTop: "2px",
  },
  tabsContainer: {
    marginBottom: "24px",
  },
  tabs: {
    display: "flex",
    gap: "8px",
    background: "white",
    padding: "8px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
  },
  tab: {
    padding: "12px 20px",
    border: "none",
    borderRadius: "8px",
    background: "transparent",
    color: "#6b7280",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  tabActive: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
  },
  tabContent: {},
  overviewGrid: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr",
    gap: "24px",
  },
  overviewLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  overviewRight: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  card: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
  },
  cardTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
    marginBottom: "16px",
  },
  recList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  recItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "14px 16px",
    background: "#fefce8",
    borderRadius: "10px",
    fontSize: "0.95rem",
  },
  recNumber: {
    width: "24px",
    height: "24px",
    background: "#fbbf24",
    color: "white",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "0.8rem",
    flexShrink: 0,
  },
  recentList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  recentItem: {},
  recentInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  },
  recentName: {
    fontWeight: "500",
    fontSize: "0.95rem",
  },
  recentBar: {
    height: "6px",
    background: "#f3f4f6",
    borderRadius: "3px",
    overflow: "hidden",
  },
  recentProgress: {
    height: "100%",
    borderRadius: "3px",
    transition: "width 0.3s",
  },
  alertCard: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "16px",
    padding: "24px",
  },
  alertTitle: {
    color: "#991b1b",
    fontSize: "1rem",
    marginBottom: "16px",
  },
  weakItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 14px",
    background: "white",
    borderRadius: "8px",
    marginBottom: "8px",
  },
  weakScore: {
    fontWeight: "600",
    color: "#dc2626",
  },
  reviewBtn: {
    width: "100%",
    marginTop: "12px",
    padding: "12px",
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
  },
  topicsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
  },
  topicCard: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    textAlign: "center",
  },
  topicHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  topicName: {
    fontSize: "1rem",
    fontWeight: "600",
    textAlign: "left",
  },
  progressRing: {
    position: "relative",
    margin: "16px auto",
    width: "80px",
    height: "80px",
  },
  progressText: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "1.1rem",
    fontWeight: "700",
    color: "#374151",
  },
  activityBadges: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    marginTop: "16px",
    flexWrap: "wrap",
  },
  quizHistory: {
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #f3f4f6",
  },
  quizLabel: {
    fontSize: "0.8rem",
    color: "#6b7280",
    display: "block",
    marginBottom: "8px",
  },
  quizScores: {
    display: "flex",
    justifyContent: "center",
    gap: "6px",
    flexWrap: "wrap",
  },
  quizScore: {
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "0.8rem",
    fontWeight: "600",
  },
  topicFooter: {
    marginTop: "16px",
    paddingTop: "12px",
    borderTop: "1px solid #f3f4f6",
  },
  lastStudied: {
    fontSize: "0.8rem",
    color: "#9ca3af",
  },
  achievementsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "20px",
  },
  achievementCard: {
    borderRadius: "16px",
    padding: "24px",
    textAlign: "center",
    transition: "transform 0.2s",
  },
  achievementUnlocked: {
    background: "linear-gradient(135deg, #fef3c7, #fde68a)",
    boxShadow: "0 8px 30px rgba(251, 191, 36, 0.2)",
  },
  achievementLocked: {
    background: "#f9fafb",
    opacity: 0.7,
    filter: "grayscale(80%)",
  },
  achievementIcon: {
    width: "80px",
    height: "80px",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  },
  achievementTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
    marginBottom: "8px",
  },
  achievementDesc: {
    fontSize: "0.85rem",
    color: "#6b7280",
    marginBottom: "16px",
  },
  achievementBadge: {
    display: "inline-block",
    padding: "6px 14px",
    borderRadius: "20px",
    color: "white",
    fontSize: "0.8rem",
    fontWeight: "600",
  },
  achievementBadgeLocked: {
    display: "inline-block",
    padding: "6px 14px",
    borderRadius: "20px",
    background: "#e5e7eb",
    color: "#6b7280",
    fontSize: "0.8rem",
    fontWeight: "500",
  },
  analyticsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  analyticCard: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
  },
  summaryStats: {
    display: "flex",
    justifyContent: "space-around",
    textAlign: "center",
  },
  summaryStat: {},
  summaryValue: {
    display: "block",
    fontSize: "2rem",
    fontWeight: "700",
    color: "#667eea",
  },
  summaryLabel: {
    fontSize: "0.85rem",
    color: "#6b7280",
  },
  quizChart: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: "150px",
    padding: "20px 0",
  },
  quizBar: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "30px",
  },
  quizBarFill: {
    width: "100%",
    borderRadius: "4px 4px 0 0",
    minHeight: "10px",
    transition: "height 0.3s",
  },
  quizBarLabel: {
    fontSize: "0.7rem",
    color: "#6b7280",
    marginTop: "6px",
  },
  streakDisplay: {
    textAlign: "center",
    marginBottom: "20px",
  },
  streakNumber: {
    fontSize: "3rem",
    fontWeight: "700",
    color: "#f97316",
  },
  streakLabel: {
    fontSize: "1rem",
    color: "#6b7280",
  },
  streakCalendar: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "16px",
  },
  streakDay: {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
  },
  streakTip: {
    textAlign: "center",
    fontSize: "0.85rem",
    color: "#9ca3af",
  },
  masteryChart: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  masteryItem: {},
  masteryHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "6px",
  },
  masteryDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
  },
  masteryLabel: {
    flex: 1,
    fontSize: "0.9rem",
    fontWeight: "500",
  },
  masteryValue: {
    fontSize: "0.85rem",
    color: "#6b7280",
  },
  masteryBarBg: {
    height: "8px",
    background: "#f3f4f6",
    borderRadius: "4px",
    overflow: "hidden",
  },
  masteryBarFill: {
    height: "100%",
    borderRadius: "4px",
    transition: "width 0.5s",
  },
  emptyState: {
    background: "white",
    borderRadius: "24px",
    padding: "60px 40px",
    textAlign: "center",
    boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
  },
  emptyIcon: {
    fontSize: "5rem",
    marginBottom: "20px",
  },
  emptyTitle: {
    fontSize: "1.75rem",
    fontWeight: "600",
    marginBottom: "12px",
  },
  emptyText: {
    color: "#6b7280",
    maxWidth: "400px",
    margin: "0 auto 24px",
    lineHeight: "1.6",
  },
  emptyActions: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "32px",
  },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "14px 28px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    textDecoration: "none",
    borderRadius: "12px",
    fontWeight: "600",
    transition: "transform 0.2s",
  },
  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "14px 28px",
    background: "#f3f4f6",
    color: "#374151",
    textDecoration: "none",
    borderRadius: "12px",
    fontWeight: "600",
  },
  emptyFeatures: {
    display: "flex",
    justifyContent: "center",
    gap: "32px",
    color: "#6b7280",
    fontSize: "0.9rem",
  },
  emptyFeature: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  featureIcon: {
    fontSize: "1.2rem",
  },
  emptyTab: {
    background: "white",
    borderRadius: "16px",
    padding: "40px",
    textAlign: "center",
    color: "#6b7280",
  },
  emptyMessage: {
    color: "#9ca3af",
    fontSize: "0.9rem",
  },
  // Performance Tab Styles
  performanceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
  },
  predictionCard: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "20px",
    padding: "24px",
    color: "white",
    gridColumn: "span 2",
  },
  predictionMain: {
    display: "flex",
    alignItems: "center",
    gap: "30px",
    marginTop: "16px",
    flexWrap: "wrap",
  },
  readinessCircle: {
    position: "relative",
    width: "120px",
    height: "120px",
  },
  readinessText: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
  },
  readinessValue: {
    display: "block",
    fontSize: "1.5rem",
    fontWeight: "700",
  },
  readinessLabel: {
    fontSize: "0.8rem",
    opacity: 0.9,
  },
  predictionDetails: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  predictionItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 14px",
    background: "rgba(255,255,255,0.15)",
    borderRadius: "10px",
  },
  predictionLabel: {
    opacity: 0.9,
    fontSize: "0.9rem",
  },
  predictionValue: {
    fontWeight: "600",
    fontSize: "0.9rem",
  },
  strengthCard: {
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    borderRadius: "16px",
    padding: "24px",
  },
  weakCard: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "16px",
    padding: "24px",
  },
  focusCard: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    gridColumn: "span 2",
  },
  recsCard: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: "16px",
    padding: "24px",
  },
  improvementCard: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
  },
  topicList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  topicItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    background: "white",
    borderRadius: "10px",
  },
  weakTopicItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    background: "white",
    borderRadius: "10px",
  },
  topicInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  topicRank: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    background: "#d1fae5",
    color: "#065f46",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "0.8rem",
  },
  topicName: {
    fontWeight: "500",
  },
  topicScore: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  scoreBar: {
    width: "80px",
    height: "8px",
    borderRadius: "4px",
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: "4px",
    transition: "width 0.3s",
  },
  focusList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  focusItem: {
    padding: "16px",
    background: "#f9fafb",
    borderRadius: "10px",
  },
  focusHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  focusTopic: {
    fontWeight: "600",
    fontSize: "1rem",
  },
  priorityBadge: {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "0.7rem",
    fontWeight: "700",
  },
  focusReason: {
    fontSize: "0.9rem",
    color: "#6b7280",
    margin: "4px 0",
  },
  focusAction: {
    fontSize: "0.9rem",
    color: "#374151",
    fontWeight: "500",
    marginTop: "8px",
  },
  recsList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  recItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "12px",
    background: "white",
    borderRadius: "10px",
  },
  recNumber: {
    width: "24px",
    height: "24px",
    borderRadius: "6px",
    background: "#fbbf24",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "0.8rem",
    flexShrink: 0,
  },
  recText: {
    fontSize: "0.9rem",
    lineHeight: 1.4,
  },
  improvementStats: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "20px",
    marginTop: "16px",
  },
  improvementStat: {
    textAlign: "center",
  },
  improvementValue: {
    display: "block",
    fontSize: "2rem",
    fontWeight: "700",
    color: "#667eea",
  },
  improvementLabel: {
    fontSize: "0.85rem",
    color: "#6b7280",
  },
  improvementArrow: {
    fontSize: "2rem",
    color: "#10b981",
  },
  quickWins: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginTop: "20px",
    padding: "12px",
    background: "#ecfdf5",
    borderRadius: "10px",
    color: "#065f46",
    fontWeight: "500",
  },
  quickWinsIcon: {
    fontSize: "1.2rem",
  },
};

// Add responsive styles
const mediaQuery = window.matchMedia("(max-width: 768px)");
if (mediaQuery.matches) {
  styles.overviewGrid.gridTemplateColumns = "1fr";
  styles.headerContent.flexDirection = "column";
  styles.headerContent.textAlign = "center";
}