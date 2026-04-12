"""
Syllabus Coverage Tracker
--------------------------
Tracks which parts of the syllabus a student has actually studied.
ChatGPT has ZERO awareness of what you've covered.
This module gives the student a live "completion percentage".

It works by:
1. Extracting key topics from the uploaded syllabus
2. Matching student queries against those topics
3. Maintaining a per-user coverage map
"""

import re
import json
import os
from typing import Dict, List, Optional

COVERAGE_DIR = "./data/coverage"

def _ensure_dir():
    os.makedirs(COVERAGE_DIR, exist_ok=True)

def _get_coverage_path(user_id: str) -> str:
    _ensure_dir()
    return os.path.join(COVERAGE_DIR, f"{user_id}_coverage.json")

def _load_coverage(user_id: str) -> Dict:
    path = _get_coverage_path(user_id)
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return {"topics": {}, "total_interactions": 0, "units_studied": {}}

def _save_coverage(user_id: str, data: Dict):
    path = _get_coverage_path(user_id)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def extract_syllabus_topics(chunks: List[Dict]) -> List[str]:
    """
    Extract key topics/terms from syllabus chunks.
    This creates the 'knowledge map' of the syllabus.
    """
    all_text = " ".join(c.get("page_content", "") for c in chunks)
    
    # Extract capitalized phrases (likely topic headers)
    # Patterns: "Machine Learning", "Big Data Analytics", "Neural Networks"
    topics = set()
    
    # Multi-word capitalized phrases
    for match in re.finditer(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b', all_text):
        topic = match.group(1).strip()
        if len(topic) > 5 and len(topic.split()) <= 5:
            topics.add(topic)
    
    # Words after "Unit/Module/Chapter" headers
    for match in re.finditer(r'(?:Unit|Module|Chapter)\s*[\dIVX]+[:\s-]+(.+?)(?:\n|$)', all_text, re.IGNORECASE):
        topic = match.group(1).strip()
        if topic:
            topics.add(topic)
    
    # Common CS/academic terms (if detected in text)
    academic_terms = [
        "MapReduce", "Hadoop", "HDFS", "Spark", "Machine Learning",
        "Neural Network", "Deep Learning", "Classification", "Clustering",
        "Regression", "Decision Tree", "Random Forest", "SVM",
        "Natural Language Processing", "Computer Vision", "CNN", "RNN",
        "LSTM", "Transformer", "Big Data", "Data Mining", "NoSQL",
        "Cloud Computing", "IoT", "Blockchain", "Cybersecurity"
    ]
    for term in academic_terms:
        if term.lower() in all_text.lower():
            topics.add(term)
    
    return list(topics)


def record_topic_interaction(user_id: str, query: str, unit: str = None):
    """
    Record that a student asked about a topic.
    This builds their personal coverage map.
    """
    coverage = _load_coverage(user_id)
    
    # Normalize the query into a topic key
    query_clean = re.sub(r'[^\w\s]', '', query.lower()).strip()
    words = query_clean.split()
    
    # Use 2-3 word combinations as topic keys
    topic_keys = []
    if len(words) >= 2:
        topic_keys.append(" ".join(words[:3]))
    topic_keys.append(query_clean[:50])
    
    for key in topic_keys:
        if key not in coverage["topics"]:
            coverage["topics"][key] = {"count": 0, "unit": unit}
        coverage["topics"][key]["count"] += 1
    
    if unit:
        if unit not in coverage["units_studied"]:
            coverage["units_studied"][unit] = 0
        coverage["units_studied"][unit] += 1
    
    coverage["total_interactions"] += 1
    _save_coverage(user_id, coverage)


def get_coverage_stats(user_id: str, syllabus_topics: List[str] = None) -> Dict:
    """
    Get a student's syllabus coverage statistics.
    
    Returns:
        {
            "total_topics_studied": 12,
            "total_interactions": 45,
            "units_studied": {"Unit I": 15, "Unit II": 8},
            "coverage_percentage": 65.0,
            "unstudied_topics": ["CNN", "Blockchain"],
            "most_studied": ["MapReduce", "Hadoop"],
            "recommendation": "Focus on Unit III - you haven't studied it yet"
        }
    """
    coverage = _load_coverage(user_id)
    
    studied_topics = list(coverage["topics"].keys())
    total_studied = len(studied_topics)
    
    # Calculate coverage against syllabus topics if available
    coverage_pct = 0
    unstudied = []
    if syllabus_topics:
        matched = 0
        for st in syllabus_topics:
            st_lower = st.lower()
            if any(st_lower in studied for studied in studied_topics):
                matched += 1
            else:
                unstudied.append(st)
        coverage_pct = round((matched / len(syllabus_topics)) * 100, 1) if syllabus_topics else 0
    
    # Find most studied topics
    sorted_topics = sorted(coverage["topics"].items(), key=lambda x: x[1]["count"], reverse=True)
    most_studied = [t[0] for t in sorted_topics[:5]]
    
    # Generate recommendation
    units = coverage.get("units_studied", {})
    recommendation = ""
    if unstudied:
        recommendation = f"📌 Focus on: {', '.join(unstudied[:3])} — these syllabus topics haven't been studied yet."
    elif total_studied > 0:
        recommendation = "✅ Great progress! Consider taking quizzes to test your understanding."
    
    return {
        "total_topics_studied": total_studied,
        "total_interactions": coverage["total_interactions"],
        "units_studied": units,
        "coverage_percentage": coverage_pct,
        "unstudied_topics": unstudied[:10],
        "most_studied": most_studied,
        "recommendation": recommendation
    }
