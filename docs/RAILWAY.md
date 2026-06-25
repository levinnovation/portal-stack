# Deploy en Railway

Un **servicio Railway = un cliente** (`TENANT_ID`). Mismo repo, deploys aislados: Postgres propio, variables propias, dominio propio.

Guía complementaria: [FORK.md](./FORK.md) (checklist local) · [API_INTEGRATION.md](./API_INTEGRATION.md) (FastAPI y REST).

---

## Resumen del modelo

| Concepto | Valor |
|----------|--------|
| Servicio app | Next.js 15 + Payload CMS 3 |
| Base de datos | Postgres (plugin Railway) |
| Build | `Dockerfile` (ver `railway.toml`) |
| Start | `pnpm start` (puerto `3000`) |
| Healthcheck | `GET /admin` |
| Tenant | `TENANT_ID` fija qué carpeta `tenants/<id>/` carga el runtime |

---

## Pasos: primer deploy

### 1. Fork del repo

```bash
# GitHub: Fork → lev innovation/portal-stack
# O clona y sube a tu org:
git clone https://github.com/levinnovation/portal-stack.git client-acme
cd client-acme
git remote set-url origin git@github.com:tu-org/client-acme.git
git push -u origin main
```

Personaliza el tenant antes del deploy (ver [FORK.md](./FORK.md)): `pnpm tenant:new`, edita `tenants/<id>/config.ts`, `pnpm self-check`.

### 2. Nuevo proyecto en Railway

