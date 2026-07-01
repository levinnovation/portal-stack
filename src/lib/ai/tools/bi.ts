import { tool } from "ai";
import { z } from "zod";
import type { SessionUser } from "../../auth/provider";
import { isStaffRole } from "../scoping";
import { runExternalDbTemplate } from "@/lib/integrations/external-db";
import { getInteligenciaDataOrNull } from "@tenants/core/sources/inteligencia";
import { getLeahData } from "@tenants/core/sources/quickbase";
import { getQaraData } from "@tenants/core/sources/hubspot";
import * as marketing from "@/lib/integrations/meta/marketing";

const runTypeSchema = z.enum(["today", "weekly", "monthly", "7d", "1m", "3m", "6m", "12m", "full"]);

function forbidden() {
  return { error: "forbidden" };
}

export function buildBiTools(user: SessionUser) {
  return {
    bi_snapshot: tool({
      description: "Query BI Postgres snapshots by template (latest metrics, campaigns, leads-at-risk). Admin-only.",
      inputSchema: z.object({
        template: z.enum(["inteligencia.latest", "inteligencia.campaigns", "inteligencia.leads_at_risk"]),
        runType: runTypeSchema.optional(),
        workspaceId: z.string().optional(),
        limit: z.number().min(1).max(500).optional(),
      }),
      execute: async ({ template, runType, workspaceId, limit }) => {
        if (!isStaffRole(user.role)) return forbidden();
        try {
          const rows = await runExternalDbTemplate("bi", template, { runType, workspaceId, limit });
          return { template, rows };
        } catch (e: any) {
          return { error: e?.message || "Failed to read BI snapshot" };
        }
      },
    }),

    inteligencia_overview: tool({
      description: "Fetch Inteligencia unified BI snapshot (KPIs, funnel, campaigns, diagnostics). Admin-only.",
      inputSchema: z.object({
        runType: runTypeSchema.default("weekly"),
      }),
      execute: async ({ runType }) => {
        if (!isStaffRole(user.role)) return forbidden();
        try {
          const snapshot = await getInteligenciaDataOrNull(runType);
          if (!snapshot) return { runType, empty: true };
          return {
            runType,
            periodLabel: snapshot.periodLabel,
            updatedAt: snapshot.updatedAt,
            kpis: snapshot.kpis,
            funnel: snapshot.funnel,
            campaigns: snapshot.campaigns,
            diagnostics: snapshot.diagnostics,
            predictions: snapshot.predictions,
            prescriptions: snapshot.prescriptions,
          };
        } catch (e: any) {
          return { error: e?.message || "Failed to read Inteligencia overview" };
        }
      },
    }),

    leah_attribution: tool({
      description: "Fetch Leah attribution data and KPIs from QuickBase. Admin-only.",
      inputSchema: z.object({
        topN: z.number().min(1).max(20).default(8),
      }),
      execute: async ({ topN }) => {
        if (!isStaffRole(user.role)) return forbidden();
        try {
          const data = await getLeahData();
          return {
            kpis: data.kpis,
            porCanal: data.porCanal.slice(0, topN),
            porCampaign: data.porCampaign.slice(0, topN),
            porFuenteMonto: data.porFuenteMonto.slice(0, topN),
            conversion: data.conversion.slice(0, topN),
            contratosTotal: data.contratos.length,
          };
        } catch (e: any) {
          return { error: e?.message || "Failed to read Leah attribution data" };
        }
      },
    }),

    qara_leads: tool({
      description: "Fetch Qara lead analytics from HubSpot aggregates. Admin-only.",
      inputSchema: z.object({
        topN: z.number().min(1).max(20).default(8),
      }),
      execute: async ({ topN }) => {
        if (!isStaffRole(user.role)) return forbidden();
        try {
          const data = await getQaraData();
          return {
            kpis: data.kpis,
            scoreHistograma: data.scoreHistograma,
            porProyecto: data.porProyecto.slice(0, topN),
            llamadaVsMensaje: data.llamadaVsMensaje,
            funnel: data.funnel,
            engagement: data.engagement.slice(0, topN),
            useType: data.useType.slice(0, topN),
            budget: data.budget.slice(0, topN),
            timeline: data.timeline.slice(0, topN),
          };
        } catch (e: any) {
          return { error: e?.message || "Failed to read Qara leads data" };
        }
      },
    }),

    meta_list: tool({
      description: "List Meta entities (campaigns, ad sets, ads, creatives, audiences). Admin-only.",
      inputSchema: z.object({
        entity: z.enum(["campaigns", "adsets", "ads", "creatives", "audiences"]),
        parentId: z.string().optional(),
      }),
      execute: async ({ entity, parentId }) => {
        if (!isStaffRole(user.role)) return forbidden();
        try {
          switch (entity) {
            case "campaigns":
              return { entity, data: await marketing.listCampaigns() };
            case "adsets":
              if (!parentId) return { error: "parentId is required for adsets" };
              return { entity, parentId, data: await marketing.listAdSets(parentId) };
            case "ads":
              if (!parentId) return { error: "parentId is required for ads" };
              return { entity, parentId, data: await marketing.listAds(parentId) };
            case "creatives":
              return { entity, data: await marketing.listCreatives() };
            case "audiences":
              return { entity, data: await marketing.listCustomAudiences() };
            default:
              return { error: "Unsupported Meta entity" };
          }
        } catch (e: any) {
          return { error: e?.message || "Failed to list Meta data" };
        }
      },
    }),
  };
}
