from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import (
    health,
    documents,
    action_items,
    digest,
    automation,
    workflow,
    queue,
    insights,
    briefing,
    model_comparison,
    privacy,
)
from app.services.ollama_service import get_active_model
from app.services.queue_service import trigger_queue_worker

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize SQLite database and columns, recover interrupted queue items
    init_db()
    trigger_queue_worker()
    active_m = get_active_model()
    print(f"[*] LazyFlow AI Backend initialized with active model: {active_m}")
    yield
    # Shutdown
    print("[*] LazyFlow AI Backend shutting down.")

app = FastAPI(
    title="LazyFlow AI - Local Productivity Agent API",
    description="Privacy-first, on-device AI agent for document summarization, action item extraction, smart deduplication, deadline intelligence, safe automation, daily workflow, background processing, model comparisons, and productivity insights.",
    version="3.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health.router)
app.include_router(documents.router)
app.include_router(action_items.router)
app.include_router(digest.router)
app.include_router(automation.router)
app.include_router(workflow.router)
app.include_router(queue.router)
app.include_router(insights.router)
app.include_router(briefing.router)
app.include_router(model_comparison.router)
app.include_router(privacy.router)

@app.get("/")
def root():
    return {
        "app": "LazyFlow AI",
        "tagline": "Your Local AI Productivity Agent - Slow and Steady",
        "version": "3.0.0",
        "phase": "Phase 3: Autonomous Productivity & Impact",
        "challenge": "Hacktoberfest Open-Source AI Challenge",
        "status": "online",
        "docs_url": "/docs"
    }

