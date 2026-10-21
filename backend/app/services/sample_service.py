import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.config import SAMPLE_DIR

SAMPLES = [
    {
        "id": "sample-roadmap",
        "title": "Q4 2026 Product Roadmap & AI Agent Strategy Meeting",
        "filename": "q4_product_roadmap_meeting.md",
        "file_type": ".md",
        "category": "Strategy & Roadmap",
        "description": "Executive meeting notes discussing on-device AI agent architecture, sprint deadlines, and assignments."
    },
    {
        "id": "sample-postmortem",
        "title": "Incident Postmortem: Database Connection Pool Exhaustion",
        "filename": "incident_postmortem_service_outage.md",
        "file_type": ".md",
        "category": "Engineering & DevOps",
        "description": "Critical infrastructure P1 outage report with timeline, root cause analysis, and preventative action items."
    },
    {
        "id": "sample-contract",
        "title": "Master Services Agreement & Enterprise SLA Review",
        "filename": "vendor_contract_review.txt",
        "file_type": ".txt",
        "category": "Legal & Finance",
        "description": "Cloud infrastructure MSA contract covering SLA commitments, financial terms, and legal compliance mandates."
    },
    {
        "id": "sample-ux-research",
        "title": "Qualitative User Research Synthesis: Knowledge Worker Productivity",
        "filename": "user_research_interviews.md",
        "file_type": ".md",
        "category": "Product & UX Research",
        "description": "Customer interview takeaways on context-switching pain points, local privacy needs, and feature requests."
    }
]

def list_sample_documents() -> List[Dict[str, Any]]:
    """Returns list of sample document definitions."""
    return SAMPLES

def get_sample_document(sample_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves metadata and raw content of a sample document."""
    for s in SAMPLES:
        if s["id"] == sample_id:
            filepath = SAMPLE_DIR / s["filename"]
            if filepath.exists():
                content = filepath.read_text(encoding="utf-8")
                return {
                    **s,
                    "content": content,
                    "file_size": filepath.stat().st_size
                }
    return None
