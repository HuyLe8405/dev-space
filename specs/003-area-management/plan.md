# Implementation Plan: Area Management (Feature 003)

**Branch**: `feature/003-area-management` | **Date**: 2026-11-05 | **Spec**: [`spec.md`](./spec.md)  
**UX Direction**: [`ux-design.md`](./ux-design.md)  
**Research**: [`research.md`](./research.md)  
**Data Model**: [`data-model.md`](./data-model.md)  
**Contracts**: [`contracts/area.contract.ts`](./contracts/area.contract.ts)  
**Quickstart**: [`quickstart.md`](./quickstart.md)  

---

## Summary

Feature 003 introduces Area Management into DevSpace, allowing users to divide their workspaces into focused, independent operational domains (such as "Backend Core", "Artificial Intelligence", or "Personal Development"). The technical implementation adds an `AreasModule` to the NestJS backend (`apps/api`) with fully nested REST routes under `/api/workspaces/:workspaceId/areas`. Database persistence is managed via Prisma ORM with strict cascade deletion from `Workspace` to `Area` and an integer `order` index for custom sequence sorting. The frontend implementation in Next.js 15 (`apps/web`) replaces the static workspace placeholder with a live, responsive Area management subsystem featuring an accessible horizontal tablist, optimistic drag-and-drop and keyboard reordering (`Alt+ArrowLeft/Right`), a streamlined 48px domain status bar, modal dialogs reusing curated visual presets, and shallow URL query parameter synchronization (`/workspaces/:workspaceId?area=:areaId`). Strict multi-tenant isolation is enforced at the backend service layer via atomic `{ id, workspaceId }` and `{ id: workspaceId, userId }` verifications returning uniform `404 Not Found` responses.

---

## Technical Context

- **Language & Runtime**: Node.js LTS (v20+ / v22+), TypeScript 5.8+ across all packages.
- **Monorepo & Package Manager**: `pnpm` workspaces (v10.15.1) with three primary targets: `apps/api`, `apps/web`, and `packages/contracts`.
- **Backend Architecture**: NestJS (v11) Modular Monolith with Express, `@nestjs/jwt`, `@nestjs/swagger`, `class-validator`, and `class-transformer`.
- **Database & Persistence**: PostgreSQL with Prisma ORM (`prisma`, `@prisma/client`) located at `apps/api/prisma/schema.prisma`.
- **Authentication & Security**: Integrated with Feature 001 via `JwtAuthGuard` and `@CurrentUser()` decorator; atomic server-side ownership checks on every area operation.
- **Frontend Architecture**: Next.js 15 (App Router), React 19, Tailwind CSS v3, `lucide-react`, React Context for Area state management.
- **Target Platform**: Modern desktop and mobile web browsers (Chromium, Firefox, Safari).
- **Scale & Scope (MVP)**: Personal single-user spaces; typical range 1–15 areas per workspace; zero multi-user collaboration or sharing.
- **Performance Goals**: Under 300ms tab switching (`SC-002`); under 10s area creation (`SC-001`); under 200ms p95 for API endpoints; zero UI flicker during reordering.
- **Constraints**: Strict 2D-first interface; no Three.js or 3D visualization; no project management entities (deferred to Feature 004); no component duplication.

---

## Constitution Check

*GATE: Verified against DevSpace Constitution v1.0.0*

