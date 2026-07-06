"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

/**
 * Simple `?project=` filter shared by every Cashflows treasury tab — a plain
 * `<select>` that pushes the same pathname with the query param updated, so
 * server components re-fetch `getCashflowsReport({ project })` on navigation.
 */
export function ProjectFilter({ projects, current }: { projects: string[]; current?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("project", value);
    else params.delete("project");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground"
      value={current ?? ""}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Todos los proyectos</option>
      {projects.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  );
}
