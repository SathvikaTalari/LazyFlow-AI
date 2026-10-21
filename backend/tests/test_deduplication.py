import pytest
from app.services.deduplication_service import tokenize_task, calculate_similarity

def test_tokenize_task():
    tokens = tokenize_task("Marcus Brody: Configure local Ollama connection pool by October 24")
    assert "marcus" in tokens
    assert "brody" in tokens
    assert "configure" in tokens
    assert "ollama" in tokens
    assert "connection" in tokens
    assert "pool" in tokens
    # Stop words should be removed
    assert "by" not in tokens
    assert "october" not in tokens

def test_similarity_calculation_high_match():
    task1 = {
        "title": "Configure local Ollama connection pool and implement schema validation",
        "description": "Set up Ollama client pool for local LLM inference",
        "assignee": "Marcus Brody",
    }
    task2 = {
        "title": "Set up Ollama connection pool with JSON validation",
        "description": "Local Ollama client connection pool setup",
        "assignee": "Marcus Brody",
    }
    score, reason = calculate_similarity(task1, task2)
    assert score >= 0.55
    assert "Same assignee" in reason or "Shared keywords" in reason

def test_similarity_calculation_distinct_tasks():
    task1 = {
        "title": "Finalize sloth mascot brand assets and color tokens",
        "description": "Design UI theme tokens for dark/light mode",
        "assignee": "Priya Patel",
    }
    task2 = {
        "title": "Audit background worker pool connection timeout",
        "description": "Check Prometheus metrics for DB connection locks",
        "assignee": "David Vance",
    }
    score, reason = calculate_similarity(task1, task2)
    assert score < 0.35
