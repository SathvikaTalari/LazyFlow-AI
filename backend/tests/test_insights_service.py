import pytest
from app.database import init_db, get_db
from app.services.insights_service import get_productivity_insights

def test_productivity_insights_calculation():
    init_db()
    with get_db() as conn:
        cursor = conn.cursor()
        # Insert a sample doc
        cursor.execute("""
            INSERT OR REPLACE INTO documents (
                id, title, original_filename, file_type, file_size, raw_content,
                summary, key_points, tags, suggested_folder, sentiment,
                processing_time_ms, model_used, created_at, updated_at
            ) VALUES (
                'doc-insight-1', 'Architecture Whitepaper', 'whitepaper.md', '.md', 1024,
                'This architecture whitepaper describes our local distributed caching topology with 460 words total.',
                'Summary here.', '[]', '["Tech"]', 'Architecture', 'Informative',
                150, 'gemma3:4b', '2026-10-21T00:00:00Z', '2026-10-21T00:00:00Z'
            )
        """)
        # Insert a completed task and an overdue task
        cursor.execute("""
            INSERT OR REPLACE INTO action_items (
                id, document_id, title, description, priority, assignee, due_date,
                completed, created_at, parsed_due_date, is_explicit_date, source_quote, merged_sources
            ) VALUES 
            ('task-ins-1', 'doc-insight-1', 'Benchmark cache hit ratio', 'Details', 'high', 'Alice', '2026-10-01', 0, '2026-10-21T00:00:00Z', '2026-10-01', 1, 'Benchmark quote', '[]'),
            ('task-ins-2', 'doc-insight-1', 'Deploy to canary cluster', 'Details', 'medium', 'Bob', '2026-10-25', 1, '2026-10-21T00:00:00Z', '2026-10-25', 1, 'Deploy quote', '[]')
        """)
        conn.commit()

    insights = get_productivity_insights()
    assert insights["total_documents"] >= 1
    assert insights["total_tasks"] >= 2
    assert insights["completed_tasks"] >= 1
    assert insights["pending_tasks"] >= 1
    assert insights["overdue_tasks"] >= 1
    assert 0 <= insights["completion_rate_pct"] <= 100
    assert 0 <= insights["processing_success_rate_pct"] <= 100

    effort = insights["effort_saved"]
    assert effort["reading_speed_wpm"] == 230
    assert effort["summarization_mins_per_doc"] == 15.0
    assert effort["task_extraction_mins_per_item"] == 5.0
    assert effort["total_minutes_saved"] > 0
    assert "h" in effort["total_hours_formatted"] or "m" in effort["total_hours_formatted"]
    assert "Nielsen Norman Group" in effort["calculation_notes"]
