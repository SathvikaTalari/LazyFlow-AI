from fastapi import APIRouter
from app.models import DailyWorkflowResponse
from app.services.daily_workflow_service import get_unified_daily_workflow

router = APIRouter(prefix="/api/workflow", tags=["Daily Workflow"])

@router.get("/daily", response_model=DailyWorkflowResponse)
def get_daily_workflow():
    """
    Phase 2 One-Click Daily Workflow:
    Provides a synthesized daily workspace view of today's priorities, overdue tasks,
    upcoming deadlines, and cross-document risks.
    """
    return get_unified_daily_workflow()
