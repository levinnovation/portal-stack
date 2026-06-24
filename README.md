# Portal Stack

> **Multi-tenant portal platform** built on Next.js 15 + Payload CMS 3 + Postgres. Deploy once per client, customise per-tenant via filesystem overlays and a layout builder in the admin panel. Includes an in-app AI agent (AI SDK 5) that reads tenant-scoped data through Payload tools.

Part of the **Lev Innovation** ecosystem. Bridges the [`portal-core-cms`](../portal-core-cms) Core Real Estate tenant with a generic, re-usable template that can be cloned for any new client (Finu, Contax, Lev, …).

---

## What is in here

| Capability | Where | Notes |
|---|---|---|
| **Multi-tenant runtime** | `src/lib/tenant.ts` + `tenants/<id>/config.ts` | One deploy per client, env-driven. Config can be overridden in the DB via the `tenants` Payload collection. |
| **Payload CMS 3** | `src/payload.config.ts`, `src/collections/`, `tenants/<id>/domain/` | Generic collections in `src/collections`. Vertical collections live under each tenant. |
| **Layout builder** | `Pages` + `Datasets` + `Dashboards` collections, `src/lib/blocks/`, `src/lib/datasets/` | Admins compose dashboards from blocks (Hero, KPI grid, Chart, Table, Form, Markdown, Chat, Divider, Iframe). No code changes needed. |
| **In-app AI agent** | `src/lib/ai/`, `src/app/api/ai/chat/route.ts`, `src/components/blocks/ChatBlock.tsx` | Streams via `streamText` from AI SDK 5. Tools call Payload directly. System prompt per tenant. Persists chats + tool calls. |
| **Auth abstraction** | `src/lib/auth/provider.ts` | `LocalPayloadAuthProvider` today. Slot for `AgentyxAuthProvider` (JWT validation against the [`agentyx-better-auth`](../agentyx-better-auth) JWKS). |
| **Per-tenant UI** | `src/components/PortalShell.tsx`, `tailwind.config.ts`, `src/app/globals.css` | Theme tokens (HSL CSS vars) come from the tenant config. Sidebar nav is tenant-defined (icon names → component map). |
| **Webhooks** | `Webhooks` collection | Generic audit log for inbound webhooks (Agentyx, QuickBase, Stripe, n8n). |
| **Railway-ready** | `Dockerfile`, `railway.toml` | One-click deploy, healthcheck at `/admin`. |

## Repo layout

```
portal-stack/
├── src/
│   ├── app/
│   │   ├── (payload)/                 # Payload admin + REST/GraphQL (fixed)
│   │   │   ├── admin/[[...segments]]/
│   │   │   ├── api/[...slug]/route.ts
│   │   │   ├── api/graphql/route.ts
│   │   │   ├── api/graphql-playground/route.ts
│   │   │   ├── custom.scss
│   │   │   └── layout.tsx
│   │   ├── (frontend)/
│   │   │   ├── page.tsx                # landing
│   │   │   ├── portal/
│   │   │   │   ├── auth/
│   │   │   │   ├── admin/[...slug]/    # catch-all → renderPage()
│   │   │   │   ├── investor/[...slug]/
│   │   │   │   ├── customer/[...slug]/
│   │   │   │   ├── profile/
│   │   │   │   ├── notifications/
│   │   │   │   └── page.tsx            # redirect to role home
│   │   │   └── layout.tsx
│   │   └── api/
│   │       ├── auth/login/route.ts
│   │       ├── auth/signout/route.ts
│   │       └── ai/chat/route.ts        # AI SDK streamText endpoint
│   ├── collections/                    # generic (always present)
│   │   ├── Users.ts
│   │   ├── Media.ts
│   │   ├── Documents.ts
│   │   ├── Notifications.ts
│   │   ├── AuditLogs.ts
│   │   ├── Tenants.ts                  # DB-driven tenant config
│   │   ├── Webhooks.ts
│   │   ├── Pages.ts                    # layout builder
│   │   ├── Datasets.ts                 # named queries
│   │   ├── Dashboards.ts
│   │   ├── AIChats.ts
│   │   ├── AIMessages.ts
│   │   └── _blocks.ts                  # shared block field schema
│   ├── lib/
│   │   ├── tenant.ts                   # getTenant() / getTenantTheme() / isVerticalEnabled()
│   │   ├── session.ts                  # getSession / requireSession / requireRole
│   │   ├── auth/provider.ts            # AuthProvider interface + LocalPayloadAuthProvider
│   │   ├── payload.ts
│   │   ├── utils.ts
│   │   ├── finance.ts                  # xirr, cashOnCash, equityMultiple, NOI
│   │   ├── blocks/
│   │   │   ├── renderer.tsx            # maps blockType → component
│   │   │   └── render-page.tsx         # server-side page composition
│   │   ├── datasets/
│   │   │   ├── runner.ts               # query executor (count/sum/avg/list/monthly)
│   │   │   └── resolve.ts              # resolves all datasets used by a page
│   │   └── ai/
│   │       ├── agent.ts                # model + prompt + tools resolver
│   │       └── tools/index.ts          # 8 tools backed by Payload
│   ├── components/
│   │   ├── PortalShell.tsx             # tenant-driven sidebar
│   │   ├── ui/                         # shadcn-style primitives
│   │   └── blocks/                     # Hero, KpiGrid, Chart, Table, Form, Markdown, Divider, Iframe, Chat
│   └── payload.config.ts               # buildCollections() reads TENANT_ID
├── tenants/
│   ├── _default/                       # fallback tenant
│   │   ├── config.ts
│   │   └── ai/prompts.ts
│   ├── core/                           # Core Real Estate (production tenant)
│   │   ├── config.ts
│   │   ├── pages.ts                    # seed Pages records (demos every block)
│   │   ├── ai/prompts.ts
│   │   └── domain/                     # 9 real-estate collections
│   │       ├── collections.ts
│   │       └── collections/{Projects,Units,Investors,...}.ts
│   └── <your-tenant>/                  # add more here
├── scripts/
│   ├── seed.ts                         # idempotent seeder: writes tenants/<id>/pages.ts into Payload
│   └── new-tenant.ts                   # CLI: scaffold a new tenant
├── public/media/                       # uploads (gitignored)
├── Dockerfile
├── railway.toml
├── package.json
└── tsconfig.json
```

