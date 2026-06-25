# Fork checklist — portal por cliente

Un deploy = un cliente. Fork este repo, no arranques un Next vacío.

## 1. Clonar y configurar

```bash
git clone https://github.com/levinnovation/portal-stack.git client-<nombre>
cd client-<nombre>
cp .env.example .env
docker compose up -d
pnpm install
```

Variables mínimas en `.env`:

| Variable | Ejemplo |
|----------|---------|
| `DATABASE_URI` | `postgresql://postgres:postgres@localhost:5432/portal_stack` |
| `PAYLOAD_SECRET` | string largo aleatorio |
| `TENANT_ID` | `core` |
| `NEXT_PUBLIC_TENANT_ID` | `core` |
| `NEXT_PUBLIC_SERVER_URL` | `http://localhost:3000` |

## 2. Tenant

Opción A — tenant nuevo:

```bash
pnpm tenant:new -- --id=acme --name="Acme Corp" --vertical=realestate
# Edita tenants/acme/config.ts (theme, roles, nav, features)
TENANT_ID=acme pnpm seed
```

Opción B — usar tenant `core` y personalizar `tenants/core/config.ts`.

`pnpm tenant:new` registra el tenant en [`tenants/registry.ts`](../tenants/registry.ts) automáticamente.

## 3. Primer admin y datos

```bash
pnpm dev
# Abre http://localhost:3000/admin → crear primer usuario (admin)
TENANT_ID=core pnpm seed
TENANT_ID=core pnpm seed:datasets   # opcional
pnpm self-check
```

## 4. Qué editar en el fork

| Sin redeploy (CMS) | Con código + deploy |
|--------------------|---------------------|
| Pages / blocks en `/admin` | `tenants/<id>/config.ts` (nav, theme, roles) |
| Datasets nombrados | `tenants/<id>/pages.ts` + `pnpm seed` |
| Users, media, documents | `tenants/<id>/domain/` (collections verticales) |
| Theme parcial vía collection `tenants` | Pantallas custom (`tenants/<id>/screens/`) |
| | Nuevos block types en `src/collections/_blocks.ts` |

## 5. Pantallas custom (tipo core-dashboard)

Patrón recomendado:

```
tenants/<id>/
  screens/agents-overview.tsx   # Server Component
  sources/quickbase.ts          # server-only, secrets en env
src/app/(frontend)/portal/admin/agents/page.tsx  # ruta que importa el screen
```

Nav en `config.ts`:

```ts
{ to: "/portal/admin/agents", label: "Agentes", icon: "BarChart3", kind: "custom" }
```

Credenciales: `INTEGRATION_<TENANT>_<SOURCE>_TOKEN` (ver `.env.example`).

## 6. Deploy (Railway)

Guía completa: **[RAILWAY.md](./RAILWAY.md)** (Postgres, env vars, dominio, multi-servicio FastAPI).

Integraciones y agentes FastAPI: **[API_INTEGRATION.md](./API_INTEGRATION.md)**.

Resumen:

- Un servicio Railway = un cliente (`TENANT_ID`)
- Postgres plugin → `DATABASE_URI=${{Postgres.DATABASE_URL}}`
- Obligatorias: `PAYLOAD_SECRET`, `TENANT_ID`, `NEXT_PUBLIC_TENANT_ID`, `NEXT_PUBLIC_SERVER_URL`
- Healthcheck: `GET /admin`

## No tocar salvo que sepas por qué

- `src/collections/` genéricas (Users, Pages, Datasets…)
- `src/app/(payload)/` — admin Payload
- `src/middleware.ts` — cookie gate del portal

## Verificación

```bash
pnpm self-check
pnpm seed          # idempotente
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/pages  # → 403 sin cookie
```
