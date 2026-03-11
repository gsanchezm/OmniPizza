import logging
from fastapi import APIRouter, Depends, Header
from typing import Optional

from constants import CountryCode
from database import db
from middleware import get_current_user, require_country_header
from models import (
    CartResponse,
    TestCartSetupRequest,
    TestMarketRequest,
    TestSessionStateResponse,
)

logger = logging.getLogger("omnipizza.test_api")

router = APIRouter()


def _session_response(username: str) -> TestSessionStateResponse:
    session = db.get_test_session(username)
    return TestSessionStateResponse(
        username=username,
        country_code=session["country_code"],
        cart_items=session["cart_items"],
        updated_at=session["updated_at"],
    )


@router.post("/api/store/market", response_model=TestSessionStateResponse, tags=["Store"])
async def set_market(
    request: TestMarketRequest,
    current_user: dict = Depends(get_current_user),
):
    username = current_user["username"]
    db.set_test_market(username, request.country_code)
    logger.info("session_api.set_market user=%s country=%s", username, request.country_code.value)
    return _session_response(username)


@router.post("/api/cart", response_model=TestSessionStateResponse, tags=["Cart"])
async def seed_cart(
    request: TestCartSetupRequest,
    current_user: dict = Depends(get_current_user),
):
    username = current_user["username"]
    db.set_test_cart(username, [item.dict() for item in request.items])
    logger.info("session_api.seed_cart user=%s item_count=%d", username, len(request.items))
    return _session_response(username)


@router.get("/api/cart", response_model=CartResponse, tags=["Cart"])
async def get_cart(
    current_user: dict = Depends(get_current_user),
    country_code: str = Depends(require_country_header),
    x_language: Optional[str] = Header(None),
):
    username = current_user["username"]
    behavior = current_user.get("behavior", "standard")
    if hasattr(behavior, "value"):
        behavior = behavior.value

    cc = CountryCode(country_code)
    session = db.get_test_session(username)
    enriched = db.get_enriched_cart(username, cc, behavior, x_language)

    return CartResponse(
        username=username,
        country_code=country_code,
        cart_items=enriched,
        updated_at=session["updated_at"],
    )


@router.post("/api/session/reset", response_model=TestSessionStateResponse, tags=["Session"])
async def reset_state(
    current_user: dict = Depends(get_current_user),
):
    username = current_user["username"]
    db.reset_test_session(username)
    logger.info("session_api.reset_state user=%s", username)
    return _session_response(username)


@router.get("/api/session", response_model=TestSessionStateResponse, tags=["Session"])
async def get_state(
    current_user: dict = Depends(get_current_user),
):
    username = current_user["username"]
    return _session_response(username)
