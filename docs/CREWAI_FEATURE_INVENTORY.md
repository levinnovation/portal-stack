# CrewAI Template — E2E Feature Inventory

End-to-end audit of every feature across all 68 branches of `lev-crewai-agent-template`, organized into three layers: the **horizontal kernel** (`main`), **horizontal feature branches** (reusable platform capabilities), and **domain SKU workers** (`agent/*` + domain `feat/*`). This is the source-of-truth inventory referenced by the bundled-agent metadata-DB plan.

Repo: `/Users/vinicioflores/lev-fleet/lev-crewai-agent-template`
Method: per-branch `git diff --stat origin/main...origin/<branch>` + read of flows / agents / tools / domain_packs / settings, plus merge-base ancestry checks. No checkouts, read-only.

---

## Layer 1 — Horizontal kernel (`origin/main`)

The shared CrewAI worker that every SKU specializes. A single kernel image, differentiated at deploy time by `AGENT_ENTRY`, `AGENT_TOOL_SET`, optional `TENANT_PACK`, and per-workspace credentials injected by the control plane.

### Tool registry (`lev_crewai/tools/registry.py`)

~50 static tool slugs (`_TOOL_FACTORIES`), resolved via `ToolRegistry` in `lev_crewai/sdk/tools/registry.py`. No `auth_type` metadata on `main` — credential needs are implied by SDK clients + `get_credentials()` with env fallback.

- AI generation: `ai_generate_image`, `ai_generate_text`, `ai_generate_video`
- Analytics: `bi_database_query`, `python_code_runner`
- Browser: `web_browser`, `web_task`, `web_record`, `web_narrated_record`, `web_screenshot`, `web_pdf`, `web_vitals`, `web_react`
- Data stores: `postgres_query`, `redis_remember`, `redis_recall`, `qdrant_search`
- Knowledge/search: `kb_search`, `web_search`
- CRM (Twenty native): `twenty_read_context`, `twenty_upsert_person`, `twenty_upsert_company`, `twenty_upsert_opportunity`
- CRM (provider abstraction): `crm_find_contact`, `crm_upsert_contact`, `crm_log_note`, `crm_update_fields`, `crm_create_deal`, `crm_search_contacts`
- Quickbase: `quickbase_upsert_record`
- Channels: `telegram_send_message`, `openwa_send_message`
- Contact/domain: `contact_book_lookup`, `project_status_lookup` (registered only if import succeeds)
- MS Graph: `ms_graph_list_planner_tasks`, `ms_graph_write_task_note`, `ms_graph_post_teams_message`
- Document/email: `document_extract`, `resend_send_email`, `ocr_extract`
- Artifacts/files: `generate_artifact`, `send_file`
- MCP gateway: `slack_send_message`, `slack_read_messages`, `google_calendar_create_event`, `google_calendar_events_list`, `google_drive_delete`, `gmail_send_email`, `google_sheets_*`
- Voice: `voice_call_initiate`, `voice_outbound_call`
- Dynamic: `resolve_composio_tools()` (Composio), `build_remote_agent_tool()` (remote A2A delegation)

Workspace credential keys the control plane can inject (matches `workspace_credentials.service` slugs): `hubspot`, `twenty`, `quickbase`, `ms_graph`, `mcp`, `resend`, `smtp`, `telegram`, `kapso`.

### Domain Pack framework (`domain_packs/`)

`DomainPack` schema (`domain_packs/schema.py`): `slug`, `sku` (default `customer_service`), `display_name`, `persona` (name/role/goal/voice/language/guardrails), `kb` (namespace/index/top_k), `crm` (`hubspot|twenty|none`), `channels` (primary/fallback), `escalation` (triggers/handoff/notify), `extra_tools[]`. Packs are secret-free and inert until wired via `TENANT_PACK` (`domain_packs/loader.py` + `render.py` → `AGENT_*`/`CRM_PROVIDER`/`DEFAULT_KB_*` env).

