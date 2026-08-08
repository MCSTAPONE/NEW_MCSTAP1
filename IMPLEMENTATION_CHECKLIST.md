# JWT Implementation Checklist

## Pre-Implementation

- [ ] Review JWT_AUTHENTICATION_GUIDE.md
- [ ] Review JWT_IMPLEMENTATION_SUMMARY.md
- [ ] Ensure PostgreSQL is installed and running
- [ ] Ensure Python 3.8+ is installed
- [ ] Ensure Node.js 16+ is installed

## Database Setup

- [ ] Run migration script: `bash migrate_db.sh`
  - [ ] Verify database connection
  - [ ] Verify schema created
  - [ ] Verify default data inserted
- [ ] Verify admin user exists: `psql -U postgres -d sap_automation -c "SELECT * FROM users WHERE username='admin';"`
- [ ] Verify roles exist: `psql -U postgres -d sap_automation -c "SELECT * FROM roles;"`
- [ ] Verify permissions exist: `psql -U postgres -d sap_automation -c "SELECT * FROM permissions;"`

## Backend Setup

- [ ] Install Python dependencies
  ```bash
  pip install -r requirements.txt
  ```
  - [ ] jwt installed
  - [ ] passlib installed
  - [ ] bcrypt installed
  - [ ] fastapi installed
  - [ ] psycopg2 installed

- [ ] Verify environment variables in `.env`
  - [ ] JWT_SECRET_KEY set
  - [ ] JWT_ALGORITHM set
  - [ ] JWT_EXPIRATION set
  - [ ] DATABASE_URL correct
  - [ ] CORS_ORIGINS set correctly

- [ ] Test backend startup
  ```bash
  cd api
  uvicorn main:app --reload
  ```
  - [ ] No import errors
  - [ ] API starts on http://localhost:8000
  - [ ] Health endpoint works: `curl http://localhost:8000/health`

- [ ] Test authentication endpoints
  - [ ] Login: `curl -X POST http://localhost:8000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'`
  - [ ] Register: `curl -X POST http://localhost:8000/api/auth/register -H "Content-Type: application/json" -d '{"username":"testuser","email":"test@example.com","password":"test123"}'`
  - [ ] Verify: `curl -X GET http://localhost:8000/api/auth/verify -H "Authorization: Bearer <token>"`

## Frontend Setup

- [ ] Install Node.js dependencies
  ```bash
  cd frontend-next
  npm install
  ```

- [ ] Verify `.env` variables (should be in `next.config.mjs` or `.env.local`)
  - [ ] NEXT_PUBLIC_API_BASE_URL set to backend URL
  - [ ] NEXT_PUBLIC_APP_NAME set

- [ ] Test frontend startup
  ```bash
  npm run dev
  ```
  - [ ] No build errors
  - [ ] Frontend starts on http://localhost:3000
  - [ ] Login page loads: http://localhost:3000/login

- [ ] Test frontend authentication flow
  - [ ] Navigate to http://localhost:3000/login
  - [ ] Enter credentials: admin / admin123
  - [ ] Click Login button
  - [ ] Should redirect to /dashboard
  - [ ] Check browser LocalStorage:
    ```javascript
    console.log(localStorage.getItem('access_token'))
    console.log(localStorage.getItem('refresh_token'))
    console.log(JSON.parse(localStorage.getItem('user')))
    ```

## Integration Tests

- [ ] Test protected PM routes
  - [ ] Call POST /api/pm/run with valid token
  - [ ] Verify 200 response with execution result
  - [ ] Call POST /api/pm/run without token
  - [ ] Verify 403 Unauthorized response

- [ ] Test protected SAP routes
  - [ ] Call GET /api/sap/status with valid token
  - [ ] Verify 200 response
  - [ ] Call GET /api/sap/status without token
  - [ ] Verify 403 Unauthorized response

- [ ] Test role-based access
  - [ ] Create 'viewer' user (read-only)
  - [ ] Login as 'viewer'
  - [ ] Verify can view reports
  - [ ] Verify cannot run flows (if not assigned permission)

- [ ] Test token refresh
  - [ ] Get refresh token from login
  - [ ] Call POST /api/auth/refresh with refresh token
  - [ ] Verify new access token returned
  - [ ] Use new token to access protected route

- [ ] Test token expiration
  - [ ] Wait for token to expire (or manually check JWT claims)
  - [ ] Try to use expired token
  - [ ] Verify 401 Unauthorized
  - [ ] Refresh token should work

## Security Validation

