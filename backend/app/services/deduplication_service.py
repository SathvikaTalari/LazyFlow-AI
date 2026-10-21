import re
import json
from typing import List, Dict, Any, Optional
from app.database import get_db

STOP_WORDS = {
    "a", "an", "the", "and", "or", "to", "for", "by", "with", "in", "on", "at",
    "is", "are", "was", "were", "of", "from", "be", "this", "that", "it", "as",
    "by", "october", "november", "december", "january", "priority", "high",
    "medium", "low", "date", "upcoming", "due", "team", "unassigned"
}

def tokenize_task(text: str) -> set:
    """Extracts cleaned normalized token set from text."""
    words = re.findall(r"\b[a-zA-Z0-9]{2,}\b", text.lower())
    return {w for w in words if w not in STOP_WORDS}

def calculate_similarity(task_a: Dict[str, Any], task_b: Dict[str, Any]) -> Tuple_Sim:
    """
    Computes semantic similarity score and matching rationale between two tasks.
    Returns: (score between 0.0 and 1.0, reason string)
    """
    title_a = task_a.get("title", "")
    title_b = task_b.get("title", "")
    
    tokens_a = tokenize_task(f"{title_a} {task_a.get('description', '')}")
    tokens_b = tokenize_task(f"{title_b} {task_b.get('description', '')}")

    if not tokens_a or not tokens_b:
        return 0.0, "Insufficient token information"

    intersection = tokens_a.intersection(tokens_b)
    union = tokens_a.union(tokens_b)
    jaccard = len(intersection) / len(union) if union else 0.0

    # Check for direct title substring
    clean_a = re.sub(r"[^\w\s]", "", title_a.lower()).strip()
    clean_b = re.sub(r"[^\w\s]", "", title_b.lower()).strip()

    substring_bonus = 0.0
    if clean_a in clean_b or clean_b in clean_a:
        substring_bonus = 0.25

    # Check for matching assignee
    assignee_a = task_a.get("assignee", "").strip().lower()
    assignee_b = task_b.get("assignee", "").strip().lower()
    assignee_bonus = 0.0
    if assignee_a and assignee_b and assignee_a != "unassigned" and assignee_a == assignee_b:
        assignee_bonus = 0.15

    score = min(1.0, jaccard + substring_bonus + assignee_bonus)

    reasons = []
    if intersection:
        sample_words = list(intersection)[:4]
        reasons.append(f"Shared keywords: {', '.join(sample_words)}")
    if assignee_bonus > 0:
        reasons.append(f"Same assignee: {task_a.get('assignee')}")
    if substring_bonus > 0:
        reasons.append("High title phrase overlap")

    reason_str = " | ".join(reasons) if reasons else f"{int(score * 100)}% lexical similarity"
    return score, reason_str

Tuple_Sim = tuple[float, str]

