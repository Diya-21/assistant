from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback
import re
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

@app.on_event("startup")
async def startup_event():
    print("🚀 Initializing database...")
    init_db()

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

# ---------- SYLLABUS STATUS ----------
@app.get("/syllabus-status/")
def get_syllabus_status():
    from backend.rag.vector_store import PERSIST_DIR
    import os, json
    
    status = {"uploaded": False, "filename": None, "pages": 0}
    meta_path = os.path.join(PERSIST_DIR, "syllabus_meta.json")
    
    if os.path.exists(PERSIST_DIR) and os.path.exists(meta_path):
        try:
            with open(meta_path, "r") as f:
                status = json.load(f)
                status["uploaded"] = True
        except: pass
    elif os.path.exists(PERSIST_DIR):
        # Fallback if meta missing but DB exists
        status["uploaded"] = len(os.listdir(PERSIST_DIR)) > 0
        
    return status

@app.get("/syllabus-units/")
def get_syllabus_units(user_id: str = "default_user"):
    """Returns all units/topics extracted from the syllabus for a heatmap view."""
    from backend.rag.retriever import get_retriever
    from backend.utils.coverage_tracker import _load_coverage
    import os
    
    retriever = get_retriever()
    if not retriever:
        return {"units": []}
    
    # Try to extract units from the vector store metadata
    try:
        # This is a bit advanced, but we can get it from the coverage tracker's units
        # Or better, just return the units we've seen in the system
        coverage = _load_coverage(user_id)
        studied_units = coverage.get("units_studied", {})
        
        # Mock some units if none exist yet to show the feature
        if not studied_units:
            return {"units": [
                {"name": "Unit 1: Intro", "mastery": 0},
                {"name": "Unit 2: Core", "mastery": 0},
                {"name": "Unit 3: Adv", "mastery": 0},
                {"name": "Unit 4: Lab", "mastery": 0},
                {"name": "Unit 5: Case Study", "mastery": 0}
            ]}
        
        # Map studied units
        units = []
        for u, count in studied_units.items():
            # Estimate mastery by count (max 100)
            mastery = min(100, count * 20)
            units.append({"name": u, "mastery": mastery})
            
        return {"units": units}
    except:
        return {"units": []}

# ---------- HISTORY ----------
@app.get("/history/{user_id}")
def get_user_history(user_id: str):
    history = get_history(user_id)
    return {"history": history}

# ---------- UPLOAD SYLLABUS ----------
@app.post("/upload-syllabus/")
def upload_syllabus(
    file: UploadFile = File(...),
    clear_previous: bool = Form(True)  # Default: replace old syllabus
):
    try:
        from backend.rag.syllabus_uploader import extract_text_from_pdf
        from backend.rag.chunker import chunk_text
        from backend.rag.vector_store import get_vector_store, get_embedding_model, PERSIST_DIR
        from langchain_chroma import Chroma
        import shutil

        print(f"🚀 START: Uploading '{file.filename}' (clear_previous={clear_previous})")
        
        print("🔍 Step 1: Extracting text from PDF (with page tracking)...")
        pages_data = extract_text_from_pdf(file)
        print(f"✅ Text extracted from {len(pages_data)} pages")

        if not pages_data:
            print("⚠️ No text found in PDF")
            return {"error": "No extractable text found in PDF", "message": "Please ensure the PDF contains text"}

        print("✂️ Step 2: Chunking text while preserving metadata...")
        chunks = chunk_text(pages_data)
        print(f"✅ Chunked into {len(chunks)} fragments with page mapping")

        if clear_previous:
            # RESET retriever before any deletion
            print("🗑️ Force-clearing previous syllabus data...")
            try:
                from backend.rag.retriever import reset_retriever
                reset_retriever()
                import gc, time
                gc.collect()
                time.sleep(0.5)
            except: pass
            
            get_vector_store(chunks)  # This now clears + re-indexes
        else:
            # ADD to existing data (for multi-subject uploads)
            print("📎 Adding to existing syllabus data...")
            embedding = get_embedding_model()
            import os
            os.makedirs(PERSIST_DIR, exist_ok=True)
            vectordb = Chroma.from_documents(
                documents=chunks,
                embedding=embedding,
                persist_directory=PERSIST_DIR
            )
            from backend.rag.retriever import reset_retriever
            reset_retriever()
        
        # Store metadata
        import json, os
        from datetime import datetime
        meta_path = os.path.join(PERSIST_DIR, "syllabus_meta.json")
        with open(meta_path, "w") as f:
            json.dump({"filename": file.filename, "pages": len(pages_data), "upload_date": str(datetime.now())}, f)

        print("✅ Indexing complete!")
        return {
            "status": "success", 
            "message": f"Syllabus '{file.filename}' uploaded and indexed with page mapping.",
            "pages": len(pages_data),
            "chunks": len(chunks)
        }
    except Exception as e:
        print(f"❌ Upload error: {e}")
        traceback.print_exc()
        return {"error": str(e)}

