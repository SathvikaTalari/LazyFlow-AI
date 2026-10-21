import pytest
from app.services.model_comparison_service import (
    _evaluate_schema_validity,
    _calculate_metrics,
    PRACTICAL_DISCLAIMER
)

def test_evaluate_schema_validity_complete():
    sample_res = {
        "title": "Roadmap Sync",
        "summary": "This is a valid 2-paragraph summary.",
        "key_points": ["Point 1", "Point 2"],
        "action_items": [
            {
                "title": "Deploy API",
                "priority": "high",
                "due_date": "2026-11-01",
                "source_quote": "Deploy by Nov 1."
            }
        ],
        "tags": ["Dev", "API"],
        "suggested_folder": "Projects/API",
        "sentiment": "Action-Oriented"
    }

    eval_res = _evaluate_schema_validity(sample_res)
    assert eval_res["valid"] is True
    assert eval_res["score_pct"] == 100
    assert len(eval_res["missing_fields"]) == 0

def test_evaluate_schema_validity_missing_fields():
    broken_res = {
        "title": "",
        "summary": None,
        "action_items": [{"title": "No priority"}]
    }

    eval_res = _evaluate_schema_validity(broken_res)
    assert eval_res["valid"] is False
    assert eval_res["score_pct"] < 100
    assert "summary" in eval_res["missing_fields"] or "title" in eval_res["missing_fields"]

def test_calculate_metrics_and_practical_disclaimer():
    res = {
        "title": "Doc",
        "summary": "Short 10-word summary of the document for testing completeness.",
        "key_points": ["P1", "P2"],
        "action_items": [{"title": "Task A", "priority": "medium", "due_date": "Soon", "source_quote": "Quote"}],
        "tags": ["Tag1"],
        "suggested_folder": "General",
        "sentiment": "Informative"
    }
    metrics = _calculate_metrics("gemma3:4b", res, duration_ms=450)
    assert metrics["latency_ms"] == 450
    assert metrics["model_name"] == "gemma3:4b"
    assert metrics["summary_word_count"] > 5
    assert metrics["action_items_count"] == 1
    assert "academic or scientific benchmark" in PRACTICAL_DISCLAIMER.lower()
