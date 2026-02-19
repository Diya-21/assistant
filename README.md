# 🎓 Multimodal AI Teaching Assistant

A **syllabus-aware AI Teaching Assistant** built with **RAG (Retrieval-Augmented Generation)** that helps college students learn AI, Data Science, and Big Data. Upload your syllabus PDF and get personalized explanations, quizzes, lab help, project ideas, research papers, and progress tracking.

---

## 📋 Prerequisites

Before running, make sure you have:

| Requirement | Version | Check Command |
|---|---|---|
| **Python** | 3.10+ | `python --version` |
| **Node.js** | 18+ | `node -v` |
| **npm** | 9+ | `npm -v` |
| **Git** | Any | `git --version` |

---

## 🚀 How to Run (Step by Step)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Diya-21/assistant.git
cd assistant
```

### Step 2: Set Up Environment Variable

Create a `.env` file in the project root:

```bash
# .env
HF_API_TOKEN=your_huggingface_api_token_here
```

**How to get the token:**
1. Go to [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Create a free account (if you don't have one)
3. Click **"New token"** → Name it anything → Select **"Read"** access → Create
4. Copy the token (starts with `hf_...`) and paste it in the `.env` file

### Step 3: Install Backend Dependencies

```bash
pip install -r requirements.txt
```

This installs: FastAPI, Uvicorn, LangChain, ChromaDB, Sentence-Transformers, HuggingFace Hub, pdfplumber, etc.

> **Note:** The first run will download the embedding model (~80MB). This only happens once.

### Step 4: Start the Backend Server

```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8080 --reload
```

You should see:

```
🎓 Backend Started Successfully
INFO:     Uvicorn running on http://127.0.0.1:8080
INFO:     Application startup complete.
```

✅ **Verify:** Open [http://127.0.0.1:8080](http://127.0.0.1:8080) in your browser. You should see:
```json
{
  "status": "Backend running",
  "version": "2.0",
  "description": "Multimodal AI Teaching Assistant - AI & Data Science Department"
}
```

### Step 5: Install Frontend Dependencies

Open a **new terminal** (keep the backend running) and run:

```bash
cd frontend/frontend
npm install
```

### Step 6: Start the Frontend Dev Server

```bash
npm run dev
```

You should see:

```
VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### Step 7: Open the App

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🖥️ Using the Application

### 1. Login
- Enter your **Name** and **Roll Number**
- Click **Login** → You'll be redirected to the Dashboard

### 2. Upload Syllabus (Recommended First Step)
- Go to **Upload Syllabus** from the Dashboard or Navbar
- Upload a PDF of your course syllabus
- Wait for processing (extracts text → chunks → embeds → indexes)
- Once done, all agents will use your syllabus for context-aware answers

### 3. Learn Topics (Theory Page)
- Type any topic (e.g., "Neural Networks", "MapReduce", "Data Mining")
- **4-stage learning flow:**
  - 📘 **Explain** → Simple, beginner-friendly explanation
  - 🔬 **Deep Dive** → Technical details, formulas, architecture
  - 📚 **References** → Books, videos, practice resources
  - 🧠 **Quiz** → 5 MCQs to test your understanding

### 4. Lab Agent
- Enter an experiment name (e.g., "Implement K-Means Clustering")
- **5-stage lab flow:**
  - 📘 **What & Why** → Concept explanation with Mermaid flowchart
  - 🧠 **Algorithm** → Pseudocode with step-by-step logic
  - 🎤 **Viva Prep** → Q&A for viva preparation
  - 📝 **Summary** → Quick revision notes
  - 💬 **Discussion** → Chat with AI Lab Instructor for doubts

### 5. Project Assistant
- Enter subjects/topics → Get AI-generated project ideas
- Click a project → See detailed breakdown, roadmap, tech stack
- Use the **Chat** tab to ask follow-up questions

### 6. Research Assistant
- Enter a research topic → Get explanations + real papers from **arXiv** and **Semantic Scholar**

### 7. Tech Stack Assistant
- Get tech stack recommendations for your project type
- Compare two technologies side-by-side
- Get code guidance and concept explanations

### 8. Progress Tracker
- **Overview** → Mastery distribution, AI recommendations
- **Subject Tracker** → Per-topic progress rings and quiz history
- **Needs Attention** → Weak topics and AI-suggested focus areas
- **Achievements** → Unlock badges as you learn
- **AI Analysis** → Grade predictions, learning style, readiness score

---

## 📁 Project Structure

