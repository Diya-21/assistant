"""
Student Performance Analyzer
Uses ML-inspired analysis to predict student strengths, weaknesses, and focus areas.
"""

import json
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
from pathlib import Path

# Progress data file
PROGRESS_FILE = "./data/user_progress.json"


def load_user_data(user_id: str) -> Dict:
    """Load user progress data"""
    try:
        if Path(PROGRESS_FILE).exists():
            with open(PROGRESS_FILE, 'r') as f:
                data = json.load(f)
                return data.get(user_id, {})
    except:
        pass
    return {}


def calculate_topic_score(topic_data: Dict) -> float:
    """
    Calculate a weighted score for a topic based on multiple factors.
    This is a simple ML-like scoring algorithm.
    """
    score = 0.0
    weights = {
        'explained': 15,
        'deep_explained': 25,
        'references_viewed': 10,
        'quiz_performance': 40,
        'recency': 10
    }
    
    # Basic activities
    if topic_data.get('explained', False):
        score += weights['explained']
    
    if topic_data.get('deep_explained', False):
        score += weights['deep_explained']
    
    if topic_data.get('references_viewed', False):
        score += weights['references_viewed']
    
    # Quiz performance (most important)
    quizzes = topic_data.get('quizzes', [])
    if quizzes:
        # Weighted average: recent quizzes matter more
        total_weight = 0
        weighted_sum = 0
        for i, quiz in enumerate(quizzes):
            weight = i + 1  # Later quizzes have more weight
            weighted_sum += quiz.get('percentage', 0) * weight
            total_weight += weight
        
        avg_quiz_score = weighted_sum / total_weight if total_weight > 0 else 0
        score += (avg_quiz_score / 100) * weights['quiz_performance']
    
    # Recency bonus (studied recently = better retention)
    last_studied = topic_data.get('last_studied')
    if last_studied:
        try:
            last_date = datetime.fromisoformat(last_studied)
            days_ago = (datetime.now() - last_date).days
            if days_ago <= 1:
                score += weights['recency']
            elif days_ago <= 7:
                score += weights['recency'] * 0.5
        except:
            pass
    
    return min(score, 100)  # Cap at 100


def categorize_strength(score: float) -> str:
    """Categorize topic strength level"""
    if score >= 80:
        return "strong"
    elif score >= 50:
        return "moderate"
    elif score >= 25:
        return "weak"
    else:
        return "not_started"


def analyze_learning_patterns(topics: Dict) -> Dict:
    """
    Analyze learning patterns to identify trends.
    """
    patterns = {
        'prefers_deep_dive': 0,
        'quiz_taker': 0,
        'surface_learner': 0,
        'consistent_learner': 0,
        'total_topics': len(topics)
    }
    
    for topic_data in topics.values():
        if topic_data.get('deep_explained'):
            patterns['prefers_deep_dive'] += 1
        
        if len(topic_data.get('quizzes', [])) > 0:
            patterns['quiz_taker'] += 1
        
        if topic_data.get('explained') and not topic_data.get('deep_explained'):
            if len(topic_data.get('quizzes', [])) == 0:
                patterns['surface_learner'] += 1
    
    return patterns


