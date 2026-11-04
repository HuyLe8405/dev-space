# Quickstart Validation Guide: Authentication & User Management (Feature 001)

**Feature**: `001-auth-user-management`  
**Date**: 2026-11-04  
**Status**: Ready for Verification  

---

## 1. Prerequisites & Environment Setup

### Environment Variables
Configure the backend `.env` in `apps/api/` based on `apps/api/.env.example`:
```env
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/devspace?schema=public"
JWT_ACCESS_SECRET="dev-insecure-access-secret-32-chars-minimum!!"
JWT_REFRESH_SECRET="dev-insecure-refresh-secret-32-chars-minimum!!"
COOKIE_DOMAIN="localhost"
```

Configure the frontend `.env.local` in `apps/web/` based on `apps/web/.env.example`:
```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

### Database Migration
Run Prisma migrations to initialize the PostgreSQL schema defined in [`data-model.md`](file:///D:/VsCode/NestJS/dev-space/specs/001-auth-user-management/data-model.md):
```bash
pnpm --filter @devspace/api exec prisma migrate dev --name init_auth_users
```

### Start Monorepo Services
```bash
pnpm dev
# Backend running on http://localhost:4000/api
# Frontend running on http://localhost:3000
```

---

## 2. End-to-End Validation Scenarios

### Scenario 1: User Registration & Initial Session (FR-001, FR-002, FR-003)
Execute cURL to register a new user:
```bash
curl -i -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@example.com","password":"Password123","displayName":"Alex"}' \
  -c cookies.txt
```
**Expected Outcome**:
- Status: `201 Created`
- Response Body: `{ "user": { "id": "...", "email": "alex@example.com", "displayName": "Alex", ... }, "expiresIn": 900 }`
- Response Headers: `Set-Cookie: access_token=...; HttpOnly; SameSite=Lax; Path=/` and `Set-Cookie: refresh_token=...; HttpOnly; SameSite=Lax; Path=/` saved in `cookies.txt`.

---

### Scenario 2: Account Enumeration Protection (FR-005)
Attempt registration with the same email:
```bash
curl -i -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@example.com","password":"Password123"}'
```
**Expected Outcome**:
- Status: `400 Bad Request`
- Response Body: Generic non-confirming message: `{ "statusCode": 400, "message": "Registration cannot be completed with this email" }`

---

### Scenario 3: Verify Authenticated Profile & Session (FR-006, FR-013)
Query current user identity using stored session cookies:
```bash
curl -i -X GET http://localhost:4000/api/auth/me \
  -b cookies.txt
```
**Expected Outcome**:
- Status: `200 OK`
- Response Body: `{ "id": "...", "email": "alex@example.com", "displayName": "Alex", "createdAt": "..." }`

---

### Scenario 4: Update Profile Display Name (FR-014)
Update user display name:
```bash
curl -i -X PATCH http://localhost:4000/api/users/profile \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"displayName":"Alex Rivera"}'
```
**Expected Outcome**:
- Status: `200 OK`
- Response Body: `{ "id": "...", "displayName": "Alex Rivera", "updatedAt": "..." }`

---

### Scenario 5: Silent Token Refresh Rotation (FR-007)
Exchange the refresh cookie for a newly rotated access token and refresh token:
```bash
curl -i -X POST http://localhost:4000/api/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```
**Expected Outcome**:
- Status: `200 OK`
- New `access_token` and `refresh_token` set in response headers.
- Previous refresh token becomes invalid.

---

### Scenario 6: Password Change & Cross-Device Session Invalidation (FR-015, FR-016)
Change account password:
```bash
curl -i -X POST http://localhost:4000/api/users/change-password \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -c cookies.txt \
  -d '{"currentPassword":"Password123","newPassword":"NewSecurePassword456"}'
```
**Expected Outcome**:
- Status: `200 OK`
- Response Body: `{ "message": "Password changed successfully" }`
- Current session remains authenticated with fresh tokens (`cookies.txt` updated).
- Any existing secondary session tokens on other devices return `401 Unauthorized`.

---

### Scenario 7: Sign-Out & Session Revocation (FR-008, FR-009)
Sign out:
```bash
curl -i -X POST http://localhost:4000/api/auth/logout \
  -b cookies.txt \
  -c cookies.txt
```
**Expected Outcome**:
- Status: `200 OK`
- Response Body: `{ "message": "Logged out successfully" }`
- Cookies cleared (`Max-Age=0`).
- Subsequent requests to `/api/auth/me` return `401 Unauthorized`.

---

### Scenario 8: Frontend Route Guard Verification (FR-010, FR-011)
1. Open browser in incognito mode (no auth cookies).
2. Navigate to `http://localhost:3000/settings`.
   - **Verification**: Instantly redirected to `http://localhost:3000/login?redirect=%2Fsettings`.
3. Fill credentials and sign in.
   - **Verification**: Automatically directed to `http://localhost:3000/settings`.
4. Navigate to `http://localhost:3000/login`.
   - **Verification**: Automatically redirected to `http://localhost:3000/workspaces` (or main dashboard).