| Principle | Gate Requirement | Status | Adherence Details |
|---|---|:---:|---|
| **I. Product Philosophy (2D-First, 3D-Enhanced)** | Core workspace management MUST be fully usable via standard 2D interfaces. | **PASS** | Area listing, creation, switching, reordering, editing, and deletion are implemented strictly as responsive 2D interfaces (horizontal tablist, modals, domain status bar). Zero 3D dependencies required. |
| **II. Monorepo & Modular Architecture** | Modular Monolith in NestJS, clear domain encapsulation, shared contracts package. | **PASS** | New domain encapsulated in `AreasModule` (`apps/api/src/modules/areas`). Shared DTOs and contracts live in `packages/contracts/src/areas`. Clean separation across apps and packages. |
| **III. Engineering Standards** | Strict static type safety, no unnecessary `any`, decoupled business logic. | **PASS** | Full type safety across contracts, Prisma, and frontend components. Business logic resides in `AreasService`; presentation components in `apps/web/src/features/areas`. |
| **IV. Purposeful 3D Development** | 3D scenes completely decoupled from application business logic and data persistence. | **PASS** | No 3D visualization code or dependencies are introduced in Feature 003. Staging canvas provides a clean 2D placeholder for future milestones. |
| **V. Pragmatic Quality & Testing** | Automated tests for critical logic and API contracts; no meaningless tests. | **PASS** | Unit tests for `AreasService` (CRUD, ownership isolation, atomic reorder transaction, duplicate name conflicts) and frontend component integration tests. |
| **VI. Minimum Quality Gates** | `typecheck`, `lint`, automated tests, and `build` MUST pass. | **PASS** | Strict verification enforced across all three packages (`contracts`, `api`, `web`). |
| **VII. Spec-Driven Workflow** | Specify → Clarify → Plan → Tasks → Analyze → Implement. | **PASS** | Follows the established Spec Kit lifecycle strictly; fully clarified in Session 2026-11-05. |

*Gate outcome: All constitutional gates passed with zero violations. No complexity justifications required.*

---

## Detailed Technical Architecture

### 1. Database Entities & Persistence Strategy

Prisma schema in `apps/api/prisma/schema.prisma`:
- **`Area` Table (`areas`)**:
  - `id`: CUID primary key (`@id @default(cuid())`).
  - `workspaceId`: Foreign key to `workspaces.id` with `onDelete: Cascade`.
  - `name`: String, 1–50 characters (trimmed).
  - `description`: Nullable string, max 280 characters.
  - `icon`: String token, default `"Layers"`.
  - `color`: String token, default `"indigo"`.
  - `order`: Integer, default `0`.
  - `createdAt`: DateTime, default `now()`.
  - `updatedAt`: DateTime, auto-updated (`@updatedAt`).
  - `workspace`: Relation to `Workspace` model (`fields: [workspaceId], references: [id], onDelete: Cascade`).
  - `@@index([workspaceId])`: Accelerates collection queries.
  - `@@index([workspaceId, order])`: Optimizes ordered list retrieval.
  - `@@unique([workspaceId, name])`: Compound unique constraint preventing duplicate names per workspace.
  - `@@map("areas")`
- **Migration**:
  - Generated via `prisma migrate dev --name add_areas`.

---

### 2. Backend Architecture: NestJS Modular Monolith

- **`AppModule`** (`apps/api/src/app.module.ts`):
  - Imports `AreasModule` alongside `WorkspacesModule`, `UsersModule`, `AuthModule`, and `PrismaModule`.
- **`AreasModule`** (`apps/api/src/modules/areas/`):
  - Encapsulates area business logic, validation, and REST controllers.
  - Providers: `AreasService`.
  - Controllers: `AreasController`.
  - Exports: `AreasService`.
- **`AreasController`** (`apps/api/src/modules/areas/areas.controller.ts`):
  - Protected with `@UseGuards(JwtAuthGuard)`.
  - Nested Route Base: `@Controller('workspaces/:workspaceId/areas')`
  - Endpoints:
    - `POST /` -> `create()` (201 Created)
    - `GET /` -> `findAll()` (200 OK)
    - `PUT /reorder` -> `reorder()` (200 OK)
    - `GET /:areaId` -> `findOne()` (200 OK)
    - `PATCH /:areaId` -> `update()` (200 OK)
    - `DELETE /:areaId` -> `remove()` (200 OK)
