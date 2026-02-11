from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback


# ---------- RAG ----------
from backend.rag.syllabus_uploader import extract_text_from_pdf
from backend.rag.chunker import chunk_text
from backend.rag.vector_store import get_vector_store
from backend.rag.retriever import get_retriever

# ---------- AGENTS ----------
from backend.agents.learning_agent import learning_flow
from backend.agents.lab_agent import generate_lab_explanation

# ---------- NEW AGENTS: Project & Research Assistant ----------
from backend.agents.project_agent import generate_project_ideas, get_project_info
from backend.agents.research_agent import research, search_papers
from backend.agents.tech_stack_agent import (
    recommend_tech_stack,
    compare_tech,
    explain_tech,
    get_code_help
)



from backend.agents.progress_agent import (
    track_activity,
    get_user_progress,
    get_recommendations,
    get_analytics
)
from backend.agents.performance_analyzer import get_performance_analysis
from backend.agents.agentic_rag import agentic_answer
from typing import Optional

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

# ---------- UPLOAD SYLLABUS ----------
@app.post("/upload-syllabus/")
async def upload_syllabus(file: UploadFile = File(...)):
    try:
        print(f"📄 Uploading: {file.filename}")
        
        text = extract_text_from_pdf(file)

        if not text.strip():
            return {
                "error": "No extractable text found in PDF",
                "message": "Please ensure the PDF contains text (not just images)"
            }

        chunks = chunk_text(text)
        get_vector_store(chunks)

        print(f"✅ Syllabus indexed: {len(chunks)} chunks")

        return {
            "message": "Syllabus indexed successfully",
            "chunks": len(chunks),
            "filename": file.filename
        }
    
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return {
            "error": str(e),
            "message": "Failed to process PDF"
        }

# ---------- LEARNING AGENT ----------
@app.post("/learn/")
async def learn(
    topic: str = Form(...), 
    stage: str = Form("explain"),
    user_id: str = Form("default_user")
):
    try:
        print(f"📚 Learning request: topic={topic}, stage={stage}, user={user_id}")
        
        # Try to get syllabus context, but work without it if not available
        context = ""
        try:
            retriever = get_retriever()
            docs = retriever.invoke(topic)
            if docs:
                context = "\n\n".join(d.page_content for d in docs)
                print(f"✅ Syllabus context retrieved: {len(context)} chars")
        except Exception as e:
            print(f"⚠️ Retriever not available: {e}")
        
        # If no syllabus context, use general knowledge prompt
        if not context:
            context = f"Topic: {topic}. Provide comprehensive educational content based on general knowledge about this topic in AI, Data Science, Machine Learning, or Big Data."
            print("📝 Using general knowledge (no syllabus)")
        
        # Generate response
        result = learning_flow(context, topic, stage)
        print(f"✅ Learning flow completed: stage={result.get('stage')}")
        
        # Track progress
        try:
            track_activity(user_id, topic, stage)
            print(f"📊 Progress tracked for {user_id}")
        except Exception as e:
            print(f"⚠️ Progress tracking failed: {e}")
        
        return result
    
    except Exception as e:
        print(f"❌ Learning error: {e}")
        print(traceback.format_exc())
        
        return {
            "stage": "ERROR",
            "content": f"⚠️ Error processing request: {str(e)}"
        }

# ---------- AGENTIC RAG (Deep Research) ----------
@app.post("/deep-research/")
async def deep_research(
    question: str = Form(...),
    user_id: str = Form("default_user")
):
    """
    Agentic RAG endpoint for complex questions.
    Uses multi-step reasoning with:
    - Query planning (breaks question into sub-queries)
    - Multi-query retrieval (searches multiple times)
    - Self-evaluation (checks answer quality)
    - Iterative refinement (improves if needed)
    """
    try:
        print(f"🧠 Agentic RAG request: question={question}, user={user_id}")
        
        result = agentic_answer(question, use_planning=True)
        
        print(f"✅ Agentic RAG completed: iterations={result.get('iterations')}, sources={result.get('sources_used')}")
        
        # Track progress
        try:
            track_activity(user_id, question, "deep_research")
            print(f"📊 Deep research tracked for {user_id}")
        except Exception as e:
            print(f"⚠️ Progress tracking failed: {e}")
        
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
        print(traceback.format_exc())
        return {
            "stage": "ERROR",
            "content": f"⚠️ Error: {str(e)}",
            "reasoning_trace": []
        }

