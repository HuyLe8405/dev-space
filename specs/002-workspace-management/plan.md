# Implementation Plan: Workspace Management (Feature 002)

**Branch**: `002-workspace-management` | **Date**: 2026-11-04 | **Spec**: [`spec.md`](./spec.md)  
**UX Direction**: [`ux-design.md`](./ux-design.md)  
**Research**: [`research.md`](./research.md)  
**Data Model**: [`data-model.md`](./data-model.md)  
**Contracts**: [`contracts/workspace.contract.ts`](./contracts/workspace.contract.ts)  
**Quickstart**: [`quickstart.md`](./quickstart.md)  

---

## Summary

Feature 002 implements independent personal workspace management for DevSpace, establishing the primary container for all downstream Areas, Projects, and spatial knowledge structures. The implementation integrates a new `WorkspacesModule` within the existing NestJS Modular Monolith (`apps/api`), backed by PostgreSQL via Prisma ORM with strict database-level cascade deletion. Frontend implementation in Next.js 15 App Router (`apps/web`) introduces a top-header workspace switcher dropdown, an active workspace overview canvas, accessible modal dialogs for creation and editing with curated visual tokens (12 icons, 8 colors), and a type-to-confirm modal for destructive deletion. Complete multi-tenant privacy is enforced on the backend via atomic `{ id, userId }` queries returning uniform `404 Not Found` responses.

---

## Technical Context

- **Language & Runtime**: Node.js LTS (v20+ / v22+), TypeScript 5.8+ across all packages.
- **Monorepo & Package Manager**: `pnpm` workspaces (v10.15.1) with three primary targets: `apps/api`, `apps/web`, and `packages/contracts`.
- **Backend Architecture**: NestJS (v11) Modular Monolith with Express platform, `@nestjs/jwt`, `@nestjs/swagger`, `class-validator`, and `class-transformer`.
- **Database & Persistence**: PostgreSQL with Prisma ORM (`prisma`, `@prisma/client`) located at `apps/api/prisma/schema.prisma`.
- **Authentication & Security**: Integrated with Feature 001 via `JwtAuthGuard` and `@CurrentUser()` decorator; atomic server-side ownership checks on every workspace mutation.
- **Frontend Architecture**: Next.js 15 (App Router), React 19, Tailwind CSS v3, `lucide-react`, React Context for workspace state.
- **Target Platform**: Modern desktop and mobile web browsers (Chromium, Firefox, Safari).
- **Scale & Scope (MVP)**: Personal single-user workspaces; typical range 1–10 workspaces per user; zero collaboration, workspace invitations, or role-based access control.
- **Performance Targets**: Under 500ms workspace switching (`SC-002`); under 15s workspace creation (`SC-001`); under 200ms p95 for API responses.

---

## Constitution Check

*GATE: Verified against DevSpace Constitution v1.0.0*

| Principle | Gate Requirement | Status | Adherence Details |
|---|---|---|---|
| **I. Product Philosophy (2D-First, 3D-Enhanced)** | Core workspace management MUST be fully usable via standard 2D interfaces. | **PASS** | Workspace listing, creation, switching, editing, and deletion are entirely 2D interfaces (header dropdown, modals, overview canvas). Zero 3D dependencies required. |
| **II. Monorepo & Modular Architecture** | Modular Monolith in NestJS, clear domain encapsulation, shared contracts package. | **PASS** | New domain encapsulated in `WorkspacesModule` (`apps/api/src/modules/workspaces`). Shared DTOs and constants live in `packages/contracts/src/workspaces`. Decoupled from `AuthModule`. |
| **III. Engineering Standards** | Strict static type safety, no unnecessary `any`, decoupled business logic. | **PASS** | Strong typing from shared contracts, strict TypeScript across packages, clear separation between Prisma persistence, NestJS services, and React UI. |
| **IV. Purposeful 3D Development** | 3D scenes completely decoupled from application business logic and data stores. | **PASS** | Canvas container provides an empty boundary ready for future 3D features, but contains no 3D rendering or WebGL code in Feature 002. |
| **V. Pragmatic Quality & Testing** | Automated tests for critical logic and API contracts; no meaningless tests. | **PASS** | Unit tests for `WorkspacesService` ownership filtering and validation; E2E integration tests for multi-tenant isolation and CRUD lifecycles. |
| **VI. Minimum Quality Gates** | `typecheck`, `lint`, automated tests, and `build` MUST pass. | **PASS** | Strict verification enforced across all three packages (`contracts`, `api`, `web`). |
| **VII. Spec-Driven Workflow** | Specify → Clarify → Plan → Tasks → Analyze → Implement. | **PASS** | Follows the established Spec Kit lifecycle strictly. |

*Gate outcome: All constitutional gates passed with zero violations. No complexity justifications required.*

---

## Detailed Technical Architecture

### 1. Backend Architecture: NestJS Modular Monolith

