"""
Bloom's Taxonomy Classifier
----------------------------
THIS is what makes this project unique. No AI chatbot tells a student
WHAT LEVEL of thinking they are engaging in.

Bloom's Taxonomy Levels:
  1. Remember   - Recall facts (define, list, name)
  2. Understand - Explain ideas (describe, summarize, explain)
  3. Apply      - Use in new situations (implement, solve, demonstrate)
  4. Analyze    - Break into parts (compare, contrast, differentiate)
  5. Evaluate   - Justify decisions (assess, argue, defend)
  6. Create     - Produce new work (design, construct, develop)

ChatGPT/Gemini do NOT classify questions this way.
This module does — for every single interaction.
"""

import re
from typing import Dict

# Keywords mapped to each Bloom's level
BLOOMS_KEYWORDS = {
    "Remember": [
        "define", "list", "name", "identify", "recall", "state",
        "what is", "who is", "when did", "where is", "which",
        "label", "match", "memorize", "recite", "select"
    ],
    "Understand": [
        "explain", "describe", "summarize", "paraphrase", "interpret",
        "classify", "discuss", "illustrate", "report", "translate",
        "how does", "why does", "what does", "meaning of"
    ],
    "Apply": [
        "implement", "solve", "use", "demonstrate", "calculate",
        "apply", "execute", "show", "complete", "compute",
        "write code", "write a program", "build", "run", "perform"
    ],
    "Analyze": [
        "compare", "contrast", "differentiate", "distinguish",
        "analyze", "examine", "break down", "categorize",
        "difference between", "relate", "organize", "deconstruct",
        "pros and cons", "advantages and disadvantages"
    ],
    "Evaluate": [
        "evaluate", "assess", "justify", "argue", "defend",
        "judge", "critique", "recommend", "prioritize", "rate",
        "which is better", "should i", "is it worth", "best approach"
    ],
    "Create": [
        "design", "construct", "develop", "formulate", "propose",
        "create", "invent", "plan", "compose", "generate",
        "build a project", "make a system", "architect"
    ]
}

BLOOMS_COLORS = {
    "Remember":    {"color": "#6366f1", "emoji": "📝", "level": 1},
    "Understand":  {"color": "#8b5cf6", "emoji": "💡", "level": 2},
    "Apply":       {"color": "#3b82f6", "emoji": "🔧", "level": 3},
    "Analyze":     {"color": "#f59e0b", "emoji": "🔬", "level": 4},
    "Evaluate":    {"color": "#ef4444", "emoji": "⚖️", "level": 5},
    "Create":      {"color": "#10b981", "emoji": "🚀", "level": 6},
}

def classify_blooms_level(question: str) -> Dict:
    """
    Classify a student's question into Bloom's Taxonomy level.
    
    Returns:
        {
            "level": "Analyze",
            "level_number": 4,
            "emoji": "🔬",
            "color": "#f59e0b",
            "description": "Breaking concepts into parts to understand structure",
            "matched_keywords": ["compare", "difference"],
            "study_tip": "Try to identify relationships between components"
        }
    """
    question_lower = question.lower().strip()
    
    scores = {}
    matched = {}
    
    for level, keywords in BLOOMS_KEYWORDS.items():
        score = 0
        matches = []
        for kw in keywords:
            if kw in question_lower:
                score += 1
                matches.append(kw)
        scores[level] = score
        matched[level] = matches
    
    # Find the highest scoring level
    best_level = max(scores, key=scores.get)
    
    # If no keywords matched at all, default to "Understand"
    if scores[best_level] == 0:
        best_level = "Understand"
    
    descriptions = {
        "Remember":    "Recalling facts and basic concepts from the syllabus",
        "Understand":  "Explaining ideas and concepts in your own words",
        "Apply":       "Using knowledge in new situations and problem-solving",
        "Analyze":     "Breaking concepts into parts to understand structure and relationships",
        "Evaluate":    "Making judgments and justifying decisions based on criteria",
        "Create":      "Producing new or original work by combining learned concepts"
    }
    
    tips = {
        "Remember":    "💡 Tip: Try to move beyond memorization — ask 'why' and 'how' to deepen understanding.",
        "Understand":  "💡 Tip: Good! Try applying this concept to a real-world problem next.",
        "Apply":       "💡 Tip: Great level! Now try analyzing WHY this solution works.",
        "Analyze":     "💡 Tip: Excellent critical thinking! Can you evaluate which approach is best?",
        "Evaluate":    "💡 Tip: Outstanding! You're thinking like a professional. Try creating something new!",
        "Create":      "💡 Tip: Highest level of thinking! You're ready for innovation and research."
    }
    
    meta = BLOOMS_COLORS[best_level]
    
    return {
        "level": best_level,
        "level_number": meta["level"],
        "emoji": meta["emoji"],
        "color": meta["color"],
        "description": descriptions[best_level],
        "matched_keywords": matched.get(best_level, []),
        "study_tip": tips[best_level]
    }
