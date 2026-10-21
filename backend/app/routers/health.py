from fastapi import APIRouter, HTTPException
from app.models import HealthStatus, ModelSwitchRequest
from app.database import get_db
from app.services.deadline_service import parse_deadline, get_current_date
from app.services.ollama_service import (
    check_ollama_health,
    get_installed_models,
    get_active_model,
    set_active_model
)

router = APIRouter(prefix="/api", tags=["Health & System"])

@router.get("/health", response_model=HealthStatus)
def get_health():
    """Returns application health, Ollama connection status, active model, and database counts."""
    ollama_info = check_ollama_health()
    
    docs_count = 0
    tasks_count = 0
    completed_tasks_count = 0
    overdue_tasks_count = 0
    db_ok = False
    today = get_current_date()

    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) as cnt FROM documents")
            docs_count = cursor.fetchone()["cnt"]

            cursor.execute("SELECT COUNT(*) as cnt FROM action_items")
            tasks_count = cursor.fetchone()["cnt"]

            cursor.execute("SELECT COUNT(*) as cnt FROM action_items WHERE completed = 1")
            completed_tasks_count = cursor.fetchone()["cnt"]

            cursor.execute("SELECT due_date FROM action_items WHERE completed = 0")
            for r in cursor.fetchall():
                dl = parse_deadline(r["due_date"], reference_date=today)
                if dl["status"] == "overdue":
                    overdue_tasks_count += 1

            db_ok = True
    except Exception:
        db_ok = False

    return HealthStatus(
        status="healthy" if db_ok else "degraded",
        ollama_connected=ollama_info["connected"],
        ollama_url=ollama_info["url"],
        current_model=ollama_info["active_model"],
        available_models=ollama_info["models"],
        database_ok=db_ok,
        documents_count=docs_count,
        tasks_count=tasks_count,
        completed_tasks_count=completed_tasks_count,
        overdue_tasks_count=overdue_tasks_count
    )

@router.get("/models")
def list_models():
    """Lists all installed Ollama models and the currently active model."""
    models = get_installed_models()
    active = get_active_model()
    return {
        "active_model": active,
        "models": models,
        "count": len(models)
    }

@router.post("/settings/model")
def switch_model(payload: ModelSwitchRequest):
    """Switches the active Ollama model."""
    installed = get_installed_models()
    if installed and payload.model_name not in installed:
        raise HTTPException(
            status_code=400,
            detail=f"Model '{payload.model_name}' is not currently installed in Ollama. Available: {installed}"
        )
    active = set_active_model(payload.model_name)
    return {"status": "success", "active_model": active}