- [ ] Verify passwords are hashed
  ```bash
  psql -U postgres -d sap_automation -c "SELECT username, password_hash FROM users LIMIT 1;"
  ```
  - [ ] Password hash starts with $2b$ (bcrypt format)
  - [ ] Not plain text

- [ ] Verify JWT_SECRET_KEY is not exposed
  - [ ] Not in source control
  - [ ] Not in .env file in repo
  - [ ] Loaded from environment variables

- [ ] Verify CORS is properly configured
  - [ ] Frontend can call backend
  - [ ] Invalid origins are blocked

- [ ] Verify HTTPS readiness
  - [ ] Tokens not visible in URL
  - [ ] Sensitive data in request body (not query params)

## Optional Enhancements

- [ ] Implement rate limiting on login endpoint
- [ ] Add audit logging for login attempts
- [ ] Implement token blacklist for logout
- [ ] Add email verification for new registrations
- [ ] Implement password reset functionality
- [ ] Add 2FA (two-factor authentication)
- [ ] Create admin dashboard for user management
- [ ] Implement OAuth/OIDC integration

## Production Checklist

### Before Deploying

- [ ] Generate new strong JWT_SECRET_KEY
  ```bash
  python -c "import secrets; print(secrets.token_urlsafe(32))"
  ```

- [ ] Change default admin credentials
  ```bash
  # Generate new bcrypt hash for password
  python -c "from api.security.password import hash_password; print(hash_password('NEWPASSWORD'))"
  
  # Update database
  # UPDATE users SET password_hash='<new_hash>' WHERE username='admin';
  ```

- [ ] Update CORS_ORIGINS to production domain
  ```env
  CORS_ORIGINS=https://yourdomain.com,https://api.yourdomain.com
  ```

- [ ] Update DATABASE_URL to production database
  ```env
  DATABASE_URL=postgresql://produser:prodpass@prod-db-host:5432/sap_automation
  ```

- [ ] Enable HTTPS/SSL
  - [ ] Get SSL certificate (Let's Encrypt recommended)
  - [ ] Configure in reverse proxy (Nginx/Apache)
  - [ ] Force HTTPS redirect

- [ ] Set secure cookie flags
  - [ ] HttpOnly: true (tokens not accessible to JavaScript)
  - [ ] Secure: true (only sent over HTTPS)
  - [ ] SameSite: Lax (CSRF protection)

- [ ] Enable security headers
  - [ ] Content-Security-Policy
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
  - [ ] Strict-Transport-Security

- [ ] Setup monitoring and logging
  - [ ] Monitor authentication attempts
  - [ ] Log failed login attempts
  - [ ] Alert on suspicious activity
  - [ ] Monitor token refresh rates

- [ ] Database backups
  - [ ] Enable automated backups
  - [ ] Test backup restoration
  - [ ] Store backups securely

- [ ] Performance optimization
  - [ ] Enable database connection pooling
  - [ ] Setup Redis for token caching (optional)
  - [ ] Enable frontend caching
  - [ ] Implement CDN (optional)

### Deployment

- [ ] Backend deployed and running
- [ ] Frontend deployed and running
- [ ] Database migrated
- [ ] Environment variables configured
- [ ] HTTPS enabled
- [ ] Monitoring active
- [ ] Backup systems active

## Post-Deployment

- [ ] Monitor error logs
- [ ] Monitor authentication metrics
- [ ] Test all authentication flows
- [ ] Verify rate limiting working
- [ ] Check database backup status
- [ ] Monitor API response times
- [ ] Review security logs

## Maintenance

- [ ] Regularly rotate JWT_SECRET_KEY (with grace period)
- [ ] Monitor for security patches in dependencies
  ```bash
  pip list --outdated
  ```
- [ ] Clean up expired refresh tokens (if implementing token storage)
- [ ] Review and update CORS origins as needed
- [ ] Update role/permission matrix based on requirements
- [ ] Audit user access periodically

---

## Notes

- Current token expiration: 1 hour (3600 seconds)
- Refresh token expiration: 7 days
- Default admin credentials: admin / admin123
- Database: PostgreSQL sap_automation
- Backend API: http://localhost:8000
- Frontend: http://localhost:3000

## Support

For issues:
1. Check JWT_AUTHENTICATION_GUIDE.md troubleshooting
2. Review backend logs: `uvicorn main:app --reload`
3. Check browser console for frontend errors
4. Verify database connection: `psql -U postgres -d sap_automation -c "SELECT 1;"`

---

**Status: Ready for implementation** ✅
