"""User service for database operations related to users and authentication."""
from typing import Optional, List, Dict, Any
from api.database import get_connection
from api.security.password import hash_password, verify_password


class User:
    """User model class."""
    def __init__(self, id: int, username: str, email: str, password_hash: str, is_active: bool, roles: List[str] = None):
        self.id = id
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.is_active = is_active
        self.roles = roles or []
    
    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "is_active": self.is_active,
            "roles": self.roles
        }


class UserService:
    """Service for user-related database operations."""
    
    @staticmethod
    def get_user_by_username(username: str) -> Optional[User]:
        """
        Get user by username with their roles.
        
        Args:
            username: Username to search for
            
        Returns:
            User object if found, None otherwise
        """
        try:
            conn = get_connection()
            cur = conn.cursor()
            
            # Get user info
            cur.execute(
                """
                SELECT id, username, email, password_hash, is_active
                FROM users
                WHERE username = %s AND is_active = TRUE
                """,
                (username,)
            )
            user_data = cur.fetchone()
            
            if not user_data:
                cur.close()
                conn.close()
                return None
            
            user_id, username, email, password_hash, is_active = user_data
            
            # Get user roles
            cur.execute(
                """
                SELECT r.name
                FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = %s
                """,
                (user_id,)
            )
            roles = [row[0] for row in cur.fetchall()]
            
            cur.close()
            conn.close()
            
            return User(user_id, username, email, password_hash, is_active, roles)
        
        except Exception as e:
            print(f"Error getting user by username: {e}")
            return None
    
    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[User]:
        """
        Get user by ID with their roles.
        
        Args:
            user_id: User ID to search for
            
        Returns:
            User object if found, None otherwise
        """
        try:
            conn = get_connection()
            cur = conn.cursor()
            
            # Get user info
            cur.execute(
                """
                SELECT id, username, email, password_hash, is_active
                FROM users
                WHERE id = %s
                """,
                (user_id,)
            )
            user_data = cur.fetchone()
            
            if not user_data:
                cur.close()
                conn.close()
                return None
            
            user_id, username, email, password_hash, is_active = user_data
            
            # Get user roles
            cur.execute(
                """
                SELECT r.name
                FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = %s
                """,
                (user_id,)
            )
            roles = [row[0] for row in cur.fetchall()]
            
            cur.close()
            conn.close()
            
            return User(user_id, username, email, password_hash, is_active, roles)
        
        except Exception as e:
            print(f"Error getting user by ID: {e}")
            return None
    
    @staticmethod
    def create_user(username: str, email: str, password: str) -> Optional[User]:
        """
        Create a new user.
        
        Args:
            username: Username
            email: Email address
            password: Plain text password
            
        Returns:
            Created User object, None if failed
        """
        try:
            conn = get_connection()
            cur = conn.cursor()
            
            password_hash = hash_password(password)
            
            cur.execute(
                """
                INSERT INTO users (username, email, password_hash, is_active)
                VALUES (%s, %s, %s, TRUE)
                RETURNING id, username, email, password_hash, is_active
                """,
                (username, email, password_hash)
            )
            
            user_data = cur.fetchone()
            user_id, username, email, password_hash, is_active = user_data
            
            # Assign default 'user' role
            cur.execute(
                """
                INSERT INTO user_roles (user_id, role_id)
                SELECT %s, id FROM roles WHERE name = 'user'
                """,
                (user_id,)
            )
            
            conn.commit()
            cur.close()
            conn.close()
            
            return User(user_id, username, email, password_hash, is_active, ["user"])
        
        except Exception as e:
            print(f"Error creating user: {e}")
            return None
    
    @staticmethod
    def verify_password(username: str, password: str) -> Optional[User]:
        """
        Verify user credentials.
        
        Args:
            username: Username
            password: Plain text password
            
        Returns:
            User object if credentials are valid, None otherwise
        """
        user = UserService.get_user_by_username(username)
        
        if user and verify_password(password, user.password_hash):
            return user
        
        return None
    
    @staticmethod
    def get_user_permissions(user_id: int) -> List[str]:
        """
        Get all permissions for a user based on their roles.
        
        Args:
            user_id: User ID
            
        Returns:
            List of permission names
        """
        try:
            conn = get_connection()
            cur = conn.cursor()
            
            cur.execute(
                """
                SELECT DISTINCT p.name
                FROM user_roles ur
                JOIN role_permissions rp ON ur.role_id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.id
                WHERE ur.user_id = %s
                """,
                (user_id,)
            )
            
            permissions = [row[0] for row in cur.fetchall()]
            
            cur.close()
            conn.close()
            
            return permissions
        
        except Exception as e:
            print(f"Error getting user permissions: {e}")
            return []
    
    @staticmethod
    def assign_role_to_user(user_id: int, role_name: str) -> bool:
        """
        Assign a role to a user.
        
        Args:
            user_id: User ID
            role_name: Role name to assign
            
        Returns:
            True if successful, False otherwise
        """
        try:
            conn = get_connection()
            cur = conn.cursor()
            
            cur.execute(
                """
                INSERT INTO user_roles (user_id, role_id)
                SELECT %s, id FROM roles WHERE name = %s
                ON CONFLICT DO NOTHING
                """,
                (user_id, role_name)
            )
            
            conn.commit()
            cur.close()
            conn.close()
            
            return True
        
        except Exception as e:
            print(f"Error assigning role: {e}")
            return False