Notable gaps: `tool_set` and `crew` are NOT pack fields today — tool exposure is `AGENT_TOOL_SET`/module `TOOL_SET` + `extra_tools`; the crew/flow is chosen by `AGENT_ENTRY`.

### SDK clients (`lev_crewai/sdk/clients/`, ~39 modules)

CRM (`crm/hubspot.py`, `twenty.py`, `factory.py`, `actions.py`, `property_map.py`), `kb.py`, `quickbase.py`, `ms_graph.py`, `mcp.py`, `email.py`, `file_store.py`, `voice.py`, `livekit_voice.py`, `whatsapp_thread_state.py`, `composio_whatsapp.py`, `analytics_db.py`, `web_research.py`, `ocr.py`, `document_ai/*`, `artifact.py`, `registry_store.py`, `contact_book_store.py`, `campaign_store.py`, `schedule_config.py`, `captcha.py`, `agent_runner.py`, `agent_deployment.py`, channels `kapso_transport`/`telegram_transport`/`livekit_transport`.

### Runtime catalog (`lev_crewai/sdk/runtime_catalog.py`)

`build_runtime_catalog()` (powers `GET /api/v1/meta` + self-register): resolves entry class from `AGENT_ENTRY`, entry kind (flow/crew), introspects `@start`/`@listen`/router flow graph, resolves `tool_set` (`AGENT_TOOL_SET` env > module `TOOL_SET` > inferred from env), and metadata from `AGENT_*`.

### API surface (`api/`)

`POST /api/v1/run` + `GET /jobs/{id}` (primary execution), `GET /meta`, `GET/POST /config/schedule`, channel webhooks (`telegram`, `webhooks_slack`, `whatsapp`/kapso-wa, `openwa`, `kapso`), generic `webhooks/source/{source}`, `portal_shim` (`/portal/workspaces/{id}/execute`), `diagnostics`. Webhook handlers call `resolve_credentials_for_webhook()` when `BACKEND_URL` + `INTERNAL_CREDENTIALS_TOKEN` set.

### Control-plane integration

Settings: `BACKEND_URL`, `WORKSPACE_ID`, `INTERNAL_REGISTRATION_TOKEN`, `INTERNAL_CREDENTIALS_TOKEN`, `SELF_REGISTER_INTERVAL_SECONDS`, `PUBLIC_BASE_URL`. Self-register POSTs to `{BACKEND_URL}/api/v1/internal/agent-deployments/self-register`. Credentials: `lev_crewai/credentials/context.py` (`set/get_credentials`), `lev_crewai/sdk/credentials_resolver.py` (webhook path fetches `/internal/workspaces/{id}/credentials/resolve` with `tool_set`, 60s cache). This is the same contract the metadata-DB plan builds on.

---

## Layer 2 — Horizontal feature branches

Reusable platform capabilities. 13/20 audited are already merged into `main`; the rest are fold candidates.

### Merged (already in kernel)

- `platform/appointment-scheduling` — scheduling SDK (`sdk/scheduling.py`, free-slot/conflict, HubSpot meeting lookup, `.ics`). Consumers: appointments, sales, CS.
- `platform/eyal-ms-graph-and-registry` — MS Graph SDK + tools (Planner/Teams). Consumers: PM/ops, any Graph need.
- `platform/mirror-schema-provisioning` — prod→sandbox mirror (`sdk/migration/mirror.py`, QB schema CRUD, HubSpot property create). Consumers: onboarding, marketing, PM.
- `platform/livekit-sip-caller-id` — outbound SIP caller ID. Consumers: sales/CS voice.
- `platform/hubspot-source-backfill` — cross-portal backfill script. Consumers: onboarding/seed.
- `feat/file-store-attachments` — File Store client + `send_file`. Consumers: CS, sales.
- `feat/livekit-voice-sdk` — outbound voice SDK + `voice_outbound_call`. Consumers: sales, voice CS.
- `feat/whatsapp-thread-state` — Redis thread ownership for multi-agent WhatsApp. Consumers: CS/sales/appointments on shared number.
- `feat/slack-flows` — composable Slack listener/reply sub-flows (parent LLM flow intentionally removed). Consumers: any Slack ingress.
- `feat/domain-pack-format` — the DomainPack format itself. Consumers: customer_service first, extensible.
- `feat/agent-schedule-config-api` — Redis-backed per-workspace cron schedule (`/config/schedule`). Consumers: sales scans, cron agents.
- `feat/agent10-generic-platform-tools` — Telegram/Quickbase/HubSpot-search tools + APScheduler (code on main; only CI guard tweaks open).
- `feat/promote-whatsapp-sdk` — WhatsApp router key normalization + template var fill.
- `feature/runtime-credential-context` — runtime credential injection (`credentials/context.py`, `entry.py`, CRM/Composio runtime token priority). Consumers: ALL multi-tenant SKUs. Foundation of the metadata-DB plan.