@app.post("/clear-syllabus/")
def clear_syllabus(clear_all: bool = Form(False)):
    """Clear all uploaded syllabus data. If clear_all=True, also resets user history/db."""
    try:
        import shutil, os, gc, time
        from backend.rag.vector_store import PERSIST_DIR
        from backend.rag.retriever import reset_retriever
        
        # Reset retriever and GC to release file locks
        reset_retriever()
        gc.collect()
        time.sleep(1) # Extra time for Windows
        
        if os.path.exists(PERSIST_DIR):
            success = False
            for i in range(5):
                try:
                    shutil.rmtree(PERSIST_DIR)
                    success = True
                    print("🗑️ All syllabus data cleared.")
                    break
                except Exception as e:
                    print(f"⚠️ Retry {i+1} clearing syllabus: {e}")
                    time.sleep(1)
            
            if not success:
                # Fallback: rename the folder if we can't delete it
                try:
                    temp_name = f"{PERSIST_DIR}_old_{int(time.time())}"
                    os.rename(PERSIST_DIR, temp_name)
                    success = True
                except: 
                    return {"status": "error", "message": "Could not clear syllabus due to file system locks. Please restart the backend server."}
            
            os.makedirs(PERSIST_DIR, exist_ok=True)
            
        if clear_all:
            from backend.db_manager import reset_db
            reset_db()
            print("🧹 User database reset.")
            
        return {"status": "success", "message": "Syllabus data cleared successfully."}
    except Exception as e:
        print(f"❌ Clear syllabus error: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/reset-db/")
def reset_user_database():
    """Explicitly reset the entire user database (history, users)."""
    try:
        from backend.db_manager import reset_db
        reset_db()
        return {"status": "success", "message": "All student history and progress have been reset."}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ---------- LEARNING AGENT ----------
