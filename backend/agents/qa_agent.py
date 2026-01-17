import os
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

# ✅ THIS FUNCTION MUST EXIST AT TOP LEVEL
def generate_answer(context: str, question: str) -> str:
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

        response = client.chat_completion(
            model="HuggingFaceH4/zephyr-7b-beta",  # safer free model
            messages=messages,
            max_tokens=300,
            temperature=0.3
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        return f"LLM Error: {str(e)}"