## Quickstart

### 1. Requirements

- Node.js 20.9+
- pnpm 9+
- Postgres 14+ (local, Docker, or hosted)

### 2. Install

```bash
git clone https://github.com/levinnovation/portal-stack.git
cd portal-stack
pnpm install
```

### 3. Configure

```bash
cp .env.example .env
```

Set:

```env
DATABASE_URI=postgresql://postgres:postgres@localhost:5432/portal_stack
PAYLOAD_SECRET=<openssl rand -hex 32>
TENANT_ID=core
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
OPENAI_API_KEY=sk-...          # optional; required only if you enable the AI agent
```

### 4. Run

```bash
pnpm dev
```

Open:

- `http://localhost:3000` — landing
- `http://localhost:3000/admin` — Payload admin (create your first superadmin)
- `http://localhost:3000/portal/auth` — login
- `http://localhost:3000/portal/admin` — admin dashboard (renders the `admin-overview` Page)
- `http://localhost:3000/portal/investor` — investor dashboard
- `http://localhost:3000/portal/customer` — customer dashboard

### 5. Seed demo Pages

After creating your first admin user:

```bash
TENANT_ID=core pnpm seed   # or omit TENANT_ID (defaults to core)
```

This reads `tenants/<id>/pages.ts` and upserts Pages into Payload. Re-run anytime to update them.

## Multi-tenant workflow

### Anatomy of a tenant

A tenant is a directory under `tenants/<id>/` containing:

```
tenants/core/
├── config.ts                    # TenantConfig: theme, roles, features, ai, auth
├── ai/prompts.ts                # system prompt + persona
├── pages.ts                     # seed Pages (optional)
└── domain/                      # vertical-specific Payload collections
    ├── collections.ts
    └── collections/*.ts
```

### Adding a new tenant

