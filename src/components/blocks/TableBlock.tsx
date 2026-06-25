"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/portal/empty-state";
import { fmtUSD, fmtDate } from "@/lib/utils";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export interface TableColumn {
  key: string;
  label: string;
  format?: "text" | "number" | "usd" | "date" | "status";
}

export interface TableBlockProps {
  title?: string;
  dataset: string;
  columns: TableColumn[];
  pageSize?: number;
  emptyMessage?: string;
  data?: unknown;
}

const STATUS_LABELS: Record<string, string> = {
  planning: "Planeación", pre_construction: "Pre-construcción", construction: "Construcción", completed: "Entregado",
  available: "Disponible", reserved: "Reservada", sold: "Vendida",
  active: "Activo", closed: "Cerrado", cancelled: "Cancelado",
  pending: "Pendiente", paid: "Pagado", overdue: "Vencido",
  approved: "Aprobado", in_review: "En revisión", rejected: "Rechazado",
};

function statusVariant(status: string): "default" | "secondary" | "destructive" {
  if (["paid", "approved", "completed", "active"].includes(status)) return "default";
  if (["rejected", "cancelled", "overdue"].includes(status)) return "destructive";
  return "secondary";
}

function formatCell(format: TableColumn["format"], value: unknown): React.ReactNode {
  if (value == null) return "—";
  if (format === "usd") return fmtUSD(Number(value));
  if (format === "date") return fmtDate(String(value));
  if (format === "status") {
    const v = String(value);
    return <Badge variant={statusVariant(v)}>{STATUS_LABELS[v] ?? v}</Badge>;
  }
  if (format === "number" && typeof value === "number") {
    return new Intl.NumberFormat("es-CO").format(value);
  }
  return String(value);
}

export function TableBlock({ title, columns, pageSize = 10, emptyMessage = "Sin datos", data }: TableBlockProps) {
  const rows = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  const [filter, setFilter] = React.useState("");
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [page, setPage] = React.useState(0);

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase();
    let list = rows;
    if (q) {
      list = rows.filter((row) =>
        columns.some((c) => String(row[c.key] ?? "").toLowerCase().includes(q)),
      );
    }
    if (sortKey) {
      list = [...list].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        const cmp = String(av ?? "").localeCompare(String(bv ?? ""), "es", { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [rows, filter, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice(page * pageSize, page * pageSize + pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <Card>
      {title && (
        <div className="px-6 py-4 border-b border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-display text-xl">{title}</h3>
          {rows.length > 0 && (
            <Input
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(0); }}
              placeholder="Filtrar…"
              className="max-w-xs h-9"
            />
          )}
        </div>
      )}
      <CardContent className="p-0">
        {pageRows.length === 0 ? (
          <div className="p-6">
            <EmptyState message={rows.length === 0 ? emptyMessage : "Sin resultados para el filtro"} />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.key}>
                    <button type="button" onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 hover:text-foreground">
                      {c.label}
                      {sortKey === c.key ? (
                        sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((row, i) => (
                <TableRow key={i}>
                  {columns.map((c) => (
                    <TableCell key={c.key}>{formatCell(c.format, row[c.key])}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {filtered.length > pageSize && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-border text-xs text-muted-foreground">
            <span>
              {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} de {filtered.length}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
