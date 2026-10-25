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

SAMPLE_ALIASES = {
    "roadmap-meeting": "sample-roadmap",
    "roadmap": "sample-roadmap",
    "incident-postmortem": "sample-postmortem",
    "outage-postmortem": "sample-postmortem",
    "postmortem": "sample-postmortem",
    "vendor-contract": "sample-contract",
    "contract-review": "sample-contract",
    "contract": "sample-contract",
    "user-research": "sample-ux-research",
    "ux-research": "sample-ux-research",
}

def list_sample_documents() -> List[Dict[str, Any]]:
    """Returns list of sample document definitions."""
    return SAMPLES

def get_sample_document(sample_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves metadata and raw content of a sample document, supporting aliases and normalized IDs."""
    if not sample_id:
        return None
    normalized_id = SAMPLE_ALIASES.get(sample_id.lower().strip(), sample_id.strip())
    
    # 1. Exact match on normalized_id or original id
    for s in SAMPLES:
        if s["id"] == normalized_id or s["id"] == sample_id:
            filepath = SAMPLE_DIR / s["filename"]
            if filepath.exists():
                content = filepath.read_text(encoding="utf-8")
                return {
                    **s,
                    "content": content,
                    "file_size": filepath.stat().st_size
                }

    # 2. Substring match fallback (e.g. 'roadmap' matching 'sample-roadmap')
    clean_query = sample_id.lower().replace("-", "").replace("_", "")
    for s in SAMPLES:
        clean_target = s["id"].lower().replace("-", "").replace("_", "")
        if clean_query in clean_target or clean_target in clean_query:
            filepath = SAMPLE_DIR / s["filename"]
            if filepath.exists():
                content = filepath.read_text(encoding="utf-8")
                return {
                    **s,
                    "content": content,
                    "file_size": filepath.stat().st_size
                }
    return None