def predict_performance(user_id: str) -> Dict:
    """
    Main ML-like performance prediction function.
    Analyzes user data and predicts strengths, weaknesses, and recommendations.
    """
    user_data = load_user_data(user_id)
    
    if not user_data or not user_data.get('topics'):
        return {
            "status": "insufficient_data",
            "message": "Not enough data to analyze. Study more topics to get predictions!",
            "strong_topics": [],
            "weak_topics": [],
            "focus_areas": [],
            "predictions": {}
        }
    
    topics = user_data.get('topics', {})
    
    # Calculate scores for each topic
    topic_scores = {}
    for topic_name, topic_data in topics.items():
        score = calculate_topic_score(topic_data)
        category = categorize_strength(score)
        
        topic_scores[topic_name] = {
            "score": round(score, 1),
            "category": category,
            "quizzes_taken": len(topic_data.get('quizzes', [])),
            "avg_quiz_score": round(
                sum(q.get('percentage', 0) for q in topic_data.get('quizzes', [])) / 
                len(topic_data.get('quizzes', [])), 1
            ) if topic_data.get('quizzes') else 0,
            "mastery_level": topic_data.get('mastery_level', 0),
            "needs_review": topic_data.get('mastery_level', 0) < 50
        }
    
    # Sort topics by score
    sorted_topics = sorted(topic_scores.items(), key=lambda x: x[1]['score'], reverse=True)
    
    # Identify strong and weak topics
    strong_topics = [
        {"name": name, **data} 
        for name, data in sorted_topics 
        if data['category'] == 'strong'
    ]
    
    weak_topics = [
        {"name": name, **data} 
        for name, data in sorted_topics 
        if data['category'] in ['weak', 'not_started']
    ]
    
    moderate_topics = [
        {"name": name, **data} 
        for name, data in sorted_topics 
        if data['category'] == 'moderate'
    ]
    
    # Generate focus areas (prioritized weak topics)
    focus_areas = []
    for topic in weak_topics[:3]:  # Top 3 weak topics
        focus_areas.append({
            "topic": topic['name'],
            "reason": _get_focus_reason(topic),
            "suggested_action": _get_suggested_action(topic),
            "priority": "high"
        })
    
    for topic in moderate_topics[:2]:  # Top 2 moderate topics
        focus_areas.append({
            "topic": topic['name'],
            "reason": "Can be improved with more practice",
            "suggested_action": "Take a quiz to test understanding",
            "priority": "medium"
        })
    
    # Learning patterns analysis
    patterns = analyze_learning_patterns(topics)
    
    # Overall predictions
    overall_score = sum(t['score'] for t in topic_scores.values()) / len(topic_scores) if topic_scores else 0
    
    predictions = {
        "overall_readiness": round(overall_score, 1),
        "readiness_level": _get_readiness_level(overall_score),
        "exam_prediction": _predict_exam_performance(overall_score, topic_scores),
        "improvement_potential": _calculate_improvement_potential(topic_scores),
        "learning_style": _identify_learning_style(patterns),
        "consistency_score": _calculate_consistency(user_data)
    }
    
    # Personalized recommendations
    recommendations = _generate_recommendations(
        strong_topics, 
        weak_topics, 
        moderate_topics, 
        patterns,
        predictions
    )
    
    return {
        "status": "success",
        "analysis_date": datetime.now().isoformat(),
        "total_topics_analyzed": len(topics),
        "strong_topics": strong_topics,
        "weak_topics": weak_topics,
        "moderate_topics": moderate_topics,
        "focus_areas": focus_areas,
        "predictions": predictions,
        "recommendations": recommendations,
        "topic_details": topic_scores
    }


def _get_focus_reason(topic: Dict) -> str:
    """Generate reason why topic needs focus"""
    if topic['quizzes_taken'] == 0:
        return "Never tested - understanding not verified"
    elif topic['avg_quiz_score'] < 50:
        return f"Low quiz performance ({topic['avg_quiz_score']}%)"
    elif topic['score'] < 25:
        return "Minimal study activity"
    else:
        return "Needs more practice"


def _get_suggested_action(topic: Dict) -> str:
    """Generate suggested action for topic"""
    if topic['quizzes_taken'] == 0:
        return "📝 Take a quiz to test your knowledge"
    elif topic['avg_quiz_score'] < 50:
        return "📚 Review the topic and retake the quiz"
    elif topic['mastery_level'] < 50:
        return "🔍 Get a deep explanation of this topic"
    else:
        return "🔄 Practice more to reinforce learning"


def _get_readiness_level(score: float) -> str:
    """Determine overall readiness level"""
    if score >= 80:
        return "Excellent - Ready for exams! 🌟"
    elif score >= 60:
        return "Good - Minor revision needed 📚"
    elif score >= 40:
        return "Fair - More practice required ⚡"
    elif score >= 20:
        return "Needs Work - Focus on weak areas 📖"
    else:
        return "Getting Started - Keep learning! 🚀"


def _predict_exam_performance(overall_score: float, topic_scores: Dict) -> Dict:
    """Predict exam performance based on current progress"""
    # Simple prediction model
    predicted_score = overall_score * 0.8 + 10  # Conservative prediction
    
    # Adjust based on quiz performance
    quiz_scores = []
    for data in topic_scores.values():
        if data['avg_quiz_score'] > 0:
            quiz_scores.append(data['avg_quiz_score'])
    
    if quiz_scores:
        avg_quiz = sum(quiz_scores) / len(quiz_scores)
        predicted_score = (predicted_score + avg_quiz) / 2
    
    return {
        "predicted_percentage": round(min(predicted_score, 95), 1),
        "confidence": "Medium" if len(topic_scores) >= 5 else "Low",
        "grade_prediction": _score_to_grade(predicted_score)
    }


