from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from typing import List, Dict


def chunk_text(pages_data: List[Dict]) -> List[Document]:
    """
    Chunks text while preserving metadata (page numbers).
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=700,
        chunk_overlap=100
    )
    
    all_chunks = []
    
    for page in pages_data:
        text = page["page_content"]
        metadata = page["metadata"]
        
        # Split text into chunks for this specific page
        chunks = splitter.split_text(text)
        
        # Create Document objects with metadata
        for chunk in chunks:
            all_chunks.append(Document(
                page_content=chunk,
                metadata=metadata
            ))
            
    return all_chunks
