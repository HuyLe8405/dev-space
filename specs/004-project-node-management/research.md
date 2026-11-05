# Technical Research & Architectural Decisions — Feature 004: Project & Node Management

**Feature**: Project & Node Management  
**Status**: Completed & Approved  
**Date**: 2026-11-05  

This document records the architectural investigations, trade-off evaluations, and concrete technology decisions for implementing **Feature 004: Project & Node Management** in DevSpace.

---

## 1. Relational Data Modeling & Cascading Strategy

### Decision: Dedicated `projects`, `nodes`, and `node_relationships` Tables with Database-Level Cascades

- **`Project` Entity**:
  - `id`: CUID string primary key (`@id @default(cuid())`).
  - `areaId`: Foreign key to `areas.id` with `onDelete: Cascade`.
  - `name`: String (1–50 characters, trimmed).
  - `description`: Nullable string (max 280 characters, trimmed).
  - `icon`: String token (default `"Folder"`), validated against curated preset list in `@devspace/contracts`.
  - `color`: String token (default `"cyan"`), validated against 8-color theme palette in `@devspace/contracts`.
  - `createdAt`: DateTime (`@default(now())`).
  - `updatedAt`: DateTime (`@updatedAt`).
  - Indexes:
    - `@@index([areaId])`: Fast lookup of projects within an Area.
    - `@@index([areaId, updatedAt])`: Optimizes default recency sorting.
    - `@@unique([areaId, name])`: Compound unique constraint preventing duplicate project names within the same Area (with application-level case-insensitive trimming).

- **`Node` Entity**:
  - `id`: CUID string primary key (`@id @default(cuid())`).
  - `projectId`: Foreign key to `projects.id` with `onDelete: Cascade`.
  - `name`: String (1–50 characters, trimmed).
  - `description`: Nullable string (max 280 characters, trimmed).
  - `nodeType`: Enum `NodeType` (`CONCEPT`, `COMPONENT`, `SERVICE`, `MODULE`, `DATABASE`, `INTERFACE`, `CUSTOM`), default `CONCEPT`.
  - `createdAt`: DateTime (`@default(now())`).
  - `updatedAt`: DateTime (`@updatedAt`).
  - Indexes:
    - `@@index([projectId])`: Fast lookup of nodes within a Project.
    - `@@index([projectId, createdAt])`: Optimizes chronological node display.
    - `@@unique([projectId, name])`: Compound unique constraint preventing duplicate node names within the same Project.

- **`NodeRelationship` Entity**:
  - `id`: CUID string primary key (`@id @default(cuid())`).
  - `projectId`: Foreign key to `projects.id` with `onDelete: Cascade`.
  - `sourceNodeId`: Foreign key to `nodes.id` with `onDelete: Cascade`.
  - `targetNodeId`: Foreign key to `nodes.id` with `onDelete: Cascade`.
  - `type`: Enum `RelationType` (`RELATES_TO`, `DEPENDS_ON`, `CONTAINS`), default `RELATES_TO`.
  - `label`: Nullable string (max 100 characters, trimmed).
  - `createdAt`: DateTime (`@default(now())`).
  - `updatedAt`: DateTime (`@updatedAt`).
  - Indexes:
    - `@@index([projectId])`: Fast lookup of all relationships within a Project.
    - `@@index([sourceNodeId])`: Fast lookup of outgoing edges.
    - `@@index([targetNodeId])`: Fast lookup of incoming edges.
    - `@@unique([projectId, sourceNodeId, targetNodeId, type])`: Compound unique constraint preventing duplicate connections of the same type and direction between the same pair of nodes.

### Rationale
- Setting database-level `onDelete: Cascade` across the hierarchy (`Area -> Project -> Node -> NodeRelationship`) guarantees that deleting an Area or Project automatically removes all subordinate entities in PostgreSQL without leaving orphaned records or requiring multi-step application cleanup.
- Storing relationships in a first-class relational join table with foreign keys to both `sourceNodeId` and `targetNodeId` ensures relational integrity; if either connected Node is deleted, PostgreSQL immediately removes the relationship edge.

