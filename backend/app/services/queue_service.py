import uuid
import time
import json
import threading
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.database import get_db
from app.services.ollama_service import analyze_document_with_ollama, get_active_model
from app.services.deadline_service import parse_deadline
from app.services.sample_service import get_sample_document

_queue_lock = threading.Lock()
_worker_running = False

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def enqueue_document(
    title: str,
    content: str,
    original_filename: Optional[str] = None,
    file_type: str = ".txt",
    file_size: int = 0,
    model: Optional[str] = None
) -> Dict[str, Any]:
    """Adds a single document to the local processing queue."""
    item_id = str(uuid.uuid4())
    now = _now_iso()
    effective_model = model or get_active_model()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO processing_queue (
                id, title, original_filename, file_type, file_size, content,
                status, progress, error_message, model_used, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'queued', 0, NULL, ?, ?)
        """, (
            item_id, title, original_filename or f"{title}.txt",
            file_type, file_size or len(content.encode("utf-8")),
            content, effective_model, now
        ))
        conn.commit()

    trigger_queue_worker()
    return get_queue_item(item_id)

def enqueue_samples(sample_ids: List[str], model: Optional[str] = None) -> List[Dict[str, Any]]:
    """Enqueues multiple sample documents in batch."""
    enqueued = []
    effective_model = model or get_active_model()
    now = _now_iso()

    with get_db() as conn:
        cursor = conn.cursor()
        for sid in sample_ids:
            sample = get_sample_document(sid)
            if not sample:
                continue
            item_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO processing_queue (
                    id, title, original_filename, file_type, file_size, content,
                    status, progress, error_message, model_used, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'queued', 0, NULL, ?, ?)
            """, (
                item_id, sample["title"], sample["filename"],
                sample["file_type"], sample["file_size"],
                sample["content"], effective_model, now
            ))
            enqueued.append(item_id)
        conn.commit()

    trigger_queue_worker()
    return [get_queue_item(qid) for qid in enqueued if get_queue_item(qid)]

def get_queue_item(item_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a single queue item by ID."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, title, original_filename, file_type, file_size,
                   status, progress, error_message, document_id, model_used,
                   processing_time_ms, retry_count, created_at, started_at, completed_at
            FROM processing_queue
            WHERE id = ?
        """, (item_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

def list_queue_items(limit: int = 50) -> List[Dict[str, Any]]:
    """Lists recent queue items ordered by creation date."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, title, original_filename, file_type, file_size,
                   status, progress, error_message, document_id, model_used,
                   processing_time_ms, retry_count, created_at, started_at, completed_at
            FROM processing_queue
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,))
        return [dict(r) for r in cursor.fetchall()]

def cancel_queue_item(item_id: str) -> Dict[str, Any]:
    """Safely cancels a queued or in-progress item."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT status FROM processing_queue WHERE id = ?", (item_id,))
        row = cursor.fetchone()
        if not row:
            return {"status": "error", "message": "Item not found"}
        
        cur_status = row["status"]
        if cur_status in ["completed", "failed", "cancelled"]:
            return {"status": "noop", "message": f"Item already in terminal state '{cur_status}'"}

        cursor.execute("""
            UPDATE processing_queue
            SET status = 'cancelled',
                error_message = 'Cancelled by user',
                progress = 0
            WHERE id = ?
        """, (item_id,))
        conn.commit()

    return {"status": "success", "message": "Item cancelled successfully", "item_id": item_id}

def retry_queue_item(item_id: str) -> Dict[str, Any]:
    """Retries a failed, interrupted, or cancelled queue item."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT status FROM processing_queue WHERE id = ?", (item_id,))
        row = cursor.fetchone()
        if not row:
            return {"status": "error", "message": "Item not found"}

        cursor.execute("""
            UPDATE processing_queue
            SET status = 'queued',
                progress = 0,
                error_message = NULL,
                retry_count = retry_count + 1
            WHERE id = ?
        """, (item_id,))
        conn.commit()

    trigger_queue_worker()
    return {"status": "success", "message": "Item re-queued for processing", "item_id": item_id}

def delete_queue_item(item_id: str) -> Dict[str, Any]:
    """Removes a finished, failed, or cancelled item from the queue list."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM processing_queue WHERE id = ?", (item_id,))
        conn.commit()
    return {"status": "success", "deleted_id": item_id}

def clear_completed_queue() -> Dict[str, Any]:
    """Clears all completed and cancelled queue items."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM processing_queue WHERE status IN ('completed', 'cancelled')")
        deleted = cursor.rowcount
        conn.commit()
    return {"status": "success", "cleared_count": deleted}

def trigger_queue_worker():
    """Starts the queue processor thread if not already running."""
    global _worker_running
    with _queue_lock:
        if not _worker_running:
            _worker_running = True
            t = threading.Thread(target=_process_queue_loop, daemon=True, name="LazyFlowQueueWorker")
            t.start()

