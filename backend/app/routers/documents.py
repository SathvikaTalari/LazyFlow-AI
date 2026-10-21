import uuid
import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from app.database import get_db
from app.models import DocumentResponse, DocumentListItem, DocumentPasteRequest, SampleDocInfo
from app.services.document_parser import extract_text_from_file
from app.services.ollama_service import analyze_document_with_ollama, get_active_model
from app.services.sample_service import list_sample_documents, get_sample_document
from app.services.deadline_service import parse_deadline

router = APIRouter(prefix="/api", tags=["Documents"])

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def _save_document_and_items(
    doc_id: str,
    title: str,
    original_filename: Optional[str],
    file_type: str,
    file_size: int,
    raw_content: str,
    analysis: dict
) -> DocumentResponse:
    now = _now_iso()
    summary = analysis.get("summary", "")
    key_points = analysis.get("key_points", [])
    tags = analysis.get("tags", [])
    suggested_folder = analysis.get("suggested_folder", "Documents/General")
    sentiment = analysis.get("sentiment", "Informative")
    processing_time_ms = analysis.get("processing_time_ms", 0)
    model_used = analysis.get("model_used", get_active_model())
    raw_action_items = analysis.get("action_items", [])

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO documents (
                id, title, original_filename, file_type, file_size, raw_content,
                summary, key_points, tags, suggested_folder, sentiment,
                processing_time_ms, model_used, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            doc_id, title, original_filename, file_type, file_size, raw_content,
            summary, json.dumps(key_points), json.dumps(tags), suggested_folder,
            sentiment, processing_time_ms, model_used, now, now
        ))

        created_action_items = []
        for item in raw_action_items:
            item_id = str(uuid.uuid4())
            raw_due = item.get("due_date", "TBD")
            dl_info = parse_deadline(raw_due)
            source_q = item.get("source_quote") or item.get("description", "")

            cursor.execute("""
                INSERT INTO action_items (
                    id, document_id, title, description, priority, assignee, due_date,
                    completed, created_at, parsed_due_date, is_explicit_date, source_quote, merged_sources
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)
            """, (
                item_id, doc_id, item.get("title", ""), item.get("description", ""),
                item.get("priority", "medium"), item.get("assignee", "Unassigned"),
                raw_due, now, dl_info["parsed_iso"], 1 if dl_info["is_explicit"] else 0,
                source_q, json.dumps([])
            ))

            created_action_items.append({
                "id": item_id,
                "document_id": doc_id,
                "title": item.get("title", ""),
                "description": item.get("description", ""),
                "priority": item.get("priority", "medium"),
                "assignee": item.get("assignee", "Unassigned"),
                "due_date": raw_due,
                "source_quote": source_q,
                "parsed_due_date": dl_info["parsed_iso"],
                "is_explicit_date": dl_info["is_explicit"],
                "deadline_status": dl_info["status"],
                "days_remaining": dl_info["days_remaining"],
                "badge_text": dl_info["badge_text"],
                "merged_sources": [],
                "completed": False,
                "created_at": now
            })

        conn.commit()

    return DocumentResponse(
        id=doc_id,
        title=title,
        original_filename=original_filename,
        file_type=file_type,
        file_size=file_size,
        summary=summary,
        key_points=key_points,
        tags=tags,
        suggested_folder=suggested_folder,
        sentiment=sentiment,
        raw_content=raw_content,
        action_items=created_action_items,
        action_items_total=len(created_action_items),
        action_items_completed=0,
        processing_time_ms=processing_time_ms,
        model_used=model_used,
        created_at=now
    )

@router.get("/samples", response_model=List[SampleDocInfo])
def get_sample_list():
    """Returns sample documents ready for 1-click loading."""
    return list_sample_documents()

