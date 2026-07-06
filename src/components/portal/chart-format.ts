import { money, compactMoney, num, pct } from "@tenants/core/lib/format";

// Los charts son Client Components; las funciones no se pueden pasar como props desde
// Server Components (RSC no las serializa). Por eso las páginas pasan un TOKEN string
// y el chart lo resuelve aquí a la función real (lib/format es puro, client-safe).
export type FormatKind = "num" | "money" | "moneyCompact" | "pct";

export function resolveFormat(kind: FormatKind = "num"): (v: number) => string {
  switch (kind) {
    case "money":
      return (v) => money(v);
    case "moneyCompact":
      return (v) => compactMoney(v);
    case "pct":
      return (v) => pct(v);
    case "num":
    default:
      return (v) => num(v);
  }
}
