import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";

import UploadSyllabus from "./pages/UploadSyllabus";
import QAAgent from "./pages/QAAgent";
import LabAgent from "./pages/LabAgent";
import ProgressTracker from "./pages/ProgressTracker";

// New Pages for Project & Research Assistant
import ProjectAssistant from "./pages/ProjectAssistant";
import ResearchAssistant from "./pages/ResearchAssistant";
import TechStackAssistant from "./pages/TechStackAssistant";

import "./styles/theme.css";
import "./styles/layout.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/upload" />} />
          <Route path="/upload" element={<UploadSyllabus />} />
          <Route path="/theory" element={<QAAgent />} />
          <Route path="/lab" element={<LabAgent />} />
          <Route path="/progress" element={<ProgressTracker />} />

          {/* New Routes for Project & Research Assistant */}
          <Route path="/projects" element={<ProjectAssistant />} />
          <Route path="/research" element={<ResearchAssistant />} />
          <Route path="/tech-stack" element={<TechStackAssistant />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
