# Research & Architecture Decisions: Authentication & User Management (Feature 001)

**Feature**: `001-auth-user-management`  
**Date**: 2026-11-04  
**Status**: Completed  

---

## 1. Backend Architecture: NestJS Modular Monolith & Module Boundaries

### Decision
Structure the backend into two distinct, decoupled domain modules within `apps/api/src/modules/`:
1. `UsersModule`: Responsible for user data persistence, user profile lifecycle, account lookup, and profile mutations.
2. `AuthModule`: Responsible for identity verification, credential checking, password hashing/verification, JWT token generation/validation, refresh token session lifecycle, and auth guards/decorators.
3. `PrismaModule` in `apps/api/src/common/prisma/`: Global database access service encapsulating `PrismaClient` with proper NestJS lifecycle hooks (`onModuleInit`, `onModuleDestroy`).

### Rationale
- Adheres directly to DevSpace Constitution Principle II (Modular Monolith with clear domain encapsulation).
- Prevents coupling between authentication protocol/token management and the canonical user domain model. Future domain modules (Workspaces, Areas, Projects) will reference `UsersModule` or inject the current user's ID from authentication context without touching `AuthModule` internals.
- Keeps modules testable and prevents circular dependencies (`AuthModule` imports `UsersModule`; `UsersModule` does not import `AuthModule`).

### Alternatives Considered
- *Single unified `AuthModule` handling both users and tokens*: Rejected because mixing user profile persistence and token issuance violates single responsibility and creates a monolithic grab-bag as user preferences grow.
- *Microservices or separate Auth service*: Rejected. Unjustified operational complexity for a single-tenant personal workspace; strongly violates the Constitution's mandate against premature abstraction and over-engineering.

---

## 2. Database & Persistence Strategy: PostgreSQL + Prisma ORM

### Decision
Adopt **PostgreSQL** as the canonical relational database and **Prisma ORM** (`prisma`, `@prisma/client`) for schema definition, type-safe migrations, and query execution. Place the Prisma schema in `apps/api/prisma/schema.prisma`.

### Rationale
- DevSpace requires strict relational integrity (Users → Profiles → Sessions → Workspaces → Areas → Projects). PostgreSQL provides reliable transactional consistency and foreign key cascades.
- Prisma provides end-to-end static TypeScript type generation, auto-generated database migrations (`prisma migrate dev`), and clean declarative modeling matching NestJS services.
- Highly consistent with the existing pnpm monorepo TypeScript setup.

### Alternatives Considered
- *TypeORM*: Viable with NestJS, but requires complex active-record or repository decorator patterns, verbose migration tooling, and less reliable compile-time typing compared to Prisma.
- *Drizzle ORM*: Lightweight and performant, but Prisma provides superior schema ergonomics, automated migrations, and rapid setup for the current stage of DevSpace.

---

## 3. Password Hashing Strategy

### Decision
Use **Argon2** via `@node-rs/argon2` (or `bcrypt` via `bcrypt` / `bcryptjs`). For zero-native-compilation friction across diverse Windows/Linux development environments, use `bcrypt` (or `argon2` if prebuilt binaries are stable). Specifically, `bcryptjs` or standard `bcrypt` with a work factor (salt rounds) of 12.

### Rationale
- Salt rounds = 12 provides robust defense against brute-force attacks while executing in ~250–350ms, meeting the user's interactive response expectations without CPU hogging.
- Standard, battle-tested cryptographic baseline recommended by OWASP for password storage.

### Alternatives Considered
- *Plain SHA-256 / MD5*: Prohibited. Fast hashes without memory/time hardness are vulnerable to rainbow table attacks.
- *PBKDF2*: Acceptable, but bcrypt/argon2 provide superior ASIC resistance and widespread NestJS community support.

---

## 4. Token Lifecycle, Transport & Session Management

### Decision
Implement a **Two-Tier Token Lifecycle** using `@nestjs/jwt`:
1. **Access Token (JWT)**:
   - *Payload*: `{ sub: userId, email: string, sessionId: string }`
   - *Lifetime*: Short-lived (15 minutes).
   - *Verification*: Cryptographically signed using `JWT_ACCESS_SECRET` (symmetric HMAC SHA-256 for MVP). Verified statelessly in NestJS `JwtAuthGuard`.
