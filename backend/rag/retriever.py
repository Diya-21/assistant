from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

PERSIST_DIR = "./chroma_db"
_retriever = None

def get_retriever():
    global _retriever
    if _retriever is not None:
        return _retriever
        
    embedding = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    
    vectordb = Chroma(
        persist_directory=PERSIST_DIR,
        embedding_function=embedding
    )
    
    _retriever = vectordb.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 3}
    )
    
    return _retriever

def reset_retriever():
    global _retriever
    _retriever = None