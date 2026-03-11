import logging
from fastapi import APIRouter, Depends

from database import db
from middleware import get_current_user
from models import (
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
