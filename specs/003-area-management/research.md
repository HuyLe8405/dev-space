# Technical Research & Architectural Decisions — Feature 003: Area Management

**Feature**: Area Management  
**Status**: Completed & Approved  
**Date**: 2026-11-05  

This document records the architectural investigations, trade-off evaluations, and concrete technology decisions for implementing **Feature 003: Area Management** in DevSpace.

---

## 1. Database Schema & Data Modeling

### Decision: Dedicated `areas` Table with Foreign Key to `workspaces` and Integer Ordering

- **Entity Structure**:
  - `id`: CUID string primary key.
  - `workspaceId`: Foreign key to `workspaces.id` with `onDelete: Cascade`.
  - `name`: String (1–50 characters, trimmed).
  - `description`: Nullable string (max 280 characters, trimmed).
  - `icon`: String token (default `"Layers"`), validated against curated preset list.
  - `color`: String token (default `"indigo"`), validated against curated theme palette.
  - `order`: Non-negative integer (0-indexed sequence position within the workspace).
  - `createdAt`: DateTime, default `now()`.
  - `updatedAt`: DateTime, auto-updated.

- **Indexes**:
  - `@@index([workspaceId])`: Fast lookup of all areas in a workspace.
  - `@@index([workspaceId, order])`: Fast retrieval pre-sorted by display sequence.
  - Compound unique constraint `@@unique([workspaceId, name])` combined with application-level lowercase trimming to prevent duplicate area names in the same workspace.

### Rationale
- An Area belongs strictly to exactly one Workspace. Cascade deletion ensures that deleting a Workspace cleanly removes all subordinate Areas without orphaned records.
- Integer sequencing (`order: 0, 1, 2, ...`) directly reflects the user's custom sort order without floating-point precision issues.

### Alternatives Considered & Rejected
- **Storing areas as a JSON array inside the Workspace record**: Rejected because downstream Feature 004 (Project Management) requires relational foreign keys to `areas.id` for project scoping and database-level cascades.
- **Global uniqueness for area names**: Rejected because distinct workspaces (e.g. "Work" and "Personal") should both be able to have an area named "Frontend" or "Research".

---

## 2. Reordering Architecture & Persistence

### Decision: Atomic Batch Reorder Payload (`PUT /workspaces/:workspaceId/areas/reorder`)

- **API Contract**:
  - Endpoint: `PUT /api/workspaces/:workspaceId/areas/reorder`
  - Body: `{ areaIds: string[] }`
  - Response: `{ items: AreaDto[], total: number }`
- **Execution Strategy**:
  1. Verify authenticated user owns `:workspaceId`.
  2. Fetch all existing Areas in the workspace.
  3. Validate that `areaIds` contains the exact set of IDs for that workspace (no foreign IDs, no missing IDs, no duplicates).
  4. Execute a single Prisma interactive transaction (`prisma.$transaction`) updating each area's `order` field to its array index `0, 1, 2, ...`.
  5. Return the updated areas sorted by `order: 'asc'`.

### Rationale
- For personal workspaces where area counts range from 1 to 20, batch array replacement is completely deterministic, atomic, and immune to off-by-one re-indexing race conditions.
- If any ID is missing, duplicate, or belongs to another workspace, the entire transaction rolls back and returns a validation error.

### Alternatives Considered & Rejected
- **Pairwise Move (`PATCH /areas/:id/move { targetIndex }`)**: Rejected due to state synchronization fragility and multi-row shifting calculations that can get out of sync if consecutive reorder actions arrive out of order.
- **Fractional / Lexorank Ordering**: Rejected as premature over-engineering for an MVP; fractional keys require rebalancing logic and complicate database queries.

---

## 3. Workspace Ownership & Boundary Enforcement

### Decision: Fully Nested REST Routes with Uniform 404 Authorization Defense

- **Route Topology**:
  - `POST /api/workspaces/:workspaceId/areas` (Create Area)
  - `GET /api/workspaces/:workspaceId/areas` (List Areas, ordered by `order ASC`)
  - `GET /api/workspaces/:workspaceId/areas/:areaId` (Get Area details)
  - `PATCH /api/workspaces/:workspaceId/areas/:areaId` (Update Area)
  - `DELETE /api/workspaces/:workspaceId/areas/:areaId` (Delete Area)
  - `PUT /api/workspaces/:workspaceId/areas/reorder` (Batch Reorder Areas)

