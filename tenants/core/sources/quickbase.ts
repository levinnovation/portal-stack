import "server-only";
import { resolveIntegrationToken } from "@/lib/integrations/credentials";

export interface LeahKpis {
  montoMes: number;
  contratosMes: number;
}

export interface LeahOverview {
  kpis: LeahKpis;
  conversion: { firstTouchSource: string; conversionRate: number }[];
  configured: boolean;
  error?: string;
}

/** ponytail: Leah-style QuickBase read — returns empty KPIs when not configured. */
export async function getLeahOverview(): Promise<LeahOverview> {
  const realm = process.env.QUICKBASE_REALM;
  const token = resolveIntegrationToken("quickbase");
  if (!realm || !token) {
    return {
      configured: false,
      kpis: { montoMes: 0, contratosMes: 0 },
      conversion: [],
    };
  }

  try {
    const { quickbaseFetchRecords } = await import("@/lib/integrations/quickbase");
    const tableId = process.env.QUICKBASE_CONTRACTS_TABLE || "";
    if (!tableId) {
      return {
        configured: true,
        kpis: { montoMes: 0, contratosMes: 0 },
        conversion: [],
        error: "QUICKBASE_CONTRACTS_TABLE not set",
      };
    }
    const rows = (await quickbaseFetchRecords(tableId)) as Record<string, { value?: unknown }>[];
    const montoMes = rows.reduce((s, r) => s + Number(r.amount?.value ?? r.monto?.value ?? 0), 0);
    return {
      configured: true,
      kpis: { montoMes, contratosMes: rows.length },
      conversion: [],
    };
  } catch (e: any) {
    return {
      configured: true,
      kpis: { montoMes: 0, contratosMes: 0 },
      conversion: [],
      error: e?.message || "QuickBase fetch failed",
    };
  }
}
