import json
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path

# File-based storage (you can switch to database later)
PROGRESS_FILE = "./data/user_progress.json"

def init_progress_file():
    """Initialize progress file if it doesn't exist"""
    Path("./data").mkdir(exist_ok=True)
    if not Path(PROGRESS_FILE).exists():
        with open(PROGRESS_FILE, 'w') as f:
            json.dump({}, f)

def load_progress() -> Dict:
    """Load all progress data"""
    init_progress_file()
    try:
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    except:
        return {}

def save_progress(data: Dict):
    """Save progress data"""
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def track_activity(
    user_id: str,
    topic: str,
    activity_type: str,  # "explain", "quiz", "lab", "question"
    score: Optional[int] = None,
    total: Optional[int] = None
):
    """
    Track user learning activity
    
    Args:
        user_id: Unique identifier for user (can be session ID)
        topic: Topic being studied
        activity_type: Type of activity
        score: Score achieved (for quizzes)
        total: Total possible score
    """
    progress = load_progress()
    
    if user_id not in progress:
        progress[user_id] = {
            "topics": {},
            "total_activities": 0,
            "quizzes_taken": 0,
            "average_score": 0,
            "streak_days": 0,
            "last_activity": None,
            "achievements": []
        }
    
    user = progress[user_id]
    
    # Initialize topic if new
    if topic not in user["topics"]:
        user["topics"][topic] = {
            "explained": False,
            "deep_explained": False,
            "references_viewed": False,
            "quizzes": [],
            "labs_completed": [],
            "questions_asked": 0,
            "first_studied": datetime.now().isoformat(),
            "last_studied": None,
            "mastery_level": 0  # 0-100
        }
    
    topic_data = user["topics"][topic]
    
    # Update based on activity type
    if activity_type == "explain":
        topic_data["explained"] = True
        topic_data["mastery_level"] = max(topic_data["mastery_level"], 25)
    
    elif activity_type == "deep":
        topic_data["deep_explained"] = True
        topic_data["mastery_level"] = max(topic_data["mastery_level"], 50)
    
    elif activity_type == "references":
        topic_data["references_viewed"] = True
    
    elif activity_type == "quiz":
        quiz_result = {
            "date": datetime.now().isoformat(),
            "score": score,
            "total": total,
            "percentage": round((score / total * 100) if total else 0, 2)
        }
        topic_data["quizzes"].append(quiz_result)
        user["quizzes_taken"] += 1
        
        # Update mastery based on quiz performance
        if quiz_result["percentage"] >= 90:
            topic_data["mastery_level"] = 100
        elif quiz_result["percentage"] >= 70:
            topic_data["mastery_level"] = max(topic_data["mastery_level"], 75)
    
    elif activity_type == "lab":
        topic_data["labs_completed"].append({
            "date": datetime.now().isoformat(),
            "experiment": topic
        })
        topic_data["mastery_level"] = max(topic_data["mastery_level"], 80)
    
    elif activity_type == "question":
        topic_data["questions_asked"] += 1
    
    # Update timestamps
    topic_data["last_studied"] = datetime.now().isoformat()
    user["last_activity"] = datetime.now().isoformat()
    user["total_activities"] += 1
    
    # Calculate average score
    all_quizzes = []
    for t in user["topics"].values():
        all_quizzes.extend(t.get("quizzes", []))
    
    if all_quizzes:
        user["average_score"] = round(
            sum(q["percentage"] for q in all_quizzes) / len(all_quizzes),
            2
        )
    
    # Check for achievements
    check_achievements(user)
    
    save_progress(progress)
    
    return {"status": "success", "message": "Progress tracked"}

def check_achievements(user: Dict):
    """Check and award achievements"""
    achievements = user.get("achievements", [])
    
    # Achievement: First Steps
    if user["total_activities"] >= 1 and "first_steps" not in achievements:
        achievements.append("first_steps")
    
    # Achievement: Quiz Master (5 quizzes with >80%)
    high_score_quizzes = 0
    for topic in user["topics"].values():
        high_score_quizzes += sum(1 for q in topic.get("quizzes", []) if q["percentage"] >= 80)
    
    if high_score_quizzes >= 5 and "quiz_master" not in achievements:
        achievements.append("quiz_master")
    
    # Achievement: Explorer (studied 5 different topics)
    if len(user["topics"]) >= 5 and "explorer" not in achievements:
        achievements.append("explorer")
    
    # Achievement: Perfectionist (100% on any quiz)
    for topic in user["topics"].values():
        if any(q["percentage"] == 100 for q in topic.get("quizzes", [])):
            if "perfectionist" not in achievements:
                achievements.append("perfectionist")
            break
    
    user["achievements"] = achievements

