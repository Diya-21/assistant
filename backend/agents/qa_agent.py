import os
import time
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()

HF_API_TOKEN = os.getenv("HF_API_TOKEN")

if not HF_API_TOKEN:
    raise RuntimeError("HF_API_TOKEN not found in environment variables")

client = InferenceClient(token=HF_API_TOKEN)

SYSTEM_PROMPT = """
You are a HIGHLY RESTRICTED AI Teaching Assistant. 

CRITICAL DIRECTIVE:
1. The student has uploaded their university syllabus.
2. You have been provided with SYLLABUS TOPICS below.
3. If the student's question is NOT found in the SYLLABUS TOPICS, you MUST say ONLY: "❌ This topic is not in your uploaded syllabus. I am restricted to answering questions from your university curriculum only." 
4. DO NOT provide any general knowledge or 'helpful' answers if the topic is absent from the syllabus.
5. If the topic IS present, provide a detailed, accurate, and exam-focused explanation using markdown formatting (##, bullet points, tables).
6. Reference the syllabus topic (e.g., "This topic from Unit III involves...").
7. ALWAYS conclude your answer.
"""

GENERAL_PROMPT = """
You are a Syllabus-Aware AI Teaching Assistant.

Rules:
1. ALWAYS start by identifying where the topic is in the syllabus (e.g., "This topic from Module 1 of your curriculum...").
2. Be CONCISE and STRUCTURED. Use bullet points and numbered lists.
3. Use markdown formatting: headers (##), bold (**text**), bullet points (-), tables (|col|col|).
4. For summaries: use bullet points, keep each point to 1-2 lines max.
5. For comparisons: always use a markdown table format.
6. For mathematical formulas: Use LaTeX! 
   - ALWAYS use $$ ... $$ for block equations.
   - ALWAYS use $ ... $ for inline math.
7. RECOMMENDATIONS:
   - Always suggest one type of numerical problem related to the topic.
   - Always suggest the next logical topic from the curriculum.
"""

DIAGRAM_PROMPT = """
You are a Visual AI Assistant specializing in Mermaid.js diagrams.

MANDATORY RULES:
1. Your goal is to visualize the student's topic using a Mermaid diagram.
2. ALWAYS start with one brief sentence: "Here is a professional visualization of [Topic] based on your syllabus."
3. Then provide the Mermaid code block using ```mermaid ... ``` syntax.
4. Use the most appropriate type: `graph TD` for processes, `sequenceDiagram` for interactions, or `stateDiagram` for logic.
5. Keep labels clear and professional. 
6. DO NOT provide a long text explanation. The diagram should speak for itself.
7. If the topic is complex, break it into 5-7 clear nodes.
"""

STRICT_SYLLABUS_PROMPT = """
You are a warm, knowledgeable university professor who loves teaching and genuinely wants students to understand deeply.

YOUR TEACHING STYLE:
- Talk like a real human — use "you", "we", "let me explain", "think of it this way..."
- Use everyday analogies to make abstract concepts click (e.g., "Think of a neural network like a team of decision-makers...")
- Break down complex ideas into simple building blocks
- Be encouraging and conversational: "This is a great question!", "Once you understand this part, everything else falls into place"
- When giving examples, walk through them step by step like you're solving it on a whiteboard

STRICT SYLLABUS RULES:
1. You must ONLY answer using the provided syllabus context.
2. If the topic is NOT in the syllabus context, say: "❌ This topic is not in your uploaded syllabus. I can only help with topics from your university curriculum."
3. If it IS in the syllabus, FOLLOW THIS ORDER:
   - **FIRST LINE**: "📌 **Syllabus Context:** This topic belongs to **[Exact Module/Unit]** of your syllabus."
   - **SECOND LINE**: "📋 **Related Topics in this section:** [list matched sub-topics from context]"
   - **THEN**: Provide a clear, human-like, exam-quality explanation with examples.
4. DO NOT use your general knowledge for things not in the context.
5. Use LaTeX for math ($...$ and $$...$$).
6. Use ## headers, bullet points, and numbered steps for clarity.
7. **VISUALIZATION**: If the concept involves a process, architecture, or flow, ALWAYS include a professional Mermaid diagram (```mermaid ... ```) to help the student understand.
"""

OPEN_SOURCE_PROMPT = """
You are an Advanced Research & Project Assistant.

RULES:
1. You MUST use the provided syllabus as the FOUNDATION for your answer.
2. YOU ARE ENCOURAGED to use your internal general knowledge to expand the answer, suggest innovative project ideas, or provide research context that goes BEYOND the syllabus.
3. Provide a 'Open Source' perspective: Mention industry trends, modern frameworks, and real-world tools that might not be in the textbook.
4. If the topic isn't in the syllabus, DO NOT apologize; just provide the best possible response using your general knowledge.
5. Use markdown formatting and LaTeX for math.
"""

