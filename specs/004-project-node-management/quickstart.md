# Quickstart & Verification Guide: Feature 004 — Project & Node Management

**Feature**: Project & Node Management  
**Branch**: `feature/004-project-node-management`  
**Date**: 2026-11-05  
**Status**: Ready for Validation  

This guide provides runnable validation scenarios to verify Feature 004 (Project & Node Management) end-to-end across backend and frontend services.

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
   Apply the Prisma migration adding the `projects`, `nodes`, and `node_relationships` tables:
   ```bash
   pnpm --filter @devspace/api exec prisma migrate dev --name add_projects_and_nodes
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

### Scenario 1: Area with Zero Projects (Empty State)
1. Sign in to DevSpace with an existing account.
2. Select a Workspace and an active Area that has zero projects.
3. **Expected Outcome**:
   - The Area canvas displays `<AreaEmptyProjectsState />`.
   - The empty state displays a `"Folder"` icon and a prominent call-to-action button: `"+ Create First Project"`.
   - No error banners or broken layouts appear.

### Scenario 2: Create a Project within an Area
1. In the active Area, click `"+ Create First Project"` (or the header action `"+ New Project"`).
2. Enter Name: `"DevSpace Core API"`.
3. Enter Description: `"High-performance NestJS backend for knowledge workspaces"`.
4. Select Icon: `"Boxes"`, Color: `"cyan"`.
5. Click `"Create Project"`.
6. **Expected Outcome**:
   - The Project card appears in the Area's project grid.
   - The card shows the icon badge, title, description, and `"0 Nodes"`.
   - An ephemeral toast confirms `"Project created successfully"`.

### Scenario 3: Duplicate Project Name Rejection
1. In the same Area, click `"+ New Project"`.
2. Enter Name: `"devspace core api"` (case-insensitive duplicate).
3. Click `"Create Project"`.
4. **Expected Outcome**:
   - Creation is rejected with an inline conflict alert: `"A project with the name 'devspace core api' already exists in this area"`.
   - The dialog remains open for correction.

### Scenario 4: Navigate to Project Details & Node Empty State
1. Click the `"DevSpace Core API"` project card.
2. **Expected Outcome**:
   - URL query parameter updates to `/workspaces/:workspaceId?area=:areaId&project=:projectId`.
   - The view renders the Project details canvas with breadcrumb navigation (`Area > DevSpace Core API`).
   - The canvas displays `<ProjectEmptyNodesState />` explaining conceptual nodes with a `"+ Add First Node"` button.

### Scenario 5: Create Conceptual Nodes
1. Click `"+ Add First Node"`.
2. Enter Name: `"Authentication Module"`, Type: `"module"`, Description: `"JWT and session management"`. Click Create.
3. Click `"+ Add Node"`.
4. Enter Name: `"User Database"`, Type: `"database"`, Description: `"PostgreSQL profiles and accounts"`. Click Create.
5. **Expected Outcome**:
   - Both nodes appear in the Project's node list.
   - Each card displays its semantic badge (`module`, `database`) and description.
   - Project node counter in the header updates to `"2 Nodes"`.

### Scenario 6: Create Basic Node Relationship (Should Have)
1. In the Node Relationship section, click `"+ Connect Nodes"`.
2. Select Source: `"Authentication Module"`.
3. Select Target: `"User Database"`.
4. Select Relationship Type: `"depends_on"`, Label: `"persists user credentials"`.
5. Click `"Connect"`.
6. **Expected Outcome**:
   - The directed relationship appears in the relationship list:
     `Authentication Module` ──[depends on: persists user credentials]──▶ `User Database`.
   - Both connected nodes remain visible and intact.

### Scenario 7: Cascade Deletion Verification
1. Open the Project options and select `"Delete Project"`.
2. A destructive confirmation modal displays: `"Are you sure you want to delete 'DevSpace Core API' and all its 2 nodes?"`.
3. Confirm deletion.
4. **Expected Outcome**:
   - The project is deleted from PostgreSQL, cascading automatically to delete both nodes and the relationship.
   - The view returns to the Area project grid with zero orphaned records.