def get_user_progress(user_id: str) -> Dict:
    """Get complete progress for a user"""
    progress = load_progress()
    
    if user_id not in progress:
        return {
            "topics": {},
            "total_activities": 0,
            "quizzes_taken": 0,
            "average_score": 0,
            "achievements": [],
            "summary": {
                "total_topics": 0,
                "mastered_topics": 0,
                "in_progress_topics": 0,
                "weak_topics": []
            }
        }
    
    user = progress[user_id]
    
    # Calculate summary
    total_topics = len(user["topics"])
    mastered = sum(1 for t in user["topics"].values() if t["mastery_level"] >= 80)
    in_progress = sum(1 for t in user["topics"].values() if 0 < t["mastery_level"] < 80)
    
    # Identify weak topics (low quiz scores)
    weak_topics = []
    for topic_name, topic_data in user["topics"].items():
        quizzes = topic_data.get("quizzes", [])
        if quizzes:
            avg_score = sum(q["percentage"] for q in quizzes) / len(quizzes)
            if avg_score < 60:
                weak_topics.append({
                    "topic": topic_name,
                    "average_score": round(avg_score, 2),
                    "attempts": len(quizzes)
                })
    
    user["summary"] = {
        "total_topics": total_topics,
        "mastered_topics": mastered,
        "in_progress_topics": in_progress,
        "weak_topics": weak_topics
    }
    
    return user

def get_recommendations(user_id: str) -> List[str]:
    """Generate personalized study recommendations"""
    progress = get_user_progress(user_id)
    recommendations = []
    
    if progress["total_activities"] == 0:
        return ["Start by uploading your syllabus and exploring a topic!"]
    
    # Recommendation: Weak topics
    weak_topics = progress["summary"]["weak_topics"]
    if weak_topics:
        topic = weak_topics[0]["topic"]
        recommendations.append(f"📚 Review '{topic}' - your quiz scores are below 60%")
    
    # Recommendation: Incomplete topics
    for topic_name, topic_data in progress["topics"].items():
        if topic_data["explained"] and not topic_data.get("quizzes"):
            recommendations.append(f"🧠 Take a quiz on '{topic_name}' to test your understanding")
            break
    
    # Recommendation: No deep explanations
    for topic_name, topic_data in progress["topics"].items():
        if topic_data["explained"] and not topic_data["deep_explained"]:
            recommendations.append(f"🔍 Get a deeper explanation of '{topic_name}'")
            break
    
    # Recommendation: Consistency
    if progress["total_activities"] < 10:
        recommendations.append("⭐ Keep it up! Try to study a little bit each day")
    
    # Recommendation: New topics
    if len(progress["topics"]) < 3:
        recommendations.append("🌟 Explore more topics from your syllabus")
    
    return recommendations[:3]  # Return top 3 recommendations

def get_analytics(user_id: str) -> Dict:
    """Get detailed analytics for visualization"""
    progress = get_user_progress(user_id)
    
    # Topic mastery distribution
    mastery_levels = {
        "beginner": 0,      # 0-25%
        "learning": 0,      # 26-50%
        "practicing": 0,    # 51-75%
        "mastered": 0       # 76-100%
    }
    
    for topic_data in progress["topics"].values():
        level = topic_data["mastery_level"]
        if level <= 25:
            mastery_levels["beginner"] += 1
        elif level <= 50:
            mastery_levels["learning"] += 1
        elif level <= 75:
            mastery_levels["practicing"] += 1
        else:
            mastery_levels["mastered"] += 1
    
    # Quiz performance over time
    all_quizzes = []
    for topic_name, topic_data in progress["topics"].items():
        for quiz in topic_data.get("quizzes", []):
            all_quizzes.append({
                "topic": topic_name,
                "date": quiz["date"],
                "percentage": quiz["percentage"]
            })
    
    all_quizzes.sort(key=lambda x: x["date"])
    
    # Activity timeline (last 7 days)
    activity_timeline = []
    # This would need proper date grouping - simplified for now
    
    return {
        "mastery_distribution": mastery_levels,
        "quiz_history": all_quizzes[-10:],  # Last 10 quizzes
        "total_study_time_minutes": progress["total_activities"] * 5,  # Rough estimate
        "achievement_count": len(progress["achievements"])
    }