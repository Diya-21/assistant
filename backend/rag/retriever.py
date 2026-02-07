from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

PERSIST_DIR = "./chroma_db"

def get_retriever():
    embedding = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    
    vectordb = Chroma(
        persist_directory=PERSIST_DIR,
        embedding_function=embedding
    )
    
    return vectordb.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 3}
    )