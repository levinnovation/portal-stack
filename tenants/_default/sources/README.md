# BFF data sources (server-only)

Import `"server-only"` in every module here. Read secrets via `resolveIntegrationToken()` from `@/lib/integrations/credentials`.

Env convention: `INTEGRATION_<TENANT>_<SOURCE>_TOKEN`

See `tenants/core/sources/quickbase.ts` for a reference implementation.
