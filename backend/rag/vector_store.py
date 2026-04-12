from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
import os
import shutil

PERSIST_DIR = "./chroma_db"
_embedding = None

def get_embedding_model():
    global _embedding
    if _embedding is None:
        print("📥 Loading Embedding Model (First time)...")
        _embedding = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        print("✅ Embedding Model Loaded.")
    else:
        print("♻️ Using cached Embedding Model.")
    return _embedding

def get_vector_store(chunks):
    embedding = get_embedding_model()
    
    # Release file handles before clearing
    try:
        from backend.rag.retriever import reset_retriever
        reset_retriever()
        import gc, time
        gc.collect()
    except: pass

    if os.path.exists(PERSIST_DIR):
        print("🗑️ Clearing old syllabus data from vector database...")
        for i in range(5):
            try:
                shutil.rmtree(PERSIST_DIR)
                print("✅ Old data cleared.")
                break
            except Exception as e:
                print(f"⚠️ Retry {i+1} for clear: {e}")
                time.sleep(1)
    
    os.makedirs(PERSIST_DIR, exist_ok=True)
    print(f"📁 Created fresh directory: {PERSIST_DIR}")

    if chunks and isinstance(chunks[0], str):
        documents = [Document(page_content=chunk) for chunk in chunks]
    else:
        documents = chunks
    
    print(f"💎 Creating Chroma index for {len(documents)} documents...")
    vectordb = Chroma.from_documents(
        documents=documents,
        embedding=embedding,
        persist_directory=PERSIST_DIR
    )
    print("✅ Index created successfully with ONLY the new syllabus.")
    
    # Force the retriever singleton to reset so it picks up the new data
    try:
        from backend.rag.retriever import reset_retriever
        reset_retriever()
        print("🔄 Cached retriever reset.")
    except Exception as e:
        print(f"⚠️ Failed to reset retriever: {e}")
    
    return vectordb
