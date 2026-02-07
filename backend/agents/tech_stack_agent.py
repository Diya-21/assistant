"""
Tech Stack Agent - Helps students understand technologies and build projects
Explains concepts, compares tools, and provides code guidance (not full generation)
"""

from backend.rag.retriever import get_retriever
from backend.agents.qa_agent import generate_answer
from backend.agents.agentic_rag import AgenticRAG
import json
import re
from typing import Dict, List, Optional

class TechStackAgent:
    """
    Tech Stack Agent for understanding and choosing technologies.
    
    Capabilities:
    1. Recommend tech stacks for project types
    2. Compare technologies (pros/cons)
    3. Explain concepts in depth
    4. Provide code snippets and patterns
    5. Guide architecture decisions
    """
    
    def __init__(self):
        self.retriever = None
        try:
            self.retriever = get_retriever()
        except Exception as e:
            print(f"⚠️ Retriever not available: {e}")
        
        # Common tech stack templates
        self.stack_templates = {
            "web_app": {
                "frontend": ["React", "Vue.js", "Angular", "Next.js"],
                "backend": ["Node.js/Express", "Python/FastAPI", "Python/Django", "Java/Spring"],
                "database": ["PostgreSQL", "MongoDB", "MySQL", "Firebase"],
                "deployment": ["Vercel", "AWS", "Heroku", "Docker"]
            },
            "ml_project": {
                "framework": ["TensorFlow", "PyTorch", "Scikit-learn", "Keras"],
                "data": ["Pandas", "NumPy", "Polars"],
                "visualization": ["Matplotlib", "Seaborn", "Plotly"],
                "deployment": ["Flask", "FastAPI", "Streamlit", "Gradio"]
            },
            "mobile_app": {
                "cross_platform": ["React Native", "Flutter", "Expo"],
                "native_android": ["Kotlin", "Java"],
                "native_ios": ["Swift", "SwiftUI"],
                "backend": ["Firebase", "Supabase", "Node.js"]
            },
            "data_engineering": {
                "processing": ["Apache Spark", "Apache Kafka", "Airflow"],
                "storage": ["HDFS", "S3", "Delta Lake"],
                "database": ["PostgreSQL", "Cassandra", "ClickHouse"],
                "orchestration": ["Airflow", "Prefect", "Dagster"]
            }
        }
    
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
    
    def recommend_stack(self, project_type: str, requirements: str = "") -> Dict:
        """
        Recommend a tech stack for a project type
        
        Args:
            project_type: Type of project (web_app, ml_project, mobile_app, etc.)
            requirements: Specific requirements or constraints
        
        Returns:
            Dict with recommendations and explanations
        """
        reasoning_trace = []
        
        reasoning_trace.append(f"🔍 Analyzing project: {project_type}")
        
        # Get syllabus context if available
        context = self._retrieve_context([
            project_type,
            f"{project_type} technologies",
            requirements
        ], k=3)
        
        if context:
            reasoning_trace.append("✅ Syllabus context retrieved")
        else:
            reasoning_trace.append("📝 Using general knowledge")
        
        # Get template if available
        template = self.stack_templates.get(
            project_type.lower().replace(" ", "_"),
            {}
        )
        
        reasoning_trace.append("💡 Generating recommendations...")
        
        prompt = f"""
Recommend a complete tech stack for this project:

Project Type: {project_type}
Requirements: {requirements if requirements else "Standard project requirements"}

Provide recommendations in this format:

## 🎯 Recommended Tech Stack

### Frontend/Client
- **Primary Choice**: [Technology]
  - Why: [Reason]
  - Learning Curve: [Easy/Medium/Hard]

### Backend/Server
- **Primary Choice**: [Technology]
  - Why: [Reason]
  - Key Features: [Features]

### Database
- **Primary Choice**: [Technology]
  - Why: [Reason]
  - Best For: [Use cases]

### Additional Tools
- **[Category]**: [Tool] - [Brief reason]

## 📚 Getting Started
1. [First step]
2. [Second step]
3. [Third step]

## ⚠️ Things to Consider
- [Important consideration 1]
- [Important consideration 2]

Be specific and practical. Focus on what a student can realistically learn and use.
"""
        
        if template:
            prompt += f"\n\nConsider these options: {json.dumps(template)}"
        
        response = generate_answer(
            context=context if context else "General tech knowledge",
            question=prompt
        )
        
        reasoning_trace.append("✅ Recommendations generated")
        
        return {
            "stage": "RECOMMEND",
            "project_type": project_type,
            "requirements": requirements,
            "recommendations": response,
            "template": template,
            "reasoning_trace": reasoning_trace
        }
    
    def compare_technologies(self, tech1: str, tech2: str, context: str = "") -> Dict:
        """
        Compare two technologies with pros/cons
        
        Args:
            tech1: First technology
            tech2: Second technology
            context: Use case context
        
        Returns:
            Dict with comparison
        """
        reasoning_trace = []
        
        reasoning_trace.append(f"⚖️ Comparing: {tech1} vs {tech2}")
        
        # Get syllabus context
        syllabus_context = self._retrieve_context([
            tech1, tech2, f"{tech1} vs {tech2}"
        ], k=3)
        
        prompt = f"""
Compare these two technologies for a student choosing between them:

Technology 1: {tech1}
Technology 2: {tech2}
Context: {context if context else "General project use"}

Provide a detailed comparison:

## 📊 {tech1} vs {tech2}

### Overview
| Aspect | {tech1} | {tech2} |
|--------|---------|---------|
| Learning Curve | | |
| Performance | | |
| Community | | |
| Job Market | | |

### ✅ {tech1} Pros
- [Pro 1]
- [Pro 2]
- [Pro 3]

### ❌ {tech1} Cons
- [Con 1]
- [Con 2]

### ✅ {tech2} Pros
- [Pro 1]
- [Pro 2]
- [Pro 3]

### ❌ {tech2} Cons
- [Con 1]
- [Con 2]

### 🎯 When to Choose {tech1}
- [Scenario 1]
- [Scenario 2]

### 🎯 When to Choose {tech2}
- [Scenario 1]
- [Scenario 2]

### 💡 My Recommendation
[Clear recommendation based on context]

Be honest and balanced. Help the student make an informed decision.
"""
        
        response = generate_answer(
            context=syllabus_context if syllabus_context else "General knowledge",
            question=prompt
        )
        
        reasoning_trace.append("✅ Comparison generated")
        
        return {
            "stage": "COMPARE",
            "tech1": tech1,
            "tech2": tech2,
            "comparison": response,
            "reasoning_trace": reasoning_trace
        }
    
    def explain_concept(self, concept: str, depth: str = "intermediate") -> Dict:
        """
        Explain a technical concept in depth
        
        Args:
            concept: Technical concept to explain
            depth: 'beginner', 'intermediate', or 'advanced'
        
        Returns:
            Dict with explanation
        """
        reasoning_trace = []
        
        reasoning_trace.append(f"📖 Explaining: {concept} ({depth} level)")
        
        # Get syllabus context
        context = self._retrieve_context([
            concept,
            f"{concept} explanation",
            f"{concept} how it works"
        ], k=4)
        if context:
            reasoning_trace.append("✅ Context from syllabus")
        
        depth_instructions = {
            "beginner": "Use simple language, analogies, and avoid jargon. Assume no prior knowledge.",
            "intermediate": "Include technical details but explain them. Assume basic programming knowledge.",
            "advanced": "Go deep into implementation details, edge cases, and advanced patterns."
        }
        
        prompt = f"""
Explain this technical concept for a student:

Concept: {concept}
Level: {depth}

{depth_instructions.get(depth, depth_instructions['intermediate'])}

Structure your explanation:

## 🎯 What is {concept}?
[Clear definition]

## 💡 Why It Matters
[Importance and use cases]

## 🔧 How It Works
[Technical explanation with examples]

## 📝 Key Terms
- **Term 1**: Definition
- **Term 2**: Definition

## 💻 Simple Example
```
[Code snippet or pseudocode if applicable]
```
[Explanation of the example]

## 🔗 Related Concepts
- [Related concept 1] - Brief connection
- [Related concept 2] - Brief connection

## 📚 Next Steps
What to learn after understanding this concept.
"""
        
        response = generate_answer(
            context=context if context else "General knowledge",
            question=prompt
        )
        
        reasoning_trace.append("✅ Explanation generated")
        
        return {
            "stage": "EXPLAIN",
            "concept": concept,
            "depth": depth,
            "explanation": response,
            "reasoning_trace": reasoning_trace
        }
    
    def code_guidance(self, task: str, technology: str) -> Dict:
        """
        Provide code guidance (patterns, snippets, not full implementation)
        
        Args:
            task: What the student is trying to do
            technology: Technology being used
        
        Returns:
            Dict with code guidance
        """
        reasoning_trace = []
        
        reasoning_trace.append(f"🛠️ Code guidance: {task} with {technology}")
        
        # Get syllabus context
        context = self._retrieve_context([
            task, technology, f"{technology} {task}"
        ], k=3)
        
        prompt = f"""
Provide code guidance for a student trying to:

Task: {task}
Technology: {technology}

DO NOT write complete implementation. Instead:

## 🎯 Understanding the Task
[What the student needs to understand first]

## 📋 Step-by-Step Approach
1. [Step 1] - [Brief explanation]
2. [Step 2] - [Brief explanation]
3. [Step 3] - [Brief explanation]

## 💻 Key Code Patterns

### Pattern 1: [Name]
```{technology.lower()}
[Small code snippet - 5-10 lines max]
```
**What this does**: [Explanation]

### Pattern 2: [Name]
```{technology.lower()}
[Small code snippet - 5-10 lines max]
```
**What this does**: [Explanation]

## ⚠️ Common Mistakes
- [Mistake 1] - How to avoid
- [Mistake 2] - How to avoid

## 🔗 Resources
- [Official docs link or description]
- [Tutorial recommendation]

Help the student understand HOW to approach this, not just give them code to copy.
"""
        
        response = generate_answer(
            context=context if context else "General knowledge",
            question=prompt
        )
        
        reasoning_trace.append("✅ Guidance generated")
        
        return {
            "stage": "CODE_GUIDE",
            "task": task,
            "technology": technology,
            "guidance": response,
            "reasoning_trace": reasoning_trace
        }


# Convenience functions
def recommend_tech_stack(project_type: str, requirements: str = "") -> Dict:
    """Get tech stack recommendations"""
    agent = TechStackAgent()
    return agent.recommend_stack(project_type, requirements)

def compare_tech(tech1: str, tech2: str, context: str = "") -> Dict:
    """Compare two technologies"""
    agent = TechStackAgent()
    return agent.compare_technologies(tech1, tech2, context)

def explain_tech(concept: str, depth: str = "intermediate") -> Dict:
    """Explain a technical concept"""
    agent = TechStackAgent()
    return agent.explain_concept(concept, depth)

def get_code_help(task: str, technology: str) -> Dict:
    """Get code guidance for a task"""
    agent = TechStackAgent()
    return agent.code_guidance(task, technology)
