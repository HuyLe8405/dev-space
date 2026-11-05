# UX Design Direction — Feature 003: Area Management

**Feature:** Area Management  
**Status:** Approved for Planning  
**Source:** Impeccable `/impeccable shape`  
**Target:** `apps/web` (Next.js 15 App Router, React 19, Tailwind CSS, Lucide icons)  

This document defines the UX direction, interface topology, interaction patterns, and visual design specifications for **Feature 003 — Area Management** in DevSpace.

The implementation plan (`plan.md`) and task breakdown (`tasks.md`) MUST conform to the design decisions outlined herein.

> **Scope Boundary & Non-Expansion Rule**: This UX direction strictly adheres to the clarified requirements in [`specs/003-area-management/spec.md`](file:///d:/VsCode/NestJS/dev-space/specs/003-area-management/spec.md). Any UI affordance outside this scope (such as 3D Three.js canvas rendering, Project/Structure management, task cards, or multi-user sharing) is explicitly excluded.

---

## 1. Job and Audience

- **Primary Persona**: Personal Builders, software developers, and self-directed learners who have established workspaces and need to decompose them into distinct, focused operational domains (e.g., "Backend Core", "Machine Learning", "System Design", "Personal Development").
- **Context & Mindset**: Focused, task-oriented, organizing knowledge and projects. Users transition between Areas to switch context within a single Workspace.
- **Core Need**:
  - Immediate visual clarity on which Area is currently active within the workspace.
  - Zero-friction switching between Areas (<300ms) that updates the browser URL query (`/workspaces/:workspaceId?area=:areaId`) without remounting the workspace layout or triggering page flickers.
  - Effortless creation (<10s) with distinct icon and color identity.
  - Intuitive, tactile reordering to organize domains by priority or natural progression.
  - Safe, predictable deletion with a clear confirmation dialog.
  - Calm, welcoming empty states when a workspace has zero Areas.

---

## 2. Outcome and Proof

- **Primary Tasks**:
  1. View all Areas belonging to the active Workspace in their defined order.
  2. Switch the active Area with a single click or keyboard gesture.
  3. Create a new Area with custom visual identity (icon, accent color, name, description).
  4. Reorder Areas via drag-and-drop handles or accessible directional controls.
  5. Edit Area metadata with immediate local reflection and server persistence.
  6. Delete an Area via a standard destructive confirmation modal.
  7. Onboard empty workspaces smoothly with a clear call-to-action.
- **Success Criteria**:
  - The active Area identity is unmistakable at a glance.
  - Tab switching feels instantaneous with zero layout jump.
  - Drag-and-drop reordering is smooth, accessible, and resilient to network dropouts (optimistic update with rollback).
  - The UI remains calm, clean, and 2D-first, perfectly fitting into the established DevSpace aesthetic.

---

## 3. Selected Direction & Visual Authority

- **Aesthetic Stance**: **Engineering Workbench Precision & Spatial Hierarchy**.
  - Areas represent the first level of spatial subdivision inside a Workspace. Visually, they must feel subordinate to the parent Workspace, but distinctly defined as independent domain stages.
  - **Design Tokens**: Fully integrated with existing tokens from `apps/web` (`globals.css` / Tailwind):
    - Page Background: `hsl(var(--background))` (`224 71% 4%`)
    - Surface / Cards: `hsl(var(--card))` (`224 71% 7%`)
    - Borders: `hsl(var(--border))` (`216 34% 17%`)
    - Foreground Text: `hsl(var(--foreground))` (`213 31% 91%`)
    - Muted Foreground: `hsl(var(--muted-foreground))` (`215 20% 65%`)
    - Accent / Focus: `hsl(var(--primary))` (`210 100% 52%`)
- **Shared Curated Presets (reused from Feature 002 contracts)**:
  - **8 Theme Color Tokens**:
    1. `slate`: Slate Neutral (`text-slate-400`, `border-slate-700/60`, `bg-slate-500/10`)
    2. `blue`: Sky Focus (`text-sky-400`, `border-sky-700/60`, `bg-sky-500/10`)
    3. `indigo`: Deep Indigo (`text-indigo-400`, `border-indigo-700/60`, `bg-indigo-500/10`)
    4. `purple`: Violet (`text-purple-400`, `border-purple-700/60`, `bg-purple-500/10`)
    5. `emerald`: Growth Emerald (`text-emerald-400`, `border-emerald-700/60`, `bg-emerald-500/10`)
    6. `amber`: Active Amber (`text-amber-400`, `border-amber-700/60`, `bg-amber-500/10`)
    7. `rose`: Critical Rose (`text-rose-400`, `border-rose-700/60`, `bg-rose-500/10`)
    8. `cyan`: Tech Cyan (`text-cyan-400`, `border-cyan-700/60`, `bg-cyan-500/10`)
  - **12 Curated Icons (`lucide-react`)**:
    - `Layers` (Default for Areas), `Code`, `BookOpen`, `Terminal`, `Compass`, `Cpu`, `Boxes`, `Flame`, `Folder`, `Sparkles`, `User`, `Briefcase`.

---

## 4. Interface Topology & Component Hierarchy

The Area Management interface integrates directly into the existing `WorkspaceOverview` container (`apps/web/src/features/workspaces/components/workspace-overview.tsx`), replacing the static dashed placeholder with a live, responsive Area management subsystem:

```text
WorkspaceOverview
│
├── Context Breadcrumb (Workspaces / {WorkspaceName} / {ActiveAreaName})
├── Workspace Identity Header (Icon, Title, Description, Edit/Delete Workspace)
│
└── Area Management Subsystem
    │
    ├── Area Navigation & Reorder Bar
    │   ├── Scrollable Tablist (overflow-x-auto, role="tablist")
    │   │   ├── [Grip] [Icon] Area 1 (Tab - Active)
    │   │   ├── [Grip] [Icon] Area 2 (Tab - Inactive)
    │   │   └── [Grip] [Icon] Area 3 (Tab - Inactive)
    │   │
    │   └── Pinned Action Slot (Non-scrolling, sticky right)
    │       └── [+ New Area] Persistent Action Button
    │
    └── Active Area Canvas (role="tabpanel")
        ├── Streamlined Domain Status Bar (Compact 48px height)
        │   ├── Icon Badge (32x32) + Title (h2, text-lg font-semibold)
        │   ├── Sequence Indicator ("Area 1 of 4") & Description
        │   └── Context Actions: [Edit Area] and [Delete Area] (Scoped menu / buttons)
        │
        └── Future Project Staging Canvas (2D-first calm container)
            └── "Projects in {Area Name} will appear here..."
```

---

## 5. Screen-by-Screen & Component UX Specifications

### A. Area Navigation & Reorder Strip (`<AreaNavigationStrip />`)

- **Location**: Situated immediately below the Workspace Identity Header, serving as the primary horizontal navigation bar for switching and sorting Areas.
- **Topology**:
  - Container: Flex container with bottom hairline border (`border-b border-border/70 relative flex items-center justify-between gap-2`).
  - **Scrollable Track**: An inner `overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-1.5 sm:gap-2 flex-1` carrying the tabs.
  - **Edge Gradient Mask**: A subtle fade mask on the trailing edge of the tab strip indicating more tabs when overflow occurs.
  - **Pinned Action Slot**: A non-scrolling, sticky-right slot housing the persistent `+ New Area` button separated by a subtle vertical divider (`h-5 w-px bg-border/60 shrink-0`).
- **Role**: `role="tablist"` with `aria-label="Workspace Areas"`.
- **Area Tab Item (`<AreaTabItem />`)**:
  - `role="tab"`, `aria-selected={isActive}`, `aria-controls={`area-panel-${area.id}`}`.
  - **Visual Elements**:
    - **Drag Handle (`GripVertical`)**: A 14x14 icon on the left edge (`text-muted-foreground/40 hover:text-muted-foreground`), persistent on touchscreens and visible on hover/focus on desktop.
    - **Reorder Tooltip**: Accessible tooltip on hover/focus displaying: *"Drag to reorder, or use Alt+Left/Right"*.
    - **Area Icon**: 15x15 icon styled in the Area's theme color (`COLOR_CONFIG[area.color].text`).
    - **Area Name**: Text truncated with responsive ceiling (`max-w-[130px] sm:max-w-[180px] truncate text-xs font-medium`), with mandatory native `title={area.name}` and tooltip on hover/focus to prevent prefix confusion.
  - **State Styles**:
    - **Active Tab**:
      - Background: `bg-card border border-border text-foreground shadow-xs`.
      - Bottom indicator: A subtle 2px active accent pill matching the Area's accent color.
      - Font weight: `font-semibold text-foreground`.
    - **Inactive Tab**:
      - Background: `border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30`.
    - **Dragging State**:
      - Opacity: `opacity-60 scale-102 shadow-lg ring-1 ring-primary/40`.
  - **Interaction**:
    - Clicking switches the active Area immediately (`router.replace('?area=' + area.id, { scroll: false })`).
    - Keyboard navigation: `ArrowRight` / `ArrowLeft` cycles through tabs; `Enter`/`Space` activates.
    - Reordering: Drag-and-drop using HTML5 DnD / pointer events or accessible keyboard shortcuts (`Alt + ArrowLeft` / `Alt + ArrowRight`), dispatching batch reorder (`PUT /workspaces/:workspaceId/areas/reorder`).
- **Pinned `+ New Area` Action**:
  - Anchored permanently on the right side of the navigation bar. Never scrolls out of view.
  - Visual: Compact pill button (`px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors shrink-0 flex items-center gap-1.5`).
  - Opens `<CreateAreaDialog />`.

---

### B. Streamlined Domain Status Bar & Canvas (`<AreaCanvas />`)

- **Location**: Renders directly below the Area Navigation Strip inside a `role="tabpanel"`.
- **Streamlined Domain Status Bar**:
  - Solves dual-header fatigue by consolidating the active Area identity into a compact, elegant 48px horizontal bar rather than a massive stacked card:
    - **Left Cluster**:
      - **Area Icon Badge**: 32x32 rounded-lg container with theme styling:
        `border ${colorConfig.bg} ${colorConfig.border} ${colorConfig.text} shadow-2xs flex items-center justify-center shrink-0`.
      - **Area Title**: `h2` heading (`text-base sm:text-lg font-bold tracking-tight text-foreground truncate max-w-sm sm:max-w-md`).
      - **Sequence Badge**: Subtle pill indicator (`text-[11px] font-medium text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md border border-border/40 shrink-0`): `"Area 1 of 4"`.
    - **Center / Subtitle (on desktop)**:
      - Optional Area description rendered as quiet secondary text (`text-xs text-muted-foreground truncate max-w-md hidden md:block`).
    - **Right Cluster (Contextual Action Controls)**:
      - Differentiated from the workspace header buttons to eliminate action confusion:
      - **"Edit Area"**: Subtly styled compact button (`text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/50 flex items-center gap-1.5 transition-colors`), opens `<EditAreaDialog />`.
      - **"Delete Area"**: Restrained rose action (`text-xs text-rose-400/80 hover:text-rose-400 px-2 py-1 rounded-md hover:bg-rose-500/10 flex items-center gap-1.5 transition-colors`), opens `<DeleteAreaDialog />`.
- **Staging Canvas for Future Projects**:
  - A structured, calm 2D container with a subtle dotted border (`border border-dashed border-border/70 rounded-2xl bg-card/20 p-8 sm:p-12 text-center min-h-[260px] flex flex-col items-center justify-center mt-3`).
  - Displays a clean visual preview stating:
    - Title: *"Domain Projects Staging"*
    - Description: *"Projects created within {area.name} will be organized here. In future updates, this space will expand into interactive structures and knowledge nodes."*
    - Notice badge: `text-xs text-muted-foreground/70 bg-muted/30 px-3 py-1 rounded-full border border-border/50`.

---

### C. Create Area Dialog (`<CreateAreaDialog />`)

- **Pattern**: Accessible centered dialog (`role="dialog"`, `aria-modal="true"`).
- **Header**:
  - Title: `"Create Area"`
  - Description: `"Areas divide your workspace into focused domains for organizing projects."`
- **Form Fields**:
  1. **Area Name**:
     - Label: `"Name"` (required).
     - Input: `autoFocus`, placeholder: `"e.g. Backend Development, System Architecture"`.
     - Constraints: 1–50 characters, trimmed automatically.
     - Real-time client validation: Checks for empty string and duplicate names in the current workspace (case-insensitive).
  2. **Icon Picker**:
     - Label: `"Icon"` (Optional, defaults to `Layers`).
     - Reuses the existing `<IconPicker />` grid component (12 curated Lucide icons).
  3. **Accent Color Picker**:
     - Label: `"Theme Color"` (Optional, defaults to `indigo`).
     - Reuses the existing `<ColorPicker />` component (8 curated theme colors).
  4. **Description**:
     - Label: `"Description"` (Optional).
     - Textarea: 2–3 rows, placeholder: `"Brief summary of this area's purpose..."`.
     - Constraints: Max 280 characters with counter (`X/280`).
- **Footer**:
  - Secondary: `"Cancel"` (closes modal).
  - Primary: `"Create Area"` (disabled if name is empty or duplicate, shows spinner when submitting).
- **Post-Submission**:
  - Closes dialog immediately.
  - Automatically selects the new Area and updates the URL (`?area={newAreaId}`).
  - Displays success toast: `"{areaName} area created."`

---

### D. Edit Area Dialog (`<EditAreaDialog />`)

- **Pattern**: Identical layout to Create Dialog, pre-populated with active Area values.
- **Header**:
  - Title: `"Edit Area"`
  - Description: `"Update the name, visual identity, or description for this area."`
- **Behaviors**:
  - Pre-filled with current name, icon, color, description.
  - Real-time duplicate name validation against sibling areas in the workspace (excluding self).
  - Preserves unchanged attributes when only a subset is updated.
  - Primary action: `"Save Changes"` (with pending state).
  - Post-submission: Updates UI immediately, retains active selection, shows success toast.

---

### E. Delete Area Confirmation Modal (`<DeleteAreaDialog />`)

- **Pattern**: Destructive confirmation modal (aligned with clarification session decision: simple two-step confirmation without typing the name).
- **Header**:
  - Warning Icon: `AlertTriangle` in `rose-500` with soft `bg-rose-500/10` container.
  - Title: `"Delete Area"`
- **Message**:
  - Body: *"Are you sure you want to delete **{area.name}**? This will permanently remove this area and all future projects contained within it. This action cannot be undone."*
- **Action Buttons**:
  - Secondary: `"Cancel"` (default focus).
  - Destructive Primary: `"Delete Area"` (`bg-rose-600 hover:bg-rose-700 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2`).
- **Post-Deletion Transition**:
  - Closes modal.
  - Automatically selects the nearest remaining Area (or transitions to the Workspace Empty State if zero Areas remain).
  - Updates URL query parameter (`?area={nextAreaId}` or removes `?area` if none remain).
  - Shows success toast: `"{areaName} area deleted."`

---

### F. Workspace Zero-Areas Empty State (`<WorkspaceEmptyAreasState />`)

- **Trigger**: Displayed when the active Workspace has 0 Areas (e.g. newly created workspace).
- **Visuals**:
  - Container: Centered calm card within the canvas area (`min-h-[340px] flex flex-col items-center justify-center p-8 text-center`).
  - Icon: `Layers` in soft sky/indigo tint with subtle background ring (`w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4`).
  - Title: `"Create your first Area"`
  - Description: *"Workspaces are divided into Areas representing distinct domains or disciplines (e.g., Frontend, Infrastructure, Research). Create an area to begin organizing your work."*
  - Primary CTA: `"+ Create First Area"` (primary accent button, triggers `<CreateAreaDialog />`).
  - Quick tips list below:
    - *"• Areas hold projects and spatial knowledge structures"*
    - *"• Customize each area with unique colors and icons"*
    - *"• Easily reorder domains as your priorities evolve"*

---

### G. Nonexistent / Deleted Area Fallback Handling

- **Trigger**: User navigates directly to `/workspaces/:workspaceId?area=:invalidId`.
- **Behavior**:
  - The application detects that `:invalidId` does not exist in the loaded Areas list.
  - Automatically falls back to selecting the first valid Area (or empty state if zero areas).
  - Updates the URL query silently via `router.replace` without broken view states.
  - Shows an ephemeral info toast: *"The requested area could not be found. Switched to {firstAreaName}."*

---

## 6. Interaction States & Motion Guidelines

- **Loading Skeletons**:
  - Area Navigation Strip: 3 skeleton pills (`w-24 h-8 bg-muted/40 rounded-lg animate-pulse`).
  - Area Canvas Banner: Shimmer block for icon, title, and actions.
- **Micro-Transitions**:
  - Tab switching: Instantaneous opacity cross-fade (`duration-100 ease-out fade-in`).
  - Drag-and-drop: Subtle drop-indicator bar (`w-0.5 bg-primary rounded-full h-6`) showing insertion point.
  - Modals: Micro-scale entrance (`duration-150 ease-out fade-in zoom-in-95`).
  - Respect `prefers-reduced-motion` at all times.
- **Optimistic Reorder & Error Handling**:
  - Dragging or moving an Area immediately updates the local tab strip order.
  - Backend request (`PUT /workspaces/:workspaceId/areas/reorder`) fires debounced in the background.
  - If the request fails, the order automatically rolls back to the previous snapshot, and a toast notification displays: *"Failed to save new area order. Please try again."*

---

## 7. Accessibility & Responsive Affordances

- **Keyboard Navigation & ARIA Compliance**:
  - Area strip follows WAI-ARIA Tablist design pattern (`role="tablist"`, `role="tab"`, `role="tabpanel"`).
  - Reorder accessibility: Each tab item includes an accessible menu or keyboard actions (`Alt + ArrowLeft` / `Alt + ArrowRight` to shift order), announced via `aria-live="polite"` ("Area moved to position X of Y").
  - Focus trap (`useFocusTrap`) utilized in all dialogs.
  - Auto-focus on Area name input upon dialog open; `Escape` dismisses without submitting.
- **Mobile Adaptations (<640px)**:
  - Tab strip scrolls horizontally with smooth touch momentum and soft gradient edge mask to hint overflow.
  - Touch targets maintain minimum 44x44px hit-box.
  - Action buttons in Area banner collapse to icon-only buttons on small viewports with accessible `aria-label` tooltips.
  - Dialogs render as clean full-width bottom-sheets.

