# EXPLANATION — `PATCH /api/users/me/profile` does persist; report's central claim is empirically false

**Original report:** `BUG_profile_api_patch_does_not_persist.md`
**Verdict:** Not a defect. Live PATCH→GET round-trip on Render returns the just-PATCH'd values immediately.

## What the report claims

> When the test PATCHes `/api/users/me/profile` for `standard_user` with new
> values and immediately re-fetches `GET /api/users/me/profile`, the response
> **does not contain the just-PATCH'd values**. Instead, it returns whatever
> the row contained *before* the run started.

Cited as 100% reproducible across 5 sequential scenarios.

## Empirical verification (live production)

Run on `2026-05-24` against `https://omnipizza-backend.onrender.com`, single
`standard_user` JWT, three back-to-back requests:

```
GET   /api/users/me/profile  → { full_name: "佐藤 明美",   address: "Av. Carranza 123", phone: "+81 3 9876 5432", notes: "ドアに置いてください" }
PATCH /api/users/me/profile  with body { full_name: "Claude Test", phone: "+1 555 0001", address: "123 Test St", notes: "leave at door" }
                             → 200, body echoes the new values
GET   /api/users/me/profile  → { full_name: "Claude Test", phone: "+1 555 0001", address: "123 Test St", notes: "leave at door" }
```

The PATCH persisted and the immediately-following GET returned the new
values. The report's central claim is false against live production.

(After this verification the `standard_user` profile was PATCH'd back to
empty strings to leave a clean baseline for subsequent QA runs.)

## The handler is correct

`backend/main.py:124-149`:

```python
@app.get("/api/users/me/profile", ...)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    profile = db.get_user_profile(current_user["username"])
    return UserProfileDetails(**profile)

@app.patch("/api/users/me/profile", ...)
async def patch_user_profile(patch: UserProfileUpdate, current_user: dict = Depends(get_current_user)):
    updated = db.update_user_profile(current_user["username"], patch.dict(exclude_unset=True))
    return UserProfileDetails(**updated)
```

Both routes key off the same `current_user["username"]` — no identifier
mismatch. `backend/database.py:61-67`:

```python
def update_user_profile(self, username: str, patch: Dict[str, Any]) -> Dict[str, Any]:
    profile = self._ensure_user_profile(username)
    for key, value in patch.items():
        if value is None:
            continue
        profile[key] = value
    return profile
```

`_ensure_user_profile` returns the *same dict object* that `get_user_profile`
reads. `update_user_profile` mutates that dict in place. There is no copy,
no cache layer, no replica — a subsequent GET reads exactly what PATCH wrote.

The Render service is launched via `render.yaml`:

```yaml
startCommand: "cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT"
```

`uvicorn` with no `--workers` flag runs a single worker, so the
"different-worker" hypothesis (multiple in-memory DB instances) does not
apply either.

## Why the bug report contradicts itself

The "Evidence" section quotes leftover values that prove PATCH *does*
persist across requests:

- `got "佐藤 明美"` (a Japanese name PATCH'd by a prior, unrelated run that
  retained in the in-memory DB across the test gap).
- `got "Av. Carranza 123"` (the MX scenario's address PATCH, read by the
  later JP scenario's GET — i.e. one scenario's PATCH was visible to the
  next scenario's GET).

If PATCH truly did not persist, none of those leftover values would exist.
The bug report's own evidence is the proof PATCH works.

## Most likely root cause on the QA side

`got ""` values in the report's evidence (e.g. the linked
`BUG_profile_form_empty_after_reload.md`) look like the test framework is
comparing against a snapshot or variable that was sampled *before* the PATCH
in the same scenario, not against the actual response. A test-framework
inspection of these axes will probably surface it:

- Order of operations in the scenario's step definitions — is the assertion
  buffer captured from a pre-PATCH GET?
- Variable scoping across markets — `expected` for market N being compared
  to `actual` for market N−1.
- Whether the test re-decodes the PATCH response body (which already echoes
  the persisted state) instead of re-issuing GET.

## Note on shared `standard_user` profile fixture

The report's "Suggested fix #4" is correct in spirit: the `standard_user`
row is a shared mutable fixture, and any test that PATCHes it leaves data
behind until the Render dyno restarts (free-tier dynos sleep, but while
warm they retain in-memory state across runs).

This is by design — see `CLAUDE.md` "Restart = clean slate. Do not introduce
persistence without a deliberate reason; the reset behavior is what makes
this safe for chaos tests." But the cross-run leftover is real and is what's
confusing the test framework about what the "baseline" should be.

If the QA team wants a per-run reset, two non-invasive options:

1. Have each scenario PATCH a known-empty baseline as its first step.
2. Optionally add a `POST /api/users/me/profile/reset` endpoint analogous
   to `POST /api/session/reset` (which already exists for cart/market state).
   This is an *enhancement*, not a fix — file separately if desired.

Not implemented here because the user requested fixes only for bugs that
are bugs; this report's premise is false, so no code change is appropriate.
