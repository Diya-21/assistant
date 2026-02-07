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
        self.retriever = get_retriever()
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
    
    def _retrieve_with_multiple_queries(self, queries: List[str], k: int = 3) -> str:
        """
        Retrieve documents using multiple queries and combine them
        """
        all_docs = []
        seen_content = set()
        
        for query in queries:
            try:
                docs = self.retriever.invoke(query)
                
                # Deduplicate by content
                for doc in docs[:k]:
                    content = doc.page_content.strip()
                    if content not in seen_content:
                        all_docs.append(doc)
                        seen_content.add(content)
            
            except Exception as e:
                print(f"Retrieval failed for query '{query}': {e}")
                continue
        
        if not all_docs:
            return ""
        
        # Combine all unique documents
        combined_context = "\n\n---\n\n".join(
            f"Source {i+1}:\n{doc.page_content}" 
            for i, doc in enumerate(all_docs[:10])  # Max 10 sources
        )
        
        return combined_context
    
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
            # Assume answer is good enough
            return {"sufficient": True, "missing_info": "", "refinement_query": ""}
    
    def answer(self, question: str, use_planning: bool = True) -> Dict:
        """
        Main agentic RAG process
        
        Args:
            question: User's question
            use_planning: Whether to break down question into sub-queries
        
        Returns:
            Dict with answer, sources, and reasoning trace
        """
        reasoning_trace = []
        
        # Step 1: Plan queries
        if use_planning:
            reasoning_trace.append("🧠 Planning retrieval strategy...")
            sub_queries = self._plan_query_strategy(question)
            reasoning_trace.append(f"📋 Sub-queries: {sub_queries}")
        else:
            sub_queries = [question]
            reasoning_trace.append("📋 Using direct query")
        
        # Step 2: Retrieve with multiple queries
        reasoning_trace.append("🔍 Retrieving information...")
        context = self._retrieve_with_multiple_queries(sub_queries, k=3)
        
        if not context:
            return {
                "answer": "I couldn't find relevant information in the syllabus for this question.",
                "sources_used": 0,
                "reasoning_trace": reasoning_trace,
                "iterations": 0
            }
        
        reasoning_trace.append(f"✅ Retrieved information from multiple sources")
        
        # Step 3: Generate initial answer
        iteration = 0
        answer = ""
        
        for iteration in range(self.max_iterations):
            reasoning_trace.append(f"💭 Generating answer (iteration {iteration + 1})...")
            
            answer = generate_answer(
                context=context,
                question=question
            )
            
            # Step 4: Self-evaluate
            if iteration < self.max_iterations - 1:  # Don't evaluate on last iteration
                reasoning_trace.append("🔎 Evaluating answer quality...")
                evaluation = self._check_answer_quality(question, answer, context)
                
                if evaluation.get("sufficient", True):
                    reasoning_trace.append("✅ Answer is sufficient")
                    break
                else:
                    reasoning_trace.append(f"⚠️ Missing info: {evaluation.get('missing_info', 'unknown')}")
                    
                    # Refine with additional retrieval
                    refinement_query = evaluation.get("refinement_query", "")
                    if refinement_query:
                        reasoning_trace.append(f"🔄 Refining with query: {refinement_query}")
                        additional_context = self._retrieve_with_multiple_queries(
                            [refinement_query], 
                            k=2
                        )
                        context = context + "\n\n---\n\n" + additional_context
        
        reasoning_trace.append("✅ Final answer generated")
        
        return {
            "answer": answer,
            "sources_used": len(context.split("---")),
            "reasoning_trace": reasoning_trace,
            "iterations": iteration + 1,
            "sub_queries": sub_queries if use_planning else None
        }
    
    def answer_simple(self, question: str) -> str:
        """
        Simplified interface that just returns the answer
        """
        result = self.answer(question)
        return result["answer"]


# Convenience function for easy use
def agentic_answer(question: str, use_planning: bool = True) -> Dict:
    """
    Use Agentic RAG to answer complex questions
    
    Args:
        question: User's question
        use_planning: Whether to use query planning (recommended for complex questions)
    
    Returns:
        Dict with answer and metadata
    """
    agent = AgenticRAG()
    return agent.answer(question, use_planning=use_planning)


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