"""Authentication service combining JWT and user operations."""
from typing import Tuple, Optional
from services.jwt_service import JWTService
from services.user_service import UserService, User


class AuthService:
    """Service handling authentication operations."""
    
    @staticmethod
    def login(username: str, password: str) -> Optional[Tuple[str, str, User]]:
        """
        Authenticate user and generate tokens.
        
        Args:
            username: Username
            password: Plain text password
            
        Returns:
            Tuple of (access_token, refresh_token, user) if authentication successful,
            None otherwise
        """
        user = UserService.verify_password(username, password)
        
        if user is None:
            return None
        
        access_token = JWTService.create_access_token(
            subject=user.username,
            user_id=user.id,
            roles=user.roles
        )
        
        refresh_token = JWTService.create_refresh_token(
            subject=user.username,
            user_id=user.id
        )
        
        return access_token, refresh_token, user
    
    @staticmethod
    def refresh_access_token(refresh_token: str) -> Optional[str]:
        """
        Generate a new access token using a refresh token.
        
        Args:
            refresh_token: Refresh token
            
        Returns:
            New access token if refresh token is valid, None otherwise
        """
        payload = JWTService.verify_token(refresh_token)
        
        if payload is None or payload.get("type") != "refresh":
            return None
        
        username = payload.get("sub")
        user_id = payload.get("user_id")
        
        user = UserService.get_user_by_id(user_id)
        if user is None:
            return None
        
        access_token = JWTService.create_access_token(
            subject=username,
            user_id=user_id,
            roles=user.roles
        )
        
        return access_token
    
    @staticmethod
    def register_user(username: str, email: str, password: str) -> Optional[User]:
        """
        Register a new user.
        
        Args:
            username: Username
            email: Email address
            password: Plain text password
            
        Returns:
            Created User object if successful, None otherwise
        """
        user = UserService.create_user(username, email, password)
        return user
