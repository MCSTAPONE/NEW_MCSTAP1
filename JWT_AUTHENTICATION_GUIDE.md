# JWT Authentication & Role-Based Access Control Implementation Guide

## Overview

This document describes the JWT (JSON Web Token) authentication and role-based access control (RBAC) implementation for the SAP Automation Platform (MCSTAP1).

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js Frontend                         │
│                  - Login Page (/login)                           │
│                  - Protected Routes                              │
│                  - Token Management                              │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP Requests with JWT Bearer Token
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      FastAPI Backend                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │         Authentication Routes (/api/auth/)                  │ │
│  │  - POST /auth/login          → Issue JWT tokens             │ │
│  │  - POST /auth/register       → Create new user              │ │
│  │  - POST /auth/refresh        → Refresh access token         │ │
│  │  - GET  /auth/verify         → Verify token validity        │ │
│  │  - GET  /auth/me             → Get current user info        │ │
│  │  - POST /auth/logout         → Invalidate token             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                             │                                    │
│  ┌──────────────────────────▼─────────────────────────────────┐ │
│  │         Protected API Routes (JWT Required)               │ │
│  │  - GET  /sap/status         → Check SAP connection         │ │
│  │  - POST /sap/login          → Login to SAP                 │ │
│  │  - POST /pm/run             → Run PM flows                 │ │
│  │  - GET  /coverage           → View coverage data           │ │
│  └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    PostgreSQL Database                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ users                | user_roles        | roles          │  │
│  │ - id (PK)           | - user_id (FK)    | - id (PK)      │  │
│  │ - username          | - role_id (FK)    | - name         │  │
│  │ - email             |                    | - description   │  │
│  │ - password_hash     |                    |                 │  │
│  │ - is_active         |                    |                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ permissions      | role_permissions                       │  │
│  │ - id (PK)       | - role_id (FK)                         │  │
│  │ - name          | - permission_id (FK)                  │  │
│  │ - description   |                                        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## JWT Token Structure

Each JWT token contains the following claims:

```json
{
  "sub": "username",           // Subject (user identifier)
  "user_id": 1,               // User ID
  "roles": ["admin"],         // User roles
  "type": "access",           // Token type (access/refresh)
  "exp": 1781234567,          // Expiration timestamp
  "iat": 1781230967           // Issued at timestamp
}
```

## Database Schema

### Users Table
Stores user account information.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Roles Table
Defines available roles (admin, user, viewer).

```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### User-Roles Junction Table
Assigns roles to users (many-to-many relationship).

```sql
CREATE TABLE user_roles (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Permissions Table
Defines available permissions.

```sql
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Role-Permissions Junction Table
Assigns permissions to roles (many-to-many relationship).

```sql
CREATE TABLE role_permissions (
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Default Roles & Permissions

### Roles

| Role | Description |
|------|-------------|
| admin | Administrator with full access |
| user | Regular user with limited access |
| viewer | Read-only access |

### Permissions

| Permission | Description |
|-----------|-------------|
| view_reports | View reports |
| manage_config | Manage configuration |
| run_flows | Run automation flows |
| view_logs | View application logs |
| manage_users | Manage users and roles |
| manage_permissions | Manage permissions |

### Role-Permission Matrix

| Role | Permissions |
|------|------------|
| admin | ALL permissions |
| user | run_flows, view_reports |
| viewer | view_reports, view_logs |

## API Endpoints

### Authentication Endpoints

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

Response (200):
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@mcstap.local",
    "roles": ["admin"],
    "is_active": true
  }
}
```

#### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "securepassword"
}

Response (201):
{
  "id": 2,
  "username": "newuser",
  "email": "user@example.com",
  "roles": ["user"]
}
```

#### Verify Token
```bash
GET /api/auth/verify
Authorization: Bearer <access_token>

Response (200):
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@mcstap.local",
    "roles": ["admin"],
    "is_active": true
  }
}
```

