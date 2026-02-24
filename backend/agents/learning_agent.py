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
        prompt = f"""Explain **{topic}** clearly for a beginner student. Structure your answer with these markdown sections:
1. "## 🎯 What is {topic}?" — one paragraph definition
2. "## 💡 Key Points" — 3-5 bullet points with bold titles
3. "## 🔧 How It Works" — simple explanation, use an analogy
4. "## 📱 Real-World Example" — one practical example
5. "## ✅ Quick Summary" — one sentence summary

Write the actual content for each section. Be concise and use markdown formatting.
"""
        content = generate_answer(context=context, question=prompt)
        return {
            "stage": "EXPLAIN",
            "content": content,
            "next": "Would you like a deeper explanation?"
        }

    if stage == "deep":
        prompt = f"""Give a comprehensive technical explanation of **{topic}** for exam preparation. Structure your answer with these markdown sections:
1. "## 📚 In-Depth Overview" — detailed explanation of the topic
2. "## 🔬 Technical Details" — with sub-sections for core concepts, step-by-step process, and any formulas (use LaTeX: $inline$ and $$block$$)
3. "## 🏗️ Architecture/Components" — main components and how they interact
4. "## ⚡ Advantages" — numbered list of benefits
5. "## ⚠️ Limitations" — numbered list of drawbacks
6. "## 🌍 Applications" — real-world use cases
7. "## 🔗 Related Concepts" — connected topics

Write detailed, actual content for every section. Use markdown tables where comparisons are useful.
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
        quiz_prompt = f"""Generate exactly 5 multiple-choice questions about **{topic}** based ONLY on the syllabus context provided.

RULES:
- Ask about CONCEPTS, DEFINITIONS, APPLICATIONS, and TECHNICAL KNOWLEDGE only
- Do NOT ask about syllabus structure, course codes, or chapter titles
- Each question must have exactly 4 options
- Provide the correct option index (0, 1, 2, or 3)
- Output ONLY valid JSON, nothing else — no explanation, no markdown

Output this EXACT JSON structure:
{{"questions": [{{"id": 1, "question": "What is...", "options": ["A", "B", "C", "D"], "answer": 2}}, {{"id": 2, "question": "Which...", "options": ["A", "B", "C", "D"], "answer": 0}}, {{"id": 3, "question": "How...", "options": ["A", "B", "C", "D"], "answer": 1}}, {{"id": 4, "question": "What...", "options": ["A", "B", "C", "D"], "answer": 3}}, {{"id": 5, "question": "Why...", "options": ["A", "B", "C", "D"], "answer": 1}}]}}

IMPORTANT: Output ONLY the JSON object. No text before or after it."""

        max_quiz_attempts = 3
        last_error = None

        for attempt in range(max_quiz_attempts):
            try:
                raw = generate_answer(
                    context=context,
                    question=quiz_prompt
                )
                
                cleaned = clean_json_response(raw)
                quiz_data = json.loads(cleaned)
                
                if "questions" not in quiz_data:
                    raise ValueError("Missing 'questions' key")
                
                questions = quiz_data["questions"]
                
                if len(questions) < 2:
                    raise ValueError("Too few questions generated")

                valid_questions = []
                for i, q in enumerate(questions):
                    if not all(k in q for k in ["question", "options", "answer"]):
                        continue
                    if len(q["options"]) != 4:
                        continue
                    if "id" not in q:
                        q["id"] = i + 1
                    # Ensure answer is an integer
                    q["answer"] = int(q["answer"])
                    valid_questions.append(q)
                
                if len(valid_questions) < 2:
                    raise ValueError("Not enough valid questions after filtering")

                return {
                    "stage": "QUIZ",
                    "questions": valid_questions
                }
            except (json.JSONDecodeError, ValueError) as e:
                last_error = str(e)
                print(f"⚠️ Quiz attempt {attempt + 1}/{max_quiz_attempts} failed: {e}")
                continue
            except Exception as e:
                last_error = str(e)
                print(f"❌ Quiz attempt {attempt + 1}/{max_quiz_attempts} error: {e}")
                continue

        return {
            "stage": "ERROR",
            "content": f"⚠️ Quiz generation failed after {max_quiz_attempts} attempts. Error: {last_error}. Please try again."
        }

    return {
        "stage": "ERROR",
        "content": "Invalid stage specified"
    }