@router.post("/documents/sample/{sample_id}", response_model=DocumentResponse)
def load_sample_document_endpoint(sample_id: str, model: Optional[str] = Query(None)):
    """Loads a pre-configured sample document and runs real local AI inference."""
    sample = get_sample_document(sample_id)
    if not sample:
        raise HTTPException(status_code=404, detail="Sample document not found")

    content = sample["content"]
    filename = sample["filename"]
    file_type = sample["file_type"]
    file_size = sample["file_size"]
    title = sample["title"]

    try:
        analysis = analyze_document_with_ollama(
            content=content,
            filename=filename,
            user_title=title,
            model_name=model
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    doc_id = str(uuid.uuid4())
    final_title = analysis.get("title") or title
    return _save_document_and_items(
        doc_id=doc_id,
        title=final_title,
        original_filename=filename,
        file_type=file_type,
        file_size=file_size,
        raw_content=content,
        analysis=analysis
    )

@router.get("/documents", response_model=List[DocumentListItem])
def list_documents():
    """Returns all processed documents ordered by creation date."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                d.id, d.title, d.original_filename, d.file_type, d.file_size,
                d.summary, d.tags, d.suggested_folder, d.sentiment,
                d.processing_time_ms, d.model_used, d.created_at,
                COUNT(a.id) as action_items_total,
                SUM(CASE WHEN a.completed = 1 THEN 1 ELSE 0 END) as action_items_completed
            FROM documents d
            LEFT JOIN action_items a ON d.id = a.document_id
            GROUP BY d.id
            ORDER BY d.created_at DESC
        """)
        rows = cursor.fetchall()
        
        results = []
        for row in rows:
            tags = []
            if row["tags"]:
                try:
                    tags = json.loads(row["tags"])
                except Exception:
                    tags = []
            
            results.append(DocumentListItem(
                id=row["id"],
                title=row["title"],
                original_filename=row["original_filename"],
                file_type=row["file_type"] or ".txt",
                file_size=row["file_size"] or 0,
                summary=row["summary"] or "",
                tags=tags,
                suggested_folder=row["suggested_folder"],
                sentiment=row["sentiment"],
                action_items_total=row["action_items_total"] or 0,
                action_items_completed=row["action_items_completed"] or 0,
                processing_time_ms=row["processing_time_ms"] or 0,
                model_used=row["model_used"],
                created_at=row["created_at"]
            ))
        return results

