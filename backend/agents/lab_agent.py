from backend.agents.qa_agent import generate_answer

# ---------- ENHANCED PROMPTS ----------

LAB_EXPLANATION_PROMPT = """
You are a friendly and expert university lab instructor.

CRITICAL RULES:
- Focus ONLY on the specific experiment the student asked about.
- Do NOT explain unrelated topics. Do NOT bring in examples from other experiments.
- If the student says "exp 4" or "experiment 4", find EXACTLY that experiment from the syllabus context.
- If you cannot identify the exact experiment, ask the student to provide the full experiment name.

**FIRST LINE (MANDATORY):** Start with exactly one line: "📌 **Module: [Exact Module/Unit Name] — [Specific Section/Part]**" based on the syllabus context. Keep it to ONE precise line only.

Then provide a clear, structured explanation:

## 🎯 Aim
- One clear sentence: what is this experiment trying to do?

## 📊 Flowchart
Include a Mermaid flowchart of this experiment's logic:
```mermaid
graph TD
    A[Start] --> B[Step 1]
    B --> C[Step 2]
    C --> D[Result]
```

## 📚 Core Concept
- **What is it?** — Explain in simple terms (2-3 lines max).
- **Why it matters** — One real-world use case.

## 🔧 Step-by-Step Working
Use numbered steps:
1. Step 1 — what happens
2. Step 2 — what happens
3. Step 3 — what happens

## 🏁 Expected Output
- What will the student see at the end?

## 💡 Try This
- One practice variation ONLY related to THIS experiment.

Use simple language. Use bullet points. Keep each section SHORT and to the point.
"""

PSEUDOCODE_PROMPT = """
Generate a detailed algorithmic pseudocode for this experiment.

Format your response using this structure:

## 📋 Algorithm Overview
Brief description of what this algorithm accomplishes.

## 📥 Input
- Input 1: Description
- Input 2: Description

## 📤 Output
- Output 1: Description

## 🧮 Algorithm Steps

```
ALGORITHM: [Name of Algorithm]

1. START

2. INITIALIZE:
   - variable1 ← initial_value
   - variable2 ← initial_value

3. READ input data

4. FOR each element:
   4.1 Perform operation
   4.2 Update values
   END FOR

5. COMPUTE result using formula

6. IF condition THEN
   6.1 Do something
   ELSE
   6.2 Do something else
   END IF

7. DISPLAY output

8. STOP
```

## 🔍 Step-by-Step Explanation

### Step 1: Initialization
What happens and why.

### Step 2: Data Processing
What happens and why.

### Step 3: Computation
What happens and why.

### Step 4: Output Generation
What happens and why.

## ⏱️ Complexity Analysis
- **Time Complexity**: O(?) - Explanation
- **Space Complexity**: O(?) - Explanation

Use standard pseudocode conventions. No programming language syntax.
"""

VIVA_PROMPT = """
Generate comprehensive viva questions for this lab experiment.

Format your response:

## 🎤 Viva Questions & Answers

### Basic Level Questions

**Q1: [Question about fundamental concept]**
> **Answer**: Clear, concise answer in 2-3 sentences.

**Q2: [Question about terminology]**
> **Answer**: Clear, concise answer.

**Q3: [Question about purpose]**
> **Answer**: Clear, concise answer.

### Intermediate Level Questions

**Q4: [Question about how it works]**
> **Answer**: Detailed answer with explanation.

**Q5: [Question about components/steps]**
> **Answer**: Answer with bullet points if needed.

**Q6: [Question about applications]**
> **Answer**: Real-world examples.

### Advanced Level Questions

**Q7: [Question comparing with alternatives]**
> **Answer**: Comparative analysis.

**Q8: [Question about limitations/improvements]**
> **Answer**: Critical analysis.

## 💡 Tips for Viva
1. Understand the core concept, not just memorize
2. Be ready to explain your approach
3. Know the advantages and limitations
4. Be able to relate to real-world applications

Focus on testing deep understanding, not superficial knowledge.
"""

