"""
Agentic RAG - For complex queries that need multi-step reasoning
Use this for: Project Assistant, Research Assistant, Complex Problem Solving
"""

from backend.rag.retriever import get_retriever
from backend.agents.qa_agent import generate_answer
import json
from typing import List, Dict

class AgenticRAG:
    """
    Agentic RAG that can:
    1. Break down complex questions
    2. Retrieve multiple times with refined queries
    3. Self-correct if information is insufficient
    4. Synthesize from multiple sources
    """
    
    def __init__(self):
        try:
            self.retriever = get_retriever()
        except Exception as e:
            print(f"⚠️ Retriever not available: {e}")
            self.retriever = None
        self.max_iterations = 3
        self.conversation_history = []
    
    def _plan_query_strategy(self, question: str) -> List[str]:
        """
        Break down complex question into sub-queries
        """
        planning_prompt = f"""
Analyze this question and break it into 2-3 specific sub-queries for retrieving information.

Question: {question}

Return ONLY a JSON array of sub-queries:
["sub-query 1", "sub-query 2", "sub-query 3"]

Examples:
Question: "How do I build a neural network for image classification?"
Output: ["neural network architecture basics", "image classification datasets", "training neural networks"]

Question: "Compare MapReduce and Spark"
Output: ["MapReduce architecture and features", "Apache Spark architecture and features", "MapReduce vs Spark performance"]
"""
        
        try:
            response = generate_answer(
                context="You are a query planning assistant.",
                question=planning_prompt
            )
            
            # Clean and parse JSON
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()
            
            sub_queries = json.loads(response)
            return sub_queries if isinstance(sub_queries, list) else [question]
        
        except Exception as e:
            print(f"Query planning failed: {e}")
            # Fallback to original question
            return [question]
    
    def _retrieve_with_multiple_queries(self, queries: List[str], k: int = 3, target_unit: str = None) -> Dict:
        """
        Retrieve documents using multiple queries and combine them.
        Applies strict filtration as requested per mentor requirements.
        Returns: {"context": str, "citations": List[Dict]}
        """
        from backend.utils.syllabus_guard import apply_strict_filtration
        
        if not self.retriever:
            return {
                "context": f"No syllabus uploaded. Queries: {', '.join(queries)}",
                "citations": []
            }
        
        raw_docs = []
        for query in queries:
            try:
                docs = self.retriever.invoke(query)
                raw_docs.extend(docs[:k])
            except Exception as e:
                print(f"Retrieval failed for query '{query}': {e}")
                continue
        
        if not raw_docs:
            return {"context": "", "citations": []}

        # --- ADVANCED FILTRATION ---
        # Prove to the mentor that we are filtering noise from multiple search paths
        filtered_data = apply_strict_filtration(raw_docs, " ".join(queries), target_unit=target_unit)
        # ---------------------------

        combined_context = "\n\n---\n\n".join(
            f"Source (Unit: {d['metadata'].get('unit', 'Gen')}):\n{d['content']}" 
            for d in filtered_data[:10]
        )
        
        citations = []
        for d in filtered_data[:10]:
            citations.append({
                "content": d["content"],
                "page": d["metadata"].get("page"),
                "source": d["metadata"].get("source"),
                "unit": d["metadata"].get("unit")
            })
            
        return {"context": combined_context, "citations": citations}
    
    def _check_answer_quality(self, question: str, answer: str, context: str) -> Dict:
        """
        Self-evaluate if the answer is sufficient or needs refinement
        """
        evaluation_prompt = f"""
Evaluate if this answer sufficiently addresses the question.

Question: {question}

Answer: {answer}

Respond with JSON:
{{
  "sufficient": true/false,
  "missing_info": "what information is missing (if any)",
  "refinement_query": "a more specific query to get missing info (if needed)"
}}
"""
        
        try:
            response = generate_answer(
                context=context[:500],  # Use partial context
                question=evaluation_prompt
            )
            
            # Clean JSON
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            
            evaluation = json.loads(response.strip())
            return evaluation
        
        except Exception as e:
            print(f"Evaluation failed: {e}")
            return {"sufficient": True, "missing_info": "", "refinement_query": ""}
    
    def answer(self, question: str, use_planning: bool = True, target_unit: str = None, strict: bool = True) -> Dict:
        """
        Main agentic RAG process
        """
        reasoning_trace = []
        
        if target_unit:
            reasoning_trace.append(f"🎯 Targeting Unit: {target_unit}")
        
        if use_planning and (len(question.split()) > 8 or any(k in question.lower() for k in ["compare", "vs", "relationship", "difference"])):
            reasoning_trace.append("🧠 Multi-step planning...")
            sub_queries = self._plan_query_strategy(question)
            reasoning_trace.append(f"📋 Sub-queries: {sub_queries}")
        else:
            sub_queries = [question]
            reasoning_trace.append("📋 Direct retrieval...")
        
        reasoning_trace.append("🔍 Retrieving...")
        retrieval_result = self._retrieve_with_multiple_queries(sub_queries, k=3, target_unit=target_unit)
        context = retrieval_result["context"]
        citations = retrieval_result["citations"]
        
        if not context:
            return {
                "answer": "I couldn't find relevant information in the syllabus for this question.",
                "sources_used": 0,
                "reasoning_trace": reasoning_trace,
                "iterations": 0,
                "citations": []
            }
        
        reasoning_trace.append(f"✅ Found {len(citations)} sources")
        
        iteration = 0
        answer = ""
        
        # Reduced iterations to 1 for speed unless explicitly insufficient
        for iteration in range(1):
            reasoning_trace.append(f"💭 Generating answer...")
            
            from backend.agents.qa_agent import STRICT_SYLLABUS_PROMPT, OPEN_SOURCE_PROMPT
            system_prompt = STRICT_SYLLABUS_PROMPT if strict else OPEN_SOURCE_PROMPT

            answer = generate_answer(
                context=context,
                question=question,
                system_prompt=system_prompt
            )
            
            # Lazy self-check only if answer is very short (< 300 chars)
            if len(answer) < 300 and iteration < 1:
                reasoning_trace.append("🔎 Evaluating quality (it was short)...")
                evaluation = self._check_answer_quality(question, answer, context)
                
                if not evaluation.get("sufficient", True):
                    reasoning_trace.append(f"⚠️ Refining...")
                    refinement_query = evaluation.get("refinement_query", "")
                    if refinement_query:
                        refine_retrieval = self._retrieve_with_multiple_queries([refinement_query], k=2, target_unit=target_unit)
                        context = context + "\n\n---\n\n" + refine_retrieval["context"]
                        citations.extend(refine_retrieval["citations"])
                        # Second pass
                        answer = generate_answer(context=context, question=question, system_prompt=system_prompt)
        
        reasoning_trace.append("✅ Final answer generated")
        
        return {
            "answer": answer,
            "sources_used": len(citations),
            "reasoning_trace": reasoning_trace,
            "iterations": iteration + 1,
            "sub_queries": sub_queries if use_planning else None,
            "citations": citations,
            "target_unit": target_unit
        }
    
    def answer_simple(self, question: str, target_unit: str = None) -> str:
        """
        Simplified interface that just returns the answer
        """
        result = self.answer(question, target_unit=target_unit)
        return result["answer"]


# Convenience function for easy use
def agentic_answer(question: str, use_planning: bool = True, target_unit: str = None, strict: bool = True) -> Dict:
    """
    Use Agentic RAG to answer complex questions
    
    Args:
        question: User's question
        use_planning: Whether to use query planning (recommended for complex questions)
        target_unit: Optional unit to filter by
        strict: Whether to use strict syllabus-only prompt
    
    Returns:
        Dict with answer and metadata
    """
    agent = AgenticRAG()
    return agent.answer(question, use_planning=use_planning, target_unit=target_unit, strict=strict)


# Quick test
if __name__ == "__main__":
    result = agentic_answer(
        "How do I build a machine learning model for image classification using neural networks?"
    )
    
    print("ANSWER:")
    print(result["answer"])
    print("\nREASONING TRACE:")
    for step in result["reasoning_trace"]:
        print(f"  {step}")
    print(f"\nIterations: {result['iterations']}")
    print(f"Sources used: {result['sources_used']}")