- **`AreasService`** (`apps/api/src/modules/areas/areas.service.ts`):
  - `create(userId, workspaceId, dto)`:
    1. Verifies user owns `workspaceId` via `prisma.workspace.findFirst({ where: { id: workspaceId, userId } })`. Throws `NotFoundException('Workspace not found')` if missing.
    2. Trims `dto.name`. Checks case-insensitive duplicate in workspace. Throws `ConflictException` if duplicate exists.
    3. Calculates `nextOrder = (max(order) ?? -1) + 1`.
    4. Inserts record and returns `AreaDto`.
  - `findAllForWorkspace(userId, workspaceId)`:
    1. Verifies workspace ownership.
    2. Queries `prisma.area.findMany({ where: { workspaceId }, orderBy: { order: 'asc' } })`.
    3. Returns `{ items: areas.map(toDto), total: areas.length }`.
  - `findOne(userId, workspaceId, areaId)`:
    1. Verifies workspace ownership.
    2. Queries `prisma.area.findFirst({ where: { id: areaId, workspaceId } })`. Throws `NotFoundException('Area not found')` if null.
    3. Returns `AreaDto`.
  - `update(userId, workspaceId, areaId, dto)`:
    1. Verifies workspace and area existence/ownership via `findOne`.
    2. If `dto.name` provided: trims name, checks case-insensitive duplicate against sibling areas (`where: { workspaceId, id: { not: areaId } }`).
    3. Updates fields and returns updated `AreaDto`.
  - `remove(userId, workspaceId, areaId)`:
    1. Verifies workspace and area existence/ownership via `findOne`.
    2. Executes `prisma.area.delete({ where: { id: areaId } })`.
    3. Returns `{ success: true }`.
  - `reorder(userId, workspaceId, dto)`:
    1. Verifies workspace ownership.
    2. Fetches all existing area IDs for `workspaceId`.
    3. Validates that `dto.areaIds` matches the exact set and length of existing IDs. Throws `BadRequestException` if mismatched.
    4. Executes `prisma.$transaction`:
       `dto.areaIds.map((id, index) => prisma.area.update({ where: { id }, data: { order: index } }))`.
    5. Returns updated list of areas ordered by `order ASC`.

---

### 3. Ownership & Authorization Enforcement

- **Two-Tier Boundary Validation**:
  - Tier 1: User owns Workspace (`workspace.userId === user.id`).
  - Tier 2: Area belongs to Workspace (`area.workspaceId === workspaceId`).
- **Uniform 404 Response**:
  - Any request targeting an area or workspace not owned by the authenticated user returns a uniform `404 Not Found` response.
  - Zero leakage of resource existence or ownership metadata to unauthorized users.

---

### 4. Shared Contracts (`packages/contracts`)

- **New Submodule**: `packages/contracts/src/areas/area.dto.ts` (re-exported in `packages/contracts/src/index.ts`):
  - `DEFAULT_AREA_ICON = 'Layers'`
  - `DEFAULT_AREA_COLOR = 'indigo'`
  - `AreaDto`: Interface representing an Area entity.
  - `CreateAreaRequest`: `{ name: string; description?: string; icon?: WorkspaceIcon; color?: WorkspaceColor }`
  - `UpdateAreaRequest`: `{ name?: string; description?: string | null; icon?: WorkspaceIcon; color?: WorkspaceColor }`
  - `ReorderAreasRequest`: `{ areaIds: string[] }`
  - `AreaListResponse`: `{ items: AreaDto[]; total: number }`

---

### 5. Frontend State & Navigation Architecture (`apps/web`)

- **Context & Hook (`apps/web/src/features/areas/`)**:
  - `AreaContext` (`context/area-context.tsx`):
    - State: `areas: AreaDto[]`, `activeArea: AreaDto | null`, `isLoading: boolean`, `error: string | null`.
    - Methods: `refreshAreas()`, `createArea()`, `updateArea()`, `deleteArea()`, `reorderAreas(newOrder: AreaDto[])`.
    - Synchronizes `activeArea` with `useSearchParams().get('area')`.
    - Caches the last-viewed area ID per workspace in `localStorage` (`devspace:last_area_${workspaceId}`).
  - `useAreas()` (`hooks/use-areas.ts`): Consumer hook providing area context.
