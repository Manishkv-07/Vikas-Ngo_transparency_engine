# Vikas NGO — Transparency Engine

A full-stack web app that publishes every project, every expense and every receipt for an NGO so donors and beneficiaries can see exactly where their money goes. Every expense logged is reviewed by an AI auditor that scores risk and flags suspicious entries.

## What it does

- **Public portal** (no login)
  - Overview dashboard: total budget, funds disbursed, beneficiaries, flagged-expense count, spending by category, latest activity
  - Projects list with utilization bars and AI flag counts
  - Project detail with full expense ledger, AI risk score per line, and receipt links
  - Live expense feed across all projects with an "Only flagged" tab
- **Staff console** (Replit Auth sign-in required)
  - Create projects (name, slug, category, location, budget, beneficiaries)
  - Log expenses against a project, with optional receipt upload to object storage
  - On submit, the AI auditor (OpenAI gpt-5 via the Replit AI Integrations proxy) scores the entry for risk; rule-based fallback if the model is unavailable. Auto-flagged when risk ≥ 60.
- **Audit log** (sign-in required) — append-only record of every database mutation, with actor, summary and metadata. Any change made through the admin console is recorded automatically.

## Architecture

| Layer        | Tech                                                   |
| ------------ | ------------------------------------------------------ |
| Frontend     | React 19 + Vite, TanStack Query, wouter, Tailwind, shadcn/ui |
| Backend      | Express 5 + drizzle-orm + PostgreSQL                   |
| Contract     | OpenAPI spec → orval-generated React Query hooks + zod |
| Auth         | Replit Auth (web flow only)                            |
| Storage      | Replit Object Storage with presigned PUT uploads       |
| AI           | OpenAI gpt-5 via the Replit AI Integrations proxy      |
| Monorepo     | pnpm workspaces                                        |

### Artifacts

- `artifacts/transparency-engine` — the public + staff web app (path: `/`)
- `artifacts/api-server` — Express API (path: `/api`)

### Key shared libs

- `lib/api-spec` — OpenAPI document + orval codegen pipeline (`pnpm --filter @workspace/api-spec run codegen`)
- `lib/api-zod` — generated zod schemas
- `lib/api-client-react` — generated React Query hooks
- `lib/db` — drizzle schema and DB client
- `lib/replit-auth` / `lib/replit-auth-web` — auth server + `useAuth` hook
- `lib/object-storage` / `lib/object-storage-web` — object storage helpers + `useUpload` hook
- `lib/integrations-openai-ai-server` — Replit AI proxy client (uses `AI_INTEGRATIONS_OPENAI_*` env, no key required)

### Data model

- `projects` — name, slug, category, location, description, budget, beneficiaries, status, startDate
- `expenses` — projectId, vendor, category, description, amount, receiptPath, riskScore, riskFlags (jsonb array), riskReasoning, flagged, spentAt
- `audit_logs` — action, entityType, entityId, userId, userEmail, summary, metadata (jsonb)

## Running

The two services run as managed workflows:

- `artifacts/api-server: API Server`
- `artifacts/transparency-engine: web`

After changing the OpenAPI spec, regenerate clients and zod with:

```
pnpm --filter @workspace/api-spec run codegen
```

After changing the DB schema:

```
pnpm --filter @workspace/db run db:push
```

## Risk scoring

`artifacts/api-server/src/lib/risk.ts` implements `assessExpenseRisk`. It tries the AI model first (gpt-5), and falls back to a rule-based scorer that considers: would-overspend the remaining budget, very large amount vs project budget, vague description, missing vendor, no receipt, suspicious round numbers and category outliers. Risk score 0–100; auto-flag at ≥ 60.
