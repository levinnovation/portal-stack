import type { CaseStage, CaseStatus } from "@tenants/core/sources/formalizaciones";

// Kept out of sources/formalizaciones.ts (which is "server-only") so client
// components — e.g. the casos table — can use these display labels without
// pulling the server-only fetch module into the client bundle.

export const STATUS_LABELS: Record<CaseStatus, string> = {
  ready_for_bank: "Listo para banco",
  contacted: "Contactado",
  escalated: "Escalado",
  throttled: "En espera",
  pending: "Pendiente",
  send_failed: "Envío fallido",
};

export const STAGE_LABELS: Record<CaseStage, string> = {
  S1: "S1 · Inicio",
  S2: "S2 · Docs",
  S3: "S3 · Completo",
  S4: "S4 · Banco",
  S5: "S5 · Escalado",
};
