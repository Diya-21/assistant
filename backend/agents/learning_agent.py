from backend.agents.qa_agent import generate_answer
import json
import re

QUIZ_PROMPT = """
Generate 5 multiple-choice questions to TEST the student's understanding of the CONCEPTS in this topic.

CRITICAL RULES:
- DO NOT ask about syllabus structure, course codes, or chapter titles
- Ask about CONCEPTS, DEFINITIONS, APPLICATIONS, and TECHNICAL KNOWLEDGE only
- Questions should test understanding of the actual subject matter
- Use ONLY the concepts and content from the provided context
- Each question must have exactly 4 options
- Provide correct option index (0-based: 0, 1, 2, or 3)
- Output STRICT JSON format only

GOOD EXAMPLES:
- "What is the primary function of HDFS in Hadoop?"
- "Which technique is used for handling missing data?"
- "What does the term 'overfitting' mean in machine learning?"

BAD EXAMPLES (NEVER ASK):
- "What is the course code for this subject?"
- "Which lab covers this topic?"
- "What chapter discusses this?"

Required JSON Format:
{
  "questions": [
    {
      "id": 1,
      "question": "What is...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 2
    }
  ]
}
"""

def clean_json_response(raw_text: str) -> str:
    """Extract JSON from markdown code blocks or clean text"""
    raw_text = re.sub(r'```json\s*', '', raw_text)
    raw_text = re.sub(r'```\s*', '', raw_text)
    
    json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
    if json_match:
        return json_match.group(0)
    
    return raw_text.strip()

def learning_flow(context: str, topic: str, stage: str):
    stage = stage.lower()

    if stage == "explain":
        prompt = f"""
Explain **{topic}** in a clear, structured way for a student who is new to this concept.

Format your response using this structure:

## 🎯 What is {topic}?
A simple, one-paragraph definition that anyone can understand.

## 💡 Key Points
- **Point 1**: Brief explanation
- **Point 2**: Brief explanation  
- **Point 3**: Brief explanation

## 🔧 How It Works
Explain the mechanism or process in simple terms. Use an analogy if helpful.

## 📱 Real-World Example
Give one concrete, relatable example of how this is used in practice.

## ✅ Quick Summary
One sentence that captures the essence of this topic.

Keep the explanation concise, use bullet points, and avoid jargon. Make it beginner-friendly.
"""
        content = generate_answer(context=context, question=prompt)
        return {
            "stage": "EXPLAIN",
            "content": content,
            "next": "Would you like a deeper explanation?"
        }

    if stage == "deep":
        prompt = f"""
Provide a **comprehensive technical explanation** of **{topic}** for a student preparing for exams.

Format your response using this structure:

## 📚 In-Depth Overview
A detailed explanation covering all important aspects.

## 🔬 Technical Details

### Core Concepts
- **Concept 1**: Detailed explanation
- **Concept 2**: Detailed explanation

### How It Works (Step by Step)
1. **Step 1**: What happens and why
2. **Step 2**: What happens and why
3. **Step 3**: What happens and why

### Mathematical/Technical Formulas (if applicable)
Include any relevant formulas or algorithms.

## 🏗️ Architecture/Components
Describe the main components and how they interact.

## ⚡ Advantages
1. Advantage 1
2. Advantage 2

## ⚠️ Limitations
1. Limitation 1
2. Limitation 2

## 🌍 Applications
- Application 1: Brief description
- Application 2: Brief description

## 🔗 Related Concepts
- Related Topic 1 - How it connects
- Related Topic 2 - How it connects

Be thorough but organized. Use markdown formatting for clarity.
"""
        content = generate_answer(context=context, question=prompt)
        return {
            "stage": "DEEP",
            "content": content,
            "next": "Would you like learning references?"
        }

    if stage == "references":
        prompt = f"""
Suggest learning resources and study materials for **{topic}**.

Format your response:

## 📖 Official Documentation
- Link or resource name and what it covers

## 📺 Video Tutorials
- **YouTube**: Recommend specific channels or video types
- **Courses**: Coursera, Udemy, edX recommendations

## 📚 Books
- Book title by Author - Brief description of what it covers

## 💻 Hands-On Practice
- Websites for practice (Kaggle, LeetCode, etc.)
- Project ideas to implement

## 📝 Quick References
- Cheat sheets or quick reference guides

## 🎓 Study Strategy
1. First, learn this...
2. Then practice this...
3. Finally, build this...

Focus on free and accessible resources when possible.
"""
        content = generate_answer(context=context, question=prompt)
        return {
            "stage": "REFERENCES",
            "content": content,
            "next": "Ready to take a quiz?"
        }

    if stage == "quiz":
        raw = generate_answer(
            context=context,
            question=QUIZ_PROMPT + f"\n\nTopic: {topic}\n\nContext:\n{context[:2000]}"
        )

        try:
            cleaned = clean_json_response(raw)
            quiz_data = json.loads(cleaned)
            
            if "questions" not in quiz_data:
                raise ValueError("Missing 'questions' key")
            
            questions = quiz_data["questions"]
            
            for q in questions:
                if not all(k in q for k in ["question", "options", "answer"]):
                    raise ValueError("Invalid question structure")
                if len(q["options"]) != 4:
                    raise ValueError("Each question must have exactly 4 options")
            
            return {
                "stage": "QUIZ",
                "questions": questions
            }
        except json.JSONDecodeError as e:
            return {
                "stage": "ERROR",
                "content": f"Quiz generation failed: Invalid JSON format. Please try again."
            }
        except Exception as e:
            return {
                "stage": "ERROR",
                "content": f"Quiz generation failed: {str(e)}"
            }

    return {
        "stage": "ERROR",
        "content": "Invalid stage specified"
    }