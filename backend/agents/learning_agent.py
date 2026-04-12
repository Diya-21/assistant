from backend.agents.qa_agent import generate_answer, GENERAL_PROMPT, STRICT_SYLLABUS_PROMPT
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

def learning_flow(context: str, topic: str, stage: str, verification: dict = None):
    stage = stage.lower()
    
    unit_info = ""
    if verification and verification.get("matched_unit"):
        unit_info = f" (This topic is part of **{verification['matched_unit']}** of your syllabus)"

    if stage == "overview":
        prompt = """The student wants a **Syllabus Overview**.
Analyze the provided syllabus context and provide:
1. **Curriculum Structure**: List all Modules/Units found.
2. **Key Themes**: What are the main topics covered in this subject?
3. **Module Breakdown**: For each module, list 3-5 major sub-topics.
4. **Learning Path**: Suggest a logical order to study these modules.

Use ## headers and bullet points. Be concise but comprehensive."""
        content = generate_answer(context=context, question=prompt, system_prompt=STRICT_SYLLABUS_PROMPT)
        return {
            "stage": "OVERVIEW",
            "content": content,
            "next": "Which module would you like to start with?"
        }

    if stage == "explain":
        all_units = verification.get("all_units", []) if verification else []
        cross_ref = f"This concept also appears in or relates to: **{', '.join([u for u in all_units])}**." if all_units else ""
        
        prompt = f"""The student wants to learn about **{topic}**.
{unit_info}
Their syllabus topics are provided above as context.

### MANDATORY RESPONSE STRUCTURE (FOLLOW ORDER):
1. **EXACT MODULE**: Start with "📌 **Module:** [Exact Module/Unit Name] (Primary)"
2. **BRIEF OVERVIEW**: Provide a brief 3-point summary:
   - **What is it?**: A clear, 1-sentence definition.
   - **Why is it?**: The actual problem it solves or why we need it.
   - **Main Role**: What it actually does in the system/subject.
3. **THEN** explain the topic in a warm, human way:
   - Use analogies: "Think of it like..."
   - **VISUALIZATION**: If there is a process, architecture, or flow, ALWAYS include a professional Mermaid flowchart (` ```mermaid `) to show how it works.
   - Walk through concepts step by step like on a whiteboard
   - Give a real-world example that makes the concept click
   - Use ## headers for each major section
4. **END WITH**:
   - 💪 **Try This**: One specific practice problem on this topic
   - ➡️ **Up Next**: The next logical topic from the syllabus
Stay strictly within the provided context.
"""
        content = generate_answer(context=context, question=prompt, system_prompt=STRICT_SYLLABUS_PROMPT)
        return {
            "stage": "EXPLAIN",
            "content": content,
            "next": "Would you like a deeper explanation?"
        }

    if stage == "deep":
        prompt = f"""Provide a detailed, exam-level explanation of **{topic}**.
The student's syllabus topics are provided above.

If this topic is in the syllabus, cover in depth:
- Core theory and technical details
- Processes, formulas, or architectures
- Advantages and limitations
- Real-world applications

If this topic is NOT in the syllabus, say so.

Use ## headers, markdown tables for comparisons. Do NOT generate quiz questions.
"""
        content = generate_answer(context=context, question=prompt, system_prompt=STRICT_SYLLABUS_PROMPT)
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