# ---------- LAB AGENT ----------
@app.post("/lab/")
async def lab_agent(
    experiment: str = Form(...),
    step: str = Form("explanation"),
    user_id: str = Form("default_user"),
):
    try:
        print(f"🔬 Lab request: experiment={experiment}, step={step}, user={user_id}")
        
        # Try to get syllabus context, but work without it if not available
        context = ""
        try:
            retriever = get_retriever()
            docs = retriever.invoke(experiment)
            if docs:
                context = "\n\n".join(d.page_content for d in docs)
                print(f"✅ Syllabus context retrieved: {len(context)} chars")
        except Exception as e:
            print(f"⚠️ Retriever not available: {e}")
        
        # If no syllabus context, use general knowledge prompt
        if not context:
            context = f"Experiment: {experiment}. Provide a comprehensive explanation based on general knowledge about this topic in AI/Data Science/Big Data."
            print("📝 Using general knowledge (no syllabus)")

        result = generate_lab_explanation(
            context=context,
            experiment_title=experiment,
            step=step,
        )
        
        print(f"✅ Lab flow completed: stage={result.get('stage')}")
        
        # Track progress
        try:
            track_activity(user_id, experiment, "lab")
            print(f"📊 Lab progress tracked for {user_id}")
        except Exception as e:
            print(f"⚠️ Progress tracking failed: {e}")
        
        return result
    
    except Exception as e:
        print(f"❌ Lab error: {e}")
        import traceback
        print(traceback.format_exc())
        return {
            "stage": "ERROR",
            "content": f"⚠️ Error: {str(e)}"
        }

# ---------- QA ENDPOINT (OPTIONAL) ----------
@app.post("/ask/")
async def ask_question(question: str = Form(...)):
    try:
        print(f"❓ Question: {question}")
        
        from backend.agents.qa_agent import generate_answer
        
        retriever = get_retriever()
        docs = retriever.invoke(question)

        if not docs:
            return {
                "answer": "⚠️ No relevant information found in syllabus for this question."
            }

        context = "\n\n".join(d.page_content for d in docs)
        answer = generate_answer(context, question)
        
        return {"answer": answer}
    
    except Exception as e:
        print(f"❌ QA error: {e}")
        return {
            "answer": f"⚠️ Error: {str(e)}"
        }
        
        
        
        
        # ---------- PROGRESS TRACKING ----------
@app.post("/track-progress/")
async def track_progress(
    user_id: str = Form(...),
    topic: str = Form(...),
    activity_type: str = Form(...),
    score: Optional[int] = Form(None),
    total: Optional[int] = Form(None)
):
    """Track user learning activity"""
    return track_activity(
        user_id=user_id,
        topic=topic,
        activity_type=activity_type,
        score=score,
        total=total
    )

@app.get("/progress/{user_id}")
async def get_progress(user_id: str):
    """Get user's complete progress"""
    return get_user_progress(user_id)

@app.get("/recommendations/{user_id}")
async def get_user_recommendations(user_id: str):
    """Get personalized study recommendations"""
    recs = get_recommendations(user_id)
    return {"recommendations": recs}

@app.get("/analytics/{user_id}")
async def get_user_analytics(user_id: str):
    """Get analytics for charts and visualization"""
    return get_analytics(user_id)

# ============================================================
# PROJECT ASSISTANT ENDPOINTS
# ============================================================

@app.post("/project-ideas/")
async def project_ideas(
    subjects: str = Form(..., description="Comma-separated subjects, e.g., 'Machine Learning, Data Structures'")
):
    """Generate project ideas based on subjects from syllabus"""
    try:
        print(f"💡 Project ideas request: subjects={subjects}")
        result = generate_project_ideas(subjects)
        print(f"✅ Generated {len(result.get('projects', []))} project ideas")
        return result
    except Exception as e:
        print(f"❌ Project ideas error: {e}")
        return {
            "stage": "ERROR",
            "content": f"⚠️ Error: {str(e)}"
        }

@app.post("/project-detail/")
async def project_detail(
    project_title: str = Form(..., description="Title of the project"),
    stage: str = Form("detailed", description="Stage: detailed, roadmap, or concepts")
):
    """Get detailed information about a specific project"""
    try:
        print(f"📋 Project detail request: {project_title}, stage={stage}")
        result = get_project_info(project_title, stage)
        return result
    except Exception as e:
        print(f"❌ Project detail error: {e}")
        return {
            "stage": "ERROR",
            "content": f"⚠️ Error: {str(e)}"
        }

# ============================================================
# RESEARCH ASSISTANT ENDPOINTS
# ============================================================

@app.post("/research/")
async def research_topic(
    topic: str = Form(..., description="Topic to research"),
    include_papers: bool = Form(True, description="Whether to fetch external papers")
):
    """Research a topic with syllabus context and external papers"""
    try:
        print(f"🔬 Research request: {topic}")
        result = research(topic, include_papers)
        print(f"✅ Research complete: {len(result.get('papers', []))} papers found")
        return result
    except Exception as e:
        print(f"❌ Research error: {e}")
        return {
            "stage": "ERROR",
            "content": f"⚠️ Error: {str(e)}"
        }

