<!--
Sync Impact Report:
- Version change: Unratified Template (0.0.0) → 1.0.0
- List of modified principles:
  - [PRINCIPLE_1_NAME] → I. Product Philosophy (2D-First, 3D-Enhanced)
  - [PRINCIPLE_2_NAME] → II. Monorepo & Modular Architecture
  - [PRINCIPLE_3_NAME] → III. Frontend and Backend Engineering Standards
  - [PRINCIPLE_4_NAME] → IV. Purposeful 3D Development
  - [PRINCIPLE_5_NAME] → V. Pragmatic Code Quality and Testing
  - [Added] VI. Minimum Quality Gates
  - [Added] VII. Spec-Driven Development Workflow
- Added sections:
  - Technical Constraints & Boundaries (replacing [SECTION_2_NAME])
  - Quality Gate Verification & Review Process (replacing [SECTION_3_NAME])
- Removed sections: None
- Follow-up TODOs: None
-->

# DevSpace Constitution

## Core Principles

### I. Product Philosophy (2D-First, 3D-Enhanced)
DevSpace is a personal workspace management application, not a game. All features MUST prioritize simplicity, usability, and practical value over visual embellishment. Development MUST adhere to a strict 2D-first, 3D-enhanced approach: core workspace management, navigation, and editing tasks MUST be fully usable via standard 2D interfaces (sidebars, detail panels, dialogs, forms). 3D visualization and interaction MUST only be incorporated when they provide meaningful, tangible value in visualizing spatial relationships, hierarchy, or progress across workspaces, areas, and projects.

### II. Monorepo & Modular Architecture
The codebase MUST be structured as a monorepo managed with pnpm Workspaces. The NestJS backend (`apps/api`) MUST follow a Modular Monolith architecture, maintaining clear domain module boundaries with proper encapsulation of controllers, providers, and data access. The project MUST enforce strict separation of concerns among the frontend (`apps/web`), backend (`apps/api`), and shared contracts (`packages/contracts`). Architecture and code design MUST prioritize simple, direct solutions over premature abstractions, generic frameworks, and over-engineering.

### III. Frontend and Backend Engineering Standards
The frontend MUST use Next.js (App Router), React, and TypeScript. The backend MUST use NestJS and TypeScript. Strict static type safety MUST be upheld across all packages—unnecessary use of `any` is prohibited. Code components and backend modules MUST remain readable, testable, and maintainable, following established project conventions. Business logic MUST remain decoupled from UI presentation components in the frontend and separated from transport, protocol, and infrastructure concerns in the backend.

### IV. Purposeful 3D Development
3D scenes MUST be developed with Three.js via React Three Fiber (`@react-three/fiber`) and Drei (`@react-three/drei`). 3D scene logic and rendering code MUST remain completely separate from application business logic, state stores, and data persistence. Development MUST prioritize usability, responsive frame rates, and device performance over visual complexity or heavy graphics. All essential product functionality MUST remain fully accessible through 2D interfaces without requiring 3D canvas interaction.

### V. Pragmatic Code Quality and Testing
Code MUST remain clean and free of unnecessary `any` types, duplicated logic, dead code, and unexplained workarounds. Automated tests MUST be written for critical business logic, API contract behavior, and core interactions. Bug fixes SHOULD include regression tests where practical to prevent reintroduction. Developers MUST NOT write meaningless tests or empty assertions merely to inflate test coverage metrics.

### VI. Minimum Quality Gates
Before any feature, bug fix, or refactor is considered complete, the following verification checks MUST pass according to the scope of changes:
1. **TypeScript Typecheck**: Static type analysis (`tsc --noEmit`) MUST pass with zero errors across all affected packages (`pnpm typecheck`).
2. **ESLint / Static Analysis**: Linter checks MUST pass without new warnings or errors (`pnpm lint`).
3. **Automated Tests**: Relevant unit and integration tests MUST pass when test suites exist or are added for the feature.
4. **Production Build**: Production builds (`pnpm build`) MUST succeed cleanly for all affected applications and packages.
5. **Regression Verification**: No known critical regressions remain in existing functionality.

Checks MUST be executed against the actual scope of changes. Developers and AI agents MUST NEVER claim a check passed if it was not executed. Skipped checks and known tooling limitations MUST be explicitly disclosed with clear rationale.

### VII. Spec-Driven Development Workflow
All feature development MUST follow the structured Spec Kit lifecycle:
`Specify → Clarify (when needed) → Plan → Tasks → Analyze → Implement`
1. **Specify**: Define clear functional requirements, user personas, and acceptance criteria before implementation.
2. **Clarify**: Identify and resolve ambiguous requirements or design decisions through targeted questions.
3. **Plan**: Establish architecture, technology choices, data contracts, and implementation strategy prior to task decomposition.
4. **Tasks**: Break implementation into dependency-ordered, discrete, and verifiable tasks, including testing and verification gates.
5. **Analyze**: Verify cross-artifact consistency between spec, plan, and tasks against this constitution before implementation.
6. **Implement**: Execute strictly against approved tasks and specifications. Expanding feature scope without justification or approved specification updates is prohibited.

## Technical Constraints & Boundaries

- **Runtime & Node Versions**: The monorepo requires Node.js LTS (v20+ or v22+) with `pnpm` (v9+ / v10+).
- **Data Isolation**: Spatial 3D representation states (camera positions, scene coordinates, mesh nodes) MUST remain strictly decoupled from canonical workspace data models (Areas, Projects, Nodes).
- **Environment & Security**: Environment configuration MUST be managed through documented `.env.example` templates. Secrets, keys, and credentials MUST NEVER be checked into version control or logged.

## Quality Gate Verification & Review Process

All code changes are subject to quality gate verification:
- **Scope-Aware Execution**: If a shared package (`packages/contracts`) changes, both consumer applications (`apps/api` and `apps/web`) MUST be validated for type correctness and build success.
- **Reporting Integrity**: Verification logs MUST be reported truthfully. When a specific package lacks a script (such as linting or testing), that limitation MUST be stated explicitly rather than skipped silently.
- **Compliance Review**: All design plans, tasks, and pull requests MUST include a Constitution Check validating adherence to these core principles before implementation or merge.

## Governance

This constitution is the authoritative technical and architectural standard for the DevSpace project. It supersedes informal practices, habits, and undocumented conventions.

- **Mandatory Adherence**: All contributors, developers, and AI assistants MUST strictly comply with these principles and quality gates.
- **Amendment Procedure**: Any change to this constitution requires:
  1. A documented justification detailing the architectural or product rationale.
  2. Review and explicit approval by the project owner.
  3. Incrementation of the version and update of the last amended date in accordance with Semantic Versioning.
- **Versioning Policy**:
  - **MAJOR**: Backward-incompatible governance or principle removals / fundamental redefinitions.
  - **MINOR**: Addition of new principles, sections, or materially expanded governance rules.
  - **PATCH**: Non-semantic refinements, typographical fixes, or minor phrasing clarifications.

**Version**: 1.0.0 | **Ratified**: 2026-11-04 | **Last Amended**: 2026-11-04
