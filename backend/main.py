from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

# ---------- RAG PIPELINE ----------
from backend.rag.syllabus_uploader import extract_text_from_pdf
from backend.rag.chunker import chunk_text
from backend.rag.vector_store import get_vector_store
from backend.rag.retriever import get_retriever

# ---------- AGENTS ----------
from backend.agents.qa_agent import generate_answer
from backend.agents.lab_agent import generate_lab_explanation


app = FastAPI(title="Multimodal AI Teaching Assistant")

# -------------------- CORS --------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- ROOT --------------------
@app.get("/")
def root():
    return {"status": "AI Teaching Assistant Backend Running"}

# -------------------- UPLOAD SYLLABUS --------------------
@app.post("/upload-syllabus/")
async def upload_syllabus(file: UploadFile = File(...)):
    """
    Upload ONE PDF containing theory + lab syllabus.
    Extract text, chunk it, embed and store in vector DB.
    """
    try:
        # 1. Extract text
        text = extract_text_from_pdf(file)

        if not text or not text.strip():
            return {
                "error": "PDF contains no extractable text (possibly scanned)"
            }

        # 2. Chunk text
        chunks = chunk_text(text)

        if not chunks:
            return {
                "error": "Chunking failed — no chunks generated"
            }

        # 3. Create / load vector store WITH chunks
        vectordb = get_vector_store(chunks)

        return {
            "message": "Syllabus uploaded and indexed successfully",
            "total_chunks": len(chunks)
        }

    except Exception as e:
        return {
            "error": f"Syllabus processing failed: {str(e)}"
        }

# -------------------- QA AGENT --------------------
@app.post("/ask/")
async def ask_question(question: str = Form(...)):
    """
    Answer theory questions using RAG + LLM.
    """
    try:
        retriever = get_retriever()
        docs = retriever.invoke(question)

        if not docs:
            return {
                "question": question,
                "answer": "This topic is not covered in the syllabus."
            }

        context = "\n\n".join(doc.page_content for doc in docs)

        answer = generate_answer(
            context=context,
            question=question
        )

        return {
            "question": question,
            "answer": answer
        }

    except Exception as e:
        return {
            "question": question,
            "answer": f"Error generating answer: {str(e)}"
        }

# -------------------- LAB AGENT --------------------
@app.post("/lab/")
async def lab_agent(experiment: str = Form(...)):
    """
    Generate structured lab explanation:
    Aim, Theory, Algorithm, Pseudocode, Viva.
    """
    try:
        retriever = get_retriever()
        docs = retriever.invoke(experiment)

        if not docs:
            return {
                "experiment": experiment,
                "lab_explanation": "Lab experiment not found in syllabus."
            }

        context = "\n\n".join(doc.page_content for doc in docs)

        lab_output = generate_lab_explanation(
            context=context,
            experiment_title=experiment
        )

        return {
            "experiment": experiment,
            "lab_explanation": lab_output
        }

    except Exception as e:
        return {
            "experiment": experiment,
            "lab_explanation": f"Error generating lab content: {str(e)}"
        }
