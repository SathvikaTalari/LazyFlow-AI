import pytest
from app.database import init_db, get_db
from app.services.briefing_service import get_smart_daily_briefing

def test_smart_daily_briefing_grounding():
    init_db()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO documents (
                id, title, original_filename, file_type, file_size, raw_content,
                summary, key_points, tags, suggested_folder, sentiment,
                processing_time_ms, model_used, created_at, updated_at
            ) VALUES (
                'doc-brief-1', 'Q4 Product Roadmap', 'roadmap.md', '.md', 500,
                'Engineering team must finalize local vector search by October 30.',
                'Roadmap summary', '[]', '["Roadmap"]', 'Projects/Roadmap', 'Action-Oriented',
                120, 'gemma3:4b', '2026-10-21T00:00:00Z', '2026-10-21T00:00:00Z'
            )
        """)
        cursor.execute("""
            INSERT OR REPLACE INTO action_items (
                id, document_id, title, description, priority, assignee, due_date,
                completed, created_at, parsed_due_date, is_explicit_date, source_quote, merged_sources
            ) VALUES (
                'task-brief-1', 'doc-brief-1', 'Finalize local vector search', 'Details',
                'high', 'Alice', '2026-10-30', 0, '2026-10-21T00:00:00Z', '2026-10-30', 1,
                'Engineering team must finalize local vector search by October 30.', '[]'
            )
        """)
        conn.commit()

    briefing = get_smart_daily_briefing()
    assert "Morning Sloth Briefing" in briefing["headline"]
    assert len(briefing["executive_summary"]) > 20
    assert len(briefing["urgent_actions"]) >= 1
    
    # Verify grounding on inserted task
    matching_actions = [a for a in briefing["urgent_actions"] if a["task_id"] == "task-brief-1"]
    assert len(matching_actions) == 1
    action = matching_actions[0]
    assert action["document_title"] == "Q4 Product Roadmap"
    assert "Engineering team must finalize" in (action["source_quote"] or "")

    assert len(briefing["recommended_next_steps"]) >= 1
    step = briefing["recommended_next_steps"][0]
    assert "grounded_source" in step
    assert len(step["grounded_source"]) > 0

    assert len(briefing["sloth_focus_quote"]) > 10