def find_duplicate_clusters(threshold: float = 0.52) -> List[Dict[str, Any]]:
    """
    Scans all active action items in SQLite and identifies duplicate or related task candidates.
    Returns clusters with candidates, similarity scores, and suggested primary task.
    """
    query = """
        SELECT 
            a.id, a.document_id, a.title, a.description, a.priority,
            a.assignee, a.due_date, a.completed, a.created_at,
            a.source_quote, a.merged_sources,
            d.title as document_title, d.suggested_folder
        FROM action_items a
        LEFT JOIN documents d ON a.document_id = d.id
        WHERE a.completed = 0
        ORDER BY a.created_at DESC
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(query)
        tasks = [dict(r) for r in cursor.fetchall()]

    clusters = []
    processed_pairs = set()

    for i in range(len(tasks)):
        for j in range(i + 1, len(tasks)):
            t1 = tasks[i]
            t2 = tasks[j]
            pair_key = tuple(sorted([t1["id"], t2["id"]]))
            if pair_key in processed_pairs:
                continue

            score, reason = calculate_similarity(t1, t2)
            if score >= threshold:
                processed_pairs.add(pair_key)

                # Determine suggested primary (prefer higher priority or more descriptive title)
                prio_order = {"high": 3, "medium": 2, "low": 1}
                prio_1 = prio_order.get(t1.get("priority", "medium"), 2)
                prio_2 = prio_order.get(t2.get("priority", "medium"), 2)

                if prio_1 > prio_2 or (prio_1 == prio_2 and len(t1["title"]) >= len(t2["title"])):
                    primary = t1
                    duplicate = t2
                else:
                    primary = t2
                    duplicate = t1

                clusters.append({
                    "cluster_id": f"dup-{t1['id'][:8]}-{t2['id'][:8]}",
                    "similarity_score": round(score, 2),
                    "reason": reason,
                    "suggested_primary_id": primary["id"],
                    "tasks": [primary, duplicate],
                })

    # Sort by highest similarity first
    clusters.sort(key=lambda x: x["similarity_score"], reverse=True)
    return clusters

def merge_action_items(primary_id: str, duplicate_ids: List[str]) -> Dict[str, Any]:
    """
    Merges duplicate action items into the primary task:
    - Retains all source document linkages in `merged_sources` JSON.
    - Escalates priority to the highest among the merged group.
    - Combines descriptions and source quotes.
    - Deletes duplicate task records from SQLite.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Fetch primary
        cursor.execute("""
            SELECT a.*, d.title as doc_title FROM action_items a
            LEFT JOIN documents d ON a.document_id = d.id
            WHERE a.id = ?
        """, (primary_id,))
        primary = cursor.fetchone()
        if not primary:
            raise ValueError(f"Primary task '{primary_id}' not found.")

        # Fetch duplicates
        duplicates = []
        for d_id in duplicate_ids:
            cursor.execute("""
                SELECT a.*, d.title as doc_title FROM action_items a
                LEFT JOIN documents d ON a.document_id = d.id
                WHERE a.id = ?
            """, (d_id,))
            row = cursor.fetchone()
            if row:
                duplicates.append(dict(row))

        # Parse existing merged_sources
        merged_sources = []
        if primary["merged_sources"]:
            try:
                merged_sources = json.loads(primary["merged_sources"])
            except Exception:
                merged_sources = []

        # Add primary's own origin if not already present
        if primary["document_id"] and not any(s.get("task_id") == primary["id"] for s in merged_sources):
            merged_sources.append({
                "task_id": primary["id"],
                "document_id": primary["document_id"],
                "document_title": primary["doc_title"] or "Source Document",
                "original_title": primary["title"],
                "source_quote": primary["source_quote"] or "",
            })

        # Priority escalation
        prio_map = {"low": 1, "medium": 2, "high": 3}
        highest_prio_val = prio_map.get(primary["priority"], 2)

        combined_desc_parts = [primary["description"]] if primary["description"] else []

        for dup in duplicates:
            dup_prio_val = prio_map.get(dup["priority"], 2)
            if dup_prio_val > highest_prio_val:
                highest_prio_val = dup_prio_val

            if dup["description"] and dup["description"] not in combined_desc_parts:
                combined_desc_parts.append(dup["description"])

            merged_sources.append({
                "task_id": dup["id"],
                "document_id": dup["document_id"],
                "document_title": dup["doc_title"] or "Referenced Document",
                "original_title": dup["title"],
                "source_quote": dup["source_quote"] or "",
            })

            # Delete duplicate task
            cursor.execute("DELETE FROM action_items WHERE id = ?", (dup["id"],))

        inv_prio = {3: "high", 2: "medium", 1: "low"}
        final_priority = inv_prio.get(highest_prio_val, primary["priority"])
        final_description = "\n".join(combined_desc_parts).strip()

        # Update primary task
        cursor.execute("""
            UPDATE action_items SET
                priority = ?,
                description = ?,
                merged_sources = ?
            WHERE id = ?
        """, (
            final_priority,
            final_description,
            json.dumps(merged_sources),
            primary_id
        ))
        conn.commit()

        # Return updated task
        cursor.execute("""
            SELECT a.*, d.title as document_title, d.suggested_folder
            FROM action_items a
            LEFT JOIN documents d ON a.document_id = d.id
            WHERE a.id = ?
        """, (primary_id,))
        updated = dict(cursor.fetchone())
        updated["merged_sources"] = merged_sources
        return updated
