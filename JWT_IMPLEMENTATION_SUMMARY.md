# JWT Authentication Implementation - Quick Start Guide

## ✅ Implementation Complete!

I've successfully implemented JWT-based authentication with role-based access control (RBAC) in your MCSTAP1 application. Here's what was created:

---

## 📦 Files Created/Modified

### Backend - Authentication System

#### New Service Files
- [services/jwt_service.py](services/jwt_service.py) - JWT token creation & verification
- [services/auth_service.py](services/auth_service.py) - Authentication logic
- [services/user_service.py](services/user_service.py) - User database operations
- [api/security/password.py](api/security/password.py) - Password hashing (bcrypt)
- [api/dependencies/jwt_auth.py](api/dependencies/jwt_auth.py) - JWT verification dependencies

#### New Route File
- [api/routes/auth.py](api/routes/auth.py) - Login, register, refresh, verify endpoints

#### Database
- [db/auth_schema.sql](db/auth_schema.sql) - User, roles, permissions tables

#### Configuration
- [requirements.txt](requirements.txt) - Python dependencies
- [.env](.env) - Environment variables template

### Frontend - Authentication UI

#### New Files
- [frontend-next/app/login/page.tsx](frontend-next/app/login/page.tsx) - Login page
- [frontend-next/lib/hooks/useAuth.ts](frontend-next/lib/hooks/useAuth.ts) - Auth context hook

#### Modified Files
- [frontend-next/lib/auth.ts](frontend-next/lib/auth.ts) - Enhanced auth utilities
- [frontend-next/middleware.ts](frontend-next/middleware.ts) - JWT validation middleware

### Modified Backend Files
- [api/main.py](api/main.py) - Added auth routes & CORS
- [api/routes/pm.py](api/routes/pm.py) - Added JWT protection
- [api/routes/sap.py](api/routes/sap.py) - Added JWT protection

### Documentation
- [JWT_AUTHENTICATION_GUIDE.md](JWT_AUTHENTICATION_GUIDE.md) - Complete implementation guide

---

## 🚀 Quick Start (5 Steps)

### Step 1: Initialize Database
```bash
# Connect to PostgreSQL and run the schema
psql -U postgres -h localhost -d sap_automation -f db/auth_schema.sql
```

### Step 2: Install Dependencies
```bash
# Backend dependencies
pip install -r requirements.txt

# Frontend dependencies (if not already installed)
cd frontend-next
npm install
cd ..
```

### Step 3: Configure Environment
The `.env` file is already created with sensible defaults. Update if needed:
```env
JWT_SECRET_KEY=mcstap-super-secret-key-change-this-in-production
JWT_EXPIRATION=3600
DATABASE_URL=postgresql://postgres:Podravka@localhost:5432/sap_automation
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

### Step 4: Start Backend
```bash
cd api
uvicorn main:app --reload
# Backend runs on http://localhost:8000
```

### Step 5: Start Frontend
```bash
cd frontend-next
npm run dev
# Frontend runs on http://localhost:3000
```

---

## 🔐 Default Credentials

**Username:** `admin`
**Password:** `admin123`

⚠️ **IMPORTANT:** Change these credentials in production!

---

## 🧪 Test the Implementation

### Test Login
```bash
# Open browser and go to http://localhost:3000/login
# Login with: admin / admin123
# Should redirect to /dashboard
```

### Test API with cURL
```bash
# 1. Get token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.access_token')

# 2. Use token to access protected endpoint
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 3. Run PM flow (requires run_flows permission)
curl -X POST http://localhost:8000/api/pm/run \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📋 Features Implemented

### Authentication
- ✅ User login with JWT token generation
- ✅ User registration
- ✅ Token refresh mechanism
- ✅ Token verification
- ✅ Logout endpoint

### Authorization
- ✅ Role-based access control (3 roles: admin, user, viewer)
- ✅ Permission-based access control (6 permissions)
- ✅ Dependency injection for route protection

### Security
- ✅ Bcrypt password hashing
- ✅ JWT token expiration
- ✅ CORS middleware
- ✅ HTTP Bearer authentication
- ✅ Protected routes validation

### Frontend
- ✅ Login page with error handling
- ✅ Token storage in localStorage
- ✅ Middleware for route protection
- ✅ Auth utilities and hooks
- ✅ User context management

---

## 🏗️ Architecture Overview

```
Login (admin/admin123)
         ↓
FastAPI /api/auth/login
         ↓
JWT Token Generated
         ↓
Stored in localStorage
         ↓
Every API request includes: Authorization: Bearer <token>
         ↓
Backend validates token & checks role/permission
         ↓
✅ Access Granted / ❌ Access Denied
```

---

## 🗄️ Database Structure

### Users
- Store user credentials with hashed passwords
- Track active/inactive status

### Roles
- `admin` - Full access
- `user` - Limited access (run flows, view reports)
- `viewer` - Read-only (view reports, logs)

### Permissions
- `view_reports` - View reports
- `manage_config` - Manage configuration
- `run_flows` - Run automation flows
- `view_logs` - View logs
- `manage_users` - Manage users
- `manage_permissions` - Manage permissions