def _score_to_grade(score: float) -> str:
    """Convert score to grade"""
    if score >= 90:
        return "A+ (Outstanding)"
    elif score >= 80:
        return "A (Excellent)"
    elif score >= 70:
        return "B (Good)"
    elif score >= 60:
        return "C (Average)"
    elif score >= 50:
        return "D (Below Average)"
    else:
        return "Needs Improvement"


def _calculate_improvement_potential(topic_scores: Dict) -> Dict:
    """Calculate how much the student can improve"""
    current_avg = sum(t['score'] for t in topic_scores.values()) / len(topic_scores) if topic_scores else 0
    max_possible = 100
    
    weak_count = sum(1 for t in topic_scores.values() if t['category'] in ['weak', 'not_started'])
    
    return {
        "current_average": round(current_avg, 1),
        "potential_average": round(min(current_avg + (weak_count * 10), 95), 1),
        "improvement_points": round(100 - current_avg, 1),
        "quick_wins": weak_count  # Topics that can be improved quickly
    }


def _identify_learning_style(patterns: Dict) -> str:
    """Identify learning style based on patterns"""
    if patterns['total_topics'] == 0:
        return "Not enough data"
    
    deep_ratio = patterns['prefers_deep_dive'] / patterns['total_topics']
    quiz_ratio = patterns['quiz_taker'] / patterns['total_topics']
    
    if deep_ratio > 0.7:
        return "Deep Learner - You prefer thorough understanding 🔬"
    elif quiz_ratio > 0.7:
        return "Active Learner - You learn by testing 📝"
    elif patterns['surface_learner'] / patterns['total_topics'] > 0.5:
        return "Quick Learner - Try going deeper for better retention 📖"
    else:
        return "Balanced Learner - Good mix of reading and practice ⚖️"


def _calculate_consistency(user_data: Dict) -> Dict:
    """Calculate learning consistency"""
    total_activities = user_data.get('total_activities', 0)
    
    # Simple consistency calculation
    if total_activities >= 20:
        level = "High"
        emoji = "🔥"
    elif total_activities >= 10:
        level = "Medium"
        emoji = "⚡"
    elif total_activities >= 5:
        level = "Low"
        emoji = "📈"
    else:
        level = "Just Started"
        emoji = "🌱"
    
    return {
        "level": level,
        "emoji": emoji,
        "total_activities": total_activities,
        "message": f"Keep up the momentum!" if total_activities >= 10 else "Study regularly for best results!"
    }


def _generate_recommendations(
    strong: List, 
    weak: List, 
    moderate: List, 
    patterns: Dict,
    predictions: Dict
) -> List[str]:
    """Generate personalized recommendations"""
    recommendations = []
    
    # Based on weak topics
    if len(weak) > 0:
        recommendations.append(
            f"🎯 Focus on '{weak[0]['name']}' - it needs the most attention"
        )
    
    if len(weak) > 2:
        recommendations.append(
            f"📚 You have {len(weak)} weak topics. Dedicate 30 mins daily to each"
        )
    
    # Based on quiz patterns
    no_quiz_topics = [t for t in moderate + weak if t.get('quizzes_taken', 0) == 0]
    if no_quiz_topics:
        recommendations.append(
            f"📝 Take quizzes for: {', '.join(t['name'] for t in no_quiz_topics[:3])}"
        )
    
    # Based on strong topics
    if len(strong) > 0:
        recommendations.append(
            f"✅ Great job on '{strong[0]['name']}'! Use this confidence to tackle weak areas"
        )
    
    # Based on learning style
    if patterns.get('surface_learner', 0) > patterns.get('prefers_deep_dive', 0):
        recommendations.append(
            "🔬 Try 'Deep Dive' explanations for better understanding"
        )
    
    # Based on predictions
    if predictions.get('improvement_potential', {}).get('quick_wins', 0) > 3:
        recommendations.append(
            "💡 Quick wins available! Even 10 mins on weak topics will boost your score"
        )
    
    return recommendations[:5]  # Max 5 recommendations


# Convenience function for API
def get_performance_analysis(user_id: str) -> Dict:
    """
    Get complete performance analysis for a user.
    This is the main function to call from the API.
    """
    return predict_performance(user_id)