See **[Nuevo cliente en 10 minutos](#nuevo-cliente-en-10-minutos)** below for the full checklist.

```bash
pnpm tenant:new -- --id=finu --name="Finu" --vertical=fintech
```

This scaffolds `tenants/finu/` with `config.ts`, stub `pages.ts` (`finuPages`), and `domain/index.ts` (`finuCollections`). Then:

1. Edit `tenants/finu/config.ts` (theme, roles, features, AI model)
2. Edit `tenants/finu/ai/prompts.ts` (persona)
3. Add collections to `tenants/finu/domain/index.ts` and wire `payloadCollections` in config
4. Register in `src/lib/tenant.ts` `TENANT_REGISTRY` (the CLI prints the exact diff)
5. Run `pnpm self-check` — fails if a `tenants/<id>/` folder is not registered
6. Seed pages: `TENANT_ID=finu pnpm seed`
7. Deploy a new Railway service with `TENANT_ID=finu` and a separate Postgres plugin

Vertical collections are resolved automatically from `TenantConfig.payloadCollections` at boot — no manual branch in `payload.config.ts`.

### Nuevo cliente en 10 minutos

Flujo repetible para un deploy aislado por cliente:

| Paso | Comando / archivo | ~min |
|---|---|---|
| 1 | `pnpm tenant:new -- --id=<id> --name="<Nombre>" --vertical=<realestate\|fintech\|generic>` | 1 |
| 2 | Editar `tenants/<id>/config.ts` — theme, features, roles, `payloadCollections` | 3 |
| 3 | Editar `tenants/<id>/pages.ts` — slugs alineados con nav y `defaultLandingPageSlug` | 2 |
| 4 | Registrar en `src/lib/tenant.ts` (el CLI imprime el diff exacto) | 1 |
| 5 | `pnpm self-check` | 1 |
| 6 | Crear superadmin en `/admin`, luego `TENANT_ID=<id> pnpm seed` | 1 |
| 7 | Railway: nuevo servicio + Postgres, `TENANT_ID=<id>` | 1 |

**Sincronía roles ↔ páginas:** cada rol con layout builder necesita un `defaultLandingPageSlug` que exista en `tenants/<id>/pages.ts`. Los ítems de `nav` con `end: true` apuntan al home del rol; el resto son sub-rutas bajo `/portal/<role>/…`.

| Tenant | Rol | `defaultLandingPageSlug` | Nav home (`end: true`) | Otros nav → slug esperado |
|---|---|---|---|---|
| **core** | admin | `admin-overview` | `/portal/admin` | `/portal/admin/projects` → page slug `projects` (cuando exista) |
| **core** | investor | `investor-portfolio` | `/portal/investor` | `/portal/investor/distributions` → `distributions` |
| **core** | customer | `customer-overview` | `/portal/customer` | `/portal/customer/payments` → `payments` |
| **core** | *(todos)* | — | `/portal/profile` | slug compartido `profile` |
| **finu** | admin | `finu-admin-overview` | `/portal/admin` | `/portal/admin/loans` → `loans` (stub futuro) |
| **finu** | customer | `finu-customer-overview` | `/portal/customer` | `/portal/customer/payments` → `payments` |
| **\<nuevo\>** | admin | `<id>-admin-overview` | `/portal/admin` | `/portal/profile` → `profile` (generado por `tenant:new`) |

Convención de exports:

- `tenants/<id>/pages.ts` → `export const <id>Pages`
- `tenants/<id>/domain/index.ts` → `export const <id>Collections`
- `tenants/<id>/config.ts` → `export const <id>Tenant` con `payloadCollections: <id>Collections`

### DB-driven overrides

Each tenant can be partially overridden in the DB via the `tenants` collection (superadmin only). This lets you change theme colors, enable/disable features (chat, excel, quickbase), or tweak the AI model without redeploying. The override is shallow-merged on top of the TS registry.

## Layout builder

Dashboards are composed in the Payload admin (no code). A `Page` has:

- `slug` — URL path under `/portal/<role>/`
- `allowedRoles` — which roles can view
- `layout` — array of typed blocks

Available blocks:

| Block | Purpose | Key props |
|---|---|---|
| `hero` | Top banner with CTA | title, subtitle, image, ctaLabel, ctaHref, background |
| `kpi-grid` | Grid of metric cards | cards: [{ label, dataset, format, icon }] |
| `chart` | Line/bar/pie/area chart (recharts) | dataset, kind, height |
| `table` | Tabular data with paging & formatting | dataset, columns: [{ key, label, format }], pageSize |
| `form` | Submit-to-endpoint form | endpoint, fields: [...] |
| `markdown` | Lexical rich text | body |
| `divider` | Spacer | size |
| `iframe` | Embedded URL | src, height |
| `chat` | AI agent widget | agentId, greeting, suggestedPrompts |

### Datasets

A block's `dataset` string points to a query. Two forms:

1. **Inline**: `"count:projects"`, `"sum:investments.amountInvested"`, `"list:units"`, `"monthly:payments.amount"`. Format is `<kind>:<collection>` or `<kind>:<collection>.<field>` for sum/avg.
2. **Named**: any string key. Looked up in the `datasets` Payload collection, which lets admins define reusable queries with `where` filters, sorts, custom handlers.

Supported query kinds: `count`, `sum`, `avg`, `list`, `monthly`, `custom` (handler in `src/lib/datasets/handlers/<name>.ts`).

## AI agent

The in-app chat agent is powered by [AI SDK 5](https://ai-sdk.dev). One endpoint, `/api/ai/chat`, streams responses from OpenAI or Anthropic. The model, system prompt, max steps and temperature are tenant-driven.

The 8 default tools:

| Tool | Description |
|---|---|
| `list_projects` | List real-estate projects, optional status filter |
| `get_project` | Fetch a single project by id or name |
| `list_investors` | List investors (admin only) |
| `get_investor_portfolio` | Capital totals, ROI, investments for an investor |
| `list_distributions` | Recent payouts |
| `list_payments` | Recent payments, optional status filter |
| `get_customer_unit` | Current customer's unit + progress |
| `list_documents` | Documents visible to the current user |
| `portfolio_kpis` | Aggregate KPIs across the whole portfolio |

All tools are defined in `src/lib/ai/tools/index.ts` and run server-side against Payload. They respect per-user data scoping (admins see all; customers see only their own).

To add a tenant-specific tool, extend `buildTools()` in the tenant's `ai/` directory or add to the core toolset.

### Adding an OpenAI/Anthropic key

```env
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...
```

Set the model in `tenants/<id>/config.ts → ai.model`. Common values: `gpt-4o-mini`, `gpt-4o`, `claude-3-5-sonnet-latest`.

### FastAPI backend (optional)

Tenants can route chat to an external FastAPI agent instead of the in-process AI SDK. Set `ai.backend = "fastapi"` in `tenants/<id>/config.ts`, or `AI_BACKEND=fastapi` globally.

Contract:

```
POST {FASTAPI_AGENT_URL}/v1/chat
Headers: Authorization: Bearer <FASTAPI_AGENT_SECRET>, Content-Type: application/json
Body: { tenantId, userId, role, agentId, chatId, messages, sessionToken? }
Response: text/event-stream (AI SDK UIMessage stream, passthrough to client)
```

Next.js still persists chats and messages in Payload for both backends. Types live in `src/lib/ai/fastapi-types.ts`.

On network/config failure the proxy returns **503** (no silent fallback). Set `AI_BACKEND_FALLBACK=local` to opt into retrying with the in-process AI SDK.

## Auth: local today, Agentyx-ready

Current implementation (`LocalPayloadAuthProvider`) issues a JWT cookie via Payload's built-in auth. To plug in the Lev Innovation Agentyx stack:

1. Implement `AgentyxAuthProvider` in `src/lib/auth/provider.ts` (validates JWT against `agentyx-better-auth`'s JWKS, maps `sub` → local `users.id`).
2. Set `tenants/<id>/config.ts → auth.provider = "agentyx"`.
3. Set `auth.agentyxJwksUrl` and `auth.agentyxAudience` env.

The rest of the app (server components, AI agent scoping, access control) is provider-agnostic.

### Portal security (phase 1)

- **Middleware** (`src/middleware.ts`): unauthenticated `/portal/*` requests redirect to `/portal/auth` (cookie presence only; JWT validated server-side).
- **Route prefix guards** (`src/lib/auth/portal-access.ts`): e.g. `customer` users cannot render `/portal/admin/*` pages (redirect to their `homePath`).
- **Payload REST**: `pages`, `datasets`, `media`, `dashboards` require auth; `tenants` is admin-only read.
- **AI tools**: role-scoped queries in `src/lib/ai/scoping.ts` (admins see all; investors/customers see own data).
- **Admin portal switcher**: sidebar links to other role portals are UI convenience; data access is enforced by route guards + Payload ACL.
- **Self-checks**: `pnpm self-check` runs assert-based checks (no test framework).

Custom auth cookie names: set `AUTH_COOKIE_NAME` env to match `tenants/<id>/config.ts → auth.cookieName` so middleware and login stay in sync.

## Deploy to Railway (one per tenant)

1. Push to GitHub.
2. Railway → **New Project → Deploy from GitHub** → select `levinnovation/portal-stack`.
3. Add a **Postgres** plugin to the project.
4. Set environment variables:
   ```
   DATABASE_URI = <from Postgres plugin>
   PAYLOAD_SECRET = <openssl rand -hex 32>
   TENANT_ID = core
   NEXT_PUBLIC_SERVER_URL = https://<your-app>.up.railway.app
   OPENAI_API_KEY = sk-...  # if using AI
   ```
5. Deploy. Once healthy, visit `https://<your-app>/admin` to create the first user, then `pnpm seed` (or run via Railway one-off) to insert the Pages.

For a second tenant, repeat steps 1-5 with a different `TENANT_ID`, a separate Railway project, and a separate Postgres plugin. (Same code, isolated data.)

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start the production server |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm seed` | Insert/update seed Pages for the active tenant (`TENANT_ID`, default `core`) |
| `pnpm tenant:new` | Scaffold a new tenant under `tenants/` |
| `pnpm self-check` | Run ponytail assert checks (auth, scoping, tenant registry, seed resolver) |

## Roadmap

- [ ] Agentyx `AuthProvider` adapter (JWT validation)
- [ ] Server-side webhooks for QuickBase (bidirectional sync)
- [ ] Excel upload endpoint (`/api/forms/excel-upload`)
- [ ] S3 / Vercel Blob media storage per-tenant
- [ ] Per-tenant custom domains
- [ ] RAG over `documents` (pgvector)
- [ ] Vertical `fintech` collection set
- [ ] Voice integration via LiveKit (`agentyx-core-voice`)

## License

Proprietary — © Lev Innovation.