@app.post("/search-papers/")
async def search_research_papers(
    query: str = Form(..., description="Search query for papers")
):
    """Search for academic papers from arXiv and Semantic Scholar"""
    try:
        print(f"📄 Paper search: {query}")
        result = search_papers(query)
        print(f"✅ Found {len(result.get('papers', []))} papers")
        return result
    except Exception as e:
        print(f"❌ Paper search error: {e}")
        return {
            "stage": "ERROR",
            "content": f"⚠️ Error: {str(e)}"
        }

# ============================================================
# TECH STACK ASSISTANT ENDPOINTS
# ============================================================

@app.post("/tech-stack/")
async def tech_stack_recommendation(
    project_type: str = Form(..., description="Type of project, e.g., 'web_app', 'ml_project'"),
    requirements: str = Form("", description="Specific requirements or constraints")
):
    """Get tech stack recommendations for a project type"""
    try:
        print(f"🛠️ Tech stack request: {project_type}")
        result = recommend_tech_stack(project_type, requirements)
        return result
    except Exception as e:
        print(f"❌ Tech stack error: {e}")
        return {
            "stage": "ERROR",
            "content": f"⚠️ Error: {str(e)}"
        }

@app.post("/compare-tech/")
async def compare_technologies(
    tech1: str = Form(..., description="First technology"),
    tech2: str = Form(..., description="Second technology"),
    context: str = Form("", description="Use case context")
):
    """Compare two technologies with pros and cons"""
    try:
        print(f"⚖️ Compare: {tech1} vs {tech2}")
        result = compare_tech(tech1, tech2, context)
        return result
    except Exception as e:
        print(f"❌ Compare error: {e}")
        return {
            "stage": "ERROR",
            "content": f"⚠️ Error: {str(e)}"
        }

@app.post("/explain-tech/")
async def explain_technology(
    concept: str = Form(..., description="Technical concept to explain"),
    depth: str = Form("intermediate", description="Depth: beginner, intermediate, advanced")
):
    """Explain a technical concept in depth"""
    try:
        print(f"📖 Explain: {concept} ({depth})")
        result = explain_tech(concept, depth)
        return result
    except Exception as e:
        print(f"❌ Explain error: {e}")
        return {
            "stage": "ERROR",
            "content": f"⚠️ Error: {str(e)}"
        }

@app.post("/code-help/")
async def code_help(
    task: str = Form(..., description="What you're trying to do"),
    technology: str = Form(..., description="Technology being used")
):
    """Get code guidance and patterns (not full implementation)"""
    try:
        print(f"💻 Code help: {task} with {technology}")
        result = get_code_help(task, technology)
        return result
    except Exception as e:
        print(f"❌ Code help error: {e}")
        return {
            "stage": "ERROR",
            "content": f"⚠️ Error: {str(e)}"
        }


# ============================================================
# PROGRESS & PERFORMANCE TRACKING
# ============================================================

@app.get("/progress/{user_id}")
async def get_progress(user_id: str):
    """Get user's learning progress"""
    try:
        progress = get_user_progress(user_id)
        return progress
    except Exception as e:
        print(f"❌ Progress error: {e}")
        return {"error": str(e)}

@app.get("/recommendations/{user_id}")
async def recommendations(user_id: str):
    """Get personalized learning recommendations"""
    try:
        recs = get_recommendations(user_id)
        return recs
    except Exception as e:
        print(f"❌ Recommendations error: {e}")
        return {"recommendations": []}

@app.get("/analytics/{user_id}")
async def analytics(user_id: str):
    """Get learning analytics"""
    try:
        data = get_analytics(user_id)
        return data
    except Exception as e:
        print(f"❌ Analytics error: {e}")
        return {"error": str(e)}

@app.get("/performance/{user_id}")
async def performance_analysis(user_id: str):
    """
    Get ML-based performance analysis including:
    - Strong/weak topic identification
    - Exam performance prediction
    - Personalized focus areas
    - Learning style analysis
    """
    try:
        print(f"📊 Performance analysis for: {user_id}")
        analysis = get_performance_analysis(user_id)
        return analysis
    except Exception as e:
        print(f"❌ Performance analysis error: {e}")
        import traceback
        print(traceback.format_exc())
        return {
            "status": "error",
            "message": f"Error analyzing performance: {str(e)}"
        }


# ---------- STARTUP EVENT ----------
@app.on_event("startup")
async def startup_event():
    print("\n" + "="*50)
    print("🎓 Multimodal AI Teaching Assistant")
    print("   AI & Data Science Department")
    print("="*50)
    print("📚 Features: Theory, Lab, Projects, Research, Tech Stack")
    print("✅ Server started")
    print("📍 Running on: http://127.0.0.1:8000")
    print("📖 API Docs: http://127.0.0.1:8000/docs")
    print("="*50 + "\n")

# ---------- SHUTDOWN EVENT ----------
@app.on_event("shutdown")
async def shutdown_event():
    print("\n👋 Server shutting down...")