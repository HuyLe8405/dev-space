# UX Design Direction — Feature 002

**Feature:** Workspace Management  
**Status:** Approved for Planning  
**Source:** Impeccable `/impeccable shape`  

This document defines the UX direction, interaction patterns, and design specifications for Feature 002 – Workspace Management in DevSpace.

The implementation plan should respect these decisions. If any UX decision conflicts with functional requirements, clarify before implementation.

> **Scope Boundary & Non-Expansion Rule**: This UX direction strictly adheres to the scope defined in `specs/002-workspace-management/spec.md`. Any UI affordance or interaction outside the agreed Feature 002 scope (such as 3D Three.js canvas rendering, Area/Project hierarchies, task cards, member invitations, or multi-tenant sharing) is explicitly excluded.

---

# UX Direction Brief: Workspace Management (Feature 002)

> **Mode**: Operate (high precision, distraction-free task completion, quiet confidence)  
> **Target**: `apps/web` (Next.js 15 App Router, React 19, Tailwind CSS, Lucide icons)  
> **Status**: Shaped & Aligned with Specification & User Decisions  

---

## 1. Job and Audience

- **Primary Persona**: Personal Builders, software developers, and self-learners organizing multiple distinct life, study, and project domains.
- **Context & Mindset**: Focused, purposeful, seeking cognitive clarity. Users switch between workspaces to shift mental contexts (e.g., from "Backend Core" to "Machine Learning" or "Personal Growth").
- **Core Need**:
  - Instant visibility of which workspace is currently active.
  - Zero-friction switching (<500ms) that preserves browser URL history and multi-tab independence.
  - Effortless creation (<15s) and safe, irreversible deletion (positive type-to-confirm).
  - A clean 2D layout topology that seamlessly scales to future Areas (Islands) and Projects (Structures).

---

## 2. Outcome and Proof

- **Primary Tasks**:
  1. Switch between workspaces from any view in under two clicks.
  2. Create a new workspace with custom visual identity (icon + accent color).
  3. Edit workspace metadata without losing unmodified attributes.
  4. Safely delete obsolete workspaces with positive confirmation.
  5. Onboard first-time users seamlessly via a welcoming zero-state.
- **Success Criteria**:
  - Active workspace identity is always unmistakable in the header navigation.
  - Deletion of important data is completely protected against accidental clicks.
  - UI remains fast, calm, and utility-oriented, avoiding visual clutter, bloated animations, or gratuitous cards.

---

## 3. Selected Direction & Visual Authority

- **Aesthetic Stance**: **Engineering Workbench Precision & Restraint**.
  - **Token Integration**: Strictly utilizes existing design tokens from `apps/web` (`globals.css` / `tailwind.config.ts`):
    - Background: `hsl(var(--background))` (`224 71% 4%`)
    - Surface / Cards: `hsl(var(--card))` (`224 71% 7%`)
    - Borders: `hsl(var(--border))` (`216 34% 17%`)
    - Text: `hsl(var(--foreground))` (`213 31% 91%`) and `hsl(var(--muted-foreground))`
    - Interactive Accent: `hsl(var(--primary))` (`210 100% 52%`)
- **Curated Visual Presets**:
  - **8 Harmonious Theme Color Tokens**:
    1. `slate`: Slate Neutral (`text-slate-400`, `border-slate-700/60`, `bg-slate-500/10`)
    2. `blue`: Sky/Blue Focus (`text-sky-400`, `border-sky-700/60`, `bg-sky-500/10`)
    3. `indigo`: Deep Indigo (`text-indigo-400`, `border-indigo-700/60`, `bg-indigo-500/10`)
    4. `purple`: Violet (`text-purple-400`, `border-purple-700/60`, `bg-purple-500/10`)
    5. `emerald`: Growth Emerald (`text-emerald-400`, `border-emerald-700/60`, `bg-emerald-500/10`)
    6. `amber`: Active Amber (`text-amber-400`, `border-amber-700/60`, `bg-amber-500/10`)
    7. `rose`: Critical Rose (`text-rose-400`, `border-rose-700/60`, `bg-rose-500/10`)
    8. `cyan`: Tech Cyan (`text-cyan-400`, `border-cyan-700/60`, `bg-cyan-500/10`)
  - **12 Curated Icon Identifiers (`lucide-react`)**:
    - `Briefcase`, `Code`, `BookOpen`, `Terminal`, `Compass`, `Cpu`, `Layers`, `Boxes`, `Flame`, `Folder`, `Sparkles`, `User`.

---

