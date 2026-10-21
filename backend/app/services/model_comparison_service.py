import uuid
import json
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.database import get_db
from app.services.ollama_service import analyze_document_with_ollama
from app.services.sample_service import get_sample_document

PRACTICAL_DISCLAIMER = (
    "⚠️ Sloth Practical Comparison Notice: This side-by-side evaluation reflects practical, "
    "real-world execution on your local hardware and active background load. It is designed to help you "
    "select the best local model for your personal workflow, not as an academic or scientific benchmark. "
    "Output latency, token throughput, and extraction fidelity vary based on hardware specifications, "
    "model quantization, temperature, and operating system scheduling."
)

def _evaluate_schema_validity(result: Dict[str, Any]) -> Dict[str, Any]:
    """Evaluates whether the model output strictly adhered to the requested schema."""
    required_keys = ["title", "summary", "key_points", "action_items", "tags", "suggested_folder", "sentiment"]
    missing = []
    
    for k in required_keys:
        val = result.get(k)
        if val is None or (isinstance(val, str) and not val.strip()) or (isinstance(val, list) and len(val) == 0):
            missing.append(k)

    # Check action items schema
    items = result.get("action_items", [])
    if isinstance(items, list):
        for idx, itm in enumerate(items):
            if not isinstance(itm, dict) or not itm.get("title"):
                missing.append(f"action_items[{idx}].title")
            if isinstance(itm, dict) and itm.get("priority") not in ["high", "medium", "low"]:
                missing.append(f"action_items[{idx}].priority")

    total_checks = len(required_keys) + (len(items) * 2 if items else 2)
    failed_checks = len(missing)
    score_pct = max(0, int(round((1.0 - (failed_checks / max(total_checks, 1))) * 100)))

    return {
        "valid": len(missing) == 0,
        "score_pct": score_pct,
        "missing_fields": missing[:5]
    }

def _calculate_metrics(model_name: str, result: Dict[str, Any], duration_ms: int) -> Dict[str, Any]:
    """Calculates quantitative completeness and latency metrics."""
    summary = result.get("summary", "")
    key_points = result.get("key_points", [])
    action_items = result.get("action_items", [])
    tags = result.get("tags", [])

    schema_eval = _evaluate_schema_validity(result)

    return {
        "model_name": model_name,
        "latency_ms": duration_ms,
        "summary_word_count": len(summary.split()),
        "summary_char_count": len(summary),
        "key_points_count": len(key_points) if isinstance(key_points, list) else 0,
        "action_items_count": len(action_items) if isinstance(action_items, list) else 0,
        "tags_count": len(tags) if isinstance(tags, list) else 0,
        "suggested_folder": result.get("suggested_folder") or "Documents/General",
        "sentiment": result.get("sentiment") or "Informative",
        "schema_valid": schema_eval["valid"],
        "schema_score_pct": schema_eval["score_pct"],
        "missing_schema_fields": schema_eval["missing_fields"]
    }

def run_model_comparison(
    model_a: str,
    model_b: str,
    content: Optional[str] = None,
    title: Optional[str] = None,
    sample_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Runs the exact same document through two installed Ollama models and produces a side-by-side comparison.
    """
    # Resolve content
    effective_title = title or "Document Comparison"
    effective_content = content or ""

    if sample_id:
        sample = get_sample_document(sample_id)
        if sample:
            effective_content = sample["content"]
            effective_title = sample["title"]

    if not effective_content.strip():
        # Fallback to standard roadmap text if empty
        effective_title = "Product Strategy Sync"
        effective_content = (
            "# Product Strategy Sync\n"
            "- Finalize local model comparison suite by Friday. Assignee: Core Team.\n"
            "- Ensure offline privacy verification passes before release. Priority: High.\n"
            "- Review documentation and sample test bench."
        )

    # Run Model A
    t_start_a = time.time()
    res_a = analyze_document_with_ollama(
        content=effective_content,
        filename=f"{effective_title}.txt",
        user_title=effective_title,
        model_name=model_a
    )
    duration_a = int((time.time() - t_start_a) * 1000)
    metrics_a = _calculate_metrics(model_a, res_a, duration_a)

    # Run Model B
    t_start_b = time.time()
    res_b = analyze_document_with_ollama(
        content=effective_content,
        filename=f"{effective_title}.txt",
        user_title=effective_title,
        model_name=model_b
    )
    duration_b = int((time.time() - t_start_b) * 1000)
    metrics_b = _calculate_metrics(model_b, res_b, duration_b)

    # Comparative analysis
    latency_diff = abs(duration_a - duration_b)
    if duration_a < duration_b:
        faster_model = f"{model_a} ({latency_diff}ms faster)"
    elif duration_b < duration_a:
        faster_model = f"{model_b} ({latency_diff}ms faster)"
    else:
        faster_model = "Equal Latency"

    items_a = metrics_a["action_items_count"]
    items_b = metrics_b["action_items_count"]
    if items_a > items_b:
        more_items = f"{model_a} (+{items_a - items_b} tasks)"
    elif items_b > items_a:
        more_items = f"{model_b} (+{items_b - items_a} tasks)"
    else:
        more_items = f"Equal ({items_a} tasks each)"

    comp_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    content_snippet = effective_content[:300].strip()

    # Persist comparison in SQLite
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO model_comparisons (
                id, sample_id, sample_title, content_preview,
                model_a, model_b, model_a_result, model_b_result,
                model_a_metrics, model_b_metrics, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            comp_id, sample_id, effective_title, content_snippet,
            model_a, model_b, json.dumps(res_a), json.dumps(res_b),
            json.dumps(metrics_a), json.dumps(metrics_b), now
        ))
        conn.commit()

    return {
        "id": comp_id,
        "sample_title": effective_title,
        "content_snippet": content_snippet,
        "model_a": model_a,
        "model_b": model_b,
        "model_a_metrics": metrics_a,
        "model_b_metrics": metrics_b,
        "model_a_result": res_a,
        "model_b_result": res_b,
        "latency_difference_ms": latency_diff,
        "faster_model": faster_model,
        "more_action_items_model": more_items,
        "practical_disclaimer": PRACTICAL_DISCLAIMER,
        "created_at": now
    }

def list_model_comparisons(limit: int = 20) -> List[Dict[str, Any]]:
    """Returns saved model comparison history."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, sample_id, sample_title, content_preview,
                   model_a, model_b, model_a_metrics, model_b_metrics, created_at
            FROM model_comparisons
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()

    results = []
    for r in rows:
        try:
            m_a = json.loads(r["model_a_metrics"])
            m_b = json.loads(r["model_b_metrics"])
        except Exception:
            m_a = {}
            m_b = {}

        results.append({
            "id": r["id"],
            "sample_id": r["sample_id"],
            "sample_title": r["sample_title"],
            "content_snippet": r["content_preview"] or "",
            "model_a": r["model_a"],
            "model_b": r["model_b"],
            "model_a_metrics": m_a,
            "model_b_metrics": m_b,
            "created_at": r["created_at"]
        })
    return results
