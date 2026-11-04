# Implementation Plan: Authentication & User Management (Feature 001)

**Branch**: `001-auth-user-management` | **Date**: 2026-11-04 | **Spec**: [`spec.md`](file:///D:/VsCode/NestJS/dev-space/specs/001-auth-user-management/spec.md)  
**UX Direction**: [`ux-design.md`](file:///D:/VsCode/NestJS/dev-space/specs/001-auth-user-management/ux-design.md)  
**Research**: [`research.md`](file:///D:/VsCode/NestJS/dev-space/specs/001-auth-user-management/research.md)  
**Data Model**: [`data-model.md`](file:///D:/VsCode/NestJS/dev-space/specs/001-auth-user-management/data-model.md)  
**Contracts**: [`contracts/auth.contract.ts`](file:///D:/VsCode/NestJS/dev-space/specs/001-auth-user-management/contracts/auth.contract.ts)  
**Quickstart**: [`quickstart.md`](file:///D:/VsCode/NestJS/dev-space/specs/001-auth-user-management/quickstart.md)  

---

## Summary

Feature 001 delivers foundational authentication, session persistence, and user profile management for DevSpace. The implementation establishes a NestJS Modular Monolith backend (`apps/api`) with dedicated `AuthModule` and `UsersModule`, a PostgreSQL database managed via Prisma ORM, a two-tier JWT + database-backed refresh session model transported via secure `httpOnly` cookies, shared TypeScript contracts (`packages/contracts`), and a 2D Next.js 15 App Router frontend (`apps/web`) with edge route protection and a minimalist, keyboard-friendly UI adhering to the shaped UX direction.

---

## Technical Context

- **Language & Runtime**: Node.js LTS (v20+ / v22+), TypeScript 5.8+ across all packages.
- **Monorepo & Package Manager**: `pnpm` workspaces (v10.15.1) with three primary targets: `apps/api`, `apps/web`, and `packages/contracts`.
- **Backend Architecture**: NestJS (v11) Modular Monolith with Express platform, `@nestjs/jwt`, `@nestjs/swagger`, `class-validator`, and `class-transformer`.
- **Database & Persistence**: PostgreSQL with Prisma ORM (`prisma`, `@prisma/client`) housed in `apps/api/prisma/schema.prisma`.
- **Security & Crypto**: `bcryptjs` (work factor 12) for password hashing; SHA-256 for refresh token hashing in database sessions; HMAC SHA-256 signed JWTs for short-lived access credentials.
- **Frontend Architecture**: Next.js 15 (App Router), React 19, Tailwind CSS v3, `lucide-react`, React Context for client auth state.
- **Target Platform**: Modern desktop and mobile web browsers (Chromium, Firefox, Safari).
- **Scale & Scope (MVP)**: Single-user personal workspace ownership; ~1–5 concurrent active sessions per user; zero third-party OAuth, MFA, or RBAC complexity.
- **Performance Targets**: Under 300ms p95 for authentication and session refresh endpoints; under 30s end-to-end registration flow (`SC-001`, `SC-002`).

---

## Constitution Check

*GATE: Verified against DevSpace Constitution v1.0.0*

| Principle | Gate Requirement | Status | Adherence Details |
|---|---|---|---|
| **I. Product Philosophy (2D-First, 3D-Enhanced)** | Core workspace & auth tasks MUST be usable via standard 2D interfaces. | **PASS** | Auth and account settings are purely 2D interfaces (centered login/register forms, `/settings` page). No 3D dependencies introduced. |
| **II. Monorepo & Modular Architecture** | Modular Monolith in NestJS, clear domain encapsulation, shared contracts package. | **PASS** | Clear domain separation: `AuthModule` (identity/tokens), `UsersModule` (profiles/data), `PrismaModule` (db). DTOs shared via `packages/contracts`. |
| **III. Engineering Standards** | Strict static type safety, no unnecessary `any`, decoupled business logic. | **PASS** | Shared interfaces in `packages/contracts`, strict TypeScript across apps, presentation separated from controllers/services. |
| **IV. Purposeful 3D Development** | 3D scenes completely decoupled from application auth and state stores. | **PASS** | Auth context and session management are independent of Three.js canvas logic. |
| **V. Pragmatic Quality & Testing** | Automated tests for critical logic and API contracts; no meaningless tests. | **PASS** | Unit tests for password hashing/guards and end-to-end API integration tests for auth scenarios. |
| **VI. Minimum Quality Gates** | `typecheck`, `lint`, automated tests, and `build` MUST pass. | **PASS** | Quality gates enforced across `contracts`, `api`, and `web`. |
| **VII. Spec-Driven Workflow** | Specify → Clarify → Plan → Tasks → Analyze → Implement. | **PASS** | Adheres strictly to Feature 001 Spec Kit lifecycle. |

*Gate outcome: All constitutional gates passed with zero violations. No complexity justifications required.*

---

## Detailed Technical Architecture

### 1. Backend Architecture: NestJS Modular Monolith

The backend in `apps/api` follows a domain-driven Modular Monolith structure:
- **`AppModule`**: Imports `ConfigModule`, `PrismaModule`, `UsersModule`, `AuthModule`, and `HealthModule`.
- **`PrismaModule`** (`src/common/prisma/`): Exports `PrismaService` extending `PrismaClient`, handling connection initialization and graceful shutdown hooks.
- **`UsersModule`** (`src/modules/users/`):
  - Encapsulates `User` and `Profile` data models.
  - `UsersService`: Methods for `createUser`, `findByEmail`, `findById`, `updateProfile`, `updatePasswordHash`.
  - `UsersController`: Endpoints for `PATCH /api/users/profile` and `POST /api/users/change-password`.
- **`AuthModule`** (`src/modules/auth/`):
  - Encapsulates session grants, token generation, credential verification, and guards.
  - Imports `UsersModule` and `JwtModule`.
  - `AuthService`: Methods for `register`, `login`, `refresh`, `logout`, `verifyCredentials`.
  - `AuthController`: Endpoints for `POST /api/auth/register`, `login`, `refresh`, `logout`, and `GET /api/auth/me`.
  - `JwtAuthGuard`: Global or route guard extracting and verifying JWT from cookies.
  - `CurrentUser` Decorator: Extracts typed `UserSummary` from the active request.

### 2. Database Entities & Persistence Strategy

Prisma schema in `apps/api/prisma/schema.prisma` mapping to PostgreSQL:
- **`User` Table (`users`)**: Primary identity holding normalized lowercase `email`, `passwordHash` (bcrypt 12), `isActive`, `createdAt`, `updatedAt`.
- **`Profile` Table (`profiles`)**: 1:1 foreign key to `users.id` with `onDelete: Cascade`. Holds `displayName` (defaulting to email username prefix if omitted per Q3 clarification).
- **`Session` Table (`sessions`)**: 1:N foreign key to `users.id` with `onDelete: Cascade`. Holds `hashedRefreshToken` (SHA-256), `userAgent`, `ipAddress`, `expiresAt` (7 days), `isRevoked` (boolean). Indexed on `userId` and `expiresAt`.

### 3. Password Hashing & Credential Validation

- **Hashing**: Utilizes `bcryptjs` with a work factor of 12. Password hashing and verification are encapsulated in an injectable `PasswordService` inside `AuthModule`.
- **Validation Rules (FR-003)**:
  - Validated using `class-validator` decorators on DTOs and tested with regex:
    - Minimum 8 characters.
    - At least 1 uppercase letter (`(?=.*[A-Z])`).
    - At least 1 lowercase letter (`(?=.*[a-z])`).
    - At least 1 numeric digit (`(?=.*[0-9])`).
- **Account Enumeration Defense (FR-005 & Q1 Clarification)**:
  - If a user attempts to register with an existing email, the API returns a generic 400 Bad Request: `"Registration cannot be completed with this email"`.
  - If login credentials fail, the API returns a generic 401 Unauthorized: `"Invalid email or password"`.

### 4. JWT & Session Lifecycle

- **Access Token**: Short-lived (15 minutes). Signed with `JWT_ACCESS_SECRET`. Payload contains `{ sub: user.id, email: user.email, sessionId: session.id }`.
- **Refresh Token**: 7-day cryptographically secure random token string. The server hashes the token using SHA-256 before persisting to `Session.hashedRefreshToken`.
- **Cookie Transport**:
  - `access_token`: `HttpOnly`, `Secure` (in production), `SameSite=Lax`, `Path=/`, `Max-Age=900`.
  - `refresh_token`: `HttpOnly`, `Secure` (in production), `SameSite=Lax`, `Path=/`, `Max-Age=604800` (scoped to `Path=/` so Next.js Edge Middleware and client fetch wrappers can detect active sessions and trigger background token renewal seamlessly without false logouts).
- **Token Rotation**:
  - Calling `POST /api/auth/refresh` reads the refresh token cookie, looks up the active unrevoked session, and verifies the hash.
  - Upon verification, a new access token and a new rotated refresh token are issued; the session record's `hashedRefreshToken` and `expiresAt` are updated in the database.
- **Session Revocation (FR-016 & Q2 Clarification)**:
  - **Explicit Logout**: Revokes the specific active session in the database (`isRevoked = true`) and clears client cookies (`Max-Age=0`).
  - **Password Change**: Keeps the current session active by generating fresh tokens for the current session ID, while executing a bulk update in Prisma to set `isRevoked = true` for all *other* sessions belonging to the user.

### 5. Shared Contracts (`packages/contracts`)

All request DTOs, response models, and error interfaces are defined in `packages/contracts/src/auth/` and exported via `packages/contracts/src/index.ts`:
- `RegisterRequest`, `LoginRequest`, `AuthResponse`, `UserSummary`, `UserProfile`, `UpdateProfileRequest`, `ChangePasswordRequest`, `ApiErrorResponse`.
- Both `apps/api` and `apps/web` consume `@devspace/contracts` directly as a workspace dependency.

### 6. Frontend Authentication Flow & Route Protection (`apps/web`)

- **Edge Route Middleware (`apps/web/src/middleware.ts`)**:
  - Runs on Edge runtime before page render.
  - Checks for the presence of `access_token` or `refresh_token` in cookies.
  - Protects private routes (`/workspaces/:path*`, `/settings/:path*`): Unauthenticated visitors are redirected to `/login?redirect=${encodeURIComponent(req.nextUrl.pathname)}`.
  - Public auth routes (`/login`, `/register`): Authenticated users are redirected to `/workspaces`.
- **Client Auth Context (`apps/web/src/features/auth/context/auth-context.tsx`)**:
  - Provides `user: UserSummary | null`, `isAuthenticated: boolean`, `isLoading: boolean`.
  - Methods: `login(email, password)`, `register(email, password, displayName?)`, `logout()`, `updateProfile(displayName)`.
  - Queries `GET /api/auth/me` on mount to re-hydrate user details.
- **HTTP Client Interceptor (`apps/web/src/lib/api-client.ts`)**:
  - Shared fetch wrapper.
  - Intercepts 401 responses on protected requests, triggers `POST /api/auth/refresh` behind a concurrency mutex lock, retries the failed request on success, or triggers auth logout on failure.

### 7. UI Components & Layouts (Adhering to `ux-design.md`)

- **Login Page (`apps/web/src/app/login/page.tsx`)**: Centered 380px single-column layout using DevSpace design tokens (`bg-background`, `border-border`, `text-foreground`). Includes accessible password reveal toggle, autofocus, keyboard submit (`↵`), and inline error alert.
- **Registration Page (`apps/web/src/app/register/page.tsx`)**: Email, optional display name (with hint), password, and confirmation. Real-time checklist validating the 4 rules of FR-003.
- **Settings Page (`apps/web/src/app/settings/page.tsx`)**: Two-column layout with vertical sub-nav:
  - *Profile Tab*: Read-only email with privacy badge, display name input with validation and save button, account creation date.
  - *Security Tab*: Current password, new password, confirm new password, and submit button.
- **Navigation Components (`apps/web/src/components/navigation/`)**:
  - Unauthenticated header: Brand mark + contextual toggle between "Sign In" and "Create Account".
  - Authenticated header: Brand mark, workspace indicator, user avatar badge (initials), and dropdown menu (Profile info, Settings link, Sign Out action).

### 8. Error Handling & Security Measures

- **Neutral Error Messages**: Prevents user enumeration on registration and login.
- **Timing Attack Mitigation**: Password comparison uses constant-time bcrypt `compare()`.
- **CORS Configuration**: Configured in NestJS `main.ts` with explicit credentials support (`origin: 'http://localhost:3000'`, `credentials: true`).
- **Validation Pipe**: NestJS global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, and `transform: true`.

### 9. Testing & Quality Verification Strategy

- **Static Analysis**: `pnpm -r --parallel run typecheck` and `pnpm -r --parallel run lint`.
- **Backend Unit Tests**:
  - `PasswordService`: Hash generation and validation tests.
  - `AuthService`: Registration uniqueness, credential checking, token generation, session revocation logic.
  - `UsersService`: Display name fallback, profile updates, password update logic.
- **API E2E Tests (`apps/api/test/auth.e2e-spec.ts`)**:
  - Full HTTP scenario testing using Supertest covering the 8 scenarios detailed in `quickstart.md`.
- **Build Verification**: `pnpm build` across `@devspace/contracts`, `@devspace/api`, and `@devspace/web`.

---

## Project Structure & Source Layout

```text
dev-space/
├── packages/
│   └── contracts/
│       └── src/
│           ├── auth/
│           │   ├── auth.dto.ts           # Register, Login, Token payloads
│           │   └── user.dto.ts           # Profile, Password change DTOs
│           └── index.ts                  # Shared exports
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma             # User, Profile, Session models
│   │   │   └── migrations/               # PostgreSQL schema migrations
│   │   └── src/
│   │       ├── common/
│   │       │   ├── decorators/
│   │       │   │   └── current-user.decorator.ts
│   │       │   ├── guards/
│   │       │   │   └── jwt-auth.guard.ts
│   │       │   └── prisma/
│   │       │       ├── prisma.module.ts
│   │       │       └── prisma.service.ts
│   │       ├── modules/
│   │       │   ├── auth/
│   │       │   │   ├── auth.controller.ts
│   │       │   │   ├── auth.module.ts
│   │       │   │   ├── auth.service.ts
│   │       │   │   ├── password.service.ts
│   │       │   │   └── strategies/jwt.strategy.ts
│   │       │   └── users/
│   │       │       ├── users.controller.ts
│   │       │       ├── users.module.ts
│   │       │       └── users.service.ts
│   │       ├── app.module.ts
│   │       └── main.ts
│   └── web/
│       └── src/
│           ├── middleware.ts             # Edge route protection
│           ├── app/
│           │   ├── (auth)/
│           │   │   ├── login/page.tsx    # Centered login form
│           │   │   └── register/page.tsx # Centered registration form
│           │   ├── (dashboard)/
│           │   │   └── settings/page.tsx # Two-column profile & security settings
│           │   ├── globals.css
│           │   └── layout.tsx
│           ├── components/
│           │   └── navigation/
│           │       ├── header.tsx        # Responsive unauth/auth header
│           │       └── user-menu.tsx     # Dropdown menu with avatar
│           ├── features/
│           │   └── auth/
│           │       ├── context/auth-context.tsx
│           │       ├── hooks/use-auth.ts
│           │       └── components/
│           │           ├── login-form.tsx
│           │           ├── register-form.tsx
│           │           ├── profile-form.tsx
│           │           └── password-form.tsx
│           └── lib/
│               └── api-client.ts         # Fetch wrapper with refresh interceptor
└── specs/
    └── 001-auth-user-management/
        ├── spec.md
        ├── ux-design.md
        ├── plan.md                       # This plan
        ├── research.md
        ├── data-model.md
        ├── quickstart.md
        ├── contracts/
        │   └── auth.contract.ts
        └── checklists/
            └── requirements.md
```

---

## Complexity Tracking

*No constitutional violations. Zero unwarranted abstractions.*

| Aspect | Decision | Simpler Alternative Evaluated & Rejected |
|---|---|---|
| **Database Sessions** | Prisma `Session` table storing hashed refresh tokens | Stateless JWT-only refresh: Rejected because stateless tokens cannot be revoked on logout or password change without keeping an in-memory or Redis blacklist. |
| **Token Transport** | `httpOnly, SameSite=Lax` cookies | `localStorage` + Bearer headers: Rejected because it exposes refresh tokens to XSS and causes route flashing in Next.js Server Components / Middleware. |
