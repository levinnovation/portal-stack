import "server-only";
import { resolveIntegrationToken } from "@/lib/integrations/credentials";

export interface QaraKpis {
  nuevosHoy: number;
  altaIntencion: number;
}

export interface QaraOverview {
  kpis: QaraKpis;
  funnel: { name: string; value: number }[];
  configured: boolean;
  error?: string;
}

/** ponytail: Qara-style HubSpot stub — extend when HubSpot props are mapped. */
export async function getQaraOverview(): Promise<QaraOverview> {
  const token = resolveIntegrationToken("hubspot");
  if (!token) {
    return {
      configured: false,
      kpis: { nuevosHoy: 0, altaIntencion: 0 },
      funnel: [],
    };
  }

  return {
    configured: true,
    kpis: { nuevosHoy: 0, altaIntencion: 0 },
    funnel: [],
    error: "HubSpot mapper not implemented — set INTEGRATION_CORE_HUBSPOT_TOKEN and extend tenants/core/sources/hubspot.ts",
  };
}
