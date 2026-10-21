import pytest
from app.services.daily_workflow_service import get_unified_daily_workflow

def test_unified_daily_workflow():
    workflow = get_unified_daily_workflow()
    
    assert "date" in workflow
    assert "today_priorities" in workflow
    assert "overdue_tasks" in workflow
    assert "upcoming_deadlines" in workflow
    assert "cross_document_risks" in workflow
    assert "metrics" in workflow
    assert "daily_sloth_tip" in workflow
    assert isinstance(workflow["daily_sloth_tip"], str)
    assert len(workflow["daily_sloth_tip"]) > 10

    metrics = workflow["metrics"]
    assert "total_active" in metrics
    assert "overdue_count" in metrics
    assert "today_count" in metrics
    assert "upcoming_count" in metrics