### Alternatives Considered & Rejected
- **Storing nodes or relationships as JSON arrays inside `projects`**: Rejected because JSON arrays prevent database-level foreign key constraints, prevent atomic updates to individual nodes, complicate validation, and block standard relational indexing.
- **Adding 3D coordinates (`positionX`, `positionY`, `positionZ`)**: Rejected in strict accordance with Constitution Principle I (2D-First) and Principle IV (Purposeful 3D Development). 3D scene positioning is an ephemeral visualization concern that must remain decoupled from domain models.

---

## 2. Authorization & Ownership Chain Architecture

### Decision: Deep Relational Ownership Verification Returning Uniform `404 Not Found`

- **Hierarchy Chain**: `User` → `Workspace` → `Area` → `Project` → `Node` (and `NodeRelationship`).
- **Implementation Strategy**:
  - All operations are protected by `JwtAuthGuard` and inject the authenticated user via `@CurrentUser()`.
  - In `ProjectsService`:
    ```typescript
    const area = await this.prisma.area.findFirst({
      where: {
        id: areaId,
        workspaceId,
        workspace: { userId },
      },
    });
    if (!area) throw new NotFoundException('Area not found');
    ```
  - In `NodesService` & `NodeRelationshipsService`:
    ```typescript
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        areaId,
        area: {
          workspaceId,
          workspace: { userId },
        },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    ```

### Rationale
- A single relational query checks the entire ownership ancestry using PostgreSQL indexed joins.
- Uniform `404 Not Found` prevents cross-tenant resource enumeration and path manipulation (e.g., requesting a Project under a foreign Area ID returns 404 whether the project exists or not).

### Alternatives Considered & Rejected
- **Shallow ID lookups without parent validation**: Rejected because it would allow cross-workspace tampering if an attacker guesses a valid Project ID under a different Workspace path.
- **Returning `403 Forbidden` on mismatched parentage**: Rejected because it leaks the existence of the resource to unauthorized callers.

---

## 3. Project Ordering & Collection Fetching Strategy

### Decision: Unpaginated Collections with Automatic Recency Sorting for Projects

- **Project Ordering**:
  - Projects are retrieved ordered by `updatedAt` descending by default (`orderBy: { updatedAt: 'desc' }`).
  - Client-side sorting allows users to instantly re-sort by Name (A-Z) or Creation Date.
  - No manual `order` integer index or batch reorder endpoint is needed for Projects in MVP, avoiding premature complexity.
- **Collection Response Shape**:
  - Project collection: `GET /workspaces/:workspaceId/areas/:areaId/projects` → `{ items: ProjectDto[], total: number }`.
  - Node collection: `GET /workspaces/:workspaceId/areas/:areaId/projects/:projectId/nodes` → `{ items: NodeDto[], total: number }`.
  - Relationship collection: `GET /workspaces/:workspaceId/areas/:areaId/projects/:projectId/relationships` → `{ items: NodeRelationshipDto[], total: number }`.

### Rationale
- Personal workspaces contain tens of projects and nodes, well within single-query memory limits (<100 items).
- Returning full collections matches Feature 002 (Workspaces) and Feature 003 (Areas), allowing instant client-side filtering, search, and 2D relationship graph mapping without pagination roundtrips.

---

## 4. Frontend State Management & Navigation Flow

### Decision: URL Query Parameter Navigation (`?area=:areaId&project=:projectId`) with React Context

- **Navigation Pattern**:
  - Workspace base URL: `/workspaces/:workspaceId`
  - Active Area selected: `/workspaces/:workspaceId?area=:areaId`
  - Active Project selected: `/workspaces/:workspaceId?area=:areaId&project=:projectId`
- **Component Placement**:
  - In `AreaCanvas`: Replace the static placeholder with `<ProjectSection area={area} />`.
  - When no `project` query param is present: Render `<ProjectList />` (grid of project cards, sort controls, "+ New Project" button).
  - When `project` query param is present: Render `<ProjectCanvas project={activeProject} onBack={() => ...} />` containing `<NodeSection project={activeProject} />`.
- **State Management**:
  - `ProjectProvider` manages projects for the active Area.
  - `NodeProvider` manages nodes and relationships for the active Project.
  - Cache invalidation is local and atomic: mutations update context state and trigger focused re-fetches without reloading the entire page or layout.

### Rationale
- Query parameter synchronization prevents Next.js layout remounts, preserves browser back/forward history, and allows direct bookmarking of specific projects.
- Context encapsulation prevents prop drilling and decouples Area navigation from Project and Node management.

