from fastapi import APIRouter
from app.models import PrivacyVerificationResponse
from app.services.privacy_service import verify_privacy_and_offline

router = APIRouter(prefix="/api/privacy", tags=["Privacy & Offline Verification"])

@router.get("/status", response_model=PrivacyVerificationResponse)
def get_privacy_status():
    """Returns local privacy configuration, loopback bindings, and local storage verification."""
    return verify_privacy_and_offline()

@router.post("/verify-offline", response_model=PrivacyVerificationResponse)
def run_offline_verification():
    """
    Rigorously verifies that all AI inference, document storage, and task management
    operate entirely offline over loopback without external network dependencies.
    """
    return verify_privacy_and_offline()
