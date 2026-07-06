# Fuentes de datos — Agent dashboards CORE

Cinco fuentes server-side en `tenants/core/sources/*`. Sin almacenamiento propio en el portal.

Rutas UI: `/portal/admin/agents/*` · BFF: `/api/agents/*` (requiere sesión admin).

## Variables de entorno

Ver [`.env.example`](../.env.example) y [`tenants/core/lib/env.ts`](../tenants/core/lib/env.ts).

| Variable | Uso |
|----------|-----|
| `INTEGRATION_CORE_QUICKBASE_TOKEN` / `QUICKBASE_USER_TOKEN` | Leah · QuickBase |
| `CORE_QB_CONTRATOS_TABLE_ID`, `CORE_QB_CONVERSION_TABLE_ID` | Tablas Leah |
| `INTEGRATION_CORE_HUBSPOT_TOKEN` / `HUBSPOT_TOKEN` | Qara · HubSpot read-only |
| `HUBSPOT_PORTAL_ID` | Links a deals HubSpot en Contratos |
| `QARA_API_URL`, `QARA_API_KEY` | Qara control (scan, schedule, status) |
| `INTELIGENCIA_API_URL`, `INTELIGENCIA_API_KEY` | Inteligencia BI (Agent 13) |
| `INTELIGENCIA_WORKSPACE_ID` | UUID workspace ETL (distinto de `TENANT_ID`) |
| `LANGFUSE_*` | Status en vivo Qara control |

## 1. Quickbase — Leah (`tenants/core/sources/quickbase.ts`)

REST v1. App CORE `bv52fj77v`. Solo lectura.

Tablas: **Contratos** (atribución) y **Conversión** (embudo por fuente).

## 2. HubSpot — Qara analítica (`tenants/core/sources/hubspot.ts`)

CRM Search API. Orden `lastmodifieddate DESC`. Agrega score, funnel, engagement, etc.

## 3. Qara API — control (`tenants/core/sources/qara.ts`)

| Acción | Endpoint |
|--------|----------|
| Scan / single | `POST /api/v1/run` |
| Job status | `GET /api/v1/jobs/{trace}` |
| Schedule | `GET/POST /api/v1/config/schedule` |

Portal BFF: `/api/agents/qara/*`

## 4. Langfuse — live status (`tenants/core/sources/langfuse.ts`)

Observations por `traceId` (hex sin guiones). Humanize en `tenants/core/lib/humanize.ts`.

## 5. Inteligencia Comercial — Ventas BI (`tenants/core/sources/inteligencia.ts`)

Agent 13. **Sin mock fallback.**

| Endpoint Agent 13 | BFF portal |
|-------------------|------------|
| `GET /api/v1/inteligencia/latest` | `/api/agents/inteligencia/latest` |
| `GET /api/v1/inteligencia/timeseries` | `/api/agents/inteligencia/timeseries` |

Query: `run_type=weekly|monthly`, `workspace_id=<INTELIGENCIA_WORKSPACE_ID>`.

Pantallas: Comando, Segmentos, Equipo, Pauta, Predicciones, Diagnóstico, Experimentos, Reportes.

## Healthcheck

`GET /api/health` — no auth, para Railway.

## Verificación live

```bash
VERIFY_BASE_URL=https://your-deploy.up.railway.app \
VERIFY_SESSION_COOKIE=<payload-token> \
pnpm verify:agents
```
