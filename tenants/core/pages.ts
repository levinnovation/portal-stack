/**
 * Seed layout-builder pages for the Core tenant.
 *
 * These pages are the "templates" rendered at /portal/{admin,investor,customer}/<slug>.
 * They demonstrate the block system with inline datasets ("count:projects" etc.)
 * and showcase the full admin/investor/customer dashboard experience.
 *
 * Each block has access to data via the dataset runner; the slug of each page
 * matches the route used in tenants/core/config.ts (defaultLandingPageSlug).
 */

export const corePages = [
  // ────────────────────────── Admin ──────────────────────────
  {
    title: "Panel de Administración",
    slug: "admin-overview",
    description: "Vista general del ecosistema Core",
    allowedRoles: ["admin"],
    layout: [
      {
        blockType: "kpi-grid",
        title: "Indicadores",
        cards: [
          { label: "Proyectos activos", dataset: "count:projects", format: "number", icon: "Building2" },
          { label: "Inversionistas", dataset: "count:investors", format: "number", icon: "Users" },
          { label: "Clientes", dataset: "count:customers", format: "number", icon: "ShoppingBag" },
          { label: "Capital comprometido", dataset: "sum:investments.amountInvested", format: "usd", icon: "TrendingUp" },
        ],
      },
      {
        blockType: "divider",
        size: "md",
      },
      {
        blockType: "chart",
        title: "Inversiones por mes",
        dataset: "monthly:investments.amountInvested",
        kind: "area",
        height: 280,
      },
      {
        blockType: "table",
        title: "Proyectos recientes",
        dataset: "list:projects",
        columns: [
          { key: "name", label: "Proyecto" },
          { key: "projectStatus", label: "Estado", format: "status" },
          { key: "location", label: "Ubicación" },
          { key: "totalUnits", label: "Unidades", format: "number" },
        ],
        pageSize: 5,
      },
      {
        blockType: "chat",
        title: "Asistente Core",
        agentId: "core-admin",
        greeting: "Hola admin, ¿qué quieres consultar? Puedo listar proyectos, pagos pendientes, distribuciones, etc.",
        suggestedPrompts: [
          { prompt: "¿Cuántos proyectos están en construcción?" },
          { prompt: "Lista los últimos 5 pagos registrados" },
          { prompt: "Resume el capital total comprometido" },
        ],
      },
    ],
  },
  {
    title: "Proyectos",
    slug: "admin-projects",
    allowedRoles: ["admin"],
    layout: [
      {
        blockType: "table",
        title: "Todos los proyectos",
        dataset: "list:projects",
        columns: [
          { key: "name", label: "Proyecto" },
          { key: "projectStatus", label: "Estado", format: "status" },
          { key: "location", label: "Ubicación" },
          { key: "totalUnits", label: "Unidades", format: "number" },
          { key: "budgetTotal", label: "Presupuesto", format: "usd" },
        ],
        pageSize: 20,
      },
    ],
  },
  {
    title: "Inversionistas",
    slug: "admin-investors",
    allowedRoles: ["admin"],
    layout: [
      {
        blockType: "kpi-grid",
        cards: [
          { label: "Total registrados", dataset: "count:investors", format: "number" },
          { label: "Capital total", dataset: "sum:investments.amountInvested", format: "usd" },
        ],
      },
      {
        blockType: "table",
        title: "Listado",
        dataset: "list:investors",
        columns: [
          { key: "fullName", label: "Nombre" },
          { key: "email", label: "Email" },
          { key: "kycStatus", label: "KYC", format: "status" },
        ],
        pageSize: 20,
      },
    ],
  },
  {
    title: "Clientes",
    slug: "admin-customers",
    allowedRoles: ["admin"],
    layout: [
      {
        blockType: "kpi-grid",
        cards: [
          { label: "Total clientes", dataset: "count:customers", format: "number" },
        ],
      },
      {
        blockType: "table",
        title: "Listado",
        dataset: "list:customers",
        columns: [
          { key: "fullName", label: "Nombre" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Teléfono" },
        ],
        pageSize: 20,
      },
    ],
  },
  {
    title: "Carga Excel",
    slug: "admin-excel",
    allowedRoles: ["admin"],
    layout: [
      {
        blockType: "markdown",
        title: "Carga masiva de datos",
        body: { root: { type: "root", children: [{ type: "paragraph", children: [{ text: "Usa el panel de Payload en /admin para subir archivos Excel con la estructura estándar." }] }] } },
      },
      {
        blockType: "form",
        title: "Importar archivo",
        endpoint: "/api/forms/excel-upload",
        fields: [
          { name: "collection", label: "Colección destino", type: "text", required: true },
          { name: "fileUrl", label: "URL del archivo", type: "text", required: true },
        ],
      },
    ],
  },
  {
    title: "QuickBase",
    slug: "admin-quickbase",
    allowedRoles: ["admin"],
    layout: [
      { blockType: "markdown", title: "Sincronización QuickBase", body: {} },
    ],
  },
  {
    title: "Reportes",
    slug: "admin-reports",
    allowedRoles: ["admin"],
    layout: [
      { blockType: "kpi-grid", cards: [
        { label: "Proyectos", dataset: "count:projects", format: "number" },
        { label: "Inversionistas", dataset: "count:investors", format: "number" },
        { label: "Clientes", dataset: "count:customers", format: "number" },
        { label: "Capital total", dataset: "sum:investments.amountInvested", format: "usd" },
      ]},
      { blockType: "chart", title: "Distribución por proyecto", dataset: "monthly:investments.amountInvested", kind: "bar" },
    ],
  },
  {
    title: "Bitácora de auditoría",
    slug: "admin-audit",
    allowedRoles: ["admin"],
    layout: [
      { blockType: "markdown", title: "Bitácora", body: { root: { type: "root", children: [{ type: "paragraph", children: [{ text: "Usa /admin/collections/audit-logs para ver el detalle completo." }] }] } } },
    ],
  },

  // ────────────────────────── Agent dashboards (blocks) ──────────────────────────
  {
    title: "Agentes · Overview",
    slug: "admin-agents",
    allowedRoles: ["admin"],
    layout: [
      { blockType: "markdown", title: "Agentes de IA", body: {} },
      { blockType: "agent-control", title: "Inteligencia · ETL", subtitle: "Ejecutar y monitorear Agent 13", agentId: "inteligencia-13" },
      { blockType: "agent-control", title: "Qara · Control", subtitle: "Scan, single lead y horario", agentId: "qara", showSchedule: true },
    ],
  },
  {
    title: "Leah · Mercadeo",
    slug: "admin-agents-leah",
    allowedRoles: ["admin"],
    layout: [
      { blockType: "markdown", title: "Leah · Atribución", body: {} },
      { blockType: "table", title: "KPIs Leah", dataset: "core.leah.kpis", columns: [{ key: "name", label: "Métrica" }, { key: "value", label: "Valor" }] },
    ],
  },
  {
    title: "Leah · Contratos",
    slug: "admin-agents-leah-contratos",
    allowedRoles: ["admin"],
    layout: [
      { blockType: "markdown", title: "Contratos atribuidos", body: {} },
      { blockType: "table", title: "Contratos", dataset: "core.leah.kpis", columns: [{ key: "name", label: "Campo" }, { key: "value", label: "Valor" }] },
    ],
  },
  {
    title: "Qara · Analítica",
    slug: "admin-agents-qara",
    allowedRoles: ["admin"],
    layout: [
      { blockType: "agent-control", title: "Despertar a Qara", subtitle: "Scan y single lead", agentId: "qara" },
      { blockType: "table", title: "Distribución", dataset: "core.qara.distribution", columns: [{ key: "name", label: "Segmento" }, { key: "value", label: "Valor" }] },
    ],
  },
  {
    title: "Qara · Control",
    slug: "admin-agents-qara-control",
    allowedRoles: ["admin"],
    layout: [
      { blockType: "agent-control", title: "Qara · Control operativo", subtitle: "Scan, single lead, schedule", agentId: "qara", showSchedule: true },
    ],
  },
  {
    title: "Inteligencia · Comando",
    slug: "admin-agents-inteligencia",
    allowedRoles: ["admin"],
    layout: [
      { blockType: "time-window", title: "Ventana", subtitle: "Seleccioná el período de análisis" },
      { blockType: "agent-control", title: "Actualizar datos", subtitle: "Control ETL (Agent 13)", agentId: "inteligencia-13" },
      { blockType: "chart", title: "Inversión vs reservas", dataset: "core.inteligencia.campaigns", kind: "combo" },
      { blockType: "table", title: "Top leads en riesgo", dataset: "core.inteligencia.leads_at_risk", columns: [{ key: "name", label: "Lead" }, { key: "owner", label: "Owner" }, { key: "revenue_at_risk", label: "Riesgo" }] },
    ],
  },
  {
    title: "Inteligencia · Segmentos",
    slug: "admin-agents-inteligencia-segmentos",
    allowedRoles: ["admin"],
    layout: [
      { blockType: "time-window", title: "Ventana", subtitle: "Segmentación comercial" },
      { blockType: "chart", title: "Campañas", dataset: "core.inteligencia.campaigns", kind: "bar" },
    ],
  },
  {
    title: "Inteligencia · Equipo",
    slug: "admin-agents-inteligencia-equipo",
    allowedRoles: ["admin"],
    layout: [
      { blockType: "time-window", title: "Ventana", subtitle: "Performance por asesor" },
      { blockType: "table", title: "Leads riesgo", dataset: "core.inteligencia.leads_at_risk", columns: [{ key: "owner", label: "Asesor" }, { key: "name", label: "Lead" }, { key: "revenue_at_risk", label: "Riesgo" }] },
    ],
  },
  {
    title: "Inteligencia · Pauta",
    slug: "admin-agents-inteligencia-pauta",
    allowedRoles: ["admin"],
    layout: [
      { blockType: "time-window", title: "Ventana", subtitle: "Eficiencia de pauta" },
      { blockType: "chart", title: "Spend vs reservas", dataset: "core.inteligencia.campaigns", kind: "combo" },
    ],
  },
  {
    title: "Inteligencia · Predicciones",
    slug: "admin-agents-inteligencia-predicciones",
    allowedRoles: ["admin"],
    layout: [
      { blockType: "time-window", title: "Ventana", subtitle: "Forecast y anomalías" },
      { blockType: "chart", title: "Forecast", dataset: "core.inteligencia.campaigns", kind: "forecast" },
    ],
  },
  {
    title: "Inteligencia · Diagnóstico",
    slug: "admin-agents-inteligencia-diagnostico",
    allowedRoles: ["admin"],
    layout: [
      { blockType: "time-window", title: "Ventana", subtitle: "Diagnóstico de causas" },
      { blockType: "chart", title: "Pareto", dataset: "core.inteligencia.campaigns", kind: "pareto" },
    ],
  },
  {
    title: "Inteligencia · Experimentos",
    slug: "admin-agents-inteligencia-experimentos",
    allowedRoles: ["admin"],
    layout: [
      { blockType: "time-window", title: "Ventana", subtitle: "A/B test recommendations" },
      { blockType: "markdown", title: "Experimentos", body: {} },
    ],
  },
  {
    title: "Inteligencia · Reportes",
    slug: "admin-agents-inteligencia-reportes",
    allowedRoles: ["admin"],
    layout: [
      { blockType: "time-window", title: "Ventana", subtitle: "Reporte ejecutivo" },
      { blockType: "markdown", title: "Resumen ejecutivo", body: {} },
    ],
  },

  // ────────────────────────── Investor ──────────────────────────
  {
    title: "Tu portafolio",
    slug: "investor-portfolio",
    allowedRoles: ["investor", "admin"],
    layout: [
      {
        blockType: "kpi-grid",
        title: "Resumen",
        cards: [
          { label: "Capital invertido", dataset: "sum:investments.amountInvested", format: "usd", icon: "Wallet" },
          { label: "Proyectos activos", dataset: "count:projects", format: "number", icon: "Building2" },
        ],
      },
      {
        blockType: "chart",
        title: "Inversiones por mes",
        dataset: "monthly:investments.amountInvested",
        kind: "area",
      },
      {
        blockType: "chat",
        title: "Asistente de inversión",
        agentId: "core-investor",
        greeting: "Hola inversionista. Pregúntame sobre tu portafolio, distribuciones o proyectos.",
        suggestedPrompts: [
          { prompt: "¿Cuál es mi IRR estimada?" },
          { prompt: "Lista mis inversiones activas" },
        ],
      },
    ],
  },
  {
    title: "Mis proyectos",
    slug: "investor-projects",
    allowedRoles: ["investor", "admin"],
    layout: [
      { blockType: "table", title: "Proyectos vinculados", dataset: "list:projects", columns: [
        { key: "name", label: "Proyecto" },
        { key: "projectStatus", label: "Estado", format: "status" },
        { key: "location", label: "Ubicación" },
      ]},
    ],
  },
  {
    title: "Distribuciones",
    slug: "investor-distributions",
    allowedRoles: ["investor", "admin"],
    layout: [
      { blockType: "table", title: "Histórico", dataset: "list:distributions", columns: [
        { key: "distributionDate", label: "Fecha", format: "date" },
        { key: "amount", label: "Monto", format: "usd" },
        { key: "type", label: "Tipo" },
      ]},
    ],
  },
  {
    title: "Documentos",
    slug: "investor-documents",
    allowedRoles: ["investor", "admin"],
    layout: [
      { blockType: "table", title: "Mis documentos", dataset: "list:documents", columns: [
        { key: "name", label: "Documento" },
        { key: "docType", label: "Tipo" },
        { key: "createdAt", label: "Fecha", format: "date" },
      ]},
    ],
  },

  // ────────────────────────── Customer ──────────────────────────
  {
    title: "Tu apartamento",
    slug: "customer-overview",
    allowedRoles: ["customer", "admin"],
    layout: [
      {
        blockType: "hero",
        title: "Bienvenido a tu portal",
        subtitle: "Aquí encontrarás toda la información de tu unidad, pagos y avance de obra.",
        background: "hero",
      },
      {
        blockType: "kpi-grid",
        cards: [
          { label: "Próximo pago", dataset: "next:payments.amount", format: "usd", icon: "CreditCard" },
          { label: "Pagos totales", dataset: "count:payments", format: "number" },
        ],
      },
      {
        blockType: "table",
        title: "Plan de pagos",
        dataset: "list:payments",
        columns: [
          { key: "dueDate", label: "Vencimiento", format: "date" },
          { key: "amount", label: "Monto", format: "usd" },
          { key: "projectStatus", label: "Estado", format: "status" },
        ],
        pageSize: 10,
      },
      {
        blockType: "chat",
        title: "Asistente de cliente",
        agentId: "core-customer",
        greeting: "Hola, ¿en qué te ayudo?",
      },
    ],
  },
  {
    title: "Mi unidad",
    slug: "customer-unit",
    allowedRoles: ["customer", "admin"],
    layout: [
      { blockType: "table", title: "Unidades disponibles", dataset: "list:units", columns: [
        { key: "unitNumber", label: "Unidad" },
        { key: "floor", label: "Piso" },
        { key: "sqft", label: "m²" },
        { key: "bedrooms", label: "Habitaciones" },
        { key: "priceTotal", label: "Precio", format: "usd" },
        { key: "projectStatus", label: "Estado", format: "status" },
      ]},
    ],
  },
  {
    title: "Avance de obra",
    slug: "customer-progress",
    allowedRoles: ["customer", "admin"],
    layout: [
      { blockType: "chart", title: "Avance por fase", dataset: "monthly:project-phases.completionPercentage", kind: "bar" },
    ],
  },
  {
    title: "Plan de pagos",
    slug: "customer-payments",
    allowedRoles: ["customer", "admin"],
    layout: [
      { blockType: "table", title: "Cuotas", dataset: "list:payments", columns: [
        { key: "dueDate", label: "Vencimiento", format: "date" },
        { key: "amount", label: "Monto", format: "usd" },
        { key: "projectStatus", label: "Estado", format: "status" },
      ]},
    ],
  },
  {
    title: "Documentos",
    slug: "customer-documents",
    allowedRoles: ["customer", "admin"],
    layout: [
      { blockType: "table", title: "Mis documentos", dataset: "list:documents", columns: [
        { key: "name", label: "Documento" },
        { key: "docType", label: "Tipo" },
        { key: "createdAt", label: "Fecha", format: "date" },
      ]},
    ],
  },

  // ────────────────────────── Shared ──────────────────────────
  {
    title: "Mi perfil",
    slug: "profile",
    allowedRoles: ["admin", "investor", "customer", "member"],
    layout: [
      { blockType: "markdown", title: "Información personal", body: {} },
    ],
  },
  {
    title: "Notificaciones",
    slug: "notifications",
    allowedRoles: ["admin", "investor", "customer", "member"],
    layout: [
      { blockType: "table", title: "Mensajes", dataset: "list:notifications", columns: [
        { key: "title", label: "Título" },
        { key: "body", label: "Detalle" },
        { key: "createdAt", label: "Fecha", format: "date" },
      ]},
    ],
  },
];
