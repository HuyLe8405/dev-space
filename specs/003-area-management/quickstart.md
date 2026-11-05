# Quickstart & Verification Guide: Feature 003 — Area Management

**Feature**: Area Management  
**Branch**: `feature/003-area-management`  
**Date**: 2026-11-05  
**Status**: Ready for Validation  

This guide provides runnable validation scenarios to verify Feature 003 (Area Management) end-to-end across backend and frontend services.

---

## Prerequisites

1. **Active Dev Environment**:
   Ensure dependencies are installed and monorepo applications are running:
   ```bash
   pnpm install
   pnpm dev
   ```
   - API running on `http://localhost:4000/api` (or configured port)
   - Web frontend running on `http://localhost:3000`

2. **Database Migration Applied**:
   Apply the Prisma migration adding the `areas` table:
   ```bash
   pnpm --filter @devspace/api exec prisma migrate dev --name add_areas
   ```

---

## Automated Quality Verification Gates

Execute all quality checks across the monorepo to ensure compliance with the DevSpace Constitution:

```bash
# 1. Typecheck across all packages
pnpm typecheck

# 2. Lint check
pnpm lint

# 3. Backend Unit & E2E Tests
pnpm --filter @devspace/api test
pnpm --filter @devspace/api run test:e2e

# 4. Production Build Verification
pnpm build
```

---

## Manual End-to-End Validation Scenarios

### Scenario 1: Empty Workspace & Area Zero State
1. Sign in to DevSpace with an existing account.
2. Select a workspace that contains zero areas (or create a new workspace: `"Systems Engineering"`).
3. **Expected Outcome**:
   - The workspace overview loads cleanly.
   - The Area Navigation Strip displays the pinned `+ New Area` button.
   - The main canvas displays `<WorkspaceEmptyAreasState />` (*"Create your first Area"* with `Layers` icon and 3 introductory tips).

---

### Scenario 2: Create First Area & Active URL Selection
1. In the empty areas canvas, click `+ Create First Area` (or click `+ New Area` on the navigation bar).
2. Attempt to submit with an empty name → verify client-side validation error *"Area name is required"*.
3. Enter name: `"Backend Core"`, select icon `"Cpu"`, theme color `"cyan"`, and description `"Core APIs and microservices"`.
4. Click `Create Area`.
5. **Expected Outcome**:
   - The dialog closes immediately.
   - A success toast confirms: `"Backend Core area created."`
   - The browser URL updates smoothly to `/workspaces/:workspaceId?area=:areaId`.
   - The tab strip renders `"Backend Core"` with the `"Cpu"` icon in cyan, highlighted with an active theme pill.
   - The Streamlined Domain Status Bar renders the 32x32 cyan icon, `"Backend Core"` title, `"Area 1 of 1"`, and action controls.
   - The Future Projects Staging canvas renders below.

---

### Scenario 3: Create Sibling Areas & Switch Tabs
1. Click the pinned `+ New Area` button on the right edge of the navigation bar.
2. Create `"System Architecture"` with icon `"Layers"` and color `"indigo"`.
3. Create a third area: `"Machine Learning"` with icon `"Sparkles"` and color `"purple"`.
4. Click the `"Backend Core"` tab, then the `"Machine Learning"` tab.
5. **Expected Outcome**:
   - Tab switching occurs instantaneously (<300ms) with zero page flicker or layout jump.
   - The URL query updates to `?area=:mlAreaId` without reloading the page.
   - The sequence badge in the domain status bar updates appropriately (e.g. `"Area 3 of 3"`).
   - Reloading the browser page preserves the selected Area.

---

### Scenario 4: Reorder Areas via Drag-and-Drop and Keyboard
1. Click and drag the third tab (`"Machine Learning"`) to the first position.
2. Release the mouse.
3. Use the keyboard: focus the `"Backend Core"` tab, press `Alt + ArrowLeft` to shift its position.
4. **Expected Outcome**:
   - The tab order updates immediately in the UI (optimistic update).
   - Background request `PUT /workspaces/:workspaceId/areas/reorder` succeeds atomically.
   - Screen reader announces position change via `aria-live="polite"` (*"Area moved to position 1 of 3"*).
   - Reloading the browser confirms the new sequential order is persisted.

---

### Scenario 5: Edit Area Attributes & Duplicate Name Prevention
1. In the active area (`"Backend Core"`), click `"Edit Area"`.
2. Change the name to `"System Architecture"` (matching an existing sibling area).
3. Click `"Save Changes"`.
4. Verify that the system blocks the update with a clear conflict error (*"An area with this name already exists in this workspace"*).
5. Change the name to `"Distributed Systems"` and color to `"emerald"`.
6. Click `"Save Changes"`.
7. **Expected Outcome**:
   - The dialog closes; success toast confirms the update.
   - Tab title updates to `"Distributed Systems"` with emerald accent styling.
   - Unmodified description remains intact.

---

### Scenario 6: Destructive Deletion & Neighbor Selection Transition
1. In the active area (`"Distributed Systems"`), click `"Delete Area"`.
2. A destructive confirmation modal opens displaying the Area name and consequence warning.
3. Click `"Cancel"` → modal closes, area remains intact.
4. Click `"Delete Area"` again, then click the red `"Delete Area"` confirmation button.
5. **Expected Outcome**:
   - Modal closes; toast confirms: `"Distributed Systems area deleted."`
   - Active selection automatically transitions to the nearest remaining sibling Area (`"System Architecture"`).
   - The URL query updates to `?area=:nextAreaId`.
   - The deleted area is permanently removed from the tab strip and database.
   - Delete all remaining areas: verify smooth return to the `<WorkspaceEmptyAreasState />` without UI crash.

---

### Scenario 7: Ownership Isolation & URL Tampering (Security Verification)
1. Copy the URL of an existing area (`http://localhost:3000/workspaces/:user1WorkspaceId?area=:user1AreaId`).
2. Sign out, and sign in with a different user account (`otheruser@example.com`).
3. Paste the URL into the browser address bar.
4. **Expected Outcome**:
   - The API returns `404 Not Found` for the foreign workspace.
   - The UI displays the friendly `"Workspace Not Found"` error view.
5. Now test cross-workspace parentage tampering:
   - User 1 has Workspace A and Workspace B.
   - Manually edit the URL to request an Area from Workspace B under Workspace A (`/workspaces/:wsAId?area=:areaFromWsB`).
   - The client hook detects that the area does not belong to Workspace A.
   - The UI automatically falls back to Workspace A's first valid Area and displays a gentle toast (*"Requested area not found in this workspace"*), eliminating cross-workspace data leakage.

