// Paleta de gráficos de marca (los 5 primeros coinciden con --chart-1..5 de globals.css).
// Ampliada a 16 tonos bien separados para que donuts/barras con muchas categorías
// (ej. atribución por canal) no repitan color.
export const CHART_COLORS = [
  "#5b8cff", // azul
  "#2dd4bf", // teal
  "#a78bfa", // violeta
  "#fbbf24", // ámbar
  "#fb7185", // rosa
  "#34d399", // verde
  "#f97316", // naranja
  "#60a5fa", // azul claro
  "#e879f9", // fucsia
  "#22d3ee", // cian
  "#a3e635", // lima
  "#f43f5e", // rojo-rosa
  "#c084fc", // lila
  "#facc15", // amarillo
  "#14b8a6", // verde azulado
  "#fda4af", // rosa pálido
];

export function colorAt(i: number): string {
  return CHART_COLORS[i % CHART_COLORS.length];
}

// Estilo común del tooltip de Recharts (tema oscuro de marca).
export const TOOLTIP_STYLE = {
  contentStyle: {
    background: "#0e1422",
    border: "1px solid #1c2438",
    borderRadius: 12,
    fontSize: 12,
    color: "#e7eaf3",
    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
  },
  labelStyle: { color: "#8b94ac", marginBottom: 4 },
  itemStyle: { color: "#e7eaf3" },
} as const;
