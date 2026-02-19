print("Importing FastAPI...")
from fastapi import FastAPI
print("Importing uploader...")
from backend.rag.syllabus_uploader import extract_text_from_pdf
print("Importing chunker...")
from backend.rag.chunker import chunk_text
print("Importing vector_store...")
from backend.rag.vector_store import get_vector_store
print("Importing retriever...")
from backend.rag.retriever import get_retriever
print("Importing agents...")
from backend.agents.learning_agent import learning_flow
print("Imports finished successfully!")
