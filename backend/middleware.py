from fastapi import Header, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from constants import CountryCode, TEST_USERS
from auth import decode_access_token
import time

security = HTTPBearer()

def require_country_header(x_country_code: Optional[str] = Header(None)) -> str:
    """Middleware to require X-Country-Code header"""
    if not x_country_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Country-Code header is required. Valid values: MX, US, CH, JP"
        )
    
    try:
        country = CountryCode(x_country_code.upper())
        return country.value
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid country code: {x_country_code}. Valid values: MX, US, CH, JP"
        )

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    payload = decode_access_token(token)
    
    username = payload.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    user = TEST_USERS.get(username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

def apply_user_behavior(user: dict = Depends(get_current_user)):
    """Apply user-specific behavior delays"""
    behavior = user.get("behavior")
    
    # Performance glitch: 3 second delay
    if behavior == "performance_glitch":
        time.sleep(3.0)
    
    return user