1. [Railway](https://railway.app) → **New Project**
2. **Deploy from GitHub** → selecciona el fork
3. Railway detecta `railway.toml` y construye con el **Dockerfile**

### 3. Postgres

1. En el mismo proyecto → **+ New** → **Database** → **PostgreSQL**
2. En el servicio **app**, añade la variable:

| Variable | Valor |
|----------|--------|
| `DATABASE_URI` | `${{Postgres.DATABASE_URL}}` |

Railway inyecta la URL del plugin. El app espera `DATABASE_URI` (no `DATABASE_URL`).

### 4. Variables de entorno (obligatorias)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URI` | Connection string Postgres | `${{Postgres.DATABASE_URL}}` |
| `PAYLOAD_SECRET` | Secreto JWT Payload (32+ bytes hex) | `openssl rand -hex 32` |
| `TENANT_ID` | ID del tenant en `tenants/<id>/` | `core` |
| `NEXT_PUBLIC_TENANT_ID` | Mismo valor (cliente + edge) | `core` |
| `NEXT_PUBLIC_SERVER_URL` | URL pública **HTTPS** del servicio | `https://acme.up.railway.app` |
| `NODE_ENV` | Railway lo suele poner en `production` | `production` |

Sin `NEXT_PUBLIC_SERVER_URL` correcta, CORS/CSRF de Payload y cookies `secure` fallan en producción.

### 5. Deploy y bootstrap

1. Espera healthcheck verde (`GET /admin`)
2. Abre `https://<tu-dominio>/admin` → crea el primer usuario (superadmin)
3. Seed de páginas (one-off en Railway CLI o local contra DB remota):

```bash
# Local con DATABASE_URI apuntando a Railway:
TENANT_ID=core pnpm seed
TENANT_ID=core pnpm seed:datasets   # opcional
pnpm self-check
```

4. Portal: `https://<tu-dominio>/portal/auth`

---

## Variables opcionales

### AI (agente in-app)

| Variable | Cuándo |
|----------|--------|
| `OPENAI_API_KEY` | `ai.backend=local` y provider OpenAI |
| `ANTHROPIC_API_KEY` | Modelo Anthropic en tenant config |
| `AI_BACKEND=fastapi` | Proxy chat hacia agente externo |
| `FASTAPI_AGENT_URL` | URL base del servicio FastAPI (sin `/v1/chat`) |
| `FASTAPI_AGENT_SECRET` | Bearer compartido portal ↔ FastAPI |
| `FASTAPI_AGENT_TIMEOUT_MS` | Default `30000` |
| `AI_BACKEND_FALLBACK=local` | Si FastAPI cae, reintentar con AI SDK local |

Ver [API_INTEGRATION.md](./API_INTEGRATION.md) para el contrato FastAPI.

### Integraciones

| Variable | Cuándo |
|----------|--------|
| `WEBHOOK_SECRET` | Valida header `x-webhook-secret` en webhooks |
| `INTEGRATION_<TENANT>_<SOURCE>_TOKEN` | Tokens por tenant (QuickBase, HubSpot, …) |
| `QUICKBASE_REALM`, `QUICKBASE_*_TABLE` | Sync QuickBase |
| `RESEND_API_KEY`, `EMAIL_FROM` | Emails (sin key → log en consola) |

Convención tokens: `INTEGRATION_CORE_QUICKBASE_TOKEN` con `TENANT_ID=core`.

### Auth

| Variable | Cuándo |
|----------|--------|
| `AUTH_COOKIE_NAME` | Si el tenant usa cookie distinta de `payload-token` |
| `AUTH_PROVIDER=agentyx` | JWT vía JWKS (futuro) |
| `AGENTYX_JWKS_URL`, `AGENTYX_AUDIENCE` | Con provider Agentyx |

### Redis (opcional, roadmap)

Hoy **portal-stack no usa Redis en runtime** (datasets usan cache en memoria). Añade el plugin Redis en Railway cuando necesites:

- Cache compartido entre réplicas del servicio
- Rate limiting / colas en integraciones futuras
- Sesiones externas

Variables preparadas (comentadas en `.env.example`):

```env
# REDIS_URL=${{Redis.REDIS_URL}}
# REDIS_URL=redis://localhost:6379
```

Conecta el plugin y referencia `${{Redis.REDIS_URL}}` cuando el código lo consuma.

---

## Build y runtime

### `railway.toml`

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "pnpm start"
healthcheckPath = "/admin"
healthcheckTimeout = 60
```

- **Dockerfile**: multi-stage `node:20-alpine`, `pnpm build`, expone `3000`
- **Railpack/Nixpacks**: no es el default de este repo; si quitas el Dockerfile, Railway puede inferir Node — preferimos Dockerfile para builds reproducibles

### Healthcheck

Railway hace `GET /admin` hasta 60s. Si falla:

- Revisa logs de build (`pnpm build` debe completar)
- `DATABASE_URI` válida y Postgres accesible desde el servicio
- `PAYLOAD_SECRET` definido

---

## Dominio custom

1. Servicio app → **Settings** → **Networking** → **Custom Domain**
2. CNAME al host que indica Railway
3. Actualiza `NEXT_PUBLIC_SERVER_URL=https://portal.tu-cliente.com`
4. Redeploy (Payload CORS/CSRF leen esa URL en boot)

Un dominio = un cliente = un `TENANT_ID`.

---

## Local vs producción

### Local (`docker-compose.yml`)

```bash
docker compose up -d          # solo Postgres en :5432
cp .env.example .env
pnpm install && pnpm dev
```

| | Local | Railway |
|---|--------|---------|
| Postgres | Contenedor `portal-stack-postgres` | Plugin PostgreSQL |
| App | `pnpm dev` (:3000) | Servicio Docker `pnpm start` |
| URL | `http://localhost:3000` | `https://*.up.railway.app` o custom |
| Secretos | `.env` (gitignored) | Variables Railway |

No subas `.env` al repo. Usa **Variables** en el dashboard o Railway CLI.

### Múltiples clientes

| Cliente | Railway project | Postgres | `TENANT_ID` |
|---------|-----------------|----------|-------------|
| Core RE | `portal-core` | Postgres A | `core` |
| Finu | `portal-finu` | Postgres B | `finu` |
| Acme | `portal-acme` | Postgres C | `acme` |

Mismo código (mismo fork o mono-repo), **nunca** compartir Postgres entre tenants de producción.

---

## Patrón multi-servicio: portal + FastAPI

Muchos agentes Lev corren **FastAPI** aparte. Arquitectura recomendada en Railway:

```
┌─────────────────────┐     POST /v1/chat      ┌──────────────────────┐
│  portal-stack       │ ─────────────────────► │  FastAPI agent       │
│  (TENANT_ID=core)   │   Bearer SECRET        │  (Python, tools, RAG)│
│  NEXT_PUBLIC_URL    │ ◄── SSE stream ─────── │  FASTAPI_AGENT_URL   │
└─────────┬───────────┘                        └──────────┬───────────┘
          │                                               │
          │  sessionToken (JWT cookie)                    │ GET /api/users/me
          │  para validar sesión                          │ Authorization: JWT
          ▼                                               ▼
     Postgres A                                      (opcional) llama REST
                                                      del portal como BFF
```

### Servicio 1 — Portal (este repo)

```env
TENANT_ID=core
AI_BACKEND=fastapi
FASTAPI_AGENT_URL=https://agent-core-production.up.railway.app
FASTAPI_AGENT_SECRET=<secreto-compartido>
NEXT_PUBLIC_SERVER_URL=https://portal-core.up.railway.app
```

En `tenants/core/config.ts` también puedes fijar `ai.backend: "fastapi"`.

### Servicio 2 — Agente FastAPI

Deploy separado (otro repo Python). Variables mínimas:

```env
PORTAL_STACK_URL=https://portal-core.up.railway.app
FASTAPI_AGENT_SECRET=<mismo-secreto>
```

Implementa `POST /v1/chat` según [API_INTEGRATION.md](./API_INTEGRATION.md). El portal reenvía `sessionToken` para que el agente valide al usuario contra Payload.

**Red privada Railway**: si ambos servicios están en el mismo project, puedes usar la URL interna del servicio FastAPI en `FASTAPI_AGENT_URL` (menor latencia; el chat proxy es server-side).

---

## Checklist post-deploy

```bash
pnpm self-check                    # en CI o local contra el fork
curl -s -o /dev/null -w "%{http_code}\n" https://<url>/admin   # → 200
curl -s -o /dev/null -w "%{http_code}\n" https://<url>/api/pages # → 403 sin JWT
```

- [ ] Primer admin en `/admin`
- [ ] `pnpm seed` con el `TENANT_ID` correcto
- [ ] Login en `/portal/auth`
- [ ] Si FastAPI: health del agente + chat en un bloque `chat`
- [ ] Webhooks: `WEBHOOK_SECRET` si expones `/api/webhooks/*`

---

## Troubleshooting

| Síntoma | Causa probable |
|---------|----------------|
| Healthcheck timeout | Build falló o app no escucha en `PORT` (Railway inyecta `PORT`; Next usa 3000 por defecto — OK con Dockerfile `EXPOSE 3000`) |
| CORS en admin Payload | `NEXT_PUBLIC_SERVER_URL` no coincide con la URL del browser |
| Portal redirect loop | Cookie `payload-token` no se setea; revisa `secure` + HTTPS |
| AI 503 | `FASTAPI_AGENT_URL` / `SECRET` faltantes o agente caído |
| Tenant equivocado | `TENANT_ID` no registrado en `tenants/registry.ts` → falla `pnpm self-check` |
