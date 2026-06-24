"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fmtUSD, fmtDate } from "@/lib/utils";

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

function formatCell(format: TableColumn["format"], value: unknown): React.ReactNode {
  if (value == null) return "—";
  if (format === "usd") return fmtUSD(Number(value));
  if (format === "date") return fmtDate(String(value));
  if (format === "status") {
    const v = String(value);
    return <Badge variant="secondary">{STATUS_LABELS[v] ?? v}</Badge>;
  }
  if (format === "number" && typeof value === "number") {
    return new Intl.NumberFormat("es-CO").format(value);
  }
  return String(value);
}

export function TableBlock({ title, dataset, columns, pageSize = 10, emptyMessage = "Sin datos", data }: TableBlockProps) {
  const rows = Array.isArray(data) ? (data as any[]) : [];
  const shown = rows.slice(0, pageSize);
  return (
    <Card>
      {title && (
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-display text-xl">{title}</h3>
        </div>
      )}
      <CardContent className="p-0">
        {shown.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">{emptyMessage}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.key}>{c.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((row, i) => (
                <TableRow key={i}>
                  {columns.map((c) => (
                    <TableCell key={c.key}>{formatCell(c.format, row[c.key])}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {rows.length > pageSize && (
          <div className="px-6 py-3 text-xs text-muted-foreground border-t border-border">
            Mostrando {pageSize} de {rows.length}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
