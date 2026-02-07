from backend.agents.qa_agent import generate_answer

# ---------- ENHANCED PROMPTS ----------

LAB_EXPLANATION_PROMPT = """
You are a university lab instructor explaining an experiment to a student.

Provide a structured explanation using this format:

## 🎯 Aim
State the objective of this experiment in one clear sentence.

## 📚 Theory & Background

### What is this about?
Explain the core concept behind this experiment in 2-3 paragraphs.

### Why is it important?
- Reason 1: Brief explanation
- Reason 2: Brief explanation
- Reason 3: Brief explanation

## 🔧 How It Works

### Overview
A high-level explanation of the approach/technique.

### Key Components
- **Component 1**: What it does
- **Component 2**: What it does
- **Component 3**: What it does

### Process Flow
1. Step 1 - What happens
2. Step 2 - What happens
3. Step 3 - What happens

## 📊 Expected Outcomes
What results should the student expect after completing this experiment?

## 🔗 Related Concepts
- Concept 1 - Brief connection
- Concept 2 - Brief connection

Keep the explanation clear, academic, and suitable for a lab record. DO NOT include any code.
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
            "next": "Ask doubts or visit Theory page for more"
        }

    return {
        "stage": "ERROR",
        "content": "Invalid step requested"
    }