### Open / fold candidates (priority order)

1. `platform/langfuse-nested-tracing` — CrewAI event-bus → nested Langfuse observations (`observability/crewai_listener.py`). Platform-wide observability. NOT on main.
2. `feat/whatsapp-router` — dedicated multi-agent WhatsApp router service (`flows/whatsapp_router_flow.py`, `WA_AGENT_9/10/11_URL`). Unblocks shared-number routing. NOT on main (thread-state dep already merged).
3. `platform/deal-integrity` — HubSpot dedupe + forward-only stage ladder + note→deal association. Shared sales/CS deal contract. NOT on main.
4. `feat/smart-chart-recommender` — `sdk/reporting/chart_recommender.py` + `chart_block_builder.py`. DA/stock reporting kernel. NOT on main.
5. `SlackConnector` — fold horizontal `slack_llm_flow` + `llm_response_flow` + KB threshold; leave the LinkedIn writer on its domain branch.
6. `feat/agent10-generic-platform-tools` — close by merging CI guard exemptions only.
7. `feat/browser-perception` — CLOSE: `main` already has a newer/hardened `sdk/browser/perception.py`; branch would regress.

---

## Layer 3 — Domain SKU workers

Per-client/vertical agents. Each = a SKU + a flow/crew (`AGENT_ENTRY`) + tool_set + kernel deps + env. "0 LLM" marks deterministic flows.

### CORE (Core Desarrolladora — real estate)