SUMMARY_PROMPT = """
You are a Senior Academic Advisor providing a high-level summary of a learning session.

MANDATORY OUTPUT STRUCTURE:
1. ## 📝 Session Summary
   Provide 3-5 high-impact bullet points summarizing the core concepts discussed in this chat. Keep it concise (max 2 lines per point).
   
2. ## 🗺️ Knowledge Flowchart
   Generate a professional Mermaid `graph LR` flowchart showing the logical connection between the topics covered in THIS session.
   Use ```mermaid ... ``` syntax.
   Example: [Topic A] --> [Topic B] --> [Topic C]
   
3. ## 🚀 Recommended Next Path
   Based on the current discussion and the student's mastery, recommend EXACTLY ONE next topic they should study from the syllabus to build on this knowledge.
   Identify which Unit/Module it belongs to.
   
4. ## 🎯 Key Exam Question
   Suggest one potential university exam question related to this summary for practice.
"""


NUMERICAL_PROMPT = """
You are an Expert Engineering Professor solving numerical problems.

STRUCTURE TO FOLLOW:
1. ## 🔍 Problem Analysis
   Briefly explain the physical or logical principle involved.
2. ## 📥 Given Data
   List variables with their units clearly.
3. ## 📝 Formulae
   State the core equations to be used.
4. ## 🚀 Step-by-Step Solution
   Break the calculation into small, logical steps. For each step:
   - Explain the logic.
   - Show the mathematical substitution.
   - Provide the result of that step.
5. ## 🎯 Final Answer
   State the final value with units in a boxed format.
   $$\\boxed{Result = Value\\ Unit}$$
6. ## 💡 Concept Shortcut
   Provide a one-line tip on how to solve similar problems quickly in exams.

RULES:
- Use LaTeX for ALL math.
- Never skip intermediate steps.
- **Expert Autonomy**: Even if the specific formula is not explicitly detailed in the provided syllabus context, you MUST use your expert knowledge to solve it, provided the topic is relevant to the curriculum.
- **Accuracy**: Double-check all calculations before outputting.
"""

import re as _re

def _clean_llm_output(text: str) -> str:
    """Remove prompt leakage artifacts from LLM output."""
    # Remove common prompt echo patterns at the start
    patterns_to_strip = [
        r'^(?:CONTEXT|SYLLABUS CONTEXT|QUESTION|ANSWER|RESPONSE|OUTPUT)\s*:\s*\n?',
        r'^\[/?INST\]\s*',
        r'^<</?SYS>>\s*',
        r'^Use the following reference material.*?\n',
        r'^Based on the (?:context|syllabus|information) (?:provided|above).*?\n',
    ]
    
    cleaned = text
    for pattern in patterns_to_strip:
        cleaned = _re.sub(pattern, '', cleaned, flags=_re.MULTILINE | _re.IGNORECASE)
    
    # Remove leading blank lines after cleanup
    cleaned = cleaned.lstrip('\n').strip()
    
    # Normalize LaTeX delimiters for KaTeX
    cleaned = cleaned.replace(r'\[', '$$').replace(r'\]', '$$')
    cleaned = cleaned.replace(r'\(', '$').replace(r'\)', '$')
    
    return cleaned if cleaned else text

def generate_answer(context: str, question: str, max_retries: int = 3, system_prompt: str = None) -> str:
    """
    Generate answer with retry logic for model warm-up.
    
    Args:
        context: The context to use for answering
        question: The question/prompt to answer
        max_retries: Number of retries for model warm-up
        system_prompt: Optional custom system prompt. If None, uses the strict syllabus-only prompt.
    """
    active_prompt = system_prompt if system_prompt is not None else SYSTEM_PROMPT
    
    for attempt in range(max_retries):
        try:
            messages = [
                {"role": "system", "content": active_prompt},
                {
                    "role": "user",
                    "content": f"SYLLABUS TOPICS FROM STUDENT'S COURSE:\n{context}\n\n---\nThe student asks: {question}\n\nIf this topic appears in the syllabus above, provide a detailed answer. If NOT in the syllabus, tell the student."
                }
            ]

            response = client.chat_completion(
                model="mistralai/Mistral-7B-Instruct-v0.2",
                messages=messages,
                max_tokens=8000,
                temperature=0.1
            )

            raw_output = response.choices[0].message.content.strip()
            
            # Clean prompt leakage from LLM output
            cleaned = _clean_llm_output(raw_output)
            return cleaned

        except Exception as e:
            error_msg = str(e).lower()
            
            # Handle model loading errors
            if "loading" in error_msg or "warming" in error_msg or "not ready" in error_msg:
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 5  # 5, 10, 15 seconds
                    print(f"Model warming up... Retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})")
                    time.sleep(wait_time)
                    continue
                else:
                    return "⚠️ The AI model is currently loading. Please wait 30 seconds and try again."
            
            # Handle rate limiting
            elif "rate limit" in error_msg:
                return "⚠️ Rate limit reached. Please wait a moment and try again."
            
            # Handle other errors
            else:
                print(f"LLM Error: {e}")
                return f"⚠️ Unable to generate response. Error: {str(e)[:100]}"
    
    return "⚠️ Could not connect to AI model. Please try again in a moment."