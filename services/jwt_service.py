"""JWT token management utilities."""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION = int(os.getenv("JWT_EXPIRATION", 3600))  # 1 hour in seconds


class JWTService:
    """Service for JWT token creation and verification."""
    
    @staticmethod
    def create_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """
        Create a JWT token.
        
        Args:
            data: Dictionary with claims to encode
            expires_delta: Custom expiration time delta
            
        Returns:
            JWT token string
        """
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(seconds=JWT_EXPIRATION)
        
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(
            to_encode,
            JWT_SECRET_KEY,
            algorithm=JWT_ALGORITHM
        )
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Optional[Dict[str, Any]]:
        """
        Verify and decode a JWT token.
        
        Args:
            token: JWT token string
            
        Returns:
            Decoded token data if valid, None otherwise
        """
        try:
            payload = jwt.decode(
                token,
                JWT_SECRET_KEY,
                algorithms=[JWT_ALGORITHM]
            )
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    @staticmethod
    def create_access_token(subject: str, user_id: int, roles: list, expires_delta: Optional[timedelta] = None) -> str:
        """
        Create an access token with user information.
        
        Args:
            subject: User identifier (usually username)
            user_id: User ID
            roles: List of user roles
            expires_delta: Custom expiration time
            
        Returns:
            JWT access token
        """
        data = {
            "sub": subject,
            "user_id": user_id,
            "roles": roles,
            "type": "access"
        }
        return JWTService.create_token(data, expires_delta)
    
    @staticmethod
    def create_refresh_token(subject: str, user_id: int) -> str:
        """
        Create a refresh token with extended expiration.
        
        Args:
            subject: User identifier
            user_id: User ID
            
        Returns:
            JWT refresh token
        """
        expires_delta = timedelta(days=7)  # Refresh token expires in 7 days
        data = {
            "sub": subject,
            "user_id": user_id,
            "type": "refresh"
        }
        return JWTService.create_token(data, expires_delta)
