"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, ShoppingBag, Upload, RefreshCw, BarChart3, ShieldCheck,
  TrendingUp, Hammer, FileText, CreditCard, User as UserIcon, LogOut, Menu, Bell,
  Briefcase, ChevronRight, FileSpreadsheet, MessageCircle, BrainCircuit, PieChart, Radar,
  SlidersHorizontal, Megaphone, ScanSearch, FlaskConical, ChartNoAxesCombined, Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { resolveActiveNavPath } from "@/lib/nav-active";
import type { TenantNavItem, TenantRole } from "@/lib/tenant";
import type { PortalShellTenant } from "@/lib/tenant-portal-shell";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { EmptyState as PortalEmptyState } from "@/components/portal/empty-state";
import { Card } from "@/components/ui/card";
import { BrandLogo } from "@/components/brand/BrandLogo";

export interface PortalShellProps {
  user: { id: string; email: string; name: string; role: string };
  tenant: PortalShellTenant;
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
  FileSpreadsheet, BrainCircuit, PieChart, Radar, SlidersHorizontal, Megaphone, ScanSearch,
  FlaskConical, ChartNoAxesCombined, Trophy,
};

function navItemVisible(item: TenantNavItem, tenant: PortalShellTenant, userRole: string): boolean {
  if (item.kind === "group") return true;
  if (item.roles?.length && !item.roles.includes(userRole)) return false;
  if (item.to.includes("/excel") && !tenant.features.excel) return false;
  if (item.to.includes("/quickbase") && !tenant.features.quickbase) return false;
  return true;
}

function resolveNav(role: TenantRole, tenant: PortalShellTenant, userRole: string): TenantNavItem[] {
  const items = role.nav.length ? role.nav : tenant.roles.filter((r) => r.key === role.key).flatMap((r) => r.nav);
  return items.filter((item) => navItemVisible(item, tenant, userRole));
}

function SidebarNav({
  nav,
  activePath,
  onNavigate,
}: {
  nav: TenantNavItem[];
  activePath: string | null;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
      {nav.map((item, i) => {
        if (item.kind === "group") {
          return (
            <div key={`group-${item.label}-${i}`} className="pt-3 first:pt-0">
              {i > 0 && <Separator className="mb-3 bg-sidebar-border" />}
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/50">
                {item.label}
              </div>
            </div>
          );
        }
        const Icon = ICON_MAP[item.icon] || LayoutDashboard;
        const active = activePath === item.to;
        return (
          <Link
            key={item.to}
            href={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-accent font-medium"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({
  user,
  tenant,
  role,
  nav,
  activePath,
  onNavigate,
}: {
  user: PortalShellProps["user"];
  tenant: PortalShellTenant;
  role: TenantRole;
  nav: TenantNavItem[];
  activePath: string | null;
  onNavigate?: () => void;
}) {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/portal/auth");
    router.refresh();
  }

  return (
    <>
      <div className="px-6 py-7 border-b border-sidebar-border">
        <Link href="/" className="text-sidebar-foreground">
          <BrandLogo tenantId={tenant.id} brand={tenant.theme.brand} />
        </Link>
        <div className="text-xs uppercase tracking-[0.2em] text-sidebar-foreground/60 mt-1">{role.label}</div>
      </div>
      <SidebarNav nav={nav} activePath={activePath} onNavigate={onNavigate} />
      {(user.role === "admin" || user.role === "superadmin") && (
        <div className="px-3 py-3 border-t border-sidebar-border space-y-1">
          <div className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/50 px-3 mb-1">Cambiar portal</div>
          {tenant.roles
            .filter((r) => r.key !== role.key)
            .map((r) => (
              <Button key={r.key} variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent" asChild>
                <Link href={r.homePath} onClick={onNavigate}>
                  {r.label} <ChevronRight className="h-3 w-3 ml-auto" />
                </Link>
              </Button>
            ))}
        </div>
      )}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent" asChild>
          <Link href="/portal/profile" onClick={onNavigate}>
            <UserIcon className="h-4 w-4 mr-2" /> Mi perfil
          </Link>
        </Button>
        <div className="text-xs text-sidebar-foreground/60 truncate px-3 pt-2">{user.email}</div>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent">
          <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
        </Button>
      </div>
    </>
  );
}

export function PortalShell({ user, tenant, role, title, action, children, unreadCount = 0, navOverride }: PortalShellProps) {
  const pathname = usePathname();
  const nav = navOverride?.length ? navOverride : resolveNav(role, tenant, user.role);
  const activePath = resolveActiveNavPath(pathname, nav);

  return (
    <div className="min-h-screen flex bg-subtle">
      <aside className="hidden md:flex w-64 bg-sidebar text-sidebar-foreground flex-col border-r border-sidebar-border h-screen sticky top-0 shrink-0">
        <SidebarBody user={user} tenant={tenant} role={role} nav={nav} activePath={activePath} />
      </aside>

      <Sheet>
        <main className="flex-1 min-w-0 overflow-auto">
          <header className="px-5 md:px-10 py-5 md:py-7 border-b border-border bg-card flex items-center justify-between gap-3 sticky top-0 z-40">
            <div className="flex items-center gap-3 min-w-0">
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden shrink-0" aria-label="Abrir menú">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <h1 className="font-display text-xl md:text-3xl text-foreground truncate">{title}</h1>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/portal/notifications" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-[10px] font-semibold text-accent-foreground flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              </Button>
              <LocaleSwitcher />
              <ThemeToggle />
              {action}
            </div>
          </header>
          <div className="p-4 md:p-10">{children}</div>
        </main>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border">
          <SidebarBody user={user} tenant={tenant} role={role} nav={nav} activePath={activePath} />
        </SheetContent>
      </Sheet>
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

/** @deprecated Use `@/components/portal/kpi-card` */
export function KpiCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <Card className="p-5 shadow-card min-w-0">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 truncate">{label}</div>
      <div className="font-display text-2xl xl:text-3xl text-foreground truncate">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1 truncate">{sub}</div>}
    </Card>
  );
}

/** @deprecated Use `@/components/portal/empty-state` */
export function EmptyState({ title, description }: { title: string; description?: string }) {
  return <PortalEmptyState message={title} hint={description} />;
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
  const success = ["paid", "approved", "completed", "active", "accredited"];
  const warning = ["pending", "in_review", "reserved", "overdue"];
  const destructive = ["rejected", "cancelled", "not_accredited"];
  const variant = success.includes(status) ? "default" : warning.includes(status) ? "secondary" : destructive.includes(status) ? "destructive" : "secondary";
  return <Badge variant={variant as "default" | "secondary" | "destructive"}>{labels[status] ?? status}</Badge>;
}
