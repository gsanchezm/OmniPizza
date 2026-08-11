"""Shared OpenAPI `responses=` fragments, so FastAPI's generated schema
documents every status code a dependency or handler can actually return.
Without these, Schemathesis's contract test (tests/test_contract.py)
flags any code the schema doesn't list as undocumented, even though the
app returns it by design — e.g. every authenticated endpoint returning
401 for a missing or invalid token."""

AUTH_RESPONSES = {401: {"description": "Missing or invalid Authorization bearer token"}}
COUNTRY_HEADER_RESPONSES = {400: {"description": "Missing or invalid X-Country-Code header"}}

# FastAPI itself (routing.py's `solve_dependencies`) returns this 400 for any
# request body it cannot parse at all (as opposed to a body that parses but
# fails Pydantic validation, which is 422) - reachable on every endpoint that
# declares a request body. Confirmed live via tests/test_contract.py Step 10:
# schemathesis's byte-fuzzing tripped it on /api/auth/login, /api/cart,
# /api/profile, and /api/users/me/profile.
MALFORMED_BODY_RESPONSES = {400: {"description": "Request body could not be parsed"}}
