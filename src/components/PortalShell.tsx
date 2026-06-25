"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, ShoppingBag, Upload, RefreshCw, BarChart3, ShieldCheck,
  TrendingUp, Hammer, FileText, CreditCard, User as UserIcon, LogOut, Menu, X, Bell,
  Briefcase, ChevronRight, FileSpreadsheet, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TenantConfig, TenantNavItem, TenantRole } from "@/lib/tenant";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

export interface PortalShellProps {
  user: { id: string; email: string; name: string; role: string };
  tenant: TenantConfig;
  role: TenantRole;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  unreadCount?: number;
  navOverride?: TenantNavItem[];
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Building2, Users, ShoppingBag, Upload, RefreshCw, BarChart3, ShieldCheck,
  TrendingUp, Hammer, FileText, CreditCard, User: UserIcon, Briefcase, MessageCircle,
  FileSpreadsheet,
};

function navItemVisible(item: TenantNavItem, tenant: TenantConfig, userRole: string): boolean {
  if (item.roles?.length && !item.roles.includes(userRole)) return false;
  // ponytail: URL heuristics until nav items carry explicit feature keys
  if (item.to.includes("/excel") && !tenant.features.excel) return false;
  if (item.to.includes("/quickbase") && !tenant.features.quickbase) return false;
  return true;
}

function resolveNav(role: TenantRole, tenant: TenantConfig, userRole: string): TenantNavItem[] {
  const items = role.nav.length ? role.nav : tenant.roles.filter((r) => r.key === role.key).flatMap((r) => r.nav);
  return items.filter((item) => navItemVisible(item, tenant, userRole));
}

export function PortalShell({ user, tenant, role, title, action, children, unreadCount = 0, navOverride }: PortalShellProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const nav = navOverride?.length ? navOverride : resolveNav(role, tenant, user.role);

  const isActive = (to: string, end?: boolean) =>
    end ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/portal/auth");
    router.refresh();
  }

  const sidebar = (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border h-full shrink-0">
      <div className="px-6 py-7 border-b border-sidebar-border flex items-center justify-between">
        <div>
          <Link href="/" className="font-display text-2xl text-accent tracking-tight">{tenant.theme.brand}</Link>
          <div className="text-xs uppercase tracking-[0.2em] text-sidebar-foreground/60 mt-1">{role.label}</div>
        </div>
        <button className="md:hidden text-sidebar-foreground/70 p-1" onClick={() => setOpen(false)} aria-label="Cerrar menú">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const Icon = ICON_MAP[item.icon] || LayoutDashboard;
          const active = isActive(item.to, item.end);
          return (
            <Link
              key={item.to}
              href={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-accent font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {(user.role === "admin" || user.role === "superadmin") && (
        <div className="px-3 py-3 border-t border-sidebar-border space-y-1">
          {/* ponytail: UI-only portal switch; route guards in renderPage + ACL enforce data access */}
          <div className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/50 px-3 mb-1">Cambiar portal</div>
          {tenant.roles
            .filter((r) => r.key !== role.key)
            .map((r) => (
              <Link
                key={r.key}
                href={r.homePath}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-sidebar-foreground/80 hover:bg-sidebar-accent"
              >
                {r.label} <ChevronRight className="h-3 w-3 ml-auto" />
              </Link>
            ))}
        </div>
      )}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        <Link href="/portal/profile" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground">
          <UserIcon className="h-4 w-4" /> Mi perfil
        </Link>
        <div className="text-xs text-sidebar-foreground/60 truncate px-3 pt-2">{user.email}</div>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent">
          <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex bg-subtle">
      <div className="hidden md:flex">{sidebar}</div>
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative z-10">{sidebar}</div>
        </div>
      )}
      <main className="flex-1 min-w-0 overflow-auto">
        <header className="px-5 md:px-10 py-5 md:py-7 border-b border-border bg-card flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button className="md:hidden p-1.5 -ml-1 rounded-md hover:bg-subtle" onClick={() => setOpen(true)} aria-label="Abrir menú">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-display text-xl md:text-3xl text-foreground truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <Link href="/portal/notifications" className="relative p-2 rounded-md hover:bg-subtle">
              <Bell className="h-5 w-5 text-sidebar-foreground/80" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-[10px] font-semibold text-accent-foreground flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <LocaleSwitcher />
            {action}
          </div>
        </header>
        <div className="p-4 md:p-10">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h2 className="font-display text-3xl mb-1">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function KpiCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 shadow-card min-w-0">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 truncate">{label}</div>
      <div className="font-display text-2xl xl:text-3xl text-foreground truncate" title={typeof value === "string" ? value : undefined}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1 truncate">{sub}</div>}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-10 shadow-card text-center">
      <h3 className="font-display text-xl mb-2">{title}</h3>
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    planning: "Planeación", pre_construction: "Pre-construcción", construction: "Construcción", completed: "Entregado",
    available: "Disponible", reserved: "Reservada", sold: "Vendida",
    active: "Activo", closed: "Cerrado", cancelled: "Cancelado",
    pending: "Pendiente", paid: "Pagado", overdue: "Vencido",
    approved: "Aprobado", in_review: "En revisión", rejected: "Rechazado",
    accredited: "Acreditado", not_accredited: "No acreditado",
  };
  return <Badge variant="secondary">{labels[status] ?? status}</Badge>;
}
