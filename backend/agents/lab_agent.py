from backend.agents.qa_agent import generate_answer

def generate_lab_explanation(context: str, experiment_title: str) -> str:
    prompt = f"""
Experiment: {experiment_title}

Using ONLY the syllabus context below, generate:
1. Aim
2. Theory
3. Algorithm
4. Pseudocode
5. Viva Questions

SYLLABUS CONTEXT:
{context}
"""

    return generate_answer(
        context=context,
        question=prompt
    )
