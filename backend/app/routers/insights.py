from fastapi import APIRouter
from app.models import ProductivityInsightsResponse
from app.services.insights_service import get_productivity_insights

router = APIRouter(prefix="/api/insights", tags=["Productivity Insights"])

@router.get("", response_model=ProductivityInsightsResponse)
def get_insights():
    """
    Returns AI productivity metrics, pending vs completed tasks, overdue items,
    processing success rate, and grounded manual effort saved calculations.
    """
    return get_productivity_insights()