#### Refresh Token
```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response (200):
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Get Current User
```bash
GET /api/auth/me
Authorization: Bearer <access_token>

Response (200):
{
  "id": 1,
  "username": "admin",
  "email": "admin@mcstap.local",
  "roles": ["admin"],
  "is_active": true,
  "permissions": ["view_reports", "manage_config", "run_flows", ...]
}
```

#### Logout
```bash
POST /api/auth/logout
Authorization: Bearer <access_token>

Response (200):
{
  "message": "Logged out successfully. Please delete the token from your client.",
  "user": "admin"
}
```

### Protected API Endpoints

#### Run PM Flow
```bash
POST /api/pm/run
Authorization: Bearer <access_token>

Response (200):
{
  "status": "SUCCESS",
  "return_code": 0,
  "output": "...",
  "errors": "",
  "executed_by": "admin"
}
```

#### Check SAP Status
```bash
GET /api/sap/status
Authorization: Bearer <access_token>

Response (200):
{
  "sap_framework": "available",
  "module": "Plant Maintenance",
  "accessed_by": "admin"
}
```

## Frontend Implementation

### Login Flow

1. User navigates to `/login`
2. User enters credentials (username/password)
3. Frontend calls `POST /api/auth/login`
4. Backend validates credentials and returns JWT tokens
5. Frontend stores tokens in localStorage:
   - `access_token`: Used for API requests
   - `refresh_token`: Used to obtain new access tokens
   - `user`: User information
6. Frontend redirects to `/dashboard`
7. Middleware validates token on each request

### Token Storage

Tokens are stored in `localStorage`:

```javascript
localStorage.setItem('access_token', response.access_token);
localStorage.setItem('refresh_token', response.refresh_token);
localStorage.setItem('user', JSON.stringify(response.user));
```

### Making Authenticated Requests

```typescript
import { getAccessToken } from '@/lib/auth';