```
assistant/
├── .env                          # HF_API_TOKEN (Hugging Face)
├── requirements.txt              # Python dependencies
├── README.md                     # This file
│
├── backend/
│   ├── main.py                   # FastAPI app (all API endpoints)
│   ├── agents/
│   │   ├── qa_agent.py           # Core LLM interface (Mistral-7B via HF)
│   │   ├── learning_agent.py     # Theory learning flow (explain/deep/quiz)
│   │   ├── lab_agent.py          # Lab experiment assistant
│   │   ├── agentic_rag.py        # Multi-step RAG with self-correction
│   │   ├── project_agent.py      # Project idea generation
│   │   ├── research_agent.py     # Research + arXiv/Semantic Scholar
│   │   ├── tech_stack_agent.py   # Tech recommendations & comparisons
│   │   ├── progress_agent.py     # Activity tracking & achievements
│   │   └── performance_analyzer.py # ML-like performance predictions
│   └── rag/
│       ├── syllabus_uploader.py  # PDF text extraction (pdfplumber)
│       ├── chunker.py            # Text splitting (500 chars, 50 overlap)
│       ├── vector_store.py       # ChromaDB indexing + embeddings
│       └── retriever.py          # Similarity search (top-3 chunks)
│
├── frontend/frontend/
│   ├── package.json              # Node.js dependencies
│   ├── index.html                # Entry point
│   └── src/
│       ├── main.jsx              # React entry point
│       ├── App.jsx               # Routes + auth protection
│       ├── api/
│       │   └── backend.js        # All API calls to backend
│       ├── context/
│       │   └── AppContext.jsx     # Global state (auth, page persistence)
│       ├── components/
│       │   └── Navbar.jsx        # Navigation bar
│       ├── pages/
│       │   ├── Login.jsx         # Student login
│       │   ├── Dashboard.jsx     # Home dashboard
│       │   ├── UploadSyllabus.jsx
│       │   ├── LearningAgent.jsx # Theory page
│       │   ├── LabAgent.jsx      # Lab experiments
│       │   ├── QAAgent.jsx       # Q&A page
│       │   ├── ProjectAssistant.jsx
│       │   ├── ResearchAssistant.jsx
│       │   ├── TechStackAssistant.jsx
│       │   └── ProgressTracker.jsx # Analytics dashboard
│       └── styles/
│           ├── theme.css         # Design tokens & animations
│           └── layout.css        # Layout utilities
│
├── chroma_db/                    # ChromaDB vector storage (auto-created)
└── data/
    └── user_progress.json        # Student progress data (auto-created)
```

---

## ⚙️ Tech Stack Summary

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React + Vite | UI framework & dev server |
| **Routing** | React Router DOM | Client-side page navigation |
| **Styling** | Vanilla CSS + Inline styles | UI design & animations |
| **Markdown** | react-markdown + remark-gfm | Renders AI responses |
| **Backend** | FastAPI + Uvicorn | REST API server |
| **LLM** | Mistral-7B-Instruct-v0.2 | AI text generation (via Hugging Face API) |
| **Embeddings** | all-MiniLM-L6-v2 | Semantic text embeddings (runs locally) |
| **Vector DB** | ChromaDB | Stores & retrieves syllabus chunks |
| **RAG** | LangChain | Orchestrates retrieval pipeline |
| **PDF** | pdfplumber | Extracts text from syllabus PDFs |
| **Progress** | JSON file storage | Tracks student learning data |
| **Auth** | localStorage | Simple client-side authentication |

---

## 🔧 Quick Commands Reference

```bash
# Start backend (from project root)
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8080 --reload

# Start frontend (from frontend/frontend/)
cd frontend/frontend
npm run dev

# Check backend health
curl http://127.0.0.1:8080/health

# View API docs (auto-generated by FastAPI)
# Open: http://127.0.0.1:8080/docs
```

---

## ❓ Troubleshooting

| Problem | Solution |
|---|---|
| `HF_API_TOKEN not found` | Create `.env` file in project root with your token |
| `Model is loading...` | First API call warms up the model — wait 30 seconds and retry |
| Port 8080 already in use | Kill the process: `netstat -ano \| findstr :8080` then `taskkill /F /PID <PID>` |
| Frontend can't connect to backend | Ensure backend is running on port 8080 (not 8000) |
| PDF upload fails | Ensure the PDF contains selectable text (not scanned images) |
| ChromaDB errors | Delete `./chroma_db/` folder and re-upload syllabus |
| `npm install` fails | Delete `node_modules/` and `package-lock.json`, then run `npm install` again |

---

## 👩‍💻 Authors

- **Diya** — AI & Data Science Department

---

## 📄 License

This project is for educational purposes.
