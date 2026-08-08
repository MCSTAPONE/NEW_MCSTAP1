"""JWT authentication dependencies for FastAPI."""
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from services.jwt_service import JWTService
from services.user_service import UserService, User

security = HTTPBearer()


async def get_current_user(credentials = Depends(security)) -> User:
    """
    FastAPI dependency to get the current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Bearer credentials containing the JWT token
        
    Returns:
        User object if token is valid
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    
    payload = JWTService.verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    username: str = payload.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = UserService.get_user_by_username(username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_optional_user(credentials = Depends(security)) -> Optional[User]:
    """
    FastAPI dependency to get an optional authenticated user.
    Returns None if no credentials provided.
    
    Args:
        credentials: Optional HTTP Bearer credentials
        
    Returns:
        User object if valid credentials provided, None otherwise
    """
    if credentials is None:
        return None
    
    token = credentials.credentials
    payload = JWTService.verify_token(token)
    
    if payload is None:
        return None
    
    username: str = payload.get("sub")
    if username is None:
        return None
    
    return UserService.get_user_by_username(username)


def require_role(*allowed_roles: str):
    """
    Dependency factory to require specific roles.
    
    Args:
        allowed_roles: Role names that are allowed
        
    Returns:
        Dependency function
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if not any(role in current_user.roles for role in allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    
    return role_checker


def require_permission(*allowed_permissions: str):
    """
    Dependency factory to require specific permissions.
    
    Args:
        allowed_permissions: Permission names that are allowed
        
    Returns:
        Dependency function
    """
    async def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        user_permissions = UserService.get_user_permissions(current_user.id)
        
        if not any(perm in user_permissions for perm in allowed_permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required permissions: {', '.join(allowed_permissions)}"
            )
        return current_user
    
    return permission_checker
