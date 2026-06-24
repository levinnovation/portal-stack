// Minimal seed for Finu (uses generic 'count:projects' etc. via the default
// datasets; fintech-specific datasets would be added with the fintech collections).
export const finuPages = [
  {
    title: "Panel Finu",
    slug: "finu-admin-overview",
    allowedRoles: ["admin"],
    layout: [
      {
        blockType: "kpi-grid",
        cards: [
          { label: "Proyectos totales", dataset: "count:projects", format: "number" },
          { label: "Usuarios", dataset: "count:customers", format: "number" },
        ],
      },
      { blockType: "chat", title: "Asistente Finu", agentId: "finu-admin", greeting: "Hola, ¿qué necesitas?" },
    ],
  },
  {
    title: "Mi préstamo",
    slug: "finu-customer-overview",
    allowedRoles: ["customer", "admin"],
    layout: [
      { blockType: "hero", title: "Tu préstamo Finu", subtitle: "Consulta tu saldo, calendario y próximos pagos." },
      { blockType: "kpi-grid", cards: [
        { label: "Pagos registrados", dataset: "count:payments", format: "number" },
      ]},
      { blockType: "chat", title: "Asistente Finu", agentId: "finu-customer" },
    ],
  },
];
