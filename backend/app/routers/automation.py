from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.models import AutomationProposal, ApplyAutomationRequest
from app.services.automation_service import (
    generate_automation_proposals,
    apply_approved_automations,
    reject_automations
)

router = APIRouter(prefix="/api/automation", tags=["Safe Automation"])

@router.get("/proposals", response_model=List[AutomationProposal])
def get_proposals():
    """
    Phase 2 Safe Automation Preview:
    Returns proposed file path organization and standardized rename proposals.
    Never alters disk or database without explicit user approval.
    """
    return generate_automation_proposals()

@router.post("/apply")
def apply_proposals(payload: ApplyAutomationRequest):
    """
    Applies ONLY explicitly user-approved automation actions.
    """
    if not payload.action_ids:
        raise HTTPException(status_code=400, detail="No action IDs provided for approval.")
    
    result = apply_approved_automations(payload.action_ids)
    return result

@router.post("/reject")
def reject_proposals(payload: ApplyAutomationRequest):
    """
    Dismisses/rejects proposed automation actions.
    """
    if not payload.action_ids:
        raise HTTPException(status_code=400, detail="No action IDs provided.")
    
    result = reject_automations(payload.action_ids)
    return result