const token = getAccessToken();
const response = await fetch('/api/pm/run', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Using the useAuth Hook

```typescript
import { useAuth } from '@/lib/hooks/useAuth';

export function MyComponent() {
  const { user, accessToken, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;

  return (
    <div>
      <p>Welcome, {user.username}!</p>
      <p>Role: {user.roles.join(', ')}</p>
    </div>
  );
}
```

## Backend Implementation

### Authentication Service

The `services/auth_service.py` provides:

```python
from services.auth_service import AuthService

# Login
access_token, refresh_token, user = AuthService.login(username, password)

# Refresh token
new_access_token = AuthService.refresh_access_token(refresh_token)

# Register
user = AuthService.register_user(username, email, password)
```

### JWT Service

The `services/jwt_service.py` handles JWT operations:

```python
from services.jwt_service import JWTService

# Create token
token = JWTService.create_access_token(
    subject='username',
    user_id=1,
    roles=['admin']
)

# Verify token
payload = JWTService.verify_token(token)
```

### User Service

The `services/user_service.py` manages user database operations:

```python
from services.user_service import UserService

# Get user by username
user = UserService.get_user_by_username('admin')

# Verify password
user = UserService.verify_password('admin', 'admin123')

# Get user permissions
permissions = UserService.get_user_permissions(user_id=1)

# Assign role
UserService.assign_role_to_user(user_id=1, role_name='admin')
```

### JWT Dependencies

Use in FastAPI endpoints:

```python
from api.dependencies.jwt_auth import (
    get_current_user,
    require_role,
    require_permission
)

# Require authentication
@router.get("/api/data")
async def get_data(current_user: User = Depends(get_current_user)):
    return {"data": "only for authenticated users"}

# Require specific role
@router.post("/api/admin/config")
async def update_config(current_user: User = Depends(require_role("admin"))):
    return {"status": "config updated"}

# Require specific permission
@router.post("/api/flows/run")
async def run_flow(current_user: User = Depends(require_permission("run_flows"))):
    return {"status": "flow executed"}
```

## Environment Variables

Configure in `.env` file:

```env
# JWT Configuration
JWT_SECRET_KEY=mcstap-super-secret-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION=3600

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/sap_automation
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=sap_automation
POSTGRES_USER=postgres
POSTGRES_PASSWORD=Podravka

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:8000

# Frontend Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Security Best Practices

### 1. Change Default Credentials
The default admin user has credentials `admin` / `admin123`. Change these immediately in production:

```sql
UPDATE users 
SET password_hash = '<new_bcrypt_hash>'
WHERE username = 'admin';
```

### 2. Use HTTPS
Always use HTTPS in production to protect tokens in transit.

### 3. Secure Token Storage
- Use HTTP-Only cookies for tokens when possible
- Never store tokens in localStorage if the application handles sensitive data
- Clear tokens on logout

### 4. Token Expiration
- Access tokens: Short-lived (15-30 minutes) → Configure `JWT_EXPIRATION`
- Refresh tokens: Long-lived (7 days) → Modify in `jwt_service.py`

### 5. Secret Key Management
- Generate a strong secret key for production:
  ```bash
  python -c "import secrets; print(secrets.token_urlsafe(32))"
  ```
- Store in environment variables, never in code
- Use different keys for different environments

### 6. Rate Limiting
Implement rate limiting on login endpoint to prevent brute force attacks.

### 7. CORS Configuration
Configure CORS properly to only allow trusted origins:
```env
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

## Installation & Setup

### 1. Initialize Database
```bash
# Connect to PostgreSQL and run the schema
psql -U postgres -h localhost -d sap_automation -f db/auth_schema.sql
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
Create `.env` file with your configuration (see Environment Variables section)

### 4. Run Backend
```bash
cd api
uvicorn main:app --reload
```

### 5. Run Frontend
```bash
cd frontend-next
npm install
npm run dev
```

### 6. Test Authentication
1. Visit `http://localhost:3000/login`
2. Login with `admin` / `admin123`
3. Should be redirected to dashboard
4. Check browser console for stored tokens:
   ```javascript
   console.log(localStorage.getItem('access_token'))
   ```

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Use Token
```bash
curl -X GET http://localhost:8000/api/pm/run \
  -H "Authorization: Bearer <access_token>"
```

## Troubleshooting

### "Invalid token" error
- Check if token has expired
- Refresh token using refresh endpoint
- Re-login if refresh fails

### "Access denied" error
- User doesn't have required role/permission
- Contact admin to assign appropriate role

### CORS errors
- Check `CORS_ORIGINS` in `.env`
- Ensure frontend URL is in the list

### Database connection error
- Verify PostgreSQL is running
- Check DATABASE_URL in `.env`
- Ensure database and tables exist

## Files Created/Modified

### New Files
- `db/auth_schema.sql` - Database schema
- `api/security/password.py` - Password hashing
- `api/dependencies/jwt_auth.py` - JWT verification
- `api/routes/auth.py` - Authentication endpoints
- `services/auth_service.py` - Auth logic
- `services/jwt_service.py` - JWT operations
- `services/user_service.py` - User database operations
- `frontend-next/app/login/page.tsx` - Login page
- `frontend-next/lib/hooks/useAuth.ts` - Auth hook
- `requirements.txt` - Python dependencies
- `.env` - Environment configuration

### Modified Files
- `api/main.py` - Added auth router & CORS
- `api/routes/pm.py` - Added JWT protection
- `api/routes/sap.py` - Added JWT protection
- `frontend-next/lib/auth.ts` - Enhanced auth utilities
- `frontend-next/middleware.ts` - Added JWT validation

## Next Steps

1. Change default credentials in production
2. Generate strong JWT_SECRET_KEY
3. Configure CORS for your domain
4. Set up database backups
5. Implement audit logging for auth events
6. Set up monitoring and alerts
