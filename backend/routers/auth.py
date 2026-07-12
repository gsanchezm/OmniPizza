from fastapi import APIRouter, Depends, status, HTTPException
from typing import List

from models import (
    LoginRequest, LoginResponse, UserProfile,
    UserProfileDetails, UserProfileUpdate,
)
from constants import TEST_USERS
from auth import authenticate_user, create_access_token
from middleware import get_current_user
from database import db

router = APIRouter()

# ==================== AUTH ENDPOINTS ====================

@router.post("/api/auth/login", response_model=LoginResponse, tags=["Authentication"])
async def login(request: LoginRequest):
    """
    Authenticate user with predefined test credentials
    
    Test users:
    - standard_user / pizza123 (normal flow)
    - locked_out_user / pizza123 (locked out error)
    - problem_user / pizza123 (broken UI)
    - performance_glitch_user / pizza123 (3s delay)
    - error_user / pizza123 (random 500 errors)
    """
    user = authenticate_user(request.username, request.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Login is the session boundary. Reset the editable profile to its clean
    # baseline on every login so a save made in a previous session (e.g. Japanese
    # text under the JP market) cannot leak into this one. Within a single
    # login-session, saves still persist via PATCH /api/users/me/profile.
    db.reset_user_profile(user["username"])

    # Create access token
    access_token = create_access_token(
        data={"sub": user["username"], "behavior": user["behavior"]}
    )
    
    return LoginResponse(
        access_token=access_token,
        username=user["username"],
        behavior=user["behavior"]
    )

@router.get("/api/auth/users", response_model=List[UserProfile], tags=["Authentication"])
async def get_test_users():
    """Get list of available test users for QA purposes"""
    return [
        UserProfile(
            username=user["username"],
            behavior=user["behavior"],
            description=user["description"]
        )
        for user in TEST_USERS.values()
    ]

@router.get("/api/auth/profile", response_model=UserProfile, tags=["Authentication"])
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return UserProfile(
        username=current_user["username"],
        behavior=current_user["behavior"],
        description=current_user["description"]
    )


@router.get(
    "/api/users/me/profile",
    response_model=UserProfileDetails,
    tags=["User Profile"],
    summary="Get the editable profile for the authenticated user",
)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    profile = db.get_user_profile(current_user["username"])
    return UserProfileDetails(**profile)


@router.patch(
    "/api/users/me/profile",
    response_model=UserProfileDetails,
    tags=["User Profile"],
    summary="Update the editable profile for the authenticated user",
)
async def patch_user_profile(
    patch: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    updated = db.update_user_profile(
        current_user["username"],
        patch.dict(exclude_unset=True),
    )
    return UserProfileDetails(**updated)
