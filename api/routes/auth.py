"""Authentication routes for login, token refresh, and verification."""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional
from services.auth_service import AuthService
from api.dependencies.jwt_auth import get_current_user
from services.user_service import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    """Login request model."""
    username: str
    password: str


class LoginResponse(BaseModel):
    """Login response model."""
    access_token: str
    refresh_token: str
    user: dict


class TokenRefreshRequest(BaseModel):
    """Token refresh request model."""
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    """Token refresh response model."""
    access_token: str


class RegisterRequest(BaseModel):
    """User registration request model."""
    username: str
    email: str
    password: str


class RegisterResponse(BaseModel):
    """User registration response model."""
    id: int
    username: str
    email: str
    roles: list


class VerifyResponse(BaseModel):
    """Token verification response model."""
    valid: bool
    user: Optional[dict] = None


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login(request: LoginRequest):
    """
    Authenticate user and return JWT tokens.
    
    Args:
        request: Login credentials (username and password)
        
    Returns:
        Access token, refresh token, and user information
        
    Raises:
        HTTPException: If credentials are invalid
    """
    result = AuthService.login(request.username, request.password)
    
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    access_token, refresh_token, user = result
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user.to_dict()
    )


@router.post("/refresh", response_model=TokenRefreshResponse, status_code=status.HTTP_200_OK)
async def refresh_token(request: TokenRefreshRequest):
    """
    Generate a new access token using a refresh token.
    
    Args:
        request: Refresh token
        
    Returns:
        New access token
        
    Raises:
        HTTPException: If refresh token is invalid
    """
    access_token = AuthService.refresh_access_token(request.refresh_token)
    
    if access_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    return TokenRefreshResponse(access_token=access_token)


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
    """
    Register a new user.
    
    Args:
        request: User registration data
        
    Returns:
        Newly created user information
        
    Raises:
        HTTPException: If registration fails
    """
    user = AuthService.register_user(request.username, request.email, request.password)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create user. Username or email may already exist."
        )
    
    return RegisterResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        roles=user.roles
    )


@router.get("/verify", response_model=VerifyResponse)
async def verify_token(current_user: User = Depends(get_current_user)):
    """
    Verify the current JWT token and return user information.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Verification result with user information
    """
    return VerifyResponse(
        valid=True,
        user=current_user.to_dict()
    )


@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User information with roles and permissions
    """
    from services.user_service import UserService
    permissions = UserService.get_user_permissions(current_user.id)
    
    return {
        **current_user.to_dict(),
        "permissions": permissions
    }


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout endpoint (mainly for client to clear local token).
    
    In JWT-based systems, the server doesn't maintain logout state.
    The client should delete the token from storage.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Success message
    """
    return {
        "message": "Logged out successfully. Please delete the token from your client.",
        "user": current_user.username
    }
