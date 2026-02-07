from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document  # ✅ Fixed import

PERSIST_DIR = "./chroma_db"

def get_vector_store(chunks):
    embedding = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    
    if chunks and isinstance(chunks[0], str):
        documents = [Document(page_content=chunk) for chunk in chunks]
    else:
        documents = chunks
    
    vectordb = Chroma.from_documents(
        documents=documents,
        embedding=embedding,
        persist_directory=PERSIST_DIR
    )
    
    return vectordb