# UX Design Direction — Feature 001

**Feature:** Authentication & User Management  
**Status:** Approved for Planning  
**Source:** Impeccable `/impeccable shape`  

This document defines the UX direction and design decisions for Feature 001.

The implementation plan should respect these decisions. If any UX decision conflicts with functional requirements, clarify before implementation.

> **Scope Boundary & Non-Expansion Rule**: This UX direction strictly adheres to the scope defined in `specs/001-auth-user-management/spec.md`. Any UI affordance or interaction outside the agreed Feature 001 scope (such as OAuth providers, documentation hubs, shortcut modals, or multi-session inspectors) is explicitly excluded.

---

# UX Direction Brief: Authentication & User Management (Feature 001)

> **Mode**: Operate (high precision, distraction-free task completion, quiet confidence)  
> **Target**: `apps/web` (Next.js 15, React 19, Tailwind CSS)  
> **Status**: Shaped & Aligned with Specification

---

## 1. Job and Audience

- **Primary Persona**: Developers, knowledge workers, and technical creators building their personal workspace, organizing projects, and tracking milestones.
- **Context & Mindset**: Focused, purposeful, and seeking a streamlined personal tool. Users reach auth surfaces either during first-time registration or to log back into their private workspace.
- **Core Need**: Painless, secure authentication and straightforward profile management that recedes into the background and honors single-tenant data isolation.

---

## 2. Outcome and Proof

- **Primary Action**: Register with email/password, sign in securely, persist sessions across browser reloads, and update profile/password settings without cognitive friction.
- **Success Criteria**:
  - Sign-in and registration flows feel instantaneous and keyboard-friendly (tab-order, autofocus, enter-to-submit).
  - Auth surfaces feel like native desktop productivity tools (Linear, Raycast, Sublime) rather than generic marketing templates.
  - Profile and security updates provide unambiguous feedback and preserve unsaved work.

---

## 3. Selected Direction & Visual Authority

- **Aesthetic Stance**: **Monastic Precision & Restraint**.
  - **Token Integration**: Strictly utilizes existing design tokens from `apps/web` (`globals.css` / `tailwind.config.ts`), ensuring complete visual consistency with the application:
    - Background: `hsl(var(--background))`
    - Surface / Cards: `hsl(var(--card))`
    - Borders: `hsl(var(--border))`
    - Text: `hsl(var(--foreground))` and `hsl(var(--muted-foreground))`
    - Interactive Accent: `hsl(var(--primary))`
  - Zero decorative drop shadows, zero noisy particle effects, and zero multi-color gradient blobs.
  - Primary color is applied purposefully: reserved strictly for interactive states (focus rings, primary action buttons, active navigation indicators).
- **Structural Topology**:
  - **Auth Screens (`/login`, `/register`)**: Centered, distraction-free single-column container (max width 380px) anchored by a minimalist DevSpace monogram and quiet typography.
  - **Account Settings (`/settings`)**: Standard app shell with a clean two-column layout—left sub-nav (Profile, Security & Password) and right settings panel—delivering calm, predictable navigation.

---

## 4. Screen-by-Screen UX Specifications

### A. Login Screen (`/login`)
- **Structure**:
  - Brand Mark: Monochrome DevSpace icon + subtle title.
  - Heading: `"Welcome back"` with secondary text: `"Sign in to your private workspace"`.
  - Fields:
    1. Email Address (`type="email"`, `autoFocus`, `autoComplete="email"`).
    2. Password (`type="password"`, `autoComplete="current-password"` with an accessible toggle to reveal password).
  - Primary Action: Full-width `"Sign In"` button with subtle keyboard hint (`↵`).
  - Footer Link: Quiet transition link: `"Don't have an account? Create one"`.
  - Error Banner: Dedicated inline error container above fields with clear, non-confirming error messaging per FR-005 (e.g., *"Invalid email or password"*).

### B. Registration Screen (`/register`)
- **Structure**:
  - Heading: `"Create your DevSpace"` with subtext: `"Your private, single-tenant workspace"`.
  - Fields:
    1. Email Address (`type="email"`, `autoComplete="email"`).
    2. Display Name: Explicitly marked `(optional)` with placeholder hint (`"alex (default from email)"`).
    3. Password (`type="password"`, `autoComplete="new-password"`).
    4. Password Confirmation (`type="password"`).
  - Inline Strength & Rules: Requirement checklist strictly matching spec FR-003:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one numeric character
    Indicators shift dynamically from muted neutral to subtle success checkmarks as requirements are satisfied.
  - Primary Action: `"Create Account"` button.
  - Footer Link: `"Already registered? Sign in"`.

