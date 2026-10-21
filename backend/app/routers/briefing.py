from typing import Optional
from fastapi import APIRouter, Query
from app.models import SmartBriefingResponse
from app.services.briefing_service import get_smart_daily_briefing

router = APIRouter(prefix="/api/briefing", tags=["Smart Daily Briefing"])

@router.get("/today", response_model=SmartBriefingResponse)
def get_today_briefing(model: Optional[str] = Query(None)):
    """
    Generates a prioritized morning briefing from persisted documents and tasks,
    including urgent actions, upcoming deadlines, cross-document risks, and recommended next steps.
    All claims are strictly grounded in source data.
    """
    return get_smart_daily_briefing(model_name=model)

@router.post("/generate", response_model=SmartBriefingResponse)
def generate_briefing(model: Optional[str] = Query(None)):
    """Forces generation of a fresh Smart Daily Briefing."""
    return get_smart_daily_briefing(model_name=model)
