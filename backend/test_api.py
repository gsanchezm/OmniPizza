import logging
from fastapi import APIRouter, Depends, Header, HTTPException, status
from typing import Optional

from constants import CountryCode
from database import db
from middleware import get_current_user, require_country_header
from models import (
    CartItem,
    CartResponse,
    TestCartSetupRequest,
    TestMarketRequest,
    TestProfileSeedRequest,
    TestSessionStateResponse,
    UserProfileDetails,
)
from response_docs import AUTH_RESPONSES, COUNTRY_HEADER_RESPONSES, MALFORMED_BODY_RESPONSES

logger = logging.getLogger("omnipizza.test_api")

router = APIRouter()


def _session_response(username: str, session_id: str) -> TestSessionStateResponse:
    session = db.get_test_session(session_id)
    return TestSessionStateResponse(
        username=username,
        country_code=session["country_code"],
        cart_items=session["cart_items"],
        updated_at=session["updated_at"],
    )


@router.post(
    "/api/store/market",
    response_model=TestSessionStateResponse,
    tags=["Store"],
    summary="Set the user's active market (atomic test setup)",
    description=(
        "Sets `country_code` on the current login session. The session is "
        "**per-login-session (keyed by the JWT `sid` claim), not per-(user, "
        "market)** — switching markets here does NOT clear or partition the "
        "cart. To replace the cart, call `POST /api/cart` or "
        "`POST /api/session/reset` separately."
    ),
    responses={**AUTH_RESPONSES, **MALFORMED_BODY_RESPONSES},
)
async def set_market(
    request: TestMarketRequest,
    current_user: dict = Depends(get_current_user),
):
    username = current_user["username"]
    session_id = current_user["session_id"]
    db.set_test_market(session_id, request.country_code)
    logger.info("session_api.set_market user=%s country=%s", username, request.country_code.value)
    return _session_response(username, session_id)


@router.post(
    "/api/cart",
    response_model=TestSessionStateResponse,
    tags=["Cart"],
    summary="Seed the user's cart (atomic test setup)",
    description=(
        "Replaces the current login session's cart with the supplied items. "
        "**The cart is per-login-session (keyed by the JWT `sid` claim), not "
        "per-username or per-market** — this endpoint does not read the "
        "`X-Country-Code` header and does not change the session's market. "
        "Two concurrent logins for the same username (e.g. two market "
        "scenarios run in parallel) get isolated carts. Each seeded line gets "
        "a stable `item_id` (server-generated unless you supply your own), "
        "addressable via `PUT`/`DELETE /api/cart/items/{item_id}`. Use "
        "`POST /api/store/market` to set the market, and `GET /api/cart` "
        "(which does require `X-Country-Code`) to read the cart enriched with "
        "market-specific pricing/currency."
    ),
    responses={**AUTH_RESPONSES, **MALFORMED_BODY_RESPONSES},
)
async def seed_cart(
    request: TestCartSetupRequest,
    current_user: dict = Depends(get_current_user),
):
    username = current_user["username"]
    session_id = current_user["session_id"]
    db.set_test_cart(session_id, [item.dict() for item in request.items])
    logger.info("session_api.seed_cart user=%s item_count=%d", username, len(request.items))
    return _session_response(username, session_id)


@router.get(
    "/api/cart",
    response_model=CartResponse,
    tags=["Cart"],
    responses={**AUTH_RESPONSES, **COUNTRY_HEADER_RESPONSES},
)
async def get_cart(
    current_user: dict = Depends(get_current_user),
    country_code: str = Depends(require_country_header),
    x_language: Optional[str] = Header(None),
):
    username = current_user["username"]
    session_id = current_user["session_id"]
    behavior = current_user.get("behavior", "standard")
    if hasattr(behavior, "value"):
        behavior = behavior.value

    cc = CountryCode(country_code)
    session = db.get_test_session(session_id)
    enriched = db.get_enriched_cart(session_id, cc, behavior, x_language)

    return CartResponse(
        username=username,
        country_code=country_code,
        cart_items=enriched,
        updated_at=session["updated_at"],
    )