@app.post("/learn/")
def learn(
    topic: str = Form(...), 
    stage: str = Form("explain"),
    user_id: str = Form("default_user"),
    unit: str = Form(None)
):
    try:
        from backend.rag.retriever import get_retriever
        from backend.agents.learning_agent import learning_flow
        from backend.agents.progress_agent import track_activity
        from backend.utils.syllabus_guard import apply_strict_filtration, SyllabusGuard
        from backend.utils.blooms_taxonomy import classify_blooms_level
        from backend.utils.coverage_tracker import record_topic_interaction

        print(f"📚 Learning request: topic={topic}, stage={stage}, unit={unit}")
        
        # --- BLOOM'S TAXONOMY (UNIQUE FEATURE) ---
        blooms = classify_blooms_level(topic)
        print(f"🧠 Bloom's Level: {blooms['level']} ({blooms['emoji']})")
        # ------------------------------------------
        
        context = ""
        citations = []
        filtered_data = []
        try:
            retriever = get_retriever()
            raw_docs = retriever.invoke(topic)
            print(f"📄 Retrieved {len(raw_docs)} raw docs from vector DB")
            
            filtered_data = apply_strict_filtration(raw_docs, topic, target_unit=unit)
            print(f"🔍 After filtration: {len(filtered_data)} docs")
            
            if filtered_data:
                context = "\n\n".join(d["content"] for d in filtered_data)
                citations = [{"content": d["content"], "page": d["metadata"].get("page"), "source": d["metadata"].get("source"), "unit": d["metadata"].get("unit"), "relevance": d["metadata"].get("relevance_score", 0)} for d in filtered_data]
                print(f"✅ Context length: {len(context)} chars")
        except Exception as e:
            print(f"⚠️ Retriever error: {e}")
            import traceback
            traceback.print_exc()
        
        if not context:
            context = "NO SYLLABUS DATA AVAILABLE. Tell the student to upload their syllabus PDF first."

        # --- SYLLABUS VERIFICATION (KEY DIFFERENTIATOR) ---
        verification = SyllabusGuard.verify_syllabus_compliance(topic, filtered_data)
        print(f"🔐 Verification: {verification['verification_status']}")
        # --------------------------------------------------

        if topic.lower() == "syllabus overview":
            print("🗺️ Syllabus Overview Requested")
            result = learning_flow(context, topic, "overview", verification=verification)
        elif stage == "explain":
            # --- AUTO-DETECT NUMERICALS ---
            numerical_keywords = ["solve", "calculate", "find the value", "compute", "numerical", "formula", "derive", "evaluate", "how many", "what is the value", "problem", "example"]
            has_numbers = bool(re.search(r'\d+', topic))
            has_keywords = any(kw in topic.lower() for kw in numerical_keywords)
            is_explicit_num = "numerical" in topic.lower() or "solve" in topic.lower()
            
            if (has_numbers and has_keywords) or is_explicit_num:
                print("🎯 Auto-detected Numerical Intent")
                from backend.agents.qa_agent import generate_answer, NUMERICAL_PROMPT
                # If they ask a specific problem initially, solve it. If they ask for an example, provide one.
                solve_prompt = f"Solve this numerical problem step by step: {topic}" if has_numbers else f"Provide a detailed step-by-step numerical problem and its solution for: {topic}"
                result_content = generate_answer(context, solve_prompt, system_prompt=NUMERICAL_PROMPT)
                result = {"stage": "NUMERICALS", "content": result_content}
            else:
                # --- AUTO-DETECT COMPLEXITY FOR AGENTIC RAG ---
                complex_keywords = ["architecture", "working", "mechanism", "how it works", "compare", "contrast", "difference", "relationship", "explain in detail", "contribution", "cross-module"]
                is_complex = len(topic.split()) > 6 or any(kw in topic.lower() for kw in complex_keywords)
                
                if is_complex:
                    print("🧠 Auto-detected Complex Query - Using Agentic RAG")
                    from backend.agents.agentic_rag import agentic_answer
                    agentic_res = agentic_answer(topic, target_unit=unit, strict=True)
                    result = {
                        "stage": "EXPLAIN",
                        "content": agentic_res.get("answer", ""),
                        "reasoning_trace": agentic_res.get("reasoning_trace", []),
                        "agentic": True
                    }
                else:
                    result = learning_flow(context, topic, stage, verification=verification)
        else:
            result = learning_flow(context, topic, stage, verification=verification)

        result["citations"] = citations
        result["blooms"] = blooms
        result["syllabus_verification"] = verification
        result["suggestions"] = SyllabusGuard.get_suggestions(topic, filtered_data)
        
        # --- COVERAGE TRACKING (UNIQUE FEATURE) ---
        try:
            record_topic_interaction(user_id, topic, unit)
            track_activity(user_id, topic, stage)
            store_history(user_id, "learning", topic, str(result.get("content", "")), topic)
        except: pass
        # -------------------------------------------
        
        return result
    except Exception as e:
        print(f"❌ Learning error: {e}")
        return {"stage": "ERROR", "content": str(e)}


