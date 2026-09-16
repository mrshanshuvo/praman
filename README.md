# Praman Monorepo

Turborepo monorepo for **Praman**, featuring Next.js (App Router), NestJS, Prisma 8 (Data Contract & Graph-based architecture), and shared Zod schemas.

## Structure

```text
praman/
├── apps/
│   ├── web/          — Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
│   └── api/          — NestJS + TypeScript + Prisma 8 RC + PostgreSQL
├── packages/
│   └── schemas/      — Shared Zod schemas + inferred TypeScript types (@praman/schemas)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Prerequisites

- **Node.js**: `v20.x` or `v24.x` (Tested on `v24.19.0`)
- **pnpm**: `v10+` or `v12+` (Install globally: `npm install -g pnpm`)
- **PostgreSQL**: `15` or newer running locally (Required by Prisma 8)

---

## Setup Instructions

### 1. Install Dependencies

From the repository root:

```bash
pnpm install
```

If pnpm prompts for approved build scripts (in pnpm 12+), run:

```bash
pnpm approve-builds --all
```

### 2. Environment Variables

#### `apps/api/.env`

Create or verify `apps/api/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/praman?schema=public"
PORT=5000
```

#### `apps/web/.env.local`

Create or verify `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

### 3. Prisma 8 Database Contract & Migrations

Prisma 8 uses a data contract and graph-based migration architecture:

- **Data Contract Location**: `apps/api/src/prisma/contract.prisma`
- **Emit Contract Artifacts** (`contract.json` and `contract.d.ts`):
  ```bash
  pnpm --filter api exec prisma contract emit
  ```
- **Initialize / Push to Database**:
  ```bash
  pnpm --filter api exec prisma db init
  ```
- **Check Migration Status**:
  ```bash
  pnpm --filter api exec prisma migration status
  ```

---

### 4. Running Development Servers

To run all apps and packages in parallel with live reload:

```bash
pnpm turbo dev
```

Or simply:

```bash
pnpm dev
```

- **Frontend (Web)**: [http://localhost:3000](http://localhost:3000)
- **Backend (API)**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

### 5. Build & Lint

To run builds across all packages with proper dependency ordering (`^build`):

```bash
pnpm turbo build
```

To run lint across all packages:

```bash
pnpm turbo lint
```

---

## Workspace Packages

- **`@praman/schemas`**: Contains Zod validation schemas (`HealthCheckSchema`) and inferred TypeScript types (`HealthCheck`). Imported in `apps/web` and `apps/api` via workspace dependency (`"@praman/schemas": "workspace:*"`).
