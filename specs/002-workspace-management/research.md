# Research & Architecture Decisions: Workspace Management (Feature 002)

**Feature**: Workspace Management  
**Branch**: `002-workspace-management`  
**Date**: 2026-11-04  
**Status**: Completed & Approved  

This document consolidates technical research, architectural patterns, and design decisions for Feature 002 in DevSpace.

---

## 1. Multi-Tenant Ownership & Authorization Pattern

### Decision
Enforce workspace ownership directly at the database query layer within `WorkspacesService` by requiring both `id` (workspace ID) and `userId` (from the verified `JwtAuthGuard` session) in every read, update, and delete operation:
```typescript
const workspace = await this.prisma.workspace.findFirst({
  where: { id, userId: currentUser.id },
});
if (!workspace) {
  throw new NotFoundException('Workspace not found');
}
```

### Rationale
- **Uniform Security**: Atomic queries against `{ id, userId }` automatically return `null` if the workspace does not exist **or** belongs to another user.
- **Zero Identifier Enumeration**: Prevents malicious actors from discovering whether a specific workspace ID exists by testing endpoints. Both nonexistent and foreign workspaces trigger a uniform `404 Not Found` response per Q3 clarification.
- **No Race Conditions**: Atomic DB query avoids the time-of-check to time-of-use (TOCTOU) vulnerability of fetching an entity first and checking ownership in application memory afterward.

### Alternatives Considered
- *Separate NestJS Ownership Guard*: Requires an extra database query inside the guard before hitting the service, doubling database round-trips for every mutation.
- *Returning 403 Forbidden*: Explicitly leaks the existence of foreign workspace IDs, violating privacy standards for single-tenant personal spaces.

---

## 2. Active Workspace State & Route Synchronization

### Decision
Adopt a **URL-first routing architecture** (`/workspaces/:workspaceId`) for active workspace identity, paired with client-side preference storage (`localStorage.getItem('devspace:last_workspace_id')`) to redirect generic root routes (`/workspaces` or `/dashboard`).

### Rationale
- **Next.js App Router Alignment**: Path parameters (`[workspaceId]`) integrate natively with Next.js page layouts, server-side data pre-fetching, and Edge middleware route protection.
- **Deep-linking & Bookmarking**: Users can bookmark or share direct links to specific workspaces across multiple browser tabs simultaneously.
- **Zero Backend Migrations**: Requires no extra fields on the `User` or `Profile` table in the database, keeping Feature 001's auth schema lean.

### Alternatives Considered
- *Database-persisted `lastActiveWorkspaceId` on User Profile*: Requires a schema migration on Feature 001's `Profile` table, introduces write latency on every workspace switch, and causes cross-tab race conditions if a user opens two different workspaces in different tabs.
- *Pure Client State without URL IDs*: Breaks browser back/forward buttons, prevents deep linking, and resets context whenever a user opens a new browser window.

---

## 3. Workspace Deletion Confirmation & Cascade Strategy

### Decision
Implement an interactive **Type-to-Confirm Modal** requiring the user to type the exact workspace name before unlocking the delete action, combined with database foreign key cascade (`onDelete: Cascade`) for all future child entities (Areas, Projects, Nodes).

### Rationale
- **Positive Confirmation**: Typing the name creates deliberate friction, eliminating accidental deletions of primary personal workspaces.
- **Data Hygiene**: Enforcing database-level cascade ensures that when future Area (Island) and Project (Structure) features are added, deleting a workspace will cleanly and atomically purge all subordinate data without leaving orphaned records.
- **Lean Architecture**: Hard deletion avoids background cron jobs, soft-delete filter decorators, and trash-bin restore state machines that would over-engineer the MVP.

### Alternatives Considered
- *Single-click Confirmation Dialog*: High risk of accidental data loss when users click through prompts routinely.
- *Soft-delete (`deletedAt` timestamp)*: Introduces query complexity (all future queries must filter `deletedAt: null`), requires unique index workarounds, and adds unnecessary complexity for an MVP.

---

## 4. Visual Metadata Token Model (Icons & Colors)

### Decision
Constrain workspace visual attributes (`icon` and `color`) to a **strictly validated set of curated presets** defined in shared contracts:
- **12 Curated Icons**: `Briefcase`, `Code`, `BookOpen`, `Terminal`, `Compass`, `Cpu`, `Layers`, `Boxes`, `Flame`, `Folder`, `Sparkles`, `User`.
- **8 Curated Colors**: `slate`, `blue`, `indigo`, `purple`, `emerald`, `amber`, `rose`, `cyan`.
- **System Defaults**: Default icon: `"Briefcase"`, Default color: `"blue"`.

### Rationale
- **Visual Harmony & Theme Safety**: Curated Tailwind tokens guarantee high-contrast readability in both dark and light modes, avoiding unreadable user-selected hex colors.
- **Contract Type Safety**: Icons and colors can be strongly typed in `packages/contracts` using string literal union types, preventing XSS injection or arbitrary string payloads.
- **2D/3D Bridge Readiness**: Future 3D islands can directly map these color tokens to Three.js materials without runtime color parsing or fallback errors.

### Alternatives Considered
- *Arbitrary Hex Colors (`#RRGGBB`)*: Requires client and server WCAG contrast math to ensure text readability; prone to visual clashes.
- *Free-form Strings*: High risk of invalid icons, rendering breaks, and injection vectors.

---

## 5. First-Run Onboarding & Feature 001 Integration

### Decision
Keep the **Auth Module (`apps/api/src/modules/auth`) and Workspace Module strictly decoupled**. Newly registered users start with zero workspaces and land on a dedicated **Onboarding Empty State** (`/workspaces`), which guides them to create their first workspace.

### Rationale
- **Modular Monolith Discipline**: Upholds DevSpace Constitution Principle II (Domain boundaries and encapsulation). The user registration flow does not need to inject or invoke `WorkspacesService`.
- **Intentional User Activation**: Allows users to actively name and brand their first workspace rather than landing on a generic, pre-generated "Personal Workspace" that they must immediately rename.
- **Exercises the Empty State**: Ensures the zero-workspace empty state is an active, first-class citizen of the user journey rather than dead code seen only after deleting all workspaces.

### Alternatives Considered
- *Auto-provisioning Default Workspace on Signup*: Couples AuthModule to WorkspacesModule in the backend, adding registration latency and violating single-responsibility principles.

