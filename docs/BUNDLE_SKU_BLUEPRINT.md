# Bundle SKU Blueprint — Domain-Code Extraction + CrewAI Architecture

Granular companion to [CREWAI_FEATURE_INVENTORY.md](CREWAI_FEATURE_INVENTORY.md). For every existing worker branch it (1) classifies each domain-coded module for extraction into reusable SKUs, and (2) specifies the CrewAI-native architecture/topology of each productized worker (deterministic flow vs conversational turn vs crew vs hybrid).

Source scans (read-only, `git show`/`git ls-tree`, no checkout): [Montblanc](e9398d30-b414-4f4a-98d2-91296d70c70b), [CORE conversational](238b0d58-5929-4c1e-9c99-7d4a333607e4), [CORE deterministic](d8dbf0fc-033f-446b-8a02-41e5f53b2ab9), [LEV+Finu](6c09d0b6-c02c-476e-af69-13e21c45b414).

Classification key:
- **KERNEL-PROMOTE** — already generic; move into `main` and share across all SKUs.
- **SKU-PARAM** — reusable code, tenant-specific content; survives as a SKU module with config from the domain pack + `workspace_credentials`.
- **CLIENT-KEEP** — client/vertical-only (brand copy, mock data, fixtures, vertical APIs); stays in a client overlay, optional via `extra_tools`.

---

## 1. CrewAI pattern taxonomy (the topology vocabulary)

Every worker is built from these primitives. The productized SKUs below are specified in these terms.

- **A — Deterministic Flow (0-LLM):** `@start`/`@listen` linear or parallel steps, no model calls. Examples: Data-Sync, Leah attribution, metrics ETL, stock math.
- **B — Single-LLM conversational turn:** exactly one LLM completion per turn producing a JSON contract; no ReAct loop. Examples: Aria CS, Finu serve/grow/collect, generic CS `respond`, Qara profile/outreach/score.
- **C — Inline 1-task sequential Crew:** thin `Crew(agents=[a], tasks=[t], process=Process.sequential)` wrapper around one tool-bound agent. Examples: generic CS, Levi, Ezra, Prospector per-stage.
- **D — Sequential multi-agent Crew (`Process.sequential`, no delegation, typed handoffs):** capability experts chained, context passed forward. Examples: Koren experts (knowledge→media/browser→coordinator), Inteligencia analysts, Montblanc DA+MK.
- **E — Hierarchical Crew (`Process.hierarchical`, manager delegates):** a manager agent (allow_delegation=True, no tools) routes to tool-bound specialists. Examples: Eyal PM; legacy `core_crew`.
- **F — Parallel structured LLM (fan-out/fan-in, NOT a CrewAI Crew):** `ThreadPoolExecutor` + `llm.call()` JSON specialists run in parallel, then a composer. Example: Josh Instagram tracker.
- **G — State-machine runtime (APScheduler + LLM classify):** background scheduler drives reminders/transitions; a tool-less agent does single-shot intent classification. Example: Murphy appointments.

Most workers are **Hybrid**: a deterministic Flow that selects among B–G per turn/trigger.

---

## 2. Productized bundle SKUs

The 5 default bundle agents (Customer Support, Sales, Marketing, Data Analyst, Stock) plus add-ons. Each: best reference impl, the CrewAI architecture to ship, the extracted tool set, and the domain-pack config it reads.

### 2.1 Customer Support SKU

- **Reference:** `agent/customer-service` (`agents/support_agent.py` + `flows/customer_service_flow.py`, pack-driven). Richer variants: Koren (multi-capability), Aria (WhatsApp single-turn).
- **CrewAI architecture (ship the generic one):** Hybrid — deterministic Flow `validate -> triage -> respond -> finalize`. `triage` is **pattern A** (keyword escalation from pack, no LLM). `respond` is **pattern C** (one tool-bound agent in an inline 1-task crew). Redis memory + Langfuse session.
  - Optional high-touch profile: swap `respond` to **pattern D** (Koren expert crew: knowledge -> media/browser -> coordinator emitting the turn JSON) when the bundle enables browser/media tools.
  - Optional WhatsApp profile: **pattern B** single JSON turn (Aria) for low-latency chat.
- **Tools — KERNEL-PROMOTE:** `kb_search`, `bi_database_query`, `send_file`, `crm_find_contact`/`crm_log_note`; `sdk/channels/memory.py`, `notifier.py`, `sdk/email/escalation.py`, `sdk/channels/humanize.py`, `sdk/scheduling.py`, `koren_handoff` session model, `koren_cs_crew` expert-handoff pattern.
- **Tools — SKU-PARAM:** `project_file_search`, `project_status_lookup`, `contact_book_lookup` (+ `ContactBookStore`/`FileAssetStore` collections), `koren_cs.py` agent factory + turn contract.
- **Domain pack keys:** `persona`, `kb.namespace`, `crm.provider`, `escalation.{triggers,handoff,notify_*}`, `extra_tools`, channel.
- **CLIENT-KEEP:** Aria flow, Montblanc company filter, Core project assets/CSVs, rep contact book content, mock relations.

