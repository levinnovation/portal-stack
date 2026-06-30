"use client";

import { useState, useCallback, useEffect } from "react";
import { AlertCircle, ChevronUp, ChevronDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { money, pct } from "@tenants/core/lib/format";
import { CommandControl } from "@tenants/core/components/inteligencia/command-control";
import type { LeadImpact, LeadTemp, Prescription } from "@tenants/core/sources/inteligencia";
import {
  TempBadge,
  TransitionArrow,
  DIRECTION_CONFIG,
  TYPE_TONE,
  PRIORITY_TONE,
  TEMP_CONFIG,
} from "@tenants/core/components/inteligencia/lead-cells";

// ── Sort state ────────────────────────────────────────────────────────────────
type SortKey = keyof Pick<LeadImpact, "name" | "score" | "tempScore" | "revenueAtRisk" | "transitionConfidence" | "daysSinceTouch">;

function sortLeads(leads: LeadImpact[], key: SortKey, asc: boolean): LeadImpact[] {
  return [...leads].sort((a, b) => {
    const av = a[key] ?? 0;
    const bv = b[key] ?? 0;
    if (typeof av === "string" && typeof bv === "string") {
      return asc ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    return asc ? Number(av) - Number(bv) : Number(bv) - Number(av);
  });
}

function SortIndicator({ active, asc }: { active: boolean; asc: boolean }) {
  if (!active) return null;
  return asc ? <ChevronUp className="h-3 w-3 inline ml-0.5" /> : <ChevronDown className="h-3 w-3 inline ml-0.5" />;
}

// ── Main dialog ───────────────────────────────────────────────────────────────
interface PrescriptionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescription: Prescription;
  runType: string;
}

export function PrescriptionDetailDialog({
  open,
  onOpenChange,
  prescription,
  runType,
}: PrescriptionDetailDialogProps) {
  const [leads, setLeads] = useState<LeadImpact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("revenueAtRisk");
  const [sortAsc, setSortAsc] = useState(false);
  const [tempFilter, setTempFilter] = useState<LeadTemp | "all">("all");

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ run_type: runType, prescription_id: prescription.id, limit: "200" });
      const res = await fetch(`/api/agents/inteligencia/leads?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { leads?: LeadImpact[] };
      setLeads(json.leads ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar leads");
    } finally {
      setLoading(false);
    }
  }, [prescription.id, runType]);

  // Load leads whenever the dialog is open. The parent opens it by flipping the
  // `open` prop directly (button onClick), which does NOT trigger Radix's
  // onOpenChange — so the fetch must key off `open`, otherwise the list is
  // always empty regardless of prescription/window.
  useEffect(() => {
    if (open) void loadLeads();
  }, [open, loadLeads]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((a) => !a);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const filtered = tempFilter === "all" ? leads : leads.filter((l) => l.currentTemp === tempFilter);
  const sorted = sortLeads(filtered, sortKey, sortAsc);

  const totalRar = leads.reduce((s, l) => s + (l.revenueAtRisk ?? 0), 0);
  const transitions = leads.reduce<Record<string, number>>((acc, l) => {
    const label = l.observedTransition ?? l.predictedTransition ?? "stable";
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-base font-semibold leading-tight">
                {prescription.title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs">
                {prescription.reason}
              </DialogDescription>
            </div>
            <div className="flex gap-2 shrink-0">
              <Badge className={cn("text-xs border", TYPE_TONE[prescription.type] ?? TYPE_TONE.adjust)}>
                {prescription.type.toUpperCase()}
              </Badge>
              <Badge className={cn("text-xs border", PRIORITY_TONE[prescription.priority])}>
                {prescription.priority.toUpperCase()}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Leads afectados</p>
            <p className="text-lg font-semibold">{prescription.impactedCount}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Revenue en riesgo</p>
            <p className="text-lg font-semibold text-rose-400">{money(totalRar || prescription.revenueAtRisk)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 col-span-2">
            <p className="text-xs text-muted-foreground mb-1.5">Resumen de transiciones</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(transitions).length > 0
                ? Object.entries(transitions)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 6)
                    .map(([label, count]) => (
                      <Badge key={label} className="text-xs bg-muted border border-border/50">
                        {label === "stable" ? "estable" : label} · {count}
                      </Badge>
                    ))
                : prescription.transitionSummary.map(({ label, count }) => (
                    <Badge key={label} className="text-xs bg-muted border border-border/50">
                      {label === "stable" ? "estable" : label} · {count}
                    </Badge>
                  ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground">Filtrar por temperatura:</span>
          {(["all", "hot", "warm", "cold"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTempFilter(t)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                tempFilter === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "all" ? "Todos" : TEMP_CONFIG[t].label}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">{sorted.length} leads</span>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto mt-1">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
              <span className="animate-spin inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              Cargando leads...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-sm gap-2 text-rose-400">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              No hay leads para esta prescripción en el período seleccionado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("name")}>
                    Lead <SortIndicator active={sortKey === "name"} asc={sortAsc} />
                  </TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("tempScore")}>
                    Temperatura <SortIndicator active={sortKey === "tempScore"} asc={sortAsc} />
                  </TableHead>
                  <TableHead>Transición</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("transitionConfidence")}>
                    Confianza <SortIndicator active={sortKey === "transitionConfidence"} asc={sortAsc} />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("daysSinceTouch")}>
                    Sin toque <SortIndicator active={sortKey === "daysSinceTouch"} asc={sortAsc} />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("revenueAtRisk")}>
                    Riesgo $ <SortIndicator active={sortKey === "revenueAtRisk"} asc={sortAsc} />
                  </TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((lead) => {
                  const dirCfg = DIRECTION_CONFIG[lead.direction] ?? DIRECTION_CONFIG.stable;
                  const DirIcon = dirCfg.icon;
                  const transition = lead.observedTransition ?? (lead.predictedTransition !== "stable" ? lead.predictedTransition : null);
                  const fromTemp = transition ? (transition.split("->")[0] as LeadTemp) : null;
                  const toTemp = transition ? (transition.split("->")[1] as LeadTemp ?? lead.currentTemp) : lead.currentTemp;

                  return (
                    <TableRow key={lead.id} className="text-xs">
                      <TableCell>
                        <div className="font-medium truncate max-w-[140px]" title={lead.name}>{lead.name}</div>
                        {lead.owner && (
                          <div className="text-muted-foreground truncate max-w-[140px]" title={lead.owner}>
                            {lead.owner}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="truncate max-w-[100px]" title={lead.source}>{lead.source}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <TempBadge temp={lead.currentTemp} />
                          <span className="text-muted-foreground text-[10px]">{lead.tempScore.toFixed(0)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {transition ? (
                          <TransitionArrow from={fromTemp} to={toTemp} />
                        ) : (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <DirIcon className={cn("h-3 w-3", dirCfg.classes)} />
                            <span className={dirCfg.classes}>{dirCfg.label}</span>
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.transitionConfidence > 0
                          ? <span className={lead.transitionConfidence >= 0.75 ? "text-rose-400" : lead.transitionConfidence >= 0.5 ? "text-amber-400" : "text-muted-foreground"}>
                              {pct(lead.transitionConfidence)}
                            </span>
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {lead.daysSinceTouch != null
                          ? <span className={lead.daysSinceTouch >= 7 ? "text-rose-400" : lead.daysSinceTouch >= 2 ? "text-amber-400" : "text-muted-foreground"}>
                              {lead.daysSinceTouch.toFixed(0)}d
                            </span>
                          : "—"}
                      </TableCell>
                      <TableCell className="font-medium text-rose-300">{money(lead.revenueAtRisk)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1" title={lead.nextBestAction}>
                          <CommandControl
                            label="Status↻"
                            target="hubspot"
                            op="updateContact"
                            payload={{
                              contactId: lead.hsContactId || lead.id,
                              properties: { hs_lead_status: "IN_PROGRESS" },
                            }}
                            className="px-1.5 py-0.5 text-[10px]"
                            variant="ghost"
                            description={`Marcar a ${lead.name} como IN_PROGRESS en HubSpot`}
                          />
                          <CommandControl
                            label="Conv"
                            target="meta"
                            op="sendConversion"
                            payload={{
                              contactId: lead.hsContactId || lead.id,
                              eventName: "Lead",
                              businessDay: new Date().toISOString().slice(0, 10),
                              userData: { em: lead.email || undefined, external_id: lead.hsContactId || lead.id },
                              customData: { value: lead.revenueAtRisk || 0, currency: "USD" },
                            }}
                            className="px-1.5 py-0.5 text-[10px]"
                            description={`Enviar conversión offline (Lead) para ${lead.name}`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
