import uuid
import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.database import get_db
from app.models import ActionItemResponse, ActionItemCreate, ActionItemUpdate, MergeTasksRequest
from app.services.deadline_service import parse_deadline
from app.services.deduplication_service import find_duplicate_clusters, merge_action_items

router = APIRouter(prefix="/api/action-items", tags=["Action Items"])

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

@router.get("/duplicates")
def get_duplicate_candidates(threshold: float = Query(0.50, ge=0.1, le=1.0)):
    """
    Phase 2 Smart Deduplication:
    Identifies duplicate or related action items across documents and proposes merge clusters.
    """
    clusters = find_duplicate_clusters(threshold=threshold)
    return {
        "count": len(clusters),
        "clusters": clusters
    }

@router.post("/merge")
def merge_tasks_endpoint(payload: MergeTasksRequest):
    """
    Phase 2 Smart Deduplication Merge:
    Merges duplicate task items into the primary task, preserving all source document references.
    """
    try:
        updated_task = merge_action_items(payload.primary_task_id, payload.duplicate_task_ids)
        return {
            "status": "success",
            "message": f"Successfully merged {len(payload.duplicate_task_ids)} duplicate task(s) into primary task.",
            "task": updated_task
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=List[dict])
def list_action_items(
    completed: Optional[bool] = Query(None),
    priority: Optional[str] = Query(None),
    document_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None)  # overdue, due_today, due_this_week, upcoming, inferred
):
    """
    Retrieves all action items with source quotes, deadline intelligence, and document lineage.
    """
    query = """
        SELECT 
            a.id, a.document_id, a.title, a.description, a.priority,
            a.assignee, a.due_date, a.completed, a.created_at,
            a.parsed_due_date, a.is_explicit_date, a.source_quote, a.merged_sources,
            d.title as document_title, d.suggested_folder
        FROM action_items a
        LEFT JOIN documents d ON a.document_id = d.id
        WHERE 1=1
    """
    params = []

    if completed is not None:
        query += " AND a.completed = ?"
        params.append(1 if completed else 0)

    if priority:
        query += " AND a.priority = ?"
        params.append(priority.lower())

    if document_id:
        query += " AND a.document_id = ?"
        params.append(document_id)

    query += " ORDER BY a.completed ASC, CASE a.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, a.created_at DESC"

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()

    results = []
    for r in rows:
        is_comp = bool(r["completed"])
        raw_due = r["due_date"] or "Upcoming"
        dl_info = parse_deadline(raw_due)

        merged_sources = []
        if r["merged_sources"]:
            try:
                merged_sources = json.loads(r["merged_sources"])
            except Exception:
                merged_sources = []

        item_status = dl_info["status"] if not is_comp else "completed"

        if status and status.lower() != "all" and item_status != status.lower():
            continue

        results.append({
            "id": r["id"],
            "document_id": r["document_id"],
            "document_title": r["document_title"] or "Standalone Task",
            "suggested_folder": r["suggested_folder"] or "Tasks/General",
            "title": r["title"],
            "description": r["description"] or "",
            "priority": r["priority"] or "medium",
            "assignee": r["assignee"] or "Unassigned",
            "due_date": raw_due,
            "source_quote": r["source_quote"] or "",
            "parsed_due_date": r["parsed_due_date"] or dl_info["parsed_iso"],
            "is_explicit_date": bool(r["is_explicit_date"]) or dl_info["is_explicit"],
            "deadline_status": item_status,
            "days_remaining": dl_info["days_remaining"],
            "badge_text": dl_info["badge_text"],
            "merged_sources": merged_sources,
            "completed": is_comp,
            "created_at": r["created_at"]
        })

    return results