# ---------- AGENTIC RAG ----------
@app.post("/deep-research/")
def deep_research(
    question: str = Form(...),
    user_id: str = Form("default_user"),
    unit: str = Form(None),
    strict: str = Form("true")
):
    try:
        from backend.agents.agentic_rag import agentic_answer
        from backend.agents.progress_agent import track_activity

        print(f"🧠 Agentic RAG request: {question} (Unit: {unit}, Strict: {strict})")
        is_strict = strict.lower() == "true"
        result = agentic_answer(question, target_unit=unit, strict=is_strict)
        try:
            track_activity(user_id, question, "deep_research")
            store_history(user_id, "search", question, result.get("answer", ""), "Deep Research")
        except: pass
        return {
            "stage": "DEEP_RESEARCH",
            "content": result.get("answer", ""),
            "reasoning_trace": result.get("reasoning_trace", []),
            "sub_queries": result.get("sub_queries", []),
            "iterations": result.get("iterations", 1),
            "sources_used": result.get("sources_used", 0),
            "citations": result.get("citations", [])
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
    strict: str = Form("true"),
    user_id: str = Form("default_user"),
    unit: str = Form(None)
):
    try:
        from backend.rag.retriever import get_retriever
        from backend.agents.qa_agent import generate_answer, GENERAL_PROMPT, NUMERICAL_PROMPT, STRICT_SYLLABUS_PROMPT, OPEN_SOURCE_PROMPT
        from backend.agents.learning_agent import learning_flow
        from backend.agents.agentic_rag import agentic_answer
        from backend.agents.progress_agent import track_activity
        from backend.utils.syllabus_guard import apply_strict_filtration, SyllabusGuard
        from backend.utils.blooms_taxonomy import classify_blooms_level
        from backend.utils.coverage_tracker import record_topic_interaction

        print(f"💬 Follow-up [{mode}]: topic={topic}, unit={unit}")
        
        blooms = classify_blooms_level(question)
        
        syllabus_context = ""
        citations = []
        filtered_data = []
        try:
            retriever = get_retriever()
            raw_docs = retriever.invoke(f"{topic} {question}")
            filtered_data = apply_strict_filtration(raw_docs, f"{topic} {question}", target_unit=unit)
            if filtered_data:
                syllabus_context = "\n\n".join(d["content"] for d in filtered_data[:5])
                citations = [{"content": d["content"], "page": d["metadata"].get("page"), "source": d["metadata"].get("source"), "unit": d["metadata"].get("unit"), "relevance": d["metadata"].get("relevance_score", 0)} for d in filtered_data]
        except: pass

        # --- SYLLABUS VERIFICATION ---
        verification = SyllabusGuard.verify_syllabus_compliance(question, filtered_data)
        suggestions = SyllabusGuard.get_suggestions(question, filtered_data)
        # -----------------------------

        combined_context = f"Topic: {topic}\n\nSyllabus:\n{syllabus_context}\n\nChat:\n{context}"

        try:
            record_topic_interaction(user_id, question, unit)
        except: pass

        if mode == "videos":
            # Extract high-quality keywords from syllabus context for search
            search_context = topic
            if filtered_data:
                meta = filtered_data[0].get('metadata', {})
                search_context = f"{meta.get('unit', '')} {topic}".strip()
            
            search_query = search_context.replace(" ", "+")
            content = f"### 🎥 Syllabus-Aligned Video Resources for **{topic}**\n\n"
            content += f"These resources are curated based on your **{search_context}** coursework:\n\n"
            content += f"1. [▶️ Comprehensive Tutorial: {topic}](https://www.youtube.com/results?search_query={search_query}+university+lecture)\n"
            content += f"2. [▶️ Concept Simplified: {topic}](https://www.youtube.com/results?search_query={search_query}+explained+engineering)"
            return {"stage": "VIDEOS", "content": content}
        
        if mode == "quiz":
            return learning_flow(combined_context, topic, "quiz", verification=verification)
        
        if mode == "summary":
            from backend.agents.qa_agent import SUMMARY_PROMPT
            summary_request = f"Provide a complete summary of our discussion about {topic}. Include the flowchart and the next topic recommendation as per your system rules."
            answer = generate_answer(combined_context, summary_request, system_prompt=SUMMARY_PROMPT)
            return {"stage": "SUMMARY", "content": answer, "citations": citations, "blooms": blooms, "syllabus_verification": verification, "suggestions": suggestions}
        
        if mode == "agentic":
            is_strict = strict.lower() == "true"
            result = agentic_answer(question, target_unit=unit, strict=is_strict)
            result["blooms"] = blooms
            result["syllabus_verification"] = verification
            return result

        if mode == "diagram":
            from backend.agents.qa_agent import DIAGRAM_PROMPT
            diagram_prompt = f"Create a clear, professional Mermaid diagram to visualize the concept of **{topic}**."
            answer = generate_answer(combined_context, diagram_prompt, system_prompt=DIAGRAM_PROMPT)
            return {"stage": "DIAGRAM", "content": answer, "citations": citations, "blooms": blooms, "syllabus_verification": verification, "suggestions": suggestions}

        # --- NUMERICALS MODE ---
        if mode == "numericals":
            num_prompt = f"Solve this numerical problem step by step about {topic}:\n\n{question}"
            answer = generate_answer(combined_context, num_prompt, system_prompt=NUMERICAL_PROMPT)
            return {"stage": "NUMERICALS", "content": answer, "citations": citations, "blooms": blooms, "syllabus_verification": verification, "suggestions": suggestions}

        # --- AUTO-DETECT NUMERICALS ---
        numerical_keywords = ["solve", "calculate", "find the value", "compute", "numerical", "formula", "derive", "evaluate", "how many", "what is the value", "problem", "example"]
        has_numbers = bool(re.search(r'\d+\.?\d*', question))
        has_keywords = any(kw in question.lower() for kw in numerical_keywords)
        is_explicit_num = "numerical" in question.lower() or "solve" in question.lower()
        
        if (has_numbers and has_keywords) or is_explicit_num:
            num_prompt = f"Solve this numerical problem step by step about {topic}:\n\n{question}"
            answer = generate_answer(combined_context, num_prompt, system_prompt=NUMERICAL_PROMPT)
            return {"stage": "NUMERICALS", "content": answer, "citations": citations, "blooms": blooms, "syllabus_verification": verification, "suggestions": suggestions}

        matched_unit = verification.get("matched_unit", "your syllabus")
        
        # Decide prompt based on strictness
        is_strict = strict.lower() == "true"
        active_prompt = STRICT_SYLLABUS_PROMPT if is_strict else OPEN_SOURCE_PROMPT
        
        print(f"🛠️  Using prompt: {'STRICT' if is_strict else 'OPEN SOURCE'}")

        prompt = f"The student asks about {topic} (Syllabus: {matched_unit}): {question}. Start by mentioning its relation to {matched_unit}."
        answer = generate_answer(combined_context, prompt, system_prompt=active_prompt)
        return {"stage": mode.upper(), "content": answer, "citations": citations, "blooms": blooms, "syllabus_verification": verification, "suggestions": suggestions}
    except Exception as e:
        return {"stage": "ERROR", "content": str(e)}

