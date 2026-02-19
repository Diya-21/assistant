import { createContext, useContext, useState, useCallback } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
    // ─── Student auth state ───
    const [student, setStudent] = useState(() => {
        const saved = localStorage.getItem("student_info");
        return saved ? JSON.parse(saved) : null;
    });

    const login = useCallback((name, rollNo) => {
        const info = { name, rollNo, loginTime: new Date().toISOString() };
        localStorage.setItem("student_info", JSON.stringify(info));

        // Ensure the user_id matches the rollNo for progress tracking
        localStorage.setItem("user_id", rollNo);

        setStudent(info);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("student_info");
        setStudent(null);
    }, []);

    // ─── Global syllabus state ───
    const [syllabusUploaded, setSyllabusUploaded] = useState(false);
    const [syllabusName, setSyllabusName] = useState("");

    // ─── Per-page state cache ───
    const [pageStates, setPageStates] = useState({
        theory: null,
        lab: null,
        projects: null,
        research: null,
        techStack: null,
    });

    const savePageState = useCallback((pageKey, state) => {
        setPageStates((prev) => ({ ...prev, [pageKey]: state }));
    }, []);

    const getPageState = useCallback(
        (pageKey) => pageStates[pageKey],
        [pageStates]
    );

    const clearPageState = useCallback((pageKey) => {
        setPageStates((prev) => ({ ...prev, [pageKey]: null }));
    }, []);

    const value = {
        // Auth
        student,
        login,
        logout,
        isLoggedIn: !!student,
        // Syllabus
        syllabusUploaded,
        setSyllabusUploaded,
        syllabusName,
        setSyllabusName,
        // Page persistence
        savePageState,
        getPageState,
        clearPageState,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useAppContext must be inside AppProvider");
    return ctx;
}