@router.post("", response_model=ActionItemResponse)
def create_action_item(payload: ActionItemCreate):
    """Adds a new action item manually."""
    item_id = str(uuid.uuid4())
    now = _now_iso()
    raw_due = payload.due_date or "Upcoming"
    dl_info = parse_deadline(raw_due)
    source_q = payload.source_quote or payload.description or ""

    with get_db() as conn:
        cursor = conn.cursor()
        doc_title = None
        sug_folder = None
        if payload.document_id:
            cursor.execute("SELECT id, title, suggested_folder FROM documents WHERE id = ?", (payload.document_id,))
            doc = cursor.fetchone()
            if not doc:
                raise HTTPException(status_code=404, detail="Referenced document not found")
            doc_title = doc["title"]
            sug_folder = doc["suggested_folder"]

        cursor.execute("""
            INSERT INTO action_items (
                id, document_id, title, description, priority, assignee, due_date,
                completed, created_at, parsed_due_date, is_explicit_date, source_quote, merged_sources
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)
        """, (
            item_id, payload.document_id, payload.title.strip(),
            payload.description or "", payload.priority,
            payload.assignee or "Unassigned", raw_due, now,
            dl_info["parsed_iso"], 1 if dl_info["is_explicit"] else 0,
            source_q, json.dumps([])
        ))
        conn.commit()

    return ActionItemResponse(
        id=item_id,
        document_id=payload.document_id,
        document_title=doc_title,
        suggested_folder=sug_folder,
        title=payload.title.strip(),
        description=payload.description or "",
        priority=payload.priority,
        assignee=payload.assignee or "Unassigned",
        due_date=raw_due,
        source_quote=source_q,
        parsed_due_date=dl_info["parsed_iso"],
        is_explicit_date=dl_info["is_explicit"],
        deadline_status=dl_info["status"],
        days_remaining=dl_info["days_remaining"],
        badge_text=dl_info["badge_text"],
        merged_sources=[],
        completed=False,
        created_at=now
    )

@router.patch("/{item_id}")
def update_action_item(item_id: str, payload: ActionItemUpdate):
    """Updates an action item's status, assignee, priority, due date, or source quote."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM action_items WHERE id = ?", (item_id,))
        item = cursor.fetchone()
        if not item:
            raise HTTPException(status_code=404, detail="Action item not found")

        updates = []
        params = []

        if payload.completed is not None:
            updates.append("completed = ?")
            params.append(1 if payload.completed else 0)

        if payload.title is not None:
            updates.append("title = ?")
            params.append(payload.title.strip())

        if payload.description is not None:
            updates.append("description = ?")
            params.append(payload.description.strip())

        if payload.priority is not None:
            updates.append("priority = ?")
            params.append(payload.priority.lower())

        if payload.assignee is not None:
            updates.append("assignee = ?")
            params.append(payload.assignee.strip())

        if payload.due_date is not None:
            updates.append("due_date = ?")
            params.append(payload.due_date.strip())
            dl_info = parse_deadline(payload.due_date.strip())
            updates.append("parsed_due_date = ?")
            params.append(dl_info["parsed_iso"])
            updates.append("is_explicit_date = ?")
            params.append(1 if dl_info["is_explicit"] else 0)

        if payload.source_quote is not None:
            updates.append("source_quote = ?")
            params.append(payload.source_quote.strip())

        if updates:
            params.append(item_id)
            cursor.execute(f"UPDATE action_items SET {', '.join(updates)} WHERE id = ?", params)
            conn.commit()

        cursor.execute("""
            SELECT a.*, d.title as document_title, d.suggested_folder
            FROM action_items a
            LEFT JOIN documents d ON a.document_id = d.id
            WHERE a.id = ?
        """, (item_id,))
        updated = cursor.fetchone()

        dl_info = parse_deadline(updated["due_date"])
        is_comp = bool(updated["completed"])

        merged_sources = []
        if updated["merged_sources"]:
            try:
                merged_sources = json.loads(updated["merged_sources"])
            except Exception:
                merged_sources = []

        return {
            "id": updated["id"],
            "document_id": updated["document_id"],
            "document_title": updated["document_title"],
            "suggested_folder": updated["suggested_folder"],
            "title": updated["title"],
            "description": updated["description"],
            "priority": updated["priority"],
            "assignee": updated["assignee"],
            "due_date": updated["due_date"],
            "source_quote": updated["source_quote"] or "",
            "parsed_due_date": updated["parsed_due_date"] or dl_info["parsed_iso"],
            "is_explicit_date": bool(updated["is_explicit_date"]) or dl_info["is_explicit"],
            "deadline_status": dl_info["status"] if not is_comp else "completed",
            "days_remaining": dl_info["days_remaining"],
            "badge_text": dl_info["badge_text"],
            "merged_sources": merged_sources,
            "completed": is_comp,
            "created_at": updated["created_at"]
        }

@router.delete("/{item_id}")
def delete_action_item(item_id: str):
    """Deletes an action item."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM action_items WHERE id = ?", (item_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Action item not found")
        cursor.execute("DELETE FROM action_items WHERE id = ?", (item_id,))
        conn.commit()
    return {"status": "success", "deleted_id": item_id}