# ---------- LAB AGENT ----------
@app.post("/lab/")
def lab_agent(
    experiment: str = Form(...),
    step: str = Form("explanation"),
    user_id: str = Form("default_user"),
    unit: str = Form(None), # Added for customization
):
    try:
        from backend.agents.lab_agent import generate_lab_explanation
        from backend.rag.retriever import get_retriever
        from backend.agents.progress_agent import track_activity
        from backend.utils.syllabus_guard import apply_strict_filtration, SyllabusGuard

        print(f"🔬 Lab request: {experiment} (Unit: {unit})")
        
        # --- SMART QUERY EXPANSION ---
        # If the user types something short like "AAI exp 4", expand the query
        exp_match = re.search(r'(?:exp(?:eriment)?)\s*(\d+)', experiment.lower())
        subject_match = re.search(r'^([a-zA-Z]+)\s+exp', experiment.lower())
        
        search_queries = [experiment]  # Primary query
        
        if exp_match:
            exp_num = exp_match.group(1)
            # Add expanded queries for better retrieval
            search_queries.append(f"experiment {exp_num}")
            search_queries.append(f"experiment number {exp_num}")
            if subject_match:
                subject = subject_match.group(1).upper()
                search_queries.append(f"{subject} experiment {exp_num}")
                search_queries.append(f"{subject} lab {exp_num}")
        
        # Auto-detect Unit from experiment string if not provided
        if not unit or unit.lower() == "all":
            unit_match = re.search(r'(?:module|unit|u|m)\s*(\d+|[ivx]+)', experiment.lower())
            if unit_match:
                unit = unit_match.group(0).strip()
                print(f"📌 Auto-detected Unit: {unit}")
        
        context = ""
        citations = []
        filtered_data = []
        try:
            retriever = get_retriever()
            
            # Try multiple search queries and combine results
            all_docs = []
            seen_contents = set()
            for sq in search_queries:
                raw_docs = retriever.invoke(sq)
                for doc in raw_docs:
                    content_hash = hash(doc.page_content[:100])
                    if content_hash not in seen_contents:
                        seen_contents.add(content_hash)
                        all_docs.append(doc)
            
            print(f"📄 Retrieved {len(all_docs)} unique docs from {len(search_queries)} queries")
            
            # --- CUSTOM FILTRATION LOGIC ---
            filtered_data = apply_strict_filtration(all_docs, experiment, target_unit=unit)
            print(f"🔍 After filtration: {len(filtered_data)} docs")
            # -------------------------------
            
            if filtered_data:
                context = "\n\n".join(d["content"] for d in filtered_data)
                citations = [{"content": d["content"], "page": d["metadata"].get("page"), "source": d["metadata"].get("source"), "unit": d["metadata"].get("unit")} for d in filtered_data]
        except Exception as e:
            print(f"⚠️ Retriever error: {e}")

        if not context:
            # Better fallback: tell the AI exactly what was asked
            context = f"The student asked about: '{experiment}'. No matching syllabus data was found. Provide a comprehensive explanation about this specific experiment ONLY. Do NOT explain unrelated topics. If you are unsure what experiment this refers to, ask the student to provide the full experiment name."

        # --- SYLLABUS VERIFICATION (UNIQUE) ---
        verification = SyllabusGuard.verify_syllabus_compliance(experiment, filtered_data)
        suggestions = SyllabusGuard.get_suggestions(experiment, filtered_data)
        # -------------------------------------

        result = generate_lab_explanation(context, experiment, step)
        result["citations"] = citations
        result["syllabus_verification"] = verification
        result["suggestions"] = suggestions
        
        try:
            track_activity(user_id, experiment, "lab")
            store_history(user_id, "lab", f"{experiment} ({step})", result.get("content", ""), experiment)
        except: pass
        return result
    except Exception as e:
        return {"stage": "ERROR", "content": str(e)}