The backend in `apps/api` incorporates a dedicated `WorkspacesModule`:
- **`AppModule`** (`apps/api/src/app.module.ts`):
  - Imports `WorkspacesModule` alongside `AuthModule`, `UsersModule`, and `PrismaModule`.
- **`WorkspacesModule`** (`apps/api/src/modules/workspaces/`):
  - Encapsulates workspace persistence, business logic, authorization, and endpoints.
  - Providers: `WorkspacesService`.
  - Controllers: `WorkspacesController`.
- **`WorkspacesService`**:
  - `create(userId: string, dto: CreateWorkspaceDto)`: Trims name, applies defaults for `icon` (`"Briefcase"`) and `color` (`"blue"`), inserts record.
  - `findAllForUser(userId: string)`: Queries all workspaces ordered by `createdAt DESC`.
  - `findOne(userId: string, id: string)`: Atomic query `where: { id, userId }`. Throws `NotFoundException('Workspace not found')` if null.
  - `update(userId: string, id: string, dto: UpdateWorkspaceDto)`: Verifies ownership atomically, updates provided fields, returns updated entity.
  - `remove(userId: string, id: string)`: Verifies ownership atomically, executes permanent hard delete via Prisma.
- **`WorkspacesController`**:
  - Protected with `@UseGuards(JwtAuthGuard)`.
  - `POST /api/workspaces` -> `create()` (201 Created).
  - `GET /api/workspaces` -> `findAllForUser()` (200 OK).
  - `GET /api/workspaces/:id` -> `findOne()` (200 OK).
  - `PATCH /api/workspaces/:id` -> `update()` (200 OK).
  - `DELETE /api/workspaces/:id` -> `remove()` (200 OK).

### 2. Database Entities & Persistence Strategy

Prisma schema in `apps/api/prisma/schema.prisma`:
- **`Workspace` Table (`workspaces`)**:
  - `id`: CUID primary key.
  - `userId`: Foreign key to `users.id` with `onDelete: Cascade`.
  - `name`: String, 1–50 characters.
  - `description`: Nullable string, max 280 characters.
  - `icon`: String, default `"Briefcase"`.
  - `color`: String, default `"blue"`.
  - `createdAt`: DateTime, default `now()`.
  - `updatedAt`: DateTime, auto-updated.
  - `@@index([userId])`: Optimizes user workspace listings.
- **Migration**:
  - Generated via `prisma migrate dev --name add_workspaces`.

### 3. Ownership & Authorization Enforcement

- **Strict Server-Side Isolation**: Every service method extracts `userId` from the verified JWT payload (`req.user.id`).
- **Enumeration Defense (FR-018 & Q3 Clarification)**:
  - If a user requests, updates, or deletes a workspace ID that belongs to another user or does not exist, the query returns no record and throws a uniform `NotFoundException('Workspace not found')`.
  - No `403 Forbidden` response is returned, preventing attackers from confirming the existence of foreign workspace IDs.

### 4. Shared Contracts (`packages/contracts`)

Exported from `packages/contracts/src/workspaces/` and re-exported in root `index.ts`:
- **DTOs & Interfaces**:
  - `WorkspaceDto`: Shape of returned workspace record.
  - `CreateWorkspaceRequest`: Payload for workspace creation.
  - `UpdateWorkspaceRequest`: Partial payload for workspace edits.
  - `WorkspaceListResponse`: `{ items: WorkspaceDto[], total: number }`.
- **Validation Presets**:
  - `WORKSPACE_ICONS`: 12 curated icon strings.
  - `WORKSPACE_COLORS`: 8 curated color strings.
  - `DEFAULT_WORKSPACE_ICON = 'Briefcase'`.
  - `DEFAULT_WORKSPACE_COLOR = 'blue'`.

### 5. Frontend State & Navigation Architecture (`apps/web`)

- **Routing Topology**:
  - `/workspaces/:workspaceId`: Main workspace canvas for the selected workspace.
  - `/workspaces`: Root route that checks client storage (`devspace:last_workspace_id`) or user's workspace list. If workspaces exist, redirects to active workspace; if zero workspaces exist, renders the **Onboarding Empty State**.
- **Context & Hook (`apps/web/src/features/workspaces/`)**:
  - `WorkspaceContext` (`context/workspace-context.tsx`):
    - State: `workspaces: WorkspaceDto[]`, `activeWorkspace: WorkspaceDto | null`, `isLoading: boolean`.
    - Methods: `refreshWorkspaces()`, `createWorkspace()`, `updateWorkspace()`, `deleteWorkspace()`.
    - Automatically syncs active workspace with the route param `:workspaceId` and caches the ID in `localStorage`.
  - `useWorkspaces()` (`hooks/use-workspaces.ts`): Clean consumer hook.
