import pytest
from app.services.ollama_service import clean_json_response, fallback_document_analysis

def test_clean_json_response_with_fences():
    raw_markdown = """```json
{
  "title": "Cleaned Title",
  "summary": "Cleaned Summary",
  "key_points": ["Point A", "Point B"],
  "tags": ["DevOps"]
}
```"""
    parsed = clean_json_response(raw_markdown)
    assert parsed.get("title") == "Cleaned Title"
    assert parsed.get("summary") == "Cleaned Summary"
    assert "Point A" in parsed.get("key_points", [])

def test_clean_json_response_with_preamble():
    raw_with_preamble = """Here is the JSON you requested:
{
  "title": "Embedded Object",
  "summary": "Working properly"
}
Hope this helps!"""
    parsed = clean_json_response(raw_with_preamble)
    assert parsed.get("title") == "Embedded Object"
    assert parsed.get("summary") == "Working properly"

def test_fallback_document_analysis():
    sample_text = """# Incident Postmortem: Cache Cluster Failure
- [ ] Elena: Restart Redis sentinel by October 23, 2026. (Priority: High)
- [ ] David: Monitor throughput latency by October 25, 2026. (Priority: Medium)
Key takeaways:
- Memory exhaustion caused failure.
"""
    result = fallback_document_analysis(sample_text, "incident.md")
    assert "Incident Postmortem" in result["title"]
    assert len(result["action_items"]) >= 2
    assert result["suggested_folder"] == "Operations/Incidents"
    assert result["sentiment"] == "Critical"
    
    first_item = result["action_items"][0]
    assert "Elena" in first_item["title"]
    assert first_item["priority"] == "high"
    assert first_item["source_quote"] != ""