@router.put(
    "/api/cart/items/{item_id}",
    response_model=TestSessionStateResponse,
    tags=["Cart"],
    summary="Create or replace one cart line (atomic test setup)",
    description=(
        "Upsert semantics: if `item_id` isn't in the caller's session yet, a "
        "new line is created; if it is, that line is fully replaced. Any "
        "`item_id` in the request body is ignored — the URL is authoritative. "
        "Does not read `X-Country-Code`; use `GET /api/cart` for enriched, "
        "priced items."
    ),
    responses={**AUTH_RESPONSES, **MALFORMED_BODY_RESPONSES},
)
async def put_cart_item(
    item_id: str,
    request: CartItem,
    current_user: dict = Depends(get_current_user),
):
    username = current_user["username"]
    session_id = current_user["session_id"]
    db.upsert_cart_item(session_id, item_id, request.dict(exclude={"item_id"}))
    logger.info("session_api.put_cart_item user=%s item_id=%s", username, item_id)
    return _session_response(username, session_id)


@router.delete(
    "/api/cart/items/{item_id}",
    response_model=TestSessionStateResponse,
    tags=["Cart"],
    summary="Remove one cart line (atomic test setup)",
    responses={**AUTH_RESPONSES, 404: {"description": "item_id not found in the caller's session"}},
)
async def delete_cart_item(
    item_id: str,
    current_user: dict = Depends(get_current_user),
):
    username = current_user["username"]
    session_id = current_user["session_id"]
    removed = db.remove_cart_item(session_id, item_id)
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cart item {item_id} not found",
        )
    logger.info("session_api.delete_cart_item user=%s item_id=%s", username, item_id)
    return _session_response(username, session_id)


@router.post(
    "/api/profile",
    response_model=UserProfileDetails,
    tags=["Profile"],
    summary="Seed the user's editable profile (atomic test setup)",
    description=(
        "Replaces the editable profile for the caller's current session with a "
        "deterministic baseline (default values overlaid with the supplied "
        "fields) — seed here to pin a reproducible value before a "
        "visual-regression snapshot. Market-independent: this endpoint does "
        "not read `X-Country-Code`. Use `POST /api/session/reset` to clear the "
        "profile back to the empty default."
    ),
    responses={**AUTH_RESPONSES, **MALFORMED_BODY_RESPONSES},
)
async def seed_profile(
    request: TestProfileSeedRequest,
    current_user: dict = Depends(get_current_user),
):
    username = current_user["username"]
    profile = db.seed_user_profile(current_user["session_id"], username, request.dict(exclude_unset=True))
    logger.info("session_api.seed_profile user=%s", username)
    return UserProfileDetails(**profile)


@router.post(
    "/api/session/reset",
    response_model=TestSessionStateResponse,
    tags=["Session"],
    summary="Reset the caller's session AND profile to a clean slate",
    description=(
        "Clears the caller's own session (market + cart) and resets the editable "
        "profile to the deterministic empty default. Session and profile are both "
        "keyed by the caller's login (sid), not by username, so this has no effect "
        "on other concurrent logins for the same username. Use to undo any leaked "
        "state before a test."
    ),
    responses={**AUTH_RESPONSES},
)
async def reset_state(
    current_user: dict = Depends(get_current_user),
):
    username = current_user["username"]
    session_id = current_user["session_id"]
    db.reset_test_session(session_id)
    db.reset_user_profile(session_id, username)
    logger.info("session_api.reset_state user=%s", username)
    return _session_response(username, session_id)


@router.get(
    "/api/session",
    response_model=TestSessionStateResponse,
    tags=["Session"],
    responses={**AUTH_RESPONSES},
)
async def get_state(
    current_user: dict = Depends(get_current_user),
):
    username = current_user["username"]
    session_id = current_user["session_id"]
    return _session_response(username, session_id)
