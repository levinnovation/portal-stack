"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Landmark } from "lucide-react";
import type { TrustAccount } from "@tenants/core/sources/cashflows";

const PAGE_SIZE = 60;

/**
 * Client-rendered "Cuentas fideicomiso" table with progressive/lazy rendering.
 * The full account list is already fetched server-side (one request — there's
 * no paginated accounts endpoint to page against), but rendering all ~800
 * rows into the DOM at once is what actually causes the jank/scroll lag on a
 * long table; this defers the append via an `IntersectionObserver` sentinel
 * inside the existing scroll container so only `PAGE_SIZE` rows mount at a
 * time as the user scrolls, same pattern as infinite-scroll feeds.
 */
export function AccountsTable({ accounts }: { accounts: TrustAccount[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLTableRowElement | null>(null);
  const visible = useMemo(() => accounts.slice(0, visibleCount), [accounts, visibleCount]);
  const hasMore = visibleCount < accounts.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [accounts]);

  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, accounts.length));
        }
      },
      { root: sentinel.closest("[data-scroll-container]"), rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, accounts.length]);

  return (
    <div className="max-h-[420px] overflow-y-auto overflow-x-auto" data-scroll-container>
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b border-border text-xs uppercase text-muted-foreground">
            <th className="py-2 pr-4">Fideicomiso / Cuenta</th>
            <th className="py-2 pr-4">Proyecto</th>
            <th className="py-2 pr-4">Banco</th>
            <th className="py-2 pr-4">Moneda</th>
            <th className="py-2 pr-4">Fuente</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((a, i) => (
            <tr key={`${a.accountNumber}-${i}`} className="border-b border-border/50 last:border-0">
              <td className="py-2 pr-4">
                <div className="flex items-center gap-1.5">
                  <Landmark className="h-3.5 w-3.5 text-muted-foreground/60" />
                  {a.trustName || a.accountNumber}
                </div>
              </td>
              <td className="py-2 pr-4 text-muted-foreground">{a.project || "—"}</td>
              <td className="py-2 pr-4 text-muted-foreground">{a.bank || "—"}</td>
              <td className="py-2 pr-4 text-muted-foreground">{a.currency || "—"}</td>
              <td className="py-2 pr-4 text-muted-foreground">{a.source}</td>
            </tr>
          ))}
          {hasMore && (
            <tr ref={sentinelRef}>
              <td colSpan={5} className="py-3 text-center text-xs text-muted-foreground/70">
                Cargando más cuentas… ({visible.length}/{accounts.length})
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
