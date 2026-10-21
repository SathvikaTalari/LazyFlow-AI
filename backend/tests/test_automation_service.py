import pytest
import uuid
from app.database import get_db
from app.services.automation_service import (
    generate_automation_proposals,
    apply_approved_automations,
    reject_automations
)

def test_safe_automation_proposals_and_approval():
    doc_id = str(uuid.uuid4())
    now = "2026-10-21T10:00:00+00:00"

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO documents (
                id, title, original_filename, file_type, file_size, raw_content,
                summary, key_points, tags, suggested_folder, sentiment,
                processing_time_ms, model_used, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, '[]', '[]', ?, ?, 50, 'test', ?, ?)
        """, (
            doc_id, "Q4 Budget Review", "Draft_Budget_v1.docx", ".docx", 1024,
            "Budget text", "Summary text", "Finance/Budgets", "Informative", now, now
        ))
        conn.commit()

    # Generate proposals
    proposals = generate_automation_proposals()
    matching = [p for p in proposals if p["document_id"] == doc_id]
    assert len(matching) == 1
    proposal = matching[0]
    assert proposal["status"] == "pending"
    assert proposal["proposed_folder"] == "Finance/Budgets"
    assert "Draft_Budget_v1.docx" in proposal["current_filename"]

    # Verify document has NOT been modified before approval
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT original_filename FROM documents WHERE id = ?", (doc_id,))
        assert cursor.fetchone()["original_filename"] == "Draft_Budget_v1.docx"

    # Explicitly approve proposal
    result = apply_approved_automations([proposal["id"]])
    assert result["applied_count"] == 1

    # Verify document is now updated after explicit approval
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT original_filename, suggested_folder FROM documents WHERE id = ?", (doc_id,))
        updated_doc = cursor.fetchone()
        assert updated_doc["suggested_folder"] == "Finance/Budgets"
        assert updated_doc["original_filename"] != "Draft_Budget_v1.docx"

        # Cleanup
        cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        cursor.execute("DELETE FROM automation_actions WHERE document_id = ?", (doc_id,))
        conn.commit()