- **Component Subsystem**:
  - `AreaNavigationStrip` (`components/area-navigation-strip.tsx`):
    - WAI-ARIA `role="tablist"` flex track with smooth horizontal scrolling.
    - Pinned non-scrolling trailing slot housing the `+ New Area` button.
    - Subtle edge gradient scroll mask indicating tab overflow.
  - `AreaTabItem` (`components/area-tab-item.tsx`):
    - `role="tab"` element with active accent pill, theme icon, truncated label with native `title` and tooltip.
    - Drag handle with tooltip: *"Drag to reorder, or use Alt+Left/Right"*.
    - Accessible keyboard reorder handlers (`Alt + ArrowLeft/Right`).
  - `AreaCanvas` (`components/area-canvas.tsx`):
    - `role="tabpanel"` hosting the Streamlined Domain Status Bar (32x32 icon, `h2` title, "Area X of Y" badge, `[Edit Area]`, `[Delete Area]` actions).
    - Future Project Staging Canvas (calm 2D container for Feature 004).
  - `CreateAreaDialog` (`components/create-area-dialog.tsx`):
    - Accessible modal dialog reusing `<IconPicker />` and `<ColorPicker />`.
    - Client-side unique name validation and autofocus.
  - `EditAreaDialog` (`components/edit-area-dialog.tsx`):
    - Pre-populated modal form preserving unchanged fields.
  - `DeleteAreaDialog` (`components/delete-area-dialog.tsx`):
    - Destructive confirmation modal with consequence warning and red confirmation button.
  - `WorkspaceEmptyAreasState` (`components/workspace-empty-areas-state.tsx`):
    - Welcoming hero card rendered inside the canvas when a workspace has 0 areas.
- **Integration with Workspace**:
  - `WorkspaceOverview` (`apps/web/src/features/workspaces/components/workspace-overview.tsx`):
    - Wraps the canvas area with `<AreaProvider workspaceId={workspace.id}>`.
    - Renders `<AreaNavigationStrip />` followed by either `<AreaCanvas />` (if areas exist) or `<WorkspaceEmptyAreasState />` (if zero areas).

---

## Project Structure & Source Layout

```text
dev-space/
├── packages/
│   └── contracts/
│       └── src/
│           ├── areas/
│           │   └── area.dto.ts                  # Area contracts, requests, responses
│           └── index.ts                         # Re-exports area contracts
│
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   └── schema.prisma                    # Adds Area model and Workspace relation
│   │   └── src/
│   │       ├── app.module.ts                    # Imports AreasModule
│   │       └── modules/
│   │           └── areas/
│   │               ├── dto/
│   │               │   ├── create-area.dto.ts   # class-validator DTO
│   │               │   ├── update-area.dto.ts   # class-validator DTO
│   │               │   └── reorder-areas.dto.ts # class-validator DTO
│   │               ├── areas.controller.ts      # Nested REST endpoints
│   │               ├── areas.module.ts          # Module definition
│   │               ├── areas.service.ts         # Business logic & ownership
│   │               └── areas.service.spec.ts    # Unit tests
│   │
│   └── web/
│       └── src/
│           └── features/
│               ├── areas/
│               │   ├── components/
│               │   │   ├── area-canvas.tsx
│               │   │   ├── area-navigation-strip.tsx
│               │   │   ├── area-tab-item.tsx
│               │   │   ├── create-area-dialog.tsx
│               │   │   ├── edit-area-dialog.tsx
│               │   │   ├── delete-area-dialog.tsx
│               │   │   └── workspace-empty-areas-state.tsx
│               │   ├── context/
│               │   │   └── area-context.tsx
│               │   └── hooks/
│               │       └── use-areas.ts
│               └── workspaces/
│                   └── components/
│                       └── workspace-overview.tsx  # Mounts Area subsystem
│
└── specs/
    └── 003-area-management/
        ├── spec.md                              # Approved specification
        ├── ux-design.md                         # UX/UI design direction
        ├── research.md                          # Phase 0 architectural decisions
        ├── data-model.md                        # Phase 1 data modeling & lifecycle
        ├── contracts/
        │   └── area.contract.ts                 # Phase 1 contract definition
        ├── quickstart.md                        # Phase 1 validation & test guide
        └── plan.md                              # This implementation plan
```

---

## Complexity Tracking

> *No constitutional violations. Zero complexity exceptions required.*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| None | N/A | N/A |
