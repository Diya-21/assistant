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
You are an AI Teaching Assistant for college students. You MUST answer strictly based on the SYLLABUS CONTEXT provided below.

Rules:
1. ONLY use information from the SYLLABUS CONTEXT to answer. Do NOT add information from your general knowledge.
2. If the SYLLABUS CONTEXT does not contain enough information to answer the question, clearly state: "⚠️ This topic is not covered in your uploaded syllabus. Please upload a relevant syllabus or ask about a topic from your course material."
3. Be CONCISE and STRUCTURED. Use bullet points and numbered lists.
4. Use markdown formatting: headers (##), bold (**text**), bullet points (-), tables (|col|col|).
5. Keep answers focused — avoid unnecessary filler or repetition.
6. ALWAYS complete your answer fully. Never stop mid-sentence.
7. For summaries: use bullet points, keep each point to 1-2 lines max.
8. For comparisons: always use a markdown table format.
9. For mathematical formulas: use LaTeX notation with $ for inline and $$ for block equations.
10. Keep font sizes natural — use ## for sections, ### for sub-sections only.
11. NEVER generate quiz questions, multiple-choice questions, or test items in your response unless the user EXPLICITLY asks for a quiz. Your job is to EXPLAIN, not to test.

IMPORTANT: Your knowledge boundary is the SYLLABUS CONTEXT. Do not go beyond it.
"""

GENERAL_PROMPT = """
You are an AI Teaching Assistant for college students.

Rules:
1. Be CONCISE and STRUCTURED. Use bullet points and numbered lists.
2. Use markdown formatting: headers (##), bold (**text**), bullet points (-), tables (|col|col|).
3. Keep answers focused — avoid unnecessary filler or repetition.
4. If syllabus context is provided, use it to enhance your answer. Otherwise use your general knowledge.
5. ALWAYS complete your answer fully. Never stop mid-sentence.
6. For summaries: use bullet points, keep each point to 1-2 lines max.
7. For comparisons: always use a markdown table format.
8. For mathematical formulas: use LaTeX notation with $ for inline and $$ for block equations.
9. Keep font sizes natural — use ## for sections, ### for sub-sections only.
10. NEVER generate quiz questions, multiple-choice questions, or test items unless the user EXPLICITLY asks for a quiz. Your job is to EXPLAIN, not to test.
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
                    "content": f"{question}\n\nUse the following reference material to inform your answer:\n{context}"
                }
            ]

            response = client.chat_completion(
                model="mistralai/Mistral-7B-Instruct-v0.2",
                messages=messages,
                max_tokens=8000,
                temperature=0.3
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