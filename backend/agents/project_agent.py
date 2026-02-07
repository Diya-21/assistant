"""
Project Agent - Helps students ideate and plan projects based on their syllabus
Uses Agentic RAG for multi-step project planning
"""

from backend.rag.retriever import get_retriever
from backend.agents.qa_agent import generate_answer
from backend.agents.agentic_rag import AgenticRAG
import json
import re
from typing import Dict, List, Optional

class ProjectAgent:
    """
    Extended Agentic RAG for project ideation and planning.
    
    Stages:
    1. ideas - Generate project ideas based on subjects
    2. detailed - Get detailed breakdown of a specific project
    3. roadmap - Generate implementation roadmap with phases
    4. concepts - Explain key concepts needed for the project
    """
    
    def __init__(self):
        self.retriever = None
        try:
            self.retriever = get_retriever()
        except Exception as e:
            print(f"⚠️ Retriever not available: {e}")
        
        self.project_prompts = {
            "ideas": """
Based on the context provided, suggest 5 innovative project ideas for a student.

For each project, provide:
1. **Title**: A catchy project name
2. **Description**: 2-3 sentences explaining the project
3. **Subjects Used**: Which topics are applied
4. **Difficulty**: Easy / Medium / Hard
5. **Innovation Factor**: What makes it unique

Return as JSON:
{
    "projects": [
        {
            "id": 1,
            "title": "Project Name",
            "description": "Brief description...",
            "subjects_used": ["Topic1", "Topic2"],
            "difficulty": "Medium",
            "innovation": "What makes it special"
        }
    ]
}
""",
            "detailed": """
Provide a detailed breakdown of this project:

Include:
1. **Problem Statement**: What problem does it solve?
2. **Objectives**: 3-4 clear objectives
3. **Scope**: What's included and what's not
4. **Expected Outcomes**: What will be delivered
5. **Key Challenges**: Technical challenges to expect

Format as markdown with clear sections.
""",
            "roadmap": """
Create a detailed implementation roadmap for this project.

Break it into phases:
1. **Phase 1: Research & Planning** (Week 1-2)
   - Tasks to complete
   - Deliverables
   
2. **Phase 2: Design & Architecture** (Week 3-4)
   - Tasks to complete
   - Deliverables
   
3. **Phase 3: Core Implementation** (Week 5-8)
   - Tasks to complete
   - Deliverables
   
4. **Phase 4: Testing & Refinement** (Week 9-10)
   - Tasks to complete
   - Deliverables
   
5. **Phase 5: Documentation & Presentation** (Week 11-12)
   - Tasks to complete
   - Deliverables

Include specific tasks, not just generic ones.
""",
            "concepts": """
Explain the key concepts a student needs to understand before starting this project.

For each concept:
1. **Concept Name**: Clear title
2. **Explanation**: Simple explanation with examples
3. **Why It's Needed**: How it relates to the project
4. **Resources**: Where to learn more

Focus on foundational understanding, not code.
"""
        }
    
    def _clean_json(self, raw_text: str) -> str:
        """Extract and clean JSON from LLM response"""
        raw_text = re.sub(r'```json\s*', '', raw_text)
        raw_text = re.sub(r'```\s*', '', raw_text)
        json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
        if json_match:
            return json_match.group(0)
        return raw_text.strip()
    
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
    
    def generate_ideas(self, subjects: str) -> Dict:
        """
        Generate project ideas based on subjects from syllabus
        
        Args:
            subjects: Comma-separated subjects or topics
        
        Returns:
            Dict with project ideas and reasoning trace
        """
        reasoning_trace = []
        
        # Step 1: Plan queries for each subject
        reasoning_trace.append("🧠 Analyzing subjects for project ideation...")
        
        subject_list = [s.strip() for s in subjects.split(",")]
        sub_queries = subject_list + [f"{s} applications" for s in subject_list]
        reasoning_trace.append(f"📋 Topics to explore: {sub_queries}")
        
        # Step 2: Retrieve context (optional - works without syllabus too)
        reasoning_trace.append("🔍 Retrieving context...")
        context = self._retrieve_context(sub_queries, k=4)
        
        if context:
            reasoning_trace.append("✅ Context retrieved from syllabus")
        else:
            reasoning_trace.append("📝 No syllabus uploaded - using general knowledge")
            context = f"The student wants to build a project related to: {subjects}. Suggest innovative and practical project ideas."
        
        # Step 3: Generate project ideas
        reasoning_trace.append("💡 Generating project ideas...")
        
        prompt = f"""
{self.project_prompts['ideas']}

Subjects requested: {subjects}

Context:
{context}
"""
        
        raw_response = generate_answer(
            context=context,
            question=prompt
        )
        
        try:
            cleaned = self._clean_json(raw_response)
            projects_data = json.loads(cleaned)
            reasoning_trace.append(f"✅ Generated {len(projects_data.get('projects', []))} project ideas")
            
            return {
                "stage": "IDEAS",
                "projects": projects_data.get("projects", []),
                "subjects_analyzed": subject_list,
                "reasoning_trace": reasoning_trace
            }
        except json.JSONDecodeError:
            # Return as markdown if JSON parsing fails
            reasoning_trace.append("⚠️ Returning as formatted text")
            return {
                "stage": "IDEAS",
                "content": raw_response,
                "subjects_analyzed": subject_list,
                "reasoning_trace": reasoning_trace
            }
    
    def get_project_details(self, project_title: str, stage: str = "detailed") -> Dict:
        """
        Get detailed information about a specific project
        
        Args:
            project_title: Name/title of the project
            stage: One of 'detailed', 'roadmap', 'concepts'
        
        Returns:
            Dict with project details
        """
        reasoning_trace = []
        
        # Retrieve relevant context
        reasoning_trace.append(f"🔍 Researching: {project_title}")
        
        # Create targeted queries
        queries = [
            project_title,
            f"{project_title} implementation",
            f"{project_title} requirements"
        ]
        
        context = self._retrieve_context(queries, k=4)
        
        if not context:
            context = f"Provide detailed information about building a {project_title} project."
        
        reasoning_trace.append("✅ Context gathered")
        
        # Get appropriate prompt
        prompt_template = self.project_prompts.get(stage, self.project_prompts["detailed"])
        
        prompt = f"""
{prompt_template}

Project: {project_title}

Context:
{context}
"""
        
        reasoning_trace.append(f"💭 Generating {stage} information...")
        
        response = generate_answer(
            context=context,
            question=prompt
        )
        
        reasoning_trace.append("✅ Response generated")
        
        return {
            "stage": stage.upper(),
            "project_title": project_title,
            "content": response,
            "reasoning_trace": reasoning_trace
        }


# Convenience functions
def generate_project_ideas(subjects: str) -> Dict:
    """Generate project ideas for given subjects"""
    agent = ProjectAgent()
    return agent.generate_ideas(subjects)

def get_project_info(project_title: str, stage: str = "detailed") -> Dict:
    """Get detailed project information"""
    agent = ProjectAgent()
    return agent.get_project_details(project_title, stage)
