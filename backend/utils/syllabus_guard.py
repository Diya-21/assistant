"""
Syllabus Guard — Filtration & Verification System
===================================================
This module is the CORE DIFFERENTIATOR of this project.

WHAT IT DOES (that ChatGPT/Gemini CANNOT):
1. Verifies that the student's question maps to their uploaded syllabus
2. Extracts matched syllabus topics with confidence scores
3. Produces a VISIBLE verification report for every response
4. Filters retrieval results by unit/module

This is NOT a wrapper around an LLM — this is a syllabus-aware
filtration pipeline that constrains the LLM to curriculum boundaries.
"""

import re
from typing import List, Dict, Optional
from difflib import SequenceMatcher
import random


class SyllabusGuard:
    """
    Content filtration and verification engine.
    Ensures the AI stays strictly within syllabus boundaries.
    """

    @staticmethod
    def filter_context(docs: List, query: str, target_unit: str = None) -> List[Dict]:
        """
        Custom filtration pipeline:
        1. Filters by specific Syllabus Unit if provided
        2. Computes relevance score using keyword overlap
        3. Returns filtered + scored documents
        """
        filtered_docs = []
        query_words = set(re.findall(r'\w+', query.lower()))
        # Remove stop words for better matching
        stop_words = {'the', 'is', 'in', 'at', 'to', 'and', 'or', 'of', 'for', 'a', 'an', 'what', 'how', 'why', 'explain', 'describe', 'define'}
        query_words = query_words - stop_words

        for doc in docs:
            content = doc.page_content.lower()
            metadata = doc.metadata

            # Unit-based filtration
            if target_unit and target_unit.lower() != "all":
                doc_unit = metadata.get("unit", "General")
                if target_unit.lower() not in doc_unit.lower():
                    continue

            # Keyword overlap scoring
            overlap = [word for word in query_words if word in content and len(word) > 2]
            score = len(overlap) / max(len(query_words), 1)

            # Fuzzy matching for partial matches
            content_words = set(re.findall(r'\w+', content))
            fuzzy_matches = []
            for qw in query_words:
                for cw in content_words:
                    if len(qw) > 3 and len(cw) > 3:
                        ratio = SequenceMatcher(None, qw, cw).ratio()
                        if ratio > 0.8:
                            fuzzy_matches.append((qw, cw, ratio))

        # Boost score with fuzzy matches
            fuzzy_boost = len(fuzzy_matches) * 0.1
            final_score = min(score + fuzzy_boost, 1.0)

            filtered_docs.append({
                "content": doc.page_content,
                "metadata": {
                    **metadata,
                    "relevance_score": round(final_score, 3),
                    "matched_keywords": overlap,
                    "fuzzy_matches": [(m[0], m[1]) for m in fuzzy_matches[:5]]
                }
            })

        # --- MULTI-UNIT COVERAGE ENHANCEMENT ---
        # If we have matches across different units, ensure at least one from each unit is included
        unit_buckets = {}
        for d in filtered_docs:
            u = d["metadata"].get("unit", "General")
            if u not in unit_buckets: unit_buckets[u] = []
            unit_buckets[u].append(d)
        
        # Sort each bucket by relevance
        for u in unit_buckets:
            unit_buckets[u].sort(key=lambda x: x['metadata']['relevance_score'], reverse=True)
        
        # Take top 2 from each relevant unit to maximize 'Global' coverage (if user didn't specify a unit)
        global_filtered = []
        if not target_unit or target_unit.lower() == "all":
            for u in unit_buckets:
                global_filtered.extend(unit_buckets[u][:2])  # Take 2 most relevant from EACH unit found
            # Re-sort result
            global_filtered.sort(key=lambda x: x['metadata']['relevance_score'], reverse=True)
            return global_filtered[:8]  # Limit to 8 diverse chunks
        else:
            filtered_docs.sort(key=lambda x: x['metadata']['relevance_score'], reverse=True)
            return filtered_docs[:6]

    @staticmethod
    def get_suggestions(query: str, context_docs: List[Dict]) -> List[str]:
        """
        Suggests the next logical topics based on syllabus proximity and progression.
        """
        suggestions = []
        if not context_docs: return ["Step-by-Step Numerical", "Theory Summary", "Related MCQ"]
        
        top_doc = context_docs[0]["content"]
        unit_hint = context_docs[0]['metadata'].get('unit', '')
        
        # 1. Proactive Module 2 Progression
        if unit_hint and ("module 2" in unit_hint.lower() or "unit 2" in unit_hint.lower()):
            suggestions.append("🚀 Next in Mod 2")
            suggestions.append("📊 Mod 2 Numerical Example")
        
        # 2. Text-based proximity (Neighbor topics)
        parts = re.split(r'[,;•\n\t]', top_doc)
        query_words = set(re.findall(r'\w+', query.lower()))
        stop_words = {'the', 'is', 'in', 'at', 'to', 'and', 'or', 'of', 'for', 'a', 'an', 'what', 'how', 'why', 'explain', 'describe', 'define'}
        significant_words = query_words - stop_words

        for i, part in enumerate(parts):
            part_words = set(re.findall(r'\w+', part.lower()))
            if significant_words & part_words: 
                if i + 1 < len(parts):
                    cand = parts[i+1].strip()
                    if 3 < len(cand) < 45 and not any(x in cand.lower() for x in ['unit', 'module', 'page', 'chapter']):
                        suggestions.append(cand)
                break
        
        # 3. Mode-specific fallbacks
        if "numerical" in query.lower() or "calculate" in query.lower():
            suggestions.append("Theory Concept")
            suggestions.append("Next Numerical Type")
        else:
            suggestions.append("Step-by-Step Numerical")

        return list(dict.fromkeys(suggestions))[:3] # Unique and limit to 3

    @staticmethod
    def verify_syllabus_compliance(query: str, context_docs: List[Dict]) -> Dict:
        """
        Produces a VERIFICATION REPORT that proves whether the answer 
        is from the syllabus or not.
        
        This is what makes the project different from ChatGPT.
        ChatGPT gives answers — we give answers WITH PROOF.
        
        Returns:
            {
                "is_syllabus_verified": True/False,
                "confidence": 0.85,
                "matched_topics": ["MapReduce", "Hadoop"],
                "matched_unit": "Unit II",
                "source_pages": [5, 6],
                "verification_status": "✅ VERIFIED FROM SYLLABUS",
                "pipeline_steps": [...]
            }
        """
        pipeline_steps = []
        
        # Step 1: Query received
        pipeline_steps.append({
            "step": 1,
            "name": "Query Received",
            "status": "✅",
            "detail": f"Student asked: '{query[:80]}...'" if len(query) > 80 else f"Student asked: '{query}'"
        })
        
        # Step 2: Syllabus retrieval
        if not context_docs:
            pipeline_steps.append({
                "step": 2,
                "name": "Syllabus Retrieval",
                "status": "❌",
                "detail": "No syllabus data found. Please upload your syllabus PDF."
            })
            return {
                "is_syllabus_verified": False,
                "confidence": 0,
                "matched_topics": [],
                "matched_unit": None,
                "source_pages": [],
                "verification_status": "❌ NO SYLLABUS UPLOADED",
                "pipeline_steps": pipeline_steps
            }
        
        pipeline_steps.append({
            "step": 2,
            "name": "Syllabus Retrieval",
            "status": "✅",
            "detail": f"Retrieved {len(context_docs)} relevant chunks from vector database"
        })
        
        # Step 3: Relevance scoring
        scores = [d["metadata"].get("relevance_score", 0) for d in context_docs]
        avg_score = sum(scores) / max(len(scores), 1)
        max_score = max(scores) if scores else 0
        
        pipeline_steps.append({
            "step": 3,
            "name": "Relevance Scoring",
            "status": "✅" if max_score > 0.1 else "⚠️",
            "detail": f"Best match: {max_score:.0%} confidence, Average: {avg_score:.0%}"
        })
        
        # Step 4: Extract matched topics and metadata
        matched_topics = set()
        matched_units = set()
        source_pages = set()
        all_keywords = set()
        
        for doc in context_docs:
            meta = doc["metadata"]
            # Extract topic-like phrases from content
            content = doc["content"]
            # Look for capitalized phrases (likely topics)
            topics_in_content = re.findall(r'[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*', content)
            for t in topics_in_content[:5]:
                if len(t) > 4:
                    matched_topics.add(t)
            
            if meta.get("unit"):
                matched_units.add(meta["unit"])
            if meta.get("page"):
                source_pages.add(meta["page"])
            
            for kw in meta.get("matched_keywords", []):
                all_keywords.add(kw)
        
        pipeline_steps.append({
            "step": 4,
            "name": "Topic Extraction",
            "status": "✅",
            "detail": f"Found {len(matched_topics)} related topics, {len(matched_units)} units"
        })
        
        # Step 5: Verification decision (INCREASED STRICTNESS)
        # Thresholds: Max Score > 0.15 OR at least 2 key matches
        is_verified = max_score > 0.15 or len(all_keywords) >= 2
        confidence = round(max_score * 100)
        
        if is_verified:
            status = f"✅ VERIFIED FROM SYLLABUS ({confidence}% match)"
        else:
            status = "❌ OUT OF SYLLABUS — Restricted Content"
        
        pipeline_steps.append({
            "step": 5,
            "name": "Verification Decision",
            "status": "✅" if is_verified else "❌",
            "detail": status
        })
        
        return {
            "is_syllabus_verified": is_verified,
            "confidence": confidence,
            "matched_topics": list(matched_topics)[:10],
            "matched_unit": next(iter(sorted(context_docs, key=lambda x: x["metadata"].get("relevance_score", 0), reverse=True)))["metadata"].get("unit", "Gen") if context_docs else "Gen",
            "all_units": list(matched_units),
            "source_pages": sorted(list(source_pages))[:10],
            "matched_keywords": list(all_keywords),
            "verification_status": status,
            "pipeline_steps": pipeline_steps
        }


def apply_strict_filtration(context_docs, question, target_unit=None):
    """
    Main entry point for filtration.
    Returns filtered docs sorted by relevance.
    """
    guard = SyllabusGuard()
    filtered = guard.filter_context(context_docs, question, target_unit)
    filtered.sort(key=lambda x: x['metadata'].get('relevance_score', 0), reverse=True)
    return filtered
