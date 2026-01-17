from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

def get_retriever():
    embedding = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    vectordb = Chroma(
        persist_directory="data/vector_db",
        embedding_function=embedding
    )

    retriever = vectordb.as_retriever(search_kwargs={"k": 4})
    return retriever
