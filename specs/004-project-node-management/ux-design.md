# UX Design Direction — Feature 004: Project & Node Management

**Feature:** Project & Node Management  
**Status:** Approved for Implementation  
**Source:** Impeccable `/impeccable shape`  
**Target:** `apps/web` (Next.js 15 App Router, React 19, Tailwind CSS, Lucide icons)  

This document defines the user experience, interface topology, visual hierarchy, interaction flows, and component design specifications for **Feature 004 — Project & Node Management** in DevSpace.

The implementation tasks (`tasks.md`) and components (`apps/web/src/features/projects`, `apps/web/src/features/nodes`) MUST conform to the design decisions outlined herein.

> **Scope Boundary & Non-Expansion Rule**: This UX direction strictly adheres to the clarified requirements in [`specs/004-project-node-management/spec.md`](file:///d:/VsCode/NestJS/dev-space/specs/004-project-node-management/spec.md). Any UI affordance outside this scope (such as Three.js 3D visualization, 3D object manipulation, task management, kanban boards, or project progress tracking) is explicitly excluded.

---

## 1. Job and Audience

- **Primary Persona**: Personal Builders, software engineers, and domain researchers who have decomposed their workspace into Areas (e.g., "Backend Core", "Artificial Intelligence") and need to organize those Areas into tangible Projects (e.g., "DevSpace API", "Event Engine") and conceptual Nodes (e.g., "Auth Module", "Session Store", "PostgreSQL DB").
- **Context & Mindset**: Focused, architectural, analytical. Users need to switch between high-level area overviews and deep structural inspection of project building blocks.
- **Core Needs**:
  1. Immediate visual clarity on all Projects belonging to the currently active Area.
  2. Smooth, non-disruptive navigation between Area overview and Project detail canvas using shallow URL synchronization (`/workspaces/:workspaceId?area=:areaId&project=:projectId`).
  3. Effortless creation (<10s for Project, <8s for Node) reusing established iconography and theme palettes.
  4. Clear distinction of conceptual Nodes (components, services, modules) via semantic visual badges without task management clutter.
  5. Intuitive 2D visualization of basic directed Node relationships without 3D canvas dependencies.
  6. Safe, destructive confirmation flows that prevent accidental data loss.
  7. High-quality empty, loading, and error states that maintain visual stability across all screen sizes.

---

## 2. Outcome and Proof

- **Primary Tasks**:
  1. Browse and search Projects within an active Area.
  2. Create a new Project with name, description, icon, and accent color.
  3. Drill into a Project to view its details and constituent Nodes.
  4. Create conceptual Nodes with semantic architectural types (`concept`, `component`, `service`, `module`, `database`, `interface`, `custom`).
  5. Connect Nodes with directed conceptual relationships (`depends_on`, `relates_to`, `contains`) in a clean 2D view.
  6. Edit and delete Projects, Nodes, and Relationships with safe confirmation dialogs.
  7. Smoothly navigate back from Project detail to Area canvas without page reloads.
- **Success Criteria**:
  - Switching between Area project list and Project detail canvas feels instantaneous (<300ms) with zero layout jump.
  - Project and Node cards present strong scannability and clear typography hierarchy.
  - The UI remains strictly 2D-first, minimal, and calm, matching the DevSpace engineering workbench aesthetic.

---

## 3. Selected Direction & Visual Authority

- **Aesthetic Stance**: **Engineering Workbench Precision & Spatial Hierarchy**.
  - Consistent with Features 001–003, DevSpace operates in a high-focus dark theme (`hsl(224 71% 4%)` background with slate/zinc neutral borders and vibrant theme accents).
  - Visual weights decrease gracefully down the hierarchy:
    `Workspace (Root Header)` → `Area (Tab Strip & 48px Status Bar)` → `Project (Cards & Detail Header)` → `Node (Semantic Compact Cards)`.
- **Design Tokens (reused from `globals.css` and Tailwind)**:
  - Page Background: `hsl(var(--background))` (`224 71% 4%`)
  - Cards & Panels: `hsl(var(--card))` (`224 71% 7%`)
  - Elevated Popovers/Dialogs: `hsl(var(--popover))` (`224 71% 8%`)
  - Borders: `hsl(var(--border))` (`216 34% 17%`)
  - Primary Text: `hsl(var(--foreground))` (`213 31% 91%`)
  - Secondary Text: `hsl(var(--muted-foreground))` (`215 20% 65%`)
  - Primary Action: `hsl(var(--primary))` (`210 100% 52%`)
- **Shared Curated Presets (reused from `@devspace/contracts`)**:
  - **8 Theme Color Tokens**: `slate`, `blue`, `indigo`, `purple`, `emerald`, `amber`, `rose`, `cyan`.
  - **12 Curated Icons (`lucide-react`)**: `Folder` (Default for Projects), `Boxes` (Default for Nodes), `Layers`, `Code`, `BookOpen`, `Terminal`, `Compass`, `Cpu`, `Flame`, `Sparkles`, `User`, `Briefcase`.
- **Semantic Node Badges**:
  - `concept`: Slate / Indigo subtle pill with `Sparkles` icon (`bg-indigo-500/10 text-indigo-400 border-indigo-500/20`).
  - `component`: Cyan pill with `Boxes` icon (`bg-cyan-500/10 text-cyan-400 border-cyan-500/20`).
  - `service`: Blue pill with `Cpu` icon (`bg-sky-500/10 text-sky-400 border-sky-500/20`).
  - `module`: Purple pill with `Code` icon (`bg-purple-500/10 text-purple-400 border-purple-500/20`).
  - `database`: Emerald pill with `Database` icon (`bg-emerald-500/10 text-emerald-400 border-emerald-500/20`).
  - `interface`: Amber pill with `Compass` icon (`bg-amber-500/10 text-amber-400 border-amber-500/20`).
  - `custom`: Slate pill with `Tag` icon (`bg-slate-500/10 text-slate-400 border-slate-500/20`).

---

## 4. Interface Topology & Component Hierarchy

The Project and Node management experiences embed directly inside `AreaCanvas` (`apps/web/src/features/areas/components/area-canvas.tsx`), replacing the static dashed staging placeholder:

```text
AreaCanvas (role="tabpanel")
│
├── Area Domain Status Bar (Compact 48px height)
│   ├── [Icon Badge] Area Title (h2) + "Area X of Y" + Description
│   └── Actions: [Edit Area] [Delete Area]
│
└── Project Management Subsystem (<ProjectSection area={area} />)
    │
    ├── State A: Project List View (When URL has no `project` param)
    │   │
    │   ├── Section Header (Subheading "Projects", Search Input, Sort Select, [+ New Project])
    │   │
    │   ├── Project Grid (Responsive 1/2/3 columns)
    │   │   ├── <ProjectCard /> (Icon, Accent Border, Title, Description, Node Count, Menu)
    │   │   ├── <ProjectCard />
    │   │   └── ...
    │   │
    │   └── <AreaEmptyProjectsState /> (Rendered when Area has 0 projects)
    │
    └── State B: Project Detail View (When URL has `?project=:projectId`)
        │
        └── <ProjectCanvas project={activeProject} />
            │
            ├── Project Detail Header Bar
            │   ├── Breadcrumb Navigation ("← Back to Projects" | Area > Project Name)
            │   ├── Project Identity Badge (36x36 Theme Icon, Title, Description)
            │   └── Actions: [Edit Project] [Delete Project]
            │
            └── Node Management Subsystem (<NodeSection project={project} />)
                │
                ├── Node Section Control Bar
                │   ├── Filter Chips ("All", "Concept", "Component", "Service", etc.)
                │   ├── View Switcher: [Nodes (X)] | [Connections (Y)]
                │   └── [+ Add Node] Primary Action Button
                │
                ├── Mode 1: Node Grid / Board
                │   ├── <NodeCard /> (Semantic Badge, Title, Description, Connection Count, Menu)
                │   ├── <NodeCard />
                │   └── <ProjectEmptyNodesState /> (Rendered when Project has 0 nodes)
                │
                └── Mode 2: Node Relationships View (2D connection list)
                    ├── Relationship Header ([+ Connect Nodes])
                    ├── <NodeRelationshipList />
                    │   └── Row: [Source Node] ──(type label)──▶ [Target Node] [Delete]
                    └── Empty Relationships Notice
```

---

## 5. Screen-by-Screen & Component Specifications

### A. Project List View (`<ProjectList />`)

- **Location**: Rendered within `AreaCanvas` when viewing an Area without a specific project selected.
- **Control Bar**:
  - **Left**: Subheading `"Projects"` with subtle count badge (`text-xs font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/40`).
  - **Center/Right**:
    - Search input: Compact text box (`h-8 text-xs rounded-lg bg-card/60 border border-border/80 px-2.5 w-44 sm:w-56 placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-primary`).
    - Sort dropdown: Accessible select menu with options:
      - `Recently Updated` (default)
      - `Name (A–Z)`
      - `Oldest First`
    - Primary CTA: `+ New Project` button (`h-8 px-3 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-sm`).
- **Project Card (`<ProjectCard />`)**:
  - Container: `rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm p-4 hover:border-border hover:bg-card/90 transition-all duration-150 cursor-pointer group shadow-sm hover:shadow-md flex flex-col justify-between min-h-[140px]`.
  - **Header Row**:
    - Left: 32x32 icon badge styled in project theme color (`COLOR_CONFIG[project.color]` and `ICON_MAP[project.icon]`).
    - Right: Action trigger button (`MoreVertical` or hover actions) with accessible dropdown menu (`Edit`, `Delete`).
  - **Body**:
    - Title: `text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors truncate` (1–50 characters).
    - Description: `text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed` (max 280 characters, or subtle placeholder if empty).
  - **Footer Row**:
    - Left: Node count pill (`text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/40 flex items-center gap-1.5`):
      `Boxes` icon + `X Nodes`.
    - Right: Relative timestamp (`text-[11px] text-muted-foreground/70`, e.g., "Updated 2h ago").
  - **Interaction**:
    - Clicking the card body invokes `router.replace('?area=' + area.id + '&project=' + project.id, { scroll: false })`.
    - Clicking the action menu does not trigger card navigation (`e.stopPropagation()`).

### B. Project Detail Canvas (`<ProjectCanvas />`)

- **Location**: Rendered within `AreaCanvas` when `?project=:projectId` is present in the URL query.
- **Breadcrumb & Detail Header Bar**:
  - Container: Flex container with padding and rounded border (`p-3 sm:px-4 sm:py-3 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`).
  - **Left Cluster**:
    - **Back Button**: Pill button (`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/70 rounded-lg border border-border/60 transition-colors focus:ring-1 focus:ring-primary`):
      `ArrowLeft` icon + `"Projects"`.
    - Vertical hairline divider (`h-4 w-px bg-border/60 shrink-0 hidden sm:block`).
    - **Identity Badge**: 36x36 theme icon badge (`COLOR_CONFIG[project.color]`).
    - **Title & Metadata**:
      - `h2` title (`text-base sm:text-lg font-semibold tracking-tight text-foreground truncate max-w-xs md:max-w-md`).
      - Total node count badge (`text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/40`).
      - Optional description displayed inline or truncated with hover tooltip.
  - **Right Cluster**:
    - `[Edit Project]` button (`Pencil` icon, compact button).
    - `[Delete Project]` button (`Trash2` icon, rose accent hover).

### C. Conceptual Node Board (`<NodeList />`)

- **Location**: Positioned directly beneath the Project Detail Header Bar.
- **Section Control Bar**:
  - **Left**:
    - Horizontal scrollable filter chips (`overflow-x-auto no-scrollbar flex items-center gap-1.5`):
      `[All (X)]`, `[Concept]`, `[Component]`, `[Service]`, `[Module]`, `[Database]`, `[Interface]`, `[Custom]`.
      - Active chip: `bg-primary/10 text-primary border-primary/30 font-medium`.
      - Inactive chip: `text-muted-foreground hover:text-foreground hover:bg-muted/40 border-transparent`.
  - **Right**:
    - View Switcher / Tab Toggle: `[Nodes (X)] | [Connections (Y)]`.
    - Primary CTA: `+ Add Node` button (`h-8 px-3 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-sm`).
- **Node Card (`<NodeCard />`)**:
  - Container: Compact workbench card (`rounded-xl border border-border/70 bg-card/50 hover:border-border hover:bg-card/80 p-3.5 transition-all flex flex-col justify-between min-h-[120px] relative group`).
  - **Header Row**:
    - Left: **Semantic Type Badge** (distinct pill styling with icon and label per type).
    - Right: Action trigger (`MoreVertical` or hover actions: Edit, Delete).
  - **Body**:
    - Title: `text-sm font-semibold tracking-tight text-foreground truncate mt-1.5`.
    - Description: `text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed` (or empty placeholder).
  - **Footer Row**:
    - Relationship indicator: If the node has connections, display a subtle badge (`text-[11px] text-muted-foreground/80 flex items-center gap-1 mt-2`):
      `GitFork` icon + `"2 connections"`.

### D. Node Relationships View (`<NodeRelationshipList />`)

- **Location**: Switched via the view toggle in `NodeSection`.
- **Relationship Item Row**:
  - Container: `flex items-center justify-between p-3 rounded-xl border border-border/60 bg-card/40 hover:bg-card/70 transition-colors gap-3`.
  - **Connection Flow**:
    - **Source Node**: Semantic type pill + Node name (`text-xs font-medium text-foreground truncate max-w-[140px]`).
    - **Directed Visual Connector**:
      ```text
      ───[ depends on ]───▶
      ```
      - Connector line: hairline horizontal border with right arrow (`ArrowRight` icon).
      - Semantic type badge: Centered on the line in a monospace pill (`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border border-border/80 bg-muted/60 text-muted-foreground`):
        - `depends_on`: Amber subtle tint (`bg-amber-500/10 text-amber-400 border-amber-500/20`).
        - `relates_to`: Sky subtle tint (`bg-sky-500/10 text-sky-400 border-sky-500/20`).
        - `contains`: Purple subtle tint (`bg-purple-500/10 text-purple-400 border-purple-500/20`).
      - Optional Custom Label: Rendered beneath the badge in `text-[11px] text-muted-foreground italic`.
    - **Target Node**: Semantic type pill + Node name (`text-xs font-medium text-foreground truncate max-w-[140px]`).
  - **Actions**:
    - Compact delete button (`Trash2` icon, rose hover) with tooltip *"Remove connection"*.

---

## 6. Dialogs, Modals & Destructive Confirmation Flows

All dialogs reuse the accessible modal shell established in Features 001–003:

### 1. `CreateProjectDialog` & `EditProjectDialog`
- Modal width: `max-w-md w-full`.
- **Form Controls**:
  - **Project Name**: Autofocused text input (`h-9 text-xs rounded-lg border border-border bg-background px-3`). Real-time character counter (`X/50`). Real-time case-insensitive duplicate name conflict check against existing projects in the area.
  - **Description**: Textarea (`h-20 text-xs rounded-lg border border-border bg-background p-3`). Character counter (`X/280`).
  - **Icon Picker**: Reuses `<IconPicker />` grid (12 curated icons).
  - **Color Picker**: Reuses `<ColorPicker />` palette (8 theme colors).
- **Footer**: `[Cancel]` button and `[Create Project] / [Save Changes]` primary button with loading spinner.

### 2. `DeleteProjectDialog`
- Alert icon badge: 40x40 rounded-full in rose tint (`bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center`).
- Title: `"Delete Project"`.
- Warning Copy:
  > "Are you sure you want to permanently delete **{project.name}**? This will remove the project along with all **{project.nodeCount} conceptual nodes** and their relationships. This action cannot be undone."
- Actions: `[Cancel]` and `[Delete Project]` (`bg-rose-500 text-white hover:bg-rose-600`).

### 3. `CreateNodeDialog` & `EditNodeDialog`
- Modal width: `max-w-sm w-full`.
- **Form Controls**:
  - **Node Name**: Autofocused text input (`1–50 characters`). Real-time duplicate check within the project.
  - **Node Type**: Custom select / segmented picker showing all 7 semantic types (`Concept`, `Component`, `Service`, `Module`, `Database`, `Interface`, `Custom`) with live badge preview.
  - **Description**: Textarea (`max 280 characters`).
- **Footer**: `[Cancel]` and `[Add Node] / [Save Changes]`.

### 4. `CreateRelationshipDialog`
- Modal width: `max-w-md w-full`.
- **Form Controls**:
  - **Source Node**: Select dropdown containing all project nodes.
  - **Target Node**: Select dropdown filtering out the selected source node (preventing self-connection).
  - **Relationship Type**: Segmented radio selector (`Depends On`, `Relates To`, `Contains`).
  - **Optional Label**: Text input up to 100 characters (e.g. `"persists session tokens"`).
- **Footer**: `[Cancel]` and `[Connect Nodes]`.

---

## 7. Empty, Loading & Error States

- **Area with Zero Projects (`<AreaEmptyProjectsState />`)**:
  - Calm dashed container (`rounded-2xl border border-dashed border-border/80 bg-card/20 p-12 text-center flex flex-col items-center justify-center min-h-[280px]`).
  - Icon badge: 48x48 with `Folder` icon in muted foreground.
  - Heading: `"No projects in {area.name} yet"`.
  - Body: `"Projects help you organize systems, repositories, or subject tracks within this area. Each project can contain conceptual nodes and relationships."`
  - Action: Primary `+ Create First Project` button.
- **Project with Zero Nodes (`<ProjectEmptyNodesState />`)**:
  - Calm dashed container (`min-h-[240px]`).
  - Icon badge: 44x44 with `Boxes` icon.
  - Heading: `"No conceptual nodes defined yet"`.
  - Body: `"Break this project down into architectural components, domain models, services, or concepts. Nodes represent the building blocks of your project."`
  - Action: Primary `+ Add First Node` button.
- **Loading Skeletons (`<ProjectLoadingSkeleton />`, `<NodeLoadingSkeleton />`)**:
  - Rendered with matching grid dimensions (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`).
  - Pulsing cards with header icon, title bar, description block, and footer pill to eliminate layout shifts (`CLS = 0`).
- **Error States (`<ProjectErrorState />`)**:
  - Inline error notice with alert icon, error message, and actionable `"Try Again"` retry button.
- **Success Toasts (`AreaToast` pattern)**:
  - Ephemeral toast notification in bottom-right corner confirming:
    - *"Project created successfully"*
    - *"Project deleted"*
    - *"Node added"*
    - *"Relationship connected"*

---

## 8. Responsive Design & Layout Specifications

| Breakpoint | Project Grid Layout | Node Grid Layout | Navigation & Detail Bar Behavior |
|---|:---:|:---:|---|
| **Mobile (`<640px`)** | 1 column (`grid-cols-1`) | 1 column (`grid-cols-1`) | Detail header stacks vertically; breadcrumb shows compact `← Back`; relationship cards display stacked source/connector/target. |
| **Tablet (`640px–1024px`)** | 2 columns (`grid-cols-2`) | 2 columns (`grid-cols-2`) | Detail header renders inline; search input adjusts to 180px width; filter chips scroll horizontally. |
| **Desktop (`>1024px`)** | 3 columns (`grid-cols-3`) | 3 to 4 columns (`grid-cols-3 xl:grid-cols-4`) | Full workbench layout; expanded search bar; inline metadata summaries. |

---

## 9. Accessibility (a11y) & Usability Standards

- **Keyboard Navigation**:
  - All project and node cards are fully focusable with visible focus rings (`focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none`).
  - Pressing `Enter` or `Space` on a focused project card activates detail view navigation.
  - Pressing `Escape` in any dialog dismisses the modal without submitting changes.
- **Screen Reader Announcements**:
  - Card counts and status changes use `aria-live="polite"`.
  - Modals use `role="dialog"` with `aria-modal="true"`, `aria-labelledby`, and autofocus traps.
  - Delete buttons include explicit `aria-label="Delete project {name}"` or `aria-label="Delete node {name}"` to provide clear context for screen reader users.
- **Color Contrast**:
  - All text meets WCAG AA standards (minimum 4.5:1 contrast against dark background).
  - Semantic node badges combine color tokens with distinct icons and text labels, ensuring accessibility for color-blind users.

---

## 10. Implementation Guidance & Non-Goals

1. **Strictly 2D-First**: Do NOT attempt to render 3D Three.js spheres, boxes, or lines. This feature establishes the canonical business data models and standard 2D user interfaces that future 3D milestones will visualize.
2. **Reuse Existing Assets**: Reuse `COLOR_CONFIG` and `ICON_MAP` from `features/workspaces/components/`. Do not introduce new color palettes or external icon packages.
3. **No Task Properties**: Keep Node cards free of task statuses (checkboxes, "in progress", "done"), assignees, or due dates. Nodes are conceptual architectural entities.
4. **Shallow URL Navigation**: Use `router.replace(..., { scroll: false })` when updating `project` query parameters to prevent page scroll jumping and layout re-rendering.

