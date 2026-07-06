export type FloatingChatConfig = {
  title: string;
  agentId: string;
  greeting: string;
  suggestedPrompts?: { prompt: string }[];
};

export const coreFloatingChatConfigByRole: Record<string, FloatingChatConfig> = {
  admin: {
    title: "Asistente Core",
    agentId: "core-admin",
    greeting:
      "Hola admin, ¿qué quieres consultar? Puedo listar proyectos, pagos pendientes, distribuciones, etc.",
    suggestedPrompts: [
      { prompt: "¿Cuántos proyectos están en construcción?" },
      { prompt: "Lista los últimos 5 pagos registrados" },
      { prompt: "Resume el capital total comprometido" },
    ],
  },
  investor: {
    title: "Asistente de inversión",
    agentId: "core-investor",
    greeting: "Hola inversionista. Pregúntame sobre tu portafolio, distribuciones o proyectos.",
    suggestedPrompts: [
      { prompt: "¿Cuál es mi IRR estimada?" },
      { prompt: "Lista mis inversiones activas" },
    ],
  },
  customer: {
    title: "Asistente de cliente",
    agentId: "core-customer",
    greeting: "Hola, ¿en qué te ayudo?",
  },
};
