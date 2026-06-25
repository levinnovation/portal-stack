import assert from "node:assert/strict";
import type { TenantNavItem } from "@/lib/tenant-types";
import { resolveActiveNavPath } from "./nav-active";

const adminNav: TenantNavItem[] = [
  { to: "/portal/admin", label: "Resumen", icon: "LayoutDashboard", end: true },
  { to: "/portal/admin/agents", label: "Agentes · Resumen", icon: "MessageCircle", kind: "custom" },
  { to: "/portal/admin/agents/leah", label: "Leah · Mercadeo", icon: "BarChart3", kind: "custom" },
  { to: "/portal/admin/projects", label: "Proyectos", icon: "Building2" },
];

assert.equal(resolveActiveNavPath("/portal/admin/agents/leah", adminNav), "/portal/admin/agents/leah");
assert.equal(resolveActiveNavPath("/portal/admin/agents", adminNav), "/portal/admin/agents");
assert.equal(resolveActiveNavPath("/portal/admin", adminNav), "/portal/admin");
assert.equal(resolveActiveNavPath("/portal/admin/projects", adminNav), "/portal/admin/projects");

console.log("[nav-active.self-check] OK");