- `agent/koren-customer-service-core` — SKU **customer_service** (Agent 9 "Koren"). Entry `flows/koren_cs_bot_flow.py`. Tools: `kb_search`, `web_search`, `document_extract`, `ocr_extract`, `project_file_search`, `generate_artifact`, `project_status_lookup` (+ browser tier). Manager + Knowledge/Media/Browser/Coordinator experts. Deps: WhatsApp/Kapso, Telegram, HubSpot, Quickbase, Qdrant (KB + core registry/contact book/file assets), appointment scheduling, Resend email, voice, Langfuse. Largest CORE branch (+24k lines). Handoffs: `CITAS_AGENT_URL` (Murphy), `CORE_VENTAS_AGENT_URL` (Qara).
- `agent/core-ventas-comunicacion` — SKU **sales / lead-profiling** (Agent 10 "Qara"). Entry `flows/core_ventas_comunicacion_flow.py` (modes scan/single/score/cleanup + `hs_lead_status` machine). Tools: `kb_search`, `crm_search_contacts` (+ direct HubSpot/Quickbase/Kapso/LiveKit). Deps: HubSpot lifecycle, Quickbase upsert, WhatsApp router + thread-state, LiveKit outbound, Redis schedule/toggle.
- `agent/core-ventas-citas` + `feat/murphy-platform` — SKU **appointments** (Agent 11 "Murphy"). Entry `flows/core_ventas_citas_flow.py`; tool-less LLM intent parsing, deterministic `services/citas_runtime.py` (APScheduler). Deps: HubSpot meetings, MS Graph / Composio Google Calendar, Resend `.ics`, Telegram/Kapso, WhatsApp router.
- `agent/core-ventas-sync` — SKU **data_sync** (Agent 12, 0 LLM). Entry `flows/core_sync_flow.py`; HubSpot↔Quickbase event sourcing (`lev_crewai/sync/*`), poll fallback, conflict alerts. Deps: HubSpot, Quickbase, Kapso, Redis dedup.
- `agent/core-ventas-inteligencia` — SKU **sales_intelligence/analytics**. Two services: hourly ETL (`flows/core_metrics_etl_flow.py`, cron) + report crew (`flows/core_inteligencia_flow.py`, 4 analyst agents, tools=[]). Tools (ETL): `meta_ads_*`, `google_ads_*`, `quickbase_reservation_summary`; delivery: `generate_artifact`, `resend_send_email`, `openwa_send`. Deps: Postgres silver layer, HubSpot, Meta/Google Ads, Quickbase, Langfuse.
- `agent/core-mercadeo-atribucion` (+ merged `feat/leah-conversion`, `feat/leah-campaign-prop`) — SKU **marketing-attribution** (Agent 8 "Leah", 0 LLM). Entry `flows/core_mercadeo_atribucion_flow.py`; Contrato → first-touch attribution → Quickbase write-back. Deps: HubSpot (read-only prod), Quickbase, Postgres. Domain removed from `main`; mirror SDK tools remain.
- `agent/eyal` — SKU **project_management**. Entry `flows/eyal_pm_flow.py` (~4.2k lines); hierarchical crew (manager + MS Project/Comms/Quickbase/CRM/Persistence specialists). Tools: `ms_graph_*`, `quickbase_upsert_record`, `crm_*`, `postgres_query`. Deps: MS Graph (Planner/Teams), SharePoint sync, WhatsApp/Kapso, HubSpot, Quickbase, Postgres, Resend.

### Montblanc (luxury retail)

- `agent/montblanc` — multi-SKU: **customer_service** + **data_analyst** + **marketing** + **internal store ops**. Entries `flows/montblanc_flow.py`, `flows/internal_store_flow.py`. Tools: CS (`crm_query_tool`, `purchase_history_tool`, `cross_sell_engine_tool`, `whatsapp_sender`, `montblanc_cs_kb_search`...), DA (`inventory_db_tool`, `sales_db_tool`, `bi_database_query`, `python_code_runner`, `visual_report_*`, `montblanc_stuck_inventory_detector`), MK (`campaign_launcher_tool`, `content_generator_tool`, `event_recommender_tool`). Largest branch (110 files, +16.8k). Deps: WhatsApp/Kapso, Postgres store schema, analytics DB, Resend, Redis, Langfuse prompts, artifact/PDF reporting, optional A2A.
- `agent/montblanc-customer-service` — SKU **customer_service** ("Aria" WhatsApp, MB-01). Entry `flows/aria_cs_bot_flow.py`; single LLM JSON turn. Tools: `crm_query_tool`, `purchase_history_tool`, `segment_lookup_tool`, `product_relations_tool`, `cross_sell_engine_tool`, `brand_stories_tool`. Deps: WhatsApp/Kapso, HubSpot, dedicated Postgres (`MONTBLANC_POSTGRES_URL`), Qdrant product KB.

### Finu (fintech / digital banking)

- `agent/finu-neo-serve` — SKU **customer_service** (24/7 banking). Entry `flows/finu_serve_flow.py`. Tools: `finu_query_shield`, `finu_search_knowledge`, `finu_escalate_to_human`, `finu_credit_check`. Deps: FINU platform HTTP API, LiteLLM gateway.
- `agent/finu-neo-grow` — SKU **sales** (cross-sell/retention). Entry `flows/finu_grow_flow.py`. Same FINU tools.
- `agent/finu-neo-collect` — SKU **finance/collections**. Entry `flows/finu_collect_flow.py`. Same FINU tools.

