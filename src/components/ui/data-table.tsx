"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronDown, ChevronRight, ChevronUp, Search, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { money, num, pct } from "@tenants/core/lib/format";

// ── Types ────────────────────────────────────────────────────────────────────

export type ColumnDef<T> = {
  key: keyof T | string;
  header: string;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  format?: "num" | "money" | "pct" | "date" | "raw";
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
};

export type DataTableProps<T extends Record<string, unknown>> = {
  columns: ColumnDef<T>[];
  data: T[];
  defaultSort?: keyof T | string;
  defaultSortAsc?: boolean;
  searchKeys?: (keyof T | string)[];
  searchPlaceholder?: string;
  csvFilename?: string;
  pageSize?: number;
  className?: string;
  rowKey?: (row: T) => string;
  groupBy?: keyof T | string;
  renderGroupHeader?: (groupValue: string, rows: T[]) => React.ReactNode;
  emptyMessage?: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getVal<T extends Record<string, unknown>>(row: T, key: string): unknown {
  return row[key as keyof T];
}

function formatCell(value: unknown, format?: ColumnDef<unknown>["format"]): string {
  if (value == null || value === "") return "—";
  switch (format) {
    case "num": return num(Number(value));
    case "money": return money(Number(value));
    case "pct": return pct(Number(value));
    case "date": return new Date(String(value)).toLocaleDateString("es-MX", { dateStyle: "short" });
    default: return String(value);
  }
}

function exportCsv<T extends Record<string, unknown>>(
  columns: ColumnDef<T>[],
  data: T[],
  filename: string,
) {
  const headers = columns.map((c) => `"${c.header}"`).join(",");
  const rows = data.map((row) =>
    columns.map((c) => {
      const v = getVal(row, String(c.key));
      const cell = formatCell(v, c.format);
      return `"${cell.replace(/"/g, '""')}"`;
    }).join(",")
  );
  const csv = [headers, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function SortIcon({ active, asc }: { active: boolean; asc: boolean }) {
  if (!active) return <span className="ml-0.5 inline-block w-3 opacity-30"><ChevronDown className="h-3 w-3" /></span>;
  return asc
    ? <ChevronUp className="ml-0.5 inline-block h-3 w-3 text-primary" />
    : <ChevronDown className="ml-0.5 inline-block h-3 w-3 text-primary" />;
}

// ── Main component ────────────────────────────────────────────────────────────

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  defaultSort,
  defaultSortAsc = false,
  searchKeys,
  searchPlaceholder = "Buscar…",
  csvFilename,
  pageSize,
  className,
  rowKey,
  groupBy,
  renderGroupHeader,
  emptyMessage = "Sin datos para este período.",
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | undefined>(defaultSort ? String(defaultSort) : undefined);
  const [sortAsc, setSortAsc] = useState(defaultSortAsc);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const handleSort = useCallback((key: string) => {
    setSortKey((prev) => {
      if (prev === key) { setSortAsc((a) => !a); return prev; }
      setSortAsc(false);
      return key;
    });
  }, []);

  const filtered = useMemo(() => {
    if (!search || !searchKeys?.length) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((k) => {
        const v = getVal(row, String(k));
        return v != null && String(v).toLowerCase().includes(q);
      })
    );
  }, [data, search, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = getVal(a, sortKey) ?? 0;
      const bv = getVal(b, sortKey) ?? 0;
      if (typeof av === "string" && typeof bv === "string") {
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortAsc ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
  }, [filtered, sortKey, sortAsc]);

  const paged = useMemo(() => {
    if (!pageSize) return sorted;
    return sorted.slice(page * pageSize, (page + 1) * pageSize);
  }, [sorted, pageSize, page]);

  const totalPages = pageSize ? Math.ceil(sorted.length / pageSize) : 1;

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group); else next.add(group);
      return next;
    });
  };

  const groups = useMemo(() => {
    if (!groupBy) return null;
    const map = new Map<string, T[]>();
    for (const row of paged) {
      const key = String(getVal(row, String(groupBy)) ?? "—");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    return map;
  }, [paged, groupBy]);

  const alignClass = (align?: ColumnDef<T>["align"]) =>
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  const renderRows = (rows: T[]) =>
    rows.map((row, i) => {
      const key = rowKey ? rowKey(row) : String(i);
      return (
        <TableRow key={key} className="text-xs">
          {columns.map((col) => {
            const raw = getVal(row, String(col.key));
            return (
              <TableCell
                key={String(col.key)}
                className={cn(alignClass(col.align), col.className)}
              >
                {col.render ? col.render(raw, row) : formatCell(raw, col.format)}
              </TableCell>
            );
          })}
        </TableRow>
      );
    });

  return (
    <div className={cn("space-y-2", className)}>
      {/* Toolbar */}
      {(searchKeys?.length || csvFilename) && (
        <div className="flex items-center gap-2">
          {searchKeys?.length && (
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder={searchPlaceholder}
                className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}
          {csvFilename && (
            <button
              type="button"
              onClick={() => exportCsv(columns, sorted, csvFilename)}
              className="ml-auto flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </button>
          )}
          <span className="text-xs text-muted-foreground">{sorted.length} filas</span>
        </div>
      )}

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              {groupBy && <TableHead className="w-6" />}
              {columns.map((col) => (
                <TableHead
                  key={String(col.key)}
                  className={cn(
                    alignClass(col.align),
                    col.sortable !== false && "cursor-pointer select-none hover:text-foreground",
                    col.className,
                  )}
                  onClick={col.sortable !== false ? () => handleSort(String(col.key)) : undefined}
                >
                  {col.header}
                  {col.sortable !== false && (
                    <SortIcon active={sortKey === String(col.key)} asc={sortAsc} />
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups ? (
              Array.from(groups.entries()).map(([groupValue, groupRows]) => {
                const collapsed = collapsedGroups.has(groupValue);
                return (
                  <>
                    {/* Group header row */}
                    <TableRow
                      key={`group-${groupValue}`}
                      className="bg-muted/40 cursor-pointer hover:bg-muted/60"
                      onClick={() => toggleGroup(groupValue)}
                    >
                      <TableCell className="py-1.5 pr-0 w-6">
                        {collapsed
                          ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        }
                      </TableCell>
                      <TableCell colSpan={columns.length} className="py-1.5 font-medium text-xs">
                        {renderGroupHeader
                          ? renderGroupHeader(groupValue, groupRows)
                          : <span>{groupValue} <span className="text-muted-foreground font-normal">({groupRows.length})</span></span>
                        }
                      </TableCell>
                    </TableRow>
                    {!collapsed && renderRows(groupRows)}
                  </>
                );
              })
            ) : (
              renderRows(paged)
            )}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      {pageSize && totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            Página {page + 1} de {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded border border-border px-2 py-0.5 text-xs disabled:opacity-40 hover:bg-accent"
            >
              ‹
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="rounded border border-border px-2 py-0.5 text-xs disabled:opacity-40 hover:bg-accent"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
