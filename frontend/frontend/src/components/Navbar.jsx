import { NavLink } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  return (
    <nav style={styles.nav}>
      <h1 style={styles.logo}>🎓 Multimodal AI Teaching Assistant</h1>
      <div style={styles.links}>
        <NavLink to="/upload" style={navLinkStyle}>📤 Upload</NavLink>
        <NavLink to="/projects" style={navLinkStyle}>💡 Projects</NavLink>
        <NavLink to="/research" style={navLinkStyle}>🔬 Research</NavLink>
        <NavLink to="/tech-stack" style={navLinkStyle}>🛠️ Tech Stack</NavLink>
        <NavLink to="/theory" style={navLinkStyle}>📚 Theory</NavLink>
        <NavLink to="/lab" style={navLinkStyle}>🔬 Lab</NavLink>
        <NavLink to="/progress" style={navLinkStyle}>📊 Progress</NavLink>
      </div>
    </nav>
  );
}

const navLinkStyle = ({ isActive }) => ({
  padding: "8px 16px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "600",
  fontSize: "0.9rem",
  color: isActive ? "#667eea" : "#4b5563",
  background: isActive ? "rgba(102, 126, 234, 0.1)" : "transparent",
  transition: "all 0.2s",
});

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 32px",
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(12px)",
    boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: {
    margin: 0,
    fontSize: "1.3rem",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  links: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
};
