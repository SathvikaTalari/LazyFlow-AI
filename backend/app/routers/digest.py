import uuid
import json
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.database import get_db
from app.models import DailyDigestResponse
from app.services.ollama_service import synthesize_daily_digest, get_active_model

router = APIRouter(prefix="/api/digest", tags=["Daily Digest"])

def _today_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

@router.get("/today", response_model=DailyDigestResponse)
def get_today_digest():
    """Retrieves today's daily briefing or creates a fresh synthesis."""
    today = _today_str()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM daily_digests WHERE date = ? ORDER BY created_at DESC LIMIT 1", (today,))
        row = cursor.fetchone()

        if row:
            highlights = []
            if row["highlights"]:
                try:
                    highlights = json.loads(row["highlights"])
                except Exception:
                    highlights = []
            docs_included = []
            if row["documents_included"]:
                try:
                    docs_included = json.loads(row["documents_included"])
                except Exception:
                    docs_included = []

            return DailyDigestResponse(
                id=row["id"],
                date=row["date"],
                title=row["title"],
                summary=row["summary"],
                highlights=highlights,
                pending_tasks_count=row["pending_tasks_count"],
                documents_included=docs_included,
                created_at=row["created_at"]
            )

    # If no digest for today, auto-generate
    return generate_digest_endpoint()

@router.post("/generate", response_model=DailyDigestResponse)
def generate_digest_endpoint(model: Optional[str] = Query(None)):
    """Triggers real local AI synthesis across documents and pending action items."""
    today = _today_str()
    now = _now_iso()

    with get_db() as conn:
        cursor = conn.cursor()
        # Fetch up to 5 recent documents
        cursor.execute("SELECT id, title, summary FROM documents ORDER BY created_at DESC LIMIT 5")
        docs = [dict(r) for r in cursor.fetchall()]

        # Fetch up to 10 pending tasks
        cursor.execute("SELECT id, title, priority, assignee FROM action_items WHERE completed = 0 ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END LIMIT 10")
        pending_tasks = [dict(r) for r in cursor.fetchall()]

    digest_content = synthesize_daily_digest(docs, pending_tasks, model_name=model)
    digest_id = str(uuid.uuid4())
    doc_ids = [d["id"] for d in docs]

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO daily_digests (
                id, date, title, summary, highlights, pending_tasks_count, documents_included, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            digest_id, today, digest_content["title"], digest_content["summary"],
            json.dumps(digest_content["highlights"]), len(pending_tasks),
            json.dumps(doc_ids), now
        ))
        conn.commit()

    return DailyDigestResponse(
        id=digest_id,
        date=today,
        title=digest_content["title"],
        summary=digest_content["summary"],
        highlights=digest_content["highlights"],
        pending_tasks_count=len(pending_tasks),
        documents_included=doc_ids,
        created_at=now
    )
