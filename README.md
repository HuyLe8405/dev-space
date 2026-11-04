# DevSpace

> **Personal 3D Knowledge Workspace** — Organize your world. Visualize your progress.

DevSpace is a personal workspace that helps users organize, manage, and visualize their knowledge, projects, and personal growth inside an interactive 3D spatial canvas paired with a focused 2D management interface.

---

## Architecture Overview

DevSpace is configured as a **pnpm Workspaces** monorepo:

```text
devspace/
├── apps/
│   ├── web/                     # Next.js (App Router) + React + Three.js + R3F + Tailwind CSS
│   │   └── src/
│   │       ├── app/             # Next.js App Router pages and layouts
│   │       ├── components/      # Shared 2D UI components
│   │       ├── features/        # Business feature modules
│   │       ├── scenes/          # Three.js 3D canvas scenes
│   │       └── lib/             # Utility functions
│   └── api/                     # NestJS modular monolith REST API + Swagger
│       └── src/
│           ├── modules/         # Feature modules (Health, Workspace, etc.)
│           ├── common/          # Common guards, filters, interceptors
│           ├── config/          # Application configuration
│           └── main.ts          # Entry point with Swagger OpenAPI documentation
├── packages/
│   └── contracts/               # Shared TypeScript DTOs, types, and API contracts
│       └── src/
├── docs/
│   └── product-vision.md        # Core product vision and specifications
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── .gitignore
├── .npmrc
└── README.md
```

---

## Prerequisites

- **Node.js**: `v20.x` or `v22.x` (LTS recommended, verified on `v22.17.0`)
- **Package Manager**: `pnpm >= 9.x` (verified on `10.15.1`)

---

## Getting Started

### 1. Install Dependencies

Install all dependencies across the monorepo:

```bash
pnpm install
```

### 2. Environment Setup

Copy example environment files if you need custom configurations:

```bash
# apps/api
cp apps/api/.env.example apps/api/.env

# apps/web
cp apps/web/.env.example apps/web/.env.local
```

### 3. Development Mode

Start both the frontend and backend concurrently:

```bash
pnpm dev
```

- **Frontend (`@devspace/web`)**: [http://localhost:3000](http://localhost:3000)
- **Backend API (`@devspace/api`)**: [http://localhost:4000/api](http://localhost:4000/api)
- **API Swagger Documentation**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- **Health Check Endpoint**: [http://localhost:4000/api/health](http://localhost:4000/api/health)

You can also run applications individually:

```bash
# Run web only
pnpm dev:web

# Run api only
pnpm dev:api
```

---

## Monorepo Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Runs backend API and frontend Web apps concurrently |
| `pnpm build` | Builds contracts, API, and Web applications in dependency order |
| `pnpm lint` | Runs linters across all workspace projects |
| `pnpm typecheck` | Validates TypeScript types across all workspace projects |

---

## Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Lucide Icons
- **3D Graphics**: Three.js, React Three Fiber (R3F), Drei
- **Backend**: NestJS 11, Express, Swagger / OpenAPI
- **Contracts**: Shared TypeScript definitions (`@devspace/contracts`)
- **Package Management**: pnpm Workspaces
