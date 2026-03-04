from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback
from typing import Optional, List
from backend.db_manager import init_db, add_user, get_user, store_history, get_history

app = FastAPI(title="Multimodal AI Teaching Assistant")

# ---------- CORS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- ERROR HANDLER ----------
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print(f"❌ Error: {exc}")
    print(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={
            "stage": "ERROR",
            "content": f"Server error: {str(exc)}"
        }
    )

# ---------- ROOT ----------
@app.get("/")
def root():
    return {
        "status": "Backend running",
        "version": "2.0",
        "description": "Multimodal AI Teaching Assistant - AI & Data Science Department",
        "endpoints": {
            "syllabus": ["/upload-syllabus/"],
            "learning": ["/learn/", "/lab/", "/ask/"],
            "project": ["/project-ideas/", "/project-detail/"],
            "research": ["/research/", "/search-papers/"],
            "tech_stack": ["/tech-stack/", "/compare-tech/", "/explain-tech/", "/code-help/"]
        }
    }

# ---------- HEALTH CHECK ----------
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# ---------- AUTHENTICATION ----------
@app.post("/auth/signup")
def signup(name: str = Form(...), roll_no: str = Form(...), password: str = Form(None)):
    success = add_user(name, roll_no, password)
    if success:
        return {"status": "success", "message": "User created successfully"}
    else:
        raise HTTPException(status_code=400, detail="User with this roll number already exists")

@app.post("/auth/login")
def login(roll_no: str = Form(...)):
    user = get_user(roll_no)
    if user:
        return {
            "status": "success", 
            "user": {
                "name": user["name"], 
                "roll_no": user["roll_no"]
            }
        }
    else:
        raise HTTPException(status_code=404, detail="User not found. Please sign up.")

# ---------- HISTORY ----------
@app.get("/history/{user_id}")
def get_user_history(user_id: str):
    history = get_history(user_id)
    return {"history": history}

# ---------- UPLOAD SYLLABUS ----------
@app.post("/upload-syllabus/")
def upload_syllabus(file: UploadFile = File(...)):
    try:
        from backend.rag.syllabus_uploader import extract_text_from_pdf
        from backend.rag.chunker import chunk_text
        from backend.rag.vector_store import get_vector_store

        print(f"🚀 START: Uploading '{file.filename}'")
        
        print("🔍 Step 1: Extracting text from PDF...")
        text = extract_text_from_pdf(file)
        print(f"✅ Text extracted ({len(text)} characters)")

        if not text.strip():
            print("⚠️ No text found in PDF")
            return {"error": "No extractable text found in PDF", "message": "Please ensure the PDF contains text"}

        print("✂️ Step 2: Chunking text...")
        chunks = chunk_text(text)
        print(f"✅ Chunked into {len(chunks)} fragments")

        print("🏗️ Step 3: Generating embeddings and indexing...")
        get_vector_store(chunks)
        print("✅ Indexing complete!")

        return {"status": "success", "message": f"Syllabus '{file.filename}' uploaded and indexed."}
    except Exception as e:
        print(f"❌ Upload error: {e}")
        traceback.print_exc()
        return {"error": str(e)}

# ---------- LEARNING AGENT ----------
@app.post("/learn/")
def learn(
    topic: str = Form(...), 
    stage: str = Form("explain"),
    user_id: str = Form("default_user")
):
    try:
        from backend.rag.retriever import get_retriever
        from backend.agents.learning_agent import learning_flow
        from backend.agents.progress_agent import track_activity

        print(f"📚 Learning request: topic={topic}, stage={stage}, user={user_id}")
        context = ""
        try:
            retriever = get_retriever()
            docs = retriever.invoke(topic)
            if docs:
                context = "\n\n".join(d.page_content for d in docs)
        except Exception as e:
            print(f"⚠️ Retriever not available: {e}")
        
        if not context:
            context = f"No syllabus has been uploaded yet. The student is asking about: {topic}. Inform the student that they should upload their syllabus PDF first for accurate, course-specific answers."

        result = learning_flow(context, topic, stage)
        try:
            track_activity(user_id, topic, stage)
            store_history(user_id, "learning", topic, str(result.get("content", "")), topic)
        except: pass
        return result
    except Exception as e:
        print(f"❌ Learning error: {e}")
        return {"stage": "ERROR", "content": str(e)}

# ---------- AGENTIC RAG ----------
@app.post("/deep-research/")
def deep_research(
    question: str = Form(...),
    user_id: str = Form("default_user")
):
    try:
        from backend.agents.agentic_rag import agentic_answer
        from backend.agents.progress_agent import track_activity

        print(f"🧠 Agentic RAG request: {question}")
        result = agentic_answer(question)
        try:
            track_activity(user_id, question, "deep_research")
            store_history(user_id, "search", question, result.get("content", ""), "Deep Research")
        except: pass
        return {
            "stage": "DEEP_RESEARCH",
            "content": result.get("answer", ""),
            "reasoning_trace": result.get("reasoning_trace", []),
            "sub_queries": result.get("sub_queries", []),
            "iterations": result.get("iterations", 1),
            "sources_used": result.get("sources_used", 0)
        }
    except Exception as e:
        print(f"❌ Agentic RAG error: {e}")
        return {"stage": "ERROR", "content": str(e)}

