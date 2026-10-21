import pytest
from app.services.privacy_service import verify_privacy_and_offline

def test_privacy_and_offline_verification():
    report = verify_privacy_and_offline()
    assert "timestamp" in report
    assert report["ollama_is_local"] is True
    assert report["database_is_local"] is True
    assert report["external_telemetry_active"] is False
    assert len(report["checks"]) >= 4

    check_ids = [c["check_id"] for c in report["checks"]]
    assert "ollama_binding" in check_ids
    assert "local_sqlite_storage" in check_ids
    assert "zero_cloud_telemetry" in check_ids

    # Verify pass status on core local isolation checks
    for c in report["checks"]:
        if c["check_id"] in ["ollama_binding", "local_sqlite_storage", "zero_cloud_telemetry"]:
            assert c["status"] == "PASS"

    assert "zero-cloud privacy guarantee" in report["privacy_statement"]