### 2.2 Sales SKU

- **Reference:** `agent/prospector` (batch outbound) + `agent/core-ventas-comunicacion` / Qara (cron-gated profiling + CRM lifecycle).
- **CrewAI architecture:** Hybrid — deterministic Flow with a **stage router** (`@start dispatch` -> `core | messenger | inbound`). All external I/O (campaign store, web research, CRM, email, Slack) is deterministic in the flow; each LLM touchpoint is a **tool-less JSON specialist** (qualifier / messenger / inbound classifier) run as **pattern C** (one 1-task crew per stage). Optional conversational chat agent (tool-bound) for portal chat. Cron **schedule gate** via `ScheduleConfigStore`. Lead lifecycle is a CRM state machine (HubSpot `hs_lead_status`), not local DB.
- **Tools/clients — KERNEL-PROMOTE:** `web_research`, CRM clients, `email.py` (Resend), `slack.py` notifier, `ScheduleConfigStore`, `WhatsAppThreadState`, reply-handler routing pattern; fold `platform/deal-integrity` (stage ladder, dedupe, note->deal).
- **SKU-PARAM:** `campaign_store.py` + `campaigns/*.yaml`, qualifier/messenger/inbound prompts, fit threshold, recipient allowlist, HubSpot lifecycle props, outreach channel default, voice outbound persona.
- **Domain pack keys:** campaign refs, ICP/fit rules, outreach channel, scan/cleanup hours, CRM property map.

### 2.3 Marketing SKU

- **Reference:** `agent/josh-instagram-tracker` (competitive intel reports) + `agent/core-mercadeo-atribucion` / Leah (attribution) + Montblanc MK (campaign/content/event).
- **CrewAI architecture:** Hybrid — deterministic data pipeline (`prepare -> fetch -> kb_prefetch -> run_specialists -> persist_and_deliver`) where analytics/scoring/aggregation are **pattern A**, synthesis is **pattern F** (6 parallel tool-less structured-LLM specialists + composer, `ThreadPoolExecutor`, 110s budget, analytics fallback). Multi-channel delivery (Slack blocks / email). Attribution sub-capability is **pattern A** (0-LLM, HubSpot->Quickbase write-back).
- **Tools/clients — KERNEL-PROMOTE:** `kb.py`, `slack_idempotency.py`, `slack_dlq.py`, `roi_calculator_tool`, channel-planner heuristics (config-driven), `sdk/migration/mirror.py` (for attribution sandboxes).
- **SKU-PARAM:** `instagram.py` behind a `sdk/clients/social/` provider interface, tracked-accounts config, content prompts, brand-assets KB namespace, campaign store, event playbook, attribution field maps.
- **CLIENT-KEEP:** hardcoded Montblanc events, Josh bot tokens.

### 2.4 Data Analyst SKU

- **Reference:** Montblanc internal-store DA pipeline (`run_da_pipeline`) + `sdk/reporting/*`.
- **CrewAI architecture:** Hybrid, mostly deterministic — Flow: `route question -> schema subset -> SQL plan (LLM) -> validate SQL -> execute bi_database_query -> optional python_code_runner -> chart reconcile (recommender) -> visual_report_generator -> composer (LLM)`. Two LLM touchpoints (SQL planner + composer), both **pattern B**. Optional **pattern D/A2A** expert agents (DBA / code-runner / report-render / orchestrator) when `da_a2a_enabled`.
- **KERNEL-PROMOTE (big win):** entire `sdk/reporting/*` (chart_recommender, chart_block_builder, kpi/table/column builders, report_payload_builder, pdf/html renderers, contracts), `BrandTokens` type, `report_classifier`/`report_registry`, `sql_engine_tool`, `analytics_tool`, `trend_calculator_tool`, `roi_calculator_tool`, `inventory_risk_classifier` math; fold `feat/smart-chart-recommender`.
- **SKU-PARAM:** analytics table map (`sales`/`inventory`/`relations`), store schema JSON, `BrandTokens` defaults + report templates/CSS, KB namespaces, default report titles, visual-report store name.
- **CLIENT-KEEP:** Montblanc mock inventory/history/relations tools, brand CSS/logos, SKU glossary/enrichment.

### 2.5 Stock SKU (new — extracted from Montblanc DA)

- **Reference:** Montblanc inventory tools (`inventory_db_tool`, `montblanc_stuck_inventory_detector`, `reorder_algorithm`, `montblanc_reorder_suggester`, `montblanc_inventory_risk_classifier`, `seasonality_model_tool`, `demand_forecast_tool`).
- **CrewAI architecture:** primarily **pattern A** (deterministic inventory math: VPD x lead-time x season, reorder phases, OVER/UNDER/OPTIMO risk bands) on a cron trigger for stuck-stock/reorder alerts, plus an optional **pattern B** narrative turn for the alert message and on-demand queries.
- **KERNEL-PROMOTE:** reorder formula, risk classifier bands, demand-forecast formula, `dead_stock` schema pattern.
- **SKU-PARAM:** season calendar, reorder thresholds, inventory/sales table + column maps, alert channel/recipients.
- **CLIENT-KEEP:** mock inventory checker, Montblanc 8-SKU fixtures.

