// Contexto de un run de Qara disparado desde el UI (o descubierto vía polling cuando lo
// disparó el cron) . Lo comparten el trigger, el panel y el status en vivo para saber qué
// tipo de progreso mostrar.
export type QaraRun = {
  traceId: string;
  startedAt: number; // ms epoch — para detectar cambios de HubSpot POSTERIORES al inicio
  mode: "scan" | "single" | "cleanup";
  contactId?: string; // presente en single
  channel?: "WHATSAPP" | "CALL"; // presente en single
};