- **Verification Lifecycle**:
  - Every service method receives `(userId, workspaceId, ...)`.
  - **Step 1: Workspace Check**:
    ```typescript
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: workspaceId, userId },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    ```
  - **Step 2: Area Parentage Check** (for item mutations):
    ```typescript
    const area = await this.prisma.area.findFirst({
      where: { id: areaId, workspaceId },
    });
    if (!area) throw new NotFoundException('Area not found');
    ```
  - **Uniform 404 Not Found**: Any attempt by User B to query User A's workspace or areas returns `404 Not Found`, eliminating ID enumeration.

### Rationale
- Explicit URL nesting (`/workspaces/:workspaceId/areas/...`) guarantees that the workspace boundary is always evaluated.
- A user cannot mutate an area without asserting its parent workspace ID, preventing cross-workspace manipulation.

---

## 4. Frontend State & Navigation Synchronization

### Decision: URL Query Parameter Navigation (`/workspaces/:workspaceId?area=:areaId`) with Context Provider

- **Routing Model**:
  - Page Route: `apps/web/src/app/(dashboard)/workspaces/[workspaceId]/page.tsx`
  - Area Parameter: Read via `useSearchParams()` (`searchParams.get('area')`).
  - Navigation: `router.replace(`/workspaces/${workspaceId}?area=${areaId}`, { scroll: false })`.
- **Selection Resolution Hierarchy**:
  1. If `?area={id}` is in the URL and exists in the workspace's area list → Select it.
  2. Else if `localStorage` has a last-viewed area ID for this workspace and it exists → Select it and update the URL query.
  3. Else if areas exist (`length > 0`) → Select the first area (`areas[0]`) and update the URL query.
  4. Else (`length === 0`) → `activeArea = null`, render `<WorkspaceEmptyAreasState />`.
- **Nonexistent Area Graceful Recovery**:
  - If a user opens a link with an invalid area ID (deleted or foreign), the hook detects that the ID is missing from the loaded areas, falls back to the first area, updates the URL silently, and presents an informative toast.

### Rationale
- Keeps `WorkspaceOverview` mounted without page unmounting, layout shifting, or route remounts.
- Switching areas feels instant (<300ms) while preserving full bookmarking, browser back/forward history, and deep linking.

---

## 5. UI Ergonomics & Component Architecture

### Decision: Consolidated Domain Status Bar & Pinned Navigation Track

- **Area Navigation Bar**:
  - Integrated into `WorkspaceOverview` directly beneath the Workspace Header.
  - Flex track with `overflow-x-auto no-scrollbar` for tabs, plus a pinned, non-scrolling trailing slot for the `+ New Area` button.
  - Drag handle on each tab with hover/focus tooltip: *"Drag to reorder, or use Alt+Left/Right"*.
  - Tab titles have native `title={area.name}` and responsive max-width (`max-w-[130px] sm:max-w-[180px]`) to prevent prefix truncation confusion.
- **Streamlined Domain Status Bar (48px)**:
  - Replaces the bulky 120px stacked card with a compact bar: 32x32 theme icon, `h2` area title, sequence badge ("Area 1 of 4"), description, and compact `[Edit Area]` and `[Delete Area]` controls.
  - Saves ~140px vertical space, allowing the future project canvas to be immediately visible.
- **Two-Step Destructive Deletion Modal**:
  - Clear consequence warning; red "Delete Area" confirmation button with default focus on "Cancel". No typed name required for MVP.

---

## 6. Shared Contracts (`packages/contracts`)

### Decision: Extension of Contracts Package with Area Types

- **Location**: `packages/contracts/src/areas/area.dto.ts`
- **Presets Reused**:
  - Reuses `WorkspaceIcon` and `WorkspaceColor` to guarantee unified theme tokens and avoid redundant icon/color configurations.
  - `DEFAULT_AREA_ICON: WorkspaceIcon = 'Layers'`
  - `DEFAULT_AREA_COLOR: WorkspaceColor = 'indigo'`
- **Exported DTOs**:
  - `AreaDto`: Complete representation of an Area record.
  - `CreateAreaRequest`: `{ name, description?, icon?, color? }`
  - `UpdateAreaRequest`: `{ name?, description?, icon?, color? }`
  - `ReorderAreasRequest`: `{ areaIds: string[] }`
  - `AreaListResponse`: `{ items: AreaDto[], total: number }`

