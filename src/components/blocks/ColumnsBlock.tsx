"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TableBlock } from "@/components/blocks/TableBlock";

export interface ColumnsBlockProps {
  title?: string;
  ratio?: "1-1" | "2-1" | "1-2";
  leftDataset?: string;
  rightDataset?: string;
  leftTitle?: string;
  rightTitle?: string;
}

const GRID: Record<string, string> = {
  "1-1": "grid-cols-1 md:grid-cols-2",
  "2-1": "grid-cols-1 md:grid-cols-3",
  "1-2": "grid-cols-1 md:grid-cols-3",
};

export function ColumnsBlock(props: ColumnsBlockProps & { data?: Record<string, unknown> }) {
  const { title, ratio = "1-1", leftDataset, rightDataset, leftTitle, rightTitle, data = {} } = props;
  const leftSpan = ratio === "2-1" ? "md:col-span-2" : "md:col-span-1";
  const rightSpan = ratio === "1-2" ? "md:col-span-2" : "md:col-span-1";

  return (
    <div className="space-y-3">
      {title && <h3 className="font-display text-xl">{title}</h3>}
      <div className={`grid gap-4 ${GRID[ratio] || GRID["1-1"]}`}>
        <div className={leftSpan}>
          {leftDataset ? (
            <TableBlock title={leftTitle} dataset={leftDataset} data={data[leftDataset] as any} columns={[]} />
          ) : (
            <Card><CardContent className="p-4 text-sm text-muted-foreground">Columna izquierda</CardContent></Card>
          )}
        </div>
        <div className={rightSpan}>
          {rightDataset ? (
            <TableBlock title={rightTitle} dataset={rightDataset} data={data[rightDataset] as any} columns={[]} />
          ) : (
            <Card><CardContent className="p-4 text-sm text-muted-foreground">Columna derecha</CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}