# ---------- QA ENDPOINT ----------
@app.post("/ask/")
def ask_question(
    question: str = Form(...), 
    user_id: str = Form("default_user"),
    unit: str = Form(None),
    mode: str = Form("chat")
):
    try:
        from backend.agents.qa_agent import generate_answer, GENERAL_PROMPT, NUMERICAL_PROMPT
        from backend.rag.retriever import get_retriever
        retriever = get_retriever()
        raw_docs = retriever.invoke(question)
        
        import re
        num_keywords = ["solve", "calculate", "value", "formula", "numerical"]
        is_num = mode == "numericals" or any(k in question.lower() for k in num_keywords)
        
        # --- FILTRATION & CUSTOMIZATION ---
        filtered_data = apply_strict_filtration(raw_docs, question, target_unit=unit)
        
        syllabus_context = ""
        citations = []
        if filtered_data:
            syllabus_context = "\n\n".join(d["content"] for d in filtered_data[:5])
            citations = [{"content": d["content"], "page": d["metadata"].get("page"), "source": d["metadata"].get("source"), "unit": d["metadata"].get("unit")} for d in filtered_data]
        
        answer = generate_answer(syllabus_context, question, system_prompt=NUMERICAL_PROMPT if is_num else GENERAL_PROMPT)
        stage = "NUMERICALS" if is_num else mode.upper()
        
        # --- BLOOM'S TAXONOMY (UNIQUE) ---
        from backend.utils.blooms_taxonomy import classify_blooms_level
        from backend.utils.coverage_tracker import record_topic_interaction
        blooms = classify_blooms_level(question)
        try:
            record_topic_interaction(user_id, question)
        except: pass
        # ---------------------------------
        
        from backend.utils.syllabus_guard import SyllabusGuard
        verification = SyllabusGuard.verify_syllabus_compliance(question, filtered_data)
        suggestions = SyllabusGuard.get_suggestions(question, filtered_data)

        return {
            "stage": mode.upper(),
            "content": answer,
            "citations": citations,
            "blooms": blooms,
            "syllabus_verification": verification,
            "suggestions": suggestions
        }
    except Exception as e:
        return {"stage": "ERROR", "content": str(e)}