## 4. Screen-by-Screen UX Specifications

### A. Persistent Header Workspace Switcher (`ApplicationHeader`)

- **Topology & Location**: In the top navigation bar, directly adjacent to the DevSpace brand mark on the left (`[D] DevSpace / [Icon] Workspace Name ▾`).
- **Trigger Element**:
  - An interactive pill button showing:
    - Active workspace icon styled in its preset accent color.
    - Active workspace name (truncated to 160px on desktop with ellipsis).
    - Subtle chevron icon (`ChevronsUpDown` or `ChevronDown`, 14px).
  - Hover state: `bg-muted/40 border-border/80`.
- **Dropdown Menu Structure**:
  - Max width: 260px, rounded-lg, border border-border, bg-card, shadow-xl, backdrop-blur.
  - **Header Label**: Quiet uppercase micro-label: `"Workspaces"`.
  - **Workspace List**:
    - Scrollable if >6 items (`max-h-60 overflow-y-auto`).
    - Each item row displays:
      - Icon with color accent.
      - Workspace name (font-medium, text-xs).
      - Checkmark indicator on the currently active item.
    - Clicking an item immediately navigates to `/workspaces/:workspaceId` and closes the menu.
  - **Footer Actions** (divided by a hairline border):
    - `+ Create Workspace` action button with primary accent highlight.
- **Keyboard Affordance**:
  - Accessible via `Tab`, toggles on `Enter`/`Space`, navigates items with `ArrowDown`/`ArrowUp`, dismisses on `Escape` or clicking outside.

---

### B. Workspace Overview Canvas (`/workspaces/:workspaceId`)

- **Structure**: The main page container rendered inside the authenticated dashboard layout.
- **Header Section**:
  - **Context Breadcrumb**: `Workspaces / [Active Workspace Name]` in muted micro-typography.
  - **Identity Row**:
    - Large 44x44px icon container styled in the workspace's accent color.
    - Workspace Title (`h1`, text-2xl font-bold tracking-tight text-foreground).
    - Action Group on the right:
      - `"Edit"` button (pencil icon + text, opens Edit Modal).
      - `"Settings"` or overflow menu containing `"Delete Workspace"` (destructive action).
  - **Metadata Row**:
    - Optional Description (text-sm text-muted-foreground max-w-2xl).
    - Micro-timestamps: `"Updated [time ago]"` in text-xs text-muted-foreground/80.
- **Content Area**:
  - A clean, calm spatial container with a subtle dashed border establishing the boundary where future Areas (Islands) will live.
  - Empty area placeholder:
    - Calm message: *"Areas will appear here as you structure your workspace into domains."*
    - Non-interactive illustration/indicator keeping the UI grounded and calm.

---

### C. Create Workspace Modal (`<CreateWorkspaceModal />`)

- **Pattern**: Centered accessible dialog (`role="dialog"`, `aria-modal="true"`).
- **Header**:
  - Title: `"Create Workspace"`
  - Description: `"Workspaces help you group and visualize related areas and projects."`
- **Form Controls**:
  1. **Workspace Name**:
     - Label: `"Name"` with required indicator.
     - Input: `autoFocus`, placeholder: `"e.g. Personal Projects, Engineering, Study"`.
     - Constraints: 1–50 characters, character count indicator (`X/50`).
     - Validation: Real-time trim validation; error message if submitted empty.
  2. **Icon Picker**:
     - Label: `"Icon"` (Optional, defaults to `Briefcase`).
     - Layout: 6x2 grid of 12 curated Lucide icon buttons.
     - Active item: Highlighted with border-primary and subtle background tint.
  3. **Color Picker**:
     - Label: `"Accent Color"` (Optional, defaults to `blue`).
     - Layout: Horizontal row of 8 circular color swatches.
     - Active item: Outer ring and white checkmark icon.
  4. **Description**:
     - Label: `"Description"` (Optional).
     - Textarea: 3 rows, placeholder: `"Brief summary of this workspace's purpose..."`.
     - Constraints: Max 280 characters with character counter (`X/280`).
- **Footer**:
  - Secondary: `"Cancel"` (dismisses dialog).
  - Primary: `"Create Workspace"` (disabled while name is empty or while mutation is pending).
- **Post-Submission**:
  - Closes dialog immediately, navigates router to `/workspaces/:newId`, displays success toast notification.

---

### D. Edit Workspace Modal (`<EditWorkspaceModal />`)

