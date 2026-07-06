// Contexto de un run de Qara disparado desde el UI. Lo comparten el trigger, el panel
// y el status en vivo para saber qué tipo de progreso mostrar.
export type QaraRun = {
  traceId: string;
  startedAt: number; // ms epoch — para detectar cambios de HubSpot POSTERIORES al inicio
  mode: "scan" | "single";
  contactId?: string; // presente en single
  channel?: "WHATSAPP" | "CALL"; // presente en single
};
