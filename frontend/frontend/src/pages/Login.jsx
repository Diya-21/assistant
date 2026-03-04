import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { login as apiLogin, signup as apiSignup } from "../api/backend";

export default function Login() {
    const { login: contextLogin } = useAppContext();
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [rollNo, setRollNo] = useState("");
    const [password, setPassword] = useState("");
    const [isSignup, setIsSignup] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!rollNo.trim()) {
            setError("Please enter your roll number.");
            return;
        }

        if (isSignup && !name.trim()) {
            setError("Please enter your name for signup.");
            return;
        }

        setLoading(true);
        try {
            if (isSignup) {
                const res = await apiSignup(name.trim(), rollNo.trim(), password);
                if (res.status === "success") {
                    // After signup, automatically login
                    const loginRes = await apiLogin(rollNo.trim());
                    contextLogin(loginRes.user.name, loginRes.user.roll_no);
                    navigate("/dashboard");
                } else {
                    setError(res.detail || "Signup failed.");
                }
            } else {
                const res = await apiLogin(rollNo.trim());
                if (res.status === "success") {
                    contextLogin(res.user.name, res.user.roll_no);
                    navigate("/dashboard");
                } else {
                    setError(res.detail || "Login failed.");
                }
            }
        } catch (err) {
            setError(err.response?.data?.detail || "An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            {/* Animated background blobs */}
            <div style={styles.blob1}></div>
            <div style={styles.blob2}></div>
            <div style={styles.blob3}></div>

            <div style={styles.card}>
                <div style={styles.logoArea}>
                    <div style={styles.logoIcon}>🎓</div>
                    <h1 style={styles.title}>Learning Agent</h1>
                    <p style={styles.subtitle}>AI-Powered Multimodal Teaching Assistant</p>
                </div>

                <div style={styles.tabs}>
                    <button
                        onClick={() => { setIsSignup(false); setError(""); }}
                        style={{ ...styles.tab, ...(isSignup ? {} : styles.activeTab) }}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => { setIsSignup(true); setError(""); }}
                        style={{ ...styles.tab, ...(isSignup ? styles.activeTab : {}) }}
                    >
                        Sign Up
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    {isSignup && (
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>👤 Student Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your full name"
                                style={styles.input}
                                autoFocus
                            />
                        </div>
                    )}

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>🆔 Roll Number</label>
                        <input
                            type="text"
                            value={rollNo}
                            onChange={(e) => setRollNo(e.target.value)}
                            placeholder="e.g., CS2024001"
                            style={styles.input}
                        />
                    </div>

                    {isSignup && (
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>🔑 Password (Optional)</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Optional password"
                                style={styles.input}
                            />
                        </div>
                    )}

                    {error && <div style={styles.error}>{error}</div>}

                    <button type="submit" style={styles.loginBtn} disabled={loading}>
                        {loading ? "⏳ Processing..." : (isSignup ? "✨ Create Account" : "🚀 Start Learning")}
                    </button>
                </form>

                <div style={styles.features}>
                    <div style={styles.feature}>
                        <span style={styles.featureIcon}>📚</span>
                        <span style={styles.featureText}>Interactive Theory</span>
                    </div>
                    <div style={styles.feature}>
                        <span style={styles.featureIcon}>🧪</span>
                        <span style={styles.featureText}>Virtual Lab</span>
                    </div>
                    <div style={styles.feature}>
                        <span style={styles.featureIcon}>💡</span>
                        <span style={styles.featureText}>Project Ideas</span>
                    </div>
                    <div style={styles.feature}>
                        <span style={styles.featureIcon}>🔬</span>
                        <span style={styles.featureText}>AI Research</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
    },
    blob1: {
        position: "absolute",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(102, 126, 234, 0.3), transparent 70%)",
        top: "-100px",
        left: "-100px",
        animation: "float 8s ease-in-out infinite",
    },
    blob2: {
        position: "absolute",
        width: "350px",
        height: "350px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(118, 75, 162, 0.3), transparent 70%)",
        bottom: "-80px",
        right: "-80px",
        animation: "float 10s ease-in-out infinite reverse",
    },
    blob3: {
        position: "absolute",
        width: "250px",
        height: "250px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(6, 182, 212, 0.2), transparent 70%)",
        top: "50%",
        right: "10%",
        animation: "float 6s ease-in-out infinite",
    },
    card: {
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "28px",
        padding: "48px 40px",
        width: "100%",
        maxWidth: "440px",
        position: "relative",
        zIndex: 2,
        boxShadow: "0 25px 80px rgba(0, 0, 0, 0.4)",
    },
    logoArea: {
        textAlign: "center",
        marginBottom: "36px",
    },
    logoIcon: {
        fontSize: "3.5rem",
        marginBottom: "12px",
        filter: "drop-shadow(0 4px 12px rgba(102, 126, 234, 0.4))",
    },
    title: {
        fontSize: "1.8rem",
        fontWeight: "800",
        background: "linear-gradient(135deg, #667eea, #764ba2, #06b6d4)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        margin: "0 0 8px 0",
    },
    subtitle: {
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: "0.9rem",
        margin: 0,
    },
    tabs: {
        display: "flex",
        background: "rgba(255, 255, 255, 0.05)",
        borderRadius: "12px",
        padding: "4px",
        marginBottom: "24px",
    },
    tab: {
        flex: 1,
        padding: "10px",
        border: "none",
        background: "transparent",
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: "0.9rem",
        fontWeight: "600",
        cursor: "pointer",
        borderRadius: "8px",
        transition: "all 0.2s",
    },
    activeTab: {
        background: "rgba(255, 255, 255, 0.1)",
        color: "white",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    label: {
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: "0.85rem",
        fontWeight: "600",
    },
    input: {
        padding: "14px 18px",
        borderRadius: "12px",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        background: "rgba(255, 255, 255, 0.07)",
        color: "white",
        fontSize: "1rem",
        outline: "none",
        transition: "all 0.3s",
    },
    error: {
        background: "rgba(239, 68, 68, 0.15)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        color: "#fca5a5",
        padding: "10px 16px",
        borderRadius: "10px",
        fontSize: "0.85rem",
        textAlign: "center",
    },
    loginBtn: {
        padding: "16px",
        borderRadius: "14px",
        border: "none",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        color: "white",
        fontSize: "1.05rem",
        fontWeight: "700",
        cursor: "pointer",
        transition: "all 0.3s",
        marginTop: "8px",
        boxShadow: "0 8px 30px rgba(102, 126, 234, 0.35)",
    },
    features: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px",
        marginTop: "32px",
        paddingTop: "24px",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    },
    feature: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    featureIcon: {
        fontSize: "1.1rem",
    },
    featureText: {
        color: "rgba(255, 255, 255, 0.5)",
        fontSize: "0.8rem",
        fontWeight: "500",
    },
};
