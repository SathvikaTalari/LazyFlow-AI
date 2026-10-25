import uuid
import json
import pytest
from datetime import datetime, timezone, timedelta
from app.database import get_db
from app.services.sample_service import get_sample_document, list_sample_documents
from app.services.deadline_service import parse_deadline, get_current_date
from app.services.deduplication_service import find_duplicate_clusters, merge_action_items, calculate_similarity
from app.services.automation_service import generate_automation_proposals, apply_approved_automations, reject_automations
from app.services.briefing_service import get_smart_daily_briefing
from app.services.daily_workflow_service import get_unified_daily_workflow
from app.services.insights_service import get_productivity_insights
from app.services.privacy_service import verify_privacy_and_offline
from app.services.ollama_service import fallback_document_analysis

def test_e2e_full_workflow_and_regression():
    today = get_current_date()
    now_iso = datetime.now(timezone.utc).isoformat()
    test_run_id = str(uuid.uuid4())[:8]

    # --- Step 1: Ingestion & Sample Retrieval ---
    samples = list_sample_documents()
    assert len(samples) >= 4
    
    # Test alias and canonical lookup
    roadmap_sample = get_sample_document("sample-roadmap")
    assert roadmap_sample is not None
    assert "content" in roadmap_sample
    assert len(roadmap_sample["content"]) > 100

    alias_sample = get_sample_document("roadmap-meeting")
    assert alias_sample is not None
    assert alias_sample["id"] == "sample-roadmap"

    # --- Step 2: Source-Grounded Document Extraction & Persistence ---
    doc_id = f"test-doc-{test_run_id}"
    analysis = fallback_document_analysis(
        roadmap_sample["content"],
        filename=roadmap_sample["filename"],
        user_title=f"E2E Test Roadmap {test_run_id}"
    )
    assert analysis["title"] is not None
    assert len(analysis["action_items"]) >= 2
    assert analysis["suggested_folder"] == "Projects/Roadmap"

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO documents (
                id, title, original_filename, file_type, file_size, raw_content,
                summary, key_points, tags, suggested_folder, sentiment,
                processing_time_ms, model_used, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            doc_id, analysis["title"], roadmap_sample["filename"],
            roadmap_sample["file_type"], roadmap_sample["file_size"],
            roadmap_sample["content"], analysis["summary"],
            json.dumps(analysis["key_points"]), json.dumps(analysis["tags"]),
            analysis["suggested_folder"], analysis["sentiment"],
            150, "test-runner", now_iso, now_iso
        ))

        # Insert items with explicit quotes
        created_task_ids = []
        for itm in analysis["action_items"]:
            t_id = f"task-{uuid.uuid4()}"
            created_task_ids.append(t_id)
            dl_info = parse_deadline(itm.get("due_date", "Upcoming"))
            cursor.execute("""
                INSERT INTO action_items (
                    id, document_id, title, description, priority, assignee, due_date,
                    completed, created_at, parsed_due_date, is_explicit_date, source_quote, merged_sources
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)
            """, (
                t_id, doc_id, itm["title"], itm.get("description", ""),
                itm.get("priority", "medium"), itm.get("assignee", "Team"),
                itm.get("due_date", "Upcoming"), now_iso,
                dl_info["parsed_iso"], 1 if dl_info["is_explicit"] else 0,
                itm.get("source_quote", ""), json.dumps([])
            ))
        conn.commit()

    # --- Step 3: Deadline Intelligence Verification ---
    # Explicit date
    dl_explicit = parse_deadline("October 24, 2026", reference_date=today)
    assert dl_explicit["is_explicit"] is True
    assert dl_explicit["parsed_iso"] == "2026-10-24"

    # Relative date
    dl_relative = parse_deadline("Tomorrow", reference_date=today)
    assert dl_relative["is_explicit"] is False
    assert dl_relative["days_remaining"] == 1

    # Overdue date
    past_date = (today - timedelta(days=5)).isoformat()
    dl_overdue = parse_deadline(past_date, reference_date=today)
    assert dl_overdue["status"] == "overdue"
    assert dl_overdue["days_remaining"] == -5

    # --- Step 4: Smart Task Deduplication ---
    # Create two duplicate tasks to test clustering and merging
    task_a_id = f"dup-a-{test_run_id}"
    task_b_id = f"dup-b-{test_run_id}"

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO action_items (
                id, document_id, title, description, priority, assignee, due_date,
                completed, created_at, parsed_due_date, is_explicit_date, source_quote, merged_sources
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, NULL, 0, ?, ?)
        """, (
            task_a_id, doc_id, "Configure local Ollama connection pool and JSON schema validation",
            "Set up connection pooling for Ollama local service", "medium", "Marcus Brody",
            "Upcoming", now_iso, "Quote: Marcus Brody configure local Ollama", json.dumps([])
        ))
        cursor.execute("""
            INSERT INTO action_items (
                id, document_id, title, description, priority, assignee, due_date,
                completed, created_at, parsed_due_date, is_explicit_date, source_quote, merged_sources
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, NULL, 0, ?, ?)
        """, (
            task_b_id, doc_id, "Marcus Brody: Configure local Ollama connection pool",
            "Configure connection pooling and validate schema", "high", "Marcus Brody",
            "Upcoming", now_iso, "Quote: Marcus Brody: Configure local Ollama", json.dumps([])
        ))
        conn.commit()

    # Check similarity calculation
    sim_score, sim_reason = calculate_similarity(
        {"title": "Configure local Ollama connection pool", "assignee": "Marcus Brody"},
        {"title": "Marcus Brody: Configure local Ollama connection pool", "assignee": "Marcus Brody"}
    )
    assert sim_score >= 0.70
    assert "Same assignee" in sim_reason or "keywords" in sim_reason or "overlap" in sim_reason

    clusters = find_duplicate_clusters(threshold=0.50)
    assert len(clusters) >= 1
    target_cluster = None
    for cl in clusters:
        ids = [t["id"] for t in cl["tasks"]]
        if task_a_id in ids and task_b_id in ids:
            target_cluster = cl
            break
    assert target_cluster is not None

    # Merge duplicates into primary
    primary_id = target_cluster["suggested_primary_id"]
    dup_id = task_b_id if primary_id == task_a_id else task_a_id

    merged_result = merge_action_items(primary_id, [dup_id])
    assert merged_result["id"] == primary_id
    assert merged_result["priority"] == "high"  # Escalated
    assert len(merged_result["merged_sources"]) >= 2  # Citations preserved

    # Verify duplicate was removed from SQLite
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM action_items WHERE id = ?", (dup_id,))
        assert cursor.fetchone() is None

    # --- Step 5: Smart Daily Briefing & Unified Flow ---
    briefing = get_smart_daily_briefing()
    assert "headline" in briefing
    assert "executive_summary" in briefing
    assert "urgent_actions" in briefing
    assert "upcoming_deadlines" in briefing
    assert "cross_document_risks" in briefing
    assert "recommended_next_steps" in briefing
    assert "sloth_focus_quote" in briefing
    assert len(briefing["recommended_next_steps"]) >= 1

    flow = get_unified_daily_workflow()
    assert flow["metrics"]["total_active"] >= 1
    assert len(flow["daily_sloth_tip"]) > 0

    # --- Step 6: Safe Automation Preview & Approval ---
    proposals = generate_automation_proposals()
    assert len(proposals) >= 1
    doc_proposal = next((p for p in proposals if p["document_id"] == doc_id), None)
    assert doc_proposal is not None
    assert doc_proposal["status"] == "pending"
    assert doc_proposal["proposed_folder"] == "Projects/Roadmap"

    # Test explicit human approval
    apply_res = apply_approved_automations([doc_proposal["id"]])
    assert apply_res["status"] == "success"
    assert apply_res["applied_count"] == 1

    # Verify document updated in SQLite
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT suggested_folder FROM documents WHERE id = ?", (doc_id,))
        updated_doc = cursor.fetchone()
        assert updated_doc["suggested_folder"] == "Projects/Roadmap"

    # --- Step 7: Productivity Insights & Formula Transparency ---
    insights = get_productivity_insights()
    assert insights["total_documents"] >= 1
    assert insights["total_tasks"] >= 1
    assert "effort_saved" in insights
    effort = insights["effort_saved"]
    assert effort["reading_speed_wpm"] == 230
    assert effort["summarization_mins_per_doc"] == 15.0
    assert effort["total_minutes_saved"] > 0
    assert "Nielsen Norman Group" in effort["calculation_notes"]

    # --- Step 8: Privacy & Offline Verification Audit ---
    privacy_report = verify_privacy_and_offline()
    assert privacy_report["ollama_is_local"] is True
    assert privacy_report["database_is_local"] is True
    assert privacy_report["external_telemetry_active"] is False
    assert privacy_report["offline_verified"] is True
    assert "zero-cloud privacy guarantee" in privacy_report["privacy_statement"]

    # --- Clean up test entities ---
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        cursor.execute("DELETE FROM action_items WHERE document_id = ?", (doc_id,))
        cursor.execute("DELETE FROM automation_actions WHERE document_id = ?", (doc_id,))
        conn.commit()