# ---------- FOLLOW-UP CHAT ----------
@app.post("/follow-up/")
def follow_up_chat(
    topic: str = Form(...),
    question: str = Form(...),
    context: str = Form(""),
    mode: str = Form("chat"),
    user_id: str = Form("default_user")
):
    try:
        from backend.rag.retriever import get_retriever
        from backend.agents.qa_agent import generate_answer, GENERAL_PROMPT
        from backend.agents.learning_agent import learning_flow
        from backend.agents.agentic_rag import agentic_answer
        from backend.agents.progress_agent import track_activity

        print(f"💬 Follow-up [{mode}]: topic={topic}")
        syllabus_context = ""
        try:
            retriever = get_retriever()
            docs = retriever.invoke(f"{topic} {question}")
            if docs:
                syllabus_context = "\n\n".join(d.page_content for d in docs[:3])
        except: pass

        combined_context = f"Topic: {topic}\n\nSyllabus:\n{syllabus_context}\n\nChat:\n{context}"

        if mode == "videos":
            search_query = topic.replace(" ", "+")
            content = f"### 🎥 Recommended YouTube Resources for **{topic}**\n\n1. [Tutorial](https://www.youtube.com/results?search_query={search_query})\n2. [Crash Course](https://www.youtube.com/results?search_query={search_query}+explained)"
            return {"stage": "VIDEOS", "content": content}
        
        if mode == "quiz":
            return learning_flow(combined_context, topic, "quiz")
        
        if mode == "agentic":
            return agentic_answer(question)

        if mode == "diagram":
            diagram_prompt = f"""Generate a clear, professional Mermaid diagram to visualize the concept of **{topic}**.
            
            STRUCTURE:
            1. **Diagram**: Provide a high-quality Mermaid.js code block (e.g., flowchart TD, sequenceDiagram, classDiagram, etc.).
            2. **Explanation**: Provide a detailed, step-by-step explanation of what the diagram shows and how the components interact.
            
            RULES:
            - Respond ONLY with the Mermaid diagram and the explanation.
            - Do NOT include any introductory or concluding filler.
            - Ensure the Mermaid code is valid and well-commented.
            - The explanation should be clear and academic.
            
            Question context: {question}
            """
            answer = generate_answer(combined_context, diagram_prompt, system_prompt=GENERAL_PROMPT)
            try:
                store_history(user_id, "chat", question, answer, topic)
            except: pass
            return {"stage": "DIAGRAM", "content": answer}

        prompt = f"User asks about {topic}: {question}\n\nContext:\n{combined_context}"
        answer = generate_answer(combined_context, prompt, system_prompt=GENERAL_PROMPT)
        try:
            store_history(user_id, "chat", question, answer, topic)
        except: pass
        return {"stage": mode.upper(), "content": answer}
    except Exception as e:
        return {"stage": "ERROR", "content": str(e)}

# ---------- LAB AGENT ----------
@app.post("/lab/")
def lab_agent(
    experiment: str = Form(...),
    step: str = Form("explanation"),
    user_id: str = Form("default_user"),
):
    try:
        from backend.agents.lab_agent import generate_lab_explanation
        from backend.rag.retriever import get_retriever
        from backend.agents.progress_agent import track_activity

        print(f"🔬 Lab request: {experiment}")
        context = ""
        try:
            retriever = get_retriever()
            docs = retriever.invoke(experiment)
            if docs:
                context = "\n\n".join(d.page_content for d in docs)
        except: pass

        if not context:
            context = f"Experiment: {experiment}. Provide comprehensive explanation."

        result = generate_lab_explanation(context, experiment, step)
        try:
            track_activity(user_id, experiment, "lab")
            store_history(user_id, "lab", f"{experiment} ({step})", result.get("content", ""), experiment)
        except: pass
        return result
    except Exception as e:
        return {"stage": "ERROR", "content": str(e)}

# ---------- QA ENDPOINT ----------
@app.post("/ask/")
def ask_question(question: str = Form(...), user_id: str = Form("default_user")):
    try:
        from backend.agents.qa_agent import generate_answer
        from backend.rag.retriever import get_retriever
        retriever = get_retriever()
        docs = retriever.invoke(question)
        context = "\n\n".join(d.page_content for d in docs) if docs else "General knowledge."
        answer = generate_answer(context, question)
        try:
            store_history(user_id, "search", question, answer, "General QA")
        except: pass
        return {"answer": answer}
    except Exception as e:
        return {"answer": f"Error: {str(e)}"}

