import os
import re
import uuid
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.config import UPLOAD_DIR
from app.database import get_db

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def sanitize_filename(name: str) -> str:
    """Sanitizes string for safe filesystem usage."""
    clean = re.sub(r'[\\/*?:"<>|]', "", name)
    clean = re.sub(r"\s+", "_", clean.strip())
    return clean[:60]

def generate_automation_proposals() -> List[Dict[str, Any]]:
    """
    Analyzes all documents and generates safe organization/rename proposals.
    Never alters disk or database without explicit approval.
    """
    now = _now_iso()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM documents ORDER BY created_at DESC")
        docs = [dict(r) for r in cursor.fetchall()]

        proposals = []
        for doc in docs:
            cursor.execute("""
                SELECT * FROM automation_actions WHERE document_id = ? AND status = 'pending'
            """, (doc["id"],))
            existing = cursor.fetchone()

            if existing:
                item = dict(existing)
                item["document_title"] = doc["title"]
                proposals.append(item)
                continue

            # Calculate proposed normalized folder and filename
            folder = doc["suggested_folder"] or "Documents/General"
            
            # Format clean filename: YYYY-MM-DD_CleanTitle.ext
            date_part = doc["created_at"][:10] if doc["created_at"] else "2026-10-21"
            clean_title = sanitize_filename(doc["title"])
            ext = doc["file_type"] if doc["file_type"].startswith(".") else f".{doc['file_type']}"
            proposed_filename = f"{date_part}_{clean_title}{ext}"

            current_filename = doc["original_filename"] or f"document_{doc['id'][:8]}{ext}"
            current_folder = "Inbox/Unorganized"

            reason = f"Standardize filing under '{folder}' with ISO date prefix for audit compliance"

            action_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO automation_actions (
                    id, document_id, current_folder, current_filename,
                    proposed_folder, proposed_filename, reason, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
            """, (
                action_id, doc["id"], current_folder, current_filename,
                folder, proposed_filename, reason, now
            ))
            conn.commit()

            proposals.append({
                "id": action_id,
                "document_id": doc["id"],
                "document_title": doc["title"],
                "current_folder": current_folder,
                "current_filename": current_filename,
                "proposed_folder": folder,
                "proposed_filename": proposed_filename,
                "reason": reason,
                "status": "pending",
                "created_at": now
            })

    return proposals

def apply_approved_automations(action_ids: List[str]) -> Dict[str, Any]:
    """
    Executes ONLY explicitly approved organization actions.
    Updates SQLite and moves local file in uploads if present.
    """
    now = _now_iso()
    applied_results = []
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        for aid in action_ids:
            cursor.execute("SELECT * FROM automation_actions WHERE id = ? AND status = 'pending'", (aid,))
            action = cursor.fetchone()
            if not action:
                continue

            doc_id = action["document_id"]
            new_folder = action["proposed_folder"]
            new_filename = action["proposed_filename"]
            old_filename = action["current_filename"]

            cursor.execute("""
                UPDATE documents SET
                    suggested_folder = ?,
                    original_filename = ?,
                    updated_at = ?
                WHERE id = ?
            """, (new_folder, new_filename, now, doc_id))

            src_path = UPLOAD_DIR / old_filename
            dest_dir = UPLOAD_DIR / new_folder.replace("/", os.sep)
            dest_path = dest_dir / new_filename

            file_moved = False
            if src_path.exists():
                try:
                    dest_dir.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(src_path), str(dest_path))
                    file_moved = True
                except Exception:
                    file_moved = False

            cursor.execute("""
                UPDATE automation_actions SET
                    status = 'applied',
                    applied_at = ?
                WHERE id = ?
            """, (now, aid))

            applied_results.append({
                "action_id": aid,
                "document_id": doc_id,
                "folder": new_folder,
                "filename": new_filename,
                "file_moved_on_disk": file_moved,
            })

        conn.commit()

    return {
        "status": "success",
        "applied_count": len(applied_results),
        "results": applied_results
    }

def reject_automations(action_ids: List[str]) -> Dict[str, Any]:
    """Marks proposed automation actions as rejected."""
    with get_db() as conn:
        cursor = conn.cursor()
        for aid in action_ids:
            cursor.execute("UPDATE automation_actions SET status = 'rejected' WHERE id = ?", (aid,))
        conn.commit()
    return {"status": "success", "rejected_count": len(action_ids)}