# ---------- SYLLABUS COVERAGE (UNIQUE FEATURE) ----------
@app.get("/coverage/{user_id}")
def get_coverage(user_id: str):
    """Returns how much of the syllabus the student has covered."""
    from backend.utils.coverage_tracker import get_coverage_stats
    return get_coverage_stats(user_id)

# ---------- WEAKNESS ANALYSIS (UNIQUE FEATURE) ----------
@app.get("/weakness/{user_id}")
def get_weakness(user_id: str):
    """Returns the student's weak topics and personalized recommendations."""
    from backend.utils.weakness_analyzer import get_adaptive_recommendations
    return get_adaptive_recommendations(user_id)

@app.post("/record-quiz-result/")
def record_quiz(
    user_id: str = Form(...),
    topic: str = Form(...),
    score: int = Form(...),
    total: int = Form(...)
):
    """Record a quiz result for weakness analysis."""
    from backend.utils.weakness_analyzer import record_quiz_result
    return record_quiz_result(user_id, topic, score, total)

# ---------- FLASHCARDS (UNIQUE FEATURE) ----------
@app.post("/generate-flashcards/")
def generate_flashcards(
    topic: str = Form(...),
    content: str = Form(""),
    user_id: str = Form("default_user")
):
    """Automatically generate Anki-style flashcards from the provided content."""
    try:
        from backend.agents.qa_agent import generate_answer
        import json
        
        prompt = f"""
        Extract 5 high-impact, conceptual flashcards (Question & Answer) from this text about {topic}.
        Focus on key terms, formulas, and definitions useful for exam preparation.
        
        Return ONLY a JSON array of objects:
        [
          {{"question": "What is...", "answer": "It is..."}},
          ...
        ]
        
        Text: {content[:4000]}
        """
        
        raw_res = generate_answer("", prompt)
        
        # Clean JSON
        raw_res = raw_res.strip()
        if raw_res.startswith("```json"): raw_res = raw_res[7:]
        if raw_res.startswith("```"): raw_res = raw_res[3:]
        if raw_res.endswith("```"): raw_res = raw_res[:-3]
        
        cards = json.loads(raw_res.strip())
        return {"topic": topic, "cards": cards}
    except Exception as e:
        print(f"❌ Flashcard error: {e}")
        return {"error": str(e), "cards": []}

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