# ---------- PROGRESS TRACKING ----------
@app.post("/track-progress/")
async def track_progress(
    user_id: str = Form(...),
    topic: str = Form(...),
    activity_type: str = Form(...),
    score: Optional[int] = Form(None),
    total: Optional[int] = Form(None)
):
    from backend.agents.progress_agent import track_activity
    return track_activity(user_id, topic, activity_type, score, total)

@app.get("/progress/{user_id}")
async def get_progress(user_id: str):
    from backend.agents.progress_agent import get_user_progress
    return get_user_progress(user_id)

@app.get("/recommendations/{user_id}")
async def get_user_recommendations(user_id: str):
    from backend.agents.progress_agent import get_recommendations
    return {"recommendations": get_recommendations(user_id)}

@app.get("/analytics/{user_id}")
async def get_user_analytics(user_id: str):
    from backend.agents.progress_agent import get_analytics
    return get_analytics(user_id)

# ---------- PROJECTS ----------
@app.post("/project-ideas/")
def project_ideas(subjects: str = Form(...), user_id: str = Form("default_user")):
    try:
        from backend.agents.project_agent import generate_project_ideas
        result = generate_project_ideas(subjects)
        try:
            store_history(user_id, "project", subjects, str(result), "Project Ideas")
        except: pass
        return result
    except Exception as e:
        return {"stage": "ERROR", "content": str(e)}

@app.post("/project-detail/")
def project_detail(project_title: str = Form(...), stage: str = Form("detailed")):
    try:
        from backend.agents.project_agent import get_project_info
        return get_project_info(project_title, stage)
    except Exception as e:
        return {"stage": "ERROR", "content": str(e)}

# ---------- RESEARCH ----------
@app.post("/research/")
def research_topic(topic: str = Form(...), include_papers: bool = Form(True), user_id: str = Form("default_user")):
    try:
        from backend.agents.research_agent import research
        result = research(topic, include_papers)
        try:
            store_history(user_id, "research", topic, str(result.get("content", "")), topic)
        except: pass
        return result
    except Exception as e:
        return {"stage": "ERROR", "content": str(e)}

@app.post("/search-papers/")
def search_research_papers(query: str = Form(...)):
    try:
        from backend.agents.research_agent import search_papers
        return search_papers(query)
    except Exception as e:
        return {"stage": "ERROR", "content": str(e)}

# ---------- TECH STACK ----------
@app.post("/tech-stack/")
def tech_stack_recommendation(project_type: str = Form(...), requirements: str = Form(""), user_id: str = Form("default_user")):
    try:
        from backend.agents.tech_stack_agent import recommend_tech_stack
        result = recommend_tech_stack(project_type, requirements)
        try:
            store_history(user_id, "tech_stack", f"Tech stack for: {project_type}", str(result.get('recommendations', '')), "Tech Stack")
        except: pass
        return result
    except Exception as e:
        return {"stage": "ERROR", "content": str(e)}

@app.post("/compare-tech/")
def compare_technologies(tech1: str = Form(...), tech2: str = Form(...), context: str = Form(""), user_id: str = Form("default_user")):
    try:
        from backend.agents.tech_stack_agent import compare_tech
        result = compare_tech(tech1, tech2, context)
        try:
            store_history(user_id, "tech_stack", f"Compare: {tech1} vs {tech2}", str(result.get('comparison', '')), "Tech Compare")
        except: pass
        return result
    except Exception as e:
        return {"stage": "ERROR", "content": str(e)}

@app.post("/explain-tech/")
def explain_technology(concept: str = Form(...), depth: str = Form("intermediate"), user_id: str = Form("default_user")):
    try:
        from backend.agents.tech_stack_agent import explain_tech
        result = explain_tech(concept, depth)
        try:
            store_history(user_id, "tech_stack", f"Explain: {concept} ({depth})", str(result.get('explanation', '')), "Tech Explain")
        except: pass
        return result
    except Exception as e:
        return {"stage": "ERROR", "content": str(e)}

@app.post("/code-help/")
def code_help(task: str = Form(...), technology: str = Form(...), user_id: str = Form("default_user")):
    try:
        from backend.agents.tech_stack_agent import get_code_help
        result = get_code_help(task, technology)
        try:
            store_history(user_id, "tech_stack", f"Code help: {task} ({technology})", str(result.get('guidance', '')), "Code Help")
        except: pass
        return result
    except Exception as e:
        return {"stage": "ERROR", "content": str(e)}

@app.get("/performance/{user_id}")
async def performance_analysis(user_id: str):
    from backend.agents.performance_analyzer import get_performance_analysis
    return get_performance_analysis(user_id)

@app.on_event("startup")
async def startup_event():
    init_db()
    print("Backend Started Successfully")