### LEV Innovation (generic / internal)

- `agent/levi-customer-service` — SKU **customer_service** + lead qualification ("Levi"). Entry `flows/levi_customer_service_flow.py`. Broad tool_set: KB, web_search, document/ocr, artifact, Resend, Twenty CRM, Slack, Google Workspace, Gmail, voice + agent-browser tier.
- `agent/prospector` — SKU **sales** (B2B outbound). Entry `flows/prospector_flow.py`; Qualifier/Messenger/Inbound (tool-less) + chat agent. Deps: Qdrant campaigns, web research, Twenty CRM, Resend/Gmail, Slack.
- `agent/josh-instagram-tracker` — SKU **marketing/research** (IG competitive intel). Entry `flows/josh_instagram_tracker_flow.py`; deterministic specialists. Deps: Slack (dedicated bot), Instagram MCP, Qdrant KB, Crawl4AI/SearXNG, Twenty CRM.
- `feat/ezra-personal-assistant-crew` — SKU **personal_assistant** (internal). Entry `flows/ezra_personal_assistant_flow.py`. Same broad internal tool stack as Levi.
- `agent/customer-service` — generic, pack-driven **customer_service** SKU (`agents/support_agent.py`, `flows/customer_service_flow.py`). Tools: `kb_search`, `bi_database_query`, `send_file` (+ CRM when pack declares). Example pack = Montblanc (`domain_packs/tenants/montblanc.yaml`). This is the cleanest reusable CS SKU.

---

## SKU taxonomy (consolidated)

- **customer_service** — `agent/customer-service` (generic, pack-driven) is the reference; proven by Koren, Aria, Finu Serve, Levi.
- **sales** — Qara (lead comms), Prospector (outbound), Finu Grow.
- **marketing** — Josh (research), Leah (attribution), Montblanc MK.
- **data_analyst** — Montblanc DA (`bi_database_query`, `python_code_runner`, smart-chart-recommender, visual reports).
- **stock / inventory** — currently Montblanc-coded (`inventory_db_tool`, `montblanc_stuck_inventory_detector`); needs extraction to a generic SKU + domain pack.
- **appointments** — Murphy/Citas (optional add-on).
- **finance/collections** — Finu Collect.
- **project_management** — Eyal.
- **data_sync / analytics-ETL** — Core Sync, Core Inteligencia (deterministic/infra SKUs).

---

## Bundle mapping (Retail / FoodOps)

Default bundle agents map to existing SKUs/flows; vertical specialization is a domain pack + `extra_tools` + workspace credentials.

- **Customer Support** → `customer_service` SKU (generic `support_agent` + pack). Fold `feat/file-store-attachments` (already merged), `feat/whatsapp-router` for shared number.
- **Sales** → `sales` SKU (Prospector/Qara patterns) + `platform/deal-integrity` (fold), `feat/livekit-voice-sdk` (merged).
- **Marketing** → `marketing` SKU (Josh/Leah patterns).
- **Data Analyst** → `data_analyst` SKU (Montblanc DA tools) + `feat/smart-chart-recommender` (fold).
- **Stock** → extract Montblanc inventory tools into a generic `stock` SKU + Retail/FoodOps packs.

Cross-cutting folds for all bundles: `platform/langfuse-nested-tracing` (observability), `feature/runtime-credential-context` (merged — secrets from the metadata DB).

---

## Open issues feeding the plan

- `tool_set`/`crew` are not DomainPack fields — decide whether to extend the pack schema or keep `AGENT_TOOL_SET` + `extra_tools`.
- Several `agent/*` branches keep template `AGENT_ENTRY` in `.env.example` while the real entry lives in flow headers — bundle provisioning must set `AGENT_ENTRY` explicitly, not trust `.env.example`.
- Stock SKU and parts of marketing/DA are domain-coded in Montblanc; productizing bundles requires extracting these into generic SKUs.
