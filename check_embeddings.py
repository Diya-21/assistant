print("Checking embeddings...")
from langchain_huggingface import HuggingFaceEmbeddings
print("Loading model...")
embedding = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
print("Model loaded successfully!")
query_result = embedding.embed_query("test")
print(f"Embedding successful! Vector length: {len(query_result)}")