def _process_queue_loop():
    """Background worker loop processing queued documents sequentially to avoid DB locks."""
    global _worker_running
    try:
        while True:
            # Pick next queued item atomically
            item = None
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT id, title, original_filename, file_type, file_size, content, model_used
                    FROM processing_queue
                    WHERE status = 'queued'
                    ORDER BY created_at ASC
                    LIMIT 1
                """)
                row = cursor.fetchone()
                if row:
                    item_id = row["id"]
                    # Atomically transition to 'processing'
                    cursor.execute("""
                        UPDATE processing_queue
                        SET status = 'processing',
                            started_at = ?,
                            progress = 15
                        WHERE id = ? AND status = 'queued'
                    """, (_now_iso(), item_id))
                    if cursor.rowcount > 0:
                        conn.commit()
                        item = dict(row)

            if not item:
                # No more queued items
                break

            _process_single_item(item)

    finally:
        with _queue_lock:
            _worker_running = False

def _process_single_item(item: Dict[str, Any]):
    """Processes a single document item through Ollama extraction and SQLite persistence."""
    item_id = item["id"]
    title = item["title"]
    filename = item["original_filename"]
    file_type = item.get("file_type") or ".txt"
    file_size = item.get("file_size") or 0
    content = item.get("content") or ""
    model = item.get("model_used") or get_active_model()
    start_time = time.time()

    try:
        # Check if cancelled before starting heavy inference
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT status FROM processing_queue WHERE id = ?", (item_id,))
            st = cursor.fetchone()
            if not st or st["status"] == "cancelled":
                return

            # Update progress to 40% (running local AI analysis)
            cursor.execute("UPDATE processing_queue SET progress = 40 WHERE id = ?", (item_id,))
            conn.commit()

        # Run local AI inference
        analysis = analyze_document_with_ollama(
            content=content,
            filename=filename,
            user_title=title,
            model_name=model
        )

        # Check cancellation again before persisting
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT status FROM processing_queue WHERE id = ?", (item_id,))
            st = cursor.fetchone()
            if not st or st["status"] == "cancelled":
                return

            cursor.execute("UPDATE processing_queue SET progress = 75 WHERE id = ?", (item_id,))
            conn.commit()

        # Save document and action items atomically
        doc_id = str(uuid.uuid4())
        now = _now_iso()
        final_title = analysis.get("title") or title
        summary = analysis.get("summary", "")
        key_points = analysis.get("key_points", [])
        tags = analysis.get("tags", [])
        suggested_folder = analysis.get("suggested_folder", "Documents/General")
        sentiment = analysis.get("sentiment", "Informative")
        processing_time_ms = int((time.time() - start_time) * 1000)
        raw_action_items = analysis.get("action_items", [])

        with get_db() as conn:
            cursor = conn.cursor()
            
            # Avoid duplicate document if already created
            cursor.execute("""
                INSERT INTO documents (
                    id, title, original_filename, file_type, file_size, raw_content,
                    summary, key_points, tags, suggested_folder, sentiment,
                    processing_time_ms, model_used, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                doc_id, final_title, filename, file_type, file_size, content,
                summary, json.dumps(key_points), json.dumps(tags), suggested_folder,
                sentiment, processing_time_ms, model, now, now
            ))

            for itm in raw_action_items:
                act_id = str(uuid.uuid4())
                raw_due = itm.get("due_date", "TBD")
                dl_info = parse_deadline(raw_due)
                src_q = itm.get("source_quote") or itm.get("description", "")
                
                cursor.execute("""
                    INSERT INTO action_items (
                        id, document_id, title, description, priority, assignee, due_date,
                        completed, created_at, parsed_due_date, is_explicit_date, source_quote, merged_sources
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)
                """, (
                    act_id, doc_id, itm.get("title", ""), itm.get("description", ""),
                    itm.get("priority", "medium"), itm.get("assignee", "Unassigned"),
                    raw_due, now, dl_info["parsed_iso"], 1 if dl_info["is_explicit"] else 0,
                    src_q, json.dumps([])
                ))

            # Mark queue item as completed
            cursor.execute("""
                UPDATE processing_queue
                SET status = 'completed',
                    progress = 100,
                    document_id = ?,
                    completed_at = ?,
                    processing_time_ms = ?,
                    error_message = NULL
                WHERE id = ?
            """, (doc_id, now, processing_time_ms, item_id))
            conn.commit()

    except Exception as e:
        processing_time_ms = int((time.time() - start_time) * 1000)
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE processing_queue
                SET status = 'failed',
                    progress = 0,
                    error_message = ?,
                    processing_time_ms = ?
                WHERE id = ?
            """, (str(e), processing_time_ms, item_id))
            conn.commit()
