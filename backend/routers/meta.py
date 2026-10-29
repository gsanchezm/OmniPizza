"""Build/version provenance endpoint.

Added 2026-09-02 for the Atomic-Helix-Model research hardening plan
(decision (f)): every scientific campaign run must be able to RECORD which
backend build it exercised. Render injects RENDER_GIT_COMMIT at build and
runtime for services deployed from git, and pydantic BaseSettings picks it up
automatically via the field name below.

Deliberately dependency-free (no auth, no X-Country-Code) so the test
harness can probe it unauthenticated before a run starts — same contract
shape as GET /api/countries, per CLAUDE.md's stable-automation-contract rule.
"""
from datetime import datetime

from fastapi import APIRouter

from config import settings

router = APIRouter()

# Captured once at process start: identifies THIS running deployment, not the
# moment a client happens to ask.
_STARTED_AT = datetime.utcnow().isoformat()


@router.get("/api/version", tags=["Meta"])
async def get_version():
    """Build/version provenance for the running backend deployment."""
    return {
        "app_name": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "git_commit": settings.render_git_commit or None,
        "started_at": _STARTED_AT,
    }
