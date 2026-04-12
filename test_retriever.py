import sys
sys.path.append(".")

from backend.rag.retriever import get_retriever

try:
    r = get_retriever()
    docs = r.invoke("chapter 3")
    print(f"Found {len(docs)} docs")
    for i, d in enumerate(docs):
        page = d.metadata.get("page", "?")
        source = d.metadata.get("source", "?")
        print(f"\nDoc {i+1} (Page {page}, Source: {source}):")
        print(d.page_content[:200])
        print("---")
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
