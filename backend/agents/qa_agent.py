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
You are an AI Teaching Assistant.

Rules:
1. Answer ONLY using the provided syllabus context.
2. Do NOT use outside knowledge.
3. If the answer is not present in the syllabus, say:
   "This topic is not covered in the syllabus."
4. Keep answers clear, structured, and student-friendly.
"""

def generate_answer(context: str, question: str, max_retries: int = 3) -> str:
    """
    Generate answer with retry logic for model warm-up
    """
    for attempt in range(max_retries):
        try:
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"""
SYLLABUS CONTEXT:
{context}

QUESTION:
{question}
"""
                }
            ]

            # ✅ REMOVED timeout parameter - it's not supported
            response = client.chat_completion(
                model="mistralai/Mistral-7B-Instruct-v0.2",
                messages=messages,
                max_tokens=500,
                temperature=0.3
            )

            return response.choices[0].message.content.strip()

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