@router.get("/documents/{doc_id}", response_model=DocumentResponse)
def get_document(doc_id: str):
    """Retrieves full details of a single document including source quotes and deadline intel."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
        doc = cursor.fetchone()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        cursor.execute("SELECT * FROM action_items WHERE document_id = ? ORDER BY created_at ASC", (doc_id,))
        items = cursor.fetchall()

        key_points = []
        if doc["key_points"]:
            try:
                key_points = json.loads(doc["key_points"])
            except Exception:
                key_points = []

        tags = []
        if doc["tags"]:
            try:
                tags = json.loads(doc["tags"])
            except Exception:
                tags = []

        action_items_list = []
        completed_count = 0
        for item in items:
            is_comp = bool(item["completed"])
            if is_comp:
                completed_count += 1

            dl_info = parse_deadline(item["due_date"])
            merged_sources = []
            if item["merged_sources"]:
                try:
                    merged_sources = json.loads(item["merged_sources"])
                except Exception:
                    merged_sources = []

            action_items_list.append({
                "id": item["id"],
                "document_id": item["document_id"],
                "document_title": doc["title"],
                "suggested_folder": doc["suggested_folder"],
                "title": item["title"],
                "description": item["description"],
                "priority": item["priority"],
                "assignee": item["assignee"],
                "due_date": item["due_date"],
                "source_quote": item["source_quote"] or "",
                "parsed_due_date": item["parsed_due_date"] or dl_info["parsed_iso"],
                "is_explicit_date": bool(item["is_explicit_date"]) or dl_info["is_explicit"],
                "deadline_status": dl_info["status"] if not is_comp else "completed",
                "days_remaining": dl_info["days_remaining"],
                "badge_text": dl_info["badge_text"],
                "merged_sources": merged_sources,
                "completed": is_comp,
                "created_at": item["created_at"]
            })

        return DocumentResponse(
            id=doc["id"],
            title=doc["title"],
            original_filename=doc["original_filename"],
            file_type=doc["file_type"] or ".txt",
            file_size=doc["file_size"] or 0,
            summary=doc["summary"] or "",
            key_points=key_points,
            tags=tags,
            suggested_folder=doc["suggested_folder"],
            sentiment=doc["sentiment"],
            raw_content=doc["raw_content"] or "",
            action_items=action_items_list,
            action_items_total=len(action_items_list),
            action_items_completed=completed_count,
            processing_time_ms=doc["processing_time_ms"] or 0,
            model_used=doc["model_used"],
            created_at=doc["created_at"]
        )

@router.post("/documents/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    custom_title: Optional[str] = Form(None),
    model: Optional[str] = Form(None)
):
    """Accepts a file upload, extracts text, runs local Ollama analysis, and stores in SQLite."""
    content_bytes = await file.read()
    filename = file.filename or "uploaded_document.txt"
    file_size = len(content_bytes)

    if file_size == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    extracted_text, file_type, suggested_title = extract_text_from_file(content_bytes, filename)
    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract readable text from uploaded file.")

    effective_title = custom_title if custom_title and custom_title.strip() else suggested_title

    try:
        analysis = analyze_document_with_ollama(
            content=extracted_text,
            filename=filename,
            user_title=effective_title,
            model_name=model
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    doc_id = str(uuid.uuid4())
    final_title = analysis.get("title") or effective_title
    return _save_document_and_items(
        doc_id=doc_id,
        title=final_title,
        original_filename=filename,
        file_type=file_type,
        file_size=file_size,
        raw_content=extracted_text,
        analysis=analysis
    )

@router.post("/documents/paste", response_model=DocumentResponse)
def paste_document(payload: DocumentPasteRequest):
    """Processes pasted text directly through the local AI agent."""
    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Pasted content is empty.")

    file_size = len(content.encode("utf-8"))
    title = payload.title.strip() if payload.title else "Pasted Document"

    try:
        analysis = analyze_document_with_ollama(
            content=content,
            filename="Pasted_Text.txt",
            user_title=title,
            model_name=payload.model
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    doc_id = str(uuid.uuid4())
    final_title = analysis.get("title") or title
    return _save_document_and_items(
        doc_id=doc_id,
        title=final_title,
        original_filename="Pasted_Text.txt",
        file_type=".txt",
        file_size=file_size,
        raw_content=content,
        analysis=analysis
    )

@router.post("/documents/{doc_id}/reprocess", response_model=DocumentResponse)
@router.post("/documents/{doc_id}/retry", response_model=DocumentResponse)
def reprocess_document(doc_id: str, model: Optional[str] = Query(None)):
    """Re-analyzes an existing document with the active or specified Ollama model."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
        doc = cursor.fetchone()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        content = doc["raw_content"]
        filename = doc["original_filename"]
        title = doc["title"]

    try:
        analysis = analyze_document_with_ollama(
            content=content,
            filename=filename,
            user_title=title,
            model_name=model
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    now = _now_iso()
    summary = analysis.get("summary", "")
    key_points = analysis.get("key_points", [])
    tags = analysis.get("tags", [])
    suggested_folder = analysis.get("suggested_folder", "Documents/General")
    sentiment = analysis.get("sentiment", "Informative")
    processing_time_ms = analysis.get("processing_time_ms", 0)
    model_used = analysis.get("model_used", get_active_model())
    raw_action_items = analysis.get("action_items", [])

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE documents SET
                summary = ?,
                key_points = ?,
                tags = ?,
                suggested_folder = ?,
                sentiment = ?,
                processing_time_ms = ?,
                model_used = ?,
                updated_at = ?
            WHERE id = ?
        """, (
            summary, json.dumps(key_points), json.dumps(tags),
            suggested_folder, sentiment, processing_time_ms, model_used,
            now, doc_id
        ))

        cursor.execute("DELETE FROM action_items WHERE document_id = ?", (doc_id,))
        created_items = []
        for item in raw_action_items:
            item_id = str(uuid.uuid4())
            raw_due = item.get("due_date", "TBD")
            dl_info = parse_deadline(raw_due)
            source_q = item.get("source_quote") or item.get("description", "")

            cursor.execute("""
                INSERT INTO action_items (
                    id, document_id, title, description, priority, assignee, due_date,
                    completed, created_at, parsed_due_date, is_explicit_date, source_quote, merged_sources
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)
            """, (
                item_id, doc_id, item.get("title", ""), item.get("description", ""),
                item.get("priority", "medium"), item.get("assignee", "Unassigned"),
                raw_due, now, dl_info["parsed_iso"], 1 if dl_info["is_explicit"] else 0,
                source_q, json.dumps([])
            ))
            created_items.append({
                "id": item_id,
                "document_id": doc_id,
                "title": item.get("title", ""),
                "description": item.get("description", ""),
                "priority": item.get("priority", "medium"),
                "assignee": item.get("assignee", "Unassigned"),
                "due_date": raw_due,
                "source_quote": source_q,
                "parsed_due_date": dl_info["parsed_iso"],
                "is_explicit_date": dl_info["is_explicit"],
                "deadline_status": dl_info["status"],
                "days_remaining": dl_info["days_remaining"],
                "badge_text": dl_info["badge_text"],
                "merged_sources": [],
                "completed": False,
                "created_at": now
            })

        conn.commit()

    return DocumentResponse(
        id=doc_id,
        title=title,
        original_filename=filename,
        file_type=doc["file_type"],
        file_size=doc["file_size"],
        summary=summary,
        key_points=key_points,
        tags=tags,
        suggested_folder=suggested_folder,
        sentiment=sentiment,
        raw_content=content,
        action_items=created_items,
        action_items_total=len(created_items),
        action_items_completed=0,
        processing_time_ms=processing_time_ms,
        model_used=model_used,
        created_at=doc["created_at"]
    )

@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str):
    """Deletes a document and its action items from SQLite."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM documents WHERE id = ?", (doc_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Document not found")
        cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        cursor.execute("DELETE FROM action_items WHERE document_id = ?", (doc_id,))
        cursor.execute("DELETE FROM automation_actions WHERE document_id = ?", (doc_id,))
        conn.commit()
    return {"status": "success", "deleted_id": doc_id}
