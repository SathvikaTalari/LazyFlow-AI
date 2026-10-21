import pytest
from app.database import init_db, get_db
from app.services.queue_service import (
    enqueue_document,
    enqueue_samples,
    get_queue_item,
    list_queue_items,
    cancel_queue_item,
    retry_queue_item,
    clear_completed_queue,
    delete_queue_item,
)

def test_enqueue_and_list_items():
    init_db()
    item = enqueue_document(
        title="Test Sprint Notes",
        content="# Sprint 12\n- [ ] Deliver queue recovery by EOD.",
        original_filename="sprint12.txt"
    )
    assert item is not None
    assert item["title"] == "Test Sprint Notes"
    assert item["status"] in ["queued", "processing", "completed"]

    all_items = list_queue_items(limit=10)
    assert len(all_items) >= 1
    found = any(i["id"] == item["id"] for i in all_items)
    assert found

def test_cancel_and_retry_queue_item():
    init_db()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO processing_queue (
                id, title, original_filename, file_type, file_size, content,
                status, progress, error_message, created_at
            ) VALUES ('test-cancel-id', 'Cancel Test', 'cancel.txt', '.txt', 100, 'Content', 'queued', 0, NULL, '2026-10-21T00:00:00Z')
        """)
        conn.commit()

    # Cancel
    res = cancel_queue_item('test-cancel-id')
    assert res["status"] == "success"
    item = get_queue_item('test-cancel-id')
    assert item["status"] == "cancelled"

    # Retry
    retry_res = retry_queue_item('test-cancel-id')
    assert retry_res["status"] == "success"
    item_retried = get_queue_item('test-cancel-id')
    assert item_retried["status"] in ["queued", "processing", "completed"]
    assert item_retried["retry_count"] >= 1

    # Cleanup
    delete_queue_item('test-cancel-id')

def test_queue_recovery_after_backend_restart():
    """Simulates a backend crash/restart while an item was in 'processing' status."""
    init_db()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO processing_queue (
                id, title, original_filename, file_type, file_size, content,
                status, progress, error_message, created_at
            ) VALUES ('interrupted-job-1', 'Crashed Job', 'crash.txt', '.txt', 250, 'Content', 'processing', 45, NULL, '2026-10-21T00:00:00Z')
        """)
        conn.commit()

    # Simulate restart by calling init_db()
    init_db()

    item = get_queue_item('interrupted-job-1')
    assert item is not None
    assert item["status"] == "failed"
    assert "Interrupted: Server restarted" in item["error_message"]

    # Verify user can retry this interrupted job
    retry_res = retry_queue_item('interrupted-job-1')
    assert retry_res["status"] == "success"
    assert get_queue_item('interrupted-job-1')["status"] in ["queued", "processing", "completed"]

    # Cleanup
    delete_queue_item('interrupted-job-1')
