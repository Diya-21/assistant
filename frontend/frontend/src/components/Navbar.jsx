import { NavLink, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { clearSyllabus } from "../api/backend";

export default function Navbar() {
  const { syllabusUploaded, syllabusName, student, logout, resetSyllabusState } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleClearSyllabus = async () => {
    if (window.confirm("Are you sure you want to clear your uploaded syllabus globally?")) {
      try {
        await clearSyllabus(true);
        resetSyllabusState();
        navigate("/dashboard");
      } catch (err) {
        console.error("Clear failed:", err);
      }
    }
  };

  return (
    <nav style={styles.nav}>
      <NavLink to="/dashboard" style={{ textDecoration: "none" }}>
        <h1 style={styles.logo}>🤖 Multimodal AI Teaching Assistant</h1>
      </NavLink>
      <div style={styles.links}>
        <NavLink to="/dashboard" style={navLinkStyle}>🏠 Home</NavLink>
        <NavLink to="/upload" style={navLinkStyle}>📤 Upload</NavLink>
        <NavLink to="/projects" style={navLinkStyle}>💡 Projects</NavLink>
        <NavLink to="/research" style={navLinkStyle}>🔬 Research</NavLink>
        <NavLink to="/tech-stack" style={navLinkStyle}>🛠️ Tech Stack</NavLink>
        <NavLink to="/theory" style={navLinkStyle}>📚 Theory</NavLink>
        <NavLink to="/lab" style={navLinkStyle}>🧪 Lab</NavLink>
        <NavLink to="/study-materials" style={navLinkStyle}>📖 Materials</NavLink>
        <NavLink to="/history" style={navLinkStyle}>📜 History</NavLink>

        <NavLink to="/progress" style={navLinkStyle}>📊 Progress</NavLink>
        {syllabusUploaded && (
          <span style={styles.syllabusChip} title={syllabusName}>
            ✅ {syllabusName?.length > 15 ? syllabusName.substring(0, 15) + "..." : syllabusName}
          </span>
        )}
        <div style={styles.userArea}>
          {syllabusUploaded && (
            <button onClick={handleClearSyllabus} style={{ ...styles.logoutBtn, background: "#fee2e2", color: "#b91c1c", borderColor: "#fecaca", marginRight: "10px" }}>
              🧹 Clear
            </button>
          )}
          <span style={styles.userName}>👤 {student?.name}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </div>
    </nav>
  );
}

const navLinkStyle = ({ isActive }) => ({
  padding: "8px 14px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "600",
  fontSize: "0.85rem",
  color: isActive ? "#667eea" : "#4b5563",
  background: isActive ? "rgba(102, 126, 234, 0.1)" : "transparent",
  transition: "all 0.2s",
});

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 28px",
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(12px)",
    boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: {
    margin: 0,
    fontSize: "1.2rem",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  links: {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  syllabusChip: {
    padding: "4px 10px",
    borderRadius: "20px",
    background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
    color: "#065f46",
    fontSize: "0.75rem",
    fontWeight: "600",
    border: "1px solid #a7f3d0",
    marginLeft: "4px",
    cursor: "default",
  },
  userArea: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginLeft: "12px",
    paddingLeft: "12px",
    borderLeft: "1px solid #e5e7eb",
  },
  userName: {
    fontSize: "0.8rem",
    fontWeight: "600",
    color: "#374151",
  },
  logoutBtn: {
    padding: "4px 10px",
    borderRadius: "6px",
    border: "1px solid #e5e7eb",
    background: "transparent",
    color: "#6b7280",
    fontSize: "0.75rem",
    cursor: "pointer",
    fontWeight: "600",
  },
};