### C. Account / Profile Settings (`/settings`)
- **Structure**: Embedded inside the authenticated workspace shell (preserving top bar).
- **Layout**:
  - Sidebar Sub-nav (left, 220px desktop):
    - `Profile` (Active by default)
    - `Security & Password`
  - Content Panel (right, max 640px):
    - **Profile Tab**:
      - Display Name input field with inline validation and `"Save Changes"` action.
      - Registered Email: Read-only field displaying user's email address.
      - Account Metadata: Account creation date (`Member since [date]`) matching FR-013.
    - **Security & Password Tab**:
      - Current Password input.
      - New Password & Confirm New Password inputs with FR-003 requirement indicators.
      - Action: `"Update Password"` button.
      - Explanatory note: *"Updating your password keeps this device signed in and automatically logs out all other devices."*

---

## 5. Navigation States

### Unauthenticated Header (Public / Marketing / Auth Routes)
- **Left**: DevSpace monogram and logotype.
- **Right**:
  - Direct contextual action: If on `/login`, displays `"Create Account"` button. If on `/register`, displays `"Sign In"` button. If on public landing, displays both `"Sign In"` (ghost) and `"Get Started"` (primary).

### Authenticated Header (Workspace & Settings)
- **Left**: DevSpace logo + Workspace switcher / status indicator.
- **Center**: Quiet breadcrumb / view title (e.g., `DevSpace / Settings / Profile`).
- **Right**:
  - User avatar badge: Displays two-letter initials derived from display name (or email prefix) in a crisp geometric circle.
  - Dropdown Menu (strictly Feature 001 scope):
    - User info header: Display Name + Email.
    - Divider.
    - `Settings` (links to `/settings`).
    - Divider.
    - `Sign Out` (destructive/muted red highlight on hover; triggers session revocation and redirects to `/login`).

---

## 6. Form States, Feedback & Micro-Interactions

| State | Visual & Behavioral Pattern |
|---|---|
| **Default / Idle** | Crisp 1px border (`border-border`), background (`bg-card`), high-contrast text (`text-foreground`). High-legibility fixed labels. |
| **Focus** | Border shifts to active primary (`border-primary`) with a tight 2px outer ring (`ring-1 ring-primary/30`). No jarring layout shift. |
| **Inline Validation** | Real-time validation fires on blur (`onBlur`), not during initial keystroke entry, preventing aggressive error flash while the user is still typing. |
| **Submitting / Loading** | Submit button shows an inline spinner (16px), button text shifts to `"Signing in..."` or `"Creating account..."`, and inputs are locked to avoid duplicate submissions. |
| **Form Error** | Subtle shake animation (200ms) on container; fields in violation highlight with `border-destructive` or rose border; concise error alert renders with an exclamation badge above the form. |
| **Success Feedback** | Inline toast or subtle success badge with checkmark (e.g., *"Profile updated successfully"*, *"Password updated"*). Auto-dismisses after 4 seconds. |

---

## 7. Responsive Layouts & Breakpoints

- **Desktop (≥ 1024px)**:
  - Auth screens centered vertically and horizontally in viewport with generous breathing room.
  - Settings page renders full two-column layout (sidebar sub-nav + wide settings form).
- **Tablet (768px – 1023px)**:
  - Auth screens remain centered with adjusted vertical padding.
  - Settings page collapses sidebar into horizontal segmented pills above the content.
- **Mobile (< 768px)**:
  - Auth forms expand to full width (`w-full px-5`) with inputs sized at 44px minimum touch height to prevent auto-zoom on iOS Safari (`text-base`).
  - Top navigation simplifies to logo on left and direct action on right.
  - User menu dropdown opens as a bottom sheet or full-width mobile popover.

---

## 8. Accessibility & Ergonomics

1. **Keyboard-First Flow**:
   - `Tab` navigates sequentially: Email → Password → Submit → Alternative action.
   - `Enter` submits from any input field.
   - `Esc` closes dropdowns and dialogs.
2. **Screen Reader Support**:
   - Every input has an explicit `<label>` tied by `htmlFor`.
   - Error messages are associated with inputs via `aria-describedby` and `aria-invalid="true"`.
   - Buttons announce loading state via `aria-busy="true"` and live status announcements.
3. **Contrast Compliance**:
   - Meets standard **WCAG AA** requirements:
     - Normal body text and input values: Contrast ratio ≥ 4.5:1 against background.
     - Large text and graphical/interactive boundaries (input borders, active focus indicators): Contrast ratio ≥ 3:1.
