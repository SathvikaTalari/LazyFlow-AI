import uuid
import pytest
from app.database import get_db, init_db

def test_database_initialization_and_schema():
    # Verify tables and columns exist
    init_db()
    with get_db() as conn:
        cursor = conn.cursor()
        
        cursor.execute("PRAGMA table_info(action_items)")
        columns = [r["name"] for r in cursor.fetchall()]
        
        assert "id" in columns
        assert "document_id" in columns
        assert "title" in columns
        assert "priority" in columns
        assert "parsed_due_date" in columns
        assert "is_explicit_date" in columns
        assert "source_quote" in columns
        assert "merged_sources" in columns

        cursor.execute("PRAGMA table_info(automation_actions)")
        auto_cols = [r["name"] for r in cursor.fetchall()]
        assert "id" in auto_cols
        assert "proposed_folder" in auto_cols
        assert "proposed_filename" in auto_cols
        assert "status" in auto_cols

def test_document_and_task_crud():
    doc_id = str(uuid.uuid4())
    task_id = str(uuid.uuid4())
    now = "2026-10-21T12:00:00+00:00"

    with get_db() as conn:
        cursor = conn.cursor()
        
        # Insert test document
        cursor.execute("""
            INSERT INTO documents (
                id, title, original_filename, file_type, file_size, raw_content,
                summary, key_points, tags, suggested_folder, sentiment,
                processing_time_ms, model_used, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            doc_id, "Test Architecture Doc", "test.md", ".md", 500, "# Heading\nContent",
            "Test summary", "[]", "[]", "Projects/Test", "Informative", 100, "test-model", now, now
        ))

        # Insert test task linked to document
        cursor.execute("""
            INSERT INTO action_items (
                id, document_id, title, description, priority, assignee, due_date,
                completed, created_at, parsed_due_date, is_explicit_date, source_quote, merged_sources
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 1, ?, '[]')
        """, (
            task_id, doc_id, "Deploy test microservice", "Deploy to staging",
            "high", "Dev Team", "October 25, 2026", now, "2026-10-25", "Source evidence text"
        ))
        conn.commit()

        # Query and verify
        cursor.execute("SELECT * FROM action_items WHERE id = ?", (task_id,))
        task = cursor.fetchone()
        assert task is not None
        assert task["title"] == "Deploy test microservice"
        assert task["priority"] == "high"
        assert task["source_quote"] == "Source evidence text"
        assert task["is_explicit_date"] == 1

        # Clean up
        cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        cursor.execute("DELETE FROM action_items WHERE id = ?", (task_id,))
        conn.commit()
