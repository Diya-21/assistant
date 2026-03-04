import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext";
import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UploadSyllabus from "./pages/UploadSyllabus";
import QAAgent from "./pages/QAAgent";
import LabAgent from "./pages/LabAgent";
import ProgressTracker from "./pages/ProgressTracker";
import ProjectAssistant from "./pages/ProjectAssistant";
import ResearchAssistant from "./pages/ResearchAssistant";
import TechStackAssistant from "./pages/TechStackAssistant";
import History from "./pages/History";

import "./styles/theme.css";
import "./styles/layout.css";

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAppContext();
  if (!isLoggedIn) return <Navigate to="/login" />;
  return children;
}

function AppRoutes() {
  const { isLoggedIn } = useAppContext();

  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" /> : <Login />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/upload" element={<ProtectedRoute><UploadSyllabus /></ProtectedRoute>} />
      <Route path="/theory" element={<ProtectedRoute><QAAgent /></ProtectedRoute>} />
      <Route path="/lab" element={<ProtectedRoute><LabAgent /></ProtectedRoute>} />
      <Route path="/progress" element={<ProtectedRoute><ProgressTracker /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><ProjectAssistant /></ProtectedRoute>} />
      <Route path="/research" element={<ProtectedRoute><ResearchAssistant /></ProtectedRoute>} />
      <Route path="/tech-stack" element={<ProtectedRoute><TechStackAssistant /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AppProvider>
  );
}

function AppLayout() {
  const { isLoggedIn } = useAppContext();

  return (
    <div className="app-layout">
      {isLoggedIn && <Navbar />}
      <AppRoutes />
    </div>
  );
}
