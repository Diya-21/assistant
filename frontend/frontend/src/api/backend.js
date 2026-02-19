const API_BASE = "http://127.0.0.1:8080";
const BASE_URL = "http://127.0.0.1:8080";
const BASE = "http://127.0.0.1:8080";

// Helper to get user ID consistently
function getUserIdLocal() {
  let userId = localStorage.getItem('user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('user_id', userId);
  }
  return userId;
}

const getUserId = getUserIdLocal;

/* ---------- Upload Syllabus ---------- */
export async function uploadSyllabus(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload-syllabus/`, {
    method: "POST",
    body: formData,
  });

  return res.json();
}

/* ---------- Ask Theory Question ---------- */
export async function askQuestion(question) {
  const formData = new FormData();
  formData.append("question", question);

  const res = await fetch(`${API_BASE}/ask/`, {
    method: "POST",
    body: formData,
  });

  return res.json();
}

/* ---------- Lab Agent ---------- */
export async function runLab(experiment, step = "explanation") {
  const form = new FormData();
  form.append("experiment", experiment);
  form.append("step", step);
  form.append("user_id", getUserIdLocal());

  const res = await fetch(`${API_BASE}/lab/`, {
    method: "POST",
    body: form,
  });

  return res.json();
}

/* ---------- Learning Flow ---------- */
export async function learnTopic(topic, stage = "explain") {
  const form = new FormData();
  form.append("topic", topic);
  form.append("stage", stage);
  form.append("user_id", getUserIdLocal());

  const res = await fetch(`${API_BASE}/learn/`, {
    method: "POST",
    body: form,
  });

  return res.json();
}

/* ---------- Deep Research (Agentic RAG) ---------- */
export async function deepResearch(question) {
  const form = new FormData();
  form.append("question", question);
  form.append("user_id", getUserIdLocal());

  const res = await fetch(`${API_BASE}/deep-research/`, {
    method: "POST",
    body: form,
  });

  return res.json();
}

/* ---------- Follow-up Chat ---------- */
export async function followUpChat(topic, question, context = "", mode = "chat") {
  const form = new FormData();
  form.append("topic", topic);
  form.append("question", question);
  form.append("context", context);
  form.append("mode", mode);
  form.append("user_id", getUserIdLocal());

  const res = await fetch(`${API_BASE}/follow-up/`, {
    method: "POST",
    body: form,
  });

  return res.json();
}

/* ---------- Progress Tracking ---------- */
export async function trackProgress(topic, activityType, score = null, total = null) {
  const form = new FormData();
  form.append("user_id", getUserId());
  form.append("topic", topic);
  form.append("activity_type", activityType);
  if (score !== null) form.append("score", score);
  if (total !== null) form.append("total", total);

  const res = await fetch(`${API_BASE}/track-progress/`, {
    method: "POST",
    body: form,
  });

  return res.json();
}

export async function getProgress() {
  const res = await fetch(`${API_BASE}/progress/${getUserId()}`);
  return res.json();
}

export async function getRecommendations() {
  const res = await fetch(`${API_BASE}/recommendations/${getUserId()}`);
  return res.json();
}

export async function getAnalytics() {
  const res = await fetch(`${API_BASE}/analytics/${getUserId()}`);
  return res.json();
}

export async function getPerformance() {
  const res = await fetch(`${API_BASE}/performance/${getUserId()}`);
  return res.json();
}

/* ---------- Project Assistant ---------- */
export async function getProjectIdeas(subjects) {
  const form = new FormData();
  form.append("subjects", subjects);

  const res = await fetch(`${API_BASE}/project-ideas/`, {
    method: "POST",
    body: form,
  });

  return res.json();
}

export async function getProjectDetail(projectTitle, stage = "detailed") {
  const form = new FormData();
  form.append("project_title", projectTitle);
  form.append("stage", stage);

  const res = await fetch(`${API_BASE}/project-detail/`, {
    method: "POST",
    body: form,
  });

  return res.json();
}

/* ---------- Research Assistant ---------- */
export async function researchTopic(topic, includePapers = true) {
  const form = new FormData();
  form.append("topic", topic);
  form.append("include_papers", includePapers);

  const res = await fetch(`${API_BASE}/research/`, {
    method: "POST",
    body: form,
  });

  return res.json();
}

export async function searchPapers(query) {
  const form = new FormData();
  form.append("query", query);

  const res = await fetch(`${API_BASE}/search-papers/`, {
    method: "POST",
    body: form,
  });

  return res.json();
}

/* ---------- Tech Stack Assistant ---------- */
export async function getTechStack(projectType, requirements = "") {
  const form = new FormData();
  form.append("project_type", projectType);
  form.append("requirements", requirements);

  const res = await fetch(`${API_BASE}/tech-stack/`, {
    method: "POST",
    body: form,
  });

  return res.json();
}

export async function compareTech(tech1, tech2, context = "") {
  const form = new FormData();
  form.append("tech1", tech1);
  form.append("tech2", tech2);
  form.append("context", context);

  const res = await fetch(`${API_BASE}/compare-tech/`, {
    method: "POST",
    body: form,
  });

  return res.json();
}

export async function explainTech(concept, depth = "intermediate") {
  const form = new FormData();
  form.append("concept", concept);
  form.append("depth", depth);

  const res = await fetch(`${API_BASE}/explain-tech/`, {
    method: "POST",
    body: form,
  });

  return res.json();
}

export async function getCodeHelp(task, technology) {
  const form = new FormData();
  form.append("task", task);
  form.append("technology", technology);

  const res = await fetch(`${API_BASE}/code-help/`, {
    method: "POST",
    body: form,
  });

  return res.json();
}