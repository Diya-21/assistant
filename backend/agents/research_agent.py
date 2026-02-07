"""
Research Agent - Helps students find research papers, understand concepts, and explore topics
Uses Agentic RAG + External APIs (arXiv, Semantic Scholar) for academic research
"""

from backend.rag.retriever import get_retriever
from backend.agents.qa_agent import generate_answer
from backend.agents.agentic_rag import AgenticRAG
import requests
import json
import re
from typing import Dict, List, Optional
from datetime import datetime

class ResearchAgent:
    """
    Research Agent for academic exploration.
    
    Capabilities:
    1. Search arXiv for relevant papers
    2. Search Semantic Scholar for citations
    3. Explain research concepts from syllabus
    4. Suggest research directions
    5. Summarize papers and findings
    """
    
    def __init__(self):
        self.retriever = None
        try:
            self.retriever = get_retriever()
        except Exception as e:
            print(f"⚠️ Retriever not available: {e}")
        
        self.arxiv_base_url = "http://export.arxiv.org/api/query"
        self.semantic_scholar_url = "https://api.semanticscholar.org/graph/v1/paper/search"
    
    def _retrieve_context(self, queries: List[str], k: int = 3) -> str:
        """Retrieve context from syllabus if available"""
        if not self.retriever:
            return ""
        
        all_docs = []
        seen_content = set()
        
        for query in queries:
            try:
                docs = self.retriever.invoke(query)
                for doc in docs[:k]:
                    content = doc.page_content.strip()
                    if content not in seen_content:
                        all_docs.append(doc)
                        seen_content.add(content)
            except Exception as e:
                print(f"Retrieval error for '{query}': {e}")
                continue
        
        if not all_docs:
            return ""
        
        return "\n\n---\n\n".join(
            f"Source {i+1}:\n{doc.page_content}" 
            for i, doc in enumerate(all_docs[:10])
        )
    
    def search_arxiv(self, query: str, max_results: int = 5) -> List[Dict]:
        """
        Search arXiv for academic papers
        
        Args:
            query: Search query
            max_results: Maximum number of results
        
        Returns:
            List of paper metadata
        """
        try:
            params = {
                "search_query": f"all:{query}",
                "start": 0,
                "max_results": max_results,
                "sortBy": "relevance",
                "sortOrder": "descending"
            }
            
            response = requests.get(self.arxiv_base_url, params=params, timeout=10)
            
            if response.status_code != 200:
                return []
            
            # Parse XML response
            import xml.etree.ElementTree as ET
            root = ET.fromstring(response.content)
            
            papers = []
            namespace = {'atom': 'http://www.w3.org/2005/Atom'}
            
            for entry in root.findall('atom:entry', namespace):
                title = entry.find('atom:title', namespace)
                summary = entry.find('atom:summary', namespace)
                published = entry.find('atom:published', namespace)
                link = entry.find('atom:id', namespace)
                
                # Get authors
                authors = []
                for author in entry.findall('atom:author', namespace):
                    name = author.find('atom:name', namespace)
                    if name is not None:
                        authors.append(name.text)
                
                papers.append({
                    "title": title.text.strip() if title is not None else "Unknown",
                    "abstract": summary.text.strip()[:500] + "..." if summary is not None else "",
                    "authors": authors[:3],  # First 3 authors
                    "published": published.text[:10] if published is not None else "",
                    "url": link.text if link is not None else "",
                    "source": "arXiv"
                })
            
            return papers
            
        except Exception as e:
            print(f"arXiv search error: {e}")
            return []
    
    def search_semantic_scholar(self, query: str, max_results: int = 5) -> List[Dict]:
        """
        Search Semantic Scholar for papers with citations
        
        Args:
            query: Search query
            max_results: Maximum number of results
        
        Returns:
            List of paper metadata with citation counts
        """
        try:
            params = {
                "query": query,
                "limit": max_results,
                "fields": "title,abstract,authors,year,citationCount,url"
            }
            
            response = requests.get(
                self.semantic_scholar_url, 
                params=params, 
                timeout=10
            )
            
            if response.status_code != 200:
                return []
            
            data = response.json()
            papers = []
            
            for paper in data.get("data", []):
                authors = [a.get("name", "") for a in paper.get("authors", [])[:3]]
                
                papers.append({
                    "title": paper.get("title", "Unknown"),
                    "abstract": (paper.get("abstract", "") or "")[:500],
                    "authors": authors,
                    "year": paper.get("year", ""),
                    "citations": paper.get("citationCount", 0),
                    "url": paper.get("url", ""),
                    "source": "Semantic Scholar"
                })
            
            return papers
            
        except Exception as e:
            print(f"Semantic Scholar search error: {e}")
            return []
    
    def research_topic(self, topic: str, include_papers: bool = True) -> Dict:
        """
        Comprehensive research on a topic
        
        Combines:
        1. Syllabus context (via RAG)
        2. External papers (arXiv + Semantic Scholar)
        3. Concept explanations
        
        Args:
            topic: Research topic
            include_papers: Whether to fetch external papers
        
        Returns:
            Dict with research findings
        """
        reasoning_trace = []
        
        # Step 1: Get syllabus context
        reasoning_trace.append(f"🔍 Researching: {topic}")
        
        queries = [
            topic,
            f"{topic} concepts",
            f"{topic} applications",
            f"{topic} theory"
        ]
        
        context = self._retrieve_context(queries, k=4)
        if context:
            reasoning_trace.append("✅ Syllabus context retrieved")
        else:
            reasoning_trace.append("📝 No syllabus - using general knowledge")
            context = f"Research topic: {topic}. Provide comprehensive academic coverage."
        
        # Step 2: Generate concept explanation
        reasoning_trace.append("📚 Generating concept explanation...")
        
        concept_prompt = f"""
Explain the following topic in depth for a student doing research:

Topic: {topic}

Include:
1. **Definition**: Clear, precise definition
2. **Key Concepts**: Important sub-concepts and terminology
3. **How It Works**: Technical explanation
4. **Applications**: Real-world use cases
5. **Related Topics**: What else to study
6. **Common Misconceptions**: What students often get wrong

Use the syllabus context but provide comprehensive coverage.
"""
        
        explanation = generate_answer(
            context=context if context else "General knowledge",
            question=concept_prompt
        )
        
        reasoning_trace.append("✅ Concept explanation generated")
        
        # Step 3: Fetch external papers
        papers = []
        if include_papers:
            reasoning_trace.append("📄 Searching academic databases...")
            
            arxiv_papers = self.search_arxiv(topic, max_results=3)
            semantic_papers = self.search_semantic_scholar(topic, max_results=3)
            
            papers = arxiv_papers + semantic_papers
            
            # Sort by relevance (citations for Semantic Scholar papers)
            papers.sort(key=lambda x: x.get("citations", 0), reverse=True)
            
            reasoning_trace.append(f"✅ Found {len(papers)} research papers")
        
        # Step 4: Generate research directions
        reasoning_trace.append("🎯 Suggesting research directions...")
        
        directions_prompt = f"""
Based on {topic}, suggest 3 interesting research directions or project ideas for a student.

For each direction:
1. **Title**: A clear research question or project idea
2. **Why It's Interesting**: Relevance and importance
3. **Approach**: How to get started
4. **Skills Needed**: What the student should learn

Keep it practical for undergraduate/graduate level.
"""
        
        directions = generate_answer(
            context=context if context else "General knowledge",
            question=directions_prompt
        )
        
        reasoning_trace.append("✅ Research complete")
        
        return {
            "stage": "RESEARCH",
            "topic": topic,
            "explanation": explanation,
            "papers": papers[:6],  # Max 6 papers
            "research_directions": directions,
            "reasoning_trace": reasoning_trace,
            "sources": {
                "syllabus": bool(context),
                "arxiv": len([p for p in papers if p.get("source") == "arXiv"]),
                "semantic_scholar": len([p for p in papers if p.get("source") == "Semantic Scholar"])
            }
        }
    
    def summarize_findings(self, topic: str, papers: List[Dict]) -> Dict:
        """
        Summarize research findings from multiple papers
        
        Args:
            topic: Research topic
            papers: List of paper metadata
        
        Returns:
            Dict with summarized findings
        """
        if not papers:
            return {
                "stage": "SUMMARY",
                "content": "No papers provided for summarization."
            }
        
        # Combine paper abstracts for context
        paper_context = "\n\n".join([
            f"Paper: {p.get('title')}\nAbstract: {p.get('abstract', '')}"
            for p in papers[:5]
        ])
        
        summary_prompt = f"""
Based on these research papers about {topic}, provide:

1. **Key Findings**: Main discoveries and contributions
2. **Common Themes**: What most papers agree on
3. **Gaps in Research**: What's still unexplored
4. **Future Directions**: Where research is heading
5. **Practical Implications**: How this can be applied

Papers:
{paper_context}
"""
        
        summary = generate_answer(
            context=paper_context,
            question=summary_prompt
        )
        
        return {
            "stage": "SUMMARY",
            "topic": topic,
            "content": summary,
            "papers_analyzed": len(papers)
        }


# Convenience functions
def research(topic: str, include_papers: bool = True) -> Dict:
    """Research a topic with papers and explanations"""
    agent = ResearchAgent()
    return agent.research_topic(topic, include_papers)

def search_papers(query: str) -> Dict:
    """Search for academic papers only"""
    agent = ResearchAgent()
    arxiv = agent.search_arxiv(query, max_results=5)
    semantic = agent.search_semantic_scholar(query, max_results=5)
    
    all_papers = arxiv + semantic
    
    return {
        "stage": "PAPERS",
        "query": query,
        "papers": all_papers,
        "total": len(all_papers)
    }