2. **Refresh Token (Opaque Hash + Database Session)**:
   - *Lifetime*: 7 days.
   - *Storage in DB*: Store a cryptographic hash (SHA-256) of the refresh token in the `AuthenticationSession` table alongside `userId`, `userAgent`, `ipAddress`, and `expiresAt`.
   - *Token Rotation*: Every successful refresh request issues a new access token and a new refresh token, updating the session's hashed token. If an expired or revoked session token is reused, the session is invalidated.
3. **Transport Mechanism**:
   - Deliver both tokens via **HTTP-only, Secure, SameSite=Lax cookies** (`access_token` and `refresh_token`), accompanied by the user profile in the JSON response body.
   - *Why Cookies*: Enables Next.js App Router (Middleware + Server Components) to inspect authentication status seamlessly on page requests without client hydration delays, while shielding refresh credentials from client-side XSS.

### Rationale
- Satisfies spec requirements `FR-006`, `FR-007`, `FR-008`, `FR-016` (session persistence, silent refresh, explicit sign-out, session revocation on password change).
- Storing hashed refresh tokens in the database enables immediate revocation on logout or password change without maintaining distributed revocation blacklists for stateless access tokens.

### Alternatives Considered
- *Tokens in localStorage + Authorization Header*: Rejected. Vulnerable to XSS token theft; prevents Next.js Server Components from authenticating incoming requests before HTML render, causing noticeable UI flickering on route transitions.
- *Stateful Server-Side Sessions (Redis/Express-session)*: Rejected. Introduces an extra infrastructure dependency (Redis). The hybrid JWT + DB session record achieves immediate revocability with zero additional daemon dependencies.

---

## 5. Frontend Route Protection & State Synchronization

### Decision
1. **Edge Middleware (`apps/web/src/middleware.ts`)**:
   - Inspects `access_token` or `refresh_token` cookie on incoming navigation requests.
   - Redirects unauthenticated visitors attempting to reach `/workspaces`, `/settings`, or protected paths to `/login?redirect=<path>` (fulfilling `FR-010`).
   - Redirects authenticated users attempting to reach `/login` or `/register` to `/workspaces` (fulfilling `FR-011`).
2. **Client Auth Context (`apps/web/src/features/auth/context/auth-context.tsx`)**:
   - React Context storing the authenticated user's profile (`UserSummary`), authentication status (`isLoading`, `isAuthenticated`), and actions (`login`, `register`, `logout`, `refreshSession`).
   - Initializes on mount by querying `/api/auth/me`.
3. **API Client with Transparent Refresh Interceptor (`apps/web/src/lib/api-client.ts`)**:
   - Wraps standard `fetch`.
   - On encountering a `401 Unauthorized` on a protected API call, triggers a single locked call to `/api/auth/refresh`. If refresh succeeds, retries the original request. If refresh fails (session revoked/expired), clears auth context and redirects to `/login`.

### Rationale
- Adheres to Next.js App Router conventions.
- Eliminates layout flickers on page reloads (`SC-004`).
- Transparent refresh prevents user workflow interruption during active work (`FR-007`).

---

## 6. Single-Tenant Data Isolation Pattern

### Decision
Enforce user ownership at both the NestJS guard level and data access layer:
- The authenticated user's ID (`req.user.id`) is extracted from the validated JWT payload by `JwtAuthGuard` and exposed via a custom decorator `@CurrentUser()`.
- Controllers pass `userId` to services; all Prisma queries strictly filter by `userId` (e.g., `where: { id: workspaceId, userId: currentUserId }`).
- NestJS global interceptors and validation pipes strip unauthorized fields.

### Rationale
- Fulfills `FR-012` and `SC-005` (100% data isolation; zero cross-account data leakage).
- Simple, direct, and impossible to bypass accidentally compared to complex dynamic query rewrites.

---

## 7. Shared Contracts (`packages/contracts`)

### Decision
Export all Auth & User DTOs, request payloads, response schemas, and error shapes from `packages/contracts/src/auth/` and `packages/contracts/src/user/`:
- `RegisterRequestDto`, `LoginRequestDto`, `ChangePasswordRequestDto`, `UpdateProfileRequestDto`
- `AuthResponseDto`, `UserSummaryDto`, `UserProfileDto`
- `ApiErrorResponse`

### Rationale
- Enforces strict compile-time type safety across frontend and backend as mandated by Constitution Principle III.
- Updating an API field in `packages/contracts` immediately highlights breaking changes in both `apps/api` and `apps/web` during `pnpm typecheck`.
