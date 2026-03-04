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

        // Ensure the IDs match for progress and history tracking
        localStorage.setItem("user_id", rollNo);
        localStorage.setItem("student_roll_no", rollNo);

        setStudent(info);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("student_info");
        setStudent(null);
    }, []);

    // ─── Global syllabus state ───
    const [syllabusUploaded, setSyllabusUploaded] = useState(false);
    const [syllabusName, setSyllabusName] = useState("");

    // ─── Per-page state cache (backed by sessionStorage) ───
    const [pageStates, setPageStates] = useState(() => {
        try {
            const saved = sessionStorage.getItem("page_states");
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    theory: parsed.theory || null,
                    qa: parsed.qa || null,
                    lab: parsed.lab || null,
                    projects: parsed.projects || null,
                    research: parsed.research || null,
                    techStack: parsed.techStack || null,
                    upload: parsed.upload || null,
                };
            }
        } catch (e) { /* ignore parse errors */ }
        return {
            theory: null,
            qa: null,
            lab: null,
            projects: null,
            research: null,
            techStack: null,
            upload: null,
        };
    });

    const savePageState = useCallback((pageKey, state) => {
        setPageStates((prev) => {
            const next = { ...prev, [pageKey]: state };
            try {
                sessionStorage.setItem("page_states", JSON.stringify(next));
            } catch (e) { /* storage full, ignore */ }
            return next;
        });
    }, []);

    const getPageState = useCallback(
        (pageKey) => pageStates[pageKey],
        [pageStates]
    );

    const clearPageState = useCallback((pageKey) => {
        setPageStates((prev) => {
            const next = { ...prev, [pageKey]: null };
            try {
                sessionStorage.setItem("page_states", JSON.stringify(next));
            } catch (e) { /* ignore */ }
            return next;
        });
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
