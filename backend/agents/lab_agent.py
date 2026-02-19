from backend.agents.qa_agent import generate_answer

# ---------- ENHANCED PROMPTS ----------

LAB_EXPLANATION_PROMPT = """
You are a friendly and expert university lab instructor. You are explaining a technical experiment to a curious student. Your goal is to make it crystal clear, engaging, and visual.

Provide a highly structured and conversational explanation using this format:

## 🎯 Aim
A single, clear sentence explaining what we are trying to achieve.

## 📊 Visual logic (Flowchart)
Include a Mermaid flowchart that shows the logical sequence of the experiment.
Example:
```mermaid
graph TD
    A[Start] --> B[Input Data]
    B --> C{Condition?}
    C -- Yes --> D[Result A]
    C -- No --> E[Result B]
```

## 📚 Theory & Concept
### What is the core idea?
Explain the fundamental concept in a way that's easy to grasp. Use an analogy if helpful.

### Why does this matter?
Explain the real-world significance of this lab.

## 🔧 How It Works
### Key Components
Describe the "moving parts" of the experiment.

### Process Flow
Step-by-step logic of how the experiment proceeds.

## 🏁 Expected Outcomes
What will we see at the end? Describe the final results.

Keep the tone encouraging and academic yet accessible. Focus on "human-style" teaching. Use clear headings and bullet points. DO NOT include raw code (that comes in the next step).
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

# ---------- INTERNAL HELPERS ----------

def _explain(context, experiment):
    return generate_answer(
        context=context,
        question=f"{LAB_EXPLANATION_PROMPT}\n\nExperiment: {experiment}"
    )

def _pseudocode(context, experiment):
    return generate_answer(
        context=context,
        question=f"{PSEUDOCODE_PROMPT}\n\nExperiment: {experiment}"
    )

def _viva(context, experiment):
    return generate_answer(
        context=context,
        question=f"{VIVA_PROMPT}\n\nExperiment: {experiment}"
    )

def _summary(context, experiment):
    return generate_answer(
        context=context,
        question=f"{SUMMARY_PROMPT}\n\nExperiment: {experiment}"
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