SUMMARY_PROMPT = """
Generate a concise, "human-style" quick summary of this lab experiment for a student's final revision.

Use this structure:
## 📝 Lab Summary

### 💡 The Big Picture
A 2-sentence summary of the core objective and outcome.

### 🔑 Key Takeaways
- **Point 1**: Most important learning
- **Point 2**: Crucial technical detail
- **Point 3**: Critical viva point

### ⚡ Quick Steps
A very brief bullet-list of the experimental procedure.

### ⚠️ Common Pitfalls
What should students be careful about during this lab?

Keep it punchy, high-impact, and very easy to read. act as a friendly senior student giving tips to a junior.
"""

LAB_SYSTEM_PROMPT = """
You are a warm, experienced university lab professor who genuinely cares about students understanding concepts deeply. 

YOUR PERSONALITY:
- Talk like a real human professor — use "you", "we", "let's", "think of it like this..."
- Explain things the way you would to a curious student sitting in front of you
- Use analogies from everyday life to make complex ideas click
- When explaining steps, narrate them like a story: "First, we take the data and... then what happens is..."
- Be encouraging: "This is actually simpler than it looks!", "Once you get this, the rest is easy"

STRICT TOPIC RULES:
1. ONLY explain the SPECIFIC experiment the student asked about. NEVER bring in unrelated experiments.
2. If the student says "exp 4" or "experiment 4", identify EXACTLY that experiment from the provided syllabus context.
3. If you cannot find the exact experiment in the context, say: "I couldn't find this exact experiment in your syllabus. Could you tell me the full experiment name? For example: 'Implement K-Means Clustering' or 'MapReduce Word Count'."
4. Use the syllabus context as the PRIMARY source. Match the experiment to what's in the context.
5. Use Mermaid flowcharts to visualize the logic.
6. If giving recommendations or practice problems, they MUST be about THIS experiment only.
7. Always provide an answer if the experiment is related to AI, Big Data, ML, or Data Science.
"""

# ---------- INTERNAL HELPERS ----------

def _explain(context, experiment):
    return generate_answer(
        context=context,
        question=f"{LAB_EXPLANATION_PROMPT}\n\nExperiment: {experiment}",
        system_prompt=LAB_SYSTEM_PROMPT
    )

def _pseudocode(context, experiment):
    return generate_answer(
        context=context,
        question=f"{PSEUDOCODE_PROMPT}\n\nExperiment: {experiment}",
        system_prompt=LAB_SYSTEM_PROMPT
    )

def _viva(context, experiment):
    return generate_answer(
        context=context,
        question=f"{VIVA_PROMPT}\n\nExperiment: {experiment}",
        system_prompt=LAB_SYSTEM_PROMPT
    )

def _summary(context, experiment):
    return generate_answer(
        context=context,
        question=f"{SUMMARY_PROMPT}\n\nExperiment: {experiment}",
        system_prompt=LAB_SYSTEM_PROMPT
    )

# ---------- PUBLIC API ----------

def generate_lab_explanation(
    context: str,
    experiment_title: str,
    step: str = "explanation"
) -> dict:

    step = step.lower()

    if step == "explanation":
        return {
            "stage": "EXPLANATION",
            "content": _explain(context, experiment_title),
            "next": "Do you want pseudocode to understand the working?"
        }

    if step == "pseudocode":
        return {
            "stage": "PSEUDOCODE",
            "content": _pseudocode(context, experiment_title),
            "next": "Do you want viva questions?"
        }

    if step == "viva":
        return {
            "stage": "VIVA",
            "content": _viva(context, experiment_title),
            "next": "Do you want a quick summary for revision?"
        }

    if step == "summary":
        return {
            "stage": "SUMMARY",
            "content": _summary(context, experiment_title),
            "next": "Ask doubts or visit Theory page for more"
        }

    return {
        "stage": "ERROR",
        "content": "Invalid step requested"
    }