- **Pattern**: Identical layout to Create Modal, pre-populated with active workspace values.
- **Header**:
  - Title: `"Edit Workspace"`
  - Description: `"Update details and visual identity for this workspace."`
- **Behaviors**:
  - Allows changing name, icon, color, and description.
  - Preserves unchanged attributes when only a subset is edited.
  - Primary action: `"Save Changes"` (with pending spinner).
  - Shows success notification and refreshes header and overview metadata upon save.

---

### E. Delete Workspace Modal (`<DeleteWorkspaceModal />`)

- **Pattern**: Destructive confirmation modal with positive type-to-confirm validation.
- **Header**:
  - Warning Icon: `AlertTriangle` in `rose-500` with subtle `bg-rose-500/10` badge.
  - Title: `"Delete Workspace"`
- **Warning Notice**:
  - Text: *"Are you sure you want to delete **{workspaceName}**? This action is permanent and will cascade-delete all future areas, projects, and notes contained inside."*
- **Confirmation Input**:
  - Micro-label: *"Type the workspace name **{workspaceName}** to confirm:"*
  - Input field with explicit placeholder: *"{workspaceName}"*.
- **Action Controls**:
  - Secondary: `"Cancel"` button.
  - Destructive Primary: `"Delete Workspace"` button.
    - Visual: `bg-rose-600 hover:bg-rose-700 text-white`.
    - **State**: Strictly disabled (`opacity-40 cursor-not-allowed`) until the input value strictly matches the workspace name.
- **Post-Deletion Flow**:
  - Deletes workspace permanently.
  - If another workspace exists: Navigates immediately to the next available workspace.
  - If zero workspaces remain: Navigates to the Onboarding Empty State.
  - Displays confirmation toast: *"Workspace deleted successfully."*

---

### F. Onboarding Empty State (`/workspaces` or root redirect when 0 workspaces)

- **Pattern**: Centered onboarding hero card.
- **Visuals**:
  - Icon: `Boxes` or `Layers` (48x48) in quiet cyan/sky accent.
  - Title: `"Welcome to DevSpace"`
  - Subtitle: *"You don't have any workspaces yet. Create your first workspace to start organizing your knowledge, areas, and projects."*
  - Primary CTA Button: `"+ Create First Workspace"` (large, with icon, triggers Create Modal).
  - Quick guidance cards below:
    - *"1. Create a workspace for each major life domain"*
    - *"2. Organize into Areas (Islands) and Projects"*
    - *"3. Visualize your progress in 3D"*

---

### G. Workspace Not Found / Unauthorized Fallback (`/workspaces/:foreignOrInvalidId`)

- **Pattern**: Focused 404 container.
- **Visuals**:
  - Icon: `Compass` in muted slate.
  - Title: `"Workspace Not Found"`
  - Body: *"The workspace you are looking for does not exist or you do not have permission to view it."*
  - Primary Action: `"Go to My Workspaces"` (redirects to last-active workspace or empty state).

---

## 5. Interaction States & Motion Guidelines

- **Loading States**:
  - Header Switcher: Skeleton pulse pill (`w-32 h-7 bg-muted/40 rounded-lg animate-pulse`).
  - Workspace Canvas: Header title and icon skeleton shimmer during initial fetch.
  - Action Buttons: Subtle spinner (`Loader2` rotating) with label changing to `"Creating..."` or `"Saving..."`.
- **Transitions & Motion**:
  - Dropdown & Modals: Ultra-fast micro-fade (`duration-100 ease-out fade-in zoom-in-95`).
  - Zero heavy bounce or spring animations.
  - Respect `prefers-reduced-motion` at all times.
- **Feedback & Notifications**:
  - Toast banner in bottom-right corner for success/failure actions (auto-dismiss after 3.5s).

---

## 6. Accessibility & Responsive Affordances

- **Keyboard Navigation**:
  - Full tab-sequence traversal for all modal forms.
  - Focus trap inside active dialogs.
  - Auto-focus on primary input when opening modals.
  - `Escape` dismisses modals and popovers without losing page position.
- **ARIA Standards**:
  - Switcher button: `aria-haspopup="menu"`, `aria-expanded={isOpen}`.
  - Modals: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`.
- **Responsive Adaptations**:
  - **Mobile (<640px)**:
    - Header switcher: Truncates workspace name to 90px or shows icon + chevron to preserve room for `UserMenu`.
    - Modals: Render as clean bottom-sheets or full-width dialogs with comfortable touch targets (min 44x44px).
  - **Desktop (≥1024px)**:
    - Full workspace overview layout with comfortable breathing room (max-w-6xl centered).

