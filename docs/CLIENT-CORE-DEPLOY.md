# Client Core — portal-stack deploy

Customer-facing portal for **Core Real Estate** (investor + customer roles). Internal team uses **Agentyx Platform** (`agentyx-generic-portal`) — a separate Railway service.

Branch: `client-core`

## What this deploy includes

- `/portal/investor` — portfolio, projects, distributions, documents
- `/portal/customer` — unit, progress, payments, documents
- Payload `/admin` — client content team manages pages and CMS
- Realestate collections under `tenants/core/domain`

## What this deploy excludes

- Agentyx LVO (AI Studio, agents, tasks, crews, etc.)
- Business back-office screens that live on Agentyx (`/portal/admin/projects`, CRM admin, etc.)

## Railway setup

1. **New service** from GitHub → `levinnovation/portal-stack` branch `client-core`
2. **Postgres** plugin → `DATABASE_URI=${{Postgres.DATABASE_URL}}`
3. **Env:**

| Variable | Value |
|----------|--------|
| `TENANT_ID` | `core` |
| `NEXT_PUBLIC_SERVER_URL` | Public URL of this service |
| `PAYLOAD_SECRET` | Random secret |
| `OPENAI_API_KEY` | If AI chat enabled |

4. Run seed against this DB: `TENANT_ID=core pnpm seed` (from repo root)

## Link from Agentyx

On the Agentyx deploy (`TENANT_ID=core`):

```
CLIENT_PORTAL_INVESTOR_URL=https://<this-service>/portal/investor
CLIENT_PORTAL_CUSTOMER_URL=https://<this-service>/portal/customer
CLIENT_PORTAL_INVESTOR_ADMIN_URL=https://<this-service>/admin
```

Then set `legacyInAppPortals: false` in agentyx `tenants/core/config.ts` and redeploy Agentyx.

## Auth / SSO (optional)

See agentyx-generic-portal [CLIENT-PORTAL-INTEGRATION.md](https://github.com/levinnovation/agentyx-generic-portal/blob/core-agentyx-portal/docs/CLIENT-PORTAL-INTEGRATION.md).
