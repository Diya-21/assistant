"""
Weakness Analyzer & Adaptive Recommender
------------------------------------------
After quizzes, this module analyzes WHICH topics the student got wrong,
and suggests targeted revision.

ChatGPT/Gemini treat every user identically.
This module creates a PERSONALIZED learning path based on YOUR weaknesses.
"""

import json
import os
from typing import Dict, List
from collections import defaultdict

WEAKNESS_DIR = "./data/weakness"

def _ensure_dir():
    os.makedirs(WEAKNESS_DIR, exist_ok=True)

def _get_path(user_id: str) -> str:
    _ensure_dir()
    return os.path.join(WEAKNESS_DIR, f"{user_id}_weakness.json")

def _load(user_id: str) -> Dict:
    path = _get_path(user_id)
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return {"quiz_history": [], "topic_scores": {}, "weak_topics": []}

def _save(user_id: str, data: Dict):
    path = _get_path(user_id)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def record_quiz_result(user_id: str, topic: str, score: int, total: int, 
                       questions: List[Dict] = None, answers: Dict = None):
    """
    Record a quiz result and analyze weaknesses.
    
    Args:
        user_id: Student identifier
        topic: The topic being tested
        score: Number of correct answers
        total: Total number of questions
        questions: List of question objects (with 'question' and 'answer' keys)
        answers: Dict of {question_id: selected_option_index}
    """
    data = _load(user_id)
    
    percentage = round((score / total) * 100, 1) if total > 0 else 0
    
    # Record the quiz attempt
    data["quiz_history"].append({
        "topic": topic,
        "score": score,
        "total": total,
        "percentage": percentage,
        "timestamp": __import__("datetime").datetime.now().isoformat()
    })
    
    # Update topic-level scores
    if topic not in data["topic_scores"]:
        data["topic_scores"][topic] = {"attempts": 0, "total_score": 0, "total_possible": 0}
    
    data["topic_scores"][topic]["attempts"] += 1
    data["topic_scores"][topic]["total_score"] += score
    data["topic_scores"][topic]["total_possible"] += total
    
    # Recalculate weak topics
    weak = []
    for t, stats in data["topic_scores"].items():
        avg = (stats["total_score"] / stats["total_possible"] * 100) if stats["total_possible"] > 0 else 0
        if avg < 60:
            weak.append({"topic": t, "average_score": round(avg, 1), "attempts": stats["attempts"]})
    
    data["weak_topics"] = sorted(weak, key=lambda x: x["average_score"])
    
    _save(user_id, data)
    return get_adaptive_recommendations(user_id)


def get_adaptive_recommendations(user_id: str) -> Dict:
    """
    Generate personalized study recommendations based on weakness analysis.
    
    Returns:
        {
            "weak_topics": [...],
            "strong_topics": [...],
            "recommendations": ["Revise MapReduce - you scored 40%", ...],
            "overall_readiness": 72.5,
            "next_action": "Take a quiz on Unit II topics"
        }
    """
    data = _load(user_id)
    
    if not data["topic_scores"]:
        return {
            "weak_topics": [],
            "strong_topics": [],
            "recommendations": ["Take your first quiz to get personalized recommendations!"],
            "overall_readiness": 0,
            "next_action": "Start learning a topic, then take a quiz"
        }
    
    weak_topics = []
    strong_topics = []
    all_scores = []
    
    for topic, stats in data["topic_scores"].items():
        avg = (stats["total_score"] / stats["total_possible"] * 100) if stats["total_possible"] > 0 else 0
        all_scores.append(avg)
        
        entry = {"topic": topic, "average": round(avg, 1), "attempts": stats["attempts"]}
        
        if avg < 60:
            weak_topics.append(entry)
        else:
            strong_topics.append(entry)
    
    # Sort: weakest first
    weak_topics.sort(key=lambda x: x["average"])
    strong_topics.sort(key=lambda x: x["average"], reverse=True)
    
    # Generate specific recommendations
    recommendations = []
    for w in weak_topics[:3]:
        if w["average"] < 30:
            recommendations.append(f"🔴 CRITICAL: Revise **{w['topic']}** thoroughly — you scored {w['average']}%")
        elif w["average"] < 60:
            recommendations.append(f"🟡 REVIEW: Practice **{w['topic']}** again — current score: {w['average']}%")
    
    if not weak_topics and strong_topics:
        recommendations.append("🟢 All topics looking strong! Try deeper analysis or project work.")
    
    # Overall readiness
    overall = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0
    
    # Next action
    if weak_topics:
        next_action = f"Revise '{weak_topics[0]['topic']}' and retake the quiz"
    elif len(data["topic_scores"]) < 3:
        next_action = "Study more topics to build comprehensive coverage"
    else:
        next_action = "You're well-prepared! Try creating a project to cement your knowledge"
    
    return {
        "weak_topics": weak_topics,
        "strong_topics": strong_topics,
        "recommendations": recommendations,
        "overall_readiness": overall,
        "next_action": next_action
    }
