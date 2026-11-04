# Quickstart & Verification Guide: Workspace Management (Feature 002)

**Feature**: Workspace Management  
**Branch**: `002-workspace-management`  
**Date**: 2026-11-04  
**Status**: Ready for Validation  

This guide provides step-by-step instructions and runnable validation scenarios to verify Feature 002 end-to-end across backend and frontend services.

---

## Prerequisites

1. **Active Dev Server**:
   Ensure dependencies are installed and apps are running:
   ```bash
   pnpm install
   pnpm dev
   ```
   - API running on `http://localhost:3001` (or configured port)
   - Web running on `http://localhost:3000`
2. **Database Migration Applied**:
   ```bash
   pnpm --filter @devspace/api exec prisma migrate dev --name add_workspaces
   ```

---

## Automated Verification Gates

Run quality verification across the monorepo:

```bash
# 1. Typecheck all packages
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

## Manual End-to-End Test Scenarios

### Scenario 1: New User Registration & Onboarding Empty State
1. Open an incognito browser window at `http://localhost:3000/register`.
2. Register a new user: `testuser_ws@example.com` / `Password123!`.
3. Verify automatic redirection to `/workspaces`.
4. **Expected Outcome**:
   - The user sees the **Onboarding Empty State** (*"Welcome to DevSpace — You don't have any workspaces yet"*).
   - In the header, no active workspace pill is shown, but the `+` or switcher indicates no active workspace.

### Scenario 2: Create First Workspace
1. In the empty state, click `+ Create Workspace` (or click `+ New Workspace` in the header switcher).
2. Leave the name field blank and attempt to submit → verify inline error *"Workspace name is required"*.
3. Enter name: `"Personal Growth"`, choose icon `"BookOpen"`, accent color `"emerald"`, and description `"My personal learning space"`.
4. Submit the form.
5. **Expected Outcome**:
   - Dialog closes immediately.
   - Browser navigates to `/workspaces/:workspaceId`.
   - Header shows the workspace pill with `"BookOpen"` icon in emerald and text `"Personal Growth"`.
   - Main canvas displays the workspace overview with emerald accent header and metadata.

### Scenario 3: Create Second Workspace & Switch
1. In the header switcher, click the active workspace pill to open the dropdown.
2. Click `+ Create Workspace`.
3. Enter name: `"Engineering Core"`, choose icon `"Code"`, color `"cyan"`.
4. Submit.
5. In the header switcher, toggle between `"Personal Growth"` and `"Engineering Core"`.
6. **Expected Outcome**:
   - Switching updates the URL to the corresponding `/workspaces/:id` instantly (<500ms).
   - Dropdown reflects active checkmark on selected workspace.
   - Browser refresh preserves the active workspace route.

### Scenario 4: Edit Workspace Details
1. In the active workspace overview (`"Personal Growth"`), click the `"Edit"` button.
2. Change the name to `"Personal Mastery"` and color to `"purple"`. Leave description unchanged.
3. Click `"Save Changes"`.
4. **Expected Outcome**:
   - Header and overview title update immediately to `"Personal Mastery"` with violet accent.
   - The description remains intact (*"My personal learning space"*).

### Scenario 5: Multi-Tenant Ownership & Isolation (Security Check)
1. Copy the current workspace URL (e.g. `http://localhost:3000/workspaces/ws_user1_abc`).
2. Sign out, and register or sign in with a different user account (`otheruser@example.com`).
3. Paste the copied URL into the browser bar and navigate directly to it.
4. **Expected Outcome**:
   - API returns `404 Not Found` (does not return 403 or leak entity data).
   - Frontend displays the **"Workspace Not Found"** error view with a button to return to their own workspaces.

### Scenario 6: Workspace Deletion with Positive Confirmation
1. In the active workspace, open workspace settings or click `"Delete Workspace"`.
2. Delete modal appears with red warning.
3. Attempt to click `"Delete Workspace"` button without typing name → button remains strictly disabled.
4. Type an incorrect name (e.g. `"wrong"`) → button remains disabled.
5. Type the exact workspace name (e.g. `"Personal Mastery"`).
6. Click `"Delete Workspace"`.
7. **Expected Outcome**:
   - Modal closes, toast indicates successful deletion.
   - System automatically redirects to the remaining workspace (`"Engineering Core"`).
   - Header switcher no longer lists `"Personal Mastery"`.