---

## 📚 API Reference

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/login` | POST | ❌ | Login with credentials |
| `/api/auth/register` | POST | ❌ | Register new user |
| `/api/auth/refresh` | POST | ❌ | Refresh access token |
| `/api/auth/verify` | GET | ✅ | Verify current token |
| `/api/auth/me` | GET | ✅ | Get user info & permissions |
| `/api/auth/logout` | POST | ✅ | Logout |
| `/api/pm/run` | POST | ✅ | Run PM flow (requires run_flows) |
| `/api/sap/status` | GET | ✅ | Check SAP status |
| `/api/sap/login` | POST | ✅ | Login to SAP |

---

## 🔧 Configuration Reference

### Environment Variables (`.env`)

```env
# JWT Settings
JWT_SECRET_KEY              # Secret key for signing tokens (change in production!)
JWT_ALGORITHM               # Algorithm (default: HS256)
JWT_EXPIRATION              # Token expiration in seconds (default: 3600)

# Database
DATABASE_URL                # PostgreSQL connection string
POSTGRES_HOST               # DB hostname
POSTGRES_PORT               # DB port
POSTGRES_DB                 # Database name
POSTGRES_USER               # DB username
POSTGRES_PASSWORD           # DB password

# CORS
CORS_ORIGINS                # Allowed origins (comma-separated)

# Frontend
NEXT_PUBLIC_API_BASE_URL    # Backend API URL
NEXT_PUBLIC_APP_NAME        # Application name
```

---

## 🎯 Usage Examples

### Backend - Create Protected Endpoint
```python
from fastapi import APIRouter, Depends
from api.dependencies.jwt_auth import get_current_user, require_role
from services.user_service import User

router = APIRouter()

# Require authentication
@router.get("/api/data")
async def get_data(current_user: User = Depends(get_current_user)):
    return {"data": f"Hello {current_user.username}"}

# Require admin role
@router.post("/api/admin/config")
async def update_config(current_user: User = Depends(require_role("admin"))):
    return {"status": "updated"}
```

### Frontend - Make Authenticated Request
```typescript
import { getAccessToken } from '@/lib/auth';

async function fetchProtectedData() {
  const token = getAccessToken();
  
  const response = await fetch('/api/pm/run', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
}
```

---

## ⚠️ Important Security Notes

### Before Going to Production

1. **Generate Strong JWT Secret**
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **Change Default Credentials**
   ```sql
   UPDATE users SET password_hash = '<new_bcrypt_hash>' WHERE username = 'admin';
   ```

3. **Update Environment Variables**
   - Change `JWT_SECRET_KEY`
   - Update `CORS_ORIGINS` to your domain
   - Use real database credentials

4. **Enable HTTPS**
   - Always use HTTPS in production
   - Never transmit tokens over HTTP

5. **Set Strong Token Expiration**
   - Access tokens: 15-30 minutes (short-lived)
   - Refresh tokens: 7 days (long-lived)

6. **Implement Rate Limiting**
   - Add rate limiting to `/api/auth/login`
   - Prevent brute force attacks

---

## 🐛 Troubleshooting

### "ModuleNotFoundError: No module named 'jwt'"
```bash
pip install -r requirements.txt
```

### "FATAL: database "sap_automation" does not exist"
```bash
createdb -U postgres sap_automation
psql -U postgres sap_automation -f db/auth_schema.sql
```

### "Invalid token" error
- Token may have expired → Use refresh endpoint
- Token signature is invalid → Check JWT_SECRET_KEY
- Re-login if unsure

### CORS errors in browser
- Check `CORS_ORIGINS` in `.env`
- Ensure frontend URL is in the list
- Restart backend to apply changes

### "Access denied" when calling API
- User doesn't have required permission
- Check user's role in database
- Admin can assign roles using:
  ```sql
  SELECT * FROM user_roles WHERE user_id = 1;
  ```

---

## 📖 Full Documentation

For comprehensive documentation including:
- Complete API reference
- Database schema details
- Security best practices
- Advanced configuration
- Testing procedures

👉 **See [JWT_AUTHENTICATION_GUIDE.md](JWT_AUTHENTICATION_GUIDE.md)**

---

## 🎓 Next Steps

1. ✅ Test the implementation locally
2. 📝 Review [JWT_AUTHENTICATION_GUIDE.md](JWT_AUTHENTICATION_GUIDE.md)
3. 🔐 Update default credentials for your environment
4. 🚀 Deploy to production with proper security measures
5. 📊 Monitor authentication events and logs

---

## 📞 Support

For issues or questions:
1. Check [JWT_AUTHENTICATION_GUIDE.md](JWT_AUTHENTICATION_GUIDE.md) troubleshooting section
2. Review error logs from backend and frontend
3. Verify database schema with: `psql -U postgres sap_automation -d`

---

**Implementation Status:** ✅ **COMPLETE**

All files are created and ready to use. Simply follow the Quick Start steps to get up and running!
