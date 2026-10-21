from typing import List
from fastapi import APIRouter, HTTPException, Query
from app.models import (
    ModelComparisonRequest,
    ModelComparisonResponse
)
from app.services.model_comparison_service import (
    run_model_comparison,
    list_model_comparisons
)
from app.services.ollama_service import get_installed_models

router = APIRouter(prefix="/api/models", tags=["Model Comparison"])

@router.post("/compare", response_model=ModelComparisonResponse)
def compare_models_endpoint(payload: ModelComparisonRequest):
    """
    Runs the same document through two installed Ollama models and compares
    latency, output completeness, and schema validity side-by-side.
    """
    installed = get_installed_models()
    if installed:
        if payload.model_a not in installed:
            raise HTTPException(
                status_code=400,
                detail=f"Model A '{payload.model_a}' is not installed in Ollama. Available: {installed}"
            )
        if payload.model_b not in installed:
            raise HTTPException(
                status_code=400,
                detail=f"Model B '{payload.model_b}' is not installed in Ollama. Available: {installed}"
            )

    return run_model_comparison(
        model_a=payload.model_a,
        model_b=payload.model_b,
        content=payload.content,
        title=payload.title,
        sample_id=payload.sample_id
    )

@router.get("/comparisons")
def get_comparison_history(limit: int = Query(20, ge=1, le=100)):
    """Returns saved on-device model comparison runs."""
    return list_model_comparisons(limit=limit)