- **UI Components**:
  - `WorkspaceSwitcher` (`components/workspace-switcher.tsx`): Integrated into `ApplicationHeader`, renders active pill with icon/color, dropdown list, active checkmark, and `+ Create Workspace` action.
  - `WorkspaceOverview` (`components/workspace-overview.tsx`): Header with large icon badge, title, description, timestamp, and action buttons (`Edit`, `Delete`), plus future-ready canvas area.
  - `CreateWorkspaceDialog` (`components/create-workspace-dialog.tsx`): Accessible modal with name input, icon picker grid, color picker swatches, description textarea, and validation.
  - `EditWorkspaceDialog` (`components/edit-workspace-dialog.tsx`): Pre-populated modal preserving unmodified fields.
  - `DeleteWorkspaceDialog` (`components/delete-workspace-dialog.tsx`): Destructive modal requiring user to type exact workspace name to unlock deletion.
  - `OnboardingEmptyState` (`components/empty-state.tsx`): Welcoming hero card displayed when user has zero workspaces.
  - `WorkspaceNotFound` (`components/workspace-not-found.tsx`): 404 fallback screen.

---

## Project Structure & Source Layout

```text
dev-space/
├── packages/
│   └── contracts/
│       └── src/
│           ├── auth/                     # Feature 001 auth contracts
│           ├── workspaces/               # Feature 002 workspace contracts
│           │   ├── workspace.dto.ts      # WorkspaceDto, Create/Update requests, presets
│           │   └── index.ts
│           └── index.ts                  # Re-exports all contracts
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma             # Added Workspace model & User relation
│   │   │   └── migrations/               # Schema migrations
│   │   ├── src/
│   │   │   ├── common/                   # Reused guards, decorators, prisma service
│   │   │   ├── modules/
│   │   │   │   ├── auth/                 # Feature 001 AuthModule
│   │   │   │   ├── users/                # Feature 001 UsersModule
│   │   │   │   └── workspaces/           # Feature 002 WorkspacesModule
│   │   │   │       ├── dto/
│   │   │   │       │   ├── create-workspace.dto.ts
│   │   │   │       │   └── update-workspace.dto.ts
│   │   │   │       ├── workspaces.controller.ts
│   │   │   │       ├── workspaces.module.ts
│   │   │   │       ├── workspaces.service.spec.ts
│   │   │   │       └── workspaces.service.ts
│   │   │   ├── app.module.ts             # Registered WorkspacesModule
│   │   │   └── main.ts
│   │   └── test/
│   │       └── workspaces.e2e-spec.ts    # Workspace API E2E tests
│   └── web/
│       └── src/
│           ├── app/
│           │   └── (dashboard)/
│           │       └── workspaces/
│           │           ├── page.tsx                    # Root redirect / empty state
│           │           └── [workspaceId]/
│           │               └── page.tsx                # Workspace canvas view
│           ├── components/
│           │   └── navigation/
│           │       └── header.tsx                      # Integrated WorkspaceSwitcher
│           └── features/
│               └── workspaces/
│                   ├── context/
│                   │   └── workspace-context.tsx       # Global workspace state
│                   ├── hooks/
│                   │   └── use-workspaces.ts           # Consumer hook
│                   └── components/
│                       ├── workspace-switcher.tsx      # Header dropdown
│                       ├── workspace-overview.tsx      # Canvas overview header
│                       ├── create-workspace-dialog.tsx # Creation modal
│                       ├── edit-workspace-dialog.tsx   # Edit modal
│                       ├── delete-workspace-dialog.tsx # Type-to-confirm modal
│                       ├── empty-state.tsx             # Onboarding zero-state
│                       ├── workspace-not-found.tsx     # 404 fallback screen
│                       ├── icon-picker.tsx             # Curated icon grid
│                       └── color-picker.tsx            # Curated color swatches
└── specs/
    └── 002-workspace-management/
        ├── spec.md
        ├── ux-design.md
        ├── plan.md                                     # This plan
        ├── research.md
        ├── data-model.md
        ├── quickstart.md
        ├── contracts/
        │   └── workspace.contract.ts
        └── checklists/
            └── requirements.md
```

---

## Complexity Tracking

*No constitutional violations. Zero unwarranted abstractions.*

| Aspect | Decision | Simpler Alternative Evaluated & Rejected |
|---|---|---|
| **Multi-Tenant Authorization** | Atomic query filtering by `{ id, userId }` returning uniform 404 | Separate Guard + Controller query: Rejected because it doubles DB roundtrips and introduces race conditions. |
| **Active State Tracking** | URL-first (`/workspaces/:id`) with local fallback storage | Database `lastActiveWorkspaceId` on User Profile: Rejected because it introduces write latency on every click, requires DB migration on Feature 001, and breaks multi-tab independence. |
| **Deletion Safety** | Interactive type-to-confirm modal | Simple click confirmation: Rejected because workspace deletion cascades to all contained areas and projects; positive friction prevents catastrophic data loss. |
| **Visual Metadata** | Curated 12 icons & 8 color tokens | Open hex string `#RRGGBB`: Rejected because it causes dark/light theme contrast breakage and lacks type safety in shared contracts. |