### 2.6 Add-on SKUs (optional per bundle)

- **Appointments (Murphy):** Hybrid — thin deterministic `CitasFlow` (meeting kickoff: receive -> confirm -> schedule reminders) + **pattern G** state-machine runtime (`citas_runtime.py`: APScheduler reminders/post-meeting + tool-less Murphy `classify` for inbound). Calendar provider switch (`CALENDAR_PROVIDER` google/msgraph). KERNEL-PROMOTE: `sdk/scheduling.py`, `citas_ics.py`, `citas_repo` run pattern. SKU-PARAM: business hours, reminder offsets, rep contacts, confirmation template.
- **Project-Management (Eyal):** Hybrid — deterministic cron scanner (read Planner/SharePoint/QB -> detect milestones -> alert) is **pattern A**; interactive reply/enrichment is **pattern E** (hierarchical crew: manager + MS-Project/Comms/Quickbase/CRM/Persistence specialists); `ai_studio` is a fast-path **pattern B**. KERNEL-PROMOTE: `sdk/sharepoint/sync.py`, milestone MPP/PDF parsers, `cronograma` ORM. SKU-PARAM: plan IDs, QB table/FID maps, watches, thresholds, recipients.
- **Data-Sync:** pure **pattern A** event-sourcing (`SyncFlow`: receive -> normalize -> dispatch -> finalize; webhook + poll). KERNEL-PROMOTE: dispatcher/registry/events/conflicts/adapters-base, `core_sync` ORM. SKU-PARAM: stage/rep maps, QB tables/FIDs, managed conflict fields, enrich property lists.
- **Sales-Intelligence/Analytics:** ETL is **pattern A** (hourly cron: extract HubSpot/Meta/QB -> transform -> load Postgres silver); report is **pattern D** (sequential crew of 4 tool-less analyst agents reading precomputed JSON -> narrative). KERNEL-PROMOTE: `forecast.py`, `diagnostics.py`, silver-layer ORM. SKU-PARAM: thresholds, segment fields, ad action types, QB FIDs, run-type windows.
- **Collections (Finu) / Levi / Ezra:** **CLIENT-KEEP** verticals. They reuse kernel tools but keep vertical persona/API tools (`finu_*` HTTP, broad MCP stacks) and guardrails. Not whitelabel bundle SKUs.

---

## 3. Kernel promotion backlog (consolidated)

Promote to `main` before/with bundle rollout (each already generic per the scans):

- Reporting: `sdk/reporting/*` + `reporting/report_classifier.py` + `report_registry.py` (+ fold `feat/smart-chart-recommender`).
- Scheduling/calendar: `sdk/scheduling.py`, `services/citas_ics.py`, `citas_repo` run pattern.
- Channels/UX: `sdk/channels/humanize.py`, `memory.py`, `notifier.py`, `sdk/email/escalation.py`, `slack_idempotency.py`, `slack_dlq.py`.
- Sessions/routing: `koren_handoff` human-takeover model, `WhatsAppThreadState`, `ScheduleConfigStore`, reply-handler routing pattern, `koren_cs_crew` typed-handoff expert pattern.
- Sync/PM: sync `dispatcher/registry/events/conflicts/adapters-base` + `core_sync` ORM, `sdk/sharepoint/sync.py`, milestone parsers, `cronograma` ORM.
- Analytics math: `sdk/analytics/forecast.py`, `diagnostics.py`; generic DA tools (`sql_engine_tool`, `analytics_tool`, `trend_calculator_tool`, `roi_calculator_tool`, inventory risk/reorder formulas).
- Observability/credentials: fold `platform/langfuse-nested-tracing`; `feature/runtime-credential-context` already merged.

Everything else stays **SKU-PARAM** (config via domain pack + `workspace_credentials`) or **CLIENT-KEEP** (client overlay / `extra_tools`).

---

## 4. SKU -> CrewAI pattern matrix

- Customer Support: Hybrid (A triage + C respond; D/B optional)
- Sales: Hybrid (A I/O + C per-stage tool-less specialists; cron gate)
- Marketing: Hybrid (A analytics + F parallel specialists + composer)
- Data Analyst: Hybrid (A pipeline + B SQL-planner + B composer; D optional A2A)
- Stock: A (math, cron) + B (narrative)
- Appointments: A (kickoff) + G (scheduler/classify)
- Project-Management: A (cron scan) + E (hierarchical crew) + B (studio)
- Data-Sync: A (0-LLM)
- Sales-Intelligence: A (ETL) + D (analyst crew)
- Collections / Levi / Ezra: B or C — CLIENT-KEEP verticals
