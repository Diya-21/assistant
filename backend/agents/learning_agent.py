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
- DO NOT use any asterisks (*) for formatting or emphasis in the JSON values
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
        prompt = f"""The student wants to learn about **{topic}**.

Provide a clear, accurate explanation that directly addresses this topic. Structure your answer naturally using markdown:
- Start with a concise definition or overview (1-2 paragraphs)
- Cover the key concepts and important points
- Include a practical example or analogy if helpful
- End with a brief summary

IMPORTANT RULES:
- Answer the topic DIRECTLY. Do not pad with irrelevant information.
- Use ## headers to organize sections logically.
- Do NOT generate quiz questions, multiple-choice questions, or test questions. Only explain.
- If the context mentions the topic, base your explanation on it. If not, use general knowledge but stay accurate.
- Be concise. Quality over quantity.
"""
        content = generate_answer(context=context, question=prompt)
        return {
            "stage": "EXPLAIN",
            "content": content,
            "next": "Would you like a deeper explanation?"
        }

    if stage == "deep":
        prompt = f"""Provide a comprehensive, exam-level explanation of **{topic}**.

Cover the following aspects in depth:
- Detailed overview and core theory
- Technical details, processes, and any relevant formulas (use LaTeX: $inline$ and $$block$$)
- Architecture or components if applicable
- Advantages and limitations
- Real-world applications
- Related concepts worth knowing

IMPORTANT RULES:
- Use ## headers and organize logically.
- Use markdown tables for comparisons.
- Do NOT generate quiz questions or MCQs. Only explain.
- Be thorough but accurate — no filler or made-up facts.
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
- DO NOT use any asterisks (*) for bolding or emphasis in the question text or options

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
                    
                    # Clean asterisks from question and options
                    q["question"] = q["question"].replace("*", "")
                    q["options"] = [opt.replace("*", "") for opt in q["options"]]
                    
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