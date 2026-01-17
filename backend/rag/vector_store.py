from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

def get_embedding():
    # created only when function is called
    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

def get_vector_store(chunks):
    embedding = get_embedding()

    vectordb = Chroma.from_texts(
        texts=chunks,
        embedding=embedding,
        persist_directory="data/vector_db"
    )
    vectordb.persist()
    return vectordb
