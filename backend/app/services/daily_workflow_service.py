import json
from datetime import datetime, timezone
from typing import Dict, Any, List
from app.database import get_db
from app.services.deadline_service import parse_deadline, get_current_date

def get_unified_daily_workflow() -> Dict[str, Any]:
    """
    Synthesizes the One-Click Daily Workspace:
    - Today's top priorities
    - Overdue deliverables with days overdue
    - Upcoming deadlines (next 7 days)
    - Cross-document risks & SLA / P1 blocker warnings
    - Summary metrics and daily sloth focus tip
    """
    today = get_current_date()
    now_iso = datetime.now(timezone.utc).isoformat()

    with get_db() as conn:
        cursor = conn.cursor()
        
        # Fetch all action items joined with doc details
        cursor.execute("""
            SELECT 
                a.id, a.document_id, a.title, a.description, a.priority,
                a.assignee, a.due_date, a.completed, a.created_at,
                a.source_quote, a.merged_sources,
                d.title as document_title, d.suggested_folder, d.sentiment as doc_sentiment
            FROM action_items a
            LEFT JOIN documents d ON a.document_id = d.id
            ORDER BY a.created_at DESC
        """)
        raw_tasks = [dict(r) for r in cursor.fetchall()]

        # Fetch recent documents for cross-document risk detection
        cursor.execute("""
            SELECT id, title, sentiment, tags, suggested_folder, created_at
            FROM documents
            ORDER BY created_at DESC LIMIT 10
        """)
        recent_docs = [dict(r) for r in cursor.fetchall()]

    overdue_tasks = []
    today_tasks = []
    upcoming_tasks = []
    undated_tasks = []
    completed_count = 0

    for t in raw_tasks:
        if t["completed"]:
            completed_count += 1
            continue

        deadline_info = parse_deadline(t.get("due_date"), reference_date=today)
        task_data = {
            **t,
            "deadline": deadline_info,
            "is_explicit_date": deadline_info["is_explicit"],
            "days_remaining": deadline_info["days_remaining"],
            "badge_text": deadline_info["badge_text"],
        }

        # Parse merged sources if any
        if t.get("merged_sources"):
            try:
                task_data["merged_sources"] = json.loads(t["merged_sources"])
            except Exception:
                task_data["merged_sources"] = []
        else:
            task_data["merged_sources"] = []

        status = deadline_info["status"]
        if status == "overdue":
            overdue_tasks.append(task_data)
        elif status == "due_today":
            today_tasks.append(task_data)
        elif status == "due_this_week":
            upcoming_tasks.append(task_data)
        else:
            if t["priority"] == "high":
                # High priority tasks without explicit date still belong in today's focus
                today_tasks.append(task_data)
            else:
                undated_tasks.append(task_data)

    # Sort overdue by most overdue
    overdue_tasks.sort(key=lambda x: x["days_remaining"] or 0)
    # Sort today by priority
    prio_order = {"high": 1, "medium": 2, "low": 3}
    today_tasks.sort(key=lambda x: prio_order.get(x["priority"], 2))
    # Sort upcoming by earliest deadline
    upcoming_tasks.sort(key=lambda x: x["days_remaining"] or 999)

    # Detect Cross-Document Risks
    cross_document_risks = []

    # Risk 1: Overdue items
    if overdue_tasks:
        cross_document_risks.append({
            "id": "risk-overdue",
            "severity": "critical",
            "title": f"{len(overdue_tasks)} Overdue Deliverable(s) Pending",
            "description": f"Tasks from '{overdue_tasks[0]['document_title']}' have passed their explicit deadline.",
            "action_text": "Reschedule or complete overdue items first to clear the bottleneck.",
            "affected_task_ids": [t["id"] for t in overdue_tasks[:3]],
        })

    # Risk 2: Critical / Urgent documents
    for doc in recent_docs:
        sent = (doc.get("sentiment") or "").lower()
        if sent in ["critical", "urgent"]:
            cross_document_risks.append({
                "id": f"risk-doc-{doc['id'][:8]}",
                "severity": "warning",
                "title": f"High-Sensitivity Context: {doc['title']}",
                "description": f"Document tagged with '{doc.get('sentiment')}' tone. Review preventative actions and team assignments.",
                "action_text": f"Inspect {doc['suggested_folder'] or 'incident records'}.",
                "document_id": doc["id"],
            })

    # Risk 3: Unassigned high-priority tasks
    unassigned_high = [t for t in (today_tasks + overdue_tasks) if t["priority"] == "high" and t.get("assignee") in ["Unassigned", "Team", "", None]]
    if unassigned_high:
        cross_document_risks.append({
            "id": "risk-unassigned",
            "severity": "warning",
            "title": f"{len(unassigned_high)} High-Priority Task(s) Unassigned",
            "description": "Critical deliverables lack a designated owner, increasing risk of dropped deadlines.",
            "action_text": "Assign explicit owners in the Action Items board.",
            "affected_task_ids": [t["id"] for t in unassigned_high[:3]],
        })

    total_active = len(raw_tasks) - completed_count
    completion_rate = round((completed_count / len(raw_tasks) * 100)) if raw_tasks else 100

    # Daily Sloth Focus Tip
    tips = [
        "Pick your top 2 high-priority tasks and tune out the noise. Slow and steady wins the race.",
        "Clear overdue deliverables first to eliminate mental drag before tackling new tasks.",
        "Review auto-suggested file folders to keep your digital desk clean and organized.",
        "Your data stays 100% on localhost—work with confidence and zero privacy anxiety."
    ]
    tip_idx = today.day % len(tips)

    return {
        "date": today.isoformat(),
        "today_priorities": today_tasks[:6],
        "overdue_tasks": overdue_tasks,
        "upcoming_deadlines": upcoming_tasks[:8],
        "cross_document_risks": cross_document_risks,
        "metrics": {
            "total_active": total_active,
            "overdue_count": len(overdue_tasks),
            "today_count": len(today_tasks),
            "upcoming_count": len(upcoming_tasks),
            "completed_count": completed_count,
            "completion_rate": completion_rate,
        },
        "daily_sloth_tip": tips[tip_idx],
        "generated_at": now_iso
    }
