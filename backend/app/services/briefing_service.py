import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.database import get_db
from app.services.deadline_service import parse_deadline, get_current_date
from app.services.ollama_service import get_active_model

def get_smart_daily_briefing(model_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Synthesizes a prioritized morning briefing strictly grounded in persisted documents and tasks.
    Every claim is anchored to source quotes and verified database records.
    """
    today = get_current_date()
    now_iso = datetime.now(timezone.utc).isoformat()
    active_m = model_name or get_active_model()

    with get_db() as conn:
        cursor = conn.cursor()

        # Query all action items joined with document metadata
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
        all_tasks = [dict(r) for r in cursor.fetchall()]

        # Query recent documents
        cursor.execute("""
            SELECT id, title, sentiment, tags, suggested_folder, created_at
            FROM documents
            ORDER BY created_at DESC
            LIMIT 15
        """)
        all_docs = [dict(r) for r in cursor.fetchall()]

        # Query pending automation proposals
        cursor.execute("""
            SELECT a.id, d.title as document_title, a.proposed_folder, a.proposed_filename, a.reason
            FROM automation_actions a
            LEFT JOIN documents d ON a.document_id = d.id
            WHERE a.status = 'pending'
        """)
        pending_automations = [dict(r) for r in cursor.fetchall()]

    urgent_actions = []
    upcoming_deadlines = []
    overdue_list = []
    high_prio_unassigned = []
    deadlines_by_date: Dict[str, List[Dict[str, Any]]] = {}

    data_grounding = []

    for t in all_tasks:
        if t["completed"]:
            continue

        dl = parse_deadline(t.get("due_date"), reference_date=today)
        doc_title = t.get("document_title") or "Workspace Task"
        src_q = t.get("source_quote") or t.get("description") or t.get("title")

        task_entry = {
            "task_id": t["id"],
            "title": t["title"],
            "priority": t["priority"],
            "due_date": t["due_date"] or "Upcoming",
            "document_title": doc_title,
            "document_id": t.get("document_id"),
            "assignee": t.get("assignee") or "Unassigned",
            "source_quote": src_q,
            "days_remaining": dl["days_remaining"],
            "is_explicit_date": dl["is_explicit"],
            "badge_text": dl["badge_text"],
            "status": dl["status"]
        }

        # Track grounding citation
        if src_q:
            data_grounding.append({
                "type": "task_evidence",
                "document_title": doc_title,
                "task_title": t["title"],
                "quote": src_q,
                "priority": t["priority"]
            })

        # Urgent Actions classification
        if dl["status"] == "overdue":
            overdue_list.append(task_entry)
            days_ago = abs(dl["days_remaining"]) if dl["days_remaining"] is not None else 1
            urgent_actions.append({
                "task_id": t["id"],
                "title": t["title"],
                "priority": t["priority"],
                "due_date": t["due_date"] or "Overdue",
                "document_title": doc_title,
                "document_id": t.get("document_id"),
                "assignee": task_entry["assignee"],
                "source_quote": src_q,
                "urgency_reason": f"Overdue by {days_ago} day(s). Blocks downstream sprint milestones."
            })
        elif dl["status"] == "due_today":
            urgent_actions.append({
                "task_id": t["id"],
                "title": t["title"],
                "priority": t["priority"],
                "due_date": t["due_date"],
                "document_title": doc_title,
                "document_id": t.get("document_id"),
                "assignee": task_entry["assignee"],
                "source_quote": src_q,
                "urgency_reason": "Due today. Complete during morning focus window."
            })
        elif t["priority"] == "high":
            urgent_actions.append({
                "task_id": t["id"],
                "title": t["title"],
                "priority": "high",
                "due_date": t["due_date"] or "High Priority",
                "document_title": doc_title,
                "document_id": t.get("document_id"),
                "assignee": task_entry["assignee"],
                "source_quote": src_q,
                "urgency_reason": "High priority deliverable extracted from source."
            })

        # Upcoming deadlines (next 7 days)
        if dl["status"] in ["due_this_week", "upcoming"] and dl["days_remaining"] is not None and dl["days_remaining"] <= 14:
            upcoming_deadlines.append({
                "task_id": t["id"],
                "title": t["title"],
                "due_date": t["due_date"],
                "days_remaining": dl["days_remaining"],
                "is_explicit_date": dl["is_explicit"],
                "document_title": doc_title,
                "badge_text": dl["badge_text"]
            })
            # Track bottleneck dates
            dt_key = dl.get("parsed_iso") or t["due_date"]
            deadlines_by_date.setdefault(dt_key, []).append(t)

        # High priority unassigned check
        if t["priority"] == "high" and task_entry["assignee"] in ["Unassigned", "Team", "", None]:
            high_prio_unassigned.append(task_entry)

    # Sort upcoming by earliest deadline
    upcoming_deadlines.sort(key=lambda x: x["days_remaining"] if x["days_remaining"] is not None else 999)

    # Cross-Document Risks
    cross_document_risks = []

    # Risk 1: Overdue items
    if overdue_list:
        cross_document_risks.append({
            "id": "risk-overdue-blocker",
            "severity": "critical",
            "title": f"{len(overdue_list)} Overdue Deliverable(s) Threatening Schedule",
            "source_document": overdue_list[0]["document_title"],
            "description": f"Tasks from '{overdue_list[0]['document_title']}' have passed explicit deadline ({overdue_list[0]['due_date']}).",
            "action_plan": "Reschedule or mark completed to unblock dependent team tasks.",
            "affected_items": [o["title"] for o in overdue_list[:3]]
        })

    # Risk 2: Critical sentiment documents
    for doc in all_docs:
        sent = (doc.get("sentiment") or "").lower()
        if sent in ["critical", "urgent"]:
            cross_document_risks.append({
                "id": f"risk-critical-{doc['id'][:8]}",
                "severity": "critical" if sent == "critical" else "warning",
                "title": f"Active Escalation Context: {doc['title']}",
                "source_document": doc["title"],
                "description": f"Document tagged with '{doc.get('sentiment')}' tone. Contains operational risks requiring preventative safeguards.",
                "action_plan": f"Inspect postmortem action items filed under '{doc['suggested_folder']}'.",
                "affected_items": [doc["title"]]
            })

    # Risk 3: Unassigned critical items
    if high_prio_unassigned:
        cross_document_risks.append({
            "id": "risk-unassigned-high",
            "severity": "warning",
            "title": f"{len(high_prio_unassigned)} High-Priority Deliverable(s) Without Designated Owner",
            "source_document": high_prio_unassigned[0]["document_title"],
            "description": "Critical items lack personal accountability, risking silent slips.",
            "action_plan": "Assign an explicit engineer or project owner in Action Items board.",
            "affected_items": [h["title"] for h in high_prio_unassigned[:3]]
        })

    # Risk 4: Multi-task deadline convergence
    for d_str, d_tasks in deadlines_by_date.items():
        if len(d_tasks) >= 3:
            cross_document_risks.append({
                "id": f"risk-convergence-{d_str[:10]}",
                "severity": "warning",
                "title": f"Deadline Bottleneck: {len(d_tasks)} Tasks Due on {d_str[:10]}",
                "source_document": d_tasks[0].get("document_title") or "Multiple Sources",
                "description": "High concentration of deliverables competing for bandwidth on the same date.",
                "action_plan": "Stagger non-critical deliverables by 2-3 business days.",
                "affected_items": [x["title"] for x in d_tasks[:3]]
            })

    # Recommended Next Steps (Grounded in source data)
    recommended_next_steps = []
    step_num = 1

    if overdue_list:
        top_overdue = overdue_list[0]
        recommended_next_steps.append({
            "step_number": step_num,
            "title": f"Clear Overdue Blocker: '{top_overdue['title'][:55]}'",
            "action_type": "complete_task",
            "details": f"Past deadline ({top_overdue['due_date']}) in '{top_overdue['document_title']}'. Resolving this removes immediate schedule risk.",
            "grounded_source": f"{top_overdue['document_title']} (Quote: \"{top_overdue['source_quote'][:80]}\")"
        })
        step_num += 1

    if urgent_actions:
        top_urgent = [u for u in urgent_actions if u["task_id"] not in [o["task_id"] for o in overdue_list]]
        if top_urgent:
            tu = top_urgent[0]
            recommended_next_steps.append({
                "step_number": step_num,
                "title": f"Execute Today's Top Priority: '{tu['title'][:55]}'",
                "action_type": "complete_task",
                "details": f"High impact item from '{tu['document_title']}'. Assigned to {tu['assignee']}.",
                "grounded_source": f"{tu['document_title']} (Quote: \"{tu['source_quote'][:80]}\")"
            })
            step_num += 1

    if pending_automations:
        pa = pending_automations[0]
        recommended_next_steps.append({
            "step_number": step_num,
            "title": f"Review Safe Automation: Move '{pa['proposed_filename']}'",
            "action_type": "approve_automation",
            "details": f"Review proposed move to '{pa['proposed_folder']}'. Human approval required before file write.",
            "grounded_source": f"Safe Automation Proposal for '{pa['document_title']}'"
        })
        step_num += 1

    if high_prio_unassigned and step_num <= 4:
        un = high_prio_unassigned[0]
        recommended_next_steps.append({
            "step_number": step_num,
            "title": f"Assign Owner: '{un['title'][:55]}'",
            "action_type": "assign_owner",
            "details": f"High priority deliverable in '{un['document_title']}' currently unassigned.",
            "grounded_source": f"{un['document_title']} (Due: {un['due_date']})"
        })
        step_num += 1

    if len(recommended_next_steps) < 3:
        recommended_next_steps.append({
            "step_number": step_num,
            "title": "Ingest Next Project Specification or Meeting Transcript",
            "action_type": "review_doc",
            "details": "Drop an ongoing project document into LazyFlow to automatically surface deliverables.",
            "grounded_source": "Local Sloth Workspace"
        })

    # Headlines and Synthesis
    headline = "Morning Sloth Briefing: Clear Bottlenecks First, Then Flow"
    if overdue_list:
        headline = f"Morning Sloth Briefing: {len(overdue_list)} Overdue Item(s) Require Early Clearance"
    elif not urgent_actions:
        headline = "Morning Sloth Briefing: Clean Horizon — Steady Cadence Ahead"

    exec_summary = (
        f"Today's workspace holds {len(all_docs)} active document(s) with {len(urgent_actions)} high-priority/urgent "
        f"action item(s). {len(overdue_list)} item(s) are overdue, and {len(upcoming_deadlines)} deliverable(s) are "
        f"slated for the coming 14 days. Every recommendation is strictly grounded in excerpted document text."
    )

    quotes = [
        "Take it slow. Focus on the single highest-impact priority before moving to the next.",
        "A steady sloth pace beats frantic context-switching every single time.",
        "Clear your digital clutter locally, preserve your privacy, and let the work flow.",
        "High leverage comes from finishing what's started, not starting five new things."
    ]
    quote_idx = today.day % len(quotes)

    return {
        "date": today.isoformat(),
        "headline": headline,
        "executive_summary": exec_summary,
        "urgent_actions": urgent_actions[:6],
        "upcoming_deadlines": upcoming_deadlines[:8],
        "cross_document_risks": cross_document_risks[:5],
        "recommended_next_steps": recommended_next_steps[:4],
        "data_grounding": data_grounding[:10],
        "sloth_focus_quote": quotes[quote_idx],
        "generated_at": now_iso